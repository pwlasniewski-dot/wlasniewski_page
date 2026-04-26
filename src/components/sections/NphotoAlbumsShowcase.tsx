'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, ExternalLink, Sparkles, Star, ArrowRight } from 'lucide-react';

interface ShowcaseConfig {
    source?: 'featured' | 'category' | 'occasion' | 'manual';
    category?: string;
    occasion?: string;
    album_ids?: number[];
    limit?: number;
    layout?: 'grid' | 'carousel' | 'masonry';
    show_video?: boolean;
    show_price?: boolean;
    show_cta?: boolean;
    cta_label?: string;
    cta_link?: string;
    background_color?: string;
}

interface Album {
    id: number;
    title: string;
    slug: string;
    subtitle?: string;
    description?: string;
    category: string;
    occasion: string[];
    price: number;
    currency: string;
    cover_image_url?: string;
    preview_images: any;
    video_url?: string;
    video_thumbnail?: string;
    nphoto_shop_url?: string;
    is_featured: boolean;
    schema_markup?: any;
}

interface Props {
    title?: string;
    subtitle?: string;
    config: ShowcaseConfig;
}

export default function NphotoAlbumsShowcase({ title, subtitle, config }: Props) {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
    const [carouselIdx, setCarouselIdx] = useState(0);

    const params = useMemo(() => {
        const p = new URLSearchParams();
        p.set('limit', String(config.limit || 6));
        if (config.source === 'featured') p.set('featured', 'true');
        else if (config.source === 'category' && config.category) p.set('category', config.category);
        else if (config.source === 'occasion' && config.occasion) p.set('occasion', config.occasion);
        else if (config.source === 'manual' && config.album_ids?.length) p.set('ids', config.album_ids.join(','));
        return p.toString();
    }, [config]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/nphoto-albums?${params}`);
                const json = await res.json();
                if (!cancelled && json.success) setAlbums(json.albums || []);
            } catch { /* ignore */ }
            if (!cancelled) setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [params]);

    if (loading) {
        return (
            <section className="py-20 bg-zinc-950">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="inline-block w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin"></div>
                </div>
            </section>
        );
    }

    if (albums.length === 0) return null;

    // Generate JSON-LD ItemList for SEO
    const itemListSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: albums.map((a, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: a.schema_markup || {
                '@type': 'Product',
                name: a.title,
                description: a.subtitle || a.description,
                image: a.cover_image_url,
                offers: a.price ? {
                    '@type': 'Offer',
                    price: (a.price / 100).toFixed(2),
                    priceCurrency: a.currency
                } : undefined
            }
        }))
    };

    const layout = config.layout || 'grid';

    return (
        <section className="relative py-20 md:py-28 overflow-hidden"
            style={{ backgroundColor: config.background_color || '#09090b' }}>
            {/* Decorative bg */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
            </div>

            {/* JSON-LD */}
            <script type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

            <div className="relative max-w-7xl mx-auto px-4">
                {/* Header */}
                {(title || subtitle) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12 md:mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold-500/10 border border-gold-500/30 rounded-full text-gold-400 text-xs uppercase tracking-wider mb-4">
                            <Sparkles className="w-3.5 h-3.5" /> Premium nPhoto
                        </div>
                        {title && (
                            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4"
                                dangerouslySetInnerHTML={{ __html: title }} />
                        )}
                        {subtitle && (
                            <p className="text-zinc-400 text-lg max-w-3xl mx-auto">{subtitle}</p>
                        )}
                    </motion.div>
                )}

                {/* GRID layout */}
                {layout === 'grid' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {albums.map((album, i) => (
                            <AlbumShowcaseCard
                                key={album.id}
                                album={album}
                                index={i}
                                showPrice={config.show_price !== false}
                                showVideo={config.show_video !== false}
                                onPlay={() => setActiveAlbum(album)}
                            />
                        ))}
                    </div>
                )}

                {/* CAROUSEL layout */}
                {layout === 'carousel' && (
                    <CarouselLayout
                        albums={albums}
                        activeIdx={carouselIdx}
                        setActiveIdx={setCarouselIdx}
                        showPrice={config.show_price !== false}
                        showVideo={config.show_video !== false}
                        onPlayVideo={setActiveAlbum}
                    />
                )}

                {/* MASONRY layout */}
                {layout === 'masonry' && (
                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                        {albums.map((album, i) => (
                            <div key={album.id} className="break-inside-avoid">
                                <AlbumShowcaseCard
                                    album={album}
                                    index={i}
                                    showPrice={config.show_price !== false}
                                    showVideo={config.show_video !== false}
                                    onPlay={() => setActiveAlbum(album)}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* CTA */}
                {config.show_cta !== false && config.cta_label && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mt-12">
                        <Link href={config.cta_link || '/sklep/albumy'}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-zinc-950 font-bold px-8 py-4 rounded-xl transition-all hover:scale-105 shadow-2xl shadow-gold-500/20">
                            {config.cta_label}
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </motion.div>
                )}
            </div>

            {/* Video modal */}
            {activeAlbum?.video_url && (
                <VideoModal album={activeAlbum} onClose={() => setActiveAlbum(null)} />
            )}
        </section>
    );
}

// ─── Single album card ───────────────────────────────────────────────────────
function AlbumShowcaseCard({ album, index, showPrice, showVideo, onPlay }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="group relative bg-zinc-900/50 backdrop-blur border border-zinc-800 hover:border-gold-500/50 rounded-2xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-gold-500/10">

            {/* Image */}
            <div className="relative aspect-[4/3] bg-zinc-800 overflow-hidden">
                {album.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={album.cover_image_url} alt={album.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                        <Sparkles className="w-16 h-16" />
                    </div>
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity"></div>

                {/* Featured badge */}
                {album.is_featured && (
                    <div className="absolute top-3 left-3 bg-gold-500 text-zinc-950 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" /> WYRÓŻNIONY
                    </div>
                )}

                {/* Video play button */}
                {showVideo && album.video_url && (
                    <button onClick={onPlay}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-gold-500/95 hover:bg-gold-500 rounded-full p-5 shadow-2xl backdrop-blur-sm">
                            <Play className="w-7 h-7 text-zinc-950 fill-current ml-1" />
                        </div>
                    </button>
                )}

                {/* Title overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                    <h3 className="text-white text-xl font-bold mb-1 group-hover:text-gold-400 transition">{album.title}</h3>
                    {album.subtitle && <p className="text-zinc-300 text-sm line-clamp-2">{album.subtitle}</p>}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 flex items-center justify-between gap-3">
                <div>
                    {showPrice && album.price > 0 && (
                        <div className="text-gold-400 font-bold text-lg">{(album.price / 100).toFixed(0)} {album.currency}</div>
                    )}
                    {album.occasion?.length > 0 && (
                        <div className="text-zinc-500 text-xs flex flex-wrap gap-1 mt-1">
                            {album.occasion.slice(0, 3).map((o: string) => (
                                <span key={o} className="bg-zinc-800 px-2 py-0.5 rounded">{occasionEmoji(o)}</span>
                            ))}
                        </div>
                    )}
                </div>
                {album.nphoto_shop_url ? (
                    <a href={album.nphoto_shop_url} target="_blank" rel="noopener noreferrer"
                        className="bg-zinc-800 hover:bg-gold-500 hover:text-zinc-950 text-zinc-300 p-2.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold">
                        Zobacz <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                ) : (
                    <Link href={`/sklep/albumy/${album.slug}`}
                        className="bg-zinc-800 hover:bg-gold-500 hover:text-zinc-950 text-zinc-300 p-2.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold">
                        Szczegóły <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                )}
            </div>
        </motion.div>
    );
}

function CarouselLayout({ albums, activeIdx, setActiveIdx, showPrice, showVideo, onPlayVideo }: any) {
    const active = albums[activeIdx];
    return (
        <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Big image */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-800 group">
                    {active.cover_image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={active.cover_image_url} alt={active.title} className="w-full h-full object-cover" />
                    )}
                    {showVideo && active.video_url && (
                        <button onClick={() => onPlayVideo(active)}
                            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-all">
                            <div className="bg-gold-500 rounded-full p-6 shadow-2xl">
                                <Play className="w-8 h-8 text-zinc-950 fill-current ml-1" />
                            </div>
                        </button>
                    )}
                </div>
                {/* Description */}
                <div>
                    {active.is_featured && (
                        <div className="inline-flex items-center gap-2 bg-gold-500/10 text-gold-400 text-xs px-3 py-1 rounded-full mb-3">
                            <Star className="w-3 h-3 fill-current" /> Wyróżniony produkt
                        </div>
                    )}
                    <h3 className="text-3xl font-display font-bold text-white mb-3">{active.title}</h3>
                    {active.subtitle && <p className="text-zinc-300 text-lg mb-4">{active.subtitle}</p>}
                    {active.description && <p className="text-zinc-400 text-sm mb-6 line-clamp-4">{active.description}</p>}
                    {showPrice && active.price > 0 && (
                        <div className="text-gold-400 font-bold text-2xl mb-6">{(active.price / 100).toFixed(0)} {active.currency}</div>
                    )}
                    {active.nphoto_shop_url && (
                        <a href={active.nphoto_shop_url} target="_blank" rel="noopener"
                            className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-zinc-950 font-bold px-6 py-3 rounded-xl">
                            Zobacz w sklepie <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                </div>
            </div>
            {/* Dots + arrows */}
            <div className="flex items-center justify-center gap-3 mt-8">
                <button onClick={() => setActiveIdx((activeIdx - 1 + albums.length) % albums.length)}
                    className="bg-zinc-800 hover:bg-gold-500 hover:text-zinc-950 text-white p-2 rounded-full transition">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                    {albums.map((_: any, i: number) => (
                        <button key={i} onClick={() => setActiveIdx(i)}
                            className={`w-2.5 h-2.5 rounded-full transition ${i === activeIdx ? 'bg-gold-500 w-8' : 'bg-zinc-700 hover:bg-zinc-600'}`} />
                    ))}
                </div>
                <button onClick={() => setActiveIdx((activeIdx + 1) % albums.length)}
                    className="bg-zinc-800 hover:bg-gold-500 hover:text-zinc-950 text-white p-2 rounded-full transition">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

function VideoModal({ album, onClose }: { album: Album; onClose: () => void }) {
    const embedUrl = toEmbedUrl(album.video_url || '');
    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative max-w-5xl w-full aspect-video" onClick={e => e.stopPropagation()}>
                <button onClick={onClose}
                    className="absolute -top-12 right-0 text-white hover:text-gold-400 text-3xl">×</button>
                {embedUrl ? (
                    <iframe src={embedUrl} className="w-full h-full rounded-xl" frameBorder="0"
                        allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                ) : (
                    <video src={album.video_url} controls autoPlay className="w-full h-full rounded-xl" />
                )}
            </div>
        </div>
    );
}

function toEmbedUrl(url: string): string | null {
    if (!url) return null;
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0`;
    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;
    return null;
}

function occasionEmoji(o: string): string {
    const map: Record<string, string> = {
        wedding: '💍', communion: '🕊️', birthday: '🎂',
        family: '👨‍👩‍👧', newborn: '👶', engagement: '💕', graduation: '🎓'
    };
    return map[o] || o;
}
