'use client';

import { useEffect, useState } from 'react';
import {
    DollarSign,
    TrendingUp,
    Calendar,
    Package,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function ProviderDashboard() {
    const [user, setUser] = useState<{ name: string, email: string } | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userStr = localStorage.getItem('provider_user');
        if (userStr) {
            try {
                setUser(JSON.parse(userStr));
            } catch (e) { }
        }
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('provider_token');
            const res = await fetch('/api/provider/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to load stats');
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(amount / 100);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Brak';
        return new Date(dateStr).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' });
    };

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white">
                        Witaj, {user?.name || 'Partnerze'} 👋
                    </h1>
                    <p className="text-zinc-400 mt-1">
                        Oto podsumowanie Twojej działalności w ekosystemie.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href="/provider-panel/availability" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors border border-zinc-700 flex items-center gap-2">
                        <Calendar size={16} /> Grafik
                    </Link>
                    <Link href="/provider-panel/packages" className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black rounded-lg text-sm font-bold transition-colors shadow-lg shadow-gold-500/10 flex items-center gap-2">
                        <Package size={16} /> Dodaj Pakiet
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenue */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign size={64} />
                    </div>
                    <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Przychód (Msc)</p>
                    <h3 className="text-3xl font-bold text-white mt-1">
                        {loading ? <Loader2 className="animate-spin w-6 h-6" /> : formatMoney(stats?.monthlyRevenue || 0)}
                    </h3>
                    <div className="mt-4 flex items-center gap-1 text-emerald-400 text-xs font-medium bg-emerald-400/10 w-fit px-2 py-1 rounded-full">
                        <TrendingUp size={12} /> Netto (dla Ciebie)
                    </div>
                </div>

                {/* Bookings */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <CheckCircle2 size={64} />
                    </div>
                    <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Zlecenia (Msc)</p>
                    <h3 className="text-3xl font-bold text-white mt-1">
                        {loading ? '-' : (stats?.monthlyBookingsCount || 0)}
                    </h3>
                    <p className="text-zinc-600 text-xs mt-4">
                        {stats?.pendingCount > 0 ? `${stats.pendingCount} oczekujących` : 'Wszystko na bieżąco'}
                    </p>
                </div>

                {/* Next Session */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Calendar size={64} />
                    </div>
                    <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Najbliższa Sesja</p>
                    <h3 className="text-xl font-bold text-white mt-1">
                        {loading ? '-' : (stats?.nextSession ? formatDate(stats.nextSession.date) : 'Brak')}
                    </h3>
                    <p className="text-zinc-600 text-xs mt-4 truncate">
                        {stats?.nextSession?.service || 'Kalendarz pusty'}
                    </p>
                </div>

                {/* Account Status */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group border-l-4 border-l-gold-500">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <AlertCircle size={64} />
                    </div>
                    <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Status Konta</p>
                    <h3 className="text-xl font-bold text-emerald-400 mt-1">Aktywne</h3>
                    <p className="text-zinc-600 text-xs mt-4">Prowizja systemu: standardowa</p>
                </div>
            </div>

            {/* Recent Activity / Empty State */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                    <h3 className="font-bold text-white">Szybkie Akcje</h3>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link href="/provider-panel/profile" className="flex items-center gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-gold-500/50 transition-colors group">
                        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-gold-400 transition-colors">
                            <span className="font-display font-bold text-lg">W</span>
                        </div>
                        <div>
                            <h4 className="text-white font-bold">Uzupełnij Wizytówkę</h4>
                            <p className="text-sm text-zinc-500">Dodaj opis i specjalizacje, aby klienci chętniej Cię wybierali.</p>
                        </div>
                    </Link>

                    <Link href="/provider-panel/availability" className="flex items-center gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-gold-500/50 transition-colors group">
                        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-gold-400 transition-colors">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h4 className="text-white font-bold">Zaktualizuj Kalendarz</h4>
                            <p className="text-sm text-zinc-500">Zablokuj dni wolne, aby uniknąć niechcianych rezerwacji.</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
