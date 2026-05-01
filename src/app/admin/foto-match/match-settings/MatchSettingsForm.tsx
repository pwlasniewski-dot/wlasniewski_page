'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, Sparkles, Heart, MapPin, Cake, Tags, Camera, ShieldCheck, Clock, EyeOff, Gift } from 'lucide-react';

type Settings = {
    id: number;
    opposite_gender_only: boolean;
    same_gender_only: boolean;
    same_city: boolean;
    respect_search_radius: boolean;
    age_range: boolean;
    age_range_years: number;
    min_shared_interests: boolean;
    min_shared_interests_count: number;
    same_experience_level: boolean;
    complementary_experience: boolean;
    same_comfort_level: boolean;
    verified_only: boolean;
    min_photos: boolean;
    min_photos_count: number;
    no_flagged_photos: boolean;
    recently_active: boolean;
    recently_active_days: number;
    exclude_already_seen: boolean;
    exclude_already_matched: boolean;
    referral_bonus_enabled: boolean;
    referral_bonus_amount_grosze: number;
    referral_bonus_percent: number;
    referral_bonus_type: 'AMOUNT' | 'PERCENT' | 'BOTH';
    referral_bonus_min_to_redeem: number;
    referral_bonus_expires_days: number;
};

type GenderMode = 'any' | 'opposite' | 'same';

function getToken() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('admin_token') || '';
}

