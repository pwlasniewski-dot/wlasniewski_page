'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import { warsawMidnight } from '@/lib/analytics/dateRange';

const nonnegativeMoney = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const civilDate = z.string().regex(/^(19|20|21)\d{2}-\d{2}-\d{2}$/).refine(value => warsawMidnight(value) !== null);
const dateTime = z.iso.datetime({ offset: true }).refine(value => Number.isFinite(Date.parse(value)));
const actualsResponseSchema = z.object({
    success: z.literal(true),
    data: z.object({
        receivedPaymentsGross: nonnegativeMoney,
        refundsGross: nonnegativeMoney,
        receivedPaymentsNet: z.number().int().min(-Number.MAX_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER),
        currency: z.literal('PLN'), unit: z.literal('minor'),
        coverageStartedAt: dateTime.nullable(),
        details: z.object({
            ledgerPaymentsGross: nonnegativeMoney,
            legacyPaymentsGross: nonnegativeMoney,
            notes: z.array(z.string().trim().min(1).max(2000)).min(1).max(50),
        }),
    }).refine(data => data.receivedPaymentsNet === data.receivedPaymentsGross - data.refundsGross
        && data.details.ledgerPaymentsGross + data.details.legacyPaymentsGross === data.receivedPaymentsGross),
    range: z.object({ startDate: civilDate, endDate: civilDate, timeZone: z.literal('Europe/Warsaw') })
        .refine(range => range.startDate <= range.endDate),
    generatedAt: dateTime,
});
type ActualsResponse = z.infer<typeof actualsResponseSchema>;
const pln = (minor: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(minor / 100);

/** Shares the dashboard date selection; receives no forecasts and has no write actions. */
export default function FinanceActuals({ startDate, endDate }: { startDate?: string; endDate?: string }) {
    const [result, setResult] = useState<{ key: string; body: ActualsResponse } | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [refresh, setRefresh] = useState(0);
    const requestKey = `${startDate || ''}/${endDate || ''}/${refresh}`;
    useEffect(() => {
        const controller = new AbortController();
        let active = true;
        setResult(null); setError(''); setLoading(true);
        const timeout = setTimeout(() => {
            if (!active) return;
            setResult(null); setError('Przekroczono czas odczytu finansów. Użyj „Odśwież finanse”, aby spróbować ponownie.');
            setLoading(false); controller.abort();
        }, 20_000);
        async function load() {
            try {
                const params = new URLSearchParams();
                if (startDate !== undefined) params.set('startDate', startDate);
                if (endDate !== undefined) params.set('endDate', endDate);
                const token = localStorage.getItem('admin_token');
                const response = await fetch(`/api/admin/analytics/finance?${params}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
                });
                if (!active || controller.signal.aborted) return;
                if (response.status === 401 || response.status === 403) throw new Error('Sesja administratora wygasła lub nie masz uprawnień. Zaloguj się ponownie.');
                const raw: unknown = await response.json();
                if (!active || controller.signal.aborted) return;
                if (!response.ok) throw new Error('Nie udało się pobrać danych finansowych.');
                const parsed = actualsResponseSchema.safeParse(raw);
                if (!parsed.success || (startDate !== undefined && parsed.data.range.startDate !== startDate)
                    || (endDate !== undefined && parsed.data.range.endDate !== endDate)) throw new Error('Otrzymano nieprawidłowe lub niepełne dane finansowe.');
                setResult({ key: requestKey, body: parsed.data });
            } catch (cause) {
                if (active && !controller.signal.aborted) { setResult(null); setError(cause instanceof Error ? cause.message : 'Brak dostępu do danych finansowych.'); }
            } finally { clearTimeout(timeout); if (active && !controller.signal.aborted) setLoading(false); }
        }
        void load();
        return () => { active = false; clearTimeout(timeout); controller.abort(); };
    }, [startDate, endDate, requestKey]);
    const body = result?.key === requestKey ? result.body : null;
    return <section data-testid="finance-actuals" aria-labelledby="finance-actuals-title" className="min-w-0 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 id="finance-actuals-title" className="text-xl font-semibold text-zinc-100">Zapisane wpłaty i zwroty</h2><p className="mt-1 text-sm text-zinc-400">Dane sklepu i usług w PLN, według dnia płatności lub zwrotu. Saldo poniżej nie jest zyskiem.</p></div>
            <button type="button" onClick={() => setRefresh(value => value + 1)} disabled={loading} className="min-h-11 rounded-xl border border-zinc-700 px-3 text-sm text-zinc-200 disabled:opacity-60">Odśwież finanse</button>
        </div>
        {loading && <p role="status" className="text-sm text-zinc-400">Odczytuję zapisy finansowe…</p>}
        {error && <p role="alert" className="rounded-xl border border-amber-800 bg-amber-950/30 p-3 text-sm text-amber-200">{error} Kwoty pozostają niedostępne.</p>}
        {body && <>
            <p className="text-sm text-zinc-400">{body.range.startDate} – {body.range.endDate} · czas polski</p>
            <dl className="grid min-w-0 gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))' }}>
                {([
                    ['Zapisane wpłaty', body.data.receivedPaymentsGross],
                    ['Zapisane zwroty', body.data.refundsGross],
                    ['Wpłaty minus zwroty', body.data.receivedPaymentsNet],
                ] as const).map(([label, value]) => <div key={label} className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3"><dt className="text-sm text-zinc-400">{label}</dt><dd className="mt-2 break-words text-xl font-semibold text-zinc-100">{pln(value)}</dd></div>)}
            </dl>
            <p className="text-sm text-zinc-400">W tym wpłaty z rejestru: {pln(body.data.details.ledgerPaymentsGross)}; ze starszych zapisów: {pln(body.data.details.legacyPaymentsGross)}. Pierwsza zapisana wpłata PLN w rejestrze: {body.data.coverageStartedAt ? new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', dateStyle: 'medium' }).format(new Date(body.data.coverageStartedAt)) : 'brak'}.</p>
            <div className="rounded-xl border border-amber-800/70 bg-amber-950/20 p-3 text-sm leading-relaxed text-amber-200">
                <p className="font-semibold">Ograniczenia danych</p>
                <ul className="mt-2 list-disc space-y-2 pl-5">{body.data.details.notes.map(note => <li key={note}>{note}</li>)}</ul>
            </div>
            <dl className="grid min-w-0 gap-2 text-sm" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))' }}>{['Koszty', 'Przychód księgowy', 'Zysk'].map(label => <div key={label} className="rounded-lg bg-zinc-950/60 p-3"><dt className="text-zinc-400">{label}</dt><dd className="mt-1 text-zinc-200">Niedostępne — brak pełnych danych</dd></div>)}</dl>
        </>}
    </section>;
}
