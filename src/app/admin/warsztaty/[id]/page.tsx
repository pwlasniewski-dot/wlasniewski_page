'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Printer, Trash2, KeyRound } from 'lucide-react';

interface Participant {
    id: number;
    login: string;
    display_name: string | null;
    avatar: string | null;
    pin_plain_temp: string | null;
    active: boolean;
    last_login: string | null;
    created_at: string;
}
interface Workshop {
    id: number;
    slug: string;
    title: string;
    location: string | null;
    description: string | null;
    schedule: any[];
    materials: any[];
    status: string;
    starts_at: string | null;
    ends_at: string | null;
    participants: Participant[];
}

export default function WorkshopDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [w, setW] = useState<Workshop | null>(null);
    const [count, setCount] = useState(15);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [recentlyCreated, setRecentlyCreated] = useState<Participant[] | null>(null);

    function token() { return localStorage.getItem('admin_token') || ''; }

    async function load() {
        setLoading(true);
        const r = await fetch(`/api/admin/workshops/${id}`, { headers: { Authorization: `Bearer ${token()}` } });
        const j = await r.json();
        setW(j.workshop);
        setLoading(false);
    }
    useEffect(() => { load(); }, [id]);

    async function generate() {
        setGenerating(true);
        const r = await fetch(`/api/admin/workshops/${id}/participants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
            body: JSON.stringify({ count }),
        });
        const j = await r.json();
        setRecentlyCreated(j.created || []);
        setGenerating(false);
        load();
    }

    async function removeParticipant(pid: number) {
        if (!confirm('Usunąć uczestnika? Tej operacji nie da się cofnąć.')) return;
        await fetch(`/api/admin/workshops/${id}/participants?ids=${pid}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token()}` },
        });
        load();
    }

    function printCards() {
        const win = window.open('', '_blank');
        if (!win || !w) return;
        const cards = w.participants.map(p => `
            <div class="card">
                <div class="avatar">${p.avatar || '🦊'}</div>
                <div class="title">${w.title}</div>
                <div class="loc">${w.location || ''}</div>
                <div class="creds">
                    <div><span>Login:</span><strong>${p.login}</strong></div>
                    <div><span>PIN:</span><strong>${p.pin_plain_temp || '••••••'}</strong></div>
                </div>
                <div class="url">${typeof window !== 'undefined' ? window.location.origin : ''}/warsztaty/${w.slug}/login</div>
            </div>`).join('');
        win.document.write(`<!doctype html><html><head><title>Karty uczestników</title><style>
            @page { size: A4; margin: 8mm; }
            body { font-family: -apple-system, Segoe UI, sans-serif; margin: 0; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; }
            .card { border: 2px dashed #c4b5a3; border-radius: 12px; padding: 10mm 6mm; text-align: center; page-break-inside: avoid; }
            .avatar { font-size: 36pt; line-height: 1; }
            .title { font-weight: bold; margin-top: 4mm; font-size: 11pt; color: #1f2937; }
            .loc { color: #6b7280; font-size: 9pt; margin-top: 1mm; }
            .creds { margin-top: 5mm; font-size: 13pt; }
            .creds div { margin: 1mm 0; }
            .creds span { color:#9ca3af; font-size: 10pt; margin-right: 3mm; }
            .creds strong { color:#0f172a; letter-spacing: 1px; }
            .url { margin-top: 4mm; color:#9ca3af; font-size: 7pt; word-break:break-all; }
        </style></head><body><div class="grid">${cards}</div>
        <script>window.onload=()=>window.print();</script></body></html>`);
        win.document.close();
    }

    if (loading) return <div className="p-6 text-zinc-500">Ładowanie…</div>;
    if (!w) return <div className="p-6 text-rose-500">Nie znaleziono warsztatu.</div>;

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-rose-50 p-6">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/admin/warsztaty" className="text-zinc-600 hover:text-zinc-900"><ArrowLeft size={20} /></Link>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900">{w.title}</h1>
                        <div className="text-sm text-zinc-500">/warsztaty/{w.slug}</div>
                    </div>
                </div>

                <div className="bg-white border border-zinc-200 rounded-xl p-4 mb-4 shadow-sm">
                    <h2 className="font-bold mb-3 text-zinc-900 flex items-center gap-2"><KeyRound size={16} /> Generator kont uczestników</h2>
                    <div className="flex items-end gap-3">
                        <div>
                            <label className="text-xs font-bold text-zinc-600">Liczba kont (1-50)</label>
                            <input type="number" min={1} max={50} value={count} onChange={e => setCount(parseInt(e.target.value, 10) || 1)} className="border rounded p-2 w-32 text-zinc-900" />
                        </div>
                        <button onClick={generate} disabled={generating} className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50">
                            <Plus size={16} /> {generating ? 'Generuję…' : 'Wygeneruj konta'}
                        </button>
                        <button onClick={printCards} disabled={!w.participants.length} className="ml-auto bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-30">
                            <Printer size={16} /> Drukuj karty ({w.participants.length})
                        </button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">RODO: nie zbieramy maili dzieci. Login + PIN-y wydrukuj raz, rozdaj uczestnikom; PIN-y w bazie są hashowane (bcrypt). Podgląd jawnego PIN-u znika po skasowaniu konta.</p>
                </div>

                {recentlyCreated && recentlyCreated.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                        <h3 className="font-bold text-emerald-800 mb-2">Wygenerowano {recentlyCreated.length} nowych kont:</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm font-mono">
                            {recentlyCreated.map(p => (
                                <div key={p.id} className="bg-white rounded p-2 border border-emerald-100">
                                    <span className="text-2xl mr-2">{p.avatar}</span>
                                    {p.login} / <strong>{p.pin_plain_temp}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
                    <h2 className="font-bold mb-3 text-zinc-900">Uczestnicy ({w.participants.length})</h2>
                    {w.participants.length === 0 ? (
                        <div className="text-zinc-500 text-sm">Brak uczestników. Wygeneruj konta powyżej.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-zinc-500 border-b">
                                    <tr><th className="text-left p-2">Avatar</th><th className="text-left p-2">Login</th><th className="text-left p-2">PIN</th><th className="text-left p-2">Pseudonim</th><th className="text-left p-2">Ostatnie logowanie</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {w.participants.map(p => (
                                        <tr key={p.id} className="border-b last:border-0">
                                            <td className="p-2 text-2xl">{p.avatar}</td>
                                            <td className="p-2 font-mono text-zinc-900">{p.login}</td>
                                            <td className="p-2 font-mono text-zinc-700">{p.pin_plain_temp || '••••••'}</td>
                                            <td className="p-2 text-zinc-600">{p.display_name || <span className="text-zinc-400">brak</span>}</td>
                                            <td className="p-2 text-zinc-500 text-xs">{p.last_login ? new Date(p.last_login).toLocaleString('pl-PL') : '—'}</td>
                                            <td className="p-2 text-right">
                                                <button onClick={() => removeParticipant(p.id)} className="text-rose-500 hover:text-rose-700 p-1"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
