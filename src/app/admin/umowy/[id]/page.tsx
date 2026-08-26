'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Download, Calendar, User as UserIcon, Mail, Phone, MapPin, Clock } from 'lucide-react';

type Contract = {
    id: number;
    contract_number: string | null;
    status: string;
    pdf_url: string | null;
    signed_pdf_url: string | null;
    signed_at: string | null;
    created_at: string;
    client_note: string | null;
    content: string | null;
    session_date: string | null;
    session_time: string | null;
    session_location: string | null;
    deposit_amount: number | null;
    deposit_due_at: string | null;
    deposit_paid_at: string | null;
    deposit_note: string | null;
    user: { id: number; name: string | null; email: string; phone: string | null } | null;
    offer: {
        id: number; title: string; total_price: number; offerNumber: string | null;
        session_date: string | null; session_time: string | null; session_location: string | null;
    } | null;
};

export default function AdminContractViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [contract, setContract] = useState<Contract | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [token, setToken] = useState<string>('');

    useEffect(() => {
        const t = typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : '';
        setToken(t);
        if (!t) {
            setError('Brak tokenu admina. Zaloguj się ponownie.');
            setLoading(false);
            return;
        }
        fetch(`/api/admin/contracts/${id}`, { headers: { Authorization: `Bearer ${t}` } })
            .then(async r => {
                if (!r.ok) {
                    const data = await r.json().catch(() => ({}));
                    throw new Error(data.error || `HTTP ${r.status}`);
                }
                return r.json();
            })
            .then(data => setContract(data.contract))
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Ładowanie...</div>;
    if (error) return (
        <div className="min-h-screen p-6 bg-gradient-to-b from-amber-50 via-white to-rose-50">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6 border border-rose-200">
                <h1 className="text-xl font-bold text-rose-700 mb-2">Błąd: {error}</h1>
                <Link href="/admin/clients" className="text-rose-600 underline">← Powrót do klientów</Link>
            </div>
        </div>
    );
    if (!contract) return <div className="min-h-screen flex items-center justify-center">Nie znaleziono umowy.</div>;

    const pdfUrl = `/api/contracts/${contract.id}/pdf`;
    const sessionDate = contract.session_date || contract.offer?.session_date;
    const sessionTime = contract.session_time || contract.offer?.session_time;
    const sessionLocation = contract.session_location || contract.offer?.session_location;

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-rose-50">
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between mb-4">
                    <Link href={contract.user ? `/admin/clients/${contract.user.id}?tab=contracts` : '/admin/clients'}
                        className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900">
                        <ArrowLeft className="w-4 h-4" /> Powrót
                    </Link>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${contract.status === 'signed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {contract.status}
                    </span>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-5 mb-4">
                    <div className="flex items-start gap-3">
                        <FileText className="w-7 h-7 text-rose-500 flex-shrink-0" />
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-zinc-900">{contract.contract_number || `Umowa #${contract.id}`}</h1>
                            <p className="text-sm text-zinc-500 mt-1">
                                Utworzona: {new Date(contract.created_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                                {contract.signed_at && ` · Podpisana: ${new Date(contract.signed_at).toLocaleDateString('pl-PL')}`}
                            </p>
                            {contract.offer && (
                                <p className="text-sm text-zinc-700 mt-2">
                                    Oferta: <Link href={`/admin/offers/${contract.offer.id}`} className="text-rose-600 underline">{contract.offer.title}</Link>
                                    {contract.offer.total_price > 0 && ` · ${contract.offer.total_price.toLocaleString('pl-PL')} PLN`}
                                </p>
                            )}
                            {!contract.offer && (
                                <p className="text-xs text-amber-700 mt-2 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-block">
                                    Umowa standalone (brak powiązanej oferty w systemie)
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {contract.user && (
                        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-5">
                            <h2 className="font-bold text-zinc-900 mb-3 flex items-center gap-2"><UserIcon className="w-4 h-4" /> Klient</h2>
                            <div className="space-y-1.5 text-sm">
                                <div className="font-semibold text-zinc-900">{contract.user.name || '(brak nazwy)'}</div>
                                <div className="flex items-center gap-2 text-zinc-700"><Mail className="w-3.5 h-3.5" /> {contract.user.email}</div>
                                {contract.user.phone && (
                                    <div className="flex items-center gap-2 text-zinc-700"><Phone className="w-3.5 h-3.5" /> {contract.user.phone}</div>
                                )}
                                <Link href={`/admin/clients/${contract.user.id}`} className="inline-block text-rose-600 underline text-xs mt-2">
                                    Karta klienta →
                                </Link>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-5">
                        <h2 className="font-bold text-zinc-900 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" /> Sesja</h2>
                        <SessionEditor
                            contractId={contract.id}
                            token={token}
                            initialDate={sessionDate}
                            initialTime={sessionTime}
                            initialLocation={sessionLocation}
                            onSaved={() => window.location.reload()}
                        />
                    </div>
                </div>

                {contract.client_note && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                        <h3 className="font-bold text-amber-900 mb-1 text-sm">Notatka klienta:</h3>
                        <p className="text-sm text-amber-800 whitespace-pre-wrap">{contract.client_note}</p>
                    </div>
                )}

                <DepositPanel contract={contract} token={token} onChanged={() => window.location.reload()} />

                <ContentEditor contract={contract} token={token} onSaved={() => window.location.reload()} />

                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-zinc-900">Dokument PDF</h2>
                        <div className="flex items-center gap-2">
                            <RegenerateButton contractId={contract.id} token={token} />
                            <a href={pdfUrl} target="_blank" rel="noopener" download
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-white text-sm font-semibold rounded-lg hover:bg-zinc-800">
                                <Download className="w-4 h-4" /> Pobierz
                            </a>
                        </div>
                    </div>
                    <iframe src={pdfUrl} className="w-full h-[80vh] border border-zinc-200 rounded-lg" title="Umowa PDF" />
                </div>
            </div>
        </div>
    );
}

function SetSessionDateForm({ contractId, token, onSaved }: { contractId: number; token: string; onSaved: () => void }) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    const [saving, setSaving] = useState(false);

    const save = async () => {
        if (!date) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/contracts/${contractId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ session_date: date, session_time: time || null, session_location: location || null }),
            });
            if (res.ok) onSaved();
            else alert('Błąd zapisu');
        } finally { setSaving(false); }
    };

    return (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="px-2 py-1.5 border border-amber-300 rounded text-sm" />
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="px-2 py-1.5 border border-amber-300 rounded text-sm" />
            <input type="text" placeholder="Lokalizacja" value={location} onChange={e => setLocation(e.target.value)}
                className="px-2 py-1.5 border border-amber-300 rounded text-sm" />
            <button disabled={saving || !date} onClick={save}
                className="sm:col-span-3 px-3 py-1.5 bg-amber-600 text-white text-sm font-semibold rounded disabled:opacity-50">
                {saving ? 'Zapisywanie...' : 'Zapisz datę sesji'}
            </button>
        </div>
    );
}

function SessionEditor({ contractId, token, initialDate, initialTime, initialLocation, onSaved }: {
    contractId: number; token: string;
    initialDate: string | null; initialTime: string | null; initialLocation: string | null;
    onSaved: () => void;
}) {
    const [editing, setEditing] = useState(false);
    const [date, setDate] = useState(initialDate ? initialDate.slice(0, 10) : '');
    const [time, setTime] = useState(initialTime || '');
    const [location, setLocation] = useState(initialLocation || '');
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/contracts/${contractId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    session_date: date || null,
                    session_time: time || null,
                    session_location: location || null,
                }),
            });
            if (res.ok) { setEditing(false); onSaved(); }
            else alert('Błąd zapisu');
        } finally { setSaving(false); }
    };

    if (!editing) {
        return (
            <div>
                {initialDate ? (
                    <div className="space-y-1.5 text-sm">
                        <div className="font-semibold text-zinc-900">
                            {new Date(initialDate).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        {initialTime && <div className="flex items-center gap-2 text-zinc-700"><Clock className="w-3.5 h-3.5" /> {initialTime}</div>}
                        {initialLocation && <div className="flex items-center gap-2 text-zinc-700"><MapPin className="w-3.5 h-3.5" /> {initialLocation}</div>}
                    </div>
                ) : (
                    <div className="text-sm text-zinc-500 mb-2">
                        Brak daty sesji. <span className="text-amber-700">Uzupełnij ją żeby umowa pojawiła się w kalendarzu.</span>
                    </div>
                )}
                <button onClick={() => setEditing(true)}
                    className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded border border-zinc-300">
                    {initialDate ? '✎ Edytuj datę / godzinę / miejsce' : '+ Ustaw datę sesji'}
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="px-2 py-1.5 border border-amber-300 rounded text-sm text-zinc-900 bg-white" />
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="px-2 py-1.5 border border-amber-300 rounded text-sm text-zinc-900 bg-white" />
            <input type="text" placeholder="Lokalizacja" value={location} onChange={e => setLocation(e.target.value)}
                className="px-2 py-1.5 border border-amber-300 rounded text-sm text-zinc-900 bg-white placeholder:text-zinc-400" />
            <div className="sm:col-span-3 flex gap-2">
                <button disabled={saving} onClick={save}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded disabled:opacity-50">
                    {saving ? 'Zapisywanie...' : 'Zapisz'}
                </button>
                <button disabled={saving} onClick={() => {
                    setEditing(false);
                    setDate(initialDate ? initialDate.slice(0, 10) : '');
                    setTime(initialTime || '');
                    setLocation(initialLocation || '');
                }}
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-semibold rounded border border-zinc-300">
                    Anuluj
                </button>
            </div>
        </div>
    );
}

function DepositPanel({ contract, token, onChanged }: { contract: Contract; token: string; onChanged: () => void }) {
    const [busy, setBusy] = useState(false);
    const [editing, setEditing] = useState(false);
    const [amount, setAmount] = useState(contract.deposit_amount?.toString() || '');
    const [dueAt, setDueAt] = useState(contract.deposit_due_at ? contract.deposit_due_at.slice(0, 10) : '');
    const [note, setNote] = useState(contract.deposit_note || '');

    const isPaid = !!contract.deposit_paid_at;
    const hasAmount = (contract.deposit_amount || 0) > 0;

    const now = new Date();
    const due = contract.deposit_due_at ? new Date(contract.deposit_due_at) : null;
    const overdue = !isPaid && hasAmount && due && due < now;
    const dueSoon = !isPaid && hasAmount && due && !overdue && (due.getTime() - now.getTime() < 7 * 86400000);

    const statusBadge = isPaid
        ? { txt: '✓ Zaliczka opłacona', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
        : overdue
            ? { txt: '⚠ Po terminie', cls: 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse' }
            : dueSoon
                ? { txt: '! Termin wkrótce', cls: 'bg-amber-100 text-amber-800 border-amber-200' }
                : hasAmount
                    ? { txt: 'Oczekuje wpłaty', cls: 'bg-zinc-100 text-zinc-700 border-zinc-200' }
                    : { txt: 'Brak ustalonej zaliczki', cls: 'bg-zinc-100 text-zinc-500 border-zinc-200' };

    const togglePaid = async (paid: boolean) => {
        if (!confirm(paid ? 'Oznaczyć zaliczkę jako wpłaconą?' : 'Cofnąć oznaczenie wpłaty?')) return;
        setBusy(true);
        try {
            const res = await fetch(`/api/admin/contracts/${contract.id}/mark-deposit-paid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ paid }),
            });
            if (res.ok) onChanged(); else alert('Błąd zapisu');
        } finally { setBusy(false); }
    };

    const saveEdit = async () => {
        setBusy(true);
        try {
            const res = await fetch(`/api/admin/contracts/${contract.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    deposit_amount: amount ? parseInt(amount, 10) : null,
                    deposit_due_at: dueAt || null,
                    deposit_note: note || null,
                }),
            });
            if (res.ok) { setEditing(false); onChanged(); } else alert('Błąd zapisu');
        } finally { setBusy(false); }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-zinc-900">💰 Zaliczka</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.cls}`}>{statusBadge.txt}</span>
            </div>

            {!editing ? (
                <div className="grid sm:grid-cols-3 gap-3 text-sm">
                    <div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Kwota</div>
                        <div className="font-bold text-zinc-900">
                            {hasAmount ? `${contract.deposit_amount!.toLocaleString('pl-PL')} PLN` : <span className="text-zinc-400">—</span>}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Termin</div>
                        <div className="text-zinc-900">
                            {due ? due.toLocaleDateString('pl-PL') : <span className="text-zinc-400">—</span>}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Wpłacono</div>
                        <div className="text-zinc-900">
                            {isPaid
                                ? new Date(contract.deposit_paid_at!).toLocaleDateString('pl-PL')
                                : <span className="text-zinc-400">—</span>}
                        </div>
                    </div>
                    {contract.deposit_note && (
                        <div className="sm:col-span-3 text-xs text-zinc-500 italic">{contract.deposit_note}</div>
                    )}
                </div>
            ) : (
                <div className="grid sm:grid-cols-3 gap-2">
                    <div>
                        <label className="block text-xs text-zinc-500 mb-1">Kwota (PLN)</label>
                        <input type="number" min={0} value={amount} onChange={e => setAmount(e.target.value)}
                            className="w-full px-2 py-1.5 border border-zinc-300 rounded text-sm text-zinc-900 bg-white" />
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-500 mb-1">Termin wpłaty</label>
                        <input type="date" value={dueAt} onChange={e => setDueAt(e.target.value)}
                            className="w-full px-2 py-1.5 border border-zinc-300 rounded text-sm text-zinc-900 bg-white" />
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-500 mb-1">Notatka</label>
                        <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="opcjonalnie"
                            className="w-full px-2 py-1.5 border border-zinc-300 rounded text-sm text-zinc-900 bg-white placeholder:text-zinc-400" />
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-zinc-100">
                {!editing ? (
                    <>
                        {!isPaid && hasAmount && (
                            <button disabled={busy} onClick={() => togglePaid(true)}
                                className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-semibold rounded hover:bg-emerald-700 disabled:opacity-50">
                                ✓ Oznacz jako wpłaconą
                            </button>
                        )}
                        {isPaid && (
                            <button disabled={busy} onClick={() => togglePaid(false)}
                                className="px-3 py-1.5 bg-zinc-200 text-zinc-800 text-sm font-semibold rounded hover:bg-zinc-300 disabled:opacity-50">
                                Cofnij wpłatę
                            </button>
                        )}
                        <button disabled={busy} onClick={() => setEditing(true)}
                            className="px-3 py-1.5 bg-zinc-100 text-zinc-700 text-sm font-semibold rounded hover:bg-zinc-200 disabled:opacity-50">
                            Edytuj kwotę / termin
                        </button>
                    </>
                ) : (
                    <>
                        <button disabled={busy} onClick={saveEdit}
                            className="px-3 py-1.5 bg-rose-600 text-white text-sm font-semibold rounded hover:bg-rose-700 disabled:opacity-50">
                            {busy ? 'Zapisywanie...' : 'Zapisz'}
                        </button>
                        <button disabled={busy} onClick={() => { setEditing(false); setAmount(contract.deposit_amount?.toString() || ''); setDueAt(contract.deposit_due_at?.slice(0, 10) || ''); setNote(contract.deposit_note || ''); }}
                            className="px-3 py-1.5 bg-zinc-100 text-zinc-700 text-sm font-semibold rounded hover:bg-zinc-200 disabled:opacity-50">
                            Anuluj
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}


function ContentEditor({ contract, token, onSaved }: { contract: Contract; token: string; onSaved: () => void }) {
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(contract.content || '');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    const saveAndRegen = async () => {
        setBusy(true); setMsg(null);
        try {
            const r1 = await fetch(`/api/admin/contracts/${contract.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: text }),
            });
            if (!r1.ok) throw new Error('Zapis treści nie powiódł się');
            setMsg('Treść zapisana, regeneruję PDF...');
            const r2 = await fetch(`/api/admin/contracts/${contract.id}/save-s3`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!r2.ok) throw new Error('Regeneracja PDF nie powiodła się');
            setMsg('PDF zregenerowany. Odświeżam...');
            setTimeout(onSaved, 600);
        } catch (e: any) { setMsg('Błąd: ' + e.message); }
        finally { setBusy(false); }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-zinc-900">Treść umowy (Markdown)</h2>
                {!editing ? (
                    <button onClick={() => setEditing(true)} className="px-3 py-1.5 bg-rose-600 text-white text-sm font-semibold rounded hover:bg-rose-700">✎ Edytuj treść umowy</button>
                ) : (
                    <div className="flex gap-2">
                        <button disabled={busy} onClick={saveAndRegen} className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-semibold rounded hover:bg-emerald-700 disabled:opacity-50">{busy ? 'Pracuję...' : '💾 Zapisz i zregeneruj PDF'}</button>
                        <button disabled={busy} onClick={() => { setEditing(false); setText(contract.content || ''); setMsg(null); }} className="px-3 py-1.5 bg-zinc-100 text-zinc-700 text-sm font-semibold rounded hover:bg-zinc-200">Anuluj</button>
                    </div>
                )}
            </div>
            {msg && <div className="mb-2 text-sm text-zinc-700">{msg}</div>}
            {editing ? (
                <textarea value={text} onChange={e => setText(e.target.value)} className="w-full h-[60vh] px-3 py-2 border border-zinc-300 rounded font-mono text-xs text-zinc-900 bg-white" />
            ) : (
                <pre className="max-h-64 overflow-auto text-xs text-zinc-700 bg-zinc-50 border border-zinc-200 rounded p-3 whitespace-pre-wrap">{contract.content || '(brak treści)'}</pre>
            )}
            <p className="text-xs text-zinc-500 mt-2">Po zapisaniu treści PDF zostanie wygenerowany ponownie z Twoich zmian.</p>
        </div>
    );
}


function RegenerateButton({ contractId, token }: { contractId: number; token: string }) {
    const [busy, setBusy] = useState(false);
    const onClick = async () => {
        if (!confirm('Zregenerować PDF z aktualnej treści umowy?')) return;
        setBusy(true);
        try {
            const r = await fetch(`/api/admin/contracts/${contractId}/save-s3`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            if (!r.ok) { const j = await r.json().catch(()=>({})); throw new Error(j.details || j.error || 'Błąd'); }
            window.location.reload();
        } catch (e: any) { alert('Błąd: ' + e.message); }
        finally { setBusy(false); }
    };
    return (
        <button disabled={busy} onClick={onClick} className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
            {busy ? 'Generuję...' : '🔄 Zregeneruj PDF'}
        </button>
    );
}
