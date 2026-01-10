'use client';

import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, History, Wallet, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PayoutsPage() {
    const [loading, setLoading] = useState(true);
    const [balanceData, setBalanceData] = useState<any>(null);
    const [requesting, setRequesting] = useState(false);

    useEffect(() => {
        fetchPayouts();
    }, []);

    const fetchPayouts = async () => {
        try {
            const token = localStorage.getItem('token'); // or admin_token if admin impersonating? Usually provider uses standard token.
            // Wait, provider login stores token where?
            // Assuming 'token' for now.

            const res = await fetch('/api/provider/payouts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                setBalanceData(data);
            } else {
                toast.error(data.error || 'Błąd pobierania danych');
            }
        } catch (error) {
            toast.error('Błąd połączenia');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestPayout = async () => {
        if (!balanceData || balanceData.balance <= 0) return;

        if (!confirm(`Czy na pewno chcesz zlecić wypłatę ${formatMoney(balanceData.balance)}?`)) return;

        setRequesting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/provider/payouts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount: balanceData.balance })
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Zlecenie wypłaty przyjęte');
                fetchPayouts(); // Refresh
            } else {
                toast.error(data.error || 'Błąd zlecenia');
            }
        } catch (error) {
            toast.error('Wystąpił błąd');
        } finally {
            setRequesting(false);
        }
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(amount / 100);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-zinc-500" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <header>
                <h1 className="text-3xl font-bold font-display text-white mb-2">Finanse i Wypłaty</h1>
                <p className="text-zinc-400">Zarządzaj swoimi zarobkami i zlecaj wypłaty środków.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                        <Wallet size={64} className="text-emp" />
                    </div>
                    <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Dostępne Środki</p>
                    <div className="text-4xl font-bold text-white mb-4">
                        {balanceData ? formatMoney(balanceData.balance) : '0,00 zł'}
                    </div>

                    <button
                        onClick={handleRequestPayout}
                        disabled={!balanceData || balanceData.balance <= 0 || requesting}
                        className={`
                            w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all
                            ${(!balanceData || balanceData.balance <= 0)
                                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                : 'bg-emp hover:bg-emp-hover text-black shadow-lg shadow-emp/20 hover:shadow-emp/40'
                            }
                        `}
                    >
                        {requesting ? <Loader2 size={18} className="animate-spin" /> : <ArrowUpRight size={18} />}
                        {(!balanceData || balanceData.balance <= 0) ? 'Brak środków' : 'Zleć wypłatę'}
                    </button>
                    <p className="text-xs text-zinc-500 mt-3 text-center">
                        Prowizja platformy: 15% (automatycznie odliczona)
                    </p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                    <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Łącznie Zarobione</p>
                    <div className="text-3xl font-bold text-white mb-1">
                        {balanceData ? formatMoney(balanceData.totalEarned) : '0,00 zł'}
                    </div>
                    <div className="text-sm text-zinc-500 flex items-center gap-1">
                        <TrendingUp size={14} className="text-green-500" />
                        <span>Brutto (po prowizji)</span>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                    <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Wypłacono</p>
                    <div className="text-3xl font-bold text-white mb-1">
                        {balanceData ? formatMoney(balanceData.totalPaid) : '0,00 zł'}
                    </div>
                    <div className="text-sm text-zinc-500 flex items-center gap-1">
                        <History size={14} />
                        <span>Historia wypłat</span>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Historia Wypłat</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-950 text-zinc-500 text-xs uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Kwota</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-sm text-zinc-300">
                            {balanceData?.payouts?.length > 0 ? (
                                balanceData.payouts.map((payout: any) => (
                                    <tr key={payout.id} className="hover:bg-zinc-800/50 transition">
                                        <td className="px-6 py-4">
                                            {new Date(payout.created_at).toLocaleDateString('pl-PL', {
                                                day: '2-digit', month: 'long', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white">
                                            {formatMoney(payout.amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={payout.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right text-zinc-600 font-mono text-xs">
                                            #{payout.id}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                        Brak historii wypłat
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

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'pending':
            return <span className="inline-flex items-center px-2 py-1 rounded bg-orange-500/10 text-orange-400 text-xs font-medium border border-orange-500/20">Oczekuje</span>;
        case 'paid':
        case 'approved':
            return <span className="inline-flex items-center px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">Zrealizowano</span>;
        case 'rejected':
            return <span className="inline-flex items-center px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20">Odrzucono</span>;
        default:
            return <span className="inline-flex items-center px-2 py-1 rounded bg-zinc-700 text-zinc-300 text-xs font-medium">Inny</span>;
    }
}
