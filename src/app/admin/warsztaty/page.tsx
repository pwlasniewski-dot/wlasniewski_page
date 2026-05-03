'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar, Users, MapPin, ArrowLeft } from 'lucide-react';

interface WorkshopRow {
    id: number;
    slug: string;
    title: string;
    location: string | null;
    status: string;
    starts_at: string | null;
    ends_at: string | null;
    _count: { participants: number; uploads: number };
}

export default function WorkshopsListPage() {
    const [items, setItems] = useState<WorkshopRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ slug: '', title: '', location: '', starts_at: '', ends_at: '' });
    const [error, setError] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        const token = localStorage.getItem('admin_token') || '';
        const r = await fetch('/api/admin/workshops', { headers: { Authorization: `Bearer ${token}` } });
        const j = await r.json();
        setItems(j.items || []);
        setLoading(false);
    }
    useEffect(() => { load(); }, []);

    async function create(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const token = localStorage.getItem('admin_token') || '';
        const r = await fetch('/api/admin/workshops', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(form),
        });
        if (!r.ok) {
            const j = await r.json().catch(() => ({}));
            setError(j.error || 'Blad');
            return;
        }
        setForm({ slug: '', title: '', location: '', starts_at: '', ends_at: '' });
        setShowForm(false);
        load();
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-rose-50 p-6">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/admin/dashboard" className="text-zinc-600 hover:text-zinc-900">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-bold text-zinc-900">Warsztaty fotograficzne</h1>
                    <button
                        onClick={() => setShowForm(s => !s)}
                        className="ml-auto bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                    >
                        <Plus size={16} /> Nowy warsztat
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={create} className="bg-white border border-zinc-200 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-3 shadow-sm">
                        <div>
                            <label className="text-xs font-bold text-zinc-600">Slug (URL)</label>
                            <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="wieldzadz-2026" required className="w-full border rounded p-2 text-zinc-900" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-zinc-600">Tytuł</label>
                            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Warsztaty Wieldządz 2026" required className="w-full border rounded p-2 text-zinc-900" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-zinc-600">Lokalizacja</label>
                            <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Wieldządz, Pomorska 1" className="w-full border rounded p-2 text-zinc-900" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs font-bold text-zinc-600">Start</label>
                                <input type="date" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} className="w-full border rounded p-2 text-zinc-900" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-600">Koniec</label>
                                <input type="date" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} className="w-full border rounded p-2 text-zinc-900" />
                            </div>
                        </div>
                        {error && <div className="md:col-span-2 text-rose-600 text-sm">{error}</div>}
                        <div className="md:col-span-2 flex gap-2">
                            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold">Utwórz</button>
                            <button type="button" onClick={() => setShowForm(false)} className="text-zinc-600 px-4 py-2">Anuluj</button>
                        </div>
                    </form>
                )}

                {loading ? (
                    <div className="text-zinc-500">Ładowanie…</div>
                ) : items.length === 0 ? (
                    <div className="text-zinc-500 text-center py-12">Nie ma jeszcze warsztatów.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {items.map(w => (
                            <Link key={w.id} href={`/admin/warsztaty/${w.id}`} className="block bg-white border border-zinc-200 rounded-xl p-4 hover:shadow-md transition shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${w.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-700'}`}>{w.status}</span>
                                    <code className="text-xs text-zinc-500">{w.slug}</code>
                                </div>
                                <div className="font-bold text-zinc-900">{w.title}</div>
                                {w.location && <div className="text-sm text-zinc-600 flex items-center gap-1 mt-1"><MapPin size={12} /> {w.location}</div>}
                                <div className="flex gap-4 mt-3 text-xs text-zinc-500">
                                    <span className="flex items-center gap-1"><Users size={12} /> {w._count.participants} uczestników</span>
                                    {w.starts_at && <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(w.starts_at).toLocaleDateString('pl-PL')}</span>}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
