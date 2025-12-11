'use client';

import { useState, useEffect } from 'react';
import { Upload, Trash2, ChevronLeft, Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Photo {
    id: number;
    image_url: string;
    caption: string;
    alt_text: string;
}

interface Gallery {
    id: number;
    challenge_id: number;
    title: string;
    couple_names: string;
    testimonial: string;
    is_published: boolean;
    photos: Photo[];
}

export default function GalleryAdminPage({ params }: { params: { challenge_id: string } }) {
    const [gallery, setGallery] = useState<Gallery | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [editingGallery, setEditingGallery] = useState(false);
    const [galleryData, setGalleryData] = useState({
        title: '',
        couple_names: '',
        testimonial: '',
        is_published: false
    });

    useEffect(() => {
        fetchGallery();
    }, []);

    const fetchGallery = async () => {
        try {
            const res = await fetch(`/api/photo-challenge/gallery/admin/${params.challenge_id}`);
            const data = await res.json();
            if (data.success) {
                setGallery(data.gallery);
                setGalleryData({
                    title: data.gallery.title || '',
                    couple_names: data.gallery.couple_names || '',
                    testimonial: data.gallery.testimonial || '',
                    is_published: data.gallery.is_published || false
                });
            }
        } catch (error) {
            console.error('Failed to fetch gallery');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setUploading(true);
        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('caption', file.name.replace(/\.[^/.]+$/, ''));
                formData.append('alt_text', file.name);

                const res = await fetch(`/api/photo-challenge/gallery/${params.challenge_id}/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (!res.ok) {
                    throw new Error('Upload failed');
                }
            }
            fetchGallery();
        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleDeletePhoto = async (photoId: number) => {
        if (!confirm('Usunąć zdjęcie?')) return;

        try {
            const res = await fetch(`/api/photo-challenge/gallery/${params.challenge_id}/photos/${photoId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchGallery();
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleSaveGallery = async () => {
        try {
            const res = await fetch(`/api/photo-challenge/gallery/admin/${params.challenge_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(galleryData)
            });

            if (res.ok) {
                setEditingGallery(false);
                fetchGallery();
            }
        } catch (error) {
            console.error('Save error:', error);
        }
    };

    if (loading) return <div className="text-zinc-400">Ładowanie...</div>;
    if (!gallery) return <div className="text-red-400">Nie znaleziono galerii</div>;

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/challenges/dashboard" className="p-2 hover:bg-zinc-800 rounded-lg">
                    <ChevronLeft className="text-gold-400" />
                </Link>
                <div>
                    <h1 className="text-3xl font-display font-bold text-white">🖼️ Galeria</h1>
                    <p className="text-zinc-400">Zarządzaj zdjęciami z sesji</p>
                </div>
            </div>

            {/* Gallery Info */}
            {editingGallery ? (
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 mb-8">
                    <h2 className="text-xl font-bold text-white mb-4">Edytuj informacje galerii</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Tytuł</label>
                            <input
                                type="text"
                                value={galleryData.title}
                                onChange={(e) => setGalleryData({ ...galleryData, title: e.target.value })}
                                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-gold-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Imiona pary</label>
                            <input
                                type="text"
                                value={galleryData.couple_names}
                                onChange={(e) => setGalleryData({ ...galleryData, couple_names: e.target.value })}
                                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-gold-500"
                                placeholder="np. Ania & Paweł"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Testimonial</label>
                            <textarea
                                value={galleryData.testimonial}
                                onChange={(e) => setGalleryData({ ...galleryData, testimonial: e.target.value })}
                                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-gold-500 resize-none"
                                rows={3}
                                placeholder="Opinia pary o sesji..."
                            />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={galleryData.is_published}
                                onChange={(e) => setGalleryData({ ...galleryData, is_published: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <span className="text-zinc-300">Opublikuj galerię</span>
                        </label>

                        <div className="flex gap-4">
                            <button
                                onClick={handleSaveGallery}
                                className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-black font-bold rounded-lg transition-colors"
                            >
                                Zapisz
                            </button>
                            <button
                                onClick={() => setEditingGallery(false)}
                                className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-lg transition-colors"
                            >
                                Anuluj
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 mb-8">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">{gallery.title}</h2>
                            <p className="text-zinc-400 mb-2">
                                <strong>Para:</strong> {gallery.couple_names}
                            </p>
                            {gallery.testimonial && (
                                <p className="text-zinc-400 italic mb-2">
                                    <strong>Opinia:</strong> "{gallery.testimonial}"
                                </p>
                            )}
                            <div className="flex gap-2 mt-4">
                                {gallery.is_published ? (
                                    <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
                                        ✅ Opublikowana
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-red-600/20 text-red-400 rounded-full text-sm">
                                        ❌ Niepublikowana
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => setEditingGallery(true)}
                            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                        >
                            Edytuj
                        </button>
                    </div>
                </div>
            )}

            {/* Photo Upload */}
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-8 mb-8 text-center cursor-pointer hover:border-gold-500 transition-colors">
                <label className="cursor-pointer">
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        disabled={uploading}
                        className="hidden"
                    />
                    <div className="flex flex-col items-center gap-3">
                        <Upload className={`w-12 h-12 ${uploading ? 'text-zinc-500' : 'text-gold-400'}`} />
                        <div>
                            <p className="text-white font-semibold">
                                {uploading ? 'Uploading...' : 'Kliknij lub przeciągnij zdjęcia'}
                            </p>
                            <p className="text-zinc-400 text-sm">PNG, JPG, WebP do 10MB</p>
                        </div>
                    </div>
                </label>
            </div>

            {/* Photos Grid */}
            <div>
                <h3 className="text-xl font-bold text-white mb-4">
                    Zdjęcia ({gallery.photos.length})
                </h3>

                {gallery.photos.length > 0 ? (
                    <div className="grid md:grid-cols-3 gap-4">
                        {gallery.photos.map(photo => (
                            <div key={photo.id} className="bg-zinc-800/50 border border-zinc-700 rounded-lg overflow-hidden group hover:border-gold-500 transition-colors">
                                <div className="relative w-full aspect-square">
                                    <Image
                                        src={photo.image_url}
                                        alt={photo.alt_text}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Link
                                            href={photo.image_url}
                                            target="_blank"
                                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                                        >
                                            <Eye size={20} />
                                        </Link>
                                        <button
                                            onClick={() => handleDeletePhoto(photo.id)}
                                            className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <p className="text-sm text-zinc-400 line-clamp-2">{photo.caption}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-zinc-500">
                        <p>Brak zdjęć. Zacznij uploadowaniem!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
