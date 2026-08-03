'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getApiUrl } from '@/lib/api-config';
import { Plus, Edit, Trash2, Image as ImageIcon, CheckCircle2, LayoutGrid, Film, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface PortfolioSession {
    id: number;
    slug: string;
    title: string;
    category: string;
    session_date: string;
    is_published: boolean;
    is_category_hero?: boolean;
    media_ids?: string | number[];
}

type PortfolioIndexLayout = 'chapters' | 'cinematic_contact';

export default function PortfolioPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [sessions, setSessions] = useState<PortfolioSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [autoRouted, setAutoRouted] = useState(false);
    const [portfolioLayout, setPortfolioLayout] = useState<PortfolioIndexLayout>('chapters');
    const [layoutLoading, setLayoutLoading] = useState(true);
    const [layoutSaving, setLayoutSaving] = useState<PortfolioIndexLayout | null>(null);

    useEffect(() => {
        fetchSessions();
        fetchPortfolioLayout();
    }, []);

    useEffect(() => {
        if (autoRouted || loading || sessions.length === 0) return;

        const slug = searchParams.get('slug');
        const focus = searchParams.get('focus') || '';
        if (!slug) return;

        const match = sessions.find(s => s.slug === slug);
        setAutoRouted(true);

        if (match) {
            const focusQuery = focus ? `?focus=${encodeURIComponent(focus)}` : '';
            router.replace(`/admin/portfolio/edit/${match.id}${focusQuery}`);
            return;
        }

        toast.error(`Nie znaleziono sesji portfolio o slugu: ${slug}`);
    }, [autoRouted, loading, sessions, router, searchParams]);

    const fetchSessions = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl('portfolio'), {
                headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
                cache: 'no-store',
            });
            const data = await res.json();
            if (data.success) {
                setSessions(data.sessions);
            }
        } catch (error) {
            console.error('Failed to fetch sessions', error);
            toast.error('Błąd pobierania sesji');
        } finally {
            setLoading(false);
        }
    };

    const fetchPortfolioLayout = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/settings', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
                cache: 'no-store',
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setPortfolioLayout(data.settings?.portfolio_index_layout === 'cinematic_contact' ? 'cinematic_contact' : 'chapters');
            }
        } catch (error) {
            console.error('Failed to fetch portfolio layout', error);
            toast.error('Nie udało się pobrać wyglądu Portfolio');
        } finally {
            setLayoutLoading(false);
        }
    };

    const applyPortfolioLayout = async (layout: PortfolioIndexLayout) => {
        if (layout === portfolioLayout || layoutSaving) return;
        setLayoutSaving(layout);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ portfolio_index_layout: layout }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Layout update failed');
            setPortfolioLayout(layout);
            toast.success(layout === 'chapters' ? 'Włączono układ „Rozdziały”' : 'Włączono układ „Kontakt filmowy”');
        } catch (error) {
            console.error('Failed to update portfolio layout', error);
            toast.error('Nie udało się zmienić wyglądu Portfolio');
        } finally {
            setLayoutSaving(null);
        }
    };

    const handleDelete = async (id: number) => {
        console.log('🗑️ DELETE CLICKED - ID:', id);

        if (!confirm('Na pewno chcesz usunąć tę sesję?')) {
            console.log('❌ User cancelled');
            return;
        }

        console.log('✅ User confirmed deletion');

        try {
            const token = localStorage.getItem('admin_token');
            console.log('🔑 Token exists:', !!token);

            const url = `${getApiUrl('portfolio')}?id=${id}`;
            console.log('🌐 DELETE URL:', url);

            const res = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('📡 Response status:', res.status);
            const data = await res.json();
            console.log('📦 Response data:', data);

            if (res.ok) {
                console.log('✅ DELETE successful');
                toast.success('Sesja usunięta');
                fetchSessions();
            } else {
                console.error('❌ DELETE failed:', data);
                toast.error(`Błąd: ${data.error || 'Nieznany błąd'}`);
                throw new Error('Delete failed');
            }
        } catch (error) {
            console.error('💥 DELETE exception:', error);
            toast.error('Błąd usuwania sesji');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-display font-semibold text-white">Portfolio</h1>
                <Link
                    href="/admin/portfolio/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-gold-500 hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Nowa sesja
                </Link>
            </div>

            <section className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
                <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[.2em] text-gold-500">Wygląd publicznej strony</p>
                        <h2 className="mt-2 text-xl font-semibold text-white">Wybierz układ /portfolio</h2>
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">Oba układy korzystają z tych samych sesji i zdjęć w Amazon S3. Zmiana nie usuwa ani nie kopiuje plików.</p>
                    </div>
                    <Link href="/portfolio" target="_blank" className="inline-flex items-center gap-2 text-sm font-medium text-gold-400 transition hover:text-gold-300">
                        Otwórz Portfolio <ExternalLink size={15} />
                    </Link>
                </div>

                {layoutLoading ? (
                    <div className="flex min-h-32 items-center justify-center text-zinc-500"><Loader2 className="mr-2 animate-spin" size={18} /> Ładowanie ustawienia…</div>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        <button
                            type="button"
                            onClick={() => applyPortfolioLayout('chapters')}
                            disabled={Boolean(layoutSaving)}
                            className={`group rounded-xl border p-5 text-left transition ${portfolioLayout === 'chapters' ? 'border-gold-500 bg-gold-500/10 shadow-[0_0_30px_rgba(202,160,68,.08)]' : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'}`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <span className={`grid h-11 w-11 place-items-center rounded-lg ${portfolioLayout === 'chapters' ? 'bg-gold-500 text-black' : 'bg-zinc-800 text-zinc-300'}`}><LayoutGrid size={22} /></span>
                                {portfolioLayout === 'chapters' && <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">Aktualnie używany</span>}
                                {layoutSaving === 'chapters' && <Loader2 className="animate-spin text-gold-400" size={18} />}
                            </div>
                            <h3 className="mt-5 text-lg font-semibold text-white">01 · Edytorskie rozdziały</h3>
                            <p className="mt-2 text-sm leading-6 text-zinc-400">Eleganckie, asymetryczne kadry. Najlepszy balans fotografii, opisów, sprzedaży i SEO.</p>
                            <span className="mt-4 inline-block text-xs font-bold uppercase tracking-[.14em] text-gold-400">{portfolioLayout === 'chapters' ? 'Wybrany' : 'Zastosuj układ'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => applyPortfolioLayout('cinematic_contact')}
                            disabled={Boolean(layoutSaving)}
                            className={`group rounded-xl border p-5 text-left transition ${portfolioLayout === 'cinematic_contact' ? 'border-gold-500 bg-gold-500/10 shadow-[0_0_30px_rgba(202,160,68,.08)]' : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'}`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <span className={`grid h-11 w-11 place-items-center rounded-lg ${portfolioLayout === 'cinematic_contact' ? 'bg-gold-500 text-black' : 'bg-zinc-800 text-zinc-300'}`}><Film size={22} /></span>
                                {portfolioLayout === 'cinematic_contact' && <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">Aktualnie używany</span>}
                                {layoutSaving === 'cinematic_contact' && <Loader2 className="animate-spin text-gold-400" size={18} />}
                            </div>
                            <h3 className="mt-5 text-lg font-semibold text-white">02 · Kontakt filmowy</h3>
                            <p className="mt-2 text-sm leading-6 text-zinc-400">Dynamiczna stykówka zdjęć. Mocna dla reportażu ślubnego, wydarzeń i regularnych aktualizacji.</p>
                            <span className="mt-4 inline-block text-xs font-bold uppercase tracking-[.14em] text-gold-400">{portfolioLayout === 'cinematic_contact' ? 'Wybrany' : 'Zastosuj układ'}</span>
                        </button>
                    </div>
                )}
            </section>

            <div className="bg-zinc-900 shadow overflow-hidden sm:rounded-md border border-zinc-800">
                <ul className="divide-y divide-zinc-800">
                    {loading ? (
                        <li className="px-6 py-4 text-zinc-400">Ładowanie...</li>
                    ) : sessions.length === 0 ? (
                        <li className="px-6 py-4 text-zinc-400">Brak sesji. Dodaj pierwszą!</li>
                    ) : (
                        sessions.map((session) => (
                            <li key={session.id}>
                                <div className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <p className="text-sm font-medium text-gold-400 truncate">{session.title}</p>
                                            {session.is_category_hero && (
                                                <div title="Okładka kategorii (główne zdjęcie na stronie portfolio)" className="flex items-center text-green-500">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </div>
                                            )}
                                            <div className="flex-shrink-0 flex">
                                                <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${session.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {session.is_published ? 'Opublikowana' : 'Szkic'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex gap-4">
                                                <p className="flex items-center text-sm text-zinc-500">
                                                    {session.category}
                                                </p>
                                                <div className="flex items-center text-sm text-zinc-500 gap-1" title="Liczba zdjęć w galerii">
                                                    <ImageIcon className="h-3.5 w-3.5" />
                                                    <span>
                                                        {(() => {
                                                            try {
                                                                if (Array.isArray(session.media_ids)) return session.media_ids.length;
                                                                if (typeof session.media_ids === 'string') return JSON.parse(session.media_ids).length;
                                                                return 0;
                                                            } catch { return 0; }
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-zinc-500 sm:mt-0">
                                                <p>
                                                    Data sesji: {new Date(session.session_date).toLocaleDateString('pl-PL')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-5 flex-shrink-0 flex gap-2">
                                        <Link href={`/admin/portfolio/edit/${session.id}`} className="p-2 text-zinc-400 hover:text-white transition-colors">
                                            <Edit className="h-5 w-5" />
                                        </Link>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(session.id);
                                            }}
                                            className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
