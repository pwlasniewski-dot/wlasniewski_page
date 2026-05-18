'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Download, ShoppingCart, Check, X, ArrowLeft, Calendar, ImageIcon, Plus, Minus, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumGalleryHero from '@/components/galleries/PremiumGalleryHero';
import PostGalleryUpsell from '@/components/galleries/PostGalleryUpsell';

interface GalleryPhoto {
    id: number;
    thumbnail_url: string | null;
    file_url: string;
    is_standard: boolean;
    file_size: number;
    width: number | null;
    height: number | null;
}

interface Gallery {
    id: number;
    client_name: string;
    description: string | null;
    standard_count: number;
    price_per_premium: number;
    expires_at: string | null;
    standard_photos: GalleryPhoto[];
    premium_photos: GalleryPhoto[];
    paid_photo_ids: number[];
    products: GalleryProduct[];
}

interface GalleryProduct {
    id: number;
    title: string;
    description: string | null;
    price: number;
    image_url: string | null;
    video_url: string | null;
}

export default function ClientGalleryPage() {
    const params = useParams();
    const router = useRouter();
    const accessCode = params?.accessCode as string;

    const { isAuthenticated } = useAuth();
    const [gallery, setGallery] = useState<Gallery | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPremium, setSelectedPremium] = useState<Set<number>>(new Set());
    const [downloadingAll, setDownloadingAll] = useState(false);

    // Advanced Lightbox State
    const [lightbox, _setLightbox] = useState({
        isOpen: false,
        activeIndex: 0,
        activeType: 'standard' as 'standard' | 'premium'
    });

    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const setLightbox = (index: number, type: 'standard' | 'premium', open = true) => {
        _setLightbox({ isOpen: open, activeIndex: index, activeType: type });
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    const currentPhoto = lightbox.isOpen
        ? (lightbox.activeType === 'standard' ? gallery?.standard_photos[lightbox.activeIndex] : gallery?.premium_photos[lightbox.activeIndex])
        : null;

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
        const link = document.createElement('a');
        link.href = `/api/galleries/${accessCode}/download/${photoId}`;
        link.download = `photo-${photoId}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isPaid = (photoId: number) => {
        return gallery?.paid_photo_ids?.includes(photoId);
    };

    const togglePremium = (photoId: number) => {
        if (isPaid(photoId)) return;
        const newSelected = new Set(selectedPremium);
        if (newSelected.has(photoId)) {
            newSelected.delete(photoId);
        } else {
            newSelected.add(photoId);
        }
        setSelectedPremium(newSelected);
    };

    const navigateLightbox = useCallback((dir: 'next' | 'prev') => {
        if (!gallery) return;
        const list = lightbox.activeType === 'standard' ? gallery.standard_photos : gallery.premium_photos;
        let nextIndex = dir === 'next' ? lightbox.activeIndex + 1 : lightbox.activeIndex - 1;

        if (nextIndex >= list.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = list.length - 1;

        setLightbox(nextIndex, lightbox.activeType);
    }, [gallery, lightbox]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!lightbox.isOpen) return;
            if (e.key === 'ArrowRight') navigateLightbox('next');
            if (e.key === 'ArrowLeft') navigateLightbox('prev');
            if (e.key === 'Escape') setLightbox(0, 'standard', false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightbox.isOpen, navigateLightbox]);

    // Zoom & Pan Handlers
    const handleWheel = (e: React.WheelEvent) => {
        if (!lightbox.isOpen) return;
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        setZoom(prev => Math.min(Math.max(prev + delta, 1), 4));
    };

    const handleDragStart = (e: React.MouseEvent) => {
        if (zoom <= 1) return;
        setDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleDragMove = (e: React.MouseEvent) => {
        if (!dragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleDragEnd = () => {
        setDragging(false);
    };

    const downloadAllFree = async () => {
        if (!gallery || downloadingAll) return;
        setDownloadingAll(true);
        try {
            const link = document.createElement('a');
            link.href = `/api/galleries/${accessCode}/download-all`;
            link.download = `${gallery.client_name || 'galeria'}-zdjecia.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Wait briefly to allow the download to initiate before reverting the button state
            await new Promise(r => setTimeout(r, 2000));
        } catch (error) {
            alert('Wystąpił błąd podczas pobierania paczki ZIP.');
        } finally {
            setDownloadingAll(false);
        }
    };

    const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());

    const toggleProduct = (productId: number) => {
        const newSelected = new Set(selectedProducts);
        if (newSelected.has(productId)) {
            newSelected.delete(productId);
        } else {
            newSelected.add(productId);
        }
        setSelectedProducts(newSelected);
    };

    const handleCheckout = async () => {
        if (selectedPremium.size === 0 && selectedProducts.size === 0) return;
        try {
            const res = await fetch(`/api/galleries/${accessCode}/order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photo_ids: Array.from(selectedPremium),
                    product_ids: Array.from(selectedProducts)
                })
            });
            const data = await res.json();
            if (data.success && data.paymentUrl) {
                window.location.href = data.paymentUrl;
            } else if (data.success) {
                alert(data.message || 'Zamówienie zostało utworzone w systemie, jednak wystąpił błąd bramki płatności PayU (brak konfiguracji po stronie fotografa). Skontaktuj się z administratorem, aby opłacić zamówienie.');
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
                <div className="text-zinc-400 text-xl animate-pulse">Wczytywanie Twojej pięknej galerii...</div>
            </div>
        );
    }

    if (!gallery) return null;

    const premiumTotal = selectedPremium.size * gallery.price_per_premium;
    const productsTotal = (gallery.products || []).filter(p => selectedProducts.has(p.id)).reduce((acc, p) => acc + p.price, 0);
    const totalPrice = premiumTotal + productsTotal;

    return (
        <div className="min-h-screen bg-black text-white pb-40 selection:bg-gold-500/30">
            {/* HERO SLIDER — wow factor */}
            {(gallery.standard_photos.length + gallery.premium_photos.length) > 0 && (
                <PremiumGalleryHero
                    photos={[...gallery.standard_photos, ...gallery.premium_photos].map(p => ({
                        id: p.id,
                        file_url: p.file_url,
                        thumbnail_url: p.thumbnail_url,
                    }))}
                    title={`Witaj, ${gallery.client_name}!`}
                    subtitle={gallery.description || 'Twoje profesjonalne zdjęcia są gotowe do przejrzenia'}
                    badge="Twoja galeria"
                    onPhotoClick={(p) => {
                        const sIdx = gallery.standard_photos.findIndex(s => s.id === p.id);
                        if (sIdx !== -1) { setLightbox(sIdx, 'standard'); return; }
                        const pIdx = gallery.premium_photos.findIndex(pp => pp.id === p.id);
                        if (pIdx !== -1) setLightbox(pIdx, 'premium');
                    }}
                />
            )}
            <div className="max-w-7xl mx-auto py-12 px-4">
                {/* Header */}
                <div className="mb-16 relative">
                    {isAuthenticated && (
                        <Link
                            href="/konto"
                            className="absolute left-0 -top-4 flex items-center gap-2 text-zinc-500 hover:text-white transition-all py-2.5 px-5 bg-zinc-900/40 rounded-2xl border border-zinc-800/50 backdrop-blur-md"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-bold uppercase tracking-wider">Panel Klienta</span>
                        </Link>
                    )}

                    <div className="text-center">
                        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 mb-6 uppercase tracking-tighter">
                            Witaj, {gallery.client_name}!
                        </h1>
                        <p className="text-xl text-zinc-400 font-medium tracking-wide">
                            Twoje profesjonalne zdjęcia są gotowe do przejrzenia
                        </p>
                        {gallery.description && (
                            <div className="mt-8 p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl max-w-3xl mx-auto text-left backdrop-blur-sm">
                                <p className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed font-medium">
                                    {gallery.description}
                                </p>
                            </div>
                        )}
                        {gallery.expires_at && (
                            <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase mt-6 border border-red-500/20">
                                <Calendar className="w-3.5 h-3.5" />
                                Galeria wygasa: {new Date(gallery.expires_at).toLocaleDateString('pl-PL')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Standard Photos Section */}
                {gallery.standard_photos.length > 0 && (
                    <div className="mb-24">
                        <div className="flex justify-between items-center bg-zinc-900/40 p-10 rounded-[3rem] border border-zinc-800 mb-12">
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Pobierz swoją paczkę</h2>
                                <p className="text-zinc-500 font-medium">To są zdjęcia zawarte w Twoim pakiecie sesji.</p>
                            </div>
                            <button
                                onClick={downloadAllFree}
                                disabled={downloadingAll}
                                className="h-16 px-10 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-gold-500 transition-all shadow-xl shadow-white/5 disabled:opacity-50 flex items-center gap-3"
                            >
                                <Download className="w-5 h-5" />
                                {downloadingAll ? 'Pobieranie...' : 'Pobierz Wszystkie'}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {gallery.standard_photos.map((photo, idx) => (
                                <div
                                    key={photo.id}
                                    className="group relative aspect-[3/2] bg-zinc-900 overflow-hidden cursor-pointer border border-white/5 hover:border-white/20 transition-all shadow-2xl"
                                    onClick={() => setLightbox(idx, 'standard')}
                                >
                                    <Image
                                        src={photo.thumbnail_url || photo.file_url}
                                        alt={`Photo ${photo.id}`}
                                        fill
                                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="absolute top-8 right-8">
                                        <div className="p-4 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl text-white opacity-0 group-hover:opacity-100 transition-all duration-500">
                                            <Maximize2 className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center translate-y-4 group-hover:translate-y-0 transition-transform duration-500 opacity-0 group-hover:opacity-100">
                                        <div className="px-5 py-2 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-tighter">Otrzymujesz to zdjęcie</div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); downloadPhoto(photo.id); }}
                                            className="p-4 bg-white text-black rounded-2xl hover:bg-gold-500 transition-colors shadow-xl"
                                        >
                                            <Download className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Premium Photos Section */}
                {gallery.premium_photos.length > 0 && (
                    <div className="mb-24">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-10 py-10 bg-gold-500/5 rounded-[3rem] border border-gold-500/10 mb-12">
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tight mb-2 text-gold-500">Dodatkowe Ujęcia</h2>
                                <p className="text-zinc-500 font-medium">Spodobało Ci się coś jeszcze? Możesz dokupić te ujęcia za {(gallery.price_per_premium / 100).toFixed(2)} zł / szt.</p>
                            </div>
                            {(selectedPremium.size > 0 || selectedProducts.size > 0) && (
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Do zapłaty</div>
                                        <div className="text-3xl font-black text-white">{(totalPrice / 100).toFixed(2)} PLN</div>
                                    </div>
                                    <button
                                        onClick={handleCheckout}
                                        className="h-16 px-10 bg-gold-500 hover:bg-gold-400 text-black font-black uppercase tracking-widest text-xs rounded-2xl transition-all flex items-center gap-3 shadow-xl shadow-gold-500/20"
                                    >
                                        <ShoppingCart className="w-5 h-5" /> Zamów Wybrane
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* Enlarged Grid for Premium */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {gallery.premium_photos.map((photo, idx) => {
                                const selected = selectedPremium.has(photo.id);
                                const purchased = isPaid(photo.id);
                                return (
                                    <div
                                        key={photo.id}
                                        className={`group relative aspect-[3/2] bg-zinc-900 overflow-hidden cursor-pointer border transition-all shadow-2xl ${purchased ? 'border-green-500/50' : selected ? 'border-gold-500 ring-2 ring-gold-500/20 shadow-gold-500/10' : 'border-white/5 hover:border-gold-500/30'}`}
                                        onClick={() => setLightbox(idx, 'premium')}
                                    >
                                        <Image
                                            src={photo.thumbnail_url || photo.file_url}
                                            alt={`Premium Photo ${photo.id}`}
                                            fill
                                            className={`object-cover transition-all duration-1000 group-hover:scale-105 ${!purchased && !selected ? 'opacity-80 group-hover:opacity-100' : ''}`}
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Status Badges */}
                                        <div className="absolute top-10 left-10 flex flex-col gap-3">
                                            {purchased && (
                                                <div className="px-5 py-2 bg-green-500 text-white text-[10px] font-black uppercase rounded-full shadow-lg flex items-center gap-2">
                                                    <Check className="w-3 h-3" /> Kupione
                                                </div>
                                            )}
                                            {selected && !purchased && (
                                                <div className="px-5 py-2 bg-gold-500 text-black text-[10px] font-black uppercase rounded-full shadow-lg">Wybrane do zakupu</div>
                                            )}
                                            {!purchased && !selected && (
                                                <div className="px-5 py-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase rounded-full border border-white/10">Dodatkowy kadr</div>
                                            )}
                                        </div>

                                        <div className="absolute bottom-10 left-10 right-10 flex justify-between items-center">
                                            {!purchased ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); togglePremium(photo.id); }}
                                                    className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selected ? 'bg-gold-500 text-black' : 'bg-black/80 text-white backdrop-blur-md border border-white/10 hover:bg-gold-500 hover:text-black'}`}
                                                >
                                                    {selected ? 'Zrezygnuj' : `Dodaj do pakietu • ${(gallery.price_per_premium / 100).toFixed(2)} zł`}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); downloadPhoto(photo.id); }}
                                                    className="w-full py-5 bg-white/10 backdrop-blur-xl text-white rounded-2xl border border-white/20 hover:bg-white hover:text-black transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                                >
                                                    <Download className="w-4 h-4" /> Pobierz oryginał
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ALBUM SHOP - Display regardless of tab if products exist */}
                {(gallery.products && gallery.products.length > 0) && (
                    <div className="mt-40 border-t border-zinc-900 pt-20">
                        <h2 className="text-4xl font-black text-center mb-6 uppercase tracking-tight">Sklep z Albumami</h2>
                        <p className="text-center text-zinc-500 mb-16 max-w-2xl mx-auto">Zamów piękne, ręcznie wykonane albumy i wydruki, aby zachować swoje wspomnienia na zawsze.</p>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {gallery.products.map(product => {
                                const selected = selectedProducts.has(product.id);
                                return (
                                    <div key={product.id} className={`group bg-zinc-900/40 rounded-[3rem] overflow-hidden border transition-all ${selected ? 'border-gold-500 shadow-xl shadow-gold-500/10' : 'border-zinc-800 hover:border-zinc-700'}`}>
                                        <div className="aspect-video relative overflow-hidden">
                                            {product.image_url ? (
                                                <Image
                                                    src={product.image_url}
                                                    alt={product.title}
                                                    fill
                                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                                    <ImageIcon className="w-16 h-16 text-zinc-800" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                            <div className="absolute bottom-8 left-8 right-8">
                                                <h3 className="text-2xl font-black uppercase tracking-tight mb-2">{product.title}</h3>
                                                <p className="text-gold-500 font-bold text-xl">{(product.price / 100).toFixed(2)} PLN</p>
                                            </div>
                                        </div>
                                        <div className="p-10">
                                            <p className="text-zinc-400 leading-relaxed mb-8">{product.description}</p>
                                            <button
                                                onClick={() => toggleProduct(product.id)}
                                                className={`w-full py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${selected ? 'bg-gold-500 text-black' : 'bg-white text-black hover:bg-gold-500'}`}
                                            >
                                                {selected ? 'Wybrano do zamówienia (Kliknij by usunąć)' : 'Dodaj do zamówienia'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {gallery.standard_photos.length === 0 && gallery.premium_photos.length === 0 && (
                    <div className="text-center py-48 bg-zinc-900/10 border border-zinc-900 border-dashed rounded-[5rem]">
                        <ImageIcon className="w-24 h-24 mx-auto mb-8 text-zinc-900" />
                        <p className="text-3xl font-bold text-zinc-500 mb-2 tracking-tight">Twoja galeria jest jeszcze pusta</p>
                        <p className="text-zinc-600 font-medium">Fotograf przygotowuje Twoje zdjęcia.</p>
                    </div>
                )}
            </div>

            {/* UPSELL + PROŚBA O OPINIĘ — boost SEO */}
            {(gallery.standard_photos.length + gallery.premium_photos.length) > 0 && (
                <PostGalleryUpsell
                    clientName={gallery.client_name}
                    discountCode="WRACAM15"
                    theme="dark"
                />
            )}

            {/* Professional Zoomable Lightbox */}
            <AnimatePresence>
                {lightbox.isOpen && currentPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/98 z-[300] flex items-center justify-center backdrop-blur-3xl px-4 select-none"
                        onClick={() => setLightbox(0, 'standard', false)}
                    >
                        {/* Lightbox Header */}
                        <div className="absolute top-0 left-0 right-0 h-28 px-8 flex items-center justify-between z-[110] bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                            <div className="flex items-center gap-8">
                                <div className="text-white">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Przeglądanie</p>
                                    <p className="text-xl font-black">{lightbox.activeIndex + 1} <span className="text-zinc-600 text-sm font-bold">/ {lightbox.activeType === 'standard' ? gallery.standard_photos.length : gallery.premium_photos.length}</span></p>
                                </div>
                                <div className="h-10 w-px bg-white/10" />
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setZoom(prev => Math.min(prev + 0.5, 4))}
                                        className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all border border-white/5 hover:scale-110"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => { setZoom(1); setPosition({ x: 0, y: 0 }); }}
                                        className="px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black text-white transition-all border border-white/5 uppercase tracking-widest"
                                    >
                                        Dopasuj
                                    </button>
                                    <button
                                        onClick={() => setZoom(prev => Math.max(prev - 0.5, 1))}
                                        className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all border border-white/5 hover:scale-110"
                                    >
                                        <Minus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                {lightbox.activeType === 'premium' ? (
                                    <>
                                        {isPaid(currentPhoto.id) ? (
                                            <button
                                                onClick={() => downloadPhoto(currentPhoto.id)}
                                                className="h-16 px-10 bg-white text-black text-[10px] font-black uppercase rounded-2xl tracking-widest flex items-center gap-3 shadow-2xl hover:bg-gold-500 transition-colors"
                                            >
                                                <Download className="w-5 h-5" /> Pobierz oryginał
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => togglePremium(currentPhoto.id)}
                                                className={`h-16 px-10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl ${selectedPremium.has(currentPhoto.id) ? 'bg-gold-500 text-black' : 'bg-white/5 text-white border border-white/10 hover:bg-gold-500 hover:text-black'}`}
                                            >
                                                {selectedPremium.has(currentPhoto.id) ? 'Zrezygnuj z wyboru' : 'Dodaj do zamówienia'}
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <button
                                        onClick={() => downloadPhoto(currentPhoto.id)}
                                        className="h-16 px-12 bg-white text-black text-[10px] font-black uppercase rounded-2xl tracking-widest flex items-center gap-3 shadow-2xl hover:bg-gold-500 transition-colors"
                                    >
                                        <Download className="w-5 h-5" /> Pobierz teraz
                                    </button>
                                )}

                                <button
                                    onClick={() => setLightbox(0, 'standard', false)}
                                    className="p-5 bg-zinc-900/50 hover:bg-red-500 hover:text-white rounded-2xl text-zinc-400 transition-all border border-zinc-800"
                                >
                                    <X className="w-8 h-8" />
                                </button>
                            </div>
                        </div>

                        {/* Main Viewport */}
                        <div
                            className="relative w-full h-full flex items-center justify-center overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                            onWheel={handleWheel}
                            onMouseDownCapture={handleDragStart}
                            onMouseMoveCapture={handleDragMove}
                            onMouseUpCapture={handleDragEnd}
                            onMouseLeave={handleDragEnd}
                        >
                            <motion.div
                                animate={{
                                    scale: zoom,
                                    x: position.x,
                                    y: position.y,
                                }}
                                transition={dragging ? { duration: 0 } : { type: 'spring', damping: 30, stiffness: 250 }}
                                className="relative w-full h-[85vh] flex items-center justify-center cursor-grab active:cursor-grabbing"
                            >
                                <img
                                    src={`/api/galleries/${accessCode}/download/${currentPhoto.id}`}
                                    alt="Full View"
                                    className="max-w-full max-h-full object-contain shadow-[0_0_150px_rgba(0,0,0,1)] rounded-sm pointer-events-none"
                                />
                            </motion.div>
                        </div>

                        {/* Arrows */}
                        <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                            <button
                                onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}
                                className="p-8 bg-black/40 hover:bg-white hover:text-black rounded-full text-white transition-all pointer-events-auto backdrop-blur-2xl border border-white/10 group active:scale-95"
                            >
                                <ChevronLeft className="w-12 h-12 transition-transform group-hover:-translate-x-1" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}
                                className="p-8 bg-black/40 hover:bg-white hover:text-black rounded-full text-white transition-all pointer-events-auto backdrop-blur-2xl border border-white/10 group active:scale-95"
                            >
                                <ChevronRight className="w-12 h-12 transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>

                        {/* Thumbnails */}
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 h-24 px-8 py-3 bg-zinc-950/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] z-[110] flex gap-3 items-center overflow-x-auto max-w-[95vw] shadow-2xl">
                            {(lightbox.activeType === 'standard' ? gallery.standard_photos : gallery.premium_photos).map((p, i) => (
                                <button
                                    key={p.id}
                                    onClick={() => setLightbox(i, lightbox.activeType)}
                                    className={`relative h-14 aspect-[3/2] rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${lightbox.activeIndex === i ? 'border-gold-500 scale-110 shadow-2xl -translate-y-1' : 'border-transparent opacity-30 hover:opacity-100 hover:scale-105'}`}
                                >
                                    <img src={p.thumbnail_url || p.file_url} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
