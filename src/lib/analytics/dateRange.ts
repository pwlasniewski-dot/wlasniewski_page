const WARSAW = 'Europe/Warsaw';

function partsAt(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: WARSAW, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  return Object.fromEntries(parts.map(part => [part.type, Number(part.value)]));
}

function validDateOnly(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value); }

export function warsawMidnight(value: string) {
  if (!validDateOnly(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  let timestamp = Date.UTC(year, month - 1, day);
  for (let iteration = 0; iteration < 3; iteration++) {
    const actual = partsAt(new Date(timestamp));
    const actualAsUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
    timestamp += Date.UTC(year, month - 1, day) - actualAsUtc;
  }
  const result = new Date(timestamp);
  const check = partsAt(result);
  return check.year === year && check.month === month && check.day === day && check.hour === 0 ? result : null;
}

export function nextCivilDate(value: string) {
  if (!validDateOnly(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

export function shiftCivilDate(value: string, days: number) {
  if (!validDateOnly(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function previousEqualCalendarRange(startDate: string, endDate: string) {
  if (!validDateOnly(startDate) || !validDateOnly(endDate) || startDate > endDate) return null;
  const days = Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000) + 1;
  const previousEndDate = shiftCivilDate(startDate, -1);
  const previousStartDate = shiftCivilDate(startDate, -days);
  return previousStartDate && previousEndDate ? { startDate: previousStartDate, endDate: previousEndDate } : null;
}

export function warsawDateRange(startDate: string, inclusiveEndDate: string) {
  const next = nextCivilDate(inclusiveEndDate);
  const start = warsawMidnight(startDate); const end = next ? warsawMidnight(next) : null;
  return start && end && start < end ? { start, end } : null;
}

export function warsawDateKey(date: Date) {
  const parts = partsAt(date);
  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

export function warsawCalendarMonthRange(date: Date) {
  const [year, month] = warsawDateKey(date).split('-').map(Number);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonthDate = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  const start = warsawMidnight(startDate);
  const end = warsawMidnight(nextMonthDate);
  if (!start || !end) throw new Error('Nie udało się wyznaczyć granic bieżącego miesiąca.');
  return { start, end, month: startDate.slice(0, 7) };
}
