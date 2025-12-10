'use client';

// Public Couples Gallery Page
// Route: /foto-wyzwanie/galeria

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import EffectWrapper from '@/components/VisualEffects/EffectWrapper';
import type { PublicGalleryItem } from '@/types/photo-challenge';

export default function CouplesGalleryPage() {
    const [galleries, setGalleries] = useState<PublicGalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        fetchGalleries();
    }, []);

    const fetchGalleries = async () => {
        try {
            const response = await fetch('/api/photo-challenge/gallery/public');
            const data = await response.json();

            if (data.success) {
                setGalleries(data.galleries);
            }
        } catch (error) {
            console.error('Error fetching galleries:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredGalleries = filter === 'all'
        ? galleries
        : galleries.filter(g => g.session_type === filter);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-gold-400 text-xl">Ładowanie galerii...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white py-12 px-4">
            <div className="max-w-7xl mx-auto">


                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-5xl md:text-6xl font-display font-bold text-gold-400 mb-4">
                        Pary, które przyjęły wyzwanie
                    </h1>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                        Zobacz wspaniałe historie par, które zdecydowały się na wspólną sesję zdjęciową z rabatem
                    </p>

                    <EffectWrapper
                        pageSlug="foto-wyzwanie-galeria"
                        sectionName="header"
                    />
                </motion.div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 justify-center mb-12">
                    <FilterButton
                        label="Wszystkie"
                        active={filter === 'all'}
                        onClick={() => setFilter('all')}
                    />
                    <FilterButton
                        label="Pary"
                        active={filter === 'para'}
                        onClick={() => setFilter('para')}
                    />
                    <FilterButton
                        label="Rodziny"
                        active={filter === 'rodzina'}
                        onClick={() => setFilter('rodzina')}
                    />
                    <FilterButton
                        label="Biznes"
                        active={filter === 'biznes'}
                        onClick={() => setFilter('biznes')}
                    />
                </div>

                {/* Galleries Grid */}
                {filteredGalleries.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-lg">
                            Brak galerii do wyświetlenia
                        </p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredGalleries.map((gallery, index) => (
                            <GalleryCard key={gallery.id} gallery={gallery} index={index} />
                        ))}
                    </div>
                )}

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center mt-20 py-16 px-4 challenge-gradient rounded-2xl"
                >
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-gold-400 mb-4">
                        Chcesz być następny?
                    </h2>
                    <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                        Rzuć wyzwanie komuś bliksemu i zgarnij rabat na sesję!
                    </p>
                    <a
                        href="/foto-wyzwanie/stworz"
                        className="inline-block px-12 py-4 bg-gold-400 text-black text-lg font-bold rounded-lg hover:bg-gold-500 transition-all transform hover:scale-105"
                    >
                        Stwórz wyzwanie
                    </a>
                </motion.div>
            </div>
        </div>
    );
}

function FilterButton({ label, active, onClick }: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-2 rounded-full font-semibold transition-all ${active
                ? 'bg-gold-400 text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
        >
            {label}
        </button>
    );
}

function GalleryCard({ gallery, index }: {
    gallery: PublicGalleryItem;
    index: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="premium-card rounded-xl overflow-hidden group cursor-pointer"
        >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-900">
                {gallery.cover_photo_url ? (
                    <Image
                        src={gallery.cover_photo_url}
                        alt={gallery.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <span className="text-4xl">📸</span>
                    </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Photo Count Badge */}
                <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-gold-400">
                    {gallery.photo_count} zdjęć
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                <h3 className="text-xl font-display font-bold text-gold-400 mb-2">
                    {gallery.couple_names || gallery.title}
                </h3>

                {gallery.session_type && (
                    <p className="text-gray-500 text-sm mb-3">
                        Sesja: {gallery.session_type}
                    </p>
                )}

                {gallery.testimonial_text && (
                    <p className="text-gray-300 text-sm italic line-clamp-3">
                        "{gallery.testimonial_text}"
                    </p>
                )}
            </div>
        </motion.div>
    );
}
