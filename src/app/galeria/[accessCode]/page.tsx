'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, ShoppingCart, Check, X, Eye } from 'lucide-react';
import Image from 'next/image';

interface GalleryPhoto {
    id: number;
    thumbnail_url: string | null;
    is_standard: boolean;
    file_size: number;
    width: number | null;
    height: number | null;
}

interface Gallery {
    id: number;
    client_name: string;
    standard_count: number;
    price_per_premium: number;
    expires_at: string | null;
    standard_photos: GalleryPhoto[];
    premium_photos: GalleryPhoto[];
}

export default function ClientGalleryPage() {
    const params = useParams();
    const router = useRouter();
    const accessCode = params?.accessCode as string;

    const [gallery, setGallery] = useState<Gallery | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPremium, setSelectedPremium] = useState<Set<number>>(new Set());
    const [lightboxPhoto, setLightboxPhoto] = useState<number | null>(null);

    useEffect(() => {
        if (accessCode) {
            fetchGallery();
        }
    }, [accessCode]);

    const fetchGallery = async () => {
        try {
            const res = await fetch(`/api/galleries/${accessCode}`);
            const data = await res.json();

            if (data.success) {
                setGallery(data.gallery);
            } else {
                router.push('/galeria/login');
            }
        } catch (error) {
            console.error('Failed to fetch gallery');
            router.push('/galeria/login');
        } finally {
            setLoading(false);
        }
    };

    const downloadPhoto = async (photoId: number) => {
        window.open(`/api/galleries/${accessCode}/download/${photoId}`, '_blank');
    };

    const togglePremiumSelection = (photoId: number) => {
        const newSelected = new Set(selectedPremium);
        if (newSelected.has(photoId)) {
            newSelected.delete(photoId);
        } else {
            newSelected.add(photoId);
        }
        setSelectedPremium(newSelected);
    };

    const handleCheckout = async () => {
        if (selectedPremium.size === 0) return;

        try {
            const res = await fetch(`/api/galleries/${accessCode}/order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photo_ids: Array.from(selectedPremium)
                })
            });

            const data = await res.json();
            if (data.success) {
                if (data.paymentUrl) {
                    window.location.href = data.paymentUrl;
                } else {
                    alert('Zamówienie utworzone. Skontaktuj się z administratorem w celu opłacenia.');
                }
            } else {
                alert('Błąd: ' + data.error);
            }
        } catch (error) {
            alert('Nie udało się utworzyć zamówienia');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-zinc-400 text-xl">Ładowanie galerii...</div>
            </div>
        );
    }

    if (!gallery) {
        return null;
    }

    const totalPrice = selectedPremium.size * gallery.price_per_premium;

    return (
        <div className="min-h-screen bg-black text-white py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-6xl font-display font-bold text-gold-400 mb-4">
                        Witaj, {gallery.client_name}! 📸
                    </h1>
                    <p className="text-xl text-zinc-400">
                        Twoja galeria zdjęć jest gotowa
                    </p>
                    {gallery.expires_at && (
                        <p className="text-sm text-yellow-400 mt-2">
                            Galeria dostępna do: {new Date(gallery.expires_at).toLocaleDateString('pl-PL')}
                        </p>
                    )}
                </div>

                {/* Standard Photos Section */}
                {gallery.standard_photos.length > 0 && (
                    <div className="mb-16">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                                <span className="text-green-400">✓</span>
                                Twoje Zdjęcia
                            </h2>
                            <div className="text-zinc-400">
                                {gallery.standard_photos.length} zdjęć w pakiecie
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {gallery.standard_photos.map((photo) => (
                                <div
                                    key={photo.id}
                                    className="group relative bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-green-500 transition-all"
                                >
                                    <div className="aspect-square relative cursor-pointer" onClick={() => setLightboxPhoto(photo.id)}>
                                        <Image
                                            src={photo.thumbnail_url || '/placeholder.jpg'}
                                            alt={`Photo ${photo.id}`}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Eye className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => downloadPhoto(photo.id)}
                                        className="absolute bottom-2 right-2 p-2 bg-green-500 hover:bg-green-600 rounded-lg text-white shadow-lg"
                                        title="Pobierz"
                                    >
                                        <Download className="w-5 h-5" />
                                    </button>
                                    <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded">
                                        TWOJE
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Premium Photos Section */}
                {gallery.premium_photos.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                                <span className="text-gold-400">★</span>
                                Dodatkowe Zdjęcia
                            </h2>
                            <div className="text-zinc-400">
                                {(gallery.price_per_premium / 100).toFixed(2)} zł / zdjęcie
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                            {gallery.premium_photos.map((photo) => {
                                const isSelected = selectedPremium.has(photo.id);
                                return (
                                    <div
                                        key={photo.id}
                                        className={`group relative bg-zinc-900 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${isSelected
                                            ? 'border-gold-400'
                                            : 'border-zinc-800 hover:border-gold-400/50'
                                            }`}
                                        onClick={() => togglePremiumSelection(photo.id)}
                                    >
                                        <div className="aspect-square relative">
                                            <Image
                                                src={photo.thumbnail_url || '/placeholder.jpg'}
                                                alt={`Premium Photo ${photo.id}`}
                                                fill
                                                className="object-cover"
                                            />
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-gold-400/20 flex items-center justify-center">
                                                    <div className="w-12 h-12 bg-gold-400 rounded-full flex items-center justify-center">
                                                        <Check className="w-8 h-8 text-black" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute top-2 left-2 px-2 py-1 bg-gold-400 text-black text-xs font-semibold rounded">
                                            {(gallery.price_per_premium / 100).toFixed(2)} ZŁ
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Checkout Bar */}
                        {selectedPremium.size > 0 && (
                            <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-6 shadow-2xl">
                                <div className="max-w-7xl mx-auto flex items-center justify-between">
                                    <div>
                                        <div className="text-lg text-zinc-400">
                                            Wybrano: <span className="text-white font-semibold">{selectedPremium.size} zdjęć</span>
                                        </div>
                                        <div className="text-2xl font-bold text-gold-400">
                                            {(totalPrice / 100).toFixed(2)} zł
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleCheckout}
                                        className="px-8 py-4 bg-gold-400 hover:bg-gold-500 text-black font-bold rounded-lg transition-all flex items-center gap-2 text-lg"
                                    >
                                        <ShoppingCart className="w-6 h-6" />
                                        Kup wybrane zdjęcia
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {gallery.standard_photos.length === 0 && gallery.premium_photos.length === 0 && (
                    <div className="text-center py-24 text-zinc-500">
                        <p className="text-xl mb-4">Galeria jest pusta</p>
                        <p>Fotograf jeszcze nie dodał zdjęć. Sprawdź ponownie później!</p>
                    </div>
                )}
            </div>

            {/* Simple Lightbox */}
            {lightboxPhoto && (
                <div
                    className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
                    onClick={() => setLightboxPhoto(null)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-white"
                        onClick={() => setLightboxPhoto(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="relative w-full h-full flex items-center justify-center">
                        <Image
                            src={`/api/galleries/${accessCode}/download/${lightboxPhoto}`}
                            alt="Photo"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
