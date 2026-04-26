'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Play, ExternalLink, Check, ArrowLeft } from 'lucide-react';

interface Album {
    id: number;
    slug: string;
    title: string;
    subtitle?: string | null;
    description?: string | null;
    category?: string | null;
    occasion?: string[];
    cover_image_url?: string | null;
    preview_images?: string[];
    sample_pages?: string[];
    video_url?: string | null;
    nphoto_shop_url?: string | null;
    nphoto_product_id?: string | null;
    price?: number | null;
    is_featured: boolean;
    pages_count?: number | null;
    cover_type?: string | null;
    paper_type?: string | null;
    size?: string | null;
    binding?: string | null;
    features?: string[];
}

function formatPrice(cents?: number | null): string | null {
    if (!cents || cents <= 0) return null;
    return (cents / 100).toFixed(2).replace('.', ',') + ' zł';
}

function toEmbedUrl(url: string): string | null {
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vm = url.match(/vimeo\.com\/(\d+)/);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
    return null;
}

export default function AlbumDetail({ album, related }: { album: Album; related: Album[] }) {
    const allImages = [
        ...(album.cover_image_url ? [album.cover_image_url] : []),
        ...(album.preview_images || []),
    ];
    const [activeImg, setActiveImg] = useState(0);
    const [showVideo, setShowVideo] = useState(false);
    const [galleryStart, setGalleryStart] = useState(0);

    const price = formatPrice(album.price);
    const videoEmbed = album.video_url ? toEmbedUrl(album.video_url) : null;

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
                <Link
                    href="/sklep/albumy"
                    className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-gold-400 mb-8"
                >
                    <ArrowLeft className="w-4 h-4" /> Wszystkie albumy
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Gallery */}
                    <div>
                        <div className="relative aspect-square bg-zinc-900 rounded-2xl overflow-hidden mb-4">
                            {allImages[activeImg] ? (
                                <Image
                                    src={allImages[activeImg]}
                                    alt={album.title}
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    className="object-cover"
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-700 text-9xl">📖</div>
                            )}
                            {album.is_featured && (
                                <div className="absolute top-4 left-4 px-3 py-1.5 bg-gold-500 text-zinc-950 text-sm font-bold rounded-full flex items-center gap-1.5">
                                    <Star className="w-4 h-4 fill-zinc-950" /> Polecany
                                </div>
                            )}
                            {videoEmbed && (
                                <button
                                    onClick={() => setShowVideo(true)}
                                    className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-black/70 backdrop-blur hover:bg-gold-500 hover:text-zinc-950 rounded-full text-sm font-medium transition"
                                >
                                    <Play className="w-4 h-4 fill-current" /> Zobacz wideo
                                </button>
                            )}
                        </div>
                        {allImages.length > 1 && (
                            <div className="grid grid-cols-5 gap-2">
                                {allImages.slice(0, 5).map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImg(idx)}
                                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${activeImg === idx ? 'border-gold-500' : 'border-transparent opacity-70 hover:opacity-100'
                                            }`}
                                    >
                                        <Image src={img} alt="" fill sizes="100px" className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div>
                        {album.category && (
                            <div className="text-sm text-gold-400 uppercase tracking-wider mb-2">
                                {album.category}
                            </div>
                        )}
                        <h1 className="text-3xl md:text-5xl font-bold mb-3 leading-tight">{album.title}</h1>
                        {album.subtitle && (
                            <p className="text-xl text-zinc-400 mb-6">{album.subtitle}</p>
                        )}

                        {price && (
                            <div className="mb-6 pb-6 border-b border-zinc-800">
                                <div className="text-zinc-500 text-sm mb-1">Cena od</div>
                                <div className="text-4xl font-bold text-gold-400">{price}</div>
                            </div>
                        )}

                        {album.description && (
                            <div className="mb-6 text-zinc-300 leading-relaxed whitespace-pre-line">
                                {album.description}
                            </div>
                        )}

                        {/* Specs */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {album.format && <SpecItem label="Format" value={album.format} />}
                            {album.pages_count && <SpecItem label="Strony" value={`${album.pages_count}`} />}
                            {album.cover_type && <SpecItem label="Okładka" value={album.cover_type} />}
                            {album.paper_type && <SpecItem label="Papier" value={album.paper_type} />}
                            {album.cover_type && <SpecItem label="Oprawa" value={album.cover_type} />}
                        </div>

                        {/* Features */}
                        {(album.nphoto_api_data?.features as string[] | undefined) && (album.nphoto_api_data?.features as string[] | undefined).length > 0 && (
                            <div className="mb-6">
                                <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-400 mb-3">
                                    Co wyróżnia ten album?
                                </h3>
                                <ul className="space-y-2">
                                    {(album.nphoto_api_data?.features as string[] | undefined).map((f, i) => (
                                        <li key={i} className="flex items-start gap-2 text-zinc-300">
                                            <Check className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* CTA */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            {album.nphoto_shop_url && (
                                <a
                                    href={album.nphoto_shop_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-gold-500 hover:bg-gold-400 text-zinc-950 font-bold rounded-xl transition"
                                >
                                    Zamów na nPhoto <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                            <Link
                                href="/kontakt"
                                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-gold-500 text-white font-bold rounded-xl transition"
                            >
                                Zapytaj o szczegóły
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Sample pages gallery */}
                {album.sample_pages && album.sample_pages.length > 0 && (
                    <section className="mt-20">
                        <h2 className="text-3xl font-bold mb-2">Przykładowe rozkładówki</h2>
                        <p className="text-zinc-400 mb-8">Zobacz jak wyglądają strony tego albumu</p>
                        <div className="relative">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {album.sample_pages.slice(galleryStart, galleryStart + 3).map((img, idx) => (
                                    <motion.div
                                        key={galleryStart + idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="relative aspect-[4/3] bg-zinc-900 rounded-xl overflow-hidden"
                                    >
                                        <Image src={img} alt={`Strona ${galleryStart + idx + 1}`} fill sizes="33vw" className="object-cover" />
                                    </motion.div>
                                ))}
                            </div>
                            {album.sample_pages.length > 3 && (
                                <div className="flex justify-center gap-3 mt-6">
                                    <button
                                        onClick={() => setGalleryStart(Math.max(0, galleryStart - 3))}
                                        disabled={galleryStart === 0}
                                        className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="self-center text-zinc-400 text-sm">
                                        {Math.min(galleryStart + 3, album.sample_pages.length)} / {album.sample_pages.length}
                                    </span>
                                    <button
                                        onClick={() => setGalleryStart(Math.min(album.sample_pages!.length - 3, galleryStart + 3))}
                                        disabled={galleryStart + 3 >= album.sample_pages.length}
                                        className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Related */}
                {related.length > 0 && (
                    <section className="mt-20 pt-12 border-t border-zinc-800">
                        <h2 className="text-3xl font-bold mb-8">Podobne albumy</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {related.map(r => (
                                <Link key={r.id} href={`/sklep/albumy/${r.slug}`}>
                                    <motion.div whileHover={{ y: -4 }} className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden transition">
                                        <div className="relative aspect-[4/3] bg-zinc-800">
                                            {r.cover_image_url && (
                                                <Image src={r.cover_image_url} alt={r.title} fill sizes="33vw" className="object-cover group-hover:scale-105 transition duration-500" />
                                            )}
                                        </div>
                                        <div className="p-5">
                                            <h3 className="font-bold group-hover:text-gold-400 transition">{r.title}</h3>
                                            {r.subtitle && <p className="text-sm text-zinc-500 mt-1">{r.subtitle}</p>}
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Video Modal */}
            {showVideo && videoEmbed && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur flex items-center justify-center p-4"
                    onClick={() => setShowVideo(false)}
                >
                    <div className="relative w-full max-w-4xl aspect-video" onClick={e => e.stopPropagation()}>
                        <iframe
                            src={videoEmbed}
                            className="w-full h-full rounded-xl"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                        <button
                            onClick={() => setShowVideo(false)}
                            className="absolute -top-12 right-0 text-white hover:text-gold-400"
                        >
                            Zamknij ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function SpecItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</div>
            <div className="font-medium">{value}</div>
        </div>
    );
}
