'use client';

import { useEffect, useState } from 'react';
import { getApiUrl } from '@/lib/api-config';
import Link from 'next/link';
import DashboardCalendarWidget from '@/components/admin/DashboardCalendarWidget';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        userCount: 0,
        settingsCount: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch dashboard stats
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('admin_token');
                const res = await fetch(getApiUrl('test-db'), {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await res.json();
                if (data.success) {
                    setStats({
                        userCount: data.userCount,
                        settingsCount: data.settingsCount
                    });
                }
            } catch (error) {
                console.error('Failed to fetch stats', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-display font-semibold text-white">Pulpit</h1>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Card 1 */}
                <div className="overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800 shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                {/* Icon placeholder */}
                                <div className="h-10 w-10 rounded-md bg-gold-500/10 flex items-center justify-center">
                                    <span className="text-gold-500 text-xl">👥</span>
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="truncate text-sm font-medium text-zinc-400">Administratorzy</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-white">{loading ? '...' : stats.userCount}</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800 shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-md bg-blue-500/10 flex items-center justify-center">
                                    <span className="text-blue-500 text-xl">⚙️</span>
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="truncate text-sm font-medium text-zinc-400">Ustawienia</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-white">{loading ? '...' : stats.settingsCount}</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-lg font-medium text-white mb-4">Szybkie akcje</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Link href="/admin/portfolio/new" className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-gold-500/50 transition-colors text-left group">
                        <h3 className="text-gold-400 font-medium group-hover:text-gold-300">Dodaj nową sesję</h3>
                        <p className="text-sm text-zinc-500 mt-1">Stwórz nowy wpis w portfolio</p>
                    </Link>
                    <Link href="/admin/blog/new" className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-gold-500/50 transition-colors text-left group">
                        <h3 className="text-gold-400 font-medium group-hover:text-gold-300">Napisz post na bloga</h3>
                        <p className="text-sm text-zinc-500 mt-1">Podziel się wiedzą z klientami</p>
                    </Link>
                    <Link href="/admin/socio" className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-gold-500/50 transition-colors text-left group">
                        <h3 className="text-gold-400 font-medium group-hover:text-gold-300">Zarządzaj terminami</h3>
                        <p className="text-sm text-zinc-500 mt-1">Zaktualizuj licznik wolnych miejsc</p>
                    </Link>
                    <Link href="/admin/warsztaty" className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-gold-500/50 transition-colors text-left group">
                        <h3 className="text-gold-400 font-medium group-hover:text-gold-300">Warsztaty fotograficzne</h3>
                        <p className="text-sm text-zinc-500 mt-1">Generuj konta dla dzieci, drukuj karty z PIN-ami</p>
                    </Link>
                </div>
            </div>

            {/* Kalendarz - najblizsze sesje */}
            <div className="mt-8">
                <DashboardCalendarWidget />
            </div>

            {/* Ostatnia Aktywność */}
            <div className="mt-8">
                <h2 className="text-lg font-medium text-white mb-4">Ostatnia Aktywność</h2>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow">
                    <ActivityFeed />
                </div>
            </div>
        </div>
    );
}

function ActivityFeed() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const token = localStorage.getItem('admin_token');
                const res = await fetch('/api/admin/dashboard/activity', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setLogs(data.logs);
                }
            } catch (error) {
                console.error('Failed to fetch activity', error);
            } finally {
                setLoading(false);
            }
        };
        fetchActivity();
    }, []);

    if (loading) return <div className="p-6 text-center text-zinc-500">Ładowanie aktywności...</div>;
    if (logs.length === 0) return <div className="p-6 text-center text-zinc-500">Brak nowej aktywności</div>;

    return (
        <ul className="divide-y divide-zinc-800">
            {logs.map((log: any) => (
                <li key={log.id} className="p-4 hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-white">{log.message || log.action}</p>
                            {log.details && (
                                <pre className="mt-1 text-xs text-zinc-500 max-w-2xl overflow-hidden text-ellipsis">
                                    {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                                </pre>
                            )}
                        </div>
                        <div className="text-xs text-zinc-500 ml-4 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString()}
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
