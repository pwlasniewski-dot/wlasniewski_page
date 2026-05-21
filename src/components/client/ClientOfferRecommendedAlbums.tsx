'use client';

import { useEffect, useState, useMemo } from 'react';
import {
    Sparkles, Play, Star, Heart, ChevronLeft, ChevronRight,
    BookOpen, Ruler, Layers, Award, Check, Loader2, Send, Pause
} from 'lucide-react';

interface Album {
    id: number;
    title: string;
    slug: string;
    subtitle?: string;
    description?: string;
    price: number;
    price_per_spread?: number;
    format_options?: { label: string; discount_pct: number }[];
    currency: string;
    format?: string;
    pages_count?: number;
    cover_type?: string;
    paper_type?: string;
    cover_image_url?: string;
    preview_images: any;
    sample_pages?: any;
    video_url?: string;
    video_thumbnail?: string;
    additional_videos?: any;
    nphoto_shop_url?: string;
    is_featured: boolean;
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

function asMediaUrl(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

export default function ClientOfferRecommendedAlbums({
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
    const [loading, setLoading] = useState(true);
    const [source, setSource] = useState<string>('');
    const [activeIdx, setActiveIdx] = useState(0);
    const [addons, setAddons] = useState<OfferAddon[]>([]);

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
                    if (albJson.success) {
                        setAlbums(albJson.albums || []);
                        setSource(albJson.source);
                    }
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

    useEffect(() => {
        if (albums.length === 0) return;
        setActiveIdx((idx) => Math.min(idx, albums.length - 1));
    }, [albums.length]);

    function updateAddons(next: OfferAddon[]) {
        setAddons(next);
        onAddonsChange?.(next);
    }

    if (loading || albums.length === 0) return null;
    // Oferta zatwierdzona bez dodatkow - nic nie pokazuj (zachowaj stary widok)
    if (isLocked && addons.length === 0) return null;

    const active = albums[activeIdx] ?? albums[0];
    if (!active) return null;

    const activeAddon = addons.find(a => a.album_id === active.id);

    return (
        <div className="px-4 sm:px-6 pb-6 border-t border-gold-500/20 pt-6 bg-gradient-to-br from-gold-500/[0.04] via-transparent to-transparent">
            {/* Lista dodanych addonow - kompaktowy widok na gorze */}
            {addons.length > 0 && (
                <div className="mb-5 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Check className="w-5 h-5 text-emerald-400" />
                        <h4 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
                            {isLocked ? 'Zatwierdzone dodatki' : 'Dodane do Twojej oferty'} ({addons.length})
                        </h4>
                        {isLocked && <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full uppercase font-bold">Zablokowane</span>}
                    </div>
                    <div className="space-y-2">
                        {addons.map(a => (
                            <AddonRow
                                key={a.id}
                                addon={a}
                                readOnly={isLocked}
                                onRemove={async () => {
                                    const res = await fetch('/api/client/offer-addons', {
                                        method: 'DELETE',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ offer_id: offerId, addon_id: a.id }),
                                    });
                                    const j = await res.json();
                                    if (j.success) updateAddons(j.addons || []);
                                }}
                            />
                        ))}
                        <div className="flex justify-between items-center pt-3 border-t border-emerald-500/30">
                            <span className="text-xs text-emerald-200 uppercase font-semibold">Suma dodatków</span>
                            <span className="text-xl font-bold text-emerald-300">
                                +{addons.reduce((s, a) => s + (a.final_price || 0), 0).toLocaleString('pl-PL')} PLN
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {!isLocked && (
                <div className="flex items-end justify-between gap-3 mb-5 flex-wrap">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-gold-400" />
                            <h4 className="text-base sm:text-lg font-bold text-white">
                                {source === 'admin_curated' ? 'Polecane albumy do Twojej sesji' : 'Inspiracja: Albumy dla Ciebie'}
                            </h4>
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
                            {source === 'admin_curated'
                                ? 'Te albumy fotograf wybrał specjalnie dla Twojej sesji. Każdy wykonany na zamówienie u nPhoto - niemiecka jakość, dożywotnia gwarancja.'
                                : 'Najczęściej wybierane do podobnych okazji.'}
                        </p>
                    </div>
                    {albums.length > 1 && (
                        <div className="text-xs text-zinc-500">
                            <span className="text-gold-400 font-semibold">{activeIdx + 1}</span> / {albums.length}
                        </div>
                    )}
                </div>
            )}

            {!isLocked && (
                <AlbumShowcase
                    key={active.id}
                    album={active}
                    offerId={offerId}
                    isAdded={!!activeAddon}
                    onAdded={(addon) => updateAddons([...addons.filter(x => x.album_id !== addon.album_id), addon])}
                />
            )}

            {!isLocked && albums.length > 1 && (
                <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                    <button onClick={() => setActiveIdx(i => (i - 1 + albums.length) % albums.length)}
                        className="shrink-0 w-9 h-9 rounded-full bg-zinc-800 hover:bg-gold-500 hover:text-zinc-950 text-white flex items-center justify-center transition">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    {albums.map((a, i) => (
                        <button key={a.id} onClick={() => setActiveIdx(i)}
                            className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition border ${i === activeIdx ? 'bg-gold-500 text-zinc-950 border-gold-500' : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-gold-500/50'}`}>
                            {a.title}
                        </button>
                    ))}
                    <button onClick={() => setActiveIdx(i => (i + 1) % albums.length)}
                        className="shrink-0 w-9 h-9 rounded-full bg-zinc-800 hover:bg-gold-500 hover:text-zinc-950 text-white flex items-center justify-center transition">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="mt-5 flex items-center gap-2 text-xs text-zinc-500">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Wszystkie albumy zamawiamy bezpośrednio u <strong className="text-zinc-300">nPhoto</strong> - niemieckiego producenta premium fotoproduktów. Ręcznie składane, papier Fuji 250g, dożywotnia gwarancja.</span>
            </div>
        </div>
    );
}

// ─── Album showcase ──────────────────────────────────────────────────────────

function AlbumShowcase({ album, offerId, isAdded, onAdded }: { album: Album; offerId: number; isAdded: boolean; onAdded: (addon: OfferAddon) => void }) {
    const gallery = useMemo(() => {
        const out: { type: 'image' | 'video'; url: string; thumb?: string; label?: string }[] = [];
        const primaryVideoUrl = asMediaUrl(album.video_url);
        if (primaryVideoUrl) {
            out.push({
                type: 'video',
                url: primaryVideoUrl,
                thumb: asMediaUrl(album.video_thumbnail) || asMediaUrl(album.cover_image_url) || undefined,
                label: 'Prezentacja albumu'
            });
        }
        const extras = Array.isArray(album.additional_videos) ? album.additional_videos : [];
        extras.forEach((v: any) => {
            const url = asMediaUrl(v?.url);
            if (url) {
                out.push({
                    type: 'video',
                    url,
                    thumb: asMediaUrl(v?.thumbnail) || asMediaUrl(album.cover_image_url) || undefined,
                    label: v.label || 'Film'
                });
            }
        });
        const coverUrl = asMediaUrl(album.cover_image_url);
        if (coverUrl) out.push({ type: 'image', url: coverUrl });
        const previews = Array.isArray(album.preview_images) ? album.preview_images : [];
        previews.forEach((u: string) => {
            const url = asMediaUrl(u);
            if (url && url !== coverUrl) out.push({ type: 'image', url });
        });
        const samples = Array.isArray(album.sample_pages) ? album.sample_pages : [];
        samples.forEach((u: string) => {
            const url = asMediaUrl(u);
            if (url) out.push({ type: 'image', url });
        });
        return out;
    }, [album]);

    const [idx, setIdx] = useState(0);
    const [videoPlaying, setVideoPlaying] = useState(false);
    const [showConfigurator, setShowConfigurator] = useState(false);

    useEffect(() => {
        setIdx(0);
        setVideoPlaying(false);
    }, [album.id]);

    useEffect(() => {
        if (gallery.length === 0) {
            if (idx !== 0) setIdx(0);
            setVideoPlaying(false);
            return;
        }
        if (idx >= gallery.length) {
            setIdx(0);
        }
    }, [gallery.length, idx]);

    const current = gallery[idx];
    const isVideoSlide = current?.type === 'video';

    const slideImage = isVideoSlide ? asMediaUrl(current?.thumb) : asMediaUrl(current?.url);
    const fallbackImage = asMediaUrl(album.cover_image_url);
    const displayImage = slideImage || fallbackImage;

    function next() {
        if (gallery.length < 2) return;
        setVideoPlaying(false);
        setIdx(i => (i + 1) % gallery.length);
    }
    function prev() {
        if (gallery.length < 2) return;
        setVideoPlaying(false);
        setIdx(i => (i - 1 + gallery.length) % gallery.length);
    }

    const ytMatch = isVideoSlide && current?.url ? current.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/) : null;
    const vimeoMatch = isVideoSlide && current?.url ? current.url.match(/vimeo\.com\/(\d+)/) : null;
    const embedUrl = ytMatch
        ? `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`
        : vimeoMatch
            ? `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`
            : null;

    return (
        <div className={`relative rounded-2xl overflow-hidden border-2 ${album._is_highlighted ? 'border-gold-500 shadow-2xl shadow-gold-500/20' : 'border-zinc-800'} bg-gradient-to-br from-zinc-900 to-zinc-950`}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                {/* LEFT: Media */}
                <div className="lg:col-span-3 relative bg-black">
                    <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full min-h-[280px] sm:min-h-[400px]">
                        {isVideoSlide && videoPlaying && embedUrl ? (
                            <iframe
                                src={embedUrl}
                                className="absolute inset-0 w-full h-full"
                                frameBorder="0"
                                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                                allowFullScreen
                            />
                        ) : isVideoSlide && videoPlaying && !embedUrl && current?.url ? (
                            <video src={current.url} autoPlay controls className="absolute inset-0 w-full h-full object-contain bg-black" />
                        ) : (
                            <>
                                {displayImage ? (
                                    <>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={displayImage}
                                            alt={album.title}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-zinc-500 text-sm">
                                        Brak podglądu albumu
                                    </div>
                                )}
                                {isVideoSlide && (
                                    <button
                                        onClick={() => setVideoPlaying(true)}
                                        className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-black/10 to-black/40 group cursor-pointer">
                                        <div className="bg-gold-500 hover:bg-gold-400 rounded-full p-5 sm:p-6 shadow-2xl transition-transform group-hover:scale-110">
                                            <Play className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-950 fill-current ml-1" />
                                        </div>
                                        <div className="absolute bottom-4 left-4 right-4 text-center">
                                            <span className="inline-flex items-center gap-2 bg-black/60 backdrop-blur px-4 py-2 rounded-full text-white text-sm font-semibold">
                                                ▶ {current?.label || 'Zobacz prezentację albumu'}
                                            </span>
                                        </div>
                                    </button>
                                )}
                            </>
                        )}

                        {album._is_highlighted && !videoPlaying && (
                            <div className="absolute top-4 left-4 bg-gold-500 text-zinc-950 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                                <Star className="w-3.5 h-3.5 fill-current" /> WYBÓR FOTOGRAFA
                            </div>
                        )}

                        {gallery.length > 1 && !videoPlaying && (
                            <>
                                <button onClick={prev}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-gold-500 hover:text-zinc-950 text-white flex items-center justify-center backdrop-blur transition">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button onClick={next}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-gold-500 hover:text-zinc-950 text-white flex items-center justify-center backdrop-blur transition">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </>
                        )}
                        {videoPlaying && (
                            <button onClick={() => setVideoPlaying(false)}
                                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 hover:bg-red-500 text-white flex items-center justify-center backdrop-blur transition z-10">
                                <Pause className="w-4 h-4" />
                            </button>
                        )}

                        {/* Counter badge */}
                        {gallery.length > 1 && (
                            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 z-20">
                                <span className="text-gold-400 font-bold">{idx + 1}</span>
                                <span className="text-zinc-400">/</span>
                                <span>{gallery.length}</span>
                                <span className="text-zinc-500 ml-1 hidden sm:inline">{isVideoSlide ? '🎬' : '📷'}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Info */}
                <div className="lg:col-span-2 p-5 sm:p-6 flex flex-col">
                    <h3 className="text-2xl sm:text-3xl font-display font-bold text-white leading-tight mb-1">{album.title}</h3>
                    {album.subtitle && <p className="text-gold-400 text-sm font-medium mb-3">{album.subtitle}</p>}

                    {album._custom_note && (
                        <div className="mb-4 p-3 bg-gold-500/10 border border-gold-500/30 rounded-lg">
                            <div className="text-[10px] uppercase tracking-wider text-gold-400 font-bold mb-1 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Notatka od fotografa
                            </div>
                            <p className="text-sm text-gold-100 italic leading-relaxed">„{album._custom_note}"</p>
                        </div>
                    )}

                    {album.description && (
                        <p className="text-sm text-zinc-300 leading-relaxed mb-4 line-clamp-4">{album.description}</p>
                    )}

                    {/* Specs grid */}
                    <div className="grid grid-cols-2 gap-2 mb-5">
                        {album.format && <SpecBadge icon={<Ruler className="w-3.5 h-3.5" />} label="Format" value={album.format} />}
                        {album.pages_count && <SpecBadge icon={<BookOpen className="w-3.5 h-3.5" />} label="Strony" value={`${album.pages_count}`} />}
                        {album.cover_type && <SpecBadge icon={<Award className="w-3.5 h-3.5" />} label="Okładka" value={album.cover_type} />}
                        {album.paper_type && <SpecBadge icon={<Layers className="w-3.5 h-3.5" />} label="Papier" value={album.paper_type} />}
                    </div>

                    {/* Price + CTA */}
                    <div className="mt-auto pt-4 border-t border-zinc-800">
                        {album.price > 0 && (
                            <div className="flex items-baseline gap-2 mb-3">
                                <span className="text-3xl font-bold text-gold-400">{album.price}</span>
                                <span className="text-sm text-zinc-400">{album.currency}</span>
                                <span className="text-xs text-zinc-500 ml-2">cena producenta</span>
                            </div>
                        )}

                        {showConfigurator ? (
                            <AddonConfigurator
                                album={album}
                                offerId={offerId}
                                onClose={() => setShowConfigurator(false)}
                                onAdded={(addon) => { setShowConfigurator(false); onAdded(addon); }}
                            />
                        ) : isAdded ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-3 text-center">
                                <p className="text-emerald-300 font-bold text-sm flex items-center justify-center gap-2">
                                    <Check className="w-4 h-4" /> Album dodany do oferty
                                </p>
                                <p className="text-xs text-emerald-200/80 mt-1">Zarządzaj nim w sekcji „Dodane do Twojej oferty" powyżej</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <button
                                    onClick={() => setShowConfigurator(true)}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-zinc-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition">
                                    <Check className="w-5 h-5" /> Dodaj do mojej oferty {album.price > 0 && `(${album.price} ${album.currency})`}
                                </button>
                                <p className="text-[11px] text-zinc-500 text-center">Możesz zmienić liczbę rozkładówek lub poprosić o inny format</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Thumbnail strip - PEŁNA SZEROKOŚĆ pod całą prezentacją, ZAWSZE widoczny */}
            {gallery.length > 1 && (
                <div className="bg-zinc-950 border-t-2 border-gold-500/30 px-4 py-3">
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <span className="text-[11px] text-gold-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" />
                            Galeria ({gallery.length}) — przewiń lub kliknij dowolną miniaturę
                        </span>
                        {videoPlaying && (
                            <button onClick={() => setVideoPlaying(false)}
                                className="text-[10px] bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/40 px-2 py-1 rounded-full font-semibold transition flex items-center gap-1">
                                <Pause className="w-3 h-3" /> Zatrzymaj film
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 items-center">
                        <button onClick={prev}
                            className="shrink-0 w-12 h-14 rounded-md bg-zinc-800 hover:bg-gold-500 hover:text-zinc-950 text-white flex items-center justify-center transition">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        {gallery.map((g, i) => (
                            <button key={i} onClick={() => { setVideoPlaying(false); setIdx(i); }}
                                title={g.label || `Element ${i + 1}`}
                                className={`relative w-20 h-14 rounded-md overflow-hidden shrink-0 transition border-2 ${i === idx ? 'border-gold-500 ring-2 ring-gold-500/40 scale-105' : 'border-zinc-700 opacity-70 hover:opacity-100 hover:border-gold-500/50'}`}>
                                {asMediaUrl(g.type === 'video' ? g.thumb : g.url) ? (
                                    <>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={asMediaUrl(g.type === 'video' ? g.thumb : g.url) || undefined} alt="" className="w-full h-full object-cover" />
                                    </>
                                ) : (
                                    <div className="w-full h-full bg-zinc-800" />
                                )}
                                {g.type === 'video' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                        <Play className="w-5 h-5 text-gold-400 fill-current" />
                                    </div>
                                )}
                                <span className="absolute bottom-0 right-0 bg-black/80 text-white text-[10px] px-1 leading-tight font-bold">{i + 1}</span>
                            </button>
                        ))}
                        <button onClick={next}
                            className="shrink-0 w-12 h-14 rounded-md bg-zinc-800 hover:bg-gold-500 hover:text-zinc-950 text-white flex items-center justify-center transition">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function SpecBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">
                {icon} {label}
            </div>
            <div className="text-sm text-white font-semibold truncate">{value}</div>
        </div>
    );
}

function InterestForm({ albumId, offerId, albumTitle, albumPrice, onClose }: { albumId: number; offerId: number; albumTitle: string; albumPrice: number; onClose: () => void }) {
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    async function submit() {
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/client/album-interest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    offer_id: offerId,
                    album_id: albumId,
                    message,
                    intent: 'add_to_offer',
                    album_title: albumTitle,
                    album_price: albumPrice,
                }),
            });
            const data = await res.json();
            if (data.success) setDone(true);
            else setError(data.error || 'Błąd. Spróbuj ponownie.');
        } catch {
            setError('Błąd połączenia. Spróbuj ponownie.');
        } finally {
            setSubmitting(false);
        }
    }

    if (done) {
        return (
            <div className="bg-emerald-900/30 border border-emerald-500/40 rounded-xl p-4 text-center">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Check className="w-6 h-6 text-white" />
                </div>
                <h5 className="text-emerald-300 font-bold mb-1">Album dodany do oferty!</h5>
                <p className="text-xs text-emerald-200">Fotograf zaktualizuje Twoją ofertę i potwierdzi w ciągu 24h.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2 bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-3">
            <p className="text-xs text-emerald-300 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Dodajesz: <strong className="text-white">{albumTitle}</strong>
                {albumPrice > 0 && <span className="text-emerald-400">(+{albumPrice} PLN)</span>}
            </p>
            <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Opcjonalnie: preferencje co do okładki, dedykacja, ilość stron..."
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none resize-none"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2">
                <button onClick={onClose}
                    className="px-3 py-2 text-xs text-zinc-400 hover:text-white">
                    Anuluj
                </button>
                <button onClick={submit} disabled={submitting}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Potwierdź dodanie do oferty
                </button>
            </div>
        </div>
    );
}


function AddonConfigurator({ album, offerId, onClose, onAdded }: { album: Album; offerId: number; onClose: () => void; onAdded: (addon: OfferAddon) => void }) {
    const basePages = Math.max(20, album.pages_count || 30); // min 10 rozkł = 20 stron
    const pricePerSpread = album.price_per_spread || 40;
    const formatOptions = Array.isArray(album.format_options) ? album.format_options : [];
    const [pages, setPages] = useState<number>(basePages);
    const [customFormat, setCustomFormat] = useState<string>('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const finalPrice = useMemo(() => {
        const extraSpreads = Math.max(0, Math.floor((pages - basePages) / 2));
        let p = album.price + extraSpreads * pricePerSpread;
        const fmt = formatOptions.find(o => o.label === customFormat);
        if (fmt && fmt.discount_pct > 0) p = p * (1 - fmt.discount_pct / 100);
        return Math.max(0, Math.round(p));
    }, [pages, basePages, album.price, pricePerSpread, customFormat, formatOptions]);

    async function submit() {
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/client/offer-addons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    offer_id: offerId,
                    album_id: album.id,
                    custom_pages: pages !== basePages ? pages : null,
                    custom_format_request: customFormat || null,
                    message,
                }),
            });
            const data = await res.json();
            if (data.success) {
                onAdded(data.addon);
            } else {
                setError(data.error || 'Bład. Spróbuj ponownie.');
            }
        } catch {
            setError('Bład połączenia. Spróbuj ponownie.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="space-y-3 bg-emerald-500/5 border-2 border-emerald-500/40 rounded-xl p-4">
            <div className="flex items-center justify-between">
                <p className="text-xs text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Konfiguracja dodatku
                </p>
                <span className="text-2xl font-bold text-emerald-300">{finalPrice.toLocaleString('pl-PL')} PLN</span>
            </div>

            {basePages > 0 && (
                <div>
                    <label className="text-xs text-zinc-400 mb-1 block">
                        Liczba stron <span className="text-zinc-500">(bazowo {basePages}, +{pricePerSpread} zł / rozkładówka = 2 strony)</span>
                    </label>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setPages(p => Math.max(basePages, p - 2))}
                            className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-white font-bold">−</button>
                        <input type="number" value={pages} min={basePages} max={400} step={2}
                            onChange={e => {
                                const v = e.target.value;
                                if (v === '') { setPages(0); return; }
                                const n = parseInt(v, 10);
                                if (!isNaN(n)) setPages(n);
                            }}
                            onBlur={() => {
                                if (pages < basePages) setPages(basePages);
                                else if (pages % 2 !== 0) setPages(pages + 1);
                            }}
                            className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-center text-white font-bold focus:border-emerald-500 focus:outline-none" />
                        <button type="button" onClick={() => setPages(p => p + 2)}
                            className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-white font-bold">+</button>
                        <span className="text-[11px] text-zinc-500">= {Math.floor(Math.max(0, pages) / 2)} rozkł.</span>
                    </div>
                    {pages > basePages && (
                        <p className="text-[11px] text-emerald-400 mt-1">
                            +{Math.floor((pages - basePages) / 2)} rozkł. = +{(Math.floor((pages - basePages) / 2) * pricePerSpread).toLocaleString('pl-PL')} PLN
                        </p>
                    )}
                </div>
            )}

            <div>
                <label className="text-xs text-zinc-400 mb-1 block">
                    Format <span className="text-zinc-500">(bazowo: {album.format || '—'})</span>
                </label>
                {formatOptions.length > 0 ? (
                    <select value={customFormat} onChange={e => setCustomFormat(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none">
                        <option value="">{album.format || 'Bazowy'} (bez rabatu)</option>
                        {formatOptions.map(o => (
                            <option key={o.label} value={o.label}>{o.label} {o.discount_pct > 0 ? `(−${o.discount_pct}%)` : ''}</option>
                        ))}
                    </select>
                ) : (
                    <input type="text" value={customFormat} onChange={e => setCustomFormat(e.target.value)}
                        placeholder={`Bazowo: ${album.format || '—'} — wpisz tylko jeśli chcesz zmienić`}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                )}
            </div>

            <div>
                <label className="text-xs text-zinc-400 mb-1 block">Uwagi (opcjonalnie)</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                    placeholder="np. okładka skórzana w kolorze granatowym, dedykacja..."
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none resize-none" />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex gap-2">
                <button onClick={onClose} className="px-3 py-2 text-xs text-zinc-400 hover:text-white">Anuluj</button>
                <button onClick={submit} disabled={submitting}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Dodaj do oferty ({finalPrice.toLocaleString('pl-PL')} PLN)
                </button>
            </div>
        </div>
    );
}

function AddonRow({ addon, onRemove, readOnly }: { addon: OfferAddon; onRemove: () => void; readOnly?: boolean }) {
    const [removing, setRemoving] = useState(false);
    const pages = addon.custom_pages ?? addon.base_pages;
    const format = addon.custom_format_request || addon.base_format;
    return (
        <div className="flex items-center gap-3 bg-zinc-950/60 rounded-lg p-3 border border-emerald-500/20">
            {addon.cover_image_url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={addon.cover_image_url} alt="" className="w-14 h-14 object-cover rounded-md shrink-0" />
            )}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{addon.album_title}</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                    {format && <span>{format}</span>}
                    {format && pages && <span className="mx-1">•</span>}
                    {pages && <span>{pages} stron ({Math.floor(pages / 2)} rozkł.)</span>}
                    {addon.custom_format_request && <span className="ml-2 text-amber-400 font-semibold">(prośba o zmianę formatu)</span>}
                </p>
            </div>
            <div className="text-right shrink-0">
                <p className="text-lg font-bold text-emerald-300">+{addon.final_price.toLocaleString('pl-PL')}</p>
                <p className="text-[10px] text-zinc-500">{addon.currency}</p>
            </div>
            {!readOnly && (
                <button onClick={async () => { setRemoving(true); await onRemove(); }} disabled={removing}
                    title="Usuń z oferty"
                    className="shrink-0 w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white flex items-center justify-center transition disabled:opacity-50">
                    {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : '✕'}
                </button>
            )}
        </div>
    );
}
