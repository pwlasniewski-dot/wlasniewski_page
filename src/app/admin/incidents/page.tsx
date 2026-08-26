'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw } from 'lucide-react';

type Severity = 'P0' | 'P1' | 'P2' | 'P3';
type IncidentStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

interface Incident {
    id: string;
    severity: Severity;
    category: string;
    status: IncidentStatus;
    reason_code: string;
    summary: string;
    client_id: number | null;
    client_email: string | null;
    entity_type: string | null;
    entity_id: number | null;
    correlation_id: string | null;
    details: Record<string, unknown> | null;
    occurred_at: string;
    acknowledged_at: string | null;
    resolved_at: string | null;
}

interface IncidentResponse {
    incidents: Incident[];
    pagination: { page: number; limit: number; total: number; pages: number };
    counts: {
        by_status: Partial<Record<IncidentStatus, number>>;
        open_by_severity: Partial<Record<Severity, number>>;
    };
}

interface CrmSnapshot {
    accounts: { created: number; welcomeSent: number; welcomeFailed: number };
    login: { success: number; failed: number; slow: number; p95Ms: number };
    offers: { sent: number; viewed: number; accepted: number; rejected: number; zeroPricePrevented: number };
    contracts: { sent: number; viewed: number; signed: number; failed: number };
    galleries: {
        sent: number; opened: number; failed: number;
        groupAccountsCreated: number; groupMagicLogins: number; groupSelectionsSubmitted: number;
        archiveRequested: number; archiveCreated: number; archiveReused: number; archiveReady: number;
        archiveFailed: number; archiveLinksIssued: number; externalLinksIssued: number;
    };
    incidents: { p0Open: number; p1Open: number; acknowledged: number; resolved: number };
}

const severityStyles: Record<Severity, string> = {
    P0: 'border-red-500/40 bg-red-500/10 text-red-300',
    P1: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
    P2: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    P3: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
};

const statusLabels: Record<IncidentStatus, string> = {
    OPEN: 'Otwarty',
    ACKNOWLEDGED: 'W obsłudze',
    RESOLVED: 'Rozwiązany',
};

