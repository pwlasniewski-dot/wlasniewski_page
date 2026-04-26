'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Play, ExternalLink, Star, Heart } from 'lucide-react';

interface Album {
    id: number;
    title: string;
    slug: string;
    subtitle?: string;
    description?: string;
    price: number;
    currency: string;
    cover_image_url?: string;
    preview_images: any;
    video_url?: string;
    nphoto_shop_url?: string;
    is_featured: boolean;
    _custom_note?: string;
    _is_highlighted?: boolean;
}

export default function ClientOfferRecommendedAlbums({ offerId }: { offerId: number }) {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);
    const [source, setSource] = useState<string>('');
    const [activeVideo, setActiveVideo] = useState<Album | null>(null);
    const [expanded, setExpanded] = useState(false);

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

    const visible = expanded ? albums : albums.slice(0, 3);

    return (
        <div className="px-6 pb-6 border-t border-gold-500/20 pt-5 bg-gradient-to-br from-gold-500/5 via-zinc-900/50 to-transparent">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-gold-400" />
                        <h4 className="text-base font-bold text-white">
                            {source === 'admin_curated' ? 'Polecane do tej oferty' : 'Inspiracja: Albumy dla Ciebie'}
                        </h4>
                    </div>
                    <p className="text-xs text-zinc-400">
                        {source === 'admin_curated'
                            ? 'Fotograf wybrał te albumy specjalnie dla Twojej sesji.'
                            : 'Albumy najczęściej wybierane przy podobnych okazjach.'}
                    </p>
                </div>
                {albums.length > 3 && (
                    <button onClick={() => setExpanded(!expanded)}
                        className="text-xs text-gold-400 hover:text-gold-300 font-medium">
                        {expanded ? 'Zwiń' : `Pokaż wszystkie (${albums.length})`}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {visible.map(album => (
                    <ClientAlbumMiniCard
                        key={album.id}
                        album={album}
                        onPlayVideo={() => setActiveVideo(album)}
                    />
                ))}
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Wszystkie albumy zamawiamy bezpośrednio u <strong className="text-zinc-300">nPhoto</strong> - sprawdzonego producenta premium fotoproduktów.</span>
            </div>

            {/* Video modal */}
            {activeVideo?.video_url && (
                <VideoModal album={activeVideo} onClose={() => setActiveVideo(null)} />
            )}
        </div>
    );
}

function ClientAlbumMiniCard({ album, onPlayVideo }: { album: Album; onPlayVideo: () => void }) {
    return (
        <div className={`relative bg-zinc-900/80 backdrop-blur border rounded-xl overflow-hidden group transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-gold-500/10
            ${album._is_highlighted ? 'border-gold-500 shadow-gold-500/20 shadow-md' : 'border-zinc-800 hover:border-gold-500/50'}`}>
            <div className="relative aspect-[4/3] bg-zinc-800 overflow-hidden">
                {album.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={album.cover_image_url} alt={album.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <Sparkles className="w-12 h-12" />
                    </div>
                )}
                {album._is_highlighted && (
                    <div className="absolute top-2 left-2 bg-gold-500 text-zinc-950 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-current" /> POLECANE
                    </div>
                )}
                {album.video_url && (
                    <button onClick={onPlayVideo}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/30">
                        <div className="bg-gold-500 rounded-full p-3 shadow-xl">
                            <Play className="w-5 h-5 text-zinc-950 fill-current ml-0.5" />
                        </div>
                    </button>
                )}
            </div>
            <div className="p-3">
                <h5 className="text-sm font-bold text-white line-clamp-1 mb-1 group-hover:text-gold-400 transition">{album.title}</h5>
                {album.subtitle && <p className="text-xs text-zinc-400 line-clamp-2 mb-2">{album.subtitle}</p>}
                {album._custom_note && (
                    <div className="text-xs text-gold-300 italic bg-gold-500/10 rounded px-2 py-1 mb-2">
                        💬 {album._custom_note}
                    </div>
                )}
                <div className="flex items-center justify-between gap-2 mt-2">
                    {album.price > 0 && (
                        <div className="text-gold-400 font-bold text-sm">{album.price} {album.currency}</div>
                    )}
                    {album.nphoto_shop_url && (
                        <a href={album.nphoto_shop_url} target="_blank" rel="noopener"
                            className="ml-auto bg-zinc-800 hover:bg-gold-500 hover:text-zinc-950 text-zinc-300 px-2.5 py-1 rounded text-xs flex items-center gap-1 transition">
                            Zobacz <ExternalLink className="w-3 h-3" />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

function VideoModal({ album, onClose }: { album: Album; onClose: () => void }) {
    const url = album.video_url || '';
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    const embedUrl = yt ? `https://www.youtube.com/embed/${yt[1]}?autoplay=1` : vimeo ? `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1` : null;

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative max-w-5xl w-full aspect-video" onClick={e => e.stopPropagation()}>
                <button onClick={onClose}
                    className="absolute -top-12 right-0 text-white hover:text-gold-400 text-3xl">×</button>
                {embedUrl ? (
                    <iframe src={embedUrl} className="w-full h-full rounded-xl" frameBorder="0"
                        allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                ) : (
                    <video src={url} controls autoPlay className="w-full h-full rounded-xl" />
                )}
            </div>
        </div>
    );
}
