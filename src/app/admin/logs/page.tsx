'use client';

import React, { useEffect, useState } from 'react';
import { getApiUrl } from '@/lib/api-config';
import { AlertCircle, CheckCircle, Info, RefreshCw, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface SystemLog {
    id: number;
    level: 'INFO' | 'WARN' | 'ERROR';
    module: string;
    message: string;
    metadata: string | null;
    created_at: string;
}

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [filterLevel, setFilterLevel] = useState<string>('ALL');
    const [filterModule, setFilterModule] = useState<'ALL' | 'GALLERY'>('ALL');

    // Moduły dotyczące aktywności klientów w galeriach (koszyk, pobrania, płatności).
    const GALLERY_MODULES = ['BASKET', 'PAYMENT', 'CHECKOUT'];

    // Tłumaczenie technicznych komunikatów na ludzki język (co klient zrobił).
    const FRIENDLY: Record<string, string> = {
        GROUP_DOWNLOAD_ALL_SUCCESS: '⬇️ Pobrał paczkę ZIP',
        GROUP_DOWNLOAD_SINGLE_SUCCESS: '⬇️ Pobrał pojedyncze zdjęcie',
        GROUP_DOWNLOAD_ALL_BLOCKED_NO_FULL_QUALITY: '⛔ Pobranie zablokowane (brak pełnej jakości)',
        GROUP_DOWNLOAD_ALL_NO_TOKEN: '🔒 Próba pobrania bez zalogowania',
        GROUP_DOWNLOAD_ALL_INVALID_TOKEN: '🔒 Pobranie — nieprawidłowy token',
        GROUP_DOWNLOAD_ALL_FORBIDDEN: '🚫 Pobranie — brak dostępu do galerii',
        GROUP_DOWNLOAD_ALL_EMPTY_GALLERY: '📭 Pobranie — pusta galeria',
        GROUP_DOWNLOAD_ALL_GALLERY_EXPIRED: '⌛ Pobranie — galeria wygasła',
        GROUP_EXTRA_PURCHASE_ORDER_CREATED: '🛒 Złożył zamówienie na odbitki',
        GROUP_EXTRA_PURCHASE_PAYU_INIT: '💳 Przeszedł do płatności PayU',
    };

    // Wyciąga czytelne szczegóły z metadanych zdarzeń galeryjnych.
    const describeMeta = (log: SystemLog): string => {
        if (!log.metadata) return '';
        try {
            const m = JSON.parse(log.metadata);
            const parts: string[] = [];
            if (m.gallery_id !== undefined) parts.push(`galeria #${m.gallery_id}`);
            if (m.participant_id !== undefined) parts.push(`uczestnik #${m.participant_id}`);
            if (m.added_photo_count !== undefined) parts.push(`zdjęć: ${m.added_photo_count}`);
            else if (m.photo_count !== undefined) parts.push(`zdjęć: ${m.photo_count}`);
            if (m.zip_bytes !== undefined) parts.push(`${(m.zip_bytes / 1048576).toFixed(1)} MB`);
            if (m.total_amount !== undefined) parts.push(`${(m.total_amount / 100).toFixed(2)} zł`);
            if (m.order_id !== undefined) parts.push(`zam. #${m.order_id}`);
            return parts.join(' · ');
        } catch {
            return '';
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/logs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setLogs(data.logs);
            }
        } catch (error) {
            console.error('Failed to fetch logs', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadReport = async () => {
        setIsGenerating(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/seo-report', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to generate report');

            const data = await res.json();

            // Create Blob and Download
            const blob = new Blob(['\uFEFF' + JSON.stringify(data.report, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `seo-report-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(`Wygenerowano raport (${data.count} stron)`);
        } catch (error) {
            toast.error('Błąd generowania raportu');
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
        if (filterLevel !== 'ALL' && log.level !== filterLevel) return false;
        if (filterModule === 'GALLERY' && !GALLERY_MODULES.includes(log.module)) return false;
        return true;
    });

    const fmtTime = (iso: string) => {
        const d = new Date(iso);
        return {
            date: d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            time: d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
    };

    const getIcon = (level: string) => {
        switch (level) {
            case 'ERROR': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'WARN': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
                <h1 className="text-2xl font-bold text-white">Logi Systemowe</h1>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={downloadReport}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black rounded transition font-medium disabled:opacity-50"
                    >
                        <Download className={`w-4 h-4 ${isGenerating ? 'animate-bounce' : ''}`} />
                        {isGenerating ? 'Generowanie...' : 'Raport SEO'}
                    </button>
                    <button
                        onClick={fetchLogs}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded transition"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Odśwież
                    </button>
                </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
                {['ALL', 'INFO', 'WARN', 'ERROR'].map(level => (
                    <button
                        key={level}
                        onClick={() => setFilterLevel(level)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filterLevel === level
                            ? 'bg-gold-500 text-black'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                            }`}
                    >
                        {level === 'ALL' ? 'Wszystkie' : level}
                    </button>
                ))}
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
                <button
                    onClick={() => setFilterModule('ALL')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filterModule === 'ALL'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                >
                    Wszystkie moduły
                </button>
                <button
                    onClick={() => setFilterModule('GALLERY')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filterModule === 'GALLERY'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                >
                    🖼️ Aktywność klientów w galeriach
                </button>
            </div>

            {/* MOBILE: karty (czytelne, godzina na wierzchu) */}
            <div className="space-y-3 md:hidden">
                {filteredLogs.map(log => {
                    const t = fmtTime(log.created_at);
                    const friendly = FRIENDLY[log.message];
                    const details = describeMeta(log);
                    return (
                        <div key={log.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    {getIcon(log.level)}
                                    <span className={`text-xs font-semibold ${log.level === 'ERROR' ? 'text-red-400' :
                                        log.level === 'WARN' ? 'text-yellow-400' : 'text-blue-400'
                                        }`}>
                                        {log.level}
                                    </span>
                                    <span className="bg-zinc-800 px-2 py-0.5 rounded text-[11px] text-zinc-300 border border-zinc-700">
                                        {log.module}
                                    </span>
                                </div>
                                <div className="text-right leading-tight">
                                    <div className="text-sm font-semibold text-white tabular-nums">{t.time}</div>
                                    <div className="text-[11px] text-zinc-400 tabular-nums">{t.date}</div>
                                </div>
                            </div>
                            <div className="mt-2 text-sm text-zinc-100">
                                {friendly || log.message}
                            </div>
                            {details && (
                                <div className="mt-1 text-xs text-emerald-300">{details}</div>
                            )}
                            {log.metadata && (
                                <details className="mt-2 cursor-pointer">
                                    <summary className="text-[11px] text-zinc-500 hover:text-gold-400 select-none">Szczegóły techniczne</summary>
                                    <pre className="mt-2 bg-zinc-950 p-3 rounded text-[11px] overflow-auto max-h-64 border border-zinc-700 text-zinc-300 whitespace-pre-wrap break-words">
                                        {log.metadata}
                                    </pre>
                                </details>
                            )}
                        </div>
                    );
                })}
                {filteredLogs.length === 0 && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-12 text-center text-zinc-500">
                        Brak logów
                    </div>
                )}
            </div>

            {/* DESKTOP: tabela */}
            <div className="hidden md:block bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-800/50 text-zinc-400 font-medium border-b border-zinc-800">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">Czas</th>
                                <th className="px-6 py-4">Typ</th>
                                <th className="px-6 py-4">Moduł</th>
                                <th className="px-6 py-4">Zdarzenie</th>
                                <th className="px-6 py-4">Metadata</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {filteredLogs.map(log => {
                                const t = fmtTime(log.created_at);
                                const friendly = FRIENDLY[log.message];
                                const details = describeMeta(log);
                                return (
                                    <tr key={log.id} className="hover:bg-zinc-800/30 transition">
                                        <td className="px-6 py-4 text-zinc-300 whitespace-nowrap tabular-nums">
                                            <div className="font-semibold text-white">{t.time}</div>
                                            <div className="text-xs text-zinc-500">{t.date}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getIcon(log.level)}
                                                <span className={`font-semibold ${log.level === 'ERROR' ? 'text-red-400' :
                                                    log.level === 'WARN' ? 'text-yellow-400' : 'text-blue-400'
                                                    }`}>
                                                    {log.level}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-zinc-800 px-2 py-1 rounded text-xs text-zinc-300 border border-zinc-700 whitespace-nowrap">
                                                {log.module}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-200">
                                            <div>{friendly || log.message}</div>
                                            {details && <div className="mt-1 text-xs text-emerald-300">{details}</div>}
                                        </td>
                                        <td className="px-6 py-4 max-w-md text-zinc-500 font-mono text-xs">
                                            {log.metadata ? (
                                                <details className="cursor-pointer group">
                                                    <summary className="truncate hover:text-gold-400 select-none">📋 {log.metadata.length} znaków</summary>
                                                    <pre className="mt-2 bg-zinc-950 p-3 rounded text-xs overflow-auto max-h-64 border border-zinc-700 text-zinc-300 whitespace-pre-wrap break-words">
                                                        {log.metadata}
                                                    </pre>
                                                </details>
                                            ) : (
                                                <span className="text-zinc-700">-</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                        Brak logów
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
