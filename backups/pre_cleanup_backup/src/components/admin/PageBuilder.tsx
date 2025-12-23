'use client';

import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2, GripVertical, Image as ImageIcon, Type, Layout, MoveUp, MoveDown } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import MediaPicker from './MediaPicker';

export type SectionType = 'hero_parallax' | 'hero' | 'rich_text' | 'image_text' | 'gallery' | 'contact' | 'thermal_slider';

export interface ThermalSectionData {
    id: string;
    category: string;
    visualImage: string;
    thermalImage: string;
    labelLeft?: string;
    labelRight?: string;
}

export interface PageSection {
    id: string;
    type: SectionType;
    content?: string;
    image?: string;
    thermalImage?: string; // For thermal_slider (single)
    thermalSections?: ThermalSectionData[]; // For thermal_slider (multiple)
    title?: string;
    subtitle?: string;
    layout?: 'left' | 'right'; // For image_text
    images?: string[]; // For gallery
    tag?: string; // For hero
    buttonText?: string; // For contact/hero
    buttonLink?: string; // For contact/hero
    labelLeft?: string; // For thermal_slider
    labelRight?: string; // For thermal_slider
    showCategoryTitle?: boolean; // For thermal_slider - show title above sections
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
    const [mediaPickerContext, setMediaPickerContext] = useState<'visual' | 'thermal' | null>(null);
    const [sectionEditIndex, setSectionEditIndex] = useState(-1);

