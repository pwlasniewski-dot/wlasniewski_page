
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
    Sparkles,
    MousePointer2,
    RotateCcw,
    ShieldAlert,
    CheckCircle2
} from 'lucide-react';
import CEODashboard from '@/components/admin/CEODashboard';
import BehaviorCharts from '@/components/admin/BehaviorCharts';

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dashboardLoading, setDashboardLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'behavior' | 'ceo'>('overview');
    const [isResetting, setIsResetting] = useState(false);
    const [isExcluded, setIsExcluded] = useState(false);

    useEffect(() => {
        setIsExcluded(localStorage.getItem('analytics_exclude') === 'true');
        loadSummary();
    }, []);

    const loadSummary = () => {
        setLoading(true);
        const token = localStorage.getItem('admin_token');
        fetch('/api/analytics/summary', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
            .then(res => res.json())
            .then(d => {
                setData(d);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        if (activeTab === 'behavior' && !dashboardData) {
            loadDashboard();
        }
    }, [activeTab, dashboardData]);

    const loadDashboard = () => {
        setDashboardLoading(true);
        const token = localStorage.getItem('admin_token');
        fetch('/api/analytics/dashboard', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
            .then(res => res.json())
            .then(d => {
                if (d.success) {
                    setDashboardData(d.data);
                }
                setDashboardLoading(false);
            })
            .catch(err => {
                console.error(err);
                setDashboardLoading(false);
            });
    };

    const handleReset = async () => {
        if (!confirm('Czy na pewno chcesz zresetować wszystkie dane analityczne? Tej operacji nie można cofnąć.')) return;

        setIsResetting(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/analytics/reset', {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (res.ok) {
                alert('Dane zostały zresetowane.');
                setData(null);
                setDashboardData(null);
                loadSummary();
                if (activeTab === 'behavior') loadDashboard();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsResetting(false);
        }
    };

    const toggleExclusion = () => {
        const newVal = !isExcluded;
        if (newVal) {
            localStorage.setItem('analytics_exclude', 'true');
        } else {
            localStorage.removeItem('analytics_exclude');
        }
        setIsExcluded(newVal);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-black">
                <Loader2 className="animate-spin text-zinc-500" size={32} />
            </div>
        );
    }

    const { summary, chartData, goals } = data || { summary: {}, chartData: { labels: [], revenueData: [] }, goals: [] };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2 tracking-tight">Business Analytics</h1>
                    <div className="flex gap-6 mt-6 border-b border-white/5">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'overview' ? 'text-yellow-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Overview
                            {activeTab === 'overview' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('behavior')}
                            className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'behavior' ? 'text-yellow-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            User Behavior
                            {activeTab === 'behavior' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('ceo')}
                            className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'ceo' ? 'text-yellow-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            CEO Dashboard
                            {activeTab === 'ceo' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500" />
                            )}
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={toggleExclusion}
                        className={`text-[10px] px-4 py-2 rounded-full transition-all border flex items-center gap-2 ${isExcluded ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-zinc-800 border-white/5 text-zinc-400 hover:bg-zinc-700'}`}
                    >
                        {isExcluded ? (
                            <> <CheckCircle2 size={12} /> Urządzenie Wykluczone </>
                        ) : (
                            <> <ShieldAlert size={12} /> Wyklucz Mnie </>
                        )}
                    </button>
                    <button
                        onClick={handleReset}
                        disabled={isResetting}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] px-4 py-2 rounded-full transition-colors border border-red-500/20 flex items-center gap-2 disabled:opacity-50"
                    >
                        {isResetting ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                        Resetuj Dane
                    </button>
                    <button className="bg-zinc-800 hover:bg-zinc-700 text-xs px-4 py-2 rounded-full transition-colors border border-white/5">Eksportuj Raport</button>
                    <button className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold text-xs px-5 py-2 rounded-full transition-all shadow-lg shadow-yellow-900/20">Nowy Cel</button>
                </div>
            </header>

            {activeTab === 'ceo' && <CEODashboard />}

            {activeTab === 'overview' && (
                <>
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <StatCard
                            title="Całkowity Przychód"
                            value={`${summary.totalRevenue || 0} zł`}
                            icon={<TrendingUp className="text-yellow-500" size={20} />}
                            trend={`+ Gallery: ${summary.galleryRevenue || 0} zł`}
                        />
                        <StatCard
                            title="Rezerwacje i Terminy"
                            value={summary.bookingsCount || 0}
                            icon={<Calendar className="text-blue-500" size={20} />}
                            trend="Aktywne rezerwacje"
                        />
                        <StatCard
                            title="Karty Podarunkowe"
                            value={summary.giftCardsCount || 0}
                            icon={<Gift className="text-purple-500" size={20} />}
                            trend="Sprzedane zamówienia"
                        />
                        <StatCard
                            title="Foto Wyzwania"
                            value={summary.challengesCount || 0}
                            icon={<Sparkles className="text-pink-500" size={20} />}
                            trend={`${summary.acceptedChallenges || 0} zaakceptowanych`}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                        {/* Revenue Chart */}
                        <div className="lg:col-span-2">
                            <AnalyticsCharts data={chartData} />
                        </div>

                        {/* Goals & Status */}
                        <div className="space-y-6">
                            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-6 flex items-center gap-2">
                                    <Target size={16} className="text-red-500" /> Cele Biznesowe
                                </h3>
                                {goals && goals.length > 0 ? goals.map((goal: any) => (
                                    <div key={goal.id} className="mb-6 last:mb-0">
                                        <div className="flex justify-between text-xs mb-2">
                                            <span className="text-zinc-300 font-medium">{goal.title}</span>
                                            <span className="text-zinc-500">{Math.round((goal.current_amount / goal.target_amount) * 100)}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-yellow-500 transition-all duration-1000"
                                                style={{ width: `${Math.min(100, (goal.current_amount / goal.target_amount) * 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-zinc-500 mt-2">
                                            {goal.current_amount} zł / {goal.target_amount} zł
                                        </p>
                                    </div>
                                )) : (
                                    <p className="text-xs text-zinc-600 italic">Brak zdefiniowanych celów.</p>
                                )}
                            </div>

                            {/* AI Suggestions / Insights */}
                            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Sparkles size={80} className="text-yellow-500" />
                                </div>
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                                        <Sparkles className="text-yellow-500" size={18} />
                                    </div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Silnik Sugestii BI</h3>
                                </div>

                                <p className="text-[10px] text-zinc-500 mb-6 leading-relaxed bg-yellow-500/5 p-3 rounded-xl border border-yellow-500/10">
                                    <Sparkles size={10} className="inline mr-1 text-yellow-500" />
                                    Nasze sugestie są generowane na podstawie analizy lejka konwersji, czasu spędzonego na kluczowych podstronach oraz historycznych wzorców rezerwacji. To realne wnioski wyciągnięte z zachowań Twoich klientów.
                                </p>

                                <div className="space-y-4">
                                    {data.aiSuggestions && data.aiSuggestions.length > 0 ? (
                                        data.aiSuggestions.map((suggestion: any) => (
                                            <div key={suggestion.id} className={`p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer border-l-2 ${suggestion.priority === 'HIGH' ? 'border-l-red-500' : 'border-l-yellow-500'
                                                }`}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="text-sm font-medium">{suggestion.title}</h4>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${suggestion.priority === 'HIGH' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                                                        }`}>
                                                        {suggestion.priority}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-zinc-500 leading-relaxed">{suggestion.description}</p>
                                                {suggestion.action_label && (
                                                    <button className="mt-3 text-[10px] font-bold text-yellow-500 hover:text-yellow-400 uppercase tracking-wider flex items-center gap-1">
                                                        {suggestion.action_label} <ArrowUpRight size={10} />
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center border-2 border-dashed border-zinc-800 rounded-xl">
                                            <p className="text-xs text-zinc-600 italic">Brak nowych sugestii BI...</p>
                                            <p className="text-[10px] text-zinc-700 mt-2">Działaj dalej, system analizuje Twoje postępy!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scrum Board Section */}
                    <section className="mt-16">
                        <div className="mb-8 flex justify-between items-end">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Operational Scrum Board</h2>
                                <p className="text-zinc-500 text-sm">Zarządzaj bieżącymi operacjami i kampaniami marketingowymi.</p>
                            </div>
                        </div>
                        <ScrumBoard />
                    </section>
                </>
            )}

            {activeTab === 'behavior' && (
                <div className="space-y-10">
                    {dashboardLoading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loader2 className="animate-spin text-zinc-500" size={32} />
                        </div>
                    ) : dashboardData ? (
                        <>
                            <BehaviorCharts data={dashboardData} />
                            {/* Scrum Board also at bottom of behavior for convenience */}
                            <section className="mt-16 border-t border-white/5 pt-16">
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold mb-2">Operational Scrum Board</h2>
                                    <p className="text-zinc-500 text-sm">Zarządzaj zadaniami bez przełączania widoku.</p>
                                </div>
                                <ScrumBoard />
                            </section>
                        </>
                    ) : (
                        <div className="p-12 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
                            <p className="text-zinc-500">Brak danych analitycznych do wyświetlenia.</p>
                        </div>
                    )}
                </div>
            )}
        </div >
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
