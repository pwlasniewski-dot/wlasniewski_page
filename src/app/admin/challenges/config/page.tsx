'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, Image as ImageIcon, Plus, Trash2, GripVertical, MapPin, ExternalLink, Loader2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import MediaPicker from '@/components/admin/MediaPicker';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChallengeSettings {
    module_enabled: boolean;
    public_gallery_enabled: boolean;
    landing_headline: string;
    landing_subtitle: string;
    cta_button_text: string;
    social_proof_enabled: boolean;
    enable_carousels: boolean;
    enable_parallax: boolean;
    acceptance_deadline_hours: number;
    monthly_challenge_limit: number;
    hq_latitude: number;
    hq_longitude: number;
    max_radius_km: number;
}

const DEFAULTS: ChallengeSettings = {
    module_enabled: true,
    public_gallery_enabled: false, // strona /foto-wyzwanie/galeria nie istnieje jeszcze
    landing_headline: 'Przyjmij foto-wyzwanie',
    landing_subtitle: 'Zaproś kogoś na sesję…',
    cta_button_text: 'Zacznij wyzwanie',
    social_proof_enabled: true,
    enable_carousels: true,
    enable_parallax: false,
    acceptance_deadline_hours: 24,
    monthly_challenge_limit: 10,
    hq_latitude: 53.2952,
    hq_longitude: 18.7845,
    max_radius_km: 60,
};

// Backwards-compat: server may still return `fomo_countdown_hours`.
function normalizeFromApi(s: any): ChallengeSettings {
    return {
        ...DEFAULTS,
        ...s,
        acceptance_deadline_hours:
            Number(s?.acceptance_deadline_hours ?? s?.fomo_countdown_hours ?? DEFAULTS.acceptance_deadline_hours) || DEFAULTS.acceptance_deadline_hours,
    };
}

// ---------------------------------------------------------------------------
// Reusable UI primitives (kept inline — single-file panel)
// ---------------------------------------------------------------------------

function SectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <section className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 sm:p-6 mb-6">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-white">
                    <span className="w-1 h-6 bg-gold-500 rounded-full" />
                    {title}
                </h2>
                {action}
            </header>
            {children}
        </section>
    );
}

