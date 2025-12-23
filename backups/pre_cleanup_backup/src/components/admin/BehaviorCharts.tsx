
'use client';

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area
} from 'recharts';
import {
    Users,
    MousePointer2,
    ArrowRight,
    TrendingUp,
    Globe,
    Smartphone,
    Monitor,
    Tablet,
    ArrowDown
} from 'lucide-react';

interface BehaviorData {
    totalViews: number;
    todayViews: number;
    uniqueVisitors: number;
    avgSessionDuration: string;
    bounceRate: number;
    viewsChart: any[];
    sources: any[];
    devices: any[];
    topPages: any[];
    conversions: any;
    funnel: any[];
}

export default function BehaviorCharts({ data }: { data: BehaviorData }) {
    const COLORS = ['#d4af37', '#b8860b', '#8b4513', '#5d4037', '#3e2723'];

    return (
        <div className="space-y-8 pb-12">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Users size={20} className="text-blue-500" />
                        </div>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Unikalni Widzowie</span>
                    </div>
                    <h3 className="text-2xl font-bold">{data.uniqueVisitors}</h3>
                    <p className="text-[10px] text-zinc-500 mt-1">W wybranym okresie</p>
                </div>
                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-yellow-500/10 rounded-lg">
                            <MousePointer2 size={20} className="text-yellow-500" />
                        </div>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Wyświetlenia Dzisiaj</span>
                    </div>
                    <h3 className="text-2xl font-bold">{data.todayViews}</h3>
                    <p className="text-[10px] text-zinc-500 mt-1">Ostatnie 24h</p>
                </div>
                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <TrendingUp size={20} className="text-green-500" />
                        </div>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Współczynnik Konwersji</span>
                    </div>
                    <h3 className="text-2xl font-bold">{data.conversions.conversionRate}%</h3>
                    <p className="text-[10px] text-zinc-500 mt-1">Page view to booking</p>
                </div>
                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Globe size={20} className="text-purple-500" />
                        </div>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Bounces Rate</span>
                    </div>
                    <h3 className="text-2xl font-bold">{data.bounceRate}%</h3>
                    <p className="text-[10px] text-zinc-500 mt-1">Single page sessions</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Funnel Analysis */}
                <div className="bg-zinc-900/50 p-8 rounded-3xl border border-white/5 backdrop-blur-sm">
                    <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                        <ArrowDown size={20} className="text-yellow-500" /> Lejek Sprzedażowy
                    </h3>
                    <div className="space-y-6">
                        {data.funnel.map((step, index) => (
                            <div key={index} className="relative">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-xs font-medium text-zinc-400">{step.step}</span>
                                    <span className="text-sm font-bold text-white">{step.count}</span>
                                </div>
                                <div className="w-full h-8 bg-zinc-800/50 rounded-lg overflow-hidden flex">
                                    <div
                                        className="h-full bg-gradient-to-r from-yellow-600/40 to-yellow-500/60 transition-all duration-1000"
                                        style={{ width: `${(step.count / data.funnel[0].count) * 100}%` }}
                                    />
                                </div>
                                {index < data.funnel.length - 1 && (
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-zinc-600 flex items-center gap-1">
                                        <ArrowDown size={10} /> {step.dropoff}% drop-off
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Traffic Sources */}
                <div className="bg-zinc-900/50 p-8 rounded-3xl border border-white/5 backdrop-blur-sm">
                    <h3 className="text-lg font-bold mb-8">Źródła Ruchu</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.sources}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.sources.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #333', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        {data.sources.map((source, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-xs text-zinc-400">{source.name}</span>
                                <span className="text-xs font-bold">{source.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Device Distribution */}
                <div className="bg-zinc-900/50 p-8 rounded-3xl border border-white/5 backdrop-blur-sm">
                    <h3 className="text-lg font-bold mb-8">Urządzenia</h3>
                    <div className="flex justify-around items-center h-48">
                        {data.devices.map((device, index) => (
                            <div key={index} className="text-center group">
                                <div className="p-4 bg-zinc-800 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                                    {device.name === 'Desktop' && <Monitor size={32} className="text-blue-400" />}
                                    {device.name === 'Mobile' && <Smartphone size={32} className="text-green-400" />}
                                    {device.name === 'Tablet' && <Tablet size={32} className="text-purple-400" />}
                                </div>
                                <h4 className="text-sm font-bold text-white mb-1">{device.value}%</h4>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{device.name}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Pages */}
                <div className="bg-zinc-900/50 p-8 rounded-3xl border border-white/5 backdrop-blur-sm">
                    <h3 className="text-lg font-bold mb-8">Najpopularniejsze Strony</h3>
                    <div className="space-y-4">
                        {data.topPages.map((page, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                                        {index + 1}
                                    </div>
                                    <span className="text-sm font-medium text-zinc-300">{page.page}</span>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-white">{page.views}</p>
                                        <p className="text-[10px] text-zinc-600 uppercase">Widoki</p>
                                    </div>
                                    <div className="text-right min-w-[60px]">
                                        <p className="text-xs font-medium text-yellow-500">{page.avgTime}</p>
                                        <p className="text-[10px] text-zinc-600 uppercase">Avg Czas</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
