'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Search, Star, Filter, X, ArrowRight } from 'lucide-react';

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
    price?: number | null;
    is_featured: boolean;
    pages_count?: number | null;
    cover_type?: string | null;
    paper_type?: string | null;
    size?: string | null;
}

const CATEGORIES: Record<string, string> = {
    'wedding': '💍 Ślubne',
    'family': '👨‍👩‍👧 Rodzinne',
    'communion': '✝️ Komunijne',
    'birthday': '🎂 Urodzinowe',
    'newborn': '👶 Noworodkowe',
    'portrait': '📸 Portretowe',
    'event': '🎉 Eventowe',
};

function formatPrice(cents?: number | null): string | null {
    if (!cents || cents <= 0) return null;
    return (cents / 100).toFixed(2).replace('.', ',') + ' zł';
}

export default function AlbumsCatalog({ albums }: { albums: Album[] }) {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('');

    const filtered = useMemo(() => {
        return albums.filter(a => {
            if (activeCategory && a.category !== activeCategory) return false;
            if (search) {
                const q = search.toLowerCase();
                const hay = `${a.title} ${a.subtitle || ''} ${a.description || ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [albums, search, activeCategory]);

    const featured = filtered.filter(a => a.is_featured);
    const regular = filtered.filter(a => !a.is_featured);

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            {/* Hero */}
            <section className="relative pt-32 pb-16 px-6 overflow-hidden border-b border-zinc-800">
                <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 via-transparent to-transparent pointer-events-none" />
                <div className="max-w-6xl mx-auto relative">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500/10 border border-gold-500/30 rounded-full text-sm text-gold-400 mb-6">
                            <Star className="w-4 h-4" /> Profesjonalne albumy nPhoto
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                            Twoje najpiękniejsze chwile<br />
                            <span className="bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">
                                w albumie premium
                            </span>
                        </h1>
                        <p className="text-zinc-400 text-lg md:text-xl max-w-3xl mb-8">
                            Ręcznie wykonane albumy fotograficzne nPhoto — najwyższa jakość druku, eleganckie oprawy
                            i materiały, które przetrwają pokolenia. Wybierz album idealny na swoją okazję.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Filters */}
            <section className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-6 py-4">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Szukaj albumu..."
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-gold-500 focus:outline-none"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <X className="w-4 h-4 text-zinc-500 hover:text-white" />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                        <button
                            onClick={() => setActiveCategory('')}
                            className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-sm font-medium border transition ${activeCategory === ''
                                ? 'bg-gold-500 border-gold-500 text-zinc-950'
                                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                                }`}
                        >
                            Wszystkie
                        </button>
                        {Object.entries(CATEGORIES).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setActiveCategory(key)}
                                className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-sm font-medium border transition ${activeCategory === key
                                    ? 'bg-gold-500 border-gold-500 text-zinc-950'
                                    : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Grid */}
            <section className="px-6 py-12">
                <div className="max-w-6xl mx-auto">
                    {filtered.length === 0 ? (
                        <div className="text-center py-20">
                            <Filter className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                            <p className="text-zinc-400">Brak albumów spełniających kryteria.</p>
                        </div>
                    ) : (
                        <>
                            {featured.length > 0 && (
                                <div className="mb-12">
                                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                        <Star className="w-5 h-5 text-gold-500 fill-gold-500" /> Polecane
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {featured.map(a => <AlbumCard key={a.id} album={a} highlighted />)}
                                    </div>
                                </div>
                            )}
                            {regular.length > 0 && (
                                <div>
                                    {featured.length > 0 && <h2 className="text-2xl font-bold mb-6">Wszystkie albumy</h2>}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {regular.map(a => <AlbumCard key={a.id} album={a} />)}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}

function AlbumCard({ album, highlighted }: { album: Album; highlighted?: boolean }) {
    const cover = album.cover_image_url || (album.preview_images?.[0]) || null;
    const price = formatPrice(album.price);

    return (
        <Link href={`/sklep/albumy/${album.slug}`}>
            <motion.div
                whileHover={{ y: -4 }}
                className={`group bg-zinc-900 border rounded-2xl overflow-hidden transition ${highlighted ? 'border-gold-500/40 hover:border-gold-500' : 'border-zinc-800 hover:border-zinc-700'
                    }`}
            >
                <div className="relative aspect-[4/3] bg-zinc-800 overflow-hidden">
                    {cover ? (
                        <Image
                            src={cover}
                            alt={album.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover group-hover:scale-105 transition duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700 text-6xl">📖</div>
                    )}
                    {highlighted && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-gold-500 text-zinc-950 text-xs font-bold rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3 fill-zinc-950" /> Polecany
                        </div>
                    )}
                    {album.category && CATEGORIES[album.category] && (
                        <div className="absolute top-3 right-3 px-2.5 py-1 bg-zinc-950/80 backdrop-blur text-xs font-medium rounded-full">
                            {CATEGORIES[album.category]}
                        </div>
                    )}
                </div>
                <div className="p-5">
                    <h3 className="font-bold text-lg leading-tight mb-1 group-hover:text-gold-400 transition">
                        {album.title}
                    </h3>
                    {album.subtitle && (
                        <p className="text-sm text-zinc-500 mb-3">{album.subtitle}</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs text-zinc-400 mb-4">
                        {album.format && <span className="px-2 py-0.5 bg-zinc-800 rounded">{album.format}</span>}
                        {album.pages_count && <span className="px-2 py-0.5 bg-zinc-800 rounded">{album.pages_count} stron</span>}
                        {album.cover_type && <span className="px-2 py-0.5 bg-zinc-800 rounded">{album.cover_type}</span>}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                        {price ? (
                            <span className="text-gold-400 font-bold text-lg">{price}</span>
                        ) : (
                            <span className="text-zinc-500 text-sm">Wycena indywidualna</span>
                        )}
                        <span className="flex items-center gap-1 text-sm text-zinc-400 group-hover:text-gold-400 transition">
                            Zobacz <ArrowRight className="w-4 h-4" />
                        </span>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
