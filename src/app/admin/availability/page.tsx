'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Lock, Unlock, Loader2, X } from 'lucide-react';
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

export default function AdminAvailabilityPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [days, setDays] = useState<DayState[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const [selectedDay, setSelectedDay] = useState<DayState | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [blockReason, setBlockReason] = useState('');

    useEffect(() => {
        fetchAvailability();
    }, [currentDate]);

    const fetchAvailability = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;

            console.log('Fetching availability for:', { year, month, hasToken: !!token });

            const res = await fetch(`/api/provider/availability?year=${year}&month=${month}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                console.error('Fetch failed:', res.status, res.statusText);
                toast.error(`Błąd API: ${res.status}`);
                setLoading(false);
                return;
            }

            const data = await res.json();
            console.log('API Response:', data);

            if (data.success) {
                generateCalendar(data.blocks || [], data.bookings || []);
            } else {
                console.error('API Error:', data.error);
                toast.error(data.error || 'Błąd danych');
            }
        } catch (error) {
            console.error('Network error:', error);
            toast.error('Błąd ładowania kalendarza');
        } finally {
            setLoading(false);
        }
    };

    const generateCalendar = (blocks: any[], bookings: any[]) => {
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);

            // Adjust day index for Poland (Monday start)
            // getDay(): 0=Sun, 1=Mon...6=Sat
            // We want Mon=0, Sun=6
            let startingDayIndex = firstDay.getDay() - 1;
            if (startingDayIndex < 0) startingDayIndex = 6;

            const totalDays = lastDay.getDate();

            console.log('Generating Calendar:', {
                year,
                month: month + 1,
                firstDay: firstDay.toDateString(),
                startingDayIndex,
                totalDays
            });

            const calendarDays: DayState[] = [];

            // Previous month filler
            const prevMonthLastDay = new Date(year, month, 0).getDate();
            for (let i = 0; i < startingDayIndex; i++) {
                calendarDays.push({
                    date: new Date(year, month - 1, prevMonthLastDay - startingDayIndex + i + 1),
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
                const block = blocks.find((b: any) => new Date(b.date).toISOString().startsWith(dateStr));
                // Find booking
                const booking = bookings.find((b: any) => new Date(b.date).toISOString().startsWith(dateStr));

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

            // Fill remaining slots
            const currentSize = calendarDays.length;
            const remaining = 42 - currentSize; // Ensure at least 6 rows (6*7=42) or just multiple of 7
            // Let's just fill to end of week
            const fillToEnd = (7 - (currentSize % 7)) % 7;

            for (let i = 1; i <= fillToEnd; i++) {
                calendarDays.push({
                    date: new Date(year, month + 1, i),
                    isCurrentMonth: false,
                    isToday: false,
                    isBlocked: false,
                    isBooked: false
                });
            }

            console.log('Total Days Generated:', calendarDays.length);
            setDays(calendarDays);
        } catch (e) {
            console.error('Error in generateCalendar:', e);
            toast.error('Błąd generowania widoku');
        }
    };

    const handleDayClick = (day: DayState) => {
        if (!day.isCurrentMonth) return;
        setSelectedDay(day);
        setBlockReason(day.reason || 'Urlop / Niedostępność');
        setIsModalOpen(true);
    };

    const handleSaveBlock = async () => {
        if (!selectedDay) return;
        setUpdating(true);
        const dateStr = selectedDay.date.toISOString();
        const shouldBlock = !selectedDay.isBlocked; // Toggle logic if using simple button, OR based on modal state if specialized

        // Actually, if modal is open, we want to SET availability explicitly.
        // Let's assume the modal has "Zablokuj" and "Odblokuj" buttons.
        // Or if it IS blocked, show "Odblokuj". If IS NOT blocked, show "Zablokuj".

        // This function will be triggered by specific buttons in Modal.
    };

    const toggleBlock = async (blocked: boolean) => {
        if (!selectedDay) return;
        setUpdating(true);
        const dateStr = selectedDay.date.toISOString();
        const token = localStorage.getItem('admin_token');

        try {
            if (!blocked) {
                // Odblokuj -> DELETE
                await fetch(`/api/provider/availability?date=${dateStr}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                toast.success('Termin odblokowany');
            } else {
                // Zablokuj -> POST
                await fetch('/api/provider/availability', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        date: dateStr,
                        is_available: false,
                        reason: blockReason
                    })
                });
                toast.success('Termin zablokowany');
            }

            // Refresh calendar
            await fetchAvailability();
            setIsModalOpen(false);
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
                        <CalendarIcon className="text-gold-500" /> Dostępność Admina (Grafik)
                    </h1>
                    <p className="text-zinc-400">Kliknij w dzień na kalendarzu, aby dodać blokadę (urlop, choroba) lub zarządzać terminem.</p>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm relative">
                {/* Headers & Grid ... as before ... */}
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
                                onClick={() => handleDayClick(day)}
                                className={`
                                    relative min-h-[100px] p-2 rounded-lg border transition-all cursor-pointer flex flex-col justify-between
                                    ${!day.isCurrentMonth ? 'opacity-30 bg-zinc-950 border-transparent pointer-events-none' : ''}
                                    ${day.isToday ? 'ring-1 ring-gold-500' : ''}
                                    ${day.isBooked
                                        ? 'bg-blue-900/20 border-blue-900/50 cursor-pointer' // Allow clicking booked days to see info
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
                                </div>

                                {day.isBooked && (
                                    <div className="text-[10px] bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded mt-1 truncate">
                                        {day.bookingInfo}
                                    </div>
                                )}
                                {day.isBlocked && !day.isBooked && (
                                    <div className="text-[10px] text-red-400 text-center mt-auto truncate" title={day.reason}>
                                        {day.reason || 'Niedostępny'}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Legend ... */}
                <div className="mt-6 flex gap-6 text-sm text-zinc-400 border-t border-zinc-800 pt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-900/20 border border-blue-900/50"></div>
                        <span>Zlecenie (Zajęte)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-900/20 border border-red-900/50"></div>
                        <span>Zablokowane</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-zinc-800/50 border border-zinc-700"></div>
                        <span>Wolny termin</span>
                    </div>
                </div>

                {/* MODAL */}
                {isModalOpen && selectedDay && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm rounded-xl" onClick={() => setIsModalOpen(false)}>
                        <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl shadow-xl max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        {selectedDay.date.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </h3>
                                    <p className="text-sm text-zinc-400">Zarządzanie terminem</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
                            </div>

                            {selectedDay.isBooked ? (
                                <div className="p-4 bg-blue-900/20 border border-blue-900/50 rounded-lg">
                                    <p className="text-blue-300 font-bold mb-1">📅 Termin zajęty przez rezerwację</p>
                                    <p className="text-sm text-zinc-300">{selectedDay.bookingInfo}</p>
                                    <p className="text-xs text-zinc-500 mt-2">Aby edytować rezerwację, przejdź do zakładki "Złożone rezerwacje".</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-300">Powód blokady:</label>
                                        <input
                                            type="text"
                                            value={blockReason}
                                            onChange={e => setBlockReason(e.target.value)}
                                            placeholder="np. Urlop, Choroba, Sprawy prywatne"
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-gold-500 outline-none"
                                        />
                                        <div className="flex gap-2 flex-wrap text-xs">
                                            {['Urlop', 'Choroba', 'Sesja Prywatna', 'Inne'].map(r => (
                                                <button
                                                    key={r}
                                                    onClick={() => setBlockReason(r)}
                                                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-zinc-300"
                                                >
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        {selectedDay.isBlocked ? (
                                            <button
                                                onClick={() => toggleBlock(false)}
                                                className="col-span-2 w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium border border-zinc-600 transition-colors"
                                            >
                                                Odblokuj termin
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => toggleBlock(true)}
                                                className="col-span-2 w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
                                            >
                                                Zablokuj termin
                                            </button>
                                        )}
                                    </div>

                                    <div className="border-t border-zinc-800 pt-3 mt-2">
                                        <p className="text-xs text-zinc-500 text-center mb-2">Potrzebujesz dodać klienta ręcznie?</p>
                                        <button
                                            disabled
                                            className="w-full py-2 bg-zinc-800/50 text-zinc-500 rounded-lg text-sm border border-zinc-800 cursor-not-allowed"
                                        >
                                            + Dodaj Rezerwację (Wkrótce)
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
