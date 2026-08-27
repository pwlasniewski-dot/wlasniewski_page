'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    BOOKING_SERVICE_KEYS,
    BOOKING_SERVICE_LABELS,
    formatScheduleMinute,
    type BookingScheduleException,
    type BookingScheduleRule,
    type BookingServiceKey,
} from '@/lib/bookingSchedule';
import { dateISOInTimeZone } from '@/lib/bookingDate';

type Configuration = {
    serviceKey: BookingServiceKey;
    rules: BookingScheduleRule[];
    exceptions: BookingScheduleException[];
    persisted: boolean;
};

const DAY_LABELS = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];
const START_OPTIONS = Array.from({ length: 48 }, (_, index) => index * 30);
const END_OPTIONS = Array.from({ length: 52 }, (_, index) => (index + 1) * 30);

function TimeSelect(props: {
    value: number;
    options: number[];
    disabled?: boolean;
    onChange: (value: number) => void;
    ariaLabel: string;
}) {
    return (
        <select
            value={props.value}
            disabled={props.disabled}
            onChange={event => props.onChange(Number(event.target.value))}
            aria-label={props.ariaLabel}
            className="min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
            {props.options.map(value => (
                <option key={value} value={value}>{formatScheduleMinute(value)}</option>
            ))}
        </select>
    );
}

