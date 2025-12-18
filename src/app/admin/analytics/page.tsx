
'use client';

import React, { useState, useEffect } from 'react';
import AnalyticsCharts from '@/components/admin/AnalyticsCharts';
import ScrumBoard from '@/components/admin/ScrumBoard';
import {
    TrendingUp,
    Calendar,
    Gift,
    Target,
    ArrowUpRight,
    Loader2,
    Sparkles
} from 'lucide-react';

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/analytics/summary')
            .then(res => res.json())
            .then(d => {
                setData(d);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-black">
                <Loader2 className="animate-spin text-zinc-500" size={32} />
            </div>
        );
    }

    const { summary, chartData, goals } = data;

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-2 tracking-tight">Business Analytics</h1>
                    <p className="text-zinc-500 text-sm">Przegląd przychodów, celów i zadań operacyjnych.</p>
                </div>
                <div className="flex gap-3">
                    <button className="bg-zinc-800 hover:bg-zinc-700 text-xs px-4 py-2 rounded-full transition-colors border border-white/5">Eksportuj Raport</button>
                    <button className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold text-xs px-5 py-2 rounded-full transition-all shadow-lg shadow-yellow-900/20">Nowy Cel</button>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard
                    title="Całkowity Przychód"
                    value={`${summary.totalRevenue} zł`}
                    icon={<TrendingUp className="text-yellow-500" size={20} />}
                    trend="+12% vs ost. miesiąc"
                />
                <StatCard
                    title="Rezerwacje"
                    value={summary.bookingsCount}
                    icon={<Calendar className="text-blue-500" size={20} />}
                    trend="Aktywne zlecenia"
                />
                <StatCard
                    title="Karty Podarunkowe"
                    value={summary.giftCardsCount}
                    icon={<Gift className="text-purple-500" size={20} />}
                    trend="Sprzedane w tym roku"
                />
                <StatCard
                    title="Status Celów"
                    value={goals.length > 0 ? `${Math.round((goals[0].current_amount / goals[0].target_amount) * 100)}%` : '0%'}
                    icon={<Target className="text-red-500" size={20} />}
                    trend={goals.length > 0 ? goals[0].title : 'Brak celów'}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                {/* Revenue Chart */}
                <div className="lg:col-span-2">
                    <AnalyticsCharts data={chartData} />
                </div>

                {/* AI Suggestions / Insights */}
                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Sparkles size={120} className="text-yellow-500" />
                    </div>
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-yellow-500/10 rounded-lg">
                            <Sparkles className="text-yellow-500" size={18} />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Sugestie AI</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                            <h4 className="text-sm font-medium mb-1">Pozyskiwanie B2B</h4>
                            <p className="text-xs text-zinc-500 leading-relaxed">System wykrył niski popyt na sesje portretowe. AI sugeruje wysyłkę ofert "Wizerunek Biznesowy" do firm IT w regionie.</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                            <h4 className="text-sm font-medium mb-1">Optymalizacja Ceny</h4>
                            <p className="text-xs text-zinc-500 leading-relaxed">Pakiet Standard ma najwyższą klikalność ale najniższą konwersję. Rozważ zmianę liczby zdjęć z 10 na 12.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrum Board Section */}
            <section className="mt-16">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-2">Operational Scrum Board</h2>
                    <p className="text-zinc-500 text-sm">Zarządzaj bieżącymi operacjami i kampaniami marketingowymi.</p>
                </div>
                <ScrumBoard />
            </section>
        </div>
    );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string | number, icon: any, trend: string }) {
    return (
        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm hover:border-zinc-800 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-zinc-800 rounded-xl group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <ArrowUpRight className="text-zinc-700 group-hover:text-zinc-500" size={16} />
            </div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
            <h4 className="text-2xl font-bold mb-2 tracking-tight">{value}</h4>
            <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-[10px] text-zinc-500 font-medium">{trend}</span>
            </div>
        </div>
    );
}
