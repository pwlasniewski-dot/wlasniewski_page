'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Trash2, Upload, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface HistoryPhoto {
    id: string;
    url: string;
    filename: string;
    createdAt: string;
}

export default function HistoryAdminPage() {
    const [photos, setPhotos] = useState<HistoryPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const fetchPhotos = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/history', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setPhotos(data.photos);
            } else {
                toast.error('Błąd pobierania zdjęć');
            }
        } catch (e) {
            toast.error('Błąd połączenia');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPhotos();
    }, []);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        setUploading(true);
        let successCount = 0;
        let failCount = 0;

        const token = localStorage.getItem('admin_token');

        // Sequential or parallel upload?
        // Parallel in chunks of 3 to avoid overwhelming logic
        const uploadFile = async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await fetch('/api/admin/history/upload', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                if (res.ok) return true;
            } catch (e) { }
            return false;
        };

        // Simple loop for progress clarity
        for (let i = 0; i < acceptedFiles.length; i++) {
            const file = acceptedFiles[i];
            const isSuccess = await uploadFile(file);
            if (isSuccess) successCount++;
            else failCount++;

            setUploadProgress(Math.round(((i + 1) / acceptedFiles.length) * 100));
        }

        toast.success(`Wgrano ${successCount} z ${acceptedFiles.length} zdjęć.`);
        if (failCount > 0) toast.error(`${failCount} błędów.`);

        setUploading(false);
        setUploadProgress(0);
        fetchPhotos();
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        disabled: uploading
    });

    const handleDelete = async (id: string) => {
        if (!confirm('Na pewno usunąć to zdjęcie?')) return;

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/history?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Usunięto');
                setPhotos(prev => prev.filter(p => p.id !== id));
            } else {
                toast.error('Błąd usuwania');
            }
        } catch (e) {
            toast.error('Błąd połączenia');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white font-display">Galeria Historii</h1>
                <button onClick={fetchPhotos} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 text-white">
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors mb-10 ${isDragActive ? 'border-gold-500 bg-gold-500/10' : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/50'
                    } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <input {...getInputProps()} />
                {uploading ? (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-10 h-10 text-gold-500 animate-spin mb-4" />
                        <p className="text-zinc-300">Wgrywanie zdjęć... {uploadProgress}%</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <Upload className="w-12 h-12 text-zinc-400 mb-4" />
                        <p className="text-xl font-medium text-zinc-300 mb-2">Przeciągnij zdjęcia tutaj</p>
                        <p className="text-sm text-zinc-500">lub kliknij, aby wybrać z dysku (obsługa wielu plików)</p>
                    </div>
                )}
            </div>

            {/* Gallery */}
            <div className="mb-4 text-zinc-400">
                Zdjęcia są sortowane alfabetycznie po nazwie pliku. Liczba zdjęć: {photos.length}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {photos.map((photo) => (
                    <div key={photo.id} className="relative group aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
                        <Image
                            src={photo.url}
                            alt={photo.filename}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 20vw"
                        />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                            <span className="text-xs text-white truncate w-full" title={photo.filename}>
                                {photo.filename}
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                                className="self-end p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500 hover:text-white transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {!loading && photos.length === 0 && (
                <div className="text-center py-20 bg-zinc-900 rounded-lg border border-zinc-800 text-zinc-500">
                    Brak zdjęć w galerii historii. Wgraj pierwsze zdjęcia powyżej.
                </div>
            )}
        </div>
    );
}
