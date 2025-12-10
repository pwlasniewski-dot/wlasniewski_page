'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Check, Search } from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';

interface MediaItem {
    id: number;
    file_name: string;
    file_path: string;
    width: number | null;
    height: number | null;
}

interface MediaPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string | string[], id: number | number[]) => void;
    multiple?: boolean;
}

export default function MediaPicker({ isOpen, onClose, onSelect, multiple = false }: MediaPickerProps) {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchMedia();
            setSelectedItems([]);
        }
    }, [isOpen]);

    const fetchMedia = async () => {
        setLoading(true);
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

    const getOrientationBadge = (width: number | null, height: number | null) => {
        if (!width || !height) return null;

        if (width > height) {
            return (
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded border border-white/10">
                    POZIOM
                </div>
            );
        } else if (height > width) {
            return (
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded border border-white/10">
                    PION
                </div>
            );
        } else {
            return (
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded border border-white/10">
                    KWADRAT
                </div>
            );
        }
    };

    const handleItemClick = (item: MediaItem) => {
        if (multiple) {
            setSelectedItems(prev => {
                const isSelected = prev.some(i => i.id === item.id);
                if (isSelected) {
                    return prev.filter(i => i.id !== item.id);
                } else {
                    return [...prev, item];
                }
            });
        } else {
            // Single selection mode - return immediate
            onSelect(item.file_path, item.id);
            onClose();
        }
    };

    const handleConfirmMultiple = () => {
        const urls = selectedItems.map(i => i.file_path);
        const ids = selectedItems.map(i => i.id);
        onSelect(urls, ids);
        onClose();
    };

    const filteredMedia = media.filter(item =>
        item.file_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col border border-zinc-800">
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white">Wybierz zdjęcie</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Szukaj zdjęć..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-gold-500 transition-colors"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="text-center text-zinc-400 py-8">Ładowanie biblioteki...</div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {filteredMedia.length === 0 ? (
                                <div className="col-span-full text-center py-12">
                                    <p className="text-zinc-400 mb-4">Brak zdjęć w bibliotece.</p>
                                    <a
                                        href="/admin/media"
                                        className="text-gold-500 hover:text-gold-400 underline"
                                        onClick={onClose}
                                    >
                                        Przejdź do Media Managera, aby wgrać zdjęcia
                                    </a>
                                </div>
                            ) : (
                                filteredMedia.map((item) => {
                                    const isSelected = selectedItems.some(i => i.id === item.id);
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleItemClick(item)}
                                            className={`group relative aspect-square bg-zinc-800 rounded-lg overflow-hidden border transition-all ${isSelected
                                                ? 'border-gold-500 ring-2 ring-gold-500 ring-offset-2 ring-offset-zinc-900'
                                                : 'border-zinc-700 hover:border-gold-500'
                                                }`}
                                        >
                                            <Image
                                                src={item.file_path}
                                                alt={item.file_name}
                                                fill
                                                className="object-cover"
                                            />
                                            <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-gold-500/20' : 'bg-black/0 group-hover:bg-black/20'}`} />

                                            {getOrientationBadge(item.width, item.height)}

                                            {isSelected && (
                                                <div className="absolute top-2 right-2 bg-gold-500 text-black rounded-full p-1">
                                                    <Check className="w-3 h-3" />
                                                </div>
                                            )}

                                            {/* Dimensions on hover */}
                                            <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/70 text-[10px] text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity text-center truncate">
                                                {item.width && item.height ? `${item.width} x ${item.height}` : ''}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

                {multiple && (
                    <div className="p-4 border-t border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                        <span className="text-zinc-400 text-sm">
                            Wybrano: {selectedItems.length}
                        </span>
                        <button
                            onClick={handleConfirmMultiple}
                            disabled={selectedItems.length === 0}
                            className="bg-gold-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Wybierz zaznaczone
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
