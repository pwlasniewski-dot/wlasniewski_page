"use client";

import React, { useEffect, useMemo, useState } from "react";

export type ServiceType = "Sesja" | "Ślub" | "Przyjęcie" | "Urodziny";

type DayAvailability =
  | undefined
  | {
    fullDay?: boolean;
    booked?: string[];
    ranges?: { start: string; end: string }[];
  };

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

  const [availability, setAvailability] = useState<Record<string, DayAvailability>>({});

  useEffect(() => {
    const url =
      availabilityEndpoint ??
      `/api/bookings?mode=availability&ym=${encodeURIComponent(ym)}&service=${encodeURIComponent(service)}`;
    let alive = true;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        const av =
          (data && (data.availability || data)) && typeof (data.availability || data) === "object"
            ? (data.availability || data)
            : {};
        setAvailability(av);
      })
      .catch(() => setAvailability({}));
    return () => {
      alive = false;
    };
  }, [ym, service, availabilityEndpoint]);

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
    if (!iso) return;

    // Check if onChange expects Date | null (for selectedDate interface)
    if (selectedDate !== undefined) {
      const dateObj = new Date(iso + 'T12:00:00');
      (effectiveOnChange as (date: Date | null) => void)(dateObj);
    } else {
      // Original slot-based interface
      if (service === "Sesja") {
        (effectiveOnChange as (val: { date: string; start?: string; end?: string } | null) => void)({ date: iso, start: undefined, end: undefined });
      } else {
        const info = availability[iso];
        if (info?.fullDay) return;
        (effectiveOnChange as (val: { date: string; start?: string; end?: string } | null) => void)({ date: iso });
      }
    }
  };

  const sessionSlots = useMemo(() => {
    if (service !== "Sesja" || !effectiveValue?.date) return [];
    const iso = effectiveValue.date;
    const slots = buildSessionSlots(iso, durationHours);

    const info = availability[iso];
    const ranges: { start: string; end: string }[] = Array.isArray(info?.ranges)
      ? info!.ranges!
      : (info?.booked || []).map((s) => ({ start: s, end: fromMinutes(toMinutes(s) + 60) }));

    return slots.map((slot) => {
      const blocked =
        info?.fullDay === true ||
        ranges.some((r) => overlap(slot.start, slot.end, r.start, r.end)) ||
        (info?.booked || []).includes(slot.start);

      const picked = effectiveValue?.start === slot.start && effectiveValue?.end === slot.end;
      return { ...slot, blocked, picked };
    });
  }, [service, effectiveValue?.date, effectiveValue?.start, effectiveValue?.end, durationHours, availability]);

  return (
    <div className="rounded-xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          className="rounded-md border px-3 py-1 hover:bg-zinc-50"
          onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          aria-label="Poprzedni miesiąc"
        >
          ◀
        </button>
        <div className="font-semibold">
          {cursor.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}
        </div>
        <button
          type="button"
          className="rounded-md border px-3 py-1 hover:bg-zinc-50"
          onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          aria-label="Następny miesiąc"
        >
          ▶
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"].map((d) => (
          <div key={d} className="py-1 text-zinc-500">
            {d}
          </div>
        ))}
        {daysGrid.map((c) => {
          if (!c.dateISO) return <div key={c.key} />;
          const info = availability[c.dateISO];
          const isSelected = value?.date === c.dateISO;
          const disabled = service !== "Sesja" && info?.fullDay === true;

          return (
            <button
              key={c.key}
              type="button"
              onClick={() => selectDay(c.dateISO!)}
              disabled={disabled}
              className={[
                "h-9 rounded-md border",
                isSelected ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-zinc-50",
                disabled ? "opacity-40 cursor-not-allowed" : "",
              ].join(" ")}
              title={
                disabled
                  ? "Dzień zajęty"
                  : c.dateISO
              }
            >
              {c.day}
            </button>
          );
        })}
      </div>

      {service === "Sesja" && value?.date && (
        <div className="mt-4">
          <div className="mb-2 text-sm text-zinc-600">
            Wybierz godzinę dla: <span className="font-mono">{value.date}</span>{" "}
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
                    (onChange as (date: Date | null) => void)(value?.date ? new Date(value.date + 'T12:00:00') : null);
                  } else {
                    // For value interface, update with time slot
                    (onChange as (val: { date: string; start?: string; end?: string } | null) => void)({ date: value!.date!, start: s.start, end: s.end });
                  }
                }}
                className={[
                  "rounded-md border px-3 py-2 text-sm",
                  s.picked ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-zinc-50",
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
      )}
    </div>
  );
}
