'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Upload, Trash2, Search, Filter } from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';
import toast from 'react-hot-toast';

interface MediaItem {
    id: number;
    file_name: string;
    file_path: string;
    mime_type: string;
}

export default function MediaPage() {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchMedia = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl('media'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setMedia(data.media);
            }
        } catch (error) {
            console.error('Failed to fetch media', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedia();
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const files = Array.from(e.target.files);
        let successCount = 0;
        let errorCount = 0;

        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const token = localStorage.getItem('admin_token');
                const res = await fetch(getApiUrl('media/upload'), {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData,
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    successCount++;
                } else {
                    console.error('Upload failed:', data.error || 'Unknown error');
                    errorCount++;
                }
            } catch (error) {
                console.error('Upload error', error);
                errorCount++;
            }
        }

        if (successCount > 0) {
            toast.success(`Wgrano ${successCount} zdjęć`);
            fetchMedia(); // Refresh list
        }
        if (errorCount > 0) {
            toast.error(`Błąd przy ${errorCount} zdjęciach`);
        }

        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const deleteMedia = async (id: number) => {
        if (!confirm('Czy na pewno chcesz usunąć to zdjęcie?')) return;

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl(`media/${id}`), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                toast.success('Usunięto zdjęcie');
                fetchMedia();
            } else {
                toast.error('Błąd usuwania');
            }
        } catch (error) {
            toast.error('Wystąpił błąd');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-display font-semibold text-white">Biblioteka Mediów</h1>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleUpload}
                        className="hidden"
                        accept="image/*"
                        multiple
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-gold-500 hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
                    >
                        <Upload className="-ml-1 mr-2 h-5 w-5" />
                        {uploading ? 'Wgrywanie...' : 'Wgraj zdjęcie'}
                    </button>
                </div>
            </div>

            {/* Filters (Placeholder) */}
            <div className="mb-6 flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-zinc-500" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-zinc-700 rounded-md leading-5 bg-zinc-900 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:bg-zinc-800 focus:border-gold-500 focus:ring-gold-500 sm:text-sm"
                        placeholder="Szukaj plików..."
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-zinc-400">Ładowanie...</div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {media.map((item) => (
                        <div key={item.id} className="group relative aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-gold-500/50 transition-colors">
                            <Image
                                src={item.file_path}
                                alt={item.file_name}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    onClick={() => deleteMedia(item.id)}
                                    className="p-2 bg-red-600 rounded-full text-white hover:bg-red-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
