'use client';

import { useEffect, useState } from 'react';
import {
    Plus,
    Pencil,
    Trash2,
    X,
    Save,
    Loader2,
    GripVertical,
    MapPin,
    Image as ImageIcon,
    Eye,
    EyeOff,
    AlertCircle,
    ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MediaPicker from '@/components/admin/MediaPicker';

interface ChallengeLocation {
    id: number;
    name: string;
    description: string;
    address: string;
    google_maps_url: string;
    image_url: string;
    is_active: boolean;
    display_order: number;
}

type Draft = Partial<ChallengeLocation> & { id?: number };

function authHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function isValidMapsUrl(url: string): boolean {
    if (!url) return true;
    try {
        const u = new URL(url);
        return /(^|\.)google\.[a-z.]+$|(^|\.)goo\.gl$|(^|\.)maps\.app\.goo\.gl$/.test(u.hostname);
    } catch {
        return false;
    }
}

function LocationCard({
    loc,
    onEdit,
    onDelete,
    onToggleActive,
}: {
    loc: ChallengeLocation;
    onEdit: () => void;
    onDelete: () => void;
    onToggleActive: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: loc.id });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
            className={`bg-zinc-900 border rounded-xl overflow-hidden flex flex-col ${loc.is_active ? 'border-zinc-800' : 'border-zinc-800/60 opacity-70'}`}
        >
            <div className="relative aspect-[16/9] bg-zinc-950">
                {loc.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={loc.image_url} alt={loc.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                        <ImageIcon size={36} />
                    </div>
                )}
                <button
                    type="button"
                    aria-label="Przeciągnij aby zmienić kolejność"
                    className="absolute top-2 left-2 p-1.5 rounded bg-black/60 hover:bg-black/80 text-white cursor-grab active:cursor-grabbing touch-none"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical size={16} />
                </button>
                <span
                    className={`absolute top-2 right-2 px-2 py-1 text-[11px] uppercase tracking-wide font-semibold rounded ${loc.is_active
                        ? 'bg-emerald-500/90 text-black'
                        : 'bg-zinc-700/90 text-zinc-200'
                        }`}
                >
                    {loc.is_active ? 'Aktywna' : 'Ukryta'}
                </span>
            </div>

            <div className="p-4 sm:p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-1 truncate">{loc.name}</h3>
                {loc.address && (
                    <div className="flex items-start gap-1.5 text-sm text-zinc-400 mb-2">
                        <MapPin size={14} className="mt-0.5 shrink-0" />
                        <span className="break-words">{loc.address}</span>
                    </div>
                )}
                {loc.description && (
                    <p className="text-zinc-500 text-sm mb-3 line-clamp-2">{loc.description}</p>
                )}

                <div className="mt-auto flex flex-wrap gap-2 pt-3 border-t border-zinc-800">
                    <button
                        onClick={onEdit}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg"
                    >
                        <Pencil size={14} /> Edytuj
                    </button>
                    <button
                        onClick={onToggleActive}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-lg"
                    >
                        {loc.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                        {loc.is_active ? 'Ukryj' : 'Pokaż'}
                    </button>
                    {loc.google_maps_url && (
                        <a
                            href={loc.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-blue-300 text-sm rounded-lg"
                        >
                            <ExternalLink size={14} /> Mapa
                        </a>
                    )}
                    <button
                        onClick={onDelete}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600/15 hover:bg-red-600/30 text-red-300 text-sm rounded-lg ml-auto"
                    >
                        <Trash2 size={14} /> Usuń
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function LocationsPage() {
    const [locations, setLocations] = useState<ChallengeLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingOrder, setSavingOrder] = useState(false);

    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [draft, setDraft] = useState<Draft>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showMediaPicker, setShowMediaPicker] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        fetchLocations();
    }, []);

    async function fetchLocations() {
        setLoading(true);
        try {
            const res = await fetch('/api/photo-challenge/locations?all=1', { headers: authHeaders() });
            const data = await res.json();
            if (res.ok && data.success) {
                setLocations([...data.locations].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)));
            } else {
                toast.error('Nie udało się pobrać lokalizacji');
            }
        } catch {
            toast.error('Nie udało się pobrać lokalizacji');
        } finally {
            setLoading(false);
        }
    }

    function openNew() {
        setDraft({
            name: '',
            description: '',
            address: '',
            google_maps_url: '',
            image_url: '',
            is_active: true,
        });
        setErrors({});
        setOpen(true);
    }

    function openEdit(loc: ChallengeLocation) {
        setDraft({ ...loc });
        setErrors({});
        setOpen(true);
    }

    function close() {
        if (saving) return;
        setOpen(false);
    }

    function validate(): boolean {
        const e: Record<string, string> = {};
        if (!draft.name?.trim()) e.name = 'Nazwa jest wymagana';
        if (!draft.address?.trim()) e.address = 'Adres jest wymagany';
        if (draft.google_maps_url && !isValidMapsUrl(draft.google_maps_url)) {
            e.google_maps_url = 'Podaj poprawny URL z google.com / maps.app.goo.gl';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSave() {
        if (!validate()) {
            toast.error('Popraw błędy w formularzu');
            return;
        }
        if (!authHeaders().Authorization) {
            toast.error('Brak autoryzacji. Zaloguj się ponownie.');
            return;
        }
        setSaving(true);
        const method = draft.id ? 'PUT' : 'POST';
        try {
            const res = await fetch('/api/photo-challenge/locations', {
                method,
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify(draft),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(draft.id ? 'Zaktualizowano lokalizację' : 'Dodano lokalizację');
                setOpen(false);
                fetchLocations();
            } else {
                toast.error(data.error || 'Nie udało się zapisać');
            }
        } catch {
            toast.error('Błąd sieci');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: number, name: string) {
        if (!confirm(`Usunąć lokalizację „${name}"? Tej operacji nie można cofnąć.`)) return;
        try {
            const res = await fetch(`/api/photo-challenge/locations?id=${id}`, {
                method: 'DELETE',
                headers: authHeaders(),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success('Usunięto');
                setLocations((arr) => arr.filter((x) => x.id !== id));
            } else {
                toast.error(data.error || 'Nie udało się usunąć');
            }
        } catch {
            toast.error('Błąd sieci');
        }
    }

    async function handleToggleActive(loc: ChallengeLocation) {
        const next = !loc.is_active;
        setLocations((arr) => arr.map((l) => (l.id === loc.id ? { ...l, is_active: next } : l)));
        try {
            await fetch('/api/photo-challenge/locations', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ ...loc, is_active: next }),
            });
        } catch {
            toast.error('Nie udało się zmienić statusu');
            setLocations((arr) => arr.map((l) => (l.id === loc.id ? { ...l, is_active: !next } : l)));
        }
    }

    async function handleDragEnd(e: DragEndEvent) {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const oldIndex = locations.findIndex((l) => l.id === active.id);
        const newIndex = locations.findIndex((l) => l.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;
        const reordered = arrayMove(locations, oldIndex, newIndex);
        setLocations(reordered);
        setSavingOrder(true);
        try {
            const res = await fetch('/api/photo-challenge/locations/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ ids: reordered.map((l) => l.id) }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error('save failed');
        } catch {
            toast.error('Nie udało się zapisać kolejności');
            fetchLocations();
        } finally {
            setSavingOrder(false);
        }
    }

    function handleImageSelect(url: string | string[]) {
        const single = Array.isArray(url) ? url[0] : url;
        setDraft((d) => ({ ...d, image_url: single }));
        setShowMediaPicker(false);
    }

    return (
        <div className="text-white p-3 sm:p-6 max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold font-display text-gold-400 flex items-center gap-2">
                        <MapPin size={26} /> Lokalizacje Wyzwań
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1">
                        Przeciągnij za uchwyt na zdjęciu aby zmienić kolejność.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {savingOrder && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
                            <Loader2 size={14} className="animate-spin" /> Zapisuję kolejność…
                        </span>
                    )}
                    <button
                        onClick={openNew}
                        className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-black px-4 py-2 rounded-lg font-medium"
                    >
                        <Plus size={18} /> Dodaj lokalizację
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-zinc-400 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Ładowanie…
                </div>
            ) : locations.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
                    Brak lokalizacji. Kliknij „Dodaj lokalizację".
                </div>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={locations.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {locations.map((loc) => (
                                <LocationCard
                                    key={loc.id}
                                    loc={loc}
                                    onEdit={() => openEdit(loc)}
                                    onDelete={() => handleDelete(loc.id, loc.name)}
                                    onToggleActive={() => handleToggleActive(loc)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {open && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center sm:p-4"
                    onClick={close}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="bg-zinc-900 border border-zinc-700 w-full sm:max-w-3xl sm:rounded-2xl rounded-t-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-zinc-800 bg-zinc-900 rounded-t-2xl">
                            <h2 className="text-lg sm:text-xl font-bold text-white">
                                {draft.id ? 'Edytuj lokalizację' : 'Nowa lokalizacja'}
                            </h2>
                            <button
                                onClick={close}
                                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
                                aria-label="Zamknij"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">
                                    Nazwa <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={draft.name || ''}
                                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                                    maxLength={80}
                                    className={`w-full bg-zinc-800 border rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 ${errors.name ? 'border-red-500 focus:ring-red-500/40' : 'border-zinc-700 focus:ring-gold-500/40'}`}
                                    placeholder="np. Park Miejski w Toruniu"
                                />
                                {errors.name && (
                                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                        <AlertCircle size={12} /> {errors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">
                                    Adres <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={draft.address || ''}
                                    onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                                    maxLength={200}
                                    className={`w-full bg-zinc-800 border rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 ${errors.address ? 'border-red-500 focus:ring-red-500/40' : 'border-zinc-700 focus:ring-gold-500/40'}`}
                                    placeholder="ul. Bydgoska 1, 87-100 Toruń"
                                />
                                {errors.address && (
                                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                        <AlertCircle size={12} /> {errors.address}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Link Google Maps</label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={draft.google_maps_url || ''}
                                        onChange={(e) => setDraft({ ...draft, google_maps_url: e.target.value })}
                                        className={`flex-1 bg-zinc-800 border rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 ${errors.google_maps_url ? 'border-red-500 focus:ring-red-500/40' : 'border-zinc-700 focus:ring-gold-500/40'}`}
                                        placeholder="https://maps.app.goo.gl/..."
                                    />
                                    {draft.address && (
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(draft.address)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-zinc-200 text-sm inline-flex items-center gap-1"
                                            title="Wyszukaj adres w Google Maps"
                                        >
                                            <ExternalLink size={14} /> Sprawdź
                                        </a>
                                    )}
                                </div>
                                {errors.google_maps_url && (
                                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                        <AlertCircle size={12} /> {errors.google_maps_url}
                                    </p>
                                )}
                                {draft.google_maps_url && !errors.google_maps_url && (
                                    <a
                                        href={draft.google_maps_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-400 hover:underline mt-1 inline-flex items-center gap-1"
                                    >
                                        <ExternalLink size={12} /> Otwórz podany link
                                    </a>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Zdjęcie</label>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="w-full sm:w-40 h-28 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950 flex items-center justify-center shrink-0">
                                        {draft.image_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={draft.image_url} alt="Podgląd" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon size={28} className="text-zinc-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <input
                                            type="text"
                                            value={draft.image_url || ''}
                                            onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                                            placeholder="URL zdjęcia"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowMediaPicker(true)}
                                                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-200 text-sm inline-flex items-center justify-center gap-2"
                                            >
                                                <ImageIcon size={14} /> Wybierz z galerii
                                            </button>
                                            {draft.image_url && (
                                                <button
                                                    type="button"
                                                    onClick={() => setDraft({ ...draft, image_url: '' })}
                                                    className="px-3 py-2 bg-red-600/15 hover:bg-red-600/30 text-red-300 rounded-lg text-sm"
                                                >
                                                    Wyczyść
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Opis</label>
                                <textarea
                                    value={draft.description || ''}
                                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                                    maxLength={400}
                                    rows={3}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                                    placeholder="Krótki opis lokalizacji widoczny na zaproszeniu"
                                />
                                <p className="text-xs text-zinc-500 mt-1">{(draft.description || '').length}/400</p>
                            </div>

                            <div className="flex items-center justify-between bg-zinc-800/40 rounded-lg p-3 border border-zinc-700/60">
                                <div>
                                    <p className="text-white font-medium">Aktywna</p>
                                    <p className="text-xs text-zinc-400">Wyłączone lokalizacje nie pojawią się w nowych zaproszeniach.</p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={draft.is_active ?? true}
                                    onClick={() => setDraft({ ...draft, is_active: !(draft.is_active ?? true) })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${draft.is_active ?? true ? 'bg-gold-500' : 'bg-zinc-600'}`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${draft.is_active ?? true ? 'translate-x-5' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>
                        </div>

                        <div className="px-4 sm:px-6 py-3 border-t border-zinc-800 bg-zinc-900 flex items-center justify-end gap-3 rounded-b-2xl">
                            <button
                                onClick={close}
                                disabled={saving}
                                className="px-4 py-2 rounded-lg text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                            >
                                Anuluj
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black px-5 py-2 rounded-lg font-medium"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {saving ? 'Zapisywanie…' : 'Zapisz'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <MediaPicker
                isOpen={showMediaPicker}
                onClose={() => setShowMediaPicker(false)}
                onSelect={(urls: string | string[]) => handleImageSelect(urls)}
            />
        </div>
    );
}
