'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Download, CheckCircle2, FileText, Upload, RefreshCw } from 'lucide-react';

export default function ContractSigningPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [contract, setContract] = useState<any>(null);
    const [bank, setBank] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [signing, setSigning] = useState(false);
    const [signError, setSignError] = useState<string | null>(null);
    const [clientNote, setClientNote] = useState<string>('');
    const [uploadingScan, setUploadingScan] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const scanInputRef = useRef<HTMLInputElement>(null);
    const [contractId, setContractId] = useState<string | null>(null);

    useEffect(() => {
        const unwrap = async () => {
            const p = await params;
            setContractId(p.id);
        };
        unwrap();
    }, [params]);

    useEffect(() => {
        if (contractId) {
            fetchContract();
        }
    }, [contractId]);

    // Auto-refresh: pick up payment confirmation from PayU webhook without manual reload
    useEffect(() => {
        if (!contractId) return;
        const iv = setInterval(() => {
            if (document.visibilityState === 'visible') fetchContract();
        }, 15000);
        return () => clearInterval(iv);
    }, [contractId]);

    const fetchContract = async () => {
        try {
            const token = localStorage.getItem('client_token') || localStorage.getItem('user_token') || localStorage.getItem('admin_token');
            if (!token) {
                router.push('/logowanie');
                return;
            }

            const res = await fetch(`/api/client/portal/contracts/${contractId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setContract(data.contract);
                setBank(data.bank || null);
                // Load existing note if any
                if (data.contract?.client_note) {
                    setClientNote(data.contract.client_note);
                }
            } else if (res.status === 401) {
                router.push('/logowanie');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSign = async () => {
        const token = localStorage.getItem('client_token') || localStorage.getItem('user_token');
        setSigning(true);
        setSignError(null);
        try {
            const res = await fetch(`/api/client/portal/contracts/${contractId}/sign`, {
                method: 'POST',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_note: clientNote.trim()
                })
            });

            if (res.ok) {
                await fetchContract(); // Reload to show signed status
            } else {
                const data = await res.json();
                setSignError(data.error || 'Błąd podczas podpisywania umowy');
            }
        } catch (error) {
            console.error(error);
            setSignError('Błąd połączenia. Spróbuj ponownie.');
        } finally {
            setSigning(false);
        }
    };

    const handleUploadSigned = async (file: File) => {
        const token = localStorage.getItem('client_token') || localStorage.getItem('user_token');
        setUploadingScan(true);
        setSignError(null);
        try {
            const formData = new FormData();
            formData.append('pdf', file);
            const res = await fetch(`/api/client/portal/contracts/${contractId}/upload-signed`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (res.ok) {
                setUploadSuccess(true);
                await fetchContract();
            } else {
                const data = await res.json();
                setSignError(data.error || 'Błąd wgrywania pliku');
            }
        } catch (error) {
            setSignError('Błąd połączenia. Spróbuj ponownie.');
        } finally {
            setUploadingScan(false);
        }
    };


    if (loading) return <div className="min-h-screen flex items-center justify-center">Ładowanie...</div>;
    if (!contract) return <div className="min-h-screen flex items-center justify-center">Nie znaleziono umowy.</div>;

    const token = localStorage.getItem('client_token') || localStorage.getItem('user_token');
    const unsignedPdfUrl = contract.pdf_url || `/api/contracts/${contract.id}/pdf?token=${token}`;
    const signedPdfUrl = contract.pdf_url?.replace(/\.pdf$/, '_podpisana.pdf') || `${unsignedPdfUrl.replace(/\.pdf/, '_podpisana.pdf')}`;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto mb-6">
                <Link href="/konto">
                    <button className="text-gray-600 hover:text-black flex items-center gap-2 text-sm font-medium transition-colors">
                        <span>←</span> Wróć do pulpitu
                    </button>
                </Link>
            </div>
            <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden">
                <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Umowa</h1>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${contract.status === 'signed' ? 'bg-green-500' : 'bg-yellow-500 text-black'
                        }`}>
                        {contract.status === 'signed' ? 'PODPISANA' : 'OCZEKUJE NA PODPIS'}
                    </span>
                </div>

                {/* Download unsigned contract button */}
                {contract.pdf_url && (
                    <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <p className="text-sm text-blue-800 font-medium">Pobierz umowę do przeczytania</p>
                        </div>
                        <a
                            href={unsignedPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Pobierz PDF
                        </a>
                    </div>
                )}

                {/* Panel zaliczki */}
                {contract.deposit_amount > 0 && (
                    <ClientDepositPanel contract={contract} bank={bank} />
                )}

                {/* Sticky sign action — na samej górze, żeby klient nie musiał scrollować */}
                {contract.status !== 'signed' && (
                    <div className="bg-amber-50 border-b-2 border-amber-300 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-amber-700 text-lg">✍️</span>
                            <p className="text-sm text-amber-900 font-semibold">Umowa oczekuje na Twój podpis</p>
                        </div>
                        <button
                            onClick={handleSign}
                            disabled={signing}
                            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold rounded-lg text-sm transition-colors shadow"
                        >
                            {signing ? 'Przetwarzanie...' : '✓ PODPISZ UMOWĘ'}
                        </button>
                    </div>
                )}

                <div className="p-8">
                    <div className="prose max-w-none mb-8 font-serif whitespace-pre-wrap text-black">
                        {contract.content}
                    </div>

                    {contract.status !== 'signed' && (
                        <div className="border-t pt-8">
                            <h3 className="text-lg font-bold mb-4 text-black">Notatka dla fotografa (opcjonalnie)</h3>
                            <textarea
                                value={clientNote}
                                onChange={(e) => setClientNote(e.target.value)}
                                placeholder="Np. uwagi dotyczące sesji, preferencje, ograniczenia..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-black placeholder-gray-500 mb-6 font-sans text-sm"
                                rows={4}
                            />
                            <p className="text-xs text-gray-500 mb-6">Twoja notatka będzie widoczna dla fotografa po podpisaniu umowy. Pamiętaj, aby zapisać notatkę PRZED kliknięciem &quot;Podpisz umowę&quot; na górze strony.</p>

                            <div className="pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-bold mb-3 text-black">Lub wgraj podpisany dokument</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Wydrukuj umowę, podpisz odręcznie, zeskanuj lub zrób zdjęcie i wgraj poniżej (PDF, JPEG lub PNG, max 20MB).
                                </p>
                                <input
                                    type="file"
                                    ref={scanInputRef}
                                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleUploadSigned(file);
                                        e.target.value = '';
                                    }}
                                />
                                <button
                                    onClick={() => scanInputRef.current?.click()}
                                    disabled={uploadingScan}
                                    className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
                                >
                                    {uploadingScan
                                        ? <><RefreshCw className="w-5 h-5 animate-spin" /> Wgrywam...</>
                                        : <><Upload className="w-5 h-5" /> WGRAJ PODPISANY SKAN</>}
                                </button>
                                {uploadSuccess && (
                                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        <p className="text-green-800 text-sm font-medium">Dokument wgrany pomyślnie! Fotograf został powiadomiony.</p>
                                    </div>
                                )}
                            </div>
                            {signError && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                    <span className="text-red-500">⚠️</span>
                                    <p className="text-red-700 text-sm font-medium">{signError}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {contract.status === 'signed' && (
                        <div>
                            <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-center gap-3 mb-6">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                                <div>
                                    <p className="font-bold text-green-800">Umowa została podpisana.</p>
                                    <p className="text-sm text-green-700">Dziękujemy za zaufanie!</p>
                                </div>
                            </div>

                            {/* Download signed contract button */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                                <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Pobierz umowę
                                </h3>
                                <div className="space-y-2">
                                    {contract.pdf_url && (
                                        <a
                                            href={contract.pdf_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            Pobierz umowę (oryginał)
                                        </a>
                                    )}
                                    {contract.signed_pdf_url && (
                                        <a
                                            href={contract.signed_pdf_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            Pobierz podpisaną umowę (skan)
                                        </a>
                                    )}
                                    {!contract.pdf_url && !contract.signed_pdf_url && signedPdfUrl && (
                                        <a
                                            href={signedPdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            Pobierz PDF (Podpisane)
                                        </a>
                                    )}
                                </div>
                            </div>

                            {contract.client_note && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                    <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-2">Twoja notatka:</p>
                                    <p className="text-blue-900 whitespace-pre-wrap text-sm">{contract.client_note}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {contract.offer_id && (
                        <div className="mt-12 bg-gray-100 p-6 rounded-xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-800">Podgląd Oferty</h3>
                                <a
                                    href={`/api/offers/${contract.offer_id}/pdf?token=${localStorage.getItem('client_token') || localStorage.getItem('user_token')}`}
                                    target="_blank"
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                >
                                    Pobierz PDF
                                </a>
                            </div>
                            <div className="aspect-[210/297] w-full bg-white shadow-lg overflow-hidden rounded-lg">
                                <iframe
                                    src={`/api/offers/${contract.offer_id}/pdf?token=${localStorage.getItem('client_token') || localStorage.getItem('user_token')}#toolbar=0&navpanes=0`}
                                    className="w-full h-full border-0"
                                    title="Podgląd Oferty"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ClientDepositPanel({ contract, bank }: { contract: any; bank: any }) {
    const [copied, setCopied] = useState<string | null>(null);
    const [payingType, setPayingType] = useState<string | null>(null);
    const isPaid = !!contract.deposit_paid_at;
    const due = contract.deposit_due_at ? new Date(contract.deposit_due_at) : null;
    const now = new Date();
    const overdue = !isPaid && due && due < now;
    const dueSoon = !isPaid && due && !overdue && (due.getTime() - now.getTime() < 7 * 86400000);
    const depositAmount = contract.deposit_amount || 0;
    const totalPrice = contract.offer?.total_price || 0;
    const remainingAmount = totalPrice > depositAmount ? totalPrice - depositAmount : 0;

    const copy = async (text: string, key: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(key);
            setTimeout(() => setCopied(null), 1800);
        } catch { /* noop */ }
    };

    const handlePayU = async (type: 'deposit' | 'remaining' | 'full') => {
        const amountPLN = type === 'deposit' ? depositAmount
            : type === 'remaining' ? remainingAmount
            : totalPrice || depositAmount;
        if (!amountPLN) return;

        const token = localStorage.getItem('client_token') || localStorage.getItem('user_token');
        setPayingType(type);
        try {
            const res = await fetch('/api/payu/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    contractId: contract.id,
                    paymentType: type,
                    amount: amountPLN * 100, // grosze
                    description: type === 'deposit'
                        ? `Zaliczka — ${contract.contract_number}`
                        : type === 'remaining'
                        ? `Dopłata — ${contract.contract_number}`
                        : `Pełna kwota — ${contract.contract_number}`,
                    email: contract.user?.email || contract.offer?.client_email || '',
                    redirectUrl: `${window.location.origin}/strefa-klienta/umowy/${contract.id}?payment=ok`,
                }),
            });
            const data = await res.json();
            if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
            } else {
                console.error('[PayU] Init failed:', data);
                alert(`Błąd inicjowania płatności: ${data.error || 'Nieznany błąd'}. Spróbuj ponownie lub skontaktuj się z fotografem.`);
            }
        } catch {
            alert('Błąd połączenia. Spróbuj ponownie.');
        } finally {
            setPayingType(null);
        }
    };

    const banner = isPaid
        ? { cls: 'bg-emerald-50 border-emerald-200', titleCls: 'text-emerald-900', title: '✓ Zaliczka opłacona — dziękujemy!', sub: contract.deposit_paid_at ? `Zaksięgowano ${new Date(contract.deposit_paid_at).toLocaleDateString('pl-PL')}` : '' }
        : overdue
            ? { cls: 'bg-rose-50 border-rose-300', titleCls: 'text-rose-900', title: '⚠ Termin zaliczki minął', sub: 'Prosimy o pilne uregulowanie wpłaty.' }
            : dueSoon
                ? { cls: 'bg-amber-50 border-amber-300', titleCls: 'text-amber-900', title: '! Termin zaliczki wkrótce', sub: due ? `Termin: ${due.toLocaleDateString('pl-PL')}` : '' }
                : { cls: 'bg-blue-50 border-blue-200', titleCls: 'text-blue-900', title: 'Zaliczka rezerwująca termin', sub: due ? `Termin: ${due.toLocaleDateString('pl-PL')}` : '' };

    return (
        <div className={`border-b ${banner.cls} px-6 py-5`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h3 className={`text-base font-bold ${banner.titleCls} flex items-center gap-2`}>💰 {banner.title}</h3>
                    {banner.sub && <p className="text-sm text-gray-700 mt-1">{banner.sub}</p>}
                </div>
                <div className="text-right">
                    <div className="text-[11px] uppercase tracking-widest text-gray-500 font-bold">Kwota zaliczki</div>
                    <div className={`text-2xl font-bold ${isPaid ? 'text-emerald-700' : overdue ? 'text-rose-700' : 'text-gray-900'}`}>
                        {depositAmount.toLocaleString('pl-PL')} PLN
                    </div>
                    {totalPrice > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                            Łącznie: {totalPrice.toLocaleString('pl-PL')} PLN
                        </div>
                    )}
                </div>
            </div>

            {/* PayU payment buttons */}
            <div className="mt-4 flex flex-wrap gap-3 items-center">
                {!isPaid && (
                    <button
                        onClick={() => handlePayU('deposit')}
                        disabled={!!payingType}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold text-sm transition-colors shadow"
                    >
                        {payingType === 'deposit' ? '⏳ Przekierowanie...' : `💳 Zapłać zaliczkę (${depositAmount.toLocaleString('pl-PL')} PLN)`}
                    </button>
                )}
                {isPaid && remainingAmount > 0 && (
                    <button
                        onClick={() => handlePayU('remaining')}
                        disabled={!!payingType}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold text-sm transition-colors shadow"
                    >
                        {payingType === 'remaining' ? '⏳ Przekierowanie...' : `💳 Zapłać pozostałą kwotę (${remainingAmount.toLocaleString('pl-PL')} PLN)`}
                    </button>
                )}
                {!isPaid && totalPrice > 0 && (
                    <button
                        onClick={() => handlePayU('full')}
                        disabled={!!payingType}
                        className="text-xs text-gray-600 hover:text-gray-900 underline underline-offset-2 disabled:text-gray-400"
                        title="Opłać całą kwotę jednorazowo zamiast zaliczki + dopłaty"
                    >
                        {payingType === 'full' ? 'Przekierowanie...' : `lub zapłać całość (${totalPrice.toLocaleString('pl-PL')} PLN)`}
                    </button>
                )}
            </div>

            {/* Pozostało do zapłaty po wpłacie zaliczki */}
            {isPaid && remainingAmount > 0 && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-blue-700 font-bold">Pozostało do zapłaty</div>
                        <div className="text-xs text-blue-900 mt-1">Płatne w dniu wydarzenia lub po wydaniu materiałów</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">{remainingAmount.toLocaleString('pl-PL')} PLN</div>
                </div>
            )}

            {!isPaid && bank?.bank_account_number && (
                <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-3">Lub przelew tradycyjny</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                            <div className="text-[10px] uppercase text-gray-500">Numer konta</div>
                            <div className="flex items-center gap-2">
                                <code className="font-mono text-gray-900 font-semibold">{bank.bank_account_number}</code>
                                <button onClick={() => copy(bank.bank_account_number, 'iban')}
                                    className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition">
                                    {copied === 'iban' ? '✓ skopiowano' : 'kopiuj'}
                                </button>
                            </div>
                        </div>
                        {bank.bank_account_holder && (
                            <div>
                                <div className="text-[10px] uppercase text-gray-500">Odbiorca</div>
                                <div className="text-gray-900">{bank.bank_account_holder}</div>
                            </div>
                        )}
                        {bank.bank_name && (
                            <div>
                                <div className="text-[10px] uppercase text-gray-500">Bank</div>
                                <div className="text-gray-900">{bank.bank_name}</div>
                            </div>
                        )}
                        <div>
                            <div className="text-[10px] uppercase text-gray-500">Tytuł przelewu</div>
                            <div className="flex items-center gap-2">
                                <code className="font-mono text-gray-900">Zaliczka {contract.contract_number}</code>
                                <button onClick={() => copy(`Zaliczka ${contract.contract_number}`, 'title')}
                                    className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition">
                                    {copied === 'title' ? '✓ skopiowano' : 'kopiuj'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
