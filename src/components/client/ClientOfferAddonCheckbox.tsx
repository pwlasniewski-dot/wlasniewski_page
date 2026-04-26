'use client';

/**
 * Prosty UI wyboru albumow-dodatkow na stronie oferty klienta.
 * UWAGA: Wielki graficzny showcase (galeria/wideo) jest w `ClientOfferRecommendedAlbums.tsx`
 * i wyswietlany na stronie konta. Tu, na stronie konkretnej oferty, mamy tylko prosty checkbox.
 *
 * Logika cen:
 *  - `pages_count` w bazie = liczba STRON (np. 30 stron = 15 rozkladowek).
 *  - 1 rozkladowka = 2 strony.
 *  - Minimalna liczba rozkladowek: 10 (= 20 stron).
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

const MIN_SPREADS = 10;
const SMALLER_FORMAT = '25×25 cm';
const SMALLER_FORMAT_DISCOUNT = 0.10;

function isSmallerFormat(s: string | null | undefined): boolean {
    return !!s && s.toLowerCase().replace(/\s+/g, '').replace(/×/g, 'x').replace(/cm/g, '') === '25x25';
}

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
    const baseSpreads = Math.max(MIN_SPREADS, Math.round(basePages / 2));
    const pricePerSpread = album.price_per_spread || 40;
    const basePrice = album.price || 0;

    const initialSpreads = addon?.custom_pages ? Math.round(addon.custom_pages / 2) : baseSpreads;
    const [spreads, setSpreads] = useState<number>(initialSpreads);
    const [smallerFormat, setSmallerFormat] = useState<boolean>(isSmallerFormat(addon?.custom_format_request));
    const [busy, setBusy] = useState(false);

    const finalPrice = useMemo(() => {
        const diff = spreads - baseSpreads;
        let p = basePrice + diff * pricePerSpread;
        if (smallerFormat) p = p * (1 - SMALLER_FORMAT_DISCOUNT);
        return Math.max(0, Math.round(p));
    }, [spreads, baseSpreads, basePrice, pricePerSpread, smallerFormat]);

    const isAdded = !!addon;
    const pages = spreads * 2;

    async function postAddon(spreadsToSend: number, smallerFmt: boolean) {
        const pagesToSend = spreadsToSend * 2;
        const res = await fetch('/api/client/offer-addons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                offer_id: offerId,
                album_id: album.id,
                custom_pages: pagesToSend !== basePages ? pagesToSend : null,
                custom_format_request: smallerFmt ? SMALLER_FORMAT : null,
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
                await postAddon(spreads, smallerFormat);
            }
        } finally {
            setBusy(false);
        }
    }

    async function updateSpreads(newSpreads: number) {
        const clamped = Math.max(MIN_SPREADS, newSpreads);
        setSpreads(clamped);
        if (!isAdded || isLocked) return;
        setBusy(true);
        try { await postAddon(clamped, smallerFormat); }
        finally { setBusy(false); }
    }

    async function toggleSmallerFormat() {
        if (isLocked) return;
        const next = !smallerFormat;
        setSmallerFormat(next);
        if (!isAdded) return;
        setBusy(true);
        try { await postAddon(spreads, next); }
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
                            <p className="text-sm sm:text-base font-bold text-white truncate">{album.title}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] sm:text-xs text-zinc-400">
                                {album.format && (
                                    <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{album.format}</span>
                                )}
                                <span className="flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" />
                                    bazowo: {baseSpreads} rozkł. ({basePages} str.)
                                </span>
                                <span className="text-zinc-500">cena za rozkł.: {pricePerSpread} PLN</span>
                            </div>
                        </div>
                    </label>

                    {isAdded && !isLocked && (
                        <div className="mt-3 pl-7">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-zinc-400">Rozkładówki:</span>
                                <button
                                    type="button"
                                    onClick={() => updateSpreads(spreads - 1)}
                                    disabled={busy || spreads <= MIN_SPREADS}
                                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed">−</button>
                                <span className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-white font-bold text-sm min-w-[60px] text-center">
                                    {spreads}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => updateSpreads(spreads + 1)}
                                    disabled={busy}
                                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-white font-bold disabled:opacity-40">+</button>
                                <span className="text-[11px] text-zinc-500">= {pages} stron</span>
                                {spreads !== baseSpreads && (
                                    <span className={`text-[11px] font-semibold ${spreads > baseSpreads ? 'text-amber-400' : 'text-emerald-400'}`}>
                                        ({spreads > baseSpreads ? '+' : ''}{spreads - baseSpreads} rozkł. = {spreads > baseSpreads ? '+' : ''}{((spreads - baseSpreads) * pricePerSpread).toLocaleString('pl-PL')} PLN)
                                    </span>
                                )}
                                {spreads <= MIN_SPREADS && (
                                    <span className="text-[10px] text-zinc-500 italic">min. {MIN_SPREADS} rozkł.</span>
                                )}
                            </div>

                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-zinc-400">Format:</span>
                                <button
                                    type="button"
                                    onClick={toggleSmallerFormat}
                                    disabled={busy}
                                    className={`text-xs px-3 py-1.5 rounded-lg border-2 font-semibold transition disabled:opacity-50 ${
                                        smallerFormat
                                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                                            : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-emerald-500/60'
                                    }`}
                                >
                                    {smallerFormat ? '✓ ' : ''}25×25 cm <span className="text-emerald-400 ml-1">(−10%)</span>
                                </button>
                                <span className="text-[11px] text-zinc-500">bazowo: {album.format || '—'}</span>
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
                            <p className="text-lg sm:text-xl font-bold text-emerald-300">+{finalPrice.toLocaleString('pl-PL')}</p>
                            <p className="text-[10px] text-emerald-200/70 uppercase">{album.currency || 'PLN'}</p>
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
