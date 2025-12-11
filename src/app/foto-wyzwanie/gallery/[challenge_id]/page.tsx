'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Download, Share2, Heart, MessageCircle, Mail, Copy, Lock } from 'lucide-react';
import Image from 'next/image';

interface GalleryData {
    id: number;
    title: string;
    couple_names?: string;
    session_type?: string;
    testimonial_text?: string;
    is_published: boolean;
    photos?: Array<{
        id: number;
        image_url: string;
        caption?: string;
        alt_text?: string;
    }>;
}

export default function GalleryPage() {
    const params = useParams();
    const challengeId = params.challenge_id as string;

    const [gallery, setGallery] = useState<GalleryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<number | null>(null);
    const [shareMode, setShareMode] = useState(false);

    useEffect(() => {
        fetchGallery();
    }, [challengeId]);

    const fetchGallery = async () => {
        try {
            const res = await fetch(`/api/photo-challenge/gallery/${challengeId}`);
            const data = await res.json();

            if (data.success && data.gallery) {
                setGallery(data.gallery);
            } else {
                setError('Galeria nie znaleziona');
            }
        } catch (err) {
            setError('Błąd przy ładowaniu galerii');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (imageUrl: string, photoId: number) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `photo-${photoId}.jpg`;
        link.click();
    };

    const handleDownloadAll = async () => {
        if (!gallery?.photos) return;
        // In production, would create ZIP file with all photos
        alert('Pobieranie wszystkich zdjęć w przygotowaniu!');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 flex items-center justify-center px-4">
                <div className="text-gold-400 text-xl">Ładowanie galerii...</div>
            </div>
        );
    }

    if (error || !gallery) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <div className="text-5xl mb-4">
                        <Lock size={64} className="mx-auto text-gold-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Dostęp ograniczony</h1>
                    <p className="text-zinc-400 mb-8">{error || 'Galeria nie znaleziona'}</p>
                    <Link
                        href="/foto-wyzwanie"
                        className="inline-block px-6 py-3 bg-gold-500 hover:bg-gold-600 text-black font-bold rounded-lg transition-colors"
                    >
                        Wróć do wyzwań
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-white py-20 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-display font-bold mb-3 bg-gradient-to-r from-gold-400 to-pink-400 bg-clip-text text-transparent">
                        Wasza galeria
                    </h1>
                    {gallery.couple_names && (
                        <p className="text-xl text-zinc-300 mb-2">
                            {gallery.couple_names}
                        </p>
                    )}
                    {gallery.session_type && (
                        <p className="text-zinc-400">
                            Sesja: {gallery.session_type}
                        </p>
                    )}
                </div>

                {/* Testimonial */}
                {gallery.testimonial_text && (
                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-8 mb-12">
                        <p className="text-lg italic text-zinc-300 mb-4">
                            "{gallery.testimonial_text}"
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                    <button
                        onClick={handleDownloadAll}
                        className="flex-1 py-3 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2"
                    >
                        <Download size={20} />
                        Pobierz wszystkie zdjęcia
                    </button>

                    <button
                        onClick={() => setShareMode(!shareMode)}
                        className="flex-1 py-3 rounded-lg font-bold border-2 border-gold-500 hover:bg-gold-500/10 text-gold-400 transition-colors flex items-center justify-center gap-2"
                    >
                        <Share2 size={20} />
                        Udostępnij
                    </button>
                </div>

                {/* Social Share Buttons */}
                {shareMode && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
                        {[
                            { label: 'Facebook', icon: '👍', color: 'bg-blue-600' },
                            { label: 'Instagram', icon: '📷', color: 'bg-pink-600' },
                            { label: 'WhatsApp', icon: '💬', color: 'bg-green-600' },
                            { label: 'Pinterest', icon: '📌', color: 'bg-red-600' }
                        ].map(social => (
                            <button
                                key={social.label}
                                className={`py-3 rounded-lg font-bold text-white transition-colors ${social.color} hover:opacity-90`}
                            >
                                <span className="text-2xl mb-1 block">{social.icon}</span>
                                <span className="text-xs">{social.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Gallery Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {gallery.photos && gallery.photos.length > 0 ? (
                        gallery.photos.map((photo, idx) => (
                            <div
                                key={photo.id}
                                onClick={() => setSelectedImage(idx)}
                                className="relative group cursor-pointer overflow-hidden rounded-xl bg-zinc-800 aspect-square"
                            >
                                <img
                                    src={photo.image_url}
                                    alt={photo.alt_text || photo.caption}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <Download size={32} className="text-white" />
                                </div>

                                {/* Caption */}
                                {photo.caption && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                        <p className="text-sm text-white">{photo.caption}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <p className="text-zinc-400 text-lg">
                                Zdjęcia będą dostępne wkrótce po sesji
                            </p>
                        </div>
                    )}
                </div>

                {/* Lightbox */}
                {selectedImage !== null && gallery.photos && gallery.photos[selectedImage] && (
                    <div
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
                            <img
                                src={gallery.photos[selectedImage].image_url}
                                alt={gallery.photos[selectedImage].alt_text}
                                className="w-full rounded-lg"
                            />

                            {/* Lightbox Actions */}
                            <div className="flex gap-3 mt-6 justify-center">
                                <button
                                    onClick={() =>
                                        handleDownload(
                                            gallery.photos![selectedImage].image_url,
                                            gallery.photos![selectedImage].id
                                        )
                                    }
                                    className="py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2"
                                >
                                    <Download size={20} />
                                    Pobierz
                                </button>

                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(
                                            gallery.photos![selectedImage].image_url
                                        );
                                        alert('Link do zdjęcia skopiowany!');
                                    }}
                                    className="py-2 px-4 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-bold flex items-center gap-2"
                                >
                                    <Copy size={20} />
                                    Kopiuj link
                                </button>

                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="py-2 px-4 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-bold"
                                >
                                    Zamknij
                                </button>
                            </div>

                            {/* Navigation */}
                            {gallery.photos && gallery.photos.length > 1 && (
                                <div className="flex gap-3 mt-4 justify-center">
                                    <button
                                        onClick={() =>
                                            setSelectedImage(
                                                selectedImage === 0
                                                    ? gallery.photos!.length - 1
                                                    : selectedImage - 1
                                            )
                                        }
                                        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg"
                                    >
                                        ← Poprzednie
                                    </button>

                                    <span className="px-4 py-2 text-zinc-400">
                                        {selectedImage + 1} / {gallery.photos.length}
                                    </span>

                                    <button
                                        onClick={() =>
                                            setSelectedImage(
                                                (selectedImage + 1) % gallery.photos!.length
                                            )
                                        }
                                        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg"
                                    >
                                        Następne →
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center mt-12 border-t border-zinc-700 pt-8">
                    <p className="text-zinc-400 mb-4">
                        Dziękujemy że wybraliśmy się na wyzwanie razem! 📸💕
                    </p>
                    <Link
                        href="/foto-wyzwanie"
                        className="inline-block px-6 py-3 bg-gold-500 hover:bg-gold-600 text-black font-bold rounded-lg transition-colors"
                    >
                        Wróć do wyzwań
                    </Link>
                </div>
            </div>
        </div>
    );
}
