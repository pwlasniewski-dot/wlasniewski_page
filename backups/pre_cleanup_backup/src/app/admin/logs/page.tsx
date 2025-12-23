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

    const filteredLogs = logs.filter(log => filterLevel === 'ALL' || log.level === filterLevel);

    const getIcon = (level: string) => {
        switch (level) {
            case 'ERROR': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'WARN': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Logi Systemowe</h1>
                <div className="flex gap-3">
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

            <div className="mb-6 flex gap-2">
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

            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-800/50 text-zinc-400 font-medium border-b border-zinc-800">
                            <tr>
                                <th className="px-6 py-4">Typ</th>
                                <th className="px-6 py-4">Moduł</th>
                                <th className="px-6 py-4">Wiadomość</th>
                                <th className="px-6 py-4">Metadata</th>
                                <th className="px-6 py-4">Czas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-zinc-800/30 transition">
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
                                        <span className="bg-zinc-800 px-2 py-1 rounded text-xs text-zinc-300 border border-zinc-700">
                                            {log.module}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-200">
                                        {log.message}
                                    </td>
                                    <td className="px-6 py-4 max-w-2xl text-zinc-500 font-mono text-xs">
                                        {log.metadata ? (
                                            <details className="cursor-pointer group">
                                                <summary className="truncate hover:text-gold-400 select-none">📋 {log.metadata.length} chars</summary>
                                                <pre className="mt-2 bg-zinc-950 p-3 rounded text-xs overflow-auto max-h-64 border border-zinc-700 text-zinc-300 whitespace-pre-wrap break-words">
                                                    {log.metadata}
                                                </pre>
                                            </details>
                                        ) : (
                                            <span className="text-zinc-700">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500 whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleString('pl-PL')}
                                    </td>
                                </tr>
                            ))}
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
