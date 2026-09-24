'use client';

import { useEffect, useState } from 'react';
import type { FinanceSummary } from '@/lib/analytics/finance-core';

type ActualsResponse = {
    success: true;
    data: Omit<FinanceSummary, 'coverageStartedAt'> & { coverageStartedAt: string | null };
    range: { startDate: string; endDate: string; timeZone: string };
    generatedAt: string;
};
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
        setResult(null); setError(''); setLoading(true);
        async function load() {
            try {
                const params = new URLSearchParams();
                if (startDate !== undefined) params.set('startDate', startDate);
                if (endDate !== undefined) params.set('endDate', endDate);
                const token = localStorage.getItem('admin_token');
                const response = await fetch(`/api/admin/analytics/finance?${params}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
                });
                const body = await response.json();
                if (controller.signal.aborted) return;
                if (response.status === 401 || response.status === 403) throw new Error('Sesja administratora wygasła lub nie masz uprawnień. Zaloguj się ponownie.');
                if (!response.ok || !body.success || !body.data) throw new Error(body.message || 'Nie udało się pobrać danych finansowych.');
                if (body.data.currency !== 'PLN' || body.data.unit !== 'minor' || !['receivedPaymentsGross', 'refundsGross', 'receivedPaymentsNet'].every(key => Number.isSafeInteger(body.data[key]))) throw new Error('Otrzymano nieprawidłowe dane finansowe.');
                setResult({ key: requestKey, body });
            } catch (cause) {
                if (!controller.signal.aborted) { setResult(null); setError(cause instanceof Error ? cause.message : 'Brak dostępu do danych finansowych.'); }
            } finally { if (!controller.signal.aborted) setLoading(false); }
        }
        void load();
        return () => controller.abort();
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
            <dl className="grid min-w-0 gap-3 sm:grid-cols-3">
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
            <dl className="grid gap-2 text-sm sm:grid-cols-3">{['Koszty', 'Przychód księgowy', 'Zysk'].map(label => <div key={label} className="rounded-lg bg-zinc-950/60 p-3"><dt className="text-zinc-400">{label}</dt><dd className="mt-1 text-zinc-200">Niedostępne — brak pełnych danych</dd></div>)}</dl>
        </>}
    </section>;
}
