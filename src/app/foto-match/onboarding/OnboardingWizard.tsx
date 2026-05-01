'use client';

/**
 * Onboarding wizard — 4 kroki, klient-side.
 * Zapisuje stan kroku po kroku do API, żeby user mógł zamknąć i wrócić.
 */
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    Sparkles, ArrowRight, ArrowLeft, Camera, ShieldCheck,
    User as UserIcon, Heart, CheckCircle2, X, Upload, Loader2, AlertCircle
} from 'lucide-react';

type ProfileForm = {
    display_name: string;
    birth_year: number | '';
    gender: 'male' | 'female' | 'other' | '';
    city: string;
    radius_km: number;
    bio: string;
    interests: string[];
    experience: 'never_modeled' | 'few_times' | 'experienced' | '';
    comfort_level: 'shy' | 'neutral' | 'open' | '';
};

type Photo = {
    id: number;
    url: string;
    position: number;
    ai_status: string;
    ai_flagged_for: string | null;
};

type ProfileResponse = {
    profile: {
        id: number;
        display_name: string;
        birth_year: number;
        gender: string;
        city: string;
        radius_km: number;
        bio: string | null;
        interests: string[];
        experience: string | null;
        comfort_level: string | null;
        status: string;
        selfie_url: string | null;
        id_doc_url: string | null;
        phone: string | null;
        phone_verified_at: string | null;
    } | null;
    photos: Photo[];
};

const SUGGESTED_INTERESTS = [
    'Architektura', 'Bieganie', 'Boardgames', 'Fotografia', 'Gry komputerowe',
    'Gotowanie', 'Hiking', 'Joga', 'Kawa', 'Kino', 'Książki', 'Koncerty',
    'Malarstwo', 'Muzyka', 'Narty', 'Pies', 'Podróże', 'Restauracje',
    'Rower', 'Siłownia', 'Sport', 'Streetwear', 'Wino', 'Wspinaczka',
];

const CITIES = ['Toruń', 'Bydgoszcz', 'Warszawa', 'Kraków', 'Gdańsk', 'Wrocław', 'Poznań', 'Łódź'];

const STEPS = [
    { n: 1, label: 'Podstawy', icon: UserIcon },
    { n: 2, label: 'Preferencje', icon: Heart },
    { n: 3, label: 'Zdjęcia', icon: Camera },
    { n: 4, label: 'Weryfikacja', icon: ShieldCheck },
];

