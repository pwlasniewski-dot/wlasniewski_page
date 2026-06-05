'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Edit3,
    ExternalLink,
    Lightbulb,
    Loader2,
    RefreshCw,
    Save,
    Search,
    Tag,
    X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

/* ─── Types ─── */
type HeadingEntry = {
    id: string;
    source: string;
    slug: string;
    level: 'h1' | 'h2' | 'h3';
    text: string;
    editable: boolean;
    htmlTag: string;
    pageLabel?: string;
    hasKeyword?: boolean;
    matchedKeywords?: string[];
    suggestions?: string[];
};

type Stats = {
    total: number;
    withKeyword: number;
    withoutKeyword: number;
    h1Count: number;
    h2Count: number;
    h3Count: number;
};

type TargetKeyword = { kw: string; volume: string; intent: string };

type Filter = 'all' | 'bad' | 'good' | 'h1' | 'h2' | 'h3';

const SEO_HEADINGS_ENDPOINTS = ['/api/admin/seo-headings', '/api/admin/seo/headings'] as const;

async function fetchSeoHeadings(
    token: string | null,
    options?: RequestInit
): Promise<Response> {
    let lastResponse: Response | null = null;

    for (const endpoint of SEO_HEADINGS_ENDPOINTS) {
        const response = await fetch(endpoint, {
            ...options,
            headers: {
                ...(options?.headers ?? {}),
                Authorization: `Bearer ${token ?? ''}`,
            },
        });

        if (response.status !== 404) {
            return response;
        }
        lastResponse = response;
    }

    if (lastResponse) return lastResponse;
    throw new Error('Brak odpowiedzi z endpointu SEO headings');
}

