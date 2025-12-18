
'use client';

import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

interface ChartData {
    labels: string[];
    revenueData: number[];
}

export default function AnalyticsCharts({ data }: { data: ChartData }) {
    const chartData = data.labels.map((label, index) => ({
        name: label,
        revenue: data.revenueData[index]
    }));

    return (
        <div className="w-full h-[350px] bg-zinc-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
            <h3 className="text-sm font-medium text-zinc-400 mb-6 uppercase tracking-wider">Przychody (PLN)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="#666"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#666"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value} zł`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#18181b',
                            border: '1px solid #333',
                            borderRadius: '8px'
                        }}
                        itemStyle={{ color: '#d4af37' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#d4af37"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRev)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
