'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Download, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

interface PurchasedPhoto {
    id: number;
    thumbnail_url: string | null;
}

export default function OrderSuccessPage() {
    const params = useParams();
    const router = useRouter();
    const accessCode = params?.accessCode as string;
    const orderId = params?.orderId as string;

    const [status, setStatus] = useState<'loading' | 'pending' | 'paid' | 'failed'>('loading');
    const [photos, setPhotos] = useState<PurchasedPhoto[]>([]);

    useEffect(() => {
        if (accessCode && orderId) {
            checkStatus();
            // Poll every 3 seconds if pending
            const interval = setInterval(() => {
                if (status === 'pending' || status === 'loading') {
                    checkStatus();
                }
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [accessCode, orderId, status]);

    const checkStatus = async () => {
        try {
            const res = await fetch(`/api/galleries/${accessCode}/order/${orderId}`);
            const data = await res.json();

            if (data.success) {
                setStatus(data.order.status);
                if (data.order.status === 'paid') {
                    setPhotos(data.photos);
                }
            }
        } catch (error) {
            console.error('Error checking status:', error);
        }
    };

    const downloadPhoto = (photoId: number) => {
        // We need a new endpoint for downloading purchased premium photos
        // For now, we can reuse the download endpoint but we need to update it to check orders
        // Or we can create a temporary signed URL mechanism
        // Let's assume we update the download endpoint to check orders
        window.open(`/api/galleries/${accessCode}/download/${photoId}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
                {status === 'loading' || status === 'pending' ? (
                    <div className="py-12">
                        <Loader2 className="w-16 h-16 text-gold-400 animate-spin mx-auto mb-6" />
                        <h1 className="text-2xl font-bold mb-2">Weryfikacja płatności...</h1>
                        <p className="text-zinc-400">Proszę czekać, to może potrwać chwilę.</p>
                    </div>
                ) : status === 'paid' ? (
                    <div>
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-4">Dziękujemy za zakup!</h1>
                        <p className="text-zinc-400 mb-8">
                            Twoje zdjęcia są gotowe do pobrania. Wysłaliśmy również potwierdzenie na Twój email.
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                            {photos.map(photo => (
                                <div key={photo.id} className="relative group bg-zinc-800 rounded-lg overflow-hidden">
                                    <div className="aspect-square relative">
                                        <Image
                                            src={photo.thumbnail_url || '/placeholder.jpg'}
                                            alt="Photo"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <button
                                        onClick={() => downloadPhoto(photo.id)}
                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-semibold"
                                    >
                                        <Download className="w-5 h-5" />
                                        Pobierz
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => router.push(`/galeria/${accessCode}`)}
                            className="text-gold-400 hover:text-gold-300 font-semibold flex items-center justify-center gap-2 mx-auto"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Wróć do galerii
                        </button>
                    </div>
                ) : (
                    <div className="py-12">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Płatność nieudana</h1>
                        <p className="text-zinc-400 mb-8">
                            Wystąpił błąd podczas przetwarzania płatności. Spróbuj ponownie.
                        </p>
                        <button
                            onClick={() => router.push(`/galeria/${accessCode}`)}
                            className="bg-gold-400 hover:bg-gold-500 text-black font-bold py-3 px-8 rounded-lg transition-all"
                        >
                            Wróć do galerii
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
