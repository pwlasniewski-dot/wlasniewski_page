'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Lock, Unlock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface DayState {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isBlocked: boolean; // By provider
    isBooked: boolean; // By client
    bookingInfo?: string;
    reason?: string;
}

export default function AvailabilityPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [days, setDays] = useState<DayState[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchAvailability();
    }, [currentDate]);

    const fetchAvailability = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('provider_token');
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;

            const res = await fetch(`/api/provider/availability?year=${year}&month=${month}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                generateCalendar(data.blocks || [], data.bookings || []);
            }
        } catch (error) {
            toast.error('Błąd ładowania kalendarza');
        } finally {
            setLoading(false);
        }
    };

    const generateCalendar = (blocks: any[], bookings: any[]) => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const startingDayIndex = (firstDay.getDay() + 6) % 7; // Mon = 0
        const totalDays = lastDay.getDate();

        const calendarDays: DayState[] = [];

        // Previous month filler
        for (let i = 0; i < startingDayIndex; i++) {
            calendarDays.push({
                date: new Date(year, month, -startingDayIndex + i + 1),
                isCurrentMonth: false,
                isToday: false,
                isBlocked: false,
                isBooked: false
            });
        }

        // Current month
        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(year, month, i);
            const dateStr = date.toISOString().split('T')[0];

            // Find block
            const block = blocks.find((b: any) => new Date(b.date).toISOString().split('T')[0] === dateStr);
            // Find booking
            const booking = bookings.find((b: any) => new Date(b.date).toISOString().split('T')[0] === dateStr);

            calendarDays.push({
                date,
                isCurrentMonth: true,
                isToday: new Date().toDateString() === date.toDateString(),
                isBlocked: block ? !block.is_available : false,
                reason: block?.reason,
                isBooked: !!booking,
                bookingInfo: booking ? `${booking.service} (${booking.client_name})` : undefined
            });
        }

        setDays(calendarDays);
    };

    const toggleDate = async (day: DayState) => {
        if (!day.isCurrentMonth || day.isBooked) return;
        if (updating) return;

        setUpdating(true);
        const newStatus = !day.isBlocked; // Toggle
        const dateStr = day.date.toISOString();

        try {
            const token = localStorage.getItem('provider_token');
            if (!newStatus) {
                // Unblock -> Delete availability record
                // Actually my API logic for POST was: create/update.
                // If I want to unblock, I should probably delete the record or set is_available = true.
                // Let's us DELETE for unblocking to keep DB clean, or POST with is_available=true.
                // Optimization: DELETE if unblocking (is_available = true default)

                // BUT, wait. If I block, I set is_available = false. 
                // If I want to unblock, I can set is_available = true.
                // Let's simplify and use DELETE for removing the block logic.
                await fetch(`/api/provider/availability?date=${dateStr}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } else {
                // Block
                await fetch('/api/provider/availability', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        date: dateStr,
                        is_available: false, // Blocked
                        reason: 'Urlop / Niedostępność'
                    })
                });
            }

            // Optimistic Update
            setDays(prev => prev.map(d => {
                if (d.date.toDateString() === day.date.toDateString()) {
                    return { ...d, isBlocked: newStatus, reason: newStatus ? 'Zablokowane' : undefined };
                }
                return d;
            }));
            toast.success(newStatus ? 'Termin zablokowany' : 'Termin odblokowany');

        } catch (error) {
            toast.error('Wystąpił błąd');
        } finally {
            setUpdating(false);
        }
    };

    const changeMonth = (delta: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
    };

    const monthNames = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
    const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                        <CalendarIcon className="text-gold-500" /> Dostępność
                    </h1>
                    <p className="text-zinc-400">Zarządzaj swoim grafikiem i urlopami</p>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                {/* Calendar Header */}
                <div className="flex justify-between items-center mb-8">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition">
                        <ChevronLeft />
                    </button>
                    <h2 className="text-xl font-bold text-white">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition">
                        <ChevronRight />
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {weekDays.map(day => (
                        <div key={day} className="text-center text-xs font-bold text-zinc-500 uppercase py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {loading ? (
                    <div className="h-64 flex items-center justify-center text-zinc-500">
                        <Loader2 className="animate-spin mr-2" /> Ładowanie grafiku...
                    </div>
                ) : (
                    <div className="grid grid-cols-7 gap-2">
                        {days.map((day, idx) => (
                            <div
                                key={idx}
                                onClick={() => toggleDate(day)}
                                className={`
                                    relative min-h-[100px] p-2 rounded-lg border transition-all cursor-pointer flex flex-col justify-between
                                    ${!day.isCurrentMonth ? 'opacity-30 bg-zinc-950 border-transparent pointer-events-none' : ''}
                                    ${day.isToday ? 'ring-1 ring-gold-500' : ''}
                                    ${day.isBooked
                                        ? 'bg-blue-900/20 border-blue-900/50 cursor-not-allowed'
                                        : day.isBlocked
                                            ? 'bg-red-900/20 border-red-900/50 hover:bg-red-900/30'
                                            : 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600'
                                    }
                                `}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={`text-sm font-medium ${day.isToday ? 'text-gold-400' : 'text-zinc-300'}`}>
                                        {day.date.getDate()}
                                    </span>
                                    {day.isBooked && <Lock size={12} className="text-blue-400" />}
                                    {!day.isBooked && day.isBlocked && <Lock size={12} className="text-red-400" />}
                                    {!day.isBooked && !day.isBlocked && day.isCurrentMonth && <Unlock size={12} className="text-zinc-600 opacity-0 group-hover:opacity-100" />}
                                </div>

                                {day.isBooked && (
                                    <div className="text-[10px] bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded mt-1 truncate">
                                        {day.bookingInfo}
                                    </div>
                                )}
                                {day.isBlocked && !day.isBooked && (
                                    <div className="text-[10px] text-red-400 text-center mt-auto">
                                        Niedostępny
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-6 flex gap-6 text-sm text-zinc-400 border-t border-zinc-800 pt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-900/20 border border-blue-900/50"></div>
                        <span>Zlecenie (Zajęte)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-900/20 border border-red-900/50"></div>
                        <span>Zablokowane przez Ciebie</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-zinc-800/50 border border-zinc-700"></div>
                        <span>Wolny termin</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
