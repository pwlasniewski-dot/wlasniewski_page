'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api-config';
import { Upload, Trash2, Check, X, Eye, Calendar, Link as LinkIcon, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

interface GalleryPhoto {
    id: number;
    file_url: string;
    thumbnail_url: string | null;
    file_size: number;
    width: number | null;
    height: number | null;
    is_standard: boolean;
    order_index: number;
}

interface Gallery {
    id: number;
    client_name: string;
    client_email: string;
    access_code: string;
    standard_count: number;
    price_per_premium: number;
    is_active: boolean;
    created_at: string;
    expires_at: string | null;
    photos: GalleryPhoto[];
}

export default function GalleryDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const galleryId = params?.id as string;

    const [gallery, setGallery] = useState<Gallery | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [skipOptimization, setSkipOptimization] = useState(false);

    useEffect(() => {
        if (galleryId) {
            fetchGallery();
        }
    }, [galleryId]);

    const fetchGallery = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl(`admin/galleries/${galleryId}`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setGallery(data.gallery);
            }
        } catch (error) {
            console.error('Failed to fetch gallery');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (files: FileList, isStandard: boolean) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append('photos', file);
        });
        formData.append('is_standard', isStandard.toString());
        formData.append('skip_optimization', skipOptimization.toString());

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl(`admin/galleries/${galleryId}/upload`), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            const data = await res.json();
            if (data.success) {
                setUploadProgress(100);
                setTimeout(() => {
                    fetchGallery();
                    setUploading(false);
                    setUploadProgress(0);
                }, 500);
            } else {
                alert('Błąd uploadu: ' + data.error);
                setUploading(false);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Nie udało się wgrać zdjęć');
            setUploading(false);
        }
    };

    // ... (keep middle code same)

    const deletePhoto = async (photoId: number) => {
        console.log('Delete requested for:', photoId);
        if (!confirm('Czy na pewno chcesz usunąć to zdjęcie?')) return;

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(
                getApiUrl(`admin/galleries/${galleryId}/photos/${photoId}`),
                {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                }
            );

            if (res.ok) {
                console.log('Delete success');
                fetchGallery();
            } else {
                console.error('Delete failed', await res.text());
            }
        } catch (error) {
            console.error('Failed to delete photo', error);
        }
    };

    const togglePhotoType = async (photoId: number, isStandard: boolean) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl(`admin/galleries/${galleryId}/photos/${photoId}`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_standard: !isStandard }),
            });

            if (res.ok) {
                fetchGallery();
            }
        } catch (error) {
            console.error('Failed to toggle photo type', error);
        }
    };

    if (loading) return <div className="p-8 text-center text-zinc-400">Ładowanie galerii...</div>;
    if (!gallery) return <div className="p-8 text-center text-red-500">Nie znaleziono galerii</div>;

    const standardPhotos = gallery.photos.filter(p => p.is_standard);
    const premiumPhotos = gallery.photos.filter(p => !p.is_standard);

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{gallery.client_name}</h1>
                        <div className="text-zinc-400 text-sm mt-1">
                            Kod: <span className="text-gold-500 font-mono">{gallery.access_code}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <a
                        href={`/strefa-klienta/${gallery.access_code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors border border-zinc-700"
                    >
                        <Eye className="w-4 h-4" />
                        Podgląd
                    </a>
                </div>
            </div>

            {/* Upload Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">📤 Upload zdjęć</h2>
                    <label className="flex items-center gap-2 cursor-pointer bg-zinc-800 px-3 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500 transition-colors">
                        <input
                            type="checkbox"
                            checked={skipOptimization}
                            onChange={(e) => setSkipOptimization(e.target.checked)}
                            className="rounded border-zinc-600 bg-zinc-700 text-gold-500 focus:ring-gold-500"
                        />
                        <span className="text-sm text-zinc-300">Zachowaj pełną jakość (bez WebP)</span>
                    </label>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    {/* Standard Upload */}
                    <label className="bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-xl p-8 hover:border-green-500 transition-colors cursor-pointer group">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => e.target.files && handleFileUpload(e.target.files, true)}
                            className="hidden"
                            disabled={uploading}
                        />
                        <div className="text-center">
                            <Upload className="w-12 h-12 text-green-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                            <div className="text-white font-semibold mb-2">Zdjęcia STANDARD</div>
                            <div className="text-sm text-zinc-500">Kliknij lub przeciągnij pliki</div>
                            {skipOptimization && <div className="text-xs text-gold-500 mt-2 font-medium">Brak kompresji</div>}
                        </div>
                    </label>

                    {/* Premium Upload */}
                    <label className="bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-xl p-8 hover:border-gold-500 transition-colors cursor-pointer group">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => e.target.files && handleFileUpload(e.target.files, false)}
                            className="hidden"
                            disabled={uploading}
                        />
                        <div className="text-center">
                            <Upload className="w-12 h-12 text-gold-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                            <div className="text-white font-semibold mb-2">Zdjęcia PREMIUM</div>
                            <div className="text-sm text-zinc-500">Kliknij lub przeciągnij pliki</div>
                            {skipOptimization && <div className="text-xs text-gold-500 mt-2 font-medium">Brak kompresji</div>}
                        </div>
                    </label>
                </div>

                {uploading && (
                    <div className="mt-4 bg-zinc-900 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-zinc-400">Uploading...</span>
                            <span className="text-sm text-white">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2">
                            <div
                                className="bg-gold-400 h-2 rounded-full transition-all"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Photos Grid - Standard */}
            {standardPhotos.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="text-green-400">✓</span> Zdjęcia STANDARD ({standardPhotos.length})
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {standardPhotos.map(photo => (
                            <PhotoCard
                                key={photo.id}
                                photo={photo}
                                onToggleType={() => togglePhotoType(photo.id, photo.is_standard)}
                                onDelete={() => deletePhoto(photo.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Photos Grid - Premium */}
            {premiumPhotos.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="text-gold-400">★</span> Zdjęcia PREMIUM ({premiumPhotos.length})
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {premiumPhotos.map(photo => (
                            <PhotoCard
                                key={photo.id}
                                photo={photo}
                                onToggleType={() => togglePhotoType(photo.id, photo.is_standard)}
                                onDelete={() => deletePhoto(photo.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {gallery.photos.length === 0 && (
                <div className="text-center py-12 text-zinc-500">
                    Brak zdjęć. Wgraj pierwsze zdjęcia używając sekcji upload powyżej.
                </div>
            )}
        </div>
    );
}

function PhotoCard({
    photo,
    onToggleType,
    onDelete,
}: {
    photo: GalleryPhoto;
    onToggleType: () => void;
    onDelete: () => void;
}) {
    return (
        <div className="group relative bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-700">
            <div className="aspect-square relative">
                <Image
                    src={photo.thumbnail_url || photo.file_url}
                    alt={`Photo ${photo.id}`}
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleType();
                        }}
                        className={`p-2 rounded-lg ${photo.is_standard
                            ? 'bg-gold-500 hover:bg-gold-600'
                            : 'bg-green-500 hover:bg-green-600'
                            } text-white`}
                        title={photo.is_standard ? 'Zmień na Premium' : 'Zmień na Standard'}
                    >
                        {photo.is_standard ? '★' : '✓'}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white"
                        title="Usuń"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold ${photo.is_standard
                ? 'bg-green-500 text-white'
                : 'bg-gold-500 text-black'
                }`}>
                {photo.is_standard ? 'STANDARD' : 'PREMIUM'}
            </div>
        </div>
    );
}