export default function MatchSettingsForm() {
    const [s, setS] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    useEffect(() => {
        fetch('/api/admin/foto-match/match-settings', {
            headers: { Authorization: `Bearer ${getToken()}` },
        })
            .then(r => r.json())
            .then(d => setS(d.settings))
            .catch(e => setMsg({ type: 'err', text: String(e?.message || e) }))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-zinc-400 flex items-center gap-2"><Loader2 className="animate-spin" /> Ładowanie…</div>;
    if (!s) return <div className="text-red-400">Nie udało się załadować ustawień.</div>;

    const genderMode: GenderMode = s.opposite_gender_only ? 'opposite' : s.same_gender_only ? 'same' : 'any';

    function setGenderMode(mode: GenderMode) {
        setS(prev => prev && {
            ...prev,
            opposite_gender_only: mode === 'opposite',
            same_gender_only: mode === 'same',
        });
    }

    function update<K extends keyof Settings>(key: K, value: Settings[K]) {
        setS(prev => prev && { ...prev, [key]: value });
    }

    async function save() {
        if (!s) return;
        setSaving(true);
        setMsg(null);
        const { id, ...payload } = s;
        try {
            const r = await fetch('/api/admin/foto-match/match-settings', {
                method: 'PATCH',
                headers: {
                    'content-type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify(payload),
            });
            const data = await r.json();
            if (!r.ok) {
                setMsg({ type: 'err', text: data?.message || data?.error || 'Błąd zapisu' });
            } else {
                setS(data.settings);
                setMsg({ type: 'ok', text: 'Zapisano. Zmiany aktywne w ≤5s.' });
            }
        } catch (e: any) {
            setMsg({ type: 'err', text: e?.message || String(e) });
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6">
            {msg && (
                <div className={`rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/15 text-red-300 border border-red-500/30'}`}>
                    {msg.text}
                </div>
            )}

            {/* SEKCJA: Płeć (radio) */}
            <Section icon={<Heart className="w-5 h-5" />} title="Płeć kandydatów" subtitle="Wybierz JEDNĄ opcję — wzajemnie się wykluczają.">
                <div className="grid grid-cols-3 gap-2">
                    <RadioCard checked={genderMode === 'any'} onClick={() => setGenderMode('any')} label="Bez ograniczeń" desc="Wszyscy widzą wszystkich" />
                    <RadioCard checked={genderMode === 'opposite'} onClick={() => setGenderMode('opposite')} label="Tylko przeciwna" desc="Klasyczne dopasowanie" />
                    <RadioCard checked={genderMode === 'same'} onClick={() => setGenderMode('same')} label="Tylko ta sama" desc="Same-gender matching" />
                </div>
            </Section>

            {/* SEKCJA: Lokalizacja */}
            <Section icon={<MapPin className="w-5 h-5" />} title="Lokalizacja">
                <Toggle label="To samo miasto" hint="Pokazuj tylko z miasta klienta." checked={s.same_city} onChange={v => update('same_city', v)} />
                <Toggle label="Respektuj promień wyszukiwania" hint="Wymaga geokodowania (TODO)." checked={s.respect_search_radius} onChange={v => update('respect_search_radius', v)} />
            </Section>

            {/* SEKCJA: Wiek */}
            <Section icon={<Cake className="w-5 h-5" />} title="Wiek">
                <Toggle label="Filtr wieku" hint="Pokazuj kandydatów w widełkach +/− N lat." checked={s.age_range} onChange={v => update('age_range', v)} />
                {s.age_range && (
                    <NumberInput label="Widełki (lata)" value={s.age_range_years} min={1} max={50} onChange={v => update('age_range_years', v)} />
                )}
            </Section>

            {/* SEKCJA: Zainteresowania */}
            <Section icon={<Tags className="w-5 h-5" />} title="Zainteresowania">
                <Toggle label="Wspólne zainteresowania" hint="Min. liczba pokrywających się tagów." checked={s.min_shared_interests} onChange={v => update('min_shared_interests', v)} />
                {s.min_shared_interests && (
                    <NumberInput label="Min. liczba wspólnych" value={s.min_shared_interests_count} min={1} max={20} onChange={v => update('min_shared_interests_count', v)} />
                )}
            </Section>

            {/* SEKCJA: Doświadczenie / komfort */}
            <Section icon={<Sparkles className="w-5 h-5" />} title="Doświadczenie i komfort">
                <Toggle label="To samo doświadczenie" hint="Np. doświadczeni z doświadczonymi." checked={s.same_experience_level} onChange={v => update('same_experience_level', v)} />
                <Toggle label="Doświadczenie komplementarne" hint="Doświadczeni ↔ początkujący (mentoring)." checked={s.complementary_experience} onChange={v => update('complementary_experience', v)} />
                <Toggle label="Ten sam poziom komfortu" hint="Nieśmiali z nieśmiałymi, otwarci z otwartymi." checked={s.same_comfort_level} onChange={v => update('same_comfort_level', v)} />
            </Section>

            {/* SEKCJA: Zdjęcia */}
            <Section icon={<Camera className="w-5 h-5" />} title="Zdjęcia">
                <Toggle label="Min. liczba zdjęć" hint="Profil musi mieć co najmniej N zaakceptowanych zdjęć." checked={s.min_photos} onChange={v => update('min_photos', v)} />
                {s.min_photos && (
                    <NumberInput label="Minimalna liczba zdjęć" value={s.min_photos_count} min={1} max={6} onChange={v => update('min_photos_count', v)} />
                )}
                <Toggle label="Bez zgłoszonych zdjęć" hint="Ukryj profile z choć jednym FLAGGED." checked={s.no_flagged_photos} onChange={v => update('no_flagged_photos', v)} />
            </Section>

            {/* SEKCJA: Weryfikacja */}
            <Section icon={<ShieldCheck className="w-5 h-5" />} title="Weryfikacja">
                <Toggle label="Tylko zweryfikowani" hint="Profile z verified_at ustawionym przez admina." checked={s.verified_only} onChange={v => update('verified_only', v)} />
            </Section>

            {/* SEKCJA: Aktywność */}
            <Section icon={<Clock className="w-5 h-5" />} title="Aktywność">
                <Toggle label="Aktywni ostatnio" hint="Tylko osoby aktywne w ostatnich N dniach." checked={s.recently_active} onChange={v => update('recently_active', v)} />
                {s.recently_active && (
                    <NumberInput label="Dni" value={s.recently_active_days} min={1} max={365} onChange={v => update('recently_active_days', v)} />
                )}
            </Section>

            {/* SEKCJA: Wykluczenia */}
            <Section icon={<EyeOff className="w-5 h-5" />} title="Wykluczenia (wymagają systemu swipe)">
                <Toggle label="Pomiń już widzianych" hint="TODO — wymaga modelu FotoMatchSwipe." checked={s.exclude_already_seen} onChange={v => update('exclude_already_seen', v)} />
                <Toggle label="Pomiń już dopasowanych" hint="TODO — wymaga modelu FotoMatchSwipe." checked={s.exclude_already_matched} onChange={v => update('exclude_already_matched', v)} />
            </Section>

            {/* SEKCJA: Bonus referralowy */}
            <Section icon={<Gift className="w-5 h-5" />} title="Bonus referralowy" subtitle="Voucher dla polecającego po zaakceptowaniu profilu zaproszonej osoby.">
                <Toggle label="Bonus włączony" hint="Bez tego polecenie tylko podlinkuje, ale voucher nie powstanie." checked={s.referral_bonus_enabled} onChange={v => update('referral_bonus_enabled', v)} />
                {s.referral_bonus_enabled && (
                    <>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                            <RadioCard checked={s.referral_bonus_type === 'AMOUNT'} onClick={() => update('referral_bonus_type', 'AMOUNT')} label="Kwota" desc="np. 50 zł" />
                            <RadioCard checked={s.referral_bonus_type === 'PERCENT'} onClick={() => update('referral_bonus_type', 'PERCENT')} label="Procent" desc="np. 10%" />
                            <RadioCard checked={s.referral_bonus_type === 'BOTH'} onClick={() => update('referral_bonus_type', 'BOTH')} label="Oba" desc="kwota + procent" />
                        </div>
                        <NumberInput label="Kwota (grosze)" value={s.referral_bonus_amount_grosze} min={0} max={1_000_000} step={100} onChange={v => update('referral_bonus_amount_grosze', v)} suffix={`= ${(s.referral_bonus_amount_grosze / 100).toFixed(2)} zł`} />
                        <NumberInput label="Procent" value={s.referral_bonus_percent} min={0} max={100} onChange={v => update('referral_bonus_percent', v)} suffix="%" />
                        <NumberInput label="Min. wartość zamówienia (zł)" value={s.referral_bonus_min_to_redeem} min={0} onChange={v => update('referral_bonus_min_to_redeem', v)} />
                        <NumberInput label="Ważność vouchera (dni)" value={s.referral_bonus_expires_days} min={0} max={3650} onChange={v => update('referral_bonus_expires_days', v)} />
                    </>
                )}
            </Section>

            <div className="sticky bottom-4 z-10 flex justify-end">
                <button
                    onClick={save}
                    disabled={saving}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-900 font-bold px-6 py-3 rounded-xl shadow-xl flex items-center gap-2"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Zapisz ustawienia
                </button>
            </div>
        </div>
    );
}

function Section({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-4">
                <div className="text-amber-400 mt-0.5">{icon}</div>
                <div>
                    <h2 className="text-lg font-semibold text-white">{title}</h2>
                    {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-start gap-3 cursor-pointer hover:bg-zinc-800/50 -mx-2 px-2 py-2 rounded-lg">
            <input
                type="checkbox"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
                className="mt-1 w-5 h-5 rounded accent-amber-500"
            />
            <div className="flex-1">
                <div className="text-white text-sm font-medium">{label}</div>
                {hint && <div className="text-xs text-zinc-400 mt-0.5">{hint}</div>}
            </div>
        </label>
    );
}

function NumberInput({ label, value, min, max, step, onChange, suffix }: { label: string; value: number; min?: number; max?: number; step?: number; onChange: (v: number) => void; suffix?: string }) {
    return (
        <div className="flex items-center gap-3 ml-8">
            <label className="text-sm text-zinc-300 flex-1">{label}</label>
            <input
                type="number"
                value={value}
                min={min}
                max={max}
                step={step ?? 1}
                onChange={e => onChange(Number(e.target.value))}
                className="bg-zinc-800 border border-zinc-700 text-white px-3 py-1.5 rounded-lg w-28 text-right"
            />
            {suffix && <span className="text-xs text-zinc-400 w-24">{suffix}</span>}
        </div>
    );
}

function RadioCard({ checked, onClick, label, desc }: { checked: boolean; onClick: () => void; label: string; desc: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`text-left p-3 rounded-xl border transition ${checked ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'}`}
        >
            <div className={`text-sm font-bold ${checked ? 'text-amber-300' : 'text-white'}`}>{label}</div>
            <div className="text-xs text-zinc-400 mt-0.5">{desc}</div>
        </button>
    );
}
