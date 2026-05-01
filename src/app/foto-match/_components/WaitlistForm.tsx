'use client';

import { useState } from 'react';

interface Props {
    initialSource?: string;
}

export default function WaitlistForm({ initialSource }: Props) {
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState<null | 'pending' | 'already'>(null);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (submitting) return;
        setError(null);
        setSubmitting(true);

        const fd = new FormData(e.currentTarget);
        const payload = {
            email: String(fd.get('email') || '').trim(),
            city: String(fd.get('city') || '').trim() || null,
            role: String(fd.get('role') || '').trim() || null,
            age_range: String(fd.get('age_range') || '').trim() || null,
            marketing_opt_in: fd.get('marketing_opt_in') === 'on',
            rules_accepted: fd.get('rules_accepted') === 'on',
            website: String(fd.get('website') || ''), // honeypot
            source: initialSource || (typeof document !== 'undefined' ? document.referrer || 'foto-match-landing' : 'foto-match-landing'),
        };

        try {
            const res = await fetch('/api/foto-match/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.success) {
                setError(data?.message || 'Coś poszło nie tak. Spróbuj ponownie za chwilę.');
                return;
            }
            setDone(data.status === 'already_confirmed' ? 'already' : 'pending');
        } catch {
            setError('Błąd sieci. Sprawdź połączenie i spróbuj ponownie.');
        } finally {
            setSubmitting(false);
        }
    }

    if (done === 'pending') {
        return (
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-amber-900">
                <h3 className="text-lg font-bold mb-2">Sprawdź skrzynkę 📬</h3>
                <p className="text-sm">
                    Wysłaliśmy link potwierdzający. Kliknij w niego, żeby finalnie dołączyć do listy
                    pierwszych użytkowników Foto-Match. Link ważny 24 h.
                </p>
                <p className="text-xs mt-3 text-amber-700">
                    Nie widzisz maila? Sprawdź spam / oferty. Wysyłamy z domeny <strong>wlasniewski.pl</strong>.
                </p>
            </div>
        );
    }

    if (done === 'already') {
        return (
            <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-6 text-emerald-900">
                <h3 className="text-lg font-bold mb-2">Już jesteś na liście ✓</h3>
                <p className="text-sm">Damy znać, gdy odpalimy Foto-Match.</p>
            </div>
        );
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {/* honeypot — niewidoczny dla ludzi, boty często go wypełnią */}
            <div className="hidden" aria-hidden="true">
                <label>
                    Strona www
                    <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                </label>
            </div>

            <div>
                <label htmlFor="fm-email" className="block text-sm font-medium text-gray-800 mb-1">
                    Email <span className="text-red-500">*</span>
                </label>
                <input
                    id="fm-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="ty@example.com"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="fm-city" className="block text-sm font-medium text-gray-800 mb-1">Miasto</label>
                    <input
                        id="fm-city"
                        name="city"
                        type="text"
                        placeholder="Toruń, Bydgoszcz…"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
                <div>
                    <label htmlFor="fm-role" className="block text-sm font-medium text-gray-800 mb-1">Kim chcesz być?</label>
                    <select
                        id="fm-role"
                        name="role"
                        defaultValue=""
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">Wybierz…</option>
                        <option value="inviter">Zapraszam kogoś na sesję</option>
                        <option value="invitee">Chcę dostać zaproszenie</option>
                        <option value="both">Jedno i drugie</option>
                    </select>
                </div>
            </div>

            <div>
                <label htmlFor="fm-age" className="block text-sm font-medium text-gray-800 mb-1">Przedział wieku (opcjonalnie)</label>
                <select
                    id="fm-age"
                    name="age_range"
                    defaultValue=""
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="">— nie chcę podawać —</option>
                    <option value="18-24">18–24</option>
                    <option value="25-34">25–34</option>
                    <option value="35-44">35–44</option>
                    <option value="45-54">45–54</option>
                    <option value="55+">55+</option>
                </select>
            </div>

            <label className="flex items-start gap-2 text-sm text-gray-700">
                <input type="checkbox" name="rules_accepted" required className="mt-1" />
                <span>
                    Akceptuję, że Foto-Match jest projektem przedpremierowym, a mój email zostanie użyty
                    do powiadomienia o starcie. Mogę się wypisać w każdym mailu.{' '}
                    <span className="text-red-500">*</span>
                </span>
            </label>
            <label className="flex items-start gap-2 text-sm text-gray-700">
                <input type="checkbox" name="marketing_opt_in" className="mt-1" />
                <span>
                    Zgadzam się na okazjonalne maile o promocjach i nowych funkcjach (max 1× / miesiąc).
                </span>
            </label>

            {error && (
                <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 text-base font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-60"
            >
                {submitting ? 'Wysyłam…' : 'Zapisz mnie na listę'}
            </button>
        </form>
    );
}
