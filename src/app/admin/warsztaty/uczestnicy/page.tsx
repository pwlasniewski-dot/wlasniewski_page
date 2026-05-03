'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, GraduationCap, ExternalLink, Image as ImageIcon, Mail, CheckCircle2, Clock } from 'lucide-react';

type Participant = {
    id: number;
    login: string;
    display_name: string | null;
    avatar: string | null;
    active: boolean;
    last_login: string | null;
    created_at: string;
    workshop: { id: number; slug: string; title: string; status: string };
    _count: { uploads: number };
};

type OfferRow = {
    id: number;
    recipient_email: string;
    recipient_name: string | null;
    participant_name: string | null;
    price: number | null;
    deposit_amount: number | null;
    deposit_paid_at: string | null;
    status: string;
    source: string;
    sent_at: string;
    workshop: { id: number; slug: string; title: string };
};

export default function AllParticipantsPage() {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [offers, setOffers] = useState<OfferRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        fetch('/api/admin/workshops/participants', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : { participants: [], offers: [] })
            .then(d => { setParticipants(d.participants || []); setOffers(d.offers || []); })
            .finally(() => setLoading(false));
    }, []);

    const f = filter.toLowerCase();
    const filteredP = participants.filter(p =>
        !f || p.login.toLowerCase().includes(f) || (p.display_name || '').toLowerCase().includes(f) || p.workshop.title.toLowerCase().includes(f)
    );
    const filteredO = offers.filter(o =>
        !f || o.recipient_email.toLowerCase().includes(f) || (o.recipient_name || '').toLowerCase().includes(f) || (o.participant_name || '').toLowerCase().includes(f) || o.workshop.title.toLowerCase().includes(f)
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-rose-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-3">
                            <Users className="text-rose-500" /> Uczestnicy warsztatów
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1">Wszystkie konta + aktywne oferty (lead-y) ze wszystkich warsztatów</p>
                    </div>
                    <Link href="/admin/warsztaty" className="text-rose-600 hover:underline font-bold flex items-center gap-1">
                        ← Lista warsztatów
                    </Link>
                </div>

                <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Szukaj po loginie, imieniu, e-mailu, warsztacie..."
                    className="w-full mb-6 border border-zinc-300 rounded-lg px-4 py-2 text-zinc-900" />

                {loading ? (
                    <div className="text-center text-zinc-400 py-12">Ładowanie...</div>
                ) : (
                    <div className="space-y-8">
                        {/* OFERTY */}
                        <section className="bg-white rounded-xl shadow border border-zinc-200">
                            <div className="p-4 border-b border-zinc-200">
                                <h2 className="font-bold text-zinc-900 flex items-center gap-2">
                                    <Mail className="text-amber-500" size={18} /> Aktywne oferty / lead-y ({filteredO.length})
                                </h2>
                            </div>
                            {filteredO.length === 0 ? (
                                <div className="p-6 text-center text-zinc-400 text-sm">Brak aktywnych ofert</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead><tr className="bg-zinc-50 text-zinc-600 text-xs uppercase">
                                            <th className="text-left p-3">Status</th>
                                            <th className="text-left p-3">Warsztat</th>
                                            <th className="text-left p-3">Odbiorca</th>
                                            <th className="text-left p-3">Cena/Zaliczka</th>
                                            <th className="text-left p-3">Wysłano</th>
                                            <th className="p-3"></th>
                                        </tr></thead>
                                        <tbody>
                                            {filteredO.map(o => (
                                                <tr key={o.id} className="border-t border-zinc-100">
                                                    <td className="p-3">
                                                        {o.status === 'paid' ? (
                                                            <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold"><CheckCircle2 size={11}/> Opłacona</span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold"><Clock size={11}/> Wysłano</span>
                                                        )}
                                                        {o.source === 'public' && <span className="ml-1 text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-bold">PUBLIC</span>}
                                                    </td>
                                                    <td className="p-3 text-zinc-700">{o.workshop.title}</td>
                                                    <td className="p-3">
                                                        <div className="font-bold text-zinc-900">{o.recipient_name || o.recipient_email}</div>
                                                        <div className="text-xs text-zinc-500">{o.recipient_email}</div>
                                                        {o.participant_name && <div className="text-xs text-rose-600">👤 {o.participant_name}</div>}
                                                    </td>
                                                    <td className="p-3 text-zinc-700">
                                                        {o.price ? `${o.price.toLocaleString('pl-PL')} PLN` : '—'}
                                                        {o.deposit_amount ? <div className={`text-xs ${o.deposit_paid_at ? 'text-emerald-600 font-bold' : 'text-amber-700'}`}>Zal. {o.deposit_amount.toLocaleString('pl-PL')} PLN{o.deposit_paid_at ? ' ✓' : ''}</div> : null}
                                                    </td>
                                                    <td className="p-3 text-xs text-zinc-500">{new Date(o.sent_at).toLocaleDateString('pl-PL')}</td>
                                                    <td className="p-3">
                                                        <Link href={`/admin/warsztaty/${o.workshop.id}`} className="text-rose-600 hover:underline text-xs flex items-center gap-1">
                                                            <ExternalLink size={12}/> otwórz
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>

                        {/* UCZESTNICY */}
                        <section className="bg-white rounded-xl shadow border border-zinc-200">
                            <div className="p-4 border-b border-zinc-200">
                                <h2 className="font-bold text-zinc-900 flex items-center gap-2">
                                    <GraduationCap className="text-rose-500" size={18} /> Wszyscy uczestnicy ({filteredP.length})
                                </h2>
                            </div>
                            {filteredP.length === 0 ? (
                                <div className="p-6 text-center text-zinc-400 text-sm">Brak uczestników</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead><tr className="bg-zinc-50 text-zinc-600 text-xs uppercase">
                                            <th className="text-left p-3">Awatar</th>
                                            <th className="text-left p-3">Login</th>
                                            <th className="text-left p-3">Pseudonim</th>
                                            <th className="text-left p-3">Warsztat</th>
                                            <th className="text-left p-3">Uploady</th>
                                            <th className="text-left p-3">Ostatnie logowanie</th>
                                            <th className="p-3"></th>
                                        </tr></thead>
                                        <tbody>
                                            {filteredP.map(p => (
                                                <tr key={p.id} className="border-t border-zinc-100 hover:bg-amber-50/30">
                                                    <td className="p-3 text-2xl">{p.avatar}</td>
                                                    <td className="p-3 font-mono text-zinc-900">{p.login}</td>
                                                    <td className="p-3 text-zinc-700">{p.display_name || <span className="text-zinc-400">—</span>}</td>
                                                    <td className="p-3 text-zinc-700">{p.workshop.title}</td>
                                                    <td className="p-3 text-zinc-600 flex items-center gap-1"><ImageIcon size={14}/> {p._count.uploads}</td>
                                                    <td className="p-3 text-xs text-zinc-500">{p.last_login ? new Date(p.last_login).toLocaleString('pl-PL') : '—'}</td>
                                                    <td className="p-3">
                                                        <Link href={`/admin/warsztaty/${p.workshop.id}`} className="text-rose-600 hover:underline text-xs flex items-center gap-1">
                                                            <ExternalLink size={12}/> otwórz
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
