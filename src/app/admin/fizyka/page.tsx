'use client';

import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
    Atom,
    Beaker,
    Check,
    Clipboard,
    Copy,
    ExternalLink,
    FlaskConical,
    Link2,
    LoaderCircle,
    Plus,
    QrCode,
    RefreshCcw,
    Save,
    ShieldCheck,
    Sparkles,
    Target,
    Trash2,
    Trophy,
    UserRound,
} from 'lucide-react';
import {
    PHYSICS_EXPERIMENT_IDS,
    PHYSICS_STARTER_IDS,
    physicsExperiments,
    physicsModules,
} from '@/lib/physics-lab/catalog';
import type { PhysicsLabProfile } from '@/lib/physics-lab/profile';

interface ProfilesResponse {
    success: boolean;
    profiles?: PhysicsLabProfile[];
    profile?: PhysicsLabProfile;
    error?: string;
}

interface DraftProfile {
    token: string;
    studentName: string;
    enabledExperimentIds: string[];
    finalTestEnabled: boolean;
}

const emptyDraft = (): DraftProfile => ({
    token: '',
    studentName: 'Kinga',
    enabledExperimentIds: [...PHYSICS_STARTER_IDS],
    finalTestEnabled: false,
});

function profileToDraft(profile: PhysicsLabProfile): DraftProfile {
    return {
        token: profile.token,
        studentName: profile.studentName,
        enabledExperimentIds: [...profile.enabledExperimentIds],
        finalTestEnabled: profile.finalTestEnabled,
    };
}

function authHeaders(json = false): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    return {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(json ? { 'Content-Type': 'application/json' } : {}),
    };
}

