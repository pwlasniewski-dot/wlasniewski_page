'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BadgePercent, CalendarClock, CheckCircle2, History, Loader2, Pencil, Power, X } from 'lucide-react';
import { toast, Toaster } from 'sonner';

type PromotionStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'ENDED';

type AdminPromotion = {
    id: number;
    status: PromotionStatus;
    isEnabled: boolean;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    regularPrice: number;
    price: number;
    lowestPrice30d: number;
    referenceSource: 'AUTO_HISTORY' | 'ADMIN_CONFIRMED';
    label: string;
    startsAt: string;
    endsAt: string | null;
    allowPromoCode: boolean;
    showOnHome: boolean;
    displayDiscountPercent: number;
    legalText: string;
};

type AdminPackage = {
    id: number;
    serviceId: number;
    serviceName: string;
    packageName: string;
    regularPrice: number;
    isActive: boolean;
    automaticReference: { available: boolean; lowestPrice30d: number | null };
    promotions: AdminPromotion[];
    priceHistory: Array<{
        id: number;
        price: number;
        validFrom: string;
        validTo: string | null;
        source: string;
        verified: boolean;
    }>;
};

type EditorState = {
    promotionId: number | null;
    packageId: number;
    label: string;
    discountType: 'percentage' | 'fixed';
    discountValue: string;
    startsAt: string;
    endsAt: string;
    manualLowestPrice: string;
    confirmManualReference: boolean;
    allowPromoCode: boolean;
    showOnHome: boolean;
    isEnabled: boolean;
};

function formatPln(cents: number) {
    return `${new Intl.NumberFormat('pl-PL', {
        minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(cents / 100)} zł`;
}

function toLocalInput(iso?: string | null, addMinutes = 0) {
    const date = iso ? new Date(iso) : new Date();
    if (addMinutes) date.setMinutes(date.getMinutes() + addMinutes);
    if (Number.isNaN(date.getTime())) return '';
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
}

function statusLabel(status: PromotionStatus) {
    return ({
        DRAFT: 'Szkic',
        SCHEDULED: 'Zaplanowana',
        ACTIVE: 'Aktywna',
        ENDED: 'Zakończona',
    } as const)[status];
}

function statusClass(status: PromotionStatus) {
    if (status === 'ACTIVE') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
    if (status === 'SCHEDULED') return 'border-sky-500/40 bg-sky-500/10 text-sky-300';
    if (status === 'ENDED') return 'border-zinc-700 bg-zinc-800 text-zinc-400';
    return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
}

