import React, { memo } from 'react';
import Image from 'next/image';
import { Check, Trash2 } from 'lucide-react';

interface MediaItem {
    id: number;
    file_name: string;
    file_path: string;
    mime_type: string;
    width: number | null;
    height: number | null;
    alt_text?: string;
    folder?: string;
}

interface MediaItemCardProps {
    item: MediaItem;
    isSelected: boolean;
    onToggle: (item: MediaItem) => void;
    onClick: (item: MediaItem) => void;
    onDelete?: (ids: number[]) => void;
    onDragStart: (e: React.DragEvent, item: MediaItem) => void;
    selectionMode: boolean; // Helps decide click behavior
}

const MediaItemCard = memo(({ item, isSelected, onToggle, onClick, onDelete, onDragStart, selectionMode }: MediaItemCardProps) => {

    const handleClick = (e: React.MouseEvent) => {
        // If selection mode is active, click always toggles selection
        // If DELETE button is clicked, it stops propagation anyway
        onClick(item);
    };

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, item)}
            onClick={handleClick}
            className={`group relative aspect-square rounded-lg overflow-hidden border cursor-pointer transition-all ${isSelected
                ? 'border-gold-500 ring-2 ring-gold-500 ring-offset-1 ring-offset-zinc-900'
                : 'border-zinc-800 hover:border-zinc-600'
                }`}
        >
            <Image
                src={item.file_path}
                alt={item.alt_text || item.file_name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                quality={60} // Optimization: Lower quality for thumbnails
            />
            {/* Selection Overlay */}
            <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-gold-500/20' : 'bg-black/0 group-hover:bg-black/10'}`} />

            {/* Checkbox (Visual) */}
            <div className={`absolute top-2 left-2 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-gold-500 border-gold-500 text-black' : 'bg-black/40 border-white/30 text-transparent group-hover:bg-black/60'}`}>
                <Check className="w-3.5 h-3.5" />
            </div>

            {/* Hover Actions (Delete) */}
            {onDelete && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete([item.id]); }}
                        className="p-1 bg-red-900/80 hover:bg-red-600 rounded text-white"
                        title="Usuń"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* Meta badges */}
            {item.folder && item.folder !== 'uploads' && (
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 backdrop-blur rounded text-[10px] text-zinc-300 truncate max-w-[80%]">
                    {item.folder}
                </div>
            )}
        </div>
    );
}, (prev, next) => {
    // Custom comparison for performance
    return (
        prev.isSelected === next.isSelected &&
        prev.item.id === next.item.id &&
        prev.selectionMode === next.selectionMode &&
        prev.item.file_path === next.item.file_path && // ensure updates reflect
        prev.item.folder === next.item.folder
    );
});

MediaItemCard.displayName = 'MediaItemCard';

export default MediaItemCard;
