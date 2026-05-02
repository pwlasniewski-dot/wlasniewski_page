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
    session_date: string | null;
    session_time: string | null;
    session_location: string | null;
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

    const pdfUrl = contract.signed_pdf_url || contract.pdf_url || `/api/contracts/${contract.id}/pdf?token=${encodeURIComponent(token)}`;
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
                        {sessionDate ? (
                            <div className="space-y-1.5 text-sm">
                                <div className="font-semibold text-zinc-900">
                                    {new Date(sessionDate).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                                {sessionTime && <div className="flex items-center gap-2 text-zinc-700"><Clock className="w-3.5 h-3.5" /> {sessionTime}</div>}
                                {sessionLocation && <div className="flex items-center gap-2 text-zinc-700"><MapPin className="w-3.5 h-3.5" /> {sessionLocation}</div>}
                            </div>
                        ) : (
                            <div className="text-sm text-zinc-500">
                                Brak daty sesji.{' '}
                                <span className="text-amber-700">Uzupełnij ją żeby umowa pojawiła się w kalendarzu.</span>
                                <SetSessionDateForm contractId={contract.id} token={token} onSaved={() => window.location.reload()} />
                            </div>
                        )}
                    </div>
                </div>

                {contract.client_note && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                        <h3 className="font-bold text-amber-900 mb-1 text-sm">Notatka klienta:</h3>
                        <p className="text-sm text-amber-800 whitespace-pre-wrap">{contract.client_note}</p>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-zinc-900">Dokument PDF</h2>
                        <a href={pdfUrl} target="_blank" rel="noopener" download
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-white text-sm font-semibold rounded-lg hover:bg-zinc-800">
                            <Download className="w-4 h-4" /> Pobierz
                        </a>
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
