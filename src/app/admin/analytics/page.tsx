'use client';

import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
    Eye, TrendingUp, Users, Target, Calendar, Smartphone, Monitor,
    Globe, ArrowUpRight, ArrowDownRight, MousePointerClick, ShoppingCart
} from 'lucide-react';

interface AnalyticsData {
    // Overview
    totalViews: number;
    todayViews: number;
    uniqueVisitors: number;
    avgSessionDuration: string;
    bounceRate: number;

    // Charts
    viewsChart: Array<{ date: string; views: number; visitors: number }>;

    // Sources
    sources: Array<{ name: string; value: number; change: number }>;

    // Devices
    devices: Array<{ name: string; value: number }>;

    // Top Pages
    topPages: Array<{ page: string; views: number; avgTime: string }>;

    // Conversions
    conversions: {
        bookingsStarted: number;
        bookingsCompleted: number;
        conversionRate: number;
        totalRevenue: number;
        avgOrderValue: number;
    };

    // Funnel
    funnel: Array<{ step: string; count: number; dropoff: number }>;
}

const COLORS = ['#fbbf24', '#60a5fa', '#34d399', '#f472b6', '#a78bfa'];

const tabs = [
    { id: 'overview', label: 'Ogólne', icon: Eye },
    { id: 'conversions', label: 'Konwersje', icon: Target },
    { id: 'sources', label: 'Źródła', icon: Globe },
    { id: 'pages', label: 'Strony', icon: MousePointerClick },
];

