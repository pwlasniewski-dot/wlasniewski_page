'use client';

import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2, GripVertical, Image as ImageIcon, Type, Layout, MoveUp, MoveDown } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import MediaPicker from './MediaPicker';

export type SectionType = 'hero_parallax' | 'rich_text' | 'image_text' | 'gallery';

export interface PageSection {
    id: string;
    type: SectionType;
    content?: string;
    image?: string;
    title?: string;
    subtitle?: string;
    layout?: 'left' | 'right'; // For image_text
    images?: string[]; // For gallery
}

interface PageBuilderProps {
    sections: PageSection[];
    onChange: (sections: PageSection[]) => void;
}

function SortableSection({ section, index, onRemove, onUpdate }: {
    section: PageSection;
    index: number;
    onRemove: (id: string) => void;
    onUpdate: (id: string, data: Partial<PageSection>) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [mediaPickerTarget, setMediaPickerTarget] = useState<'single' | 'gallery'>('single');

    const handleImageSelect = (url: string | string[]) => {
        if (mediaPickerTarget === 'single') {
            onUpdate(section.id, { image: Array.isArray(url) ? url[0] : url });
        } else {
            // Gallery
            const newImages = Array.isArray(url) ? url : [url];
            onUpdate(section.id, { images: [...(section.images || []), ...newImages] });
        }
    };

    return (
        <div ref={setNodeRef} style={style} className="bg-zinc-900 border border-zinc-800 rounded-lg mb-4 overflow-hidden">
            <div className="bg-zinc-800 p-2 flex items-center justify-between border-b border-zinc-700">
                <div className="flex items-center gap-2">
                    <button {...attributes} {...listeners} className="cursor-grab hover:text-white text-zinc-400">
                        <GripVertical className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium text-white uppercase tracking-wider">
                        {section.type.replace('_', ' ')}
                    </span>
                </div>
                <button onClick={() => onRemove(section.id)} className="text-zinc-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* HERO PARALLAX */}
                {section.type === 'hero_parallax' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Tytuł (H1)</label>
                            <input
                                type="text"
                                value={section.title || ''}
                                onChange={(e) => onUpdate(section.id, { title: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Zdjęcie tła</label>
                            <div className="flex items-center gap-4">
                                {section.image && (
                                    <img src={section.image} alt="Preview" className="h-20 w-32 object-cover rounded border border-zinc-700" />
                                )}
                                <button
                                    onClick={() => { setMediaPickerTarget('single'); setShowMediaPicker(true); }}
                                    className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-300 hover:text-white"
                                >
                                    Wybierz zdjęcie
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* RICH TEXT */}
                {section.type === 'rich_text' && (
                    <div>
                        <RichTextEditor
                            value={section.content || ''}
                            onChange={(val) => onUpdate(section.id, { content: val })}
                            placeholder="Wpisz treść..."
                        />
                    </div>
                )}

                {/* IMAGE & TEXT */}
                {section.type === 'image_text' && (
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-1/3">
                                <label className="block text-xs text-zinc-400 mb-1">Zdjęcie</label>
                                {section.image ? (
                                    <img src={section.image} alt="Preview" className="w-full aspect-video object-cover rounded border border-zinc-700 mb-2" />
                                ) : (
                                    <div className="w-full aspect-video bg-zinc-800 rounded border border-zinc-700 mb-2" />
                                )}
                                <button
                                    onClick={() => { setMediaPickerTarget('single'); setShowMediaPicker(true); }}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-300 hover:text-white"
                                >
                                    Wybierz zdjęcie
                                </button>
                            </div>
                            <div className="w-2/3 space-y-4">
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Układ</label>
                                    <select
                                        value={section.layout || 'left'}
                                        onChange={(e) => onUpdate(section.id, { layout: e.target.value as 'left' | 'right' })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                    >
                                        <option value="left">Zdjęcie po lewej</option>
                                        <option value="right">Zdjęcie po prawej</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Treść</label>
                                    <RichTextEditor
                                        value={section.content || ''}
                                        onChange={(val) => onUpdate(section.id, { content: val })}
                                        placeholder="Opis..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* GALLERY */}
                {section.type === 'gallery' && (
                    <div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {section.images?.map((img, idx) => (
                                <div key={idx} className="relative group w-24 h-24">
                                    <img src={img} alt="" className="w-full h-full object-cover rounded border border-zinc-700" />
                                    <button
                                        onClick={() => {
                                            const newImages = section.images?.filter((_, i) => i !== idx);
                                            onUpdate(section.id, { images: newImages });
                                        }}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => { setMediaPickerTarget('gallery'); setShowMediaPicker(true); }}
                                className="w-24 h-24 flex items-center justify-center border-2 border-dashed border-zinc-700 rounded hover:border-zinc-500 text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <MediaPicker
                isOpen={showMediaPicker}
                onClose={() => setShowMediaPicker(false)}
                onSelect={(urls: string | string[], id: number | number[]) => {
                    handleImageSelect(urls);
                    setShowMediaPicker(false);
                }}
                multiple={mediaPickerTarget === 'gallery'}
            />
        </div>
    );
}

export default function PageBuilder({ sections, onChange }: PageBuilderProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = sections.findIndex((s) => s.id === active.id);
            const newIndex = sections.findIndex((s) => s.id === over.id);
            onChange(arrayMove(sections, oldIndex, newIndex));
        }
    };

    const addSection = (type: SectionType) => {
        const newSection: PageSection = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            content: '',
            layout: 'left'
        };
        onChange([...sections, newSection]);
    };

    const updateSection = (id: string, data: Partial<PageSection>) => {
        onChange(sections.map(s => s.id === id ? { ...s, ...data } : s));
    };

    const removeSection = (id: string) => {
        onChange(sections.filter(s => s.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-2 flex-wrap">
                <button onClick={() => addSection('hero_parallax')} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm text-white transition-colors">
                    <ImageIcon className="w-4 h-4" /> Hero Parallax
                </button>
                <button onClick={() => addSection('rich_text')} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm text-white transition-colors">
                    <Type className="w-4 h-4" /> Tekst
                </button>
                <button onClick={() => addSection('image_text')} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm text-white transition-colors">
                    <Layout className="w-4 h-4" /> Tekst + Zdjęcie
                </button>
                <button onClick={() => addSection('gallery')} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm text-white transition-colors">
                    <ImageIcon className="w-4 h-4" /> Galeria
                </button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    {sections.map((section, index) => (
                        <SortableSection
                            key={section.id}
                            section={section}
                            index={index}
                            onRemove={removeSection}
                            onUpdate={updateSection}
                        />
                    ))}
                </SortableContext>
            </DndContext>

            {sections.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-lg text-zinc-500">
                    Dodaj pierwszą sekcję, aby rozpocząć budowanie strony.
                </div>
            )}
        </div>
    );
}