export default function PhysicsLabAdminPage() {
    const [profiles, setProfiles] = useState<PhysicsLabProfile[]>([]);
    const [draft, setDraft] = useState<DraftProfile>(emptyDraft);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [origin, setOrigin] = useState('');

    const selectedProfile = useMemo(
        () => profiles.find(profile => profile.token === draft.token) ?? null,
        [draft.token, profiles],
    );
    const enabledSet = useMemo(() => new Set(draft.enabledExperimentIds), [draft.enabledExperimentIds]);
    const profileLink = draft.token && origin ? `${origin}/laboratorium-fizyki/${draft.token}` : '';
    const completedAssigned = selectedProfile
        ? selectedProfile.progress.completedExperimentIds.filter(id => enabledSet.has(id)).length
        : 0;
    const bestTest = selectedProfile?.progress.finalTestAttempts.length
        ? Math.max(...selectedProfile.progress.finalTestAttempts.map(attempt => Math.round((attempt.score / attempt.total) * 100)))
        : null;

    useEffect(() => {
        setOrigin(window.location.origin);
        void loadProfiles();
    }, []);

    useEffect(() => {
        let cancelled = false;
        if (!profileLink) {
            setQrCode('');
            return;
        }
        QRCode.toDataURL(profileLink, {
            width: 320,
            margin: 1,
            errorCorrectionLevel: 'M',
            color: { dark: '#0b1220', light: '#ffffff' },
        }).then((data: string) => {
            if (!cancelled) setQrCode(data);
        }).catch(() => {
            if (!cancelled) setQrCode('');
        });
        return () => { cancelled = true; };
    }, [profileLink]);

    useEffect(() => {
        if (!notice) return;
        const timeout = window.setTimeout(() => setNotice(''), 3200);
        return () => window.clearTimeout(timeout);
    }, [notice]);

    async function loadProfiles(preferredToken?: string) {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/admin/physics-lab', {
                headers: authHeaders(),
                credentials: 'include',
                cache: 'no-store',
            });
            const data = await response.json() as ProfilesResponse;
            if (!response.ok || !data.success) throw new Error(data.error || 'Nie udało się pobrać profili.');
            const nextProfiles = data.profiles ?? [];
            setProfiles(nextProfiles);
            const requested = preferredToken
                ? nextProfiles.find(profile => profile.token === preferredToken)
                : draft.token
                    ? nextProfiles.find(profile => profile.token === draft.token)
                    : nextProfiles[0];
            setDraft(requested ? profileToDraft(requested) : emptyDraft());
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : 'Nie udało się pobrać profili.');
        } finally {
            setLoading(false);
        }
    }

    function selectProfile(profile: PhysicsLabProfile) {
        setDraft(profileToDraft(profile));
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function createNewProfile() {
        setDraft(emptyDraft());
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function toggleExperiment(experimentId: string) {
        setDraft(current => {
            const selected = new Set(current.enabledExperimentIds);
            if (selected.has(experimentId)) selected.delete(experimentId);
            else selected.add(experimentId);
            return { ...current, enabledExperimentIds: PHYSICS_EXPERIMENT_IDS.filter(id => selected.has(id)) };
        });
    }

    function toggleModule(moduleId: string) {
        const ids = physicsExperiments.filter(experiment => experiment.moduleId === moduleId).map(experiment => experiment.id);
        const allSelected = ids.every(id => enabledSet.has(id));
        setDraft(current => {
            const selected = new Set(current.enabledExperimentIds);
            ids.forEach(id => allSelected ? selected.delete(id) : selected.add(id));
            return { ...current, enabledExperimentIds: PHYSICS_EXPERIMENT_IDS.filter(id => selected.has(id)) };
        });
    }

    async function saveProfile() {
        if (!draft.studentName.trim()) {
            setError('Wpisz imię dziecka.');
            return;
        }
        if (draft.enabledExperimentIds.length === 0 && !draft.finalTestEnabled) {
            setError('Włącz co najmniej jedno doświadczenie albo test końcowy.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const response = await fetch('/api/admin/physics-lab', {
                method: 'POST',
                headers: authHeaders(true),
                credentials: 'include',
                body: JSON.stringify({
                    action: 'save',
                    token: draft.token || undefined,
                    studentName: draft.studentName,
                    enabledExperimentIds: draft.enabledExperimentIds,
                    finalTestEnabled: draft.finalTestEnabled,
                }),
            });
            const data = await response.json() as ProfilesResponse;
            if (!response.ok || !data.success || !data.profile) throw new Error(data.error || 'Nie udało się zapisać profilu.');
            setDraft(profileToDraft(data.profile));
            setProfiles(current => [data.profile!, ...current.filter(profile => profile.token !== data.profile!.token)]);
            setNotice(draft.token ? 'Ustawienia zapisane.' : 'Profil utworzony. Link jest gotowy do wysłania.');
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Nie udało się zapisać profilu.');
        } finally {
            setSaving(false);
        }
    }

    async function runAction(action: 'resetProgress' | 'delete') {
        if (!draft.token) return;
        const message = action === 'delete'
            ? `Usunąć profil ${draft.studentName}? Osobisty link przestanie działać.`
            : `Wyzerować cały postęp profilu ${draft.studentName}?`;
        if (!window.confirm(message)) return;
        setActionLoading(true);
        setError('');
        try {
            const response = await fetch('/api/admin/physics-lab', {
                method: 'POST',
                headers: authHeaders(true),
                credentials: 'include',
                body: JSON.stringify({ action, token: draft.token }),
            });
            const data = await response.json() as ProfilesResponse;
            if (!response.ok || !data.success) throw new Error(data.error || 'Operacja nie powiodła się.');
            if (action === 'delete') {
                const remaining = profiles.filter(profile => profile.token !== draft.token);
                setProfiles(remaining);
                setDraft(remaining[0] ? profileToDraft(remaining[0]) : emptyDraft());
                setNotice('Profil usunięty.');
            } else if (data.profile) {
                setProfiles(current => current.map(profile => profile.token === data.profile!.token ? data.profile! : profile));
                setNotice('Postęp został wyzerowany.');
            }
        } catch (actionError) {
            setError(actionError instanceof Error ? actionError.message : 'Operacja nie powiodła się.');
        } finally {
            setActionLoading(false);
        }
    }

    async function copyLink() {
        if (!profileLink) return;
        try {
            await navigator.clipboard.writeText(profileLink);
            setNotice('Link skopiowany do schowka.');
        } catch {
            setError('Nie udało się skopiować linku. Zaznacz go ręcznie.');
        }
    }

    function applyPreset(preset: 'starter' | 'all' | 'none') {
        setDraft(current => ({
            ...current,
            enabledExperimentIds: preset === 'starter'
                ? [...PHYSICS_STARTER_IDS]
                : preset === 'all'
                    ? [...PHYSICS_EXPERIMENT_IDS]
                    : [],
        }));
    }

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center text-zinc-300">
                <LoaderCircle className="mr-3 h-6 w-6 animate-spin text-cyan-400" /> Ładowanie Laboratorium Fizyki…
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-28">
            <section className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-zinc-900 to-violet-500/10 p-6 shadow-2xl shadow-black/30 sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-3xl">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                            <Atom className="h-4 w-4" /> Strefa rodzica
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Laboratorium Fizyki</h1>
                        <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-300">Wybierasz doświadczenia, wysyłasz dziecku osobisty link i widzisz postęp. Materiał obejmuje cały dział „Pierwsze spotkanie z fizyką” — zadania 1–20.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center sm:gap-3">
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"><strong className="block text-2xl text-white">{physicsExperiments.length}</strong><span className="text-xs text-zinc-400">doświadczeń</span></div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"><strong className="block text-2xl text-white">20</strong><span className="text-xs text-zinc-400">zadań</span></div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"><strong className="block text-2xl text-white">4</strong><span className="text-xs text-zinc-400">misje</span></div>
                    </div>
                </div>
            </section>

            {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200" role="alert">{error}</div>}
            {notice && <div className="fixed right-5 top-20 z-50 flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-950/95 px-5 py-4 text-sm font-semibold text-emerald-100 shadow-2xl"><Check className="h-5 w-5" /> {notice}</div>}

            <div className="grid gap-6 xl:grid-cols-[310px_minmax(0,1fr)]">
                <aside className="space-y-4">
                    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-white">Profile dzieci</h2>
                                <p className="text-xs text-zinc-500">Każdy profil ma osobny link.</p>
                            </div>
                            <button type="button" onClick={createNewProfile} className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-zinc-950 transition hover:bg-cyan-300" aria-label="Dodaj profil">
                                <Plus className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {profiles.map(profile => {
                                const assigned = new Set(profile.enabledExperimentIds);
                                const done = profile.progress.completedExperimentIds.filter(id => assigned.has(id)).length;
                                const active = profile.token === draft.token;
                                return (
                                    <button
                                        key={profile.token}
                                        type="button"
                                        onClick={() => selectProfile(profile)}
                                        className={`w-full rounded-2xl border p-4 text-left transition ${active ? 'border-cyan-400/50 bg-cyan-400/10' : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-black ${active ? 'bg-cyan-400 text-zinc-950' : 'bg-zinc-800 text-zinc-300'}`}>{profile.studentName.slice(0, 1).toUpperCase()}</span>
                                            <span className="min-w-0 flex-1">
                                                <strong className="block truncate text-white">{profile.studentName}</strong>
                                                <small className="text-zinc-500">{done}/{profile.enabledExperimentIds.length} doświadczeń</small>
                                            </span>
                                            {active && <Check className="h-5 w-5 text-cyan-300" />}
                                        </div>
                                    </button>
                                );
                            })}
                            {profiles.length === 0 && <p className="rounded-2xl border border-dashed border-zinc-700 p-4 text-center text-sm text-zinc-500">Nie ma jeszcze profilu. Utwórz pierwszy po prawej.</p>}
                        </div>
                        <button type="button" onClick={createNewProfile} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-300 hover:border-cyan-400/50 hover:text-white">
                            <Plus className="h-4 w-4" /> Nowy profil
                        </button>
                    </div>

                    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
                        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white"><ShieldCheck className="h-5 w-5 text-emerald-400" /> Jak działa dostęp</div>
                        <ul className="space-y-3 text-sm leading-6 text-zinc-400">
                            <li>• Dziecko nie zakłada konta.</li>
                            <li>• Link zawiera losowy identyfikator.</li>
                            <li>• Widzisz postęp zapisany na każdym urządzeniu.</li>
                            <li>• Usunięcie profilu natychmiast wyłącza link.</li>
                        </ul>
                    </div>
                </aside>

                <div className="space-y-6">
                    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 sm:p-7">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex-1">
                                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300"><UserRound className="h-4 w-4" /> {draft.token ? 'Edycja profilu' : 'Nowy profil'}</div>
                                <label className="block max-w-md">
                                    <span className="mb-2 block text-sm font-semibold text-zinc-300">Imię dziecka</span>
                                    <input
                                        value={draft.studentName}
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDraft(current => ({ ...current, studentName: event.target.value }))}
                                        maxLength={48}
                                        className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-lg font-bold text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
                                        placeholder="np. Kinga"
                                    />
                                </label>
                            </div>
                            {selectedProfile && (
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-center"><strong className="block text-xl text-white">{completedAssigned}</strong><span className="text-[11px] text-zinc-500">ukończone</span></div>
                                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-center"><strong className="block text-xl text-white">{draft.enabledExperimentIds.length}</strong><span className="text-[11px] text-zinc-500">aktywne</span></div>
                                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-center"><strong className="block text-xl text-white">{bestTest === null ? '—' : `${bestTest}%`}</strong><span className="text-[11px] text-zinc-500">najlepszy test</span></div>
                                </div>
                            )}
                        </div>
                    </section>

                    {draft.token && (
                        <section className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 p-5 sm:p-7">
                            <div className="grid gap-6 lg:grid-cols-[1fr_180px] lg:items-center">
                                <div>
                                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-300"><Link2 className="h-4 w-4" /> Osobisty link dziecka</div>
                                    <h2 className="text-xl font-black text-white">Wyślij ten adres Kindze</h2>
                                    <p className="mt-2 text-sm leading-6 text-zinc-400">Link działa na telefonie, tablecie i komputerze. Postęp zapisuje się w jednym profilu.</p>
                                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                        <input readOnly value={profileLink} className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-300" />
                                        <button type="button" onClick={() => void copyLink()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-400 px-4 py-3 font-bold text-zinc-950 hover:bg-violet-300"><Copy className="h-4 w-4" /> Kopiuj</button>
                                        <a href={profileLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 font-semibold text-zinc-200 hover:border-cyan-400/50"><ExternalLink className="h-4 w-4" /> Podgląd</a>
                                    </div>
                                </div>
                                <div className="mx-auto rounded-2xl bg-white p-3 shadow-xl shadow-black/20">
                                    {qrCode ? <img src={qrCode} alt={`Kod QR profilu ${draft.studentName}`} className="h-36 w-36" /> : <div className="flex h-36 w-36 items-center justify-center text-zinc-800"><QrCode /></div>}
                                </div>
                            </div>
                        </section>
                    )}

                    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 sm:p-7">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300"><Beaker className="h-4 w-4" /> Program doświadczeń</div>
                                <h2 className="text-2xl font-black text-white">Co dziecko ma wykonać?</h2>
                                <p className="mt-2 text-sm text-zinc-400">Możesz uruchamiać pojedyncze doświadczenia albo całe zestawy.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => applyPreset('starter')} className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-200 hover:bg-cyan-400/20">Start: zadania 1–5</button>
                                <button type="button" onClick={() => applyPreset('all')} className="rounded-xl border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-sm font-bold text-violet-200 hover:bg-violet-400/20">Cały dział</button>
                                <button type="button" onClick={() => applyPreset('none')} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white">Wyczyść</button>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            {physicsModules.map(module => {
                                const moduleExperiments = physicsExperiments.filter(experiment => experiment.moduleId === module.id);
                                const selectedCount = moduleExperiments.filter(experiment => enabledSet.has(experiment.id)).length;
                                const allSelected = selectedCount === moduleExperiments.length;
                                return (
                                    <div key={module.id} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/40">
                                        <div className="flex flex-col gap-4 border-b border-zinc-800 p-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <div className="flex items-center gap-2"><span className="rounded-lg bg-zinc-800 px-2 py-1 text-xs font-bold text-zinc-300">{module.tasks}</span><span className="text-xs text-zinc-500">{selectedCount}/{moduleExperiments.length} włączone</span></div>
                                                <h3 className="mt-2 font-black text-white">{module.title}</h3>
                                                <p className="mt-1 text-sm text-zinc-500">{module.description}</p>
                                            </div>
                                            <button type="button" onClick={() => toggleModule(module.id)} className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition ${allSelected ? 'bg-cyan-400 text-zinc-950' : 'border border-zinc-700 text-zinc-300 hover:border-cyan-400/50'}`}>{allSelected ? 'Wszystkie włączone' : 'Włącz całą misję'}</button>
                                        </div>
                                        <div className="grid gap-2 p-3 md:grid-cols-2 2xl:grid-cols-3">
                                            {moduleExperiments.map(experiment => {
                                                const checked = enabledSet.has(experiment.id);
                                                const done = selectedProfile?.progress.completedExperimentIds.includes(experiment.id) === true;
                                                return (
                                                    <button
                                                        key={experiment.id}
                                                        type="button"
                                                        onClick={() => toggleExperiment(experiment.id)}
                                                        className={`group flex min-h-28 items-start gap-3 rounded-xl border p-4 text-left transition ${checked ? 'border-cyan-400/40 bg-cyan-400/10' : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'}`}
                                                    >
                                                        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${checked ? 'border-cyan-300 bg-cyan-300 text-zinc-950' : 'border-zinc-600 text-transparent'}`}><Check className="h-4 w-4" /></span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="flex items-center justify-between gap-2"><small className="font-bold uppercase tracking-wider text-zinc-500">Zadanie {experiment.task}</small>{done && <small className="text-emerald-400">ukończone</small>}</span>
                                                            <strong className={`mt-1 block leading-5 ${checked ? 'text-white' : 'text-zinc-300'}`}>{experiment.title}</strong>
                                                            <small className="mt-1 block leading-5 text-zinc-500">{experiment.duration} · poziom {experiment.difficulty}</small>
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className={`rounded-3xl border p-5 sm:p-7 ${draft.finalTestEnabled ? 'border-amber-400/30 bg-amber-400/10' : 'border-zinc-800 bg-zinc-900/80'}`}>
                        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                            <div className="flex gap-4">
                                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${draft.finalTestEnabled ? 'bg-amber-300 text-zinc-950' : 'bg-zinc-800 text-zinc-500'}`}><Trophy /></span>
                                <div>
                                    <h2 className="text-xl font-black text-white">Test końcowy — zadania 1–20</h2>
                                    <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">20 pytań, wynik procentowy i szczegółowe wyjaśnienie każdej błędnej odpowiedzi. Uruchom go, gdy dziecko przerobi materiał.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={draft.finalTestEnabled}
                                onClick={() => setDraft(current => ({ ...current, finalTestEnabled: !current.finalTestEnabled }))}
                                className={`relative h-10 w-20 shrink-0 rounded-full transition ${draft.finalTestEnabled ? 'bg-amber-300' : 'bg-zinc-700'}`}
                            >
                                <span className={`absolute top-1 h-8 w-8 rounded-full bg-white shadow transition ${draft.finalTestEnabled ? 'left-11' : 'left-1'}`} />
                                <span className="sr-only">{draft.finalTestEnabled ? 'Wyłącz test końcowy' : 'Włącz test końcowy'}</span>
                            </button>
                        </div>
                    </section>

                    {draft.token && (
                        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 sm:p-7">
                            <h2 className="font-black text-white">Zarządzanie profilem</h2>
                            <div className="mt-4 flex flex-wrap gap-3">
                                <button type="button" onClick={() => void runAction('resetProgress')} disabled={actionLoading} className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-300 hover:border-amber-400/50 hover:text-white disabled:opacity-50"><RefreshCcw className="h-4 w-4" /> Wyzeruj postęp</button>
                                <button type="button" onClick={() => void runAction('delete')} disabled={actionLoading} className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-50"><Trash2 className="h-4 w-4" /> Usuń profil i wyłącz link</button>
                            </div>
                        </section>
                    )}
                </div>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-800 bg-zinc-950/95 p-3 backdrop-blur md:left-64">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-1 sm:px-5">
                    <div className="hidden text-sm text-zinc-400 sm:block"><strong className="text-white">{draft.studentName || 'Nowy profil'}</strong> · {draft.enabledExperimentIds.length} doświadczeń · test {draft.finalTestEnabled ? 'włączony' : 'wyłączony'}</div>
                    <button type="button" onClick={() => void saveProfile()} disabled={saving} className="ml-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 font-black text-zinc-950 shadow-lg shadow-cyan-500/10 hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60">
                        {saving ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        {draft.token ? 'Zapisz ustawienia' : 'Utwórz profil i link'}
                    </button>
                </div>
            </div>
        </div>
    );
}
