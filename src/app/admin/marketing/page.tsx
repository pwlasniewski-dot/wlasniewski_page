/**
 * Marketing analytics panel.
 * Shows:
 *  - Inquiries grouped by `source` (np. promo_maj2026, facebook, google, organic)
 *  - AnalyticsEvent UTM landings grouped by utm_campaign
 *  - Conversion = inquiries / utm_landings per campaign
 */
import prisma from '@/lib/db/prisma';
import Link from 'next/link';
import { TrendingUp, Users, Target, ArrowUpRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getStats() {
    const [inquiriesBySource, utmLandings, recentInquiries] = await Promise.all([
        prisma.inquiry.groupBy({
            by: ['source'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
        }),
        prisma.analyticsEvent.groupBy({
            by: ['utm_campaign', 'utm_source'],
            where: { event_type: 'utm_landing' },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
        }),
        prisma.inquiry.findMany({
            where: { source: { not: null } },
            orderBy: { created_at: 'desc' },
            take: 20,
        }),
    ]);

    return { inquiriesBySource, utmLandings, recentInquiries };
}

export default async function MarketingPage() {
    const { inquiriesBySource, utmLandings, recentInquiries } = await getStats();

    const totalLeads = inquiriesBySource.reduce((s, x) => s + x._count.id, 0);
    const totalLandings = utmLandings.reduce((s, x) => s + x._count.id, 0);
    const conversionRate = totalLandings > 0 ? ((totalLeads / totalLandings) * 100).toFixed(1) : '—';

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-gold-400" />
                    Marketing & Konwersje
                </h1>
                <p className="text-zinc-400 mt-1">Skąd przychodzą klienci i które kampanie konwertują.</p>
            </div>

            {/* KPI */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-zinc-400">Wejścia z UTM</span>
                        <Target className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-3xl font-bold text-white">{totalLandings}</div>
                </div>
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-zinc-400">Pozyskane leady</span>
                        <Users className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="text-3xl font-bold text-white">{totalLeads}</div>
                </div>
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-zinc-400">Konwersja</span>
                        <ArrowUpRight className="w-5 h-5 text-gold-400" />
                    </div>
                    <div className="text-3xl font-bold text-gold-400">{conversionRate}%</div>
                </div>
            </div>

            {/* Inquiries by source */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                    <h2 className="text-xl font-semibold text-white mb-4">Leady według źródła</h2>
                    {inquiriesBySource.length === 0 ? (
                        <p className="text-zinc-500 text-sm">Brak danych. Pierwszy lead pojawi się gdy ktoś wypełni formularz.</p>
                    ) : (
                        <div className="space-y-2">
                            {inquiriesBySource.map((row) => (
                                <div key={row.source ?? 'null'} className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg">
                                    <span className="text-zinc-300 font-mono text-sm">{row.source || '(brak)'}</span>
                                    <span className="text-gold-400 font-bold">{row._count.id}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                    <h2 className="text-xl font-semibold text-white mb-4">Wejścia UTM (kampanie)</h2>
                    {utmLandings.length === 0 ? (
                        <p className="text-zinc-500 text-sm">Brak. Uruchom kampanię z UTM-em w URL-u (np. <code>?utm_source=facebook&utm_campaign=maj2026</code>).</p>
                    ) : (
                        <div className="space-y-2">
                            {utmLandings.map((row, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg">
                                    <div>
                                        <div className="text-zinc-300 font-mono text-sm">{row.utm_campaign || '(brak)'}</div>
                                        <div className="text-zinc-500 text-xs">{row.utm_source}</div>
                                    </div>
                                    <span className="text-blue-400 font-bold">{row._count.id}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent leads */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                <h2 className="text-xl font-semibold text-white mb-4">Ostatnie zapytania (z taggowaniem)</h2>
                {recentInquiries.length === 0 ? (
                    <p className="text-zinc-500 text-sm">Brak.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-zinc-400 border-b border-zinc-800">
                                <tr>
                                    <th className="text-left py-2 px-3">Data</th>
                                    <th className="text-left py-2 px-3">Imię</th>
                                    <th className="text-left py-2 px-3">Email</th>
                                    <th className="text-left py-2 px-3">Telefon</th>
                                    <th className="text-left py-2 px-3">Typ</th>
                                    <th className="text-left py-2 px-3">Źródło</th>
                                    <th className="text-left py-2 px-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentInquiries.map((q) => (
                                    <tr key={q.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                        <td className="py-2 px-3 text-zinc-400 text-xs">{new Date(q.created_at).toLocaleString('pl-PL')}</td>
                                        <td className="py-2 px-3 text-white">{q.name}</td>
                                        <td className="py-2 px-3 text-zinc-300">{q.email}</td>
                                        <td className="py-2 px-3 text-zinc-300">{q.phone || '—'}</td>
                                        <td className="py-2 px-3 text-zinc-300">{q.session_type || '—'}</td>
                                        <td className="py-2 px-3"><span className="px-2 py-0.5 bg-gold-500/10 text-gold-400 rounded text-xs font-mono">{q.source}</span></td>
                                        <td className="py-2 px-3">
                                            <span className={`px-2 py-0.5 rounded text-xs ${q.status === 'new' ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-700 text-zinc-300'}`}>
                                                {q.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-gold-500/10 to-amber-500/10 border border-gold-500/30 rounded-2xl">
                <h3 className="text-lg font-semibold text-white mb-2">📋 Jak używać UTM-ów</h3>
                <p className="text-zinc-300 text-sm mb-3">Doklejaj te parametry do każdego linka w reklamach:</p>
                <div className="space-y-1 font-mono text-xs">
                    <div className="text-zinc-400">FB Ads:    <code className="text-blue-300">?utm_source=facebook&utm_medium=cpc&utm_campaign=rodzinne_maj2026</code></div>
                    <div className="text-zinc-400">Google:    <code className="text-blue-300">?utm_source=google&utm_medium=cpc&utm_campaign=fotograf_torun</code></div>
                    <div className="text-zinc-400">Instagram: <code className="text-blue-300">?utm_source=instagram&utm_medium=story&utm_campaign=komunie_maj2026</code></div>
                </div>
                <p className="text-zinc-400 text-xs mt-3">
                    Aktualny landing sprzedażowy: <Link href="/rezerwacja" className="text-gold-400 underline">rezerwacja</Link>
                </p>
            </div>
        </div>
    );
}