export default function AdminIncidentsPage() {
    const [data, setData] = useState<IncidentResponse | null>(null);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('OPEN');
    const [severity, setSeverity] = useState('');
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [changingId, setChangingId] = useState<string | null>(null);
    const [crmSnapshot, setCrmSnapshot] = useState<CrmSnapshot | null>(null);
    const [crmError, setCrmError] = useState('');

    const token = useMemo(() => typeof window === 'undefined' ? '' : localStorage.getItem('admin_token') || '', []);

    const loadIncidents = useCallback(async () => {
        setLoading(true);
        setError('');
        const params = new URLSearchParams({ page: String(page), limit: '25' });
        if (status) params.set('status', status);
        if (severity) params.set('severity', severity);
        if (query.trim()) params.set('q', query.trim());
        try {
            const response = await fetch(`/api/admin/incidents?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || 'Nie udało się pobrać incydentów.');
            setData(payload);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : 'Nie udało się pobrać incydentów.');
        } finally {
            setLoading(false);
        }
    }, [page, query, severity, status, token]);

    const loadCrmSnapshot = useCallback(async () => {
        setCrmError('');
        try {
            const response = await fetch('/api/admin/reports/crm-daily', {
                headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || 'Nie udało się pobrać podsumowania CRM.');
            setCrmSnapshot(payload.snapshot);
        } catch (loadError) {
            setCrmError(loadError instanceof Error ? loadError.message : 'Nie udało się pobrać podsumowania CRM.');
        }
    }, [token]);

    useEffect(() => {
        void loadIncidents();
        void loadCrmSnapshot();
    }, [loadCrmSnapshot, loadIncidents]);

    useEffect(() => {
        const refreshId = window.setInterval(() => {
            void loadIncidents();
            void loadCrmSnapshot();
        }, 60_000);
        return () => window.clearInterval(refreshId);
    }, [loadCrmSnapshot, loadIncidents]);

    const changeStatus = async (id: string, action: 'acknowledge' | 'resolve') => {
        setChangingId(id);
        setError('');
        try {
            const response = await fetch('/api/admin/incidents', {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, action }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || 'Nie udało się zmienić statusu.');
            await loadIncidents();
        } catch (changeError) {
            setError(changeError instanceof Error ? changeError.message : 'Nie udało się zmienić statusu.');
        } finally {
            setChangingId(null);
        }
    };

    const openCount = data?.counts.by_status.OPEN || 0;
    const acknowledgedCount = data?.counts.by_status.ACKNOWLEDGED || 0;
    const resolvedCount = data?.counts.by_status.RESOLVED || 0;

    return (
        <div className="min-h-screen bg-zinc-950 p-5 text-zinc-100 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="flex items-center gap-3 text-3xl font-bold">
                            <AlertTriangle className="h-8 w-8 text-amber-400" />
                            Centrum incydentów
                        </h1>
                        <p className="mt-2 text-sm text-zinc-400">Problemy wymagające świadomej reakcji administratora.</p>
                    </div>
                    <button onClick={() => { void loadIncidents(); void loadCrmSnapshot(); }} className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Odśwież
                    </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    {[
                        ['Otwarte', openCount, 'text-red-300'],
                        ['W obsłudze', acknowledgedCount, 'text-amber-300'],
                        ['Rozwiązane', resolvedCount, 'text-emerald-300'],
                    ].map(([label, value, color]) => (
                        <div key={String(label)} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                            <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
                            <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
                        </div>
                    ))}
                </div>

                <section aria-labelledby="crm-daily-heading" className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 id="crm-daily-heading" className="font-bold text-white">CRM — ostatnie 24 godziny</h2>
                            <p className="text-xs text-zinc-500">Ten sam zakres operacyjny trafia do jednego raportu dziennego.</p>
                        </div>
                        {crmSnapshot && <span className="text-xs text-zinc-500">Login p95: {crmSnapshot.login.p95Ms} ms</span>}
                    </div>
                    {crmError && <p className="mt-3 text-sm text-red-300">{crmError}</p>}
                    {crmSnapshot && (
                        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
                            {[
                                ['Nowe konta', crmSnapshot.accounts.created],
                                ['Login sukces / błąd', `${crmSnapshot.login.success} / ${crmSnapshot.login.failed}`],
                                ['Oferty wysłane / zaakcept.', `${crmSnapshot.offers.sent} / ${crmSnapshot.offers.accepted}`],
                                ['Umowy wysłane / podpisane', `${crmSnapshot.contracts.sent} / ${crmSnapshot.contracts.signed}`],
                                ['Galerie wysłane / otwarte', `${crmSnapshot.galleries.sent} / ${crmSnapshot.galleries.opened}`],
                                ['Konta / logowania rodziców', `${crmSnapshot.galleries.groupAccountsCreated} / ${crmSnapshot.galleries.groupMagicLogins}`],
                                ['Wybory odbitek zatwierdzone', crmSnapshot.galleries.groupSelectionsSubmitted],
                                ['ZIP żądania / build / reuse', `${crmSnapshot.galleries.archiveRequested} / ${crmSnapshot.galleries.archiveCreated} / ${crmSnapshot.galleries.archiveReused}`],
                                ['ZIP gotowe / błędy', `${crmSnapshot.galleries.archiveReady} / ${crmSnapshot.galleries.archiveFailed}`],
                                ['Linki ZIP / Adobe', `${crmSnapshot.galleries.archiveLinksIssued} / ${crmSnapshot.galleries.externalLinksIssued}`],
                                ['P0/P1 otwarte', crmSnapshot.incidents.p0Open + crmSnapshot.incidents.p1Open],
                            ].map(([label, value]) => (
                                <div key={String(label)} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                                    <p className="text-[10px] uppercase tracking-wide text-zinc-600">{label}</p>
                                    <p className="mt-1 text-lg font-bold text-zinc-100">{value}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <div className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 md:grid-cols-4">
                    <select value={status} onChange={event => { setStatus(event.target.value); setPage(1); }} className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm">
                        <option value="">Wszystkie statusy</option>
                        <option value="OPEN">Otwarte</option>
                        <option value="ACKNOWLEDGED">W obsłudze</option>
                        <option value="RESOLVED">Rozwiązane</option>
                    </select>
                    <select value={severity} onChange={event => { setSeverity(event.target.value); setPage(1); }} className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm">
                        <option value="">Każda ważność</option>
                        {['P0', 'P1', 'P2', 'P3'].map(value => <option key={value}>{value}</option>)}
                    </select>
                    <input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Szukaj przyczyny, klienta…" className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm md:col-span-2" />
                </div>

                {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
                {loading && !data ? <div className="py-16 text-center text-zinc-500">Ładowanie incydentów…</div> : null}
                {!loading && data?.incidents.length === 0 ? <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center text-zinc-400">Brak incydentów dla wybranych filtrów.</div> : null}

                <div className="space-y-3">
                    {data?.incidents.map(incident => (
                        <article key={incident.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0 space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`rounded-md border px-2 py-1 text-xs font-bold ${severityStyles[incident.severity]}`}>{incident.severity}</span>
                                        <span className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-300">{statusLabels[incident.status]}</span>
                                        <span className="text-xs text-zinc-500">{incident.category} / {incident.reason_code}</span>
                                    </div>
                                    <h2 className="text-lg font-semibold text-white">{incident.summary}</h2>
                                    <dl className="grid gap-x-8 gap-y-2 text-sm text-zinc-400 sm:grid-cols-2 xl:grid-cols-4">
                                        <div><dt className="text-xs text-zinc-600">Klient</dt><dd className="break-all">{incident.client_email || (incident.client_id ? `ID ${incident.client_id}` : '—')}</dd></div>
                                        <div><dt className="text-xs text-zinc-600">Czas</dt><dd>{new Date(incident.occurred_at).toLocaleString('pl-PL')}</dd></div>
                                        <div><dt className="text-xs text-zinc-600">Korelacja</dt><dd className="break-all font-mono text-xs">{incident.correlation_id || '—'}</dd></div>
                                        <div><dt className="text-xs text-zinc-600">Obiekt</dt><dd>{incident.entity_type ? `${incident.entity_type} #${incident.entity_id || '—'}` : '—'}</dd></div>
                                        <div><dt className="text-xs text-zinc-600">Przyjęto</dt><dd>{incident.acknowledged_at ? new Date(incident.acknowledged_at).toLocaleString('pl-PL') : '—'}</dd></div>
                                        <div><dt className="text-xs text-zinc-600">Rozwiązano</dt><dd>{incident.resolved_at ? new Date(incident.resolved_at).toLocaleString('pl-PL') : '—'}</dd></div>
                                    </dl>
                                    {incident.details && (
                                        <details className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
                                            <summary className="cursor-pointer font-medium text-zinc-300">Szczegóły techniczne</summary>
                                            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words font-mono">{JSON.stringify(incident.details, null, 2)}</pre>
                                        </details>
                                    )}
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    {incident.status === 'OPEN' && (
                                        <button disabled={changingId === incident.id} onClick={() => void changeStatus(incident.id, 'acknowledge')} className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 px-3 py-2 text-sm text-amber-300 hover:bg-amber-500/10 disabled:opacity-50">
                                            <Clock3 className="h-4 w-4" /> Przyjmij
                                        </button>
                                    )}
                                    {incident.status !== 'RESOLVED' && (
                                        <button disabled={changingId === incident.id} onClick={() => void changeStatus(incident.id, 'resolve')} className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50">
                                            <CheckCircle2 className="h-4 w-4" /> Rozwiąż
                                        </button>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                {data && data.pagination.pages > 1 && (
                    <div className="flex items-center justify-between text-sm text-zinc-400">
                        <span>{data.pagination.total} incydentów</span>
                        <div className="flex items-center gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(current => current - 1)} className="rounded-lg border border-zinc-700 px-3 py-2 disabled:opacity-40">Poprzednia</button>
                            <span>{page} / {data.pagination.pages}</span>
                            <button disabled={page >= data.pagination.pages} onClick={() => setPage(current => current + 1)} className="rounded-lg border border-zinc-700 px-3 py-2 disabled:opacity-40">Następna</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