export default function OnboardingWizard() {
    const router = useRouter();
    const { user, token, isLoading: authLoading } = useAuth();
    const [step, setStep] = useState(1);
    const [bootstrapped, setBootstrapped] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [programEnabled, setProgramEnabled] = useState<boolean | null>(null);
    const [hasExistingProfile, setHasExistingProfile] = useState(false);

    const [form, setForm] = useState<ProfileForm>({
        display_name: '',
        birth_year: '',
        gender: '',
        city: '',
        radius_km: 30,
        bio: '',
        interests: [],
        experience: '',
        comfort_level: '',
    });
    const [profileId, setProfileId] = useState<number | null>(null);
    const [profileStatus, setProfileStatus] = useState<string | null>(null);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [selfieFile, setSelfieFile] = useState<File | null>(null);
    const [verificationDone, setVerificationDone] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptGdpr, setAcceptGdpr] = useState(false);

    // Weryfikacja telefonu (SMS OTP) — zastępuje dawny upload dowodu
    const [phoneInput, setPhoneInput] = useState('');
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [phoneCodeSent, setPhoneCodeSent] = useState(false);
    const [phoneCodeInput, setPhoneCodeInput] = useState('');
    const [phoneBusy, setPhoneBusy] = useState(false);
    const [phoneInfo, setPhoneInfo] = useState<string | null>(null);
    const [ageDeclared, setAgeDeclared] = useState(false);

    // Redirect jak nie zalogowany
    useEffect(() => {
        if (!authLoading && !user) {
            const redirect = encodeURIComponent('/foto-match/onboarding');
            router.replace(`/logowanie?redirect=${redirect}`);
        }
    }, [authLoading, user, router]);

    // Pobierz aktualny profil (jeśli istnieje) + sprawdź globalne włączenie programu
    useEffect(() => {
        if (!token || bootstrapped) return;
        (async () => {
            try {
                const [enRes, profRes] = await Promise.all([
                    fetch('/api/foto-match/settings/public'),
                    fetch('/api/foto-match/profile/me', {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);
                const en = enRes.ok ? await enRes.json() : { enabled: false };
                setProgramEnabled(!!en.enabled);

                if (!profRes.ok) {
                    setBootstrapped(true);
                    return;
                }
                const data: ProfileResponse = await profRes.json();
                if (data.profile) {
                    setHasExistingProfile(true);
                    setProfileId(data.profile.id);
                    setProfileStatus(data.profile.status);
                    setForm({
                        display_name: data.profile.display_name,
                        birth_year: data.profile.birth_year,
                        gender: data.profile.gender as any,
                        city: data.profile.city,
                        radius_km: data.profile.radius_km,
                        bio: data.profile.bio ?? '',
                        interests: data.profile.interests || [],
                        experience: (data.profile.experience as any) ?? '',
                        comfort_level: (data.profile.comfort_level as any) ?? '',
                    });
                    setPhotos(data.photos);
                    if (data.profile.phone) setPhoneInput(data.profile.phone);
                    if (data.profile.phone_verified_at) setPhoneVerified(true);
                    if (data.profile.selfie_url && data.profile.phone_verified_at) {
                        setVerificationDone(true);
                    }
                    // Wybierz pierwszy nieskończony krok
                    if (!data.profile.display_name) setStep(1);
                    else if (data.photos.length < 3) setStep(3);
                    else if (!data.profile.selfie_url) setStep(4);
                    else setStep(4);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setBootstrapped(true);
            }
        })();
    }, [token, bootstrapped]);

    const saveProfile = useCallback(async (): Promise<boolean> => {
        if (!token) return false;
        setBusy(true);
        setError(null);

        const payload = {
            display_name: form.display_name.trim(),
            birth_year: typeof form.birth_year === 'number' ? form.birth_year : 0,
            gender: form.gender || undefined,
            city: form.city.trim(),
            radius_km: form.radius_km,
            bio: form.bio.trim() || null,
            interests: form.interests,
            experience: form.experience || null,
            comfort_level: form.comfort_level || null,
            accept_terms: acceptTerms,
            accept_gdpr: acceptGdpr,
        };

        try {
            const r = await fetch('/api/foto-match/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            const data = await r.json();
            if (!r.ok) {
                setError(data.error || 'Błąd zapisu profilu');
                return false;
            }
            setProfileId(data.profile.id);
            setProfileStatus(data.profile.status);
            return true;
        } catch (e: any) {
            setError(e.message || 'Błąd sieci');
            return false;
        } finally {
            setBusy(false);
        }
    }, [token, form]);

    const handleNextFromBasics = async () => {
        if (!form.display_name.trim() || !form.gender || !form.birth_year || !form.city.trim()) {
            setError('Uzupełnij wszystkie pola.');
            return;
        }
        const currentYear = new Date().getFullYear();
        if (typeof form.birth_year === 'number' && currentYear - form.birth_year < 18) {
            setError('Foto-Match jest dla osób 18+.');
            return;
        }
        if (!acceptTerms || !acceptGdpr) {
            setError('Zaakceptuj regulamin i politykę prywatności.');
            return;
        }
        const ok = await saveProfile();
        if (ok) setStep(2);
    };

    const handleNextFromPreferences = async () => {
        const ok = await saveProfile();
        if (ok) setStep(3);
    };

    const uploadPhoto = async (file: File) => {
        if (!token) return;
        setBusy(true);
        setError(null);
        const fd = new FormData();
        fd.append('file', file);
        try {
            const r = await fetch('/api/foto-match/photos', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            const data = await r.json();
            if (!r.ok) {
                setError(data.error || 'Błąd uploadu');
                return;
            }
            setPhotos((prev) => [...prev, data.photo]);
            if (data.moderation?.status === 'FLAGGED') {
                setError(
                    'Zdjęcie zostało oflagowane przez automatyczną moderację (kategoria: ' +
                    (data.moderation.flaggedFor || 'inne') +
                    '). Trafi do ręcznego sprawdzenia przez administratora.'
                );
            }
        } catch (e: any) {
            setError(e.message || 'Błąd sieci');
        } finally {
            setBusy(false);
        }
    };

    const deletePhoto = async (id: number) => {
        if (!token) return;
        setBusy(true);
        try {
            const r = await fetch(`/api/foto-match/photos/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (r.ok) {
                setPhotos((prev) => prev.filter((p) => p.id !== id));
            }
        } finally {
            setBusy(false);
        }
    };

    const sendPhoneCode = async () => {
        if (!token) return;
        setPhoneBusy(true);
        setPhoneInfo(null);
        setError(null);
        try {
            const r = await fetch('/api/foto-match/phone/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ phone: phoneInput }),
            });
            const data = await r.json();
            if (!r.ok) {
                setError(data.message || data.error || 'Nie udało się wysłać kodu.');
                return;
            }
            setPhoneCodeSent(true);
            setPhoneInfo(
                data.dev_code
                    ? `Kod (DEV mock): ${data.dev_code} — w produkcji przyjdzie SMS.`
                    : 'Kod wysłany SMS-em. Wpisz go poniżej (ważny 10 minut).'
            );
        } catch (e: any) {
            setError(e.message || 'Błąd sieci');
        } finally {
            setPhoneBusy(false);
        }
    };

    const verifyPhoneCode = async () => {
        if (!token) return;
        setPhoneBusy(true);
        setError(null);
        try {
            const r = await fetch('/api/foto-match/phone/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ code: phoneCodeInput }),
            });
            const data = await r.json();
            if (!r.ok) {
                const left = data.attempts_left != null ? ` (pozostało prób: ${data.attempts_left})` : '';
                setError((data.message || data.error || 'Nieprawidłowy kod') + left);
                return;
            }
            setPhoneVerified(true);
            setPhoneInfo('Numer telefonu zweryfikowany.');
        } catch (e: any) {
            setError(e.message || 'Błąd sieci');
        } finally {
            setPhoneBusy(false);
        }
    };

    const submitVerification = async () => {
        if (!token || !selfieFile) {
            setError('Wybierz selfie.');
            return;
        }
        if (!phoneVerified) {
            setError('Najpierw zweryfikuj numer telefonu.');
            return;
        }
        if (!ageDeclared) {
            setError('Wymagane oświadczenie pełnoletności (18+).');
            return;
        }
        setBusy(true);
        setError(null);
        const fd = new FormData();
        fd.append('selfie', selfieFile);
        fd.append('age_declaration', '1');
        try {
            const r = await fetch('/api/foto-match/verify', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            const data = await r.json();
            if (!r.ok) {
                setError(data.message || data.error || 'Błąd weryfikacji');
                return;
            }
            setVerificationDone(true);
            setProfileStatus(data.profile.status);
            router.push('/foto-match/profil');
        } catch (e: any) {
            setError(e.message || 'Błąd sieci');
        } finally {
            setBusy(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            </div>
        );
    }

    // Program globalnie wyłączony i klient NIE ma jeszcze profilu — friendly screen
    if (programEnabled === false && !hasExistingProfile && bootstrapped) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <div className="inline-flex w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8 text-amber-400" />
                </div>
                <h1 className="text-3xl font-bold mb-3">Foto-Match jeszcze nieotwarty</h1>
                <p className="text-zinc-300 mb-8">
                    Pracujemy nad uruchomieniem programu. Zostaw e-mail na stronie głównej Foto-Match,
                    a powiadomimy Cię gdy ruszą zapisy.
                </p>
                <a
                    href="/foto-match"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 px-6 py-3 font-bold text-white"
                >
                    Zapisz się na listę <ArrowRight className="w-4 h-4" />
                </a>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            {/* Progress */}
            <div className="mb-10">
                <div className="flex items-center gap-2 mb-2 text-sm text-amber-300">
                    <Sparkles className="w-4 h-4" /> Foto-Match · onboarding
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-6">Stwórz swój profil</h1>
                <ol className="flex items-center gap-2 sm:gap-4">
                    {STEPS.map((s) => {
                        const Icon = s.icon;
                        const active = s.n === step;
                        const done = s.n < step;
                        return (
                            <li key={s.n} className="flex items-center gap-2 flex-1">
                                <div
                                    className={`w-9 h-9 rounded-full grid place-items-center text-sm font-bold transition ${done
                                        ? 'bg-emerald-500 text-white'
                                        : active
                                            ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white'
                                            : 'bg-zinc-800 text-zinc-500'
                                        }`}
                                >
                                    {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                                </div>
                                <span className={`hidden sm:block text-sm ${active ? 'text-white font-semibold' : 'text-zinc-500'}`}>
                                    {s.label}
                                </span>
                                {s.n < 4 && <div className="flex-1 h-px bg-zinc-800" />}
                            </li>
                        );
                    })}
                </ol>
            </div>

            {error && (
                <div className="mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 flex gap-3 items-start">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-rose-200">{error}</p>
                </div>
            )}

            {/* STEP 1 — Podstawy */}
            {step === 1 && (
                <section className="space-y-5">
                    <Field label="Twoje imię (jak chcesz być wyświetlany)">
                        <input
                            type="text"
                            value={form.display_name}
                            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                            maxLength={60}
                            className="input"
                            placeholder="np. Anna"
                        />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Rok urodzenia">
                            <input
                                type="number"
                                value={form.birth_year}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        birth_year: e.target.value ? parseInt(e.target.value, 10) : '',
                                    })
                                }
                                min={1920}
                                max={new Date().getFullYear() - 18}
                                className="input"
                                placeholder="1995"
                            />
                        </Field>
                        <Field label="Płeć">
                            <select
                                value={form.gender}
                                onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                                className="input"
                            >
                                <option value="">— wybierz —</option>
                                <option value="female">Kobieta</option>
                                <option value="male">Mężczyzna</option>
                                <option value="other">Inna / nie chcę podawać</option>
                            </select>
                        </Field>
                    </div>
                    <Field label="Miasto">
                        <select
                            value={form.city}
                            onChange={(e) => setForm({ ...form, city: e.target.value })}
                            className="input"
                        >
                            <option value="">— wybierz —</option>
                            {CITIES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </Field>

                    {/* Zgody RODO + regulamin (wymagane przy pierwszym tworzeniu profilu) */}
                    <div className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                        <label className="flex items-start gap-3 cursor-pointer text-sm text-zinc-200">
                            <input
                                type="checkbox"
                                checked={acceptTerms}
                                onChange={(e) => setAcceptTerms(e.target.checked)}
                                className="mt-1 w-4 h-4 accent-amber-500"
                            />
                            <span>
                                Akceptuję <a href="/regulamin-foto-match" target="_blank" className="text-amber-400 underline">regulamin Foto-Match</a> (model release, zasady spotkań, zachowanie).
                            </span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer text-sm text-zinc-200">
                            <input
                                type="checkbox"
                                checked={acceptGdpr}
                                onChange={(e) => setAcceptGdpr(e.target.checked)}
                                className="mt-1 w-4 h-4 accent-amber-500"
                            />
                            <span>
                                Wyrażam zgodę na przetwarzanie danych osobowych zgodnie z <a href="/polityka-prywatnosci" target="_blank" className="text-amber-400 underline">polityką prywatności</a> (RODO).
                            </span>
                        </label>
                    </div>

                    <Nav onNext={handleNextFromBasics} busy={busy} nextDisabled={!acceptTerms || !acceptGdpr} />
                </section>
            )}

            {/* STEP 2 — Preferencje */}
            {step === 2 && (
                <section className="space-y-5">
                    <Field label={`Promień szukania: ${form.radius_km} km`}>
                        <input
                            type="range"
                            min={5}
                            max={200}
                            step={5}
                            value={form.radius_km}
                            onChange={(e) => setForm({ ...form, radius_km: parseInt(e.target.value, 10) })}
                            className="w-full"
                        />
                    </Field>
                    <Field label="Doświadczenie przed obiektywem">
                        <select
                            value={form.experience}
                            onChange={(e) => setForm({ ...form, experience: e.target.value as any })}
                            className="input"
                        >
                            <option value="">— wybierz —</option>
                            <option value="never_modeled">Nigdy nie pozowałam/em</option>
                            <option value="few_times">Kilka razy</option>
                            <option value="experienced">Mam doświadczenie</option>
                        </select>
                    </Field>
                    <Field label="Jak się czujesz na sesji">
                        <select
                            value={form.comfort_level}
                            onChange={(e) => setForm({ ...form, comfort_level: e.target.value as any })}
                            className="input"
                        >
                            <option value="">— wybierz —</option>
                            <option value="shy">Trochę nieśmiało</option>
                            <option value="neutral">Neutralnie</option>
                            <option value="open">Bardzo swobodnie</option>
                        </select>
                    </Field>
                    <Field label="Twoje zainteresowania (max 20)">
                        <div className="flex flex-wrap gap-2">
                            {SUGGESTED_INTERESTS.map((i) => {
                                const active = form.interests.includes(i);
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => {
                                            setForm((f) => ({
                                                ...f,
                                                interests: active
                                                    ? f.interests.filter((x) => x !== i)
                                                    : f.interests.length < 20
                                                        ? [...f.interests, i]
                                                        : f.interests,
                                            }));
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-sm border transition ${active
                                            ? 'bg-amber-500 border-amber-500 text-white'
                                            : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-amber-400'
                                            }`}
                                    >
                                        {i}
                                    </button>
                                );
                            })}
                        </div>
                    </Field>
                    <Field label="Krótko o sobie (opcjonalnie)">
                        <textarea
                            value={form.bio}
                            onChange={(e) => setForm({ ...form, bio: e.target.value })}
                            maxLength={1500}
                            rows={4}
                            className="input"
                            placeholder="Co lubisz, czego szukasz na sesji, jakie zdjęcia chcesz mieć..."
                        />
                        <p className="text-xs text-zinc-500 mt-1">{form.bio.length} / 1500</p>
                    </Field>
                    <Nav onPrev={() => setStep(1)} onNext={handleNextFromPreferences} busy={busy} />
                </section>
            )}

            {/* STEP 3 — Zdjęcia */}
            {step === 3 && (
                <section className="space-y-5">
                    <p className="text-zinc-300">
                        Wgraj <strong>3 do 6 zdjęć</strong>. Pierwsze będzie głównym. Pomocne: 1 portret + 1 cała sylwetka + 1 sytuacyjne.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {photos.map((p) => (
                            <div key={p.id} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={p.url} alt="" className="w-full h-full object-cover" />
                                {p.ai_status === 'FLAGGED' && (
                                    <div className="absolute top-2 left-2 bg-rose-500/90 text-white text-[10px] uppercase px-2 py-1 rounded-full font-bold">
                                        Do sprawdzenia
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => deletePhoto(p.id)}
                                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 grid place-items-center text-white hover:bg-rose-500 transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        {photos.length < 6 && (
                            <label className="aspect-[3/4] rounded-xl border-2 border-dashed border-zinc-700 hover:border-amber-400 grid place-items-center cursor-pointer text-zinc-400 hover:text-amber-400 transition">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) uploadPhoto(f);
                                        e.target.value = '';
                                    }}
                                />
                                {busy ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                                    <div className="flex flex-col items-center gap-2 text-sm">
                                        <Upload className="w-8 h-8" />
                                        <span>Dodaj zdjęcie</span>
                                    </div>
                                )}
                            </label>
                        )}
                    </div>

                    <p className="text-xs text-zinc-500">
                        Zdjęcia sprawdzane są automatycznie pod kątem nagości/przemocy (AWS Rekognition).
                        Wszystkie profile dodatkowo zatwierdza administrator.
                    </p>

                    <Nav
                        onPrev={() => setStep(2)}
                        onNext={() => {
                            if (photos.length < 3) {
                                setError('Wgraj minimum 3 zdjęcia.');
                                return;
                            }
                            setError(null);
                            setStep(4);
                        }}
                        busy={busy}
                        nextDisabled={photos.length < 3}
                    />
                </section>
            )}

            {/* STEP 4 — Weryfikacja */}
            {step === 4 && (
                <section className="space-y-5">
                    <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-5">
                        <div className="flex gap-3 items-start">
                            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                            <div>
                                <h3 className="font-semibold text-emerald-300 mb-2">Po co weryfikacja?</h3>
                                <p className="text-sm text-zinc-300 leading-relaxed">
                                    Wszystkie profile są weryfikowane — to chroni Ciebie i drugą osobę,
                                    z którą się spotkasz. Zdjęcia są przechowywane bezpiecznie i nie są pokazywane innym użytkownikom.
                                </p>
                            </div>
                        </div>
                    </div>

                    {verificationDone ? (
                        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-5 text-center">
                            <CheckCircle2 className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                            <h3 className="font-bold text-lg mb-1">Weryfikacja wysłana</h3>
                            <p className="text-sm text-zinc-300">
                                Status: <strong>{profileStatus || 'PENDING'}</strong>. Damy Ci znać mailem
                                gdy administrator zaakceptuje profil (zazwyczaj do 24h).
                            </p>
                        </div>
                    ) : (
                        <>
                            <Field label="Selfie (Twoja twarz)">
                                <FileInput onFile={setSelfieFile} file={selfieFile} />
                                <p className="text-xs text-zinc-500 mt-2">
                                    Selfie służy wyłącznie weryfikacji że konto jest realną osobą — nie pokazujemy go innym użytkownikom.
                                </p>
                            </Field>

                            <Field label="Numer telefonu (PL, 9 cyfr) — wyślemy kod SMS">
                                <div className="flex gap-2">
                                    <input
                                        type="tel"
                                        inputMode="tel"
                                        autoComplete="tel"
                                        className="input flex-1"
                                        placeholder="123 456 789"
                                        value={phoneInput}
                                        onChange={(e) => setPhoneInput(e.target.value)}
                                        disabled={phoneVerified || phoneBusy}
                                    />
                                    {!phoneVerified && (
                                        <button
                                            type="button"
                                            onClick={sendPhoneCode}
                                            disabled={phoneBusy || !phoneInput.trim()}
                                            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm whitespace-nowrap disabled:opacity-50"
                                        >
                                            {phoneBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : (phoneCodeSent ? 'Wyślij ponownie' : 'Wyślij kod')}
                                        </button>
                                    )}
                                    {phoneVerified && (
                                        <span className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-1">
                                            <CheckCircle2 className="w-4 h-4" /> Zweryfikowany
                                        </span>
                                    )}
                                </div>
                                {phoneCodeSent && !phoneVerified && (
                                    <div className="mt-3 flex gap-2">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            className="input flex-1 tracking-widest text-center text-lg"
                                            placeholder="6-cyfrowy kod"
                                            value={phoneCodeInput}
                                            onChange={(e) => setPhoneCodeInput(e.target.value.replace(/\D/g, ''))}
                                            disabled={phoneBusy}
                                        />
                                        <button
                                            type="button"
                                            onClick={verifyPhoneCode}
                                            disabled={phoneBusy || phoneCodeInput.length !== 6}
                                            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold text-sm disabled:opacity-50"
                                        >
                                            {phoneBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Potwierdź'}
                                        </button>
                                    </div>
                                )}
                                {phoneInfo && (
                                    <p className="text-xs text-amber-300 mt-2">{phoneInfo}</p>
                                )}
                                <p className="text-xs text-zinc-500 mt-2">
                                    Telefon nie jest pokazywany innym użytkownikom — używamy go tylko do weryfikacji konta i (opcjonalnie) potwierdzenia sesji.
                                </p>
                            </Field>

                            <label className="flex items-start gap-3 text-sm text-zinc-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={ageDeclared}
                                    onChange={(e) => setAgeDeclared(e.target.checked)}
                                    className="mt-1"
                                />
                                <span>Oświadczam, że ukończyłem(am) 18 lat. Świadomy(a) odpowiedzialności karnej za podanie nieprawdy.</span>
                            </label>

                            <Nav
                                onPrev={() => setStep(3)}
                                onNext={submitVerification}
                                nextLabel="Wyślij do weryfikacji"
                                busy={busy}
                                nextDisabled={!selfieFile || !phoneVerified || !ageDeclared}
                            />
                        </>
                    )}
                </section>
            )}

            <style jsx>{`
                .input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: rgba(24, 24, 27, 0.8);
                    border: 1px solid rgb(63, 63, 70);
                    border-radius: 0.625rem;
                    color: white;
                    font-size: 1rem;
                    transition: border-color 0.15s;
                }
                .input:focus {
                    outline: none;
                    border-color: rgb(251, 191, 36);
                }
            `}</style>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">{label}</label>
            {children}
        </div>
    );
}

function Nav({
    onPrev, onNext, busy, nextLabel = 'Dalej', nextDisabled = false,
}: {
    onPrev?: () => void;
    onNext: () => void;
    busy: boolean;
    nextLabel?: string;
    nextDisabled?: boolean;
}) {
    return (
        <div className="flex items-center justify-between pt-4">
            {onPrev ? (
                <button
                    type="button"
                    onClick={onPrev}
                    disabled={busy}
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition"
                >
                    <ArrowLeft className="w-4 h-4" /> Wstecz
                </button>
            ) : <span />}
            <button
                type="button"
                onClick={onNext}
                disabled={busy || nextDisabled}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 px-6 py-3 font-bold text-white disabled:opacity-50 transition hover:scale-[1.02]"
            >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{nextLabel} <ArrowRight className="w-4 h-4" /></>}
            </button>
        </div>
    );
}

function FileInput({ onFile, file }: { onFile: (f: File) => void; file: File | null }) {
    return (
        <label className="block w-full p-6 rounded-xl border-2 border-dashed border-zinc-700 hover:border-amber-400 cursor-pointer transition">
            <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                }}
            />
            <div className="flex items-center gap-3 text-zinc-300">
                <Upload className="w-6 h-6" />
                <span className="text-sm">
                    {file ? <strong className="text-amber-300">{file.name}</strong> : 'Kliknij, aby wybrać plik'}
                </span>
            </div>
        </label>
    );
}