function Toggle({
    label,
    description,
    checked,
    onChange,
    disabled,
}: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <label className={`flex items-start justify-between gap-3 p-3 bg-zinc-800/50 hover:bg-zinc-800/70 transition rounded-lg cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <div className="min-w-0">
                <div className="font-medium text-white text-sm">{label}</div>
                {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => !disabled && onChange(!checked)}
                disabled={disabled}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${checked ? 'bg-gold-500' : 'bg-zinc-700'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </label>
    );
}

function NumberField({
    label,
    value,
    onChange,
    min = 0,
    max,
    step = 1,
    suffix,
    placeholder,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
    placeholder?: string;
}) {
    return (
        <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">{label}</label>
            <div className="relative">
                <input
                    type="number"
                    inputMode="decimal"
                    value={Number.isFinite(value) ? value : ''}
                    onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === '') return onChange(NaN);
                        const n = Number(raw);
                        if (!Number.isFinite(n)) return;
                        let next = n;
                        if (typeof min === 'number') next = Math.max(min, next);
                        if (typeof max === 'number') next = Math.min(max, next);
                        onChange(next);
                    }}
                    onBlur={(e) => {
                        if (e.target.value === '' || !Number.isFinite(Number(e.target.value))) onChange(min);
                    }}
                    step={step}
                    placeholder={placeholder}
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/40 outline-none rounded-lg p-2.5 text-white text-sm transition pr-12"
                />
                {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">{suffix}</span>}
            </div>
        </div>
    );
}

function TextField({
    label,
    value,
    onChange,
    placeholder,
    maxLength,
    multiline,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    maxLength?: number;
    multiline?: boolean;
}) {
    const Cmp: any = multiline ? 'textarea' : 'input';
    return (
        <div>
            <div className="flex items-baseline justify-between mb-1.5">
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium">{label}</label>
                {maxLength && <span className="text-[10px] text-zinc-600">{value.length}/{maxLength}</span>}
            </div>
            <Cmp
                value={value}
                onChange={(e: any) => onChange(e.target.value)}
                placeholder={placeholder}
                maxLength={maxLength}
                className={`w-full bg-zinc-800 border border-zinc-700 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/40 outline-none rounded-lg p-2.5 text-white text-sm transition ${multiline ? 'min-h-[80px] resize-y' : ''}`}
            />
        </div>
    );
}

function StickyActionBar({
    dirty,
    saving,
    onSave,
    onReset,
}: {
    dirty: boolean;
    saving: boolean;
    onSave: () => void;
    onReset: () => void;
}) {
    return (
        <div
            className={`sticky bottom-3 z-30 transition-all ${dirty ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-2'}`}
        >
            <div className="bg-zinc-900/95 backdrop-blur border border-gold-500/30 shadow-2xl shadow-black/60 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="text-sm text-zinc-300 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
                    Masz niezapisane zmiany
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onReset}
                        disabled={saving}
                        className="flex-1 sm:flex-initial bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition"
                    >
                        <RotateCcw size={16} /> Cofnij
                    </button>
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="flex-1 sm:flex-initial bg-gold-500 hover:bg-gold-600 disabled:opacity-60 text-black font-medium px-5 py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {saving ? 'Zapisywanie…' : 'Zapisz zmiany'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Sortable photo card
// ---------------------------------------------------------------------------

function SortablePhoto({ id, url, onRemove }: { id: string; url: string; onRemove: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };
    return (
        <div ref={setNodeRef} style={style} className="group relative aspect-[2/3] bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
            <img src={url} alt="" loading="lazy" className="w-full h-full object-cover pointer-events-none" />
            <button
                {...attributes}
                {...listeners}
                aria-label="Przeciągnij, aby zmienić kolejność"
                className="absolute top-2 left-2 p-1.5 rounded-md bg-black/60 text-white/90 hover:bg-black/80 cursor-grab active:cursor-grabbing touch-none"
            >
                <GripVertical size={14} />
            </button>
            <button
                onClick={onRemove}
                aria-label="Usuń"
                className="absolute top-2 right-2 p-1.5 rounded-md bg-red-500/90 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 sm:opacity-0 transition focus:opacity-100"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ChallengeConfigPage() {
    const [settings, setSettings] = useState<ChallengeSettings>(DEFAULTS);
    const [savedSettings, setSavedSettings] = useState<ChallengeSettings>(DEFAULTS);
    const [carouselPhotos, setCarouselPhotos] = useState<string[]>([]);
    const [savedCarouselPhotos, setSavedCarouselPhotos] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [savingCarousel, setSavingCarousel] = useState(false);
    const [showMediaPicker, setShowMediaPicker] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    useEffect(() => {
        fetchAll();
    }, []);

    const tokenHeaders = (): HeadersInit => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        return {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    };

    async function fetchAll() {
        setLoading(true);
        try {
            const [sRes, eRes] = await Promise.all([
                fetch('/api/photo-challenge/settings', { headers: tokenHeaders() }),
                fetch('/api/effects?page=foto-wyzwanie&section=main'),
            ]);
            const sData = await sRes.json();
            const eData = await eRes.json();
            if (sData?.success) {
                const norm = normalizeFromApi(sData.settings || {});
                setSettings(norm);
                setSavedSettings(norm);
            }
            if (eData?.success && Array.isArray(eData.effects) && eData.effects.length > 0) {
                try {
                    const photos = JSON.parse(eData.effects[0].manual_photos || '[]');
                    if (Array.isArray(photos)) {
                        setCarouselPhotos(photos);
                        setSavedCarouselPhotos(photos);
                    }
                } catch { /* noop */ }
            }
        } catch {
            toast.error('Nie udało się pobrać konfiguracji');
        } finally {
            setLoading(false);
        }
    }

    const settingsDirty = JSON.stringify(settings) !== JSON.stringify(savedSettings);
    const carouselDirty = JSON.stringify(carouselPhotos) !== JSON.stringify(savedCarouselPhotos);
    const dirty = settingsDirty || carouselDirty;

    async function saveSettings() {
        if (savingSettings) return;
        setSavingSettings(true);
        try {
            const res = await fetch('/api/photo-challenge/settings', {
                method: 'POST',
                headers: tokenHeaders(),
                body: JSON.stringify(settings),
            });
            const data = await res.json();
            if (res.ok && data?.success) {
                setSavedSettings(settings);
                toast.success('Ustawienia zapisane');
            } else {
                toast.error(data?.error || 'Błąd zapisu ustawień');
            }
        } catch {
            toast.error('Błąd sieci podczas zapisu ustawień');
        } finally {
            setSavingSettings(false);
        }
    }

    async function saveCarousel() {
        if (savingCarousel) return;
        setSavingCarousel(true);
        try {
            const res = await fetch('/api/photo-challenge/config', {
                method: 'POST',
                headers: tokenHeaders(),
                body: JSON.stringify({
                    page_slug: 'foto-wyzwanie',
                    section_name: 'main',
                    effect_type: 'carousel',
                    is_enabled: true,
                    manual_photos: JSON.stringify(carouselPhotos),
                    config: JSON.stringify({ autoplay: true, interval: 3000 }),
                }),
            });
            const data = await res.json();
            if (res.ok && data?.success) {
                setSavedCarouselPhotos(carouselPhotos);
                toast.success('Karuzela zapisana');
            } else {
                toast.error(data?.error || 'Błąd zapisu karuzeli');
            }
        } catch {
            toast.error('Błąd sieci podczas zapisu karuzeli');
        } finally {
            setSavingCarousel(false);
        }
    }

    async function saveAll() {
        const ops: Promise<any>[] = [];
        if (settingsDirty) ops.push(saveSettings());
        if (carouselDirty) ops.push(saveCarousel());
        await Promise.all(ops);
    }

    function resetAll() {
        setSettings(savedSettings);
        setCarouselPhotos(savedCarouselPhotos);
        toast('Cofnięto zmiany', { icon: '↩️' });
    }

    function handleAddPhotos(urls: string | string[]) {
        const arr = Array.isArray(urls) ? urls : [urls];
        setCarouselPhotos((prev) => [...prev, ...arr]);
        setShowMediaPicker(false);
    }

    function handleDragEnd(e: DragEndEvent) {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const oldIndex = carouselPhotos.findIndex((u, i) => `${u}::${i}` === active.id);
        const newIndex = carouselPhotos.findIndex((u, i) => `${u}::${i}` === over.id);
        if (oldIndex < 0 || newIndex < 0) return;
        setCarouselPhotos((items) => arrayMove(items, oldIndex, newIndex));
    }

    function useMyLocation() {
        if (!('geolocation' in navigator)) {
            toast.error('Przeglądarka nie wspiera geolokalizacji');
            return;
        }
        toast.loading('Pobieranie lokalizacji…', { id: 'geo' });
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setSettings((s) => ({
                    ...s,
                    hq_latitude: Number(pos.coords.latitude.toFixed(6)),
                    hq_longitude: Number(pos.coords.longitude.toFixed(6)),
                }));
                toast.success('Lokalizacja ustawiona', { id: 'geo' });
            },
            (err) => {
                toast.error(`Błąd geolokalizacji: ${err.message}`, { id: 'geo' });
            },
            { enableHighAccuracy: true, timeout: 8000 },
        );
    }

    if (loading) {
        return (
            <div className="text-zinc-400 flex items-center gap-3 p-8">
                <Loader2 className="animate-spin" /> Ładowanie konfiguracji…
            </div>
        );
    }

    const photoIds = carouselPhotos.map((u, i) => `${u}::${i}`);
    const mapsUrl = `https://www.google.com/maps?q=${settings.hq_latitude},${settings.hq_longitude}`;

    return (
        <div className="text-white max-w-5xl mx-auto pb-24 px-3 sm:px-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold font-display text-gold-400">Konfiguracja Foto-Wyzwań</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        Wszystkie zmiany trzeba zapisać — pasek pojawi się na dole, gdy coś zmienisz.
                    </p>
                </div>
            </div>

            {/* SECTION 1 — Module + landing */}
            <SectionCard title="Moduł i strona główna">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <Toggle
                        label="Włącz moduł Foto-Wyzwań"
                        description="Wyłączenie ukrywa wszystkie publiczne strony modułu."
                        checked={settings.module_enabled}
                        onChange={(v) => setSettings({ ...settings, module_enabled: v })}
                    />
                    <Toggle
                        label="Publiczna galeria par"
                        description="Strona /foto-wyzwanie/galeria — funkcja w przygotowaniu, nie włączaj."
                        checked={settings.public_gallery_enabled}
                        onChange={(v) => setSettings({ ...settings, public_gallery_enabled: v })}
                        disabled
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <TextField
                        label="Nagłówek strony (H1)"
                        value={settings.landing_headline}
                        onChange={(v) => setSettings({ ...settings, landing_headline: v })}
                        placeholder="Przyjmij foto-wyzwanie"
                        maxLength={60}
                    />
                    <TextField
                        label="Tekst przycisku CTA"
                        value={settings.cta_button_text}
                        onChange={(v) => setSettings({ ...settings, cta_button_text: v })}
                        placeholder="Zacznij wyzwanie"
                        maxLength={30}
                    />
                </div>

                <TextField
                    label="Podtytuł"
                    value={settings.landing_subtitle}
                    onChange={(v) => setSettings({ ...settings, landing_subtitle: v })}
                    placeholder="Zaproś kogoś na sesję…"
                    maxLength={160}
                    multiline
                />
            </SectionCard>

            {/* SECTION 2 — Effects */}
            <SectionCard title="Efekty wizualne">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <Toggle
                        label="Social proof"
                        description="Liczniki par, ostatnie aktywności"
                        checked={settings.social_proof_enabled}
                        onChange={(v) => setSettings({ ...settings, social_proof_enabled: v })}
                    />
                    <Toggle
                        label="Karuzela zdjęć"
                        description="Slider na górze strony"
                        checked={settings.enable_carousels}
                        onChange={(v) => setSettings({ ...settings, enable_carousels: v })}
                    />
                    <Toggle
                        label="Paralaksa"
                        description="Efekt głębi przy przewijaniu"
                        checked={settings.enable_parallax}
                        onChange={(v) => setSettings({ ...settings, enable_parallax: v })}
                    />
                </div>
            </SectionCard>

            {/* SECTION 3 — Limits */}
            <SectionCard title="Akceptacja & limity">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <NumberField
                        label="Czas na akceptację"
                        value={settings.acceptance_deadline_hours}
                        onChange={(v) => setSettings({ ...settings, acceptance_deadline_hours: v })}
                        min={1}
                        max={720}
                        suffix="godz."
                    />
                    <NumberField
                        label="Limit miesięczny"
                        value={settings.monthly_challenge_limit}
                        onChange={(v) => setSettings({ ...settings, monthly_challenge_limit: v })}
                        min={1}
                        max={500}
                        suffix="sesji"
                    />
                </div>
            </SectionCard>

            {/* SECTION 4 — Location */}
            <SectionCard
                title="Lokalizacja bazowa"
                action={
                    <div className="flex gap-2">
                        <button
                            onClick={useMyLocation}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition"
                        >
                            <MapPin size={14} /> Użyj mojej lokalizacji
                        </button>
                        <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition"
                        >
                            <ExternalLink size={14} /> Sprawdź na mapie
                        </a>
                    </div>
                }
            >
                <p className="text-xs text-zinc-500 mb-4">
                    Punkt odniesienia do liczenia odległości / dojazdu na sesje plenerowe.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <NumberField
                        label="Szerokość (lat)"
                        value={settings.hq_latitude}
                        onChange={(v) => setSettings({ ...settings, hq_latitude: v })}
                        min={-90}
                        max={90}
                        step={0.000001}
                        placeholder="53.2952"
                    />
                    <NumberField
                        label="Długość (lng)"
                        value={settings.hq_longitude}
                        onChange={(v) => setSettings({ ...settings, hq_longitude: v })}
                        min={-180}
                        max={180}
                        step={0.000001}
                        placeholder="18.7845"
                    />
                    <NumberField
                        label="Maks. promień"
                        value={settings.max_radius_km}
                        onChange={(v) => setSettings({ ...settings, max_radius_km: v })}
                        min={1}
                        max={1000}
                        suffix="km"
                    />
                </div>
            </SectionCard>

            {/* SECTION 5 — Carousel */}
            <SectionCard
                title="Zdjęcia karuzeli"
                action={
                    <button
                        onClick={() => setShowMediaPicker(true)}
                        className="bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 text-gold-400 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition"
                    >
                        <Plus size={16} /> Dodaj zdjęcia
                    </button>
                }
            >
                {carouselPhotos.length === 0 ? (
                    <button
                        onClick={() => setShowMediaPicker(true)}
                        className="w-full text-center py-12 border-2 border-dashed border-zinc-800 hover:border-gold-500/40 hover:bg-zinc-800/30 rounded-xl text-zinc-500 hover:text-zinc-300 transition"
                    >
                        <ImageIcon className="mx-auto w-12 h-12 mb-2 opacity-50" />
                        <p className="text-sm">Brak zdjęć. Kliknij, aby dodać pierwsze.</p>
                    </button>
                ) : (
                    <>
                        <p className="text-xs text-zinc-500 mb-3">
                            Przeciągnij <GripVertical size={12} className="inline -mt-0.5" /> aby zmienić kolejność. Najechanie kursorem pokazuje przycisk usuwania.
                        </p>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={photoIds} strategy={rectSortingStrategy}>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {carouselPhotos.map((url, i) => (
                                        <SortablePhoto
                                            key={`${url}::${i}`}
                                            id={`${url}::${i}`}
                                            url={url}
                                            onRemove={() => setCarouselPhotos((p) => p.filter((_, idx) => idx !== i))}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </>
                )}
            </SectionCard>

            {/* Sticky save bar */}
            <StickyActionBar dirty={dirty} saving={savingSettings || savingCarousel} onSave={saveAll} onReset={resetAll} />

            <MediaPicker
                isOpen={showMediaPicker}
                onClose={() => setShowMediaPicker(false)}
                onSelect={handleAddPhotos}
                multiple={true}
            />
        </div>
    );
}