export default function BookingAvailabilityEditor() {
    const [configurations, setConfigurations] = useState<Configuration[]>([]);
    const [activeService, setActiveService] = useState<BookingServiceKey>('SESJA');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [exceptionDate, setExceptionDate] = useState('');
    const [exceptionMode, setExceptionMode] = useState<'CLOSED' | 'CUSTOM'>('CLOSED');
    const [exceptionStart, setExceptionStart] = useState(17 * 60);
    const [exceptionEnd, setExceptionEnd] = useState(22 * 60);
    const [exceptionInterval, setExceptionInterval] = useState(60);
    const [exceptionNote, setExceptionNote] = useState('');

    const loadConfiguration = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/booking-availability', { cache: 'no-store' });
            const payload = await response.json();
            if (!response.ok || !Array.isArray(payload?.configurations)) {
                throw new Error(payload?.message || 'Nie udało się pobrać grafiku.');
            }
            setConfigurations(payload.configurations);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Nie udało się pobrać grafiku.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadConfiguration();
    }, []);

    useEffect(() => {
        setExceptionDate('');
        setExceptionNote('');
    }, [activeService]);

    const activeConfiguration = useMemo(
        () => configurations.find(item => item.serviceKey === activeService),
        [activeService, configurations],
    );

    const updateRule = (weekday: number, patch: Partial<BookingScheduleRule>) => {
        setConfigurations(current => current.map(configuration => configuration.serviceKey !== activeService
            ? configuration
            : {
                ...configuration,
                rules: configuration.rules.map(rule => {
                    if (rule.weekday !== weekday) return rule;
                    const next = { ...rule, ...patch };
                    if (patch.startMinute !== undefined && next.endMinute <= next.startMinute) {
                        next.endMinute = Math.min(1560, next.startMinute + 60);
                    }
                    return next;
                }),
            }));
    };

    const saveWeeklySchedule = async () => {
        if (!activeConfiguration) return;
        if (activeConfiguration.rules.some(rule => rule.enabled && rule.endMinute <= rule.startMinute)) {
            toast.error('Godzina zakończenia musi być późniejsza niż rozpoczęcia.');
            return;
        }
        setSaving(true);
        try {
            const response = await fetch('/api/admin/booking-availability', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serviceKey: activeService, rules: activeConfiguration.rules }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.message || 'Nie udało się zapisać grafiku.');
            toast.success(`Grafik „${BOOKING_SERVICE_LABELS[activeService]}” został zapisany.`);
            await loadConfiguration();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Nie udało się zapisać grafiku.');
        } finally {
            setSaving(false);
        }
    };

    const saveException = async () => {
        if (!exceptionDate) {
            toast.error('Wybierz datę wyjątku.');
            return;
        }
        if (exceptionMode === 'CUSTOM' && exceptionEnd <= exceptionStart) {
            toast.error('Godzina zakończenia musi być późniejsza niż rozpoczęcia.');
            return;
        }
        setSaving(true);
        try {
            const response = await fetch('/api/admin/booking-availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceKey: activeService,
                    date: exceptionDate,
                    mode: exceptionMode,
                    startMinute: exceptionStart,
                    endMinute: exceptionEnd,
                    slotIntervalMinutes: exceptionInterval,
                    note: exceptionNote,
                }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.message || 'Nie udało się zapisać wyjątku.');
            toast.success('Wyjątek został zapisany.');
            setExceptionDate('');
            setExceptionNote('');
            await loadConfiguration();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Nie udało się zapisać wyjątku.');
        } finally {
            setSaving(false);
        }
    };

    const deleteException = async (id?: number) => {
        if (!id) return;
        setSaving(true);
        try {
            const response = await fetch(`/api/admin/booking-availability?exceptionId=${id}`, { method: 'DELETE' });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.message || 'Nie udało się usunąć wyjątku.');
            toast.success('Wyjątek został usunięty.');
            await loadConfiguration();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Nie udało się usunąć wyjątku.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="mb-10 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
            <div className="border-b border-zinc-800 p-6">
                <div className="flex items-start gap-3">
                    <CalendarClock className="mt-1 h-6 w-6 shrink-0 text-amber-400" />
                    <div>
                        <h2 className="text-2xl font-bold text-white">Grafik rezerwacji</h2>
                        <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-400">
                            Ustaw realne godziny pracy dla każdej usługi. Zakończenie po północy jest opisane jako „następnego dnia”, więc nie ma nieczytelnych godzin 24:00 ani 26:00.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto border-b border-zinc-800 p-4" role="tablist" aria-label="Rodzaj usługi">
                {BOOKING_SERVICE_KEYS.map(serviceKey => (
                    <button
                        key={serviceKey}
                        type="button"
                        role="tab"
                        aria-selected={activeService === serviceKey}
                        onClick={() => setActiveService(serviceKey)}
                        className={`min-h-11 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${activeService === serviceKey
                            ? 'bg-amber-600 text-white'
                            : 'border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                    >
                        {BOOKING_SERVICE_LABELS[serviceKey]}
                    </button>
                ))}
            </div>

            {loading || !activeConfiguration ? (
                <div className="p-8 text-center text-zinc-400">Ładowanie grafiku…</div>
            ) : (
                <div className="space-y-8 p-4 md:p-6">
                    {!activeConfiguration.persisted && (
                        <div className="rounded-lg border border-amber-700/60 bg-amber-950/30 p-4 text-sm text-amber-200">
                            Widoczny jest bezpieczny grafik startowy. Zapis będzie dostępny po wdrożeniu migracji bazy.
                        </div>
                    )}

                    <div className="space-y-3">
                        {activeConfiguration.rules.map(rule => (
                            <div key={rule.weekday} className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 md:grid-cols-[160px_100px_1fr_1fr_130px] md:items-end">
                                <div>
                                    <span className="block text-xs uppercase tracking-wide text-zinc-500">Dzień</span>
                                    <span className="mt-2 block font-semibold text-white">{DAY_LABELS[rule.weekday - 1]}</span>
                                </div>
                                <label className="flex min-h-11 items-center gap-2 text-sm text-zinc-300">
                                    <input
                                        type="checkbox"
                                        checked={rule.enabled}
                                        onChange={event => updateRule(rule.weekday, { enabled: event.target.checked })}
                                        className="h-4 w-4 rounded"
                                    />
                                    Otwarte
                                </label>
                                <div>
                                    <label className="mb-1 block text-xs text-zinc-500">Od</label>
                                    <TimeSelect
                                        value={rule.startMinute}
                                        options={START_OPTIONS}
                                        disabled={!rule.enabled}
                                        onChange={value => updateRule(rule.weekday, { startMinute: value })}
                                        ariaLabel={`${DAY_LABELS[rule.weekday - 1]} od`}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs text-zinc-500">Do</label>
                                    <TimeSelect
                                        value={rule.endMinute}
                                        options={END_OPTIONS.filter(value => value > rule.startMinute)}
                                        disabled={!rule.enabled}
                                        onChange={value => updateRule(rule.weekday, { endMinute: value })}
                                        ariaLabel={`${DAY_LABELS[rule.weekday - 1]} do`}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs text-zinc-500">Start co</label>
                                    <select
                                        value={rule.slotIntervalMinutes}
                                        disabled={!rule.enabled}
                                        onChange={event => updateRule(rule.weekday, { slotIntervalMinutes: Number(event.target.value) })}
                                        className="min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white disabled:opacity-40"
                                    >
                                        <option value={60}>60 min</option>
                                        <option value={30}>30 min</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={saveWeeklySchedule}
                            disabled={saving}
                            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 font-semibold text-white transition hover:bg-amber-500 disabled:cursor-wait disabled:opacity-60"
                        >
                            <Save className="h-4 w-4" /> Zapisz grafik tygodniowy
                        </button>
                    </div>

                    <div className="border-t border-zinc-800 pt-8">
                        <h3 className="text-lg font-bold text-white">Wyjątek dla konkretnej daty</h3>
                        <p className="mt-1 text-sm text-zinc-400">Zamknij dzień lub jednorazowo ustaw inne godziny, np. urlop, święto albo dodatkowy wolny termin.</p>

                        <div className="mt-4 grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 md:grid-cols-2 lg:grid-cols-6 lg:items-end">
                            <div>
                                <label className="mb-1 block text-xs text-zinc-500">Data</label>
                                <input
                                    type="date"
                                    value={exceptionDate}
                                    min={dateISOInTimeZone(new Date(), 'Europe/Warsaw')}
                                    onChange={event => setExceptionDate(event.target.value)}
                                    className="min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-zinc-500">Tryb</label>
                                <select
                                    value={exceptionMode}
                                    onChange={event => setExceptionMode(event.target.value as 'CLOSED' | 'CUSTOM')}
                                    className="min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                                >
                                    <option value="CLOSED">Dzień zamknięty</option>
                                    <option value="CUSTOM">Inne godziny</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-zinc-500">Od</label>
                                <TimeSelect
                                    value={exceptionStart}
                                    options={START_OPTIONS}
                                    disabled={exceptionMode === 'CLOSED'}
                                    onChange={value => {
                                        setExceptionStart(value);
                                        if (exceptionEnd <= value) setExceptionEnd(Math.min(1560, value + 60));
                                    }}
                                    ariaLabel="Wyjątek od"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-zinc-500">Do</label>
                                <TimeSelect value={exceptionEnd} options={END_OPTIONS.filter(value => value > exceptionStart)} disabled={exceptionMode === 'CLOSED'} onChange={setExceptionEnd} ariaLabel="Wyjątek do" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-zinc-500">Start co</label>
                                <select
                                    value={exceptionInterval}
                                    disabled={exceptionMode === 'CLOSED'}
                                    onChange={event => setExceptionInterval(Number(event.target.value))}
                                    className="min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white disabled:opacity-40"
                                >
                                    <option value={60}>60 min</option>
                                    <option value={30}>30 min</option>
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={saveException}
                                disabled={saving}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-amber-600 px-4 py-2 font-semibold text-amber-300 transition hover:bg-amber-950/40 disabled:opacity-60"
                            >
                                <Plus className="h-4 w-4" /> Zapisz wyjątek
                            </button>
                            <div className="md:col-span-2 lg:col-span-6">
                                <label className="mb-1 block text-xs text-zinc-500">Notatka wewnętrzna (opcjonalnie)</label>
                                <input
                                    type="text"
                                    maxLength={160}
                                    value={exceptionNote}
                                    onChange={event => setExceptionNote(event.target.value)}
                                    placeholder="np. urlop, dodatkowy termin"
                                    className="min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                                />
                            </div>
                        </div>

                        {activeConfiguration.exceptions.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {activeConfiguration.exceptions.map(exception => (
                                    <div key={exception.id || `${exception.serviceKey}-${exception.date}`} className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="font-semibold text-white">{new Date(`${exception.date}T12:00:00`).toLocaleDateString('pl-PL', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                            <p className="mt-1 text-sm text-zinc-400">
                                                {exception.mode === 'CLOSED'
                                                    ? 'Dzień zamknięty'
                                                    : `${formatScheduleMinute(exception.startMinute || 0)}–${formatScheduleMinute(exception.endMinute || 0)}`}
                                                {exception.note ? ` · ${exception.note}` : ''}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => deleteException(exception.id)}
                                            disabled={saving}
                                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-900/60 px-3 py-2 text-sm text-red-300 hover:bg-red-950/30 disabled:opacity-60"
                                        >
                                            <Trash2 className="h-4 w-4" /> Usuń
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
