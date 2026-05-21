'use client';

/**
 * Prosty UI wyboru albumow-dodatkow na stronie oferty klienta.
 * UWAGA: Wielki graficzny showcase (galeria/wideo) jest w `ClientOfferRecommendedAlbums.tsx`
 * i wyswietlany na stronie konta. Tu, na stronie konkretnej oferty, mamy tylko prosty checkbox.
 *
 * Logika cen:
 *  - `pages_count` w bazie = liczba STRON (np. 30 stron = 15 rozkladowek).
 *  - 1 rozkladowka = 2 strony.
 *  - Minimalna liczba rozkladowek = baza albumu (nigdy mniej niz 10 = 20 stron).
 *  - Cena za rozkladowke: `price_per_spread` (domyslnie 40 PLN).
 *  - Cena finalna = base_price + (custom_spreads - base_spreads) * price_per_spread.
 *  - Format 25x25 cm => -10% od ceny.
 */

import { useEffect, useState, useMemo } from 'react';
import { Check, Loader2, BookOpen, Ruler } from 'lucide-react';

interface Album {
    id: number;
    title: string;
    subtitle?: string;
    description?: string;
    price: number;
    price_per_spread?: number;
    format_options?: { label: string; discount_pct: number }[];
    currency: string;
    format?: string;
    pages_count?: number;
    cover_image_url?: string;
    _custom_note?: string;
    _is_highlighted?: boolean;
}

export type OfferAddon = {
    id: string;
    album_id: number;
    album_title: string;
    base_price: number;
    base_pages: number | null;
    base_format: string | null;
    custom_pages: number | null;
    custom_format_request: string | null;
    price_per_spread: number;
    final_price: number;
    currency: string;
    cover_image_url: string | null;
    message: string | null;
    selected_at: string;
    status: 'pending';
};

const GLOBAL_MIN_SPREADS = 10;

export default function ClientOfferAddonCheckbox({
    offerId,
    onAddonsChange,
    offerStatus,
}: {
    offerId: number;
    onAddonsChange?: (addons: OfferAddon[]) => void;
    offerStatus?: string;
}) {
    const isLocked = offerStatus === 'accepted' || offerStatus === 'signed' || offerStatus === 'completed';
    const [albums, setAlbums] = useState<Album[]>([]);
    const [addons, setAddons] = useState<OfferAddon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [albRes, addRes] = await Promise.all([
                    fetch(`/api/offers/${offerId}/recommended-albums`),
                    fetch(`/api/client/offer-addons?offer_id=${offerId}`),
                ]);
                const albJson = await albRes.json();
                const addJson = await addRes.json();
                if (!cancelled) {
                    if (albJson.success) setAlbums(albJson.albums || []);
                    if (addJson.success) {
                        setAddons(addJson.addons || []);
                        onAddonsChange?.(addJson.addons || []);
                    }
                }
            } catch { /* ignore */ }
            if (!cancelled) setLoading(false);
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [offerId]);

    function update(next: OfferAddon[]) {
        setAddons(next);
        onAddonsChange?.(next);
    }

    if (loading || albums.length === 0) return null;
    if (isLocked && addons.length === 0) return null;

    return (
        <div className="px-4 sm:px-6 pb-6 border-t border-gold-500/20 pt-6">
            <h4 className="text-sm sm:text-base font-bold text-white mb-1 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gold-400" />
                {isLocked ? 'Wybrane albumy (dodatki)' : 'Dodaj album do oferty (opcjonalnie)'}
            </h4>
            <p className="text-xs text-zinc-400 mb-4">
                {isLocked
                    ? 'Te albumy są częścią Twojej zatwierdzonej oferty.'
                    : 'Zaznacz album który chcesz dołączyć. Możesz zmienić liczbę rozkładówek lub format — cena przeliczy się automatycznie.'}
            </p>

            <div className="space-y-3">
                {albums.map(a => {
                    const addon = addons.find(x => x.album_id === a.id);
                    if (isLocked && !addon) return null;
                    return (
                        <AlbumRow
                            key={a.id}
                            album={a}
                            addon={addon}
                            offerId={offerId}
                            isLocked={isLocked}
                            onChange={update}
                        />
                    );
                })}
            </div>

            {addons.length > 0 && (
                <div className="mt-4 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/40 rounded-xl px-4 py-3">
                    <span className="text-xs sm:text-sm text-emerald-200 uppercase font-semibold">
                        Suma dodatków ({addons.length})
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-emerald-300">
                        +{addons.reduce((s, x) => s + (x.final_price || 0), 0).toLocaleString('pl-PL')} PLN
                    </span>
                </div>
            )}
        </div>
    );
}

