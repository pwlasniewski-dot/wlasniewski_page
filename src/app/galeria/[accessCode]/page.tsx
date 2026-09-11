'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Download, ShoppingCart, Check, X, ArrowLeft, ArrowUpRight, Calendar, ImageIcon, Layers } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumGalleryHero, { PremiumGalleryStory } from '@/components/galleries/PremiumGalleryHero';
import PostGalleryUpsell, { TopReviewNudge } from '@/components/galleries/PostGalleryUpsell';
import { youtubeNoCookieEmbedUrl } from '@/lib/video/youtube';
import PhotoLightbox from '@/components/PhotoLightbox';
import { galleryLightboxSlides } from '@/lib/galleries/photo-lightbox-slides';
import GalleryGridImage from '@/components/galleries/GalleryGridImage';
import GalleryShoppingPanel from '@/components/galleries/GalleryShoppingPanel';

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
    gallery_mode: 'INDIVIDUAL' | 'GROUP';
    description: string | null;
    standard_count: number;
    price_per_premium: number;
    show_extra_photo_price_when_empty: boolean;
    external_download_url: string | null;
    expires_at: string | null;
    standard_photos: GalleryPhoto[];
    premium_photos: GalleryPhoto[];
    paid_photo_ids: number[];
    products: GalleryProduct[];
    event_video_url: string | null;
    event_video_title: string | null;
    event_video_description: string | null;
}