/* ─── Level badge ─── */
function LevelBadge({ level }: { level: string }) {
    const colors: Record<string, string> = {
        h1: 'bg-violet-600 text-white',
        h2: 'bg-sky-600 text-white',
        h3: 'bg-teal-600 text-white',
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase ${colors[level] ?? 'bg-zinc-600 text-white'}`}>
            {level}
        </span>
    );
}

/* ─── Source badge ─── */
function SourceBadge({ source }: { source: string }) {
    if (source.startsWith('blog')) return <span className="text-xs text-amber-400 font-medium">Blog</span>;
    if (source === 'page_title') return <span className="text-xs text-violet-400 font-medium">Title</span>;
    if (source === 'page_section') return <span className="text-xs text-zinc-400 font-medium">Sekcja JSON</span>;
    return <span className="text-xs text-zinc-400 font-medium">Treść</span>;
}

/* ─── Editable row ─── */
function HeadingRow({
    entry,
    onSave,
}: {
    entry: HeadingEntry;
    onSave: (id: string, newText: string) => Promise<void>;
}) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(entry.text);
    const [saving, setSaving] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleSave = async () => {
        if (value.trim() === entry.text.trim()) { setEditing(false); return; }
        setSaving(true);
        const saved = await onSave(entry.id, value.trim());
        setSaving(false);
        if (saved) {
            setEditing(false);
        }
    };

    const handleCancel = () => {
        setValue(entry.text);
        setEditing(false);
    };

    const applySuggestion = (s: string) => {
        setValue(s);
        setShowSuggestions(false);
        setEditing(true);
    };

    const pageUrl = entry.source.startsWith('blog') ? `/blog/${entry.slug}` : `/${entry.slug}`;

    return (
        <div className={`border rounded-lg p-3 mb-2 transition-colors ${entry.hasKeyword ? 'border-zinc-700 bg-zinc-900' : 'border-amber-800/50 bg-amber-950/20'}`}>
            <div className="flex flex-wrap items-start gap-2">
                {/* Status icon */}
                <div className="mt-0.5 flex-shrink-0">
                    {entry.hasKeyword
                        ? <CheckCircle2 size={16} className="text-emerald-500" />
                        : <AlertTriangle size={16} className="text-amber-400" />
                    }
                </div>

                {/* Level + source */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <LevelBadge level={entry.level} />
                    <SourceBadge source={entry.source} />
                </div>

                {/* Page label */}
                <div className="flex items-center gap-1 text-xs text-zinc-500 flex-shrink-0">
                    <span>{entry.pageLabel}</span>
                    <a href={pageUrl} target="_blank" rel="noreferrer" className="hover:text-zinc-300">
                        <ExternalLink size={11} />
                    </a>
                </div>

                {/* Matched keywords */}
                {entry.matchedKeywords && entry.matchedKeywords.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                        {entry.matchedKeywords.map(kw => (
                            <span key={kw} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-900/50 text-emerald-400 text-xs rounded">
                                <Tag size={9} />{kw}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Heading text / edit */}
            <div className="mt-2 flex items-start gap-2">
                {editing ? (
                    <div className="flex-1 flex flex-col gap-2">
                        <input
                            className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-violet-500"
                            value={value}
                            onChange={e => setValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-1 px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs rounded font-medium disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                Zapisz
                            </button>
                            <button onClick={handleCancel} className="flex items-center gap-1 px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded">
                                <X size={12} /> Anuluj
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-between gap-2">
                        <span className={`text-sm font-medium ${entry.hasKeyword ? 'text-white' : 'text-amber-200'}`}>{entry.text}</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            {entry.suggestions && entry.suggestions.length > 0 && (
                                <button
                                    onClick={() => setShowSuggestions(!showSuggestions)}
                                    className="flex items-center gap-1 px-2 py-1 bg-violet-900/50 hover:bg-violet-800/60 text-violet-300 text-xs rounded"
                                    title="Sugestie słów kluczowych"
                                >
                                    <Lightbulb size={11} />
                                    Sugestie
                                    {showSuggestions ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                </button>
                            )}
                            {entry.editable && (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="flex items-center gap-1 px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs rounded"
                                >
                                    <Edit3 size={11} /> Edytuj
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Suggestions panel */}
            {showSuggestions && entry.suggestions && (
                <div className="mt-2 border border-violet-800/40 bg-violet-950/30 rounded-lg p-2">
                    <p className="text-xs text-violet-400 font-medium mb-1.5 flex items-center gap-1">
                        <Lightbulb size={11} /> Propozycje nagłówków z dobrymi słowami kluczowymi:
                    </p>
                    <div className="flex flex-col gap-1">
                        {entry.suggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => applySuggestion(s)}
                                className="text-left text-xs px-2.5 py-1.5 bg-violet-900/30 hover:bg-violet-800/50 text-violet-200 rounded border border-violet-800/30 hover:border-violet-600/50 transition-colors"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Main page ─── */
export default function SeoHeadingsPage() {
    const [headings, setHeadings] = useState<HeadingEntry[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [keywords, setKeywords] = useState<TargetKeyword[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>('all');
    const [search, setSearch] = useState('');
    const [showKeywords, setShowKeywords] = useState(false);

    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchSeoHeadings(token);
            const data = await res.json();
            if (data.success) {
                setHeadings(data.headings);
                setStats(data.stats);
                setKeywords(data.targetKeywords);
            } else {
                toast.error(data.error ?? 'Błąd pobierania nagłówków');
            }
        } catch {
            toast.error('Błąd pobierania nagłówków');
        }
        setLoading(false);
    }, [token]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async (id: string, newText: string): Promise<boolean> => {
        try {
            const res = await fetchSeoHeadings(token, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, newText }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Nagłówek zaktualizowany!');
                // Update local state
                setHeadings(prev => prev.map(h => h.id === id ? { ...h, text: newText } : h));
                return true;
            } else {
                toast.error(data.error ?? 'Błąd zapisu');
                return false;
            }
        } catch {
            toast.error('Błąd zapisu nagłówka');
            return false;
        }
    };

    const filtered = headings.filter(h => {
        if (filter === 'bad' && h.hasKeyword) return false;
        if (filter === 'good' && !h.hasKeyword) return false;
        if (filter === 'h1' && h.level !== 'h1') return false;
        if (filter === 'h2' && h.level !== 'h2') return false;
        if (filter === 'h3' && h.level !== 'h3') return false;
        if (search && !h.text.toLowerCase().includes(search.toLowerCase()) && !h.pageLabel?.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const filters: { id: Filter; label: string; count?: number }[] = [
        { id: 'all', label: 'Wszystkie', count: stats?.total },
        { id: 'bad', label: '⚠ Bez słów kluczowych', count: stats?.withoutKeyword },
        { id: 'good', label: '✓ Z słowami kluczowymi', count: stats?.withKeyword },
        { id: 'h1', label: 'H1', count: stats?.h1Count },
        { id: 'h2', label: 'H2', count: stats?.h2Count },
        { id: 'h3', label: 'H3', count: stats?.h3Count },
    ];

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6">
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                        <Link href="/admin/seo" className="hover:text-zinc-300">SEO Ops</Link>
                        <span>/</span>
                        <span>Audyt nagłówków</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Audyt nagłówków H1/H2/H3</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        Sprawdź, które nagłówki nie zawierają słów kluczowych i podmieniaj je bezpośrednio.
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium"
                >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    Odśwież
                </button>
            </div>

            {/* Stats cards */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                    {[
                        { label: 'Wszystkich', value: stats.total, color: 'text-white' },
                        { label: 'Bez słów kluczowych', value: stats.withoutKeyword, color: 'text-amber-400' },
                        { label: 'Z słowami kluczowymi', value: stats.withKeyword, color: 'text-emerald-400' },
                        { label: 'H1', value: stats.h1Count, color: 'text-violet-400' },
                        { label: 'H2', value: stats.h2Count, color: 'text-sky-400' },
                        { label: 'H3', value: stats.h3Count, color: 'text-teal-400' },
                    ].map(s => (
                        <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
                            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                            <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Score bar */}
            {stats && stats.total > 0 && (
                <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Pokrycie słowami kluczowymi</span>
                        <span className="text-sm font-bold">
                            {Math.round((stats.withKeyword / stats.total) * 100)}%
                        </span>
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-2.5">
                        <div
                            className="bg-gradient-to-r from-amber-500 to-emerald-500 h-2.5 rounded-full transition-all duration-700"
                            style={{ width: `${Math.round((stats.withKeyword / stats.total) * 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                        {stats.withoutKeyword} nagłówków nie zawiera żadnego z {keywords.length} docelowych słów kluczowych
                    </p>
                </div>
            )}

            {/* Keywords reference panel */}
            <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-lg">
                <button
                    onClick={() => setShowKeywords(!showKeywords)}
                    className="w-full flex items-center justify-between p-4 text-sm font-medium hover:bg-zinc-800/50 transition-colors rounded-lg"
                >
                    <span className="flex items-center gap-2">
                        <Tag size={14} className="text-violet-400" />
                        Docelowe słowa kluczowe ({keywords.length})
                    </span>
                    {showKeywords ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showKeywords && (
                    <div className="p-4 pt-0 border-t border-zinc-800">
                        <p className="text-xs text-zinc-500 mb-3">Nagłówki zawierające te frazy są oznaczone jako dobre SEO. Dodaj je do swoich nagłówków.</p>
                        <div className="flex flex-wrap gap-2">
                            {keywords.map(kw => (
                                <div key={kw.kw} className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded-full">
                                    <span className="text-xs text-white font-medium">{kw.kw}</span>
                                    <span className={`text-xs ${kw.volume === 'wysoki' ? 'text-emerald-400' : kw.volume === 'średni' ? 'text-amber-400' : 'text-zinc-500'}`}>
                                        {kw.volume}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Filters + Search */}
            <div className="mb-4 flex flex-wrap gap-2 items-center">
                {filters.map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f.id ? 'bg-violet-700 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                    >
                        {f.label}{f.count !== undefined ? ` (${f.count})` : ''}
                    </button>
                ))}
                <div className="flex items-center gap-1.5 ml-auto bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5">
                    <Search size={13} className="text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Szukaj nagłówka lub strony…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none w-52"
                    />
                    {search && <button onClick={() => setSearch('')}><X size={12} className="text-zinc-500 hover:text-white" /></button>}
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 size={28} className="animate-spin text-violet-400" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-24 text-zinc-600">
                    <Search size={40} className="mx-auto mb-3 opacity-30" />
                    <p>Brak wyników dla wybranego filtru</p>
                </div>
            ) : (
                <div>
                    <p className="text-xs text-zinc-600 mb-3">Pokazuję {filtered.length} z {headings.length} nagłówków</p>
                    {filtered.map(entry => (
                        <HeadingRow key={entry.id} entry={entry} onSave={handleSave} />
                    ))}
                </div>
            )}
        </div>
    );
}