export default function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [dateRange, setDateRange] = useState('7d');
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/analytics/dashboard?range=${dateRange}`);
            const result = await res.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch analytics', error);
            // Set mock data for demo
            setData(getMockData());
        } finally {
            setLoading(false);
        }
    };

    const getMockData = (): AnalyticsData => ({
        totalViews: 2847,
        todayViews: 142,
        uniqueVisitors: 1523,
        avgSessionDuration: '2:34',
        bounceRate: 42.3,
        viewsChart: [
            { date: 'Pon', views: 320, visitors: 180 },
            { date: 'Wt', views: 450, visitors: 245 },
            { date: 'Śr', views: 380, visitors: 198 },
            { date: 'Czw', views: 520, visitors: 312 },
            { date: 'Pt', views: 610, visitors: 389 },
            { date: 'Sob', views: 425, visitors: 267 },
            { date: 'Nd', views: 142, visitors: 89 },
        ],
        sources: [
            { name: 'Google', value: 45, change: 12 },
            { name: 'Facebook', value: 28, change: -5 },
            { name: 'Instagram', value: 15, change: 8 },
            { name: 'Bezpośrednie', value: 8, change: 2 },
            { name: 'Inne', value: 4, change: 0 },
        ],
        devices: [
            { name: 'Mobile', value: 62 },
            { name: 'Desktop', value: 34 },
            { name: 'Tablet', value: 4 },
        ],
        topPages: [
            { page: '/', views: 1245, avgTime: '1:45' },
            { page: '/portfolio', views: 567, avgTime: '3:12' },
            { page: '/rezerwacja', views: 423, avgTime: '4:30' },
            { page: '/fotograf-torun', views: 312, avgTime: '2:15' },
            { page: '/o-mnie', views: 289, avgTime: '1:58' },
        ],
        conversions: {
            bookingsStarted: 89,
            bookingsCompleted: 23,
            conversionRate: 25.8,
            totalRevenue: 45600,
            avgOrderValue: 1982,
        },
        funnel: [
            { step: 'Strona główna', count: 1245, dropoff: 0 },
            { step: 'Portfolio / Oferta', count: 567, dropoff: 54.5 },
            { step: 'Strona rezerwacji', count: 423, dropoff: 25.4 },
            { step: 'Wypełnienie formularza', count: 89, dropoff: 79.0 },
            { step: 'Wysłanie rezerwacji', count: 23, dropoff: 74.2 },
        ],
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-display font-semibold text-white">Analityka</h1>
                    <p className="text-zinc-400 text-sm mt-1">Szczegółowe statystyki Twojej strony</p>
                </div>

                {/* Date Range Selector */}
                <div className="flex gap-2">
                    {[
                        { value: '7d', label: '7 dni' },
                        { value: '30d', label: '30 dni' },
                        { value: '90d', label: '90 dni' },
                    ].map(range => (
                        <button
                            key={range.value}
                            onClick={() => setDateRange(range.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === range.value
                                    ? 'bg-gold-500 text-black'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-zinc-900 p-1 rounded-xl mb-8 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${activeTab === tab.id
                                ? 'bg-gold-500 text-black'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            title="Wyświetlenia"
                            value={data.totalViews.toLocaleString()}
                            change={12}
                            icon={Eye}
                            color="gold"
                        />
                        <StatCard
                            title="Unikalni użytkownicy"
                            value={data.uniqueVisitors.toLocaleString()}
                            change={8}
                            icon={Users}
                            color="blue"
                        />
                        <StatCard
                            title="Śr. czas sesji"
                            value={data.avgSessionDuration}
                            change={-3}
                            icon={Calendar}
                            color="green"
                        />
                        <StatCard
                            title="Bounce Rate"
                            value={`${data.bounceRate}%`}
                            change={-5}
                            icon={TrendingUp}
                            color="purple"
                            invertChange
                        />
                    </div>

                    {/* Main Chart */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-6">Ruch na stronie</h2>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.viewsChart}>
                                    <defs>
                                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                    <XAxis dataKey="date" stroke="#71717a" tick={{ fill: '#71717a' }} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#71717a" tick={{ fill: '#71717a' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: 8 }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="views" stroke="#fbbf24" fillOpacity={1} fill="url(#colorViews)" name="Wyświetlenia" />
                                    <Area type="monotone" dataKey="visitors" stroke="#60a5fa" fillOpacity={1} fill="url(#colorVisitors)" name="Użytkownicy" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Devices & Sources */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Devices */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-6">Urządzenia</h2>
                            <div className="flex items-center justify-center h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.devices}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {data.devices.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: 8 }}
                                            formatter={(value: number) => [`${value}%`, '']}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-6 mt-4">
                                {data.devices.map((device, index) => (
                                    <div key={device.name} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                                        <span className="text-sm text-zinc-400">{device.name} ({device.value}%)</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Sources */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-6">Źródła ruchu</h2>
                            <div className="space-y-4">
                                {data.sources.slice(0, 4).map((source, index) => (
                                    <div key={source.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                                            <span className="text-white">{source.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium">{source.value}%</span>
                                            <span className={`text-xs ${source.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {source.change >= 0 ? '+' : ''}{source.change}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'conversions' && (
                <div className="space-y-6">
                    {/* Conversion Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            title="Rezerwacje rozpoczęte"
                            value={data.conversions.bookingsStarted.toString()}
                            icon={ShoppingCart}
                            color="blue"
                        />
                        <StatCard
                            title="Rezerwacje wysłane"
                            value={data.conversions.bookingsCompleted.toString()}
                            icon={Target}
                            color="green"
                        />
                        <StatCard
                            title="Współczynnik konwersji"
                            value={`${data.conversions.conversionRate}%`}
                            icon={TrendingUp}
                            color="gold"
                        />
                        <StatCard
                            title="Śr. wartość rezerwacji"
                            value={`${data.conversions.avgOrderValue} zł`}
                            icon={Calendar}
                            color="purple"
                        />
                    </div>

                    {/* Conversion Funnel */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-6">Lejek konwersji</h2>
                        <div className="space-y-4">
                            {data.funnel.map((step, index) => {
                                const maxCount = data.funnel[0].count;
                                const percentage = (step.count / maxCount) * 100;

                                return (
                                    <div key={step.step}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-white font-medium">{step.step}</span>
                                            <div className="flex items-center gap-4">
                                                <span className="text-zinc-400">{step.count} użytkowników</span>
                                                {step.dropoff > 0 && (
                                                    <span className="text-red-400 text-sm">-{step.dropoff.toFixed(1)}%</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="h-8 bg-zinc-800 rounded-lg overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-gold-500 to-gold-400 rounded-lg transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Revenue */}
                    <div className="bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/30 rounded-xl p-8 text-center">
                        <h3 className="text-zinc-400 text-sm uppercase tracking-wider mb-2">Przychód z rezerwacji</h3>
                        <p className="text-5xl font-bold text-gold-400">{data.conversions.totalRevenue.toLocaleString()} zł</p>
                        <p className="text-zinc-400 mt-2">w wybranym okresie</p>
                    </div>
                </div>
            )}

            {activeTab === 'sources' && (
                <div className="space-y-6">
                    {/* Sources Table */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-zinc-950">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">Źródło</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-zinc-400 uppercase">Udział</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-zinc-400 uppercase">Zmiana</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-zinc-400 uppercase">Trend</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {data.sources.map((source, index) => (
                                    <tr key={source.name} className="hover:bg-zinc-800/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                                                <span className="text-white font-medium">{source.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{ width: `${source.value}%`, backgroundColor: COLORS[index] }}
                                                    />
                                                </div>
                                                <span className="text-white w-12">{source.value}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={source.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                                                {source.change >= 0 ? '+' : ''}{source.change}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {source.change >= 0 ? (
                                                <ArrowUpRight className="w-4 h-4 text-green-400 inline" />
                                            ) : (
                                                <ArrowDownRight className="w-4 h-4 text-red-400 inline" />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'pages' && (
                <div className="space-y-6">
                    {/* Top Pages */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-zinc-800">
                            <h2 className="text-lg font-semibold text-white">Najpopularniejsze strony</h2>
                        </div>
                        <table className="w-full">
                            <thead className="bg-zinc-950">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">Strona</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-zinc-400 uppercase">Wyświetlenia</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-zinc-400 uppercase">Śr. czas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {data.topPages.map((page, index) => (
                                    <tr key={page.page} className="hover:bg-zinc-800/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-zinc-500 w-6">{index + 1}.</span>
                                                <span className="text-white font-mono text-sm">{page.page}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gold-400 font-medium">{page.views.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-zinc-400">{page.avgTime}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// Stat Card Component
function StatCard({
    title,
    value,
    change,
    icon: Icon,
    color,
    invertChange = false
}: {
    title: string;
    value: string;
    change?: number;
    icon: any;
    color: string;
    invertChange?: boolean;
}) {
    const colorClasses: Record<string, string> = {
        gold: 'text-gold-400 bg-gold-500/10',
        blue: 'text-blue-400 bg-blue-500/10',
        green: 'text-green-400 bg-green-500/10',
        purple: 'text-purple-400 bg-purple-500/10',
    };

    const isPositive = invertChange ? (change !== undefined && change < 0) : (change !== undefined && change >= 0);

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
                <span className="text-zinc-400 text-sm">{title}</span>
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>
            <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-white">{value}</span>
                {change !== undefined && (
                    <span className={`text-sm flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(change)}%
                    </span>
                )}
            </div>
        </div>
    );
}
