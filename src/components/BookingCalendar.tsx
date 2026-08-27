"use client";

import React, { useEffect, useMemo, useState } from "react";
import { isCurrentOrPastMonth, isPastBookingDate } from "@/lib/bookingDate";
import {
  parseCalendarAvailabilityPayload,
  type CalendarDayAvailability,
} from "@/lib/bookingAvailability";

export type ServiceType = "Sesja" | "Ślub" | "Przyjęcie" | "Urodziny" | "Dron";

type Props = {
  service: ServiceType;
  durationHours?: 1 | 2;
  sessionDuration?: 1 | 2; // Alias for durationHours
  // Support both interfaces
  value?: { date: string; start?: string; end?: string } | null;
  selectedDate?: Date | null;
  // Backwards-compatible aliases used in some pages
  selectedSlot?: { date: string; start?: string; end?: string } | null;
  onChange?: ((val: { date: string; start?: string; end?: string } | null) => void) | ((date: Date | null) => void);
  onSlotSelect?: ((val: { date: string; start?: string; end?: string } | null) => void) | ((date: Date | null) => void);
  availabilityEndpoint?: string;
  showTimeSlots?: boolean;
};

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const fromMinutes = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
const overlap = (aS: string, aE: string, bS: string, bE: string) =>
  Math.max(toMinutes(aS), toMinutes(bS)) < Math.min(toMinutes(aE), toMinutes(bE));

function sessionStartsForDate(dateISO: string): string[] {
  const d = new Date(dateISO + "T12:00:00");
  const day = d.getDay();
  const isWeekend = day === 0 || day === 6;
  return isWeekend ? ["17:00", "19:00"] : ["18:00"];
}

function buildSessionSlots(dateISO: string, durationHours: 1 | 2): { start: string; end: string }[] {
  const starts = sessionStartsForDate(dateISO);
  const durMin = durationHours * 60;
  return starts.map((s) => {
    const e = fromMinutes(toMinutes(s) + durMin);
    return { start: s, end: e };
  });
}