    const handleImageSelect = (url: string | string[]) => {
        const imageUrl = Array.isArray(url) ? url[0] : url;

        if (section.type === 'thermal_slider') {
            if (sectionEditIndex >= 0) {
                // Editing thermal section in array
                const updated = [...(section.thermalSections || [])];
                if (mediaPickerContext === 'visual') {
                    updated[sectionEditIndex] = { ...updated[sectionEditIndex], visualImage: imageUrl };
                } else if (mediaPickerContext === 'thermal') {
                    updated[sectionEditIndex] = { ...updated[sectionEditIndex], thermalImage: imageUrl };
                }
                onUpdate(section.id, { thermalSections: updated });
            } else {
                // Fallback single image
                if (mediaPickerContext === 'visual') {
                    onUpdate(section.id, { image: imageUrl });
                } else if (mediaPickerContext === 'thermal') {
                    onUpdate(section.id, { thermalImage: imageUrl });
                }
            }
        } else if (mediaPickerTarget === 'single') {
            onUpdate(section.id, { image: imageUrl });
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
                {/* HERO */}
                {section.type === 'hero' && (
                    <div className="space-y-4">
                        {/* Background Image */}
                        <div>
                            <label className="block text-xs text-zinc-400 mb-2">Zdjęcie tła</label>
                            <div className="flex gap-3">
                                {section.image && (
                                    <div className="relative w-24 h-24 rounded border border-zinc-700 overflow-hidden bg-zinc-800">
                                        <img src={section.image} alt="" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => onUpdate(section.id, { image: '' })}
                                            className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-400" />
                                        </button>
                                    </div>
                                )}
                                <button
                                    onClick={() => { setMediaPickerTarget('single'); setShowMediaPicker(true); }}
                                    className="flex-1 flex items-center justify-center border-2 border-dashed border-zinc-700 rounded hover:border-zinc-500 text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
                                >
                                    <ImageIcon className="w-4 h-4 inline mr-2" />
                                    {section.image ? 'Zmień' : 'Wybierz zdjęcie'}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Tytuł</label>
                                <input
                                    type="text"
                                    value={section.title || ''}
                                    onChange={(e) => onUpdate(section.id, { title: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Podtytuł</label>
                                <input
                                    type="text"
                                    value={section.subtitle || ''}
                                    onChange={(e) => onUpdate(section.id, { subtitle: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Tag (mały napis nad tytułem)</label>
                            <input
                                type="text"
                                value={section.tag || ''}
                                onChange={(e) => onUpdate(section.id, { tag: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                placeholder="np. fotograf toruń"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Tekst przycisku</label>
                                <input
                                    type="text"
                                    value={section.buttonText || ''}
                                    onChange={(e) => onUpdate(section.id, { buttonText: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Link przycisku</label>
                                <input
                                    type="text"
                                    value={section.buttonLink || ''}
                                    onChange={(e) => onUpdate(section.id, { buttonLink: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* CONTACT / CTA */}
                {section.type === 'contact' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Tytuł sekcji</label>
                                <input
                                    type="text"
                                    value={section.title || ''}
                                    onChange={(e) => onUpdate(section.id, { title: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Podtytuł</label>
                                <input
                                    type="text"
                                    value={section.subtitle || ''}
                                    onChange={(e) => onUpdate(section.id, { subtitle: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Tekst przycisku</label>
                                <input
                                    type="text"
                                    value={section.buttonText || ''}
                                    onChange={(e) => onUpdate(section.id, { buttonText: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Link przycisku</label>
                                <input
                                    type="text"
                                    value={section.buttonLink || ''}
                                    onChange={(e) => onUpdate(section.id, { buttonLink: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* THERMAL SLIDER */}
                {section.type === 'thermal_slider' && (
                    <div className="space-y-6">
                        {/* Basic Settings */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-2 font-bold uppercase tracking-tight">Tytuł Sekcji</label>
                                <input
                                    type="text"
                                    placeholder="Np. Galeria Badań Termowizyjnych"
                                    value={section.title || ''}
                                    onChange={(e) => onUpdate(section.id, { title: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-2 font-bold uppercase tracking-tight">Pokaż Tytuł w Sliderze</label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={section.showCategoryTitle || false}
                                        onChange={(e) => onUpdate(section.id, { showCategoryTitle: e.target.checked })}
                                        className="w-4 h-4 rounded border-zinc-600 text-yellow-500"
                                    />
                                    <span className="text-sm text-zinc-300">Wyświetl nagłówek i kategorię w komponencie</span>
                                </label>
                            </div>
                        </div>

                        {/* Thermal Sections Manager */}
                        <div className="border-t border-zinc-700 pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Kategorie Termowizji</h4>
                                <button
                                    onClick={() => {
                                        const newSection: ThermalSectionData = {
                                            id: Math.random().toString(36).substr(2, 9),
                                            category: 'Nowa Kategoria',
                                            visualImage: '',
                                            thermalImage: '',
                                            labelLeft: 'Widok Standardowy',
                                            labelRight: 'Termowizja'
                                        };
                                        onUpdate(section.id, {
                                            thermalSections: [...(section.thermalSections || []), newSection]
                                        });
                                    }}
                                    className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold rounded hover:bg-yellow-500/30 transition-all flex items-center gap-1"
                                >
                                    <Plus size={14} /> Dodaj kategorię
                                </button>
                            </div>

                            {section.thermalSections && section.thermalSections.length > 0 ? (
                                <div className="space-y-6">
                                    {section.thermalSections.map((ts, tsIndex) => (
                                        <div key={ts.id} className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 space-y-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <input
                                                    type="text"
                                                    value={ts.category}
                                                    onChange={(e) => {
                                                        const updated = [...(section.thermalSections || [])];
                                                        updated[tsIndex] = { ...ts, category: e.target.value };
                                                        onUpdate(section.id, { thermalSections: updated });
                                                    }}
                                                    className="flex-1 bg-zinc-700 border border-zinc-600 rounded px-3 py-1.5 text-sm text-white font-medium"
                                                    placeholder="Nazwa kategorii"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const updated = section.thermalSections!.filter((_, i) => i !== tsIndex);
                                                        onUpdate(section.id, { thermalSections: updated });
                                                    }}
                                                    className="ml-2 p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Visual Image */}
                                                <div>
                                                    <label className="text-xs text-zinc-400 mb-1.5 block font-bold">Widok Standardowy</label>
                                                    {ts.visualImage ? (
                                                        <img src={ts.visualImage} alt="Visual" className="w-full aspect-video object-cover rounded mb-2 border border-zinc-600" />
                                                    ) : (
                                                        <div className="w-full aspect-video bg-zinc-700 rounded border-2 border-dashed border-zinc-600 flex items-center justify-center text-zinc-500 text-xs mb-2">
                                                            Brak zdjęcia
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => { setMediaPickerTarget('single'); setMediaPickerContext('visual'); setSectionEditIndex(tsIndex); setShowMediaPicker(true); }}
                                                        className="w-full px-3 py-1.5 bg-zinc-700 border border-zinc-600 rounded text-xs font-medium text-zinc-300 hover:bg-zinc-600 transition-all"
                                                    >
                                                        Wybierz zdjęcie
                                                    </button>
                                                </div>

                                                {/* Thermal Image */}
                                                <div>
                                                    <label className="text-xs text-zinc-400 mb-1.5 block font-bold">Widok Termowizyjny</label>
                                                    {ts.thermalImage ? (
                                                        <img src={ts.thermalImage} alt="Thermal" className="w-full aspect-video object-cover rounded mb-2 border border-zinc-600" />
                                                    ) : (
                                                        <div className="w-full aspect-video bg-zinc-700 rounded border-2 border-dashed border-zinc-600 flex items-center justify-center text-zinc-500 text-xs mb-2">
                                                            Brak zdjęcia
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => { setMediaPickerTarget('single'); setMediaPickerContext('thermal'); setSectionEditIndex(tsIndex); setShowMediaPicker(true); }}
                                                        className="w-full px-3 py-1.5 bg-zinc-700 border border-zinc-600 rounded text-xs font-medium text-zinc-300 hover:bg-zinc-600 transition-all"
                                                    >
                                                        Wybierz zdjęcie
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <input
                                                    type="text"
                                                    value={ts.labelLeft || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(section.thermalSections || [])];
                                                        updated[tsIndex] = { ...ts, labelLeft: e.target.value };
                                                        onUpdate(section.id, { thermalSections: updated });
                                                    }}
                                                    placeholder="Etykieta lewej strony"
                                                    className="bg-zinc-700 border border-zinc-600 rounded px-3 py-1.5 text-xs text-white"
                                                />
                                                <input
                                                    type="text"
                                                    value={ts.labelRight || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(section.thermalSections || [])];
                                                        updated[tsIndex] = { ...ts, labelRight: e.target.value };
                                                        onUpdate(section.id, { thermalSections: updated });
                                                    }}
                                                    placeholder="Etykieta prawej strony"
                                                    className="bg-zinc-700 border border-zinc-600 rounded px-3 py-1.5 text-xs text-white"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 border-2 border-dashed border-zinc-700 rounded-lg">
                                    <p className="text-zinc-500 text-sm">Dodaj pierwszą kategorię termowizji</p>
                                </div>
                            )}
                        </div>

                        {/* Single Section Fallback */}
                        <div className="border-t border-zinc-700 pt-6">
                            <h4 className="text-xs text-zinc-400 mb-4 font-bold uppercase">Fallback dla pojedynczej sekcji</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-zinc-400 mb-2 block font-bold">Zdjęcie Standardowe</label>
                                    {section.image ? (
                                        <img src={section.image} alt="Visual" className="w-full aspect-video object-cover rounded mb-2 border border-zinc-700" />
                                    ) : (
                                        <div className="w-full aspect-video bg-zinc-800 rounded border-2 border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 text-xs mb-2">
                                            Brak zdjęcia
                                        </div>
                                    )}
                                    <button
                                        onClick={() => { setMediaPickerTarget('single'); setMediaPickerContext('visual'); setSectionEditIndex(-1); setShowMediaPicker(true); }}
                                        className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-all"
                                    >
                                        Wybierz zdjęcie
                                    </button>
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-400 mb-2 block font-bold">Zdjęcie Termowizyjne</label>
                                    {section.thermalImage ? (
                                        <img src={section.thermalImage} alt="Thermal" className="w-full aspect-video object-cover rounded mb-2 border border-zinc-700" />
                                    ) : (
                                        <div className="w-full aspect-video bg-zinc-800 rounded border-2 border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 text-xs mb-2">
                                            Brak zdjęcia
                                        </div>
                                    )}
                                    <button
                                        onClick={() => { setMediaPickerTarget('single'); setMediaPickerContext('thermal'); setSectionEditIndex(-1); setShowMediaPicker(true); }}
                                        className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-all"
                                    >
                                        Wybierz zdjęcie
                                    </button>
                                </div>
                            </div>
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
                <button onClick={() => addSection('hero')} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm text-white transition-colors">
                    <Layout className="w-4 h-4" /> Prosty Hero
                </button>
                <button onClick={() => addSection('contact')} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm text-white transition-colors">
                    <MoveUp className="w-4 h-4" /> CTA / Kontakt
                </button>
                <button onClick={() => addSection('thermal_slider')} className="flex items-center gap-2 px-4 py-2 bg-gold-600/20 hover:bg-gold-600/30 border border-gold-500/30 rounded text-sm text-gold-400 transition-colors">
                    <Layout className="w-4 h-4" /> Thermal Slider
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