export default function PackagePromotionsAdminPage() {
    const [packages, setPackages] = useState<AdminPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editor, setEditor] = useState<EditorState | null>(null);

    const loadData = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            window.location.href = '/admin/login';
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('/api/admin/package-promotions', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            });
            if (response.status === 401) {
                localStorage.removeItem('admin_token');
                window.location.href = '/admin/login';
                return;
            }
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || 'Błąd pobierania promocji');
            setPackages(data.packages || []);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Nie udało się pobrać promocji');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    const grouped = useMemo(() => {
        return packages.reduce<Record<string, AdminPackage[]>>((result, pkg) => {
            (result[pkg.serviceName] ||= []).push(pkg);
            return result;
        }, {});
    }, [packages]);

    const editedPackage = editor
        ? packages.find(pkg => pkg.id === editor.packageId) || null
        : null;

    const preview = useMemo(() => {
        if (!editor || !editedPackage) return null;
        const raw = Number(editor.discountValue.replace(',', '.'));
        if (!Number.isFinite(raw) || raw <= 0) return null;
        const discount = editor.discountType === 'percentage'
            ? Math.floor(editedPackage.regularPrice * raw / 100)
            : Math.round(raw * 100);
        const price = editedPackage.regularPrice - discount;
        if (price <= 0 || price >= editedPackage.regularPrice) return null;
        const manualReference = Number(editor.manualLowestPrice.replace(',', '.')) * 100;
        const legalReference = editedPackage.automaticReference.available && editedPackage.automaticReference.lowestPrice30d
            ? editedPackage.automaticReference.lowestPrice30d
            : Number.isFinite(manualReference) && manualReference > 0
                ? Math.round(manualReference)
                : editedPackage.regularPrice;
        if (price >= legalReference) return null;
        const displayPercent = Math.max(1, Math.round((1 - price / legalReference) * 100));
        return { price, legalReference, displayPercent };
    }, [editor, editedPackage]);

    const openNew = (pkg: AdminPackage) => {
        setEditor({
            promotionId: null,
            packageId: pkg.id,
            label: 'Promocja',
            discountType: 'percentage',
            discountValue: '20',
            startsAt: toLocalInput(null, 5),
            endsAt: toLocalInput(null, 14 * 24 * 60),
            manualLowestPrice: ((pkg.automaticReference.lowestPrice30d || pkg.regularPrice) / 100).toString(),
            confirmManualReference: false,
            allowPromoCode: false,
            showOnHome: true,
            isEnabled: true,
        });
    };

    const openExisting = (pkg: AdminPackage, promotion: AdminPromotion) => {
        if (promotion.status === 'ACTIVE' || promotion.status === 'ENDED') return;
        setEditor({
            promotionId: promotion.id,
            packageId: pkg.id,
            label: promotion.label,
            discountType: promotion.discountType,
            discountValue: promotion.discountType === 'percentage'
                ? String(promotion.discountValue)
                : String(promotion.discountValue / 100),
            startsAt: toLocalInput(promotion.startsAt),
            endsAt: promotion.endsAt ? toLocalInput(promotion.endsAt) : '',
            manualLowestPrice: String(promotion.lowestPrice30d / 100),
            confirmManualReference: promotion.referenceSource === 'ADMIN_CONFIRMED',
            allowPromoCode: promotion.allowPromoCode,
            showOnHome: promotion.showOnHome,
            isEnabled: promotion.isEnabled,
        });
    };

    const savePromotion = async () => {
        if (!editor || !editedPackage || !preview) {
            toast.error('Uzupełnij poprawnie dane promocji');
            return;
        }
        setSaving(true);
        try {
            const discountValue = editor.discountType === 'percentage'
                ? Math.round(Number(editor.discountValue.replace(',', '.')))
                : Math.round(Number(editor.discountValue.replace(',', '.')) * 100);
            const manualLowestPrice = Math.round(Number(editor.manualLowestPrice.replace(',', '.')) * 100);
            const response = await fetch('/api/admin/package-promotions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    promotionId: editor.promotionId,
                    packageId: editor.packageId,
                    label: editor.label,
                    discountType: editor.discountType,
                    discountValue,
                    startsAt: new Date(editor.startsAt).toISOString(),
                    endsAt: editor.endsAt ? new Date(editor.endsAt).toISOString() : null,
                    manualLowestPrice,
                    confirmManualReference: editor.confirmManualReference,
                    allowPromoCode: editor.allowPromoCode,
                    showOnHome: editor.showOnHome,
                    isEnabled: editor.isEnabled,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) throw new Error(data.error || 'Nie udało się zapisać promocji');
            toast.success('Promocja została zapisana');
            setEditor(null);
            await loadData();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Nie udało się zapisać promocji', { duration: 7000 });
        } finally {
            setSaving(false);
        }
    };

    const stopPromotion = async (promotion: AdminPromotion) => {
        const prompt = promotion.status === 'ACTIVE'
            ? 'Zakończyć promocję teraz? Pozostanie w historii cen.'
            : 'Anulować tę przyszłą promocję?';
        if (!window.confirm(prompt)) return;
        try {
            const response = await fetch(`/api/admin/package-promotions?id=${promotion.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) throw new Error(data.error || 'Nie udało się zakończyć promocji');
            toast.success(data.message || 'Promocja została zakończona');
            await loadData();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Nie udało się zakończyć promocji');
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 p-5 text-white md:p-8">
            <Toaster position="top-right" theme="dark" />
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                    <div>
                        <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[.18em] text-amber-400">
                            <BadgePercent className="h-5 w-5" /> Sprzedaż i ceny
                        </div>
                        <h1 className="text-3xl font-bold md:text-4xl">Promocje konkretnych pakietów</h1>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400 md:text-base">
                            Jedna promocja zasila cenę na stronie głównej, w rezerwacji, koszyku i PayU. Cena z przeglądarki nie jest źródłem rozliczenia.
                        </p>
                    </div>
                    <a
                        href="/admin/banners"
                        className="inline-flex w-fit rounded-full border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white"
                    >
                        Pozostałe banery
                    </a>
                </div>

                <div className="mb-8 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5">
                        <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                        <h2 className="mt-3 font-bold">Jedno źródło ceny</h2>
                        <p className="mt-1 text-sm leading-6 text-zinc-400">Promocja jest przypisana do ID pakietu, a checkout wylicza ją ponownie na serwerze.</p>
                    </div>
                    <div className="rounded-2xl border border-sky-500/25 bg-sky-500/5 p-5">
                        <History className="h-6 w-6 text-sky-400" />
                        <h2 className="mt-3 font-bold">Historia 30 dni</h2>
                        <p className="mt-1 text-sm leading-6 text-zinc-400">Do czasu zebrania pełnej historii musisz potwierdzić rzeczywistą najniższą cenę ręcznie.</p>
                    </div>
                    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
                        <AlertTriangle className="h-6 w-6 text-amber-400" />
                        <h2 className="mt-3 font-bold">Bez podwójnego rabatu</h2>
                        <p className="mt-1 text-sm leading-6 text-zinc-400">Łączenie z kodem rabatowym jest domyślnie wyłączone i wymaga świadomego włączenia.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex min-h-64 items-center justify-center text-zinc-400">
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" /> Ładowanie pakietów…
                    </div>
                ) : (
                    <div className="space-y-9">
                        {Object.entries(grouped).map(([serviceName, servicePackages]) => (
                            <section key={serviceName}>
                                <h2 className="mb-4 text-xl font-bold text-zinc-100">{serviceName}</h2>
                                <div className="grid gap-4 xl:grid-cols-2">
                                    {servicePackages.map(pkg => {
                                        const current = pkg.promotions.find(p => p.status === 'ACTIVE' || p.status === 'SCHEDULED');
                                        return (
                                            <article key={pkg.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/85 p-5">
                                                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                                    <div>
                                                        <div className="text-xs font-bold uppercase tracking-[.14em] text-zinc-500">Pakiet #{pkg.id}</div>
                                                        <h3 className="mt-1 text-xl font-bold">{pkg.packageName}</h3>
                                                        <p className="mt-1 text-sm text-zinc-400">Cena zwykła: <strong className="text-white">{formatPln(pkg.regularPrice)}</strong></p>
                                                        <p className={`mt-1 text-xs ${pkg.automaticReference.available ? 'text-emerald-400' : 'text-amber-300'}`}>
                                                            {pkg.automaticReference.available && pkg.automaticReference.lowestPrice30d
                                                                ? `System ma pełne 30 dni historii. Automatyczna cena referencyjna: ${formatPln(pkg.automaticReference.lowestPrice30d)}`
                                                                : 'Brak pełnego 30-dniowego okna — pierwsza promocja wymaga ręcznego potwierdzenia ceny referencyjnej.'}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => openNew(pkg)}
                                                        disabled={!pkg.isActive || Boolean(current)}
                                                        className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
                                                    >
                                                        {current ? 'Najpierw zakończ bieżącą' : 'Ustaw promocję'}
                                                    </button>
                                                </div>

                                                {pkg.promotions.length === 0 ? (
                                                    <div className="mt-5 rounded-xl border border-dashed border-zinc-700 p-4 text-sm text-zinc-500">Brak promocji w historii.</div>
                                                ) : (
                                                    <div className="mt-5 space-y-3">
                                                        {pkg.promotions.slice(0, 4).map(promotion => (
                                                            <div key={promotion.id} className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.12em] ${statusClass(promotion.status)}`}>
                                                                            {statusLabel(promotion.status)}
                                                                        </span>
                                                                        <span className="text-sm font-bold text-zinc-200">{promotion.label}</span>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        {(promotion.status === 'DRAFT' || promotion.status === 'SCHEDULED') && (
                                                                            <button type="button" onClick={() => openExisting(pkg, promotion)} className="rounded-lg border border-zinc-700 p-2 text-zinc-300 hover:border-zinc-500 hover:text-white" aria-label="Edytuj promocję">
                                                                                <Pencil className="h-4 w-4" />
                                                                            </button>
                                                                        )}
                                                                        {promotion.status !== 'ENDED' && (
                                                                            <button type="button" onClick={() => stopPromotion(promotion)} className="rounded-lg border border-red-900/60 p-2 text-red-300 hover:bg-red-950" aria-label="Zakończ promocję">
                                                                                <Power className="h-4 w-4" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="mt-3 flex flex-wrap items-baseline gap-3">
                                                                    <strong className="text-2xl text-amber-300">{formatPln(promotion.price)}</strong>
                                                                    <span className="text-sm text-zinc-500 line-through">{formatPln(promotion.regularPrice)}</span>
                                                                    <span className="text-xs font-bold text-amber-400">−{promotion.displayDiscountPercent}%</span>
                                                                </div>
                                                                <p className="mt-2 text-xs leading-5 text-zinc-400">{promotion.legalText}</p>
                                                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500">
                                                                    <span>Start: {new Date(promotion.startsAt).toLocaleString('pl-PL')}</span>
                                                                    <span>Koniec: {promotion.endsAt ? new Date(promotion.endsAt).toLocaleString('pl-PL') : 'bez daty'}</span>
                                                                    <span>{promotion.allowPromoCode ? 'Można łączyć z kodem' : 'Bez łączenia z kodem'}</span>
                                                                    <span>{promotion.showOnHome ? 'Kafelek strony głównej' : 'Tylko rezerwacja'}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </article>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>

            {editor && editedPackage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                    <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl md:p-7">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-[.16em] text-amber-400">{editedPackage.serviceName}</div>
                                <h2 className="mt-1 text-2xl font-bold">{editedPackage.packageName}</h2>
                                <p className="mt-1 text-sm text-zinc-400">Cena zwykła: {formatPln(editedPackage.regularPrice)}</p>
                            </div>
                            <button type="button" onClick={() => setEditor(null)} className="rounded-full border border-zinc-700 p-2 text-zinc-400 hover:text-white" aria-label="Zamknij">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-6 grid gap-5 md:grid-cols-2">
                            <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-zinc-300">Etykieta</span>
                                <input value={editor.label} onChange={event => setEditor({ ...editor, label: event.target.value })} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-amber-500" />
                            </label>
                            <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-zinc-300">Rodzaj obniżki</span>
                                <select value={editor.discountType} onChange={event => setEditor({ ...editor, discountType: event.target.value as 'percentage' | 'fixed' })} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-amber-500">
                                    <option value="percentage">Procentowa</option>
                                    <option value="fixed">Kwotowa</option>
                                </select>
                            </label>
                            <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-zinc-300">{editor.discountType === 'percentage' ? 'Obniżka (%)' : 'Obniżka (zł)'}</span>
                                <input type="number" min="1" step={editor.discountType === 'percentage' ? '1' : '0.01'} value={editor.discountValue} onChange={event => setEditor({ ...editor, discountValue: event.target.value })} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-amber-500" />
                            </label>
                            <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-zinc-300">Najniższa cena z 30 dni przed obniżką (zł)</span>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={editor.manualLowestPrice}
                                    disabled={editedPackage.automaticReference.available}
                                    onChange={event => setEditor({ ...editor, manualLowestPrice: event.target.value, confirmManualReference: false })}
                                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                                />
                                <span className="mt-2 block text-xs leading-5 text-zinc-500">
                                    {editedPackage.automaticReference.available
                                        ? 'Wartość zostanie pobrana automatycznie z historii cen.'
                                        : 'Wpisz faktyczną najniższą cenę obowiązującą przed promocją.'}
                                </span>
                            </label>
                            <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-zinc-300">Początek</span>
                                <input type="datetime-local" value={editor.startsAt} onChange={event => setEditor({ ...editor, startsAt: event.target.value })} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-amber-500" />
                            </label>
                            <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-zinc-300">Koniec (opcjonalnie)</span>
                                <input type="datetime-local" value={editor.endsAt} onChange={event => setEditor({ ...editor, endsAt: event.target.value })} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-amber-500" />
                            </label>
                        </div>

                        {!editedPackage.automaticReference.available && (
                            <label className="mt-5 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                                <input type="checkbox" checked={editor.confirmManualReference} onChange={event => setEditor({ ...editor, confirmManualReference: event.target.checked })} className="mt-1 h-4 w-4" />
                                <span className="text-sm leading-6 text-zinc-300">
                                    Potwierdzam, że wpisana wartość jest rzeczywistą najniższą ceną tego pakietu z 30 dni przed rozpoczęciem obniżki.
                                </span>
                            </label>
                        )}

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <label className="flex items-center gap-3 rounded-xl border border-zinc-700 p-4 text-sm">
                                <input type="checkbox" checked={editor.showOnHome} onChange={event => setEditor({ ...editor, showOnHome: event.target.checked })} className="h-4 w-4" />
                                Pokaż na kafelku strony głównej
                            </label>
                            <label className="flex items-center gap-3 rounded-xl border border-red-900/50 p-4 text-sm">
                                <input type="checkbox" checked={editor.allowPromoCode} onChange={event => setEditor({ ...editor, allowPromoCode: event.target.checked })} className="h-4 w-4" />
                                Pozwól łączyć z kodem rabatowym
                            </label>
                        </div>

                        <div className="mt-6 rounded-2xl border border-[#c9826f]/40 bg-[#fff8f3] p-5 text-[#3c3028]">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="rounded-full bg-[#a84631] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-white">{editor.label || 'Promocja'}</span>
                                {preview && preview.displayPercent > 0 && <span className="text-xs font-extrabold text-[#8a3423]">−{preview.displayPercent}% względem ceny z 30 dni</span>}
                            </div>
                            {preview ? (
                                <>
                                    <div className="mt-3 flex flex-wrap items-baseline gap-3">
                                        <strong className="text-3xl text-[#8a3423]">{formatPln(preview.price)}</strong>
                                        <span className="text-base text-[#7b7168] line-through">{formatPln(editedPackage.regularPrice)}</span>
                                    </div>
                                    <p className="mt-2 text-xs">Najniższa cena z 30 dni przed obniżką: {formatPln(preview.legalReference)}</p>
                                </>
                            ) : (
                                <p className="mt-3 text-sm text-[#8a3423]">Ustaw prawidłową obniżkę, aby zobaczyć podgląd.</p>
                            )}
                        </div>

                        <div className="mt-6 flex flex-col-reverse justify-end gap-3 border-t border-zinc-800 pt-5 sm:flex-row">
                            <button type="button" onClick={() => setEditor(null)} className="rounded-full border border-zinc-700 px-6 py-3 font-semibold text-zinc-300 hover:border-zinc-500">Anuluj</button>
                            <button type="button" onClick={savePromotion} disabled={saving || !preview} className="inline-flex items-center justify-center rounded-full bg-amber-500 px-7 py-3 font-bold text-black hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50">
                                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Zapisuję…</> : <><CalendarClock className="mr-2 h-4 w-4" /> Zapisz promocję</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
