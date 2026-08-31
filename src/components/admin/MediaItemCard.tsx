import React, { memo } from 'react';
import Image from 'next/image';
import { Check, Trash2, PlayCircle, FileVideo, FileText, Eye, Box } from 'lucide-react';

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
    onPreview: (item: MediaItem) => void;
    onDelete?: (ids: number[]) => void;
    onDragStart: (e: React.DragEvent, item: MediaItem) => void;
    selectionMode: boolean;
}

const MediaItemCard = memo(({ item, isSelected, onToggle, onClick, onPreview, onDelete, onDragStart, selectionMode }: MediaItemCardProps) => {
    const handleClick = (e: React.MouseEvent) => {
        onClick(item);
    };

    const isVideo = item.mime_type?.startsWith('video/');
    const isPDF = item.mime_type === 'application/pdf';
    const isImage = item.mime_type?.startsWith('image/');
    const isModel = item.mime_type?.startsWith('model/') || /\.(glb|gltf|obj|stl|fbx)$/i.test(item.file_name || item.file_path);

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
            {isVideo ? (
                <div className="w-full h-full bg-zinc-800 flex flex-col items-center justify-center gap-2">
                    <div className="relative w-full h-full flex items-center justify-center group-hover:bg-black/20 transition-colors">
                        <FileVideo className="w-12 h-12 text-zinc-600 group-hover:text-gold-500/50 transition-colors" />
                        <PlayCircle className="absolute w-8 h-8 text-white/40 group-hover:text-gold-500 transition-all scale-90 group-hover:scale-110" />
                    </div>
                    <div className="absolute top-0 right-0 p-1">
                        <span className="px-1.5 py-0.5 bg-black/60 rounded text-[8px] font-bold text-gold-500 uppercase tracking-tighter">VIDEO</span>
                    </div>
                </div>
            ) : isPDF ? (
                <div className="w-full h-full bg-zinc-800 flex flex-col items-center justify-center gap-2">
                    <div className="relative w-full h-full flex items-center justify-center group-hover:bg-black/20 transition-colors">
                        <FileText className="w-12 h-12 text-red-500/50 group-hover:text-red-500 transition-colors" />
                    </div>
                    <div className="absolute top-0 right-0 p-1">
                        <span className="px-1.5 py-0.5 bg-red-600 rounded text-[8px] font-bold text-white uppercase tracking-tighter shadow-lg">PDF</span>
                    </div>
                    <div className="absolute bottom-1 left-2 right-2 truncate text-[9px] text-zinc-500 font-medium">
                        {item.file_name}
                    </div>
                </div>
            ) : isImage ? (
                <Image
                    src={item.file_path}
                    alt={item.alt_text || item.file_name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    quality={60}
                />
            ) : (
                <div className="w-full h-full bg-zinc-800 flex flex-col items-center justify-center gap-2 px-3 text-center">
                    {isModel ? (
                        <Box className="w-12 h-12 text-sky-400/70 group-hover:text-sky-300 transition-colors" />
                    ) : (
                        <FileText className="w-12 h-12 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                    )}
                    <span className="text-[9px] text-zinc-400 break-all line-clamp-2">{item.file_name}</span>
                    <div className="absolute top-0 right-0 p-1">
                        <span className="px-1.5 py-0.5 bg-black/60 rounded text-[8px] font-bold text-zinc-200 uppercase tracking-tighter">
                            {isModel ? '3D' : 'PLIK'}
                        </span>
                    </div>
                </div>
            )}

            <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-gold-500/20' : 'bg-black/0 group-hover:bg-black/10'}`} />

            <div className={`absolute top-2 left-2 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-gold-500 border-gold-500 text-black' : 'bg-black/40 border-white/30 text-transparent group-hover:bg-black/60'}`}>
                <Check className="w-3.5 h-3.5" />
            </div>

            <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); onPreview(item); }}
                    className="p-2 sm:p-1.5 bg-black/75 hover:bg-gold-500 hover:text-black rounded-md text-white"
                    title="Podgląd"
                    aria-label={`Podgląd: ${item.alt_text || item.file_name}`}
                >
                    <Eye className="w-4 h-4" />
                </button>
                {onDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete([item.id]); }}
                        className="p-2 sm:p-1.5 bg-red-900/85 hover:bg-red-600 rounded-md text-white"
                        title="Usuń"
                        aria-label={`Usuń: ${item.alt_text || item.file_name}`}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {item.folder && item.folder !== 'uploads' && (
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 backdrop-blur rounded text-[10px] text-zinc-300 truncate max-w-[80%]">
                    {item.folder}
                </div>
            )}
        </div>
    );
}, (prev, next) => {
    return (
        prev.isSelected === next.isSelected &&
        prev.item.id === next.item.id &&
        prev.selectionMode === next.selectionMode &&
        prev.item.file_path === next.item.file_path &&
        prev.item.folder === next.item.folder &&
        prev.item.mime_type === next.item.mime_type
    );
});

MediaItemCard.displayName = 'MediaItemCard';

export default MediaItemCard;