type DownloadProgressState = {
    status: 'checking' | 'queued' | 'processing' | 'ready' | 'downloading' | 'error';
    percent: number;
    completed: number;
    total: number;
    message: string;
};

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

    const [gallery, setGallery] = useState<Gallery | null>(null);
    const [loading, setLoading] = useState(true);
    const [accessError, setAccessError] = useState<string | null>(null);
    const [requiresSharePassword, setRequiresSharePassword] = useState(false);
    const [sharePassword, setSharePassword] = useState('');
    const [authorizingShare, setAuthorizingShare] = useState(false);
    const [selectedPremium, setSelectedPremium] = useState<Set<number>>(new Set());
    const checkoutIdempotencyKey = useRef<string | null>(null);
    const [selectedStandard, setSelectedStandard] = useState<Set<number>>(new Set());
    const [downloadingAll, setDownloadingAll] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState<DownloadProgressState | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'story'>('story');
    const [shopEnabled, setShopEnabled] = useState(false);

    // Advanced Lightbox State
    const [lightbox, _setLightbox] = useState({
        isOpen: false,
        activeIndex: 0,
        activeType: 'standard' as 'standard' | 'premium'
    });

    const setLightbox = (index: number, type: 'standard' | 'premium', open = true) => {
        _setLightbox({ isOpen: open, activeIndex: index, activeType: type });
    };

    // Stable slides avoid resetting an in-progress gesture when a selection changes.
    // Display optimized previews; explicit JPG HQ downloads keep their protected endpoint.
    const lightboxSlides = useMemo(() => {
        const list = lightbox.activeType === 'standard' ? gallery?.standard_photos : gallery?.premium_photos;
        return galleryLightboxSlides(list || [], lightbox.activeType, gallery?.paid_photo_ids || []);
    }, [gallery?.standard_photos, gallery?.premium_photos, gallery?.paid_photo_ids, lightbox.activeType]);
    const currentPhoto = lightbox.isOpen
        ? (lightbox.activeType === 'standard' ? gallery?.standard_photos[lightbox.activeIndex] : gallery?.premium_photos[lightbox.activeIndex])
        : null;
    const canSelectStandard = gallery?.gallery_mode === 'GROUP';

    useEffect(() => {
        if (accessCode) {
            fetchGallery();
        }
    }, [accessCode]);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
            setViewMode('story');
        }
    }, []);

    const fetchGallery = async (passwordOverride?: string) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
            const headers: HeadersInit = {};

            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const effectivePassword = (passwordOverride ?? sharePassword).trim();
            if (effectivePassword) {
                headers['x-gallery-password'] = effectivePassword;
            }

            const res = await fetch(`/api/galleries/${accessCode}`, { headers });
            const data = await res.json();

            if (data.success) {
                setGallery(data.gallery);
                setAccessError(null);
                setRequiresSharePassword(false);
            } else {
                setGallery(null);
                setAccessError(data.error || 'Brak dostępu do galerii');
                setRequiresSharePassword(data.code === 'PASSWORD_REQUIRED');
            }
        } catch (error) {
            console.error('Failed to fetch gallery');
            setGallery(null);
            setAccessError('Wystąpił błąd podczas ładowania galerii.');
        } finally {
            setLoading(false);
            setAuthorizingShare(false);
        }
    };

    const handleSharePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sharePassword.trim()) return;
        setAuthorizingShare(true);
        await fetchGallery(sharePassword.trim());
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
        checkoutIdempotencyKey.current = null;
        setSelectedPremium(newSelected);
    };

    const toggleStandard = (photoId: number) => {
        const next = new Set(selectedStandard);
        if (next.has(photoId)) {
            next.delete(photoId);
        } else {
            next.add(photoId);
        }
        setSelectedStandard(next);
    };

    const startBrowserDownload = (downloadUrl: string, fileName?: string) => {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName || `${gallery?.client_name || 'galeria'}-zdjecia.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const downloadAllFree = async () => {
        if (!gallery || downloadingAll) return;
        setDownloadingAll(true);
        setDownloadProgress({
            status: 'checking',
            percent: 2,
            completed: 0,
            total: gallery.standard_photos.length,
            message: 'Sprawdzamy, czy wszystkie zdjęcia JPG HQ są gotowe.',
        });
        try {
            const preflight = await fetch(`/api/galleries/${accessCode}/download-all?preflight=1`, {
                credentials: 'include',
                cache: 'no-store',
            });
            const readiness = await preflight.json().catch(() => null);
            if (!preflight.ok || !readiness?.ok) {
                throw new Error(readiness?.error || 'Galeria nie jest jeszcze gotowa do pobrania.');
            }
            setDownloadProgress({
                status: 'queued',
                percent: 6,
                completed: 0,
                total: Number(readiness.photoCount || gallery.standard_photos.length),
                message: 'Zdjęcia są gotowe. Uruchamiamy przygotowanie archiwum ZIP.',
            });
            const start = await fetch(`/api/galleries/${accessCode}/download-all`, {
                method: 'POST', credentials: 'include', cache: 'no-store',
            });
            const started = await start.json().catch(() => null);
            if (!start.ok || !started?.jobId) throw new Error(started?.error || 'Nie udało się uruchomić przygotowania ZIP.');
            setDownloadProgress((current) => current ? {
                ...current,
                status: 'queued',
                percent: Math.max(current.percent, 8),
                message: 'Zlecenie przyjęte. Serwer rozpoczyna pakowanie zdjęć.',
            } : current);
            let result: any = null;
            for (let attempt = 0; attempt < 180; attempt += 1) {
                const status = await fetch(`/api/galleries/${accessCode}/download-all?job_id=${encodeURIComponent(started.jobId)}`, {
                    credentials: 'include', cache: 'no-store',
                });
                result = await status.json().catch(() => null);
                if (!status.ok) throw new Error(result?.error || 'Nie udało się sprawdzić postępu ZIP.');
                const serverPercent = Number.isFinite(Number(result?.progress)) ? Number(result.progress) : 0;
                const completed = Number.isFinite(Number(result?.completed)) ? Number(result.completed) : 0;
                const total = Number.isFinite(Number(result?.total)) && Number(result.total) > 0
                    ? Number(result.total)
                    : Number(readiness.photoCount || gallery.standard_photos.length);
                setDownloadProgress({
                    status: result?.status === 'ready' ? 'ready' : result?.status === 'processing' ? 'processing' : 'queued',
                    percent: result?.status === 'ready' ? 100 : Math.max(8, Math.min(99, serverPercent)),
                    completed,
                    total,
                    message: result?.status === 'processing'
                        ? `Dodajemy zdjęcia JPG HQ do archiwum: ${completed} z ${total}.`
                        : result?.status === 'ready'
                            ? 'Archiwum jest gotowe. Przekazujemy plik do pobrania w przeglądarce.'
                            : 'Oczekiwanie na rozpoczęcie pakowania zdjęć.',
                });
                if (result.status === 'ready' && result.downloadUrl) break;
                if (result.status === 'failed') throw new Error(result.error || 'Nie udało się przygotować ZIP. Spróbuj ponownie.');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            if (!result?.downloadUrl) throw new Error('Przygotowanie trwa dłużej. Spróbuj ponownie za chwilę — gotowa paczka zostanie użyta ponownie.');
            startBrowserDownload(result.downloadUrl, result.fileName);
            setDownloadProgress({
                status: 'downloading',
                percent: 100,
                completed: Number(result.completed || readiness.photoCount || 0),
                total: Number(result.total || readiness.photoCount || 0),
                message: 'Pobieranie trwa w przeglądarce. Sprawdź prawy górny róg ekranu.',
            });
        } catch (error) {
            setDownloadProgress((current) => ({
                status: 'error',
                percent: current?.percent || 0,
                completed: current?.completed || 0,
                total: current?.total || gallery.standard_photos.length,
                message: error instanceof Error ? error.message : 'Wystąpił błąd podczas pobierania paczki ZIP.',
            }));
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
        checkoutIdempotencyKey.current = null;
        setSelectedProducts(newSelected);
    };

    const handleCheckout = async () => {
        if (selectedPremium.size === 0 && selectedProducts.size === 0) return;
        try {
            const idempotencyKey = checkoutIdempotencyKey.current || crypto.randomUUID();
            checkoutIdempotencyKey.current = idempotencyKey;
            const res = await fetch(`/api/galleries/${accessCode}/order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Idempotency-Key': idempotencyKey,
                },
                body: JSON.stringify({
                    photo_ids: Array.from(selectedPremium),
                    product_ids: Array.from(selectedProducts)
                })
            });
            const data = await res.json();
            if (data.success && data.alreadyPaid && data.order?.id) {
                window.location.href = `/galeria/${accessCode}/order/${data.order.id}/success`;
            } else if (data.success && data.paymentUrl) {
                window.location.href = data.paymentUrl;
            } else if (data.retryable) {
                checkoutIdempotencyKey.current = null;
                alert(data.error || 'Nie udało się uruchomić płatności. Spróbuj ponownie.');
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

    if (!gallery && requiresSharePassword) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
                <div className="w-full max-w-md bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
                    <h1 className="text-2xl font-black mb-2">Galeria chroniona hasłem</h1>
                    <p className="text-zinc-400 mb-6 text-sm">Ta galeria została udostępniona rodzinie przez właściciela. Podaj hasło dostępu.</p>
                    <form onSubmit={handleSharePasswordSubmit} className="space-y-4">
                        <input
                            type="password"
                            value={sharePassword}
                            onChange={(e) => setSharePassword(e.target.value)}
                            placeholder="Hasło galerii"
                            className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none"
                        />
                        {accessError && <p className="text-red-400 text-sm">{accessError}</p>}
                        <button
                            type="submit"
                            disabled={authorizingShare || !sharePassword.trim()}
                            className="w-full bg-gold-500 hover:bg-gold-400 text-black font-black uppercase tracking-wide py-3 rounded-xl disabled:opacity-60"
                        >
                            {authorizingShare ? 'Sprawdzanie...' : 'Wejdź do galerii'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (!gallery && accessError) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
                <div className="w-full max-w-lg bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6">
                    <h1 className="text-2xl font-black mb-2">Brak dostępu</h1>
                    <p className="text-zinc-300 mb-6">{accessError}</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link href="/logowanie" className="flex-1 text-center bg-gold-500 hover:bg-gold-400 text-black font-bold py-3 rounded-xl">
                            Zaloguj jako właściciel
                        </Link>
                        <Link href="/galeria/login" className="flex-1 text-center bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl border border-zinc-700">
                            Inna galeria
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!gallery) return null;

    const premiumTotal = selectedPremium.size * gallery.price_per_premium;
    const productsTotal = (gallery.products || []).filter(p => selectedProducts.has(p.id)).reduce((acc, p) => acc + p.price, 0);
    const totalPrice = premiumTotal + productsTotal;
    const eventVideoEmbedUrl = youtubeNoCookieEmbedUrl(gallery.event_video_url);

    return (
        <div className="min-h-screen bg-black text-white pb-40 selection:bg-gold-500/30 overflow-x-hidden">
            <div className="fixed top-4 left-4 z-[70] flex items-center gap-2">
                <Link
                    href="/konto"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-black/70 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white backdrop-blur hover:border-gold-400 hover:text-gold-300 transition"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Wróć do panelu
                </Link>
                <Link
                    href="/galeria/login"
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-300 backdrop-blur hover:border-zinc-500 hover:text-white transition"
                >
                    Zmień galerię
                </Link>
            </div>

            {/* HERO SLIDER — wow factor */}
            {(gallery.standard_photos.length + gallery.premium_photos.length) > 0 && (
                <PremiumGalleryHero
                    photos={(gallery.standard_photos.length ? gallery.standard_photos : gallery.premium_photos).map(p => ({
                        id: p.id,
                        file_url: p.file_url,
                        thumbnail_url: p.thumbnail_url,
                        width: p.width,
                        height: p.height,
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

            {(gallery.standard_photos.length + gallery.premium_photos.length) > 0 && (
                <TopReviewNudge
                    theme="dark"
                />
            )}

            <div className="max-w-7xl mx-auto py-12 px-4">
                <section className={`mb-10 grid grid-cols-1 ${gallery.premium_photos.length > 0 || gallery.show_extra_photo_price_when_empty ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`} aria-label="Podsumowanie galerii">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                        <p className="text-xs uppercase tracking-widest text-zinc-500">Zdjęcia w pakiecie</p>
                        <p className="mt-1 text-3xl font-black">{gallery.standard_photos.length}</p>
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                        <p className="text-xs uppercase tracking-widest text-zinc-500">Dodatkowe zdjęcia</p>
                        <p className="mt-1 text-3xl font-black">{gallery.premium_photos.length}</p>
                    </div>
                    {(gallery.premium_photos.length > 0 || gallery.show_extra_photo_price_when_empty) && (
                        <div className="rounded-2xl border border-gold-500/30 bg-gold-500/5 p-5">
                            <p className="text-xs uppercase tracking-widest text-zinc-500">Cena dodatkowego zdjęcia</p>
                            <p className="mt-1 text-3xl font-black text-gold-400">{(gallery.price_per_premium / 100).toFixed(2)} zł</p>
                        </div>
                    )}
                </section>
                <GalleryShoppingPanel
                    endpoint={`/api/galleries/${accessCode}/shop`}
                    headers={{ ...(typeof window !== 'undefined' && localStorage.getItem('user_token') ? { Authorization: `Bearer ${localStorage.getItem('user_token')}` } : {}), ...(sharePassword ? { 'x-gallery-password': sharePassword } : {}) }}
                    photos={[...gallery.standard_photos, ...gallery.premium_photos.filter(photo => gallery.paid_photo_ids.includes(photo.id))]}
                    onAvailabilityChange={setShopEnabled}
                />
                {/* Standard Photos Section */}
                {gallery.standard_photos.length > 0 && (
                    <div className="mb-24">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-zinc-900/40 px-4 py-6 md:px-10 md:py-10 rounded-[2rem] md:rounded-[3rem] border border-zinc-800 mb-12">
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Zdjęcia w Twoim pakiecie</h2>
                                <p className="text-zinc-500 font-medium">To są zdjęcia zawarte w Twoim pakiecie sesji.</p>
                                {gallery.expires_at && (
                                    <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-400 px-3 py-1.5 rounded-full text-xs font-bold uppercase mt-3 border border-red-500/20">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Galeria wygasa: {new Date(gallery.expires_at).toLocaleDateString('pl-PL')}
                                    </div>
                                )}
                            </div>
                            <div className="w-full lg:w-auto flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
                                <div className="inline-flex flex-wrap gap-2 p-1 bg-black/40 border border-zinc-800 rounded-xl w-fit">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gold-500 text-black' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z"/>
                                        </svg>
                                        Siatka
                                    </button>
                                    <button
                                        onClick={() => setViewMode('story')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'story' ? 'bg-gold-500 text-black' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        <Layers className="w-4 h-4" />
                                        Historia
                                    </button>
                                </div>
                                {gallery.external_download_url ? (
                                    <a
                                        href={gallery.external_download_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-12 md:h-16 px-6 md:px-10 bg-white text-black font-black uppercase tracking-widest text-[10px] md:text-xs rounded-2xl hover:bg-gold-500 transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-3 w-full sm:w-auto"
                                    >
                                        <Download className="w-5 h-5" />
                                        Pobierz całą galerię
                                    </a>
                                ) : (
                                    <button
                                        onClick={downloadAllFree}
                                        disabled={downloadingAll}
                                        className="h-12 md:h-16 px-6 md:px-10 bg-white text-black font-black uppercase tracking-widest text-[10px] md:text-xs rounded-2xl hover:bg-gold-500 transition-all shadow-xl shadow-white/5 disabled:opacity-50 flex items-center justify-center gap-3 w-full sm:w-auto"
                                    >
                                        <Download className="w-5 h-5" />
                                        {downloadingAll ? 'Przygotowujemy ZIP...' : 'Pobierz całą galerię'}
                                    </button>
                                )}
                                {viewMode === 'story' && (
                                    <div className="text-xs text-zinc-500 sm:ml-2">
                                        Tryb Historia: przewijaj pionowo. Otwórz podgląd, aby przesuwać kadry palcem.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* GRID MODE - Masonry Layout (portfolio style) */}
                        {viewMode === 'grid' ? (
                        <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-3 sm:space-y-4 p-0 sm:p-4">
                            {gallery.standard_photos.map((photo, idx) => (
                                <div key={photo.id} className="break-inside-avoid mb-3 sm:mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setLightbox(idx, 'standard')}
                                        className="group relative w-full text-left"
                                    >
                                        <figure className={`relative w-full overflow-hidden rounded-none sm:rounded-xl bg-zinc-900 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${selectedStandard.has(photo.id) ? 'ring-4 ring-gold-500/80' : ''}`}>
                                            <GalleryGridImage
                                                src={photo.file_url}
                                                alt={`Photo ${photo.id}`}
                                                width={photo.width}
                                                height={photo.height}
                                            />
                                            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
                                            {canSelectStandard && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        toggleStandard(photo.id);
                                                    }}
                                                    className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${selectedStandard.has(photo.id) ? 'bg-gold-500 text-black' : 'bg-black/75 text-white hover:bg-black/90'}`}
                                                    title={selectedStandard.has(photo.id) ? 'Odznacz do druku' : 'Zaznacz do druku'}
                                                >
                                                    {selectedStandard.has(photo.id) ? 'Odznacz' : 'Do druku'}
                                                </button>
                                            )}
                                        </figure>
                                    </button>
                                </div>
                            ))}
                        </div>
                        ) : (
                        <div className="overflow-x-hidden">
                            <PremiumGalleryStory
                                photos={gallery.standard_photos.map(p => ({
                                    id: p.id,
                                    file_url: p.file_url,
                                    thumbnail_url: p.thumbnail_url,
                                    width: p.width,
                                    height: p.height,
                                }))}
                                selectedPhotoIds={canSelectStandard ? selectedStandard : undefined}
                                onToggleSelect={canSelectStandard ? (p) => toggleStandard(p.id) : undefined}
                                onPhotoClick={(p) => {
                                    const idx = gallery.standard_photos.findIndex(ph => ph.id === p.id);
                                    if (idx !== -1) setLightbox(idx, 'standard');
                                }}
                            />
                        </div>
                        )}
                    </div>
                )}

                {!canSelectStandard && gallery.standard_photos.length > 0 && (
                    <div className="mb-12 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-400">
                        Ta galeria działa w trybie indywidualnym. Możesz pobierać zdjęcia i zamawiać dodatki, ale zaznaczanie do druku jest wyłączone.
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
                                                    {selected ? 'Usuń z zamówienia' : `Dodaj do zamówienia • ${(gallery.price_per_premium / 100).toFixed(2)} zł`}
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

                {eventVideoEmbedUrl && (
                    <section className="mt-24 border-t border-zinc-900 pt-16" aria-labelledby="event-video-title">
                        <div className="max-w-5xl mx-auto">
                            <h2 id="event-video-title" className="text-3xl md:text-4xl font-black text-center mb-4 uppercase tracking-tight">
                                {gallery.event_video_title || 'Film z Waszego wydarzenia'}
                            </h2>
                            {gallery.event_video_description && (
                                <p className="text-center text-zinc-400 mb-8 max-w-2xl mx-auto">{gallery.event_video_description}</p>
                            )}
                            <div className="aspect-video overflow-hidden rounded-2xl border border-zinc-800 bg-black shadow-2xl">
                                <iframe
                                    src={eventVideoEmbedUrl}
                                    title={gallery.event_video_title || 'Film z wydarzenia'}
                                    className="w-full h-full"
                                    loading="lazy"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    </section>
                )}

                {/* ALBUM SHOP - Display regardless of tab if products exist */}
                {(!shopEnabled && gallery.products && gallery.products.length > 0) && (
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

            {/* Sticky Selection Bar */}
            {(selectedStandard.size > 0 || selectedPremium.size > 0 || selectedProducts.size > 0) && (
                <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-3xl border-t border-gold-500/20 p-6 z-40">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-12">
                            {selectedStandard.size > 0 && (
                                <div className="flex items-center gap-4">
                                    <Check className="w-5 h-5 text-green-500" />
                                    <div>
                                        <div className="text-[10px] font-black uppercase text-zinc-500">Bezpłatne zdjęcia</div>
                                        <div className="text-2xl font-black text-white">{selectedStandard.size}</div>
                                    </div>
                                </div>
                            )}
                            {(selectedPremium.size > 0 || selectedProducts.size > 0) && (
                                <div className="flex items-center gap-4">
                                    <Check className="w-5 h-5 text-gold-500" />
                                    <div>
                                        <div className="text-[10px] font-black uppercase text-zinc-500">Dodatkowe zdjęcia</div>
                                        <div className="text-2xl font-black text-gold-500">{selectedPremium.size} × {(gallery.price_per_premium / 100).toFixed(2)} zł</div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-8">
                            <div className="text-right">
                                <div className="text-[10px] font-black uppercase text-zinc-500">Do zapłaty</div>
                                <div className="text-4xl font-black text-gold-500">{(totalPrice / 100).toFixed(2)} zł</div>
                            </div>
                            {(selectedPremium.size > 0 || selectedProducts.size > 0) && (
                                <button
                                    onClick={handleCheckout}
                                    className="h-16 px-12 bg-gold-500 hover:bg-gold-400 text-black font-black uppercase tracking-widest text-sm rounded-2xl transition-all flex items-center gap-3 shadow-2xl shadow-gold-500/30"
                                >
                                    <ShoppingCart className="w-5 h-5" /> Przejdź do płatności
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* UPSELL + PROŚBA O OPINIĘ — boost SEO */}
            {(gallery.standard_photos.length + gallery.premium_photos.length) > 0 && (
                <PostGalleryUpsell
                    clientName={gallery.client_name}
                    theme="dark"
                />
            )}

            <AnimatePresence>
                {downloadProgress && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[400] flex items-center justify-center bg-black/85 px-4 backdrop-blur-md"
                    >
                        {downloadProgress.status === 'downloading' && (
                            <motion.div
                                initial={{ opacity: 0, x: -16, y: 16 }}
                                animate={{ opacity: 1, x: [0, 8, 0], y: [0, -8, 0] }}
                                transition={{ opacity: { duration: 0.25 }, x: { duration: 1.2, repeat: Infinity }, y: { duration: 1.2, repeat: Infinity } }}
                                className="pointer-events-none fixed right-4 top-4 flex items-center gap-2 rounded-2xl border border-gold-500/40 bg-zinc-950/95 px-4 py-3 text-right shadow-2xl shadow-black/70 md:right-8 md:top-6"
                            >
                                <span className="max-w-[180px] text-xs font-black uppercase leading-tight tracking-wide text-white md:text-sm">
                                    Tutaj sprawdź pobieranie
                                </span>
                                <ArrowUpRight className="h-9 w-9 shrink-0 text-gold-500 md:h-12 md:w-12" strokeWidth={2.5} />
                            </motion.div>
                        )}
                        <motion.div
                            initial={{ opacity: 0, y: 18, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 18, scale: 0.97 }}
                            className="w-full max-w-md rounded-3xl border border-zinc-700 bg-zinc-950 p-7 text-center shadow-2xl"
                        >
                            <div className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 ${downloadProgress.status === 'error' ? 'border-red-500 text-red-400' : 'border-gold-500 text-gold-500'}`}>
                                {downloadProgress.status === 'downloading' ? (
                                    <span className="text-5xl font-black" aria-label="ZIP gotowy">✓</span>
                                ) : downloadProgress.status === 'error' ? (
                                    <span className="text-4xl font-black" aria-label="Błąd">!</span>
                                ) : (
                                    <span className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-gold-500" aria-label="Przygotowywanie ZIP" />
                                )}
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                                {downloadProgress.status === 'error'
                                    ? 'Nie udało się przygotować pliku'
                                    : downloadProgress.status === 'downloading'
                                        ? 'ZIP gotowy'
                                        : downloadProgress.status === 'ready'
                                            ? 'Galeria gotowa'
                                            : 'Przygotowujemy galerię'}
                            </h2>
                            <p className={`mt-3 text-sm leading-relaxed ${downloadProgress.status === 'error' ? 'text-red-300' : 'text-zinc-300'}`}>
                                {downloadProgress.message}
                            </p>
                            {downloadProgress.total > 0 && downloadProgress.status !== 'error' && downloadProgress.status !== 'downloading' && (
                                <p className="mt-3 text-xs font-bold text-zinc-500">
                                    Przetworzono {downloadProgress.completed} z {downloadProgress.total} zdjęć
                                </p>
                            )}
                            <div className="mt-6 rounded-2xl border border-gold-500/20 bg-gold-500/5 px-4 py-3 text-left text-xs leading-relaxed text-zinc-400">
                                {downloadProgress.status === 'downloading'
                                    ? <>Poczekaj na zakończenie pobierania. Potem otwórz plik ZIP i wybierz „Wyodrębnij” lub „Rozpakuj”.</>
                                    : <>Otrzymasz jeden plik <strong className="text-white">ZIP</strong> ze zdjęciami JPG. Po pobraniu otwórz folder „Pobrane” i wybierz „Wyodrębnij” lub „Rozpakuj”. Nie zamykaj tej strony podczas przygotowywania pliku.</>}
                            </div>
                            {(downloadProgress.status === 'error' || downloadProgress.status === 'downloading') && (
                                <button
                                    type="button"
                                    onClick={() => setDownloadProgress(null)}
                                    className={`${downloadProgress.status === 'downloading' ? 'mt-6 border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800' : 'mt-6 bg-white text-black hover:bg-gold-500'} w-full rounded-xl px-5 py-3 text-sm font-black uppercase tracking-wider`}
                                >
                                    {downloadProgress.status === 'downloading' ? 'Zamknij komunikat' : 'Zamknij'}
                                </button>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <PhotoLightbox
                open={lightbox.isOpen}
                index={lightbox.activeIndex}
                slides={lightboxSlides}
                onClose={() => _setLightbox((previous) => ({ ...previous, isOpen: false }))}
                onView={(index) => _setLightbox((previous) => previous.activeIndex === index ? previous : { ...previous, activeIndex: index })}
                actions={currentPhoto && (
                    <>
                        {lightboxSlides[lightbox.activeIndex]?.previewOnly && (
                            <span className="photo-viewer__status">
                                {lightboxSlides[lightbox.activeIndex]?.previewUnavailable
                                    ? 'Podgląd tego zdjęcia nie jest jeszcze dostępny'
                                    : 'Podgląd przed zakupem'}
                            </span>
                        )}
                        {lightbox.activeType === 'premium' && !isPaid(currentPhoto.id) ? (
                            <button
                                type="button"
                                aria-pressed={selectedPremium.has(currentPhoto.id)}
                                onClick={() => togglePremium(currentPhoto.id)}
                            >
                                <ShoppingCart aria-hidden="true" />
                                {selectedPremium.has(currentPhoto.id) ? 'Usuń z zamówienia' : `Dodaj • ${(gallery.price_per_premium / 100).toFixed(2)} zł`}
                            </button>
                        ) : (
                            <>
                                {lightbox.activeType === 'standard' && canSelectStandard && (
                                    <button
                                        type="button"
                                        aria-pressed={selectedStandard.has(currentPhoto.id)}
                                        onClick={() => toggleStandard(currentPhoto.id)}
                                    >
                                        <Check aria-hidden="true" />
                                        {selectedStandard.has(currentPhoto.id) ? 'Odznacz do druku' : 'Zaznacz do druku'}
                                    </button>
                                )}
                                <button type="button" onClick={() => downloadPhoto(currentPhoto.id)}>
                                    <Download aria-hidden="true" /> Pobierz JPG
                                </button>
                            </>
                        )}
                    </>
                )}
            />
        </div>
    );
}