export default function BookingCalendar(props: Props) {
  const {
    service,
    durationHours: propDurationHours,
    sessionDuration,
    value: propValue,
    selectedDate,
    onChange,
    // legacy aliases
    selectedSlot,
    onSlotSelect,
    availabilityEndpoint,
    showTimeSlots = true,
  } = props;

  // Normalize inputs
  const durationHours = sessionDuration || propDurationHours || 1;

  // Convert selectedDate (Date | null) to value format if needed
  const value = propValue !== undefined
    ? propValue
    : selectedDate
      ? { date: selectedDate.toISOString().split('T')[0] }
      : null;

  // Normalize legacy `selectedSlot` / `onSlotSelect` props
  const effectiveValue = value !== undefined && value !== null ? value : (selectedSlot !== undefined ? selectedSlot : value);
  const effectiveOnChange = onChange ?? onSlotSelect;

  const [cursor, setCursor] = useState<Date>(() => new Date());
  const ym = useMemo(() => `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}`, [cursor]);

  const [availability, setAvailability] = useState<Record<string, CalendarDayAvailability>>({});
  const [minBookingDate, setMinBookingDate] = useState<string | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<"loading" | "ready" | "error">("loading");
  const [availabilityReload, setAvailabilityReload] = useState(0);

  useEffect(() => {
    const url =
      availabilityEndpoint ??
      `/api/bookings?mode=availability&ym=${encodeURIComponent(ym)}&service=${encodeURIComponent(service)}`;
    let alive = true;
    const controller = new AbortController();
    setAvailability({});
    setMinBookingDate(null);
    setAvailabilityStatus("loading");

    void (async () => {
      try {
        const response = await fetch(url, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error("availability_request_failed");

        const parsed = parseCalendarAvailabilityPayload(data);
        if (!parsed) throw new Error("availability_payload_invalid");
        if (!alive) return;

        setAvailability(parsed.availability);
        setMinBookingDate(parsed.minBookingDate);
        setAvailabilityStatus("ready");
      } catch (error) {
        if (!alive || controller.signal.aborted) return;
        console.error("[BookingCalendar] Availability unavailable", error);
        setAvailability({});
        setMinBookingDate(null);
        setAvailabilityStatus("error");
        (effectiveOnChange as ((value: { date: string; start?: string; end?: string } | null) => void) | undefined)?.(null);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
    // effectiveOnChange is intentionally captured for fail-closed cleanup only;
    // inline consumer callbacks must not cause repeated availability requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ym, service, availabilityEndpoint, availabilityReload]);

  const daysGrid = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const headEmpty = (first.getDay() + 6) % 7;
    const cells: { key: string; dateISO?: string; day?: number }[] = [];
    for (let i = 0; i < headEmpty; i++) cells.push({ key: `e${i}` });
    for (let d = 1; d <= last.getDate(); d++) {
      const iso = `${y}-${pad(m + 1)}-${pad(d)}`;
      cells.push({ key: iso, dateISO: iso, day: d });
    }
    return cells;
  }, [cursor]);

  const selectDay = (iso: string) => {
    if (availabilityStatus !== "ready") return;
    if (!iso || isPastBookingDate(iso) || (minBookingDate !== null && iso < minBookingDate)) return;
    if (availability[iso]?.fullDay) return;

    // Check if onChange expects Date | null (for selectedDate interface)
    if (selectedDate !== undefined) {
      const dateObj = new Date(iso + 'T12:00:00');
      (effectiveOnChange as (date: Date | null) => void)(dateObj);
    } else {
      // Original slot-based interface
      if (service === "Sesja") {
        (effectiveOnChange as (val: { date: string; start?: string; end?: string } | null) => void)({ date: iso, start: undefined, end: undefined });
      } else {
        (effectiveOnChange as (val: { date: string; start?: string; end?: string } | null) => void)({ date: iso });
      }
    }
  };

  const sessionSlots = useMemo(() => {
    if (!showTimeSlots || service !== "Sesja" || !effectiveValue?.date) return [];
    const iso = effectiveValue.date;
    const slots = buildSessionSlots(iso, durationHours);

    const info = availability[iso];

    // Check for both 'booked' (array of start times) and 'ranges' (start/end objects)
    const ranges: { start: string; end: string }[] = Array.isArray(info?.ranges)
      ? info!.ranges!
      : (info?.booked || []).map((s) => ({
        start: s,
        end: fromMinutes(toMinutes(s) + 60)
      }));

    return slots.map((slot) => {
      const isBlockedByFullDay = info?.fullDay === true;
      const isBlockedByOverlap = ranges.some((r) =>
        overlap(slot.start, slot.end, r.start, r.end)
      );
      const isBlockedByExactStart = (info?.booked || []).includes(slot.start);

      const blocked = isBlockedByFullDay || isBlockedByOverlap || isBlockedByExactStart;
      const picked = effectiveValue?.start === slot.start && effectiveValue?.end === slot.end;

      return { ...slot, blocked, picked };
    });
  }, [showTimeSlots, service, effectiveValue, durationHours, availability]);

  const previousMonthDisabled = isCurrentOrPastMonth(cursor);

  return (
    <div className="rounded-xl border border-zinc-300 bg-white p-4 text-zinc-900 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          className="min-h-11 min-w-11 rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-35"
          onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          disabled={previousMonthDisabled}
          aria-label="Poprzedni miesiąc"
        >
          ◀
        </button>
        <div className="font-semibold">
          {cursor.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}
        </div>
        <button
          type="button"
          className="min-h-11 min-w-11 rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 hover:bg-zinc-100"
          onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          aria-label="Następny miesiąc"
        >
          ▶
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"].map((d) => (
          <div key={d} className="py-1 text-zinc-600">
            {d}
          </div>
        ))}
        {daysGrid.map((c) => {
          if (!c.dateISO) return <div key={c.key} />;
          const info = availability[c.dateISO];
          const isSelected = effectiveValue?.date === c.dateISO;
          const isPast = isPastBookingDate(c.dateISO);
          const isBeforeMinimum = minBookingDate !== null && c.dateISO < minBookingDate;
          const availabilityUnavailable = availabilityStatus !== "ready";
          const disabled = availabilityUnavailable || isPast || isBeforeMinimum || info?.fullDay === true;

          return (
            <button
              key={c.key}
              type="button"
              onClick={() => selectDay(c.dateISO!)}
              disabled={disabled}
              className={[
                "min-h-11 rounded-md border",
                isSelected
                  ? "bg-gold-500 text-black border-gold-500 font-bold shadow-lg shadow-gold-500/20"
                  : "bg-white text-black border-zinc-300 hover:bg-zinc-100",
                disabled ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" : "",
              ].join(" ")}
              title={
                availabilityStatus === "loading"
                  ? "Sprawdzam dostępność"
                  : availabilityStatus === "error"
                  ? "Nie udało się sprawdzić dostępności"
                  : isPast
                  ? "Miniony termin"
                  : isBeforeMinimum
                  ? `Najbliższy możliwy termin: ${minBookingDate}`
                  : disabled
                  ? "Dzień zajęty"
                  : c.dateISO
              }
            >
              {c.day}
            </button>
          );
        })}
      </div>

      {availabilityStatus !== "ready" && (
        <div
          className={`mt-4 rounded-lg border p-4 text-sm ${availabilityStatus === "error"
            ? "border-red-300 bg-red-50 text-red-800"
            : "border-amber-300 bg-amber-50 text-amber-900"}`}
          role={availabilityStatus === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {availabilityStatus === "loading" ? (
            <p>Sprawdzam dostępne terminy…</p>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p>Nie udało się pobrać dostępnych terminów. Kalendarz został bezpiecznie zablokowany.</p>
              <button
                type="button"
                className="min-h-11 rounded-md border border-red-400 bg-white px-4 py-2 font-semibold text-red-800 hover:bg-red-100"
                onClick={() => setAvailabilityReload(current => current + 1)}
              >
                Spróbuj ponownie
              </button>
            </div>
          )}
        </div>
      )}

      {showTimeSlots && service === "Sesja" && effectiveValue?.date && (
        <div className="mt-4">
          <div className="mb-2 text-sm text-zinc-400">
            Wybierz godzinę dla: <span className="font-mono text-gold-400">{effectiveValue?.date}</span>{" "}
            <span className="text-zinc-500">(czas: {durationHours}h)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {sessionSlots.map((s) => (
              <button
                key={`${s.start}-${s.end}`}
                type="button"
                disabled={s.blocked}
                onClick={() => {
                  if (selectedDate !== undefined) {
                    // For selectedDate interface, just update the date
                    (effectiveOnChange as (date: Date | null) => void)(effectiveValue?.date ? new Date(effectiveValue.date + 'T12:00:00') : null);
                  } else {
                    // For value interface, update with time slot
                    (effectiveOnChange as (val: { date: string; start?: string; end?: string } | null) => void)({ date: effectiveValue!.date!, start: s.start, end: s.end });
                  }
                }}
                className={[
                  "min-h-11 rounded-md border px-3 py-2 text-sm transition-all",
                  s.picked ? "bg-gold-500 text-black border-gold-500 font-bold shadow-lg shadow-gold-500/20" : "hover:bg-zinc-800 border-zinc-700",
                  s.blocked ? "opacity-40 cursor-not-allowed" : "",
                ].join(" ")}
                title={s.blocked ? "Zajęte" : `${s.start}–${s.end}`}
              >
                {s.start}–{s.end}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Sesje: <b>Pn–Pt</b> start 18:00; <b>So–Nd</b> start 17:00 i 19:00. Zajęte sloty są wyszarzone.
          </p>
        </div>
      )
      }
    </div >
  );
}
