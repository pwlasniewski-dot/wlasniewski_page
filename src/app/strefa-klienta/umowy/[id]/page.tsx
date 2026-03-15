'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Download, CheckCircle2, FileText, Upload, RefreshCw } from 'lucide-react';

export default function ContractSigningPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [contract, setContract] = useState<any>(null);
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
                            <p className="text-xs text-gray-500 mb-6">Twoja notatka będzie widoczna dla fotografa po podpisaniu umowy.</p>

                            <h3 className="text-lg font-bold mb-4 text-black">Podpis</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Klikając &quot;Podpisz umowę&quot;, potwierdzasz przeczytanie i akceptację powyższych warunków.
                            </p>
                            <button
                                onClick={handleSign}
                                disabled={signing}
                                className="w-full sm:w-auto px-8 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                            >
                                {signing ? 'Przetwarzanie...' : '✍️ PODPISZ UMOWĘ'}
                            </button>

                            <div className="mt-6 pt-6 border-t border-gray-200">
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
