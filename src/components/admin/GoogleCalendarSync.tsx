'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Status = { configured: boolean; connected: boolean; email?: string | null; last_sync_at?: string | null; last_error?: string | null; pending?: number | boolean };

async function request(path = '', method = 'GET') {
    const token = localStorage.getItem('admin_token');
    if (!token) throw new Error('Zaloguj się ponownie do panelu administratora.');
    const response = await fetch(`/api/admin/google-calendar${path}`, {
        method, headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 409 && path === '/sync') return { pending: true };
    if (!response.ok) throw new Error(response.status === 401
        ? 'Zaloguj się ponownie do panelu administratora.'
        : 'Nie udało się połączyć z Google Calendar. Spróbuj ponownie.');
    return data;
}

export default function GoogleCalendarSync({ revision = 0, tone = 'dark' }: { revision?: number; tone?: 'dark' | 'light' }) {
    const [status, setStatus] = useState<Status | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [confirmDisconnect, setConfirmDisconnect] = useState(false);
    const lock = useRef(false);
    const callbackHandled = useRef(false);
    const previousRevision = useRef(revision);
    const refresh = useCallback(async () => {
        const data: Status = await request();
        setStatus(data);
        return data;
    }, []);
    const sync = useCallback(async () => {
        if (lock.current) {
            setMessage('Zmiany oczekują na kolejną synchronizację.');
            return;
        }
        lock.current = true; setBusy(true); setError(''); setMessage('');
        try {
            const result = await request('/sync', 'POST');
            if (result.skipped === 'disconnected' || result.skipped === 'not_configured') {
                await refresh();
                throw new Error('Synchronizacja nie została wykonana. Połącz konto Google po zakończeniu konfiguracji.');
            }
            setMessage(result.pending
                ? 'Synchronizacja oczekuje lub jest w toku. Kolejna próba nastąpi automatycznie; możesz też użyć „Synchronizuj teraz”.'
                : `Synchronizacja zakończona. Dodano: ${result.created || 0}, zaktualizowano: ${result.updated || 0}, bez zmian: ${result.unchanged || 0}, anulowano: ${result.cancelled || 0}.${typeof result.skipped === 'number' && result.skipped > 0 ? ` Pominięto wpisy bez poprawnego terminu: ${result.skipped}.` : ''}`);
            await refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Błąd połączenia. Spróbuj ponownie.');
        } finally { lock.current = false; setBusy(false); }
    }, [refresh]);

    useEffect(() => {
        let active = true;
        refresh().then(data => {
            if (!active || callbackHandled.current) return;
            const url = new URL(window.location.href);
            const callback = url.searchParams.get('google_calendar');
            if (!callback) return;
            callbackHandled.current = true;
            url.searchParams.delete('google_calendar');
            window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
            if (callback === 'connected' && data.connected) void sync();
            else setError('Nie udało się zakończyć łączenia z Google. Spróbuj połączyć ponownie.');
        }).catch(e => { if (active) setError(e.message); });
        return () => { active = false; };
    }, [refresh, sync]);

    useEffect(() => {
        if (previousRevision.current === revision) return;
        previousRevision.current = revision;
        if (status?.connected) void sync();
    }, [revision, status?.connected, sync]);

    const connect = async () => {
        if (lock.current) return;
        lock.current = true; setBusy(true); setError(''); setMessage('');
        try {
            const data = await request('/connect', 'POST');
            const url = new URL(data.url);
            if (url.protocol !== 'https:' || url.hostname !== 'accounts.google.com' || url.port || url.username || url.password || url.pathname !== '/o/oauth2/v2/auth') throw new Error('Nieprawidłowy adres autoryzacji Google.');
            window.location.assign(url.href);
        } catch (e) { setError(e instanceof Error ? e.message : 'Nie udało się rozpocząć połączenia.'); }
        finally { lock.current = false; setBusy(false); }
    };
    const disconnect = async () => {
        if (lock.current) return;
        lock.current = true; setBusy(true); setError(''); setMessage('');
        try {
            await request('/disconnect', 'POST');
            setStatus(current => current && { ...current, connected: false, email: null, pending: false, last_error: null });
            setConfirmDisconnect(false);
            setMessage('Odłączono. Dotychczasowe wydarzenia pozostają w Google Calendar.');
        } catch (e) { setError(e instanceof Error ? e.message : 'Nie udało się odłączyć konta.'); }
        finally { lock.current = false; setBusy(false); }
    };
    const light = tone === 'light';
    const buttonClass = `rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50 ${light ? 'border-zinc-300 bg-white text-zinc-900' : 'border-zinc-600 bg-zinc-800 text-white'}`;
    return <section aria-label="Integracja Google Calendar" aria-busy={busy} className={`mb-4 rounded-xl border p-4 ${light ? 'border-zinc-200 bg-white text-zinc-800' : 'border-zinc-700 bg-zinc-900 text-zinc-200'}`}>
        <h3 className="font-semibold">Google Calendar</h3>
        <p className="mt-1 text-sm">Strona → Google Calendar. Wszystkie nadchodzące terminy, także w kolejnych latach. Zmiany w Google nie zmieniają rezerwacji na stronie.</p>
        {!status && !error && <p role="status" className="mt-2 text-sm">Sprawdzanie połączenia…</p>}
        {status && !status.configured && <p className="mt-2 text-sm">Integracja wymaga jednorazowej konfiguracji Google po stronie serwera.</p>}
        {status?.connected && <>
            <p className="mt-2 text-sm break-all">Połączono{status.email ? `: ${status.email}` : ' z Google Calendar'}.</p>
            <p className="mt-1 text-sm">Nowe i zmienione terminy są synchronizowane automatycznie przez zadanie uruchamiane co 15 minut.</p>
            <p className="mt-1 text-sm">Ostatnia synchronizacja: {status.last_sync_at ? new Date(status.last_sync_at).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' }) : 'jeszcze nie wykonano'}.</p>
            {!!status.pending && <p className="mt-1 text-sm">Zmiany oczekują na synchronizację.</p>}
            {!!status.last_error && <p className="mt-1 text-sm">Ostatnia próba synchronizacji nie powiodła się. Ponów synchronizację; jeśli problem wraca, połącz konto ponownie.</p>}
        </>}
        <div className="mt-3 flex flex-wrap gap-2">
            {status?.configured && !status.connected && <button disabled={busy} onClick={connect} className={buttonClass}>Połącz z Google</button>}
            {status?.connected && <>
                <button disabled={busy} onClick={sync} className={buttonClass}>{busy ? 'Proszę czekać…' : 'Synchronizuj teraz'}</button>
                <button disabled={busy} onClick={() => setConfirmDisconnect(true)} className={buttonClass}>Odłącz Google</button>
            </>}
            {!status && error && <button disabled={busy} onClick={() => { setError(''); void refresh().catch(e => setError(e.message)); }} className={buttonClass}>Ponów sprawdzenie</button>}
        </div>
        {confirmDisconnect && <div className="mt-3 text-sm">
            <p>Odłączyć synchronizację? Zapisane wydarzenia pozostaną w Google Calendar.</p>
            <div className="mt-2 flex gap-2"><button disabled={busy} onClick={disconnect} className={buttonClass}>Tak, odłącz</button><button disabled={busy} onClick={() => setConfirmDisconnect(false)} className={buttonClass}>Wróć</button></div>
        </div>}
        {message && <p role="status" className="mt-2 text-sm">{message}</p>}
        {error && <p role="alert" className={`mt-2 text-sm ${light ? 'text-red-700' : 'text-red-300'}`}>{error}</p>}
    </section>;
}
