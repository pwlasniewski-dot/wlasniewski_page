'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    Plus,
    Pencil,
    Trash2,
    X,
    Save,
    Loader2,
    GripVertical,
    Package as PackageIcon,
    Eye,
    EyeOff,
    AlertCircle,
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

interface ChallengePackage {
    id: number;
    name: string;
    description: string;
    base_price: number;
    challenge_price: number;
    discount_percentage: number;
    included_items: string;
    is_active: boolean;
    display_order: number;
}

type Draft = Partial<ChallengePackage> & { id?: number };

function authHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function safeParseItems(raw: string | undefined | null): string[] {
    try {
        const parsed = JSON.parse(raw || '[]');
        return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : [];
    } catch {
        return [];
    }
}

function calcDiscount(base: number, challenge: number) {
    if (!base || base <= 0 || challenge < 0 || challenge >= base) return 0;
    return Math.round(((base - challenge) / base) * 100);
}

function PackageCard({
    pkg,
    onEdit,
    onDelete,
    onToggleActive,
}: {
    pkg: ChallengePackage;
    onEdit: () => void;
    onDelete: () => void;
    onToggleActive: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pkg.id });
    const items = safeParseItems(pkg.included_items);
    const discount = pkg.discount_percentage || calcDiscount(pkg.base_price, pkg.challenge_price);

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
            className={`bg-zinc-900 border rounded-xl overflow-hidden ${pkg.is_active ? 'border-zinc-800' : 'border-zinc-800/60 opacity-70'}`}
        >
            <div className="flex items-stretch">
                <button
                    type="button"
                    aria-label="Przeciągnij aby zmienić kolejność"
                    className="flex items-center justify-center px-2 sm:px-3 bg-zinc-950/40 hover:bg-zinc-800 cursor-grab active:cursor-grabbing touch-none text-zinc-500 hover:text-zinc-300 transition-colors"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical size={18} />
                </button>

                <div className="flex-1 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold text-white truncate">{pkg.name}</h3>
                            {pkg.description && (
                                <p className="text-zinc-400 text-sm mt-1 line-clamp-2">{pkg.description}</p>
                            )}
                        </div>
                        <span
                            className={`shrink-0 px-2 py-1 text-[11px] uppercase tracking-wide font-semibold rounded ${pkg.is_active
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : 'bg-zinc-700/40 text-zinc-400 border border-zinc-700'
                                }`}
                        >
                            {pkg.is_active ? 'Aktywny' : 'Ukryty'}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                        <span className="text-zinc-500 line-through text-sm">{pkg.base_price} zł</span>
                        <span className="text-2xl font-bold text-gold-400">{pkg.challenge_price} zł</span>
                        {discount > 0 && (
                            <span className="text-emerald-400 text-sm font-semibold">−{discount}%</span>
                        )}
                    </div>

                    {items.length > 0 && (
                        <ul className="text-sm text-zinc-300 space-y-1 mb-4">
                            {items.slice(0, 5).map((it, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-gold-400 mt-0.5">•</span>
                                    <span className="min-w-0 break-words">{it}</span>
                                </li>
                            ))}
                            {items.length > 5 && (
                                <li className="text-zinc-500 text-xs pl-4">+ {items.length - 5} więcej…</li>
                            )}
                        </ul>
                    )}

                    <div className="flex flex-wrap gap-2 pt-3 border-t border-zinc-800">
                        <button
                            onClick={onEdit}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition-colors"
                        >
                            <Pencil size={14} /> Edytuj
                        </button>
                        <button
                            onClick={onToggleActive}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-lg transition-colors"
                        >
                            {pkg.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                            {pkg.is_active ? 'Ukryj' : 'Pokaż'}
                        </button>
                        <button
                            onClick={onDelete}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600/15 hover:bg-red-600/30 text-red-300 text-sm rounded-lg transition-colors ml-auto"
                        >
                            <Trash2 size={14} /> Usuń
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SortableItemRow({ id, children }: { id: string; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    return (
        <li
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
            className="flex items-center gap-2 bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-2 py-2"
        >
            <button
                type="button"
                className="text-zinc-500 hover:text-zinc-300 cursor-grab active:cursor-grabbing touch-none"
                aria-label="Przeciągnij"
                {...attributes}
                {...listeners}
            >
                <GripVertical size={16} />
            </button>
            {children}
        </li>
    );
}

export default function PackagesPage() {
    const [packages, setPackages] = useState<ChallengePackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingOrder, setSavingOrder] = useState(false);

    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [draft, setDraft] = useState<Draft>({});
    const [items, setItems] = useState<string[]>([]);
    const [newItem, setNewItem] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        fetchPackages();
    }, []);

    async function fetchPackages() {
        setLoading(true);
        try {
            const res = await fetch('/api/photo-challenge/packages?all=1', { headers: authHeaders() });
            const data = await res.json();
            if (res.ok && data.success) {
                setPackages([...data.packages].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)));
            } else {
                toast.error('Nie udało się pobrać pakietów');
            }
        } catch {
            toast.error('Nie udało się pobrać pakietów');
        } finally {
            setLoading(false);
        }
    }

    function openNew() {
        setDraft({ name: '', description: '', base_price: 0, challenge_price: 0, is_active: true });
        setItems([]);
        setNewItem('');
        setErrors({});
        setOpen(true);
    }

    function openEdit(pkg: ChallengePackage) {
        setDraft({ ...pkg });
        setItems(safeParseItems(pkg.included_items));
        setNewItem('');
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
        const base = Number(draft.base_price);
        const ch = Number(draft.challenge_price);
        if (!base || base <= 0) e.base_price = 'Cena bazowa musi być > 0';
        if (ch < 0) e.challenge_price = 'Cena nie może być ujemna';
        if (base && ch >= base) e.challenge_price = 'Cena w wyzwaniu musi być niższa niż bazowa';
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
            const res = await fetch('/api/photo-challenge/packages', {
                method,
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({
                    ...draft,
                    base_price: Number(draft.base_price) || 0,
                    challenge_price: Number(draft.challenge_price) || 0,
                    included_items: JSON.stringify(items),
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(draft.id ? 'Zaktualizowano pakiet' : 'Dodano pakiet');
                setOpen(false);
                fetchPackages();
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
        if (!confirm(`Usunąć pakiet „${name}"? Tej operacji nie można cofnąć.`)) return;
        try {
            const res = await fetch(`/api/photo-challenge/packages?id=${id}`, {
                method: 'DELETE',
                headers: authHeaders(),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success('Usunięto');
                setPackages((p) => p.filter((x) => x.id !== id));
            } else {
                toast.error(data.error || 'Nie udało się usunąć');
            }
        } catch {
            toast.error('Błąd sieci');
        }
    }

    async function handleToggleActive(pkg: ChallengePackage) {
        const next = !pkg.is_active;
        setPackages((arr) => arr.map((p) => (p.id === pkg.id ? { ...p, is_active: next } : p)));
        try {
            await fetch('/api/photo-challenge/packages', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ ...pkg, is_active: next }),
            });
        } catch {
            toast.error('Nie udało się zmienić statusu');
            setPackages((arr) => arr.map((p) => (p.id === pkg.id ? { ...p, is_active: !next } : p)));
        }
    }

    async function handleDragEnd(e: DragEndEvent) {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const oldIndex = packages.findIndex((p) => p.id === active.id);
        const newIndex = packages.findIndex((p) => p.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;
        const reordered = arrayMove(packages, oldIndex, newIndex);
        setPackages(reordered);
        setSavingOrder(true);
        try {
            const res = await fetch('/api/photo-challenge/packages/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ ids: reordered.map((p) => p.id) }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error('save failed');
        } catch {
            toast.error('Nie udało się zapisać kolejności');
            fetchPackages();
        } finally {
            setSavingOrder(false);
        }
    }

    function handleItemsDragEnd(e: DragEndEvent) {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const oldIndex = items.findIndex((_, i) => `item-${i}` === active.id);
        const newIndex = items.findIndex((_, i) => `item-${i}` === over.id);
        if (oldIndex < 0 || newIndex < 0) return;
        setItems((arr) => arrayMove(arr, oldIndex, newIndex));
    }

    function addItem() {
        const v = newItem.trim();
        if (!v) return;
        if (v.length > 120) {
            toast.error('Pozycja może mieć max 120 znaków');
            return;
        }
        setItems((arr) => [...arr, v]);
        setNewItem('');
    }

    const livePreview = useMemo(() => {
        const base = Number(draft.base_price) || 0;
        const ch = Number(draft.challenge_price) || 0;
        return { discount: calcDiscount(base, ch), savings: Math.max(0, base - ch) };
    }, [draft.base_price, draft.challenge_price]);

    return (
        <div className="text-white p-3 sm:p-6 max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold font-display text-gold-400 flex items-center gap-2">
                        <PackageIcon size={26} /> Pakiety Wyzwań
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1">
                        Przeciągnij za uchwyt aby zmienić kolejność wyświetlania na zaproszeniu.
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
                        className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-black px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Plus size={18} /> Dodaj pakiet
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-zinc-400 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Ładowanie…
                </div>
            ) : packages.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
                    Brak pakietów. Kliknij „Dodaj pakiet".
                </div>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={packages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
                            {packages.map((pkg) => (
                                <PackageCard
                                    key={pkg.id}
                                    pkg={pkg}
                                    onEdit={() => openEdit(pkg)}
                                    onDelete={() => handleDelete(pkg.id, pkg.name)}
                                    onToggleActive={() => handleToggleActive(pkg)}
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
                                {draft.id ? 'Edytuj pakiet' : 'Nowy pakiet'}
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
                                    placeholder="np. Sesja Rodzinna PREMIUM"
                                />
                                {errors.name && (
                                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                        <AlertCircle size={12} /> {errors.name}
                                    </p>
                                )}
                                <p className="text-xs text-zinc-500 mt-1">{(draft.name || '').length}/80</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">
                                        Cena bazowa (PLN) <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={10}
                                        value={Number.isFinite(Number(draft.base_price)) ? draft.base_price ?? 0 : 0}
                                        onChange={(e) =>
                                            setDraft({ ...draft, base_price: Math.max(0, parseInt(e.target.value, 10) || 0) })
                                        }
                                        className={`w-full bg-zinc-800 border rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 ${errors.base_price ? 'border-red-500 focus:ring-red-500/40' : 'border-zinc-700 focus:ring-gold-500/40'}`}
                                    />
                                    {errors.base_price && (
                                        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                            <AlertCircle size={12} /> {errors.base_price}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">
                                        Cena w wyzwaniu (PLN) <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={10}
                                        value={Number.isFinite(Number(draft.challenge_price)) ? draft.challenge_price ?? 0 : 0}
                                        onChange={(e) =>
                                            setDraft({ ...draft, challenge_price: Math.max(0, parseInt(e.target.value, 10) || 0) })
                                        }
                                        className={`w-full bg-zinc-800 border rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 ${errors.challenge_price ? 'border-red-500 focus:ring-red-500/40' : 'border-zinc-700 focus:ring-gold-500/40'}`}
                                    />
                                    {errors.challenge_price && (
                                        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                            <AlertCircle size={12} /> {errors.challenge_price}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-zinc-800/50 border border-zinc-700/60 rounded-lg p-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                                <span className="text-zinc-400">Zniżka liczona automatycznie:</span>
                                <span className="text-emerald-400 font-semibold">−{livePreview.discount}%</span>
                                <span className="text-zinc-500">·</span>
                                <span className="text-zinc-300">
                                    Klient oszczędza <strong className="text-gold-400">{livePreview.savings} zł</strong>
                                </span>
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Opis</label>
                                <textarea
                                    value={draft.description || ''}
                                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                                    maxLength={400}
                                    rows={3}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                                    placeholder="Krótki opis pakietu widoczny na zaproszeniu"
                                />
                                <p className="text-xs text-zinc-500 mt-1">{(draft.description || '').length}/400</p>
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-2">Co zawiera pakiet?</label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={newItem}
                                        onChange={(e) => setNewItem(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addItem();
                                            }
                                        }}
                                        maxLength={120}
                                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                                        placeholder="np. 30 wyretuszowanych zdjęć"
                                    />
                                    <button
                                        onClick={addItem}
                                        type="button"
                                        className="bg-zinc-700 hover:bg-zinc-600 px-4 rounded-lg text-white inline-flex items-center gap-1"
                                    >
                                        <Plus size={16} /> Dodaj
                                    </button>
                                </div>

                                {items.length === 0 ? (
                                    <p className="text-xs text-zinc-500 italic">Brak pozycji. Dodaj co najmniej jedną.</p>
                                ) : (
                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemsDragEnd}>
                                        <SortableContext
                                            items={items.map((_, i) => `item-${i}`)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <ul className="space-y-2">
                                                {items.map((item, i) => (
                                                    <SortableItemRow key={`item-${i}`} id={`item-${i}`}>
                                                        <input
                                                            type="text"
                                                            value={item}
                                                            onChange={(e) =>
                                                                setItems((arr) => arr.map((it, idx) => (idx === i ? e.target.value : it)))
                                                            }
                                                            maxLength={120}
                                                            className="flex-1 bg-transparent border-0 outline-none text-white text-sm py-1 focus:bg-zinc-900/40 px-2 rounded"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setItems((arr) => arr.filter((_, idx) => idx !== i))}
                                                            aria-label="Usuń pozycję"
                                                            className="p-1.5 rounded text-red-400 hover:bg-red-500/15"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </SortableItemRow>
                                                ))}
                                            </ul>
                                        </SortableContext>
                                    </DndContext>
                                )}
                            </div>

                            <div className="flex items-center justify-between bg-zinc-800/40 rounded-lg p-3 border border-zinc-700/60">
                                <div>
                                    <p className="text-white font-medium">Aktywny</p>
                                    <p className="text-xs text-zinc-400">Wyłączone pakiety nie pojawią się w nowych zaproszeniach.</p>
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
        </div>
    );
}
