
'use client';
import { useState } from 'react';

export default function AddCalendarBooking({ onCreated }: { onCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    async function save(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving) return;
        setSaving(true); setError(''); setSuccess('');
        const values = Object.fromEntries(new FormData(event.currentTarget));
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch('/api/admin/calendar-events', {
                method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ ...values, price: Number(values.price) }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Nie udało się zapisać. Sprawdź, czy jesteś zalogowany.');
            setOpen(false); setSuccess('Termin zapisany w rezerwacjach.'); onCreated();
        } catch (e) { setError(e instanceof Error ? e.message : 'Błąd połączenia. Sprawdź kalendarz przed ponowieniem.'); }
        finally { setSaving(false); }
    }
    const fields = [
        ['client_name', 'Imię i nazwisko klienta', 'text', true], ['email', 'E-mail klienta', 'email', true],
        ['service', 'Usługa / nazwa sesji', 'text', true], ['package', 'Pakiet / zakres', 'text', false],
        ['date', 'Data', 'date', true], ['start_time', 'Od godziny', 'time', true], ['end_time', 'Do godziny (ten sam dzień)', 'time', true],
        ['price', 'Ustalona cena (zł)', 'number', true], ['phone', 'Telefon', 'tel', false], ['venue_place', 'Miejsce', 'text', false],
    ] as const;
    return <div>
        <button type="button" onClick={() => { setOpen(true); setError(''); setSuccess(''); }} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">+ Dodaj termin</button>
        {success && <p role="status" className="mt-2 text-sm text-emerald-600">{success}</p>}
        {open && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 flex items-start justify-center">
            <form onSubmit={save} className="my-4 w-full max-w-xl rounded-xl bg-white p-5 text-zinc-900 shadow-xl" aria-label="Dodaj termin">
                <h2 className="text-xl font-bold">Dodaj termin sesji</h2>
                <p className="my-2 text-sm text-zinc-600">Rezerwacja ustalona z klientem. Zablokuje wybrane godziny. Zapis nie oznacza otrzymania płatności i nie wysyła wiadomości.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{fields.map(([name, label, type, required]) => <label key={name} className="text-sm">{label}
                    <input name={name} type={type} required={required} min={type === 'number' ? 0 : undefined} max={type === 'number' ? 2147483647 : undefined} step={type === 'number' ? 1 : undefined} className="mt-1 w-full rounded border border-zinc-300 bg-white p-2 text-zinc-900" />
                </label>)}</div>
                <label className="mt-3 block text-sm">Notatki<textarea name="notes" maxLength={2000} className="mt-1 w-full rounded border border-zinc-300 bg-white p-2 text-zinc-900" /></label>
                {error && <p role="alert" className="my-3 text-sm text-red-700">{error}</p>}
                <div className="mt-4 flex justify-end gap-3"><button type="button" disabled={saving} onClick={() => setOpen(false)}>Anuluj</button><button disabled={saving} className="rounded bg-rose-600 px-4 py-2 text-white disabled:opacity-50">{saving ? 'Zapisywanie…' : 'Zapisz termin'}</button></div>
            </form>
        </div>}
    </div>;
}
