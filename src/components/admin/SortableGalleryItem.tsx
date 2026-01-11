import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Star, X } from 'lucide-react';

interface SortableGalleryItemProps {
    id: number; // This is the unique identifier for DnD (using media ID)
    url: string;
    isHighlighted: boolean;
    onToggleHighlight: () => void;
    onRemove: () => void;
}

export function SortableGalleryItem({ id, url, isHighlighted, onToggleHighlight, onRemove }: SortableGalleryItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="relative aspect-square rounded-md overflow-hidden border border-zinc-700 group cursor-move touch-none"
        >
            <img src={url} alt="Gallery item" className="h-full w-full object-cover pointer-events-none" />

            <div className="absolute top-1 right-1 flex gap-1 bg-black/40 rounded p-1 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                // Stop propagation to prevent drag start when clicking buttons
                onPointerDown={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onToggleHighlight}
                    className={`p-1 rounded-full ${isHighlighted ? 'bg-gold-500 text-black' : 'bg-black/50 text-gold-500 hover:bg-black/70'}`}
                    title={isHighlighted ? "Usuń z wyróżnionych" : "Wyróżnij w sliderze"}
                >
                    <Star className="w-3 h-3" fill={isHighlighted ? "currentColor" : "none"} />
                </button>
                <button
                    type="button"
                    onClick={onRemove}
                    className="bg-red-500 text-white rounded-full p-1"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>

            {isHighlighted && (
                <div className="absolute bottom-1 right-1 pointer-events-none">
                    <Star className="w-3 h-3 text-gold-500 drop-shadow-md" fill="currentColor" />
                </div>
            )}
        </div>
    );
}
