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
    nphoto_shop_url?: string;
    is_featured: boolean;
    _custom_note?: string;
    _is_highlighted?: boolean;
}

export default function ClientOfferRecommendedAlbums({ offerId }: { offerId: number }) {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);
    const [source, setSource] = useState<string>('');
    const [activeIdx, setActiveIdx] = useState(0);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/offers/${offerId}/recommended-albums`);
                const json = await res.json();
                if (!cancelled && json.success) {
                    setAlbums(json.albums || []);
                    setSource(json.source);
                }
            } catch { /* ignore */ }
            if (!cancelled) setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [offerId]);

    if (loading || albums.length === 0) return null;

    const active = albums[activeIdx];

    return (
        <div className="px-4 sm:px-6 pb-6 border-t border-gold-500/20 pt-6 bg-gradient-to-br from-gold-500/[0.04] via-transparent to-transparent">
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

            <AlbumShowcase
                key={active.id}
                album={active}
                offerId={offerId}
            />

            {albums.length > 1 && (
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

function AlbumShowcase({ album, offerId }: { album: Album; offerId: number }) {
    const gallery = useMemo(() => {
        const out: { type: 'image' | 'video'; url: string; thumb?: string }[] = [];
        if (album.video_url) {
            out.push({ type: 'video', url: album.video_url, thumb: album.video_thumbnail || album.cover_image_url });
        }
        if (album.cover_image_url) out.push({ type: 'image', url: album.cover_image_url });
        const previews = Array.isArray(album.preview_images) ? album.preview_images : [];
        previews.forEach((u: string) => { if (u && u !== album.cover_image_url) out.push({ type: 'image', url: u }); });
        const samples = Array.isArray(album.sample_pages) ? album.sample_pages : [];
        samples.forEach((u: string) => { if (u) out.push({ type: 'image', url: u }); });
        return out;
    }, [album]);

    const [idx, setIdx] = useState(0);
    const [videoPlaying, setVideoPlaying] = useState(false);
    const [showInterestForm, setShowInterestForm] = useState(false);

    const current = gallery[idx];
    const isVideoSlide = current?.type === 'video';

    function next() { setVideoPlaying(false); setIdx(i => (i + 1) % gallery.length); }
    function prev() { setVideoPlaying(false); setIdx(i => (i - 1 + gallery.length) % gallery.length); }

    const ytMatch = isVideoSlide ? current.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/) : null;
    const vimeoMatch = isVideoSlide ? current.url.match(/vimeo\.com\/(\d+)/) : null;
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
                        ) : isVideoSlide && videoPlaying && !embedUrl ? (
                            <video src={current.url} autoPlay controls className="absolute inset-0 w-full h-full object-contain bg-black" />
                        ) : (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={(isVideoSlide ? current.thumb : current?.url) || album.cover_image_url || ''}
                                    alt={album.title}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                {isVideoSlide && (
                                    <button
                                        onClick={() => setVideoPlaying(true)}
                                        className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-black/10 to-black/40 group cursor-pointer">
                                        <div className="bg-gold-500 hover:bg-gold-400 rounded-full p-5 sm:p-6 shadow-2xl transition-transform group-hover:scale-110">
                                            <Play className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-950 fill-current ml-1" />
                                        </div>
                                        <div className="absolute bottom-4 left-4 right-4 text-center">
                                            <span className="inline-flex items-center gap-2 bg-black/60 backdrop-blur px-4 py-2 rounded-full text-white text-sm font-semibold">
                                                ▶ Zobacz prezentację albumu
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

                        {/* Thumbnail strip */}
                        {gallery.length > 1 && !videoPlaying && (
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-2 bg-black/60 backdrop-blur rounded-full max-w-[90%] overflow-x-auto">
                                {gallery.map((g, i) => (
                                    <button key={i} onClick={() => { setVideoPlaying(false); setIdx(i); }}
                                        className={`relative w-10 h-10 rounded-md overflow-hidden shrink-0 transition border-2 ${i === idx ? 'border-gold-500 scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={(g.type === 'video' ? g.thumb : g.url) || ''} alt="" className="w-full h-full object-cover" />
                                        {g.type === 'video' && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                <Play className="w-3 h-3 text-white fill-current" />
                                            </div>
                                        )}
                                    </button>
                                ))}
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

                        {showInterestForm ? (
                            <InterestForm
                                albumId={album.id}
                                offerId={offerId}
                                onClose={() => setShowInterestForm(false)}
                            />
                        ) : (
                            <div className="space-y-2">
                                <button
                                    onClick={() => setShowInterestForm(true)}
                                    className="w-full bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-zinc-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-gold-500/30 transition">
                                    <Sparkles className="w-4 h-4" /> Chcę ten album do mojej sesji
                                </button>
                                <p className="text-[11px] text-zinc-500 text-center">Bez zobowiązań - fotograf skontaktuje się z Tobą i ustalcie szczegóły</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
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

function InterestForm({ albumId, offerId, onClose }: { albumId: number; offerId: number; onClose: () => void }) {
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
                body: JSON.stringify({ offer_id: offerId, album_id: albumId, message }),
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
                <h5 className="text-emerald-300 font-bold mb-1">Wiadomość wysłana!</h5>
                <p className="text-xs text-emerald-200">Fotograf odezwie się w ciągu 24h. Możesz dalej przeglądać ofertę.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Opcjonalnie: pytania, uwagi, preferencje co do okładki..."
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-gold-500 focus:outline-none resize-none"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2">
                <button onClick={onClose}
                    className="px-3 py-2 text-xs text-zinc-400 hover:text-white">
                    Anuluj
                </button>
                <button onClick={submit} disabled={submitting}
                    className="flex-1 bg-gold-500 hover:bg-gold-400 text-zinc-950 font-bold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Wyślij zapytanie
                </button>
            </div>
        </div>
    );
}