function AlbumRow({
    album, addon, offerId, isLocked, onChange,
}: {
    album: Album;
    addon?: OfferAddon;
    offerId: number;
    isLocked: boolean;
    onChange: (next: OfferAddon[]) => void;
}) {
    const basePages = album.pages_count || 0;
    const baseSpreads = Math.max(GLOBAL_MIN_SPREADS, Math.round(basePages / 2));
    const minSpreads = baseSpreads;
    const pricePerSpread = album.price_per_spread || 40;
    const basePrice = album.price || 0;
    const formatOptions = Array.isArray(album.format_options) ? album.format_options : [];

    const initialSpreads = Math.max(minSpreads, addon?.custom_pages ? Math.round(addon.custom_pages / 2) : baseSpreads);
    const [spreads, setSpreads] = useState<number>(initialSpreads);
    const [selectedFormat, setSelectedFormat] = useState<string>(addon?.custom_format_request || '');
    const [busy, setBusy] = useState(false);

    const activeFormatOption = formatOptions.find(o => o.label === selectedFormat) || null;
    const formatDiscountPct = activeFormatOption?.discount_pct || 0;

    const finalPrice = useMemo(() => {
        const diff = spreads - baseSpreads;
        let p = basePrice + diff * pricePerSpread;
        if (formatDiscountPct > 0) p = p * (1 - formatDiscountPct / 100);
        return Math.max(0, Math.round(p));
    }, [spreads, baseSpreads, basePrice, pricePerSpread, formatDiscountPct]);

    const isAdded = !!addon;
    const pages = spreads * 2;
    const effectiveFormat = isAdded ? (selectedFormat || album.format || null) : (album.format || null);
    const effectiveSpreads = isAdded ? spreads : baseSpreads;
    const effectivePages = effectiveSpreads * 2;

    async function postAddon(spreadsToSend: number, formatLabel: string) {
        const pagesToSend = spreadsToSend * 2;
        const res = await fetch('/api/client/offer-addons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                offer_id: offerId,
                album_id: album.id,
                custom_pages: pagesToSend !== basePages ? pagesToSend : null,
                custom_format_request: formatLabel || null,
            }),
        });
        const j = await res.json();
        if (j.success) onChange(j.addons || []);
    }

    async function toggle() {
        if (isLocked || busy) return;
        setBusy(true);
        try {
            if (isAdded && addon) {
                const res = await fetch('/api/client/offer-addons', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ offer_id: offerId, addon_id: addon.id }),
                });
                const j = await res.json();
                if (j.success) onChange(j.addons || []);
            } else {
                await postAddon(spreads, selectedFormat);
            }
        } finally {
            setBusy(false);
        }
    }

    async function updateSpreads(newSpreads: number) {
        const clamped = Math.max(minSpreads, newSpreads);
        setSpreads(clamped);
        if (!isAdded || isLocked) return;
        setBusy(true);
        try { await postAddon(clamped, selectedFormat); }
        finally { setBusy(false); }
    }

    async function changeFormat(label: string) {
        if (isLocked) return;
        setSelectedFormat(label);
        if (!isAdded) return;
        setBusy(true);
        try { await postAddon(spreads, label); }
        finally { setBusy(false); }
    }

    return (
        <div className={`rounded-xl border-2 p-3 sm:p-4 transition ${isAdded ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-zinc-900/60 border-zinc-800 hover:border-gold-500/40'}`}>
            <div className="flex items-start gap-3 sm:gap-4">
                {album.cover_image_url && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={album.cover_image_url}
                        alt={album.title}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg shrink-0 border border-zinc-700"
                    />
                )}

                <div className="flex-1 min-w-0">
                    <label className={`flex items-start gap-2 ${isLocked ? 'cursor-default' : 'cursor-pointer'}`}>
                        <input
                            type="checkbox"
                            checked={isAdded}
                            disabled={isLocked || busy}
                            onChange={toggle}
                            className="mt-1 w-5 h-5 rounded accent-emerald-500 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm sm:text-base font-bold truncate ${isAdded ? 'text-emerald-950' : 'text-white'}`}>{album.title}</p>
                            <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] sm:text-xs ${isAdded ? 'text-emerald-900' : 'text-zinc-400'}`}>
                                {effectiveFormat && (
                                    <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{effectiveFormat}</span>
                                )}
                                <span className="flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" />
                                    {isAdded ? 'wybrano' : 'bazowo'}: {effectiveSpreads} rozkł. ({effectivePages} str.)
                                </span>
                                <span className={isAdded ? 'text-emerald-800' : 'text-zinc-500'}>cena za rozkł.: {pricePerSpread} PLN</span>
                                {isAdded && (
                                    <span className="text-emerald-800">bazowo: {baseSpreads} rozkł. ({basePages} str.)</span>
                                )}
                            </div>
                        </div>
                    </label>

                    {isAdded && !isLocked && (
                        <div className="mt-3 pl-7">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-emerald-900 font-semibold">Rozkładówki:</span>
                                <button
                                    type="button"
                                    onClick={() => updateSpreads(spreads - 1)}
                                    disabled={busy || spreads <= minSpreads}
                                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed">−</button>
                                <span className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-white font-bold text-sm min-w-[60px] text-center">
                                    {spreads}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => updateSpreads(spreads + 1)}
                                    disabled={busy}
                                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-white font-bold disabled:opacity-40">+</button>
                                <span className="text-[11px] text-emerald-800">= {pages} stron</span>
                                {spreads !== baseSpreads && (
                                    <span className={`text-[11px] font-semibold ${spreads > baseSpreads ? 'text-amber-600' : 'text-emerald-700'}`}>
                                        ({spreads > baseSpreads ? '+' : ''}{spreads - baseSpreads} rozkł. = {spreads > baseSpreads ? '+' : ''}{((spreads - baseSpreads) * pricePerSpread).toLocaleString('pl-PL')} PLN)
                                    </span>
                                )}
                                {spreads <= minSpreads && (
                                    <span className="text-[10px] text-emerald-800 italic">min. {minSpreads} rozkł. ({basePages} str.)</span>
                                )}
                            </div>

                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-emerald-900 font-semibold">Format:</span>
                                {formatOptions.length > 0 ? (
                                    <select
                                        value={selectedFormat}
                                        onChange={e => changeFormat(e.target.value)}
                                        disabled={busy}
                                        className="text-xs bg-zinc-950 border-2 border-zinc-700 hover:border-emerald-500/60 focus:border-emerald-500 text-white rounded-lg px-3 py-1.5 font-semibold focus:outline-none disabled:opacity-50 cursor-pointer"
                                    >
                                        <option value="">{album.format || 'Bazowy'} (bez rabatu)</option>
                                        {formatOptions.map(o => (
                                            <option key={o.label} value={o.label}>
                                                {o.label}{o.discount_pct > 0 ? ` (−${o.discount_pct}%)` : ''}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className="text-[11px] text-emerald-800">{album.format || '—'}</span>
                                )}
                                {selectedFormat && formatDiscountPct > 0 && (
                                    <span className="text-[11px] text-emerald-700 font-semibold">rabat −{formatDiscountPct}%</span>
                                )}
                            </div>
                        </div>
                    )}

                    {isAdded && isLocked && addon && (
                        <div className="mt-2 pl-7 text-xs text-zinc-300">
                            Wybrane: <strong>{addon.custom_pages ? Math.round(addon.custom_pages / 2) : baseSpreads} rozkł.</strong>
                            {addon.custom_format_request && <span className="ml-2 text-amber-400">(format: {addon.custom_format_request})</span>}
                        </div>
                    )}
                </div>

                <div className="text-right shrink-0">
                    {isAdded ? (
                        <>
                            <p className="text-lg sm:text-xl font-bold text-emerald-800">+{finalPrice.toLocaleString('pl-PL')}</p>
                            <p className="text-[10px] text-emerald-700 uppercase">{album.currency || 'PLN'}</p>
                        </>
                    ) : (
                        <>
                            <p className="text-base sm:text-lg font-bold text-gold-400">{basePrice.toLocaleString('pl-PL')}</p>
                            <p className="text-[10px] text-zinc-500 uppercase">{album.currency || 'PLN'}</p>
                        </>
                    )}
                    {busy && <Loader2 className="w-4 h-4 animate-spin text-emerald-400 ml-auto mt-1" />}
                </div>
            </div>

            {isAdded && (
                <div className="mt-2 pl-7 flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <Check className="w-3.5 h-3.5" /> Album dodany — cena uwzględniona w sumie oferty
                </div>
            )}
        </div>
    );
}
