'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Settings, ToggleLeft, ToggleRight, Filter, Phone, Image as ImageIcon, Users, Flag, ListChecks, ArrowRight, AlertTriangle } from 'lucide-react';

type SettingsState = {
    enabled: boolean;
    loading: boolean;
    saving: boolean;
    error: string | null;
};

export default function FotoMatchSettingsClient() {
    const [state, setState] = useState<SettingsState>({ enabled: false, loading: true, saving: false, error: null });

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/admin/foto-match/settings', { cache: 'no-store' });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                if (!cancelled) setState({ enabled: !!json.enabled, loading: false, saving: false, error: null });
            } catch (e: unknown) {
                if (!cancelled) setState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : 'Błąd ładowania' }));
            }
        })();
        return () => { cancelled = true; };
    }, []);

    async function toggleEnabled() {
        const next = !state.enabled;
        setState((s) => ({ ...s, saving: true, error: null }));
        try {
            const res = await fetch('/api/admin/foto-match/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: next }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setState({ enabled: next, loading: false, saving: false, error: null });
        } catch (e: unknown) {
            setState((s) => ({ ...s, saving: false, error: e instanceof Error ? e.message : 'Błąd zapisu' }));
        }
    }

    return (
        <div className="space-y-6">
            {/* Master toggle */}
            <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            {state.enabled ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-zinc-500" />}
                            Foto-Match {state.enabled ? 'WŁĄCZONY' : 'WYŁĄCZONY'}
                        </h2>
                        <p className="text-sm text-zinc-400 mt-1">
                            Master switch — ukrywa Foto-Match na stronie publicznej i blokuje rejestracje. Istniejące profile pozostają, panel admina działa.
                        </p>
                        {state.error && (
                            <p className="text-sm text-rose-400 mt-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> {state.error}</p>
                        )}
                    </div>
                    <button
                        onClick={toggleEnabled}
                        disabled={state.loading || state.saving}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                            state.enabled
                                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        } disabled:opacity-50`}
                    >
                        {state.loading ? '...' : state.saving ? 'Zapis…' : state.enabled ? 'Wyłącz' : 'Włącz'}
                    </button>
                </div>
            </section>

            {/* Linki do zaawansowanych sekcji */}
            <section>
                <h2 className="text-sm uppercase tracking-wide text-zinc-500 font-semibold mb-3">Konfiguracja zaawansowana</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                    <SettingLink
                        href="/admin/foto-match/match-settings"
                        icon={<Filter className="w-5 h-5 text-amber-400" />}
                        title="Matching i bonusy"
                        description="15 reguł parowania (płeć, miasto, wiek, doświadczenie) + bonusy referralowe."
                    />
                    <SettingLink
                        href="/admin/foto-match/profiles?status=PENDING"
                        icon={<Users className="w-5 h-5 text-amber-400" />}
                        title="Profile do akceptacji"
                        description="Kolejka PENDING — sprawdzenie selfie, telefonu, oświadczenia 18+."
                    />
                    <SettingLink
                        href="/admin/foto-match/photos?status=FLAGGED"
                        icon={<ImageIcon className="w-5 h-5 text-amber-400" />}
                        title="Zdjęcia oflagowane przez AI"
                        description="Manual review zdjęć z AWS Rekognition (nagość, broń, narkotyki)."
                    />
                    <SettingLink
                        href="/admin/foto-match/reports?status=PENDING"
                        icon={<Flag className="w-5 h-5 text-rose-400" />}
                        title="Zgłoszenia użytkowników"
                        description="Fake / inappropriate / harassment / spam — z notatką admina."
                    />
                    <SettingLink
                        href="/admin/foto-match/waitlist"
                        icon={<ListChecks className="w-5 h-5 text-amber-400" />}
                        title="Lista oczekujących"
                        description="Eksport CSV osób które zapisały się przed włączeniem."
                    />
                    <SettingLink
                        href="/admin/foto-match"
                        icon={<Settings className="w-5 h-5 text-amber-400" />}
                        title="Dashboard główny"
                        description="Statystyki, kafelki kolejek, szybki dostęp do akcji."
                    />
                </div>
            </section>

            {/* Info o SMS i zewnętrznych zależnościach */}
            <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                    <Phone className="w-5 h-5 text-amber-400" /> Integracje (env)
                </h2>
                <ul className="text-sm text-zinc-300 space-y-2">
                    <li><code className="text-amber-400">SMS_PROVIDER</code> — <span className="text-zinc-400">mock (default) lub twilio</span></li>
                    <li><code className="text-amber-400">TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM</code> — <span className="text-zinc-400">wymagane gdy provider=twilio</span></li>
                    <li><code className="text-amber-400">AWS_REKOGNITION_*</code> — <span className="text-zinc-400">auto-moderacja zdjęć</span></li>
                </ul>
                <p className="text-xs text-zinc-500 mt-3">Konfiguracja w Netlify → Site settings → Environment variables. Po zmianie wymagany redeploy.</p>
            </section>
        </div>
    );
}

function SettingLink({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
    return (
        <Link
            href={href}
            className="group block rounded-xl border border-zinc-800 bg-zinc-900 hover:border-amber-500/50 hover:bg-zinc-800/50 transition p-4"
        >
            <div className="flex items-start gap-3">
                <div className="shrink-0">{icon}</div>
                <div className="flex-1">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        {title}
                        <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">{description}</p>
                </div>
            </div>
        </Link>
    );
}
