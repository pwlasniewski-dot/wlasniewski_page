'use client';

import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Plus, Trash2, GripVertical, Image as ImageIcon, Type, Layout,
    MoveUp, MoveDown, ShieldCheck, Stars, BarChart3, Award, Workflow,
    Briefcase, FileText, Zap, Building2, Maximize2, Thermometer, Cpu, Crosshair,
    Camera, Droplets, Map, Search, HardHat
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import MediaPicker from './MediaPicker';

export type SectionType = 'hero_parallax' | 'hero' | 'rich_text' | 'image_text' | 'gallery' | 'contact' | 'thermal_slider' | 'contact_form' | 'hero_slider' | 'about' | 'features' | 'parallax' | 'info_band' | 'testimonials' | 'challenge_banner' | 'creative_slider' | 'certificates' | 'b2b_hero' | 'b2b_stats' | 'b2b_logos' | 'b2b_process' | 'b2b_cases' | 'b2b_contact';

export interface SliderSlide {
    id: string;
    title?: string;
    subtitle?: string;
    buttonText?: string;
    buttonLink?: string;
    image: string;
}

export interface ThermalSectionData {
    id: string;
    category: string;
    visualImage: string;
    thermalImage: string;
    description?: string;
    labelLeft?: string;
    labelRight?: string;
}

export interface CertificateItem {
    id: string;
    title: string;
    subtitle?: string;
    image?: string;
    icon?: string;
    description?: string;
}

export interface B2BStat {
    id: string;
    value: string;
    label: string;
    prefix?: string;
    suffix?: string;
}

export interface B2BLogo {
    id: string;
    image: string;
    name?: string;
}

export interface B2BProcessStep {
    id: string;
    title: string;
    description: string;
    stepNumber: string;
}

export interface B2BCaseStudy {
    id: string;
    title: string;
    client: string;
    description: string;
    image: string;
    link?: string;
    category?: string;
}

export interface InfoBandItem {
    id: string;
    title: string;
    description: string;
    icon?: string;
    image?: string;
    link?: string;
}

export interface FeatureItem {
    id: string; // Unique ID
    title: string;
    items: string[];
    enabled: boolean;
    buttonText?: string;
    buttonLink?: string;
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
    description?: string; // For hero (long text)
    layout?: 'left' | 'right'; // For image_text
    images?: string[]; // For gallery
    tag?: string; // For hero / b2b titles
    buttonText?: string; // For contact/hero
    buttonLink?: string; // For contact/hero
    labelRight?: string; // For thermal_slider
    showCategoryTitle?: boolean; // For thermal_slider - show title above sections
    slides?: SliderSlide[]; // For hero_slider
    features?: FeatureItem[]; // For features
    certificates?: CertificateItem[]; // For certificates
    featureTitle?: string; // For B2B process box
    featureContent?: string; // For B2B process box
    b2b_stats?: B2BStat[];
    b2b_logos?: B2BLogo[];
    b2b_process?: B2BProcessStep[];
    b2b_cases?: B2BCaseStudy[];
    sectionLayout?: 'grid' | 'centered' | 'full'; // Layout options
    featureSize?: 'normal' | 'large'; // Feature size options
    certificateSize?: 'small' | 'medium' | 'large' | 'readable'; // Certificate size options
    infoband_items?: InfoBandItem[];
    data?: any; // For legacy / homepage sections
}

interface PageBuilderProps {
    sections: PageSection[];
    onChange: (sections: PageSection[]) => void;
}

function SortableSection({ section, index, onRemove, onUpdate, onMove, openMediaPicker }: {
    section: PageSection;
    index: number;
    onRemove: (id: string) => void;
    onUpdate: (id: string, data: Partial<PageSection>) => void;
    onMove: (id: string, direction: 'up' | 'down') => void;
    openMediaPicker: (sectionId: string, options: { target: 'single' | 'gallery', context?: 'visual' | 'thermal', index?: number }) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

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
                    <div className="flex items-center gap-1 border-l border-zinc-700 ml-4 pl-4">
                        <button
                            onClick={(e) => { e.preventDefault(); onMove(section.id, 'up'); }}
                            className="p-1 hover:text-yellow-500 text-zinc-400 transition-colors"
                            title="Przesuń w górę"
                        >
                            <MoveUp className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); onMove(section.id, 'down'); }}
                            className="p-1 hover:text-yellow-500 text-zinc-400 transition-colors"
                            title="Przesuń w dół"
                        >
                            <MoveDown className="w-4 h-4" />
                        </button>
                    </div>
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
                                    onClick={() => { openMediaPicker(section.id, { target: 'single' }); }}
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
                                    onClick={() => { openMediaPicker(section.id, { target: 'single' }); }}
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
                                onClick={() => { openMediaPicker(section.id, { target: 'gallery' }); }}
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
                                    onClick={() => { openMediaPicker(section.id, { target: 'single' }); }}
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
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Opis (Treść podtytułu)</label>
                            <textarea
                                value={section.description || ''}
                                onChange={(e) => onUpdate(section.id, { description: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white h-24"
                                placeholder="Dłuższy opis sekcji..."
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
                                            description: '',
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
                                                        onClick={() => { openMediaPicker(section.id, { target: 'single', context: 'visual', index: tsIndex }); }}
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
                                                        onClick={() => { openMediaPicker(section.id, { target: 'single', context: 'thermal', index: tsIndex }); }}
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
                                            <div>
                                                <textarea
                                                    value={ts.description || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(section.thermalSections || [])];
                                                        updated[tsIndex] = { ...ts, description: e.target.value };
                                                        onUpdate(section.id, { thermalSections: updated });
                                                    }}
                                                    placeholder="Opis / Podtytuł kategorii..."
                                                    className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-1.5 text-xs text-white h-16"
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
                                        onClick={() => { openMediaPicker(section.id, { target: 'single', context: 'visual' }); }}
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
                                        onClick={() => { openMediaPicker(section.id, { target: 'single', context: 'thermal' }); }}
                                        className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-all"
                                    >
                                        Wybierz zdjęcie
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* HERO SLIDER */}
                {section.type === 'hero_slider' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Slajdy Hero</h4>
                            <button
                                onClick={() => {
                                    const newSlide: SliderSlide = {
                                        id: Math.random().toString(36).substr(2, 9),
                                        image: '',
                                        title: '',
                                        subtitle: '',
                                        buttonText: '',
                                        buttonLink: ''
                                    };
                                    onUpdate(section.id, {
                                        slides: [...(section.slides || []), newSlide]
                                    });
                                }}
                                className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold rounded hover:bg-yellow-500/30 transition-all flex items-center gap-1"
                            >
                                <Plus size={14} /> Dodaj slajd
                            </button>
                        </div>

                        {section.slides && section.slides.length > 0 ? (
                            <div className="space-y-4">
                                {section.slides.map((slide, sIndex) => (
                                    <div key={slide.id} className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 space-y-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="w-24 h-24 relative rounded border border-zinc-600 overflow-hidden bg-zinc-900 shrink-0">
                                                {slide.image ? (
                                                    <img src={slide.image} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                                        <ImageIcon size={24} />
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => { openMediaPicker(section.id, { target: 'single', index: sIndex }); }}
                                                    className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
                                                >
                                                    <span className="text-[10px] text-white font-bold uppercase">Zmień</span>
                                                </button>
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input
                                                        type="text"
                                                        value={slide.title || ''}
                                                        onChange={(e) => {
                                                            const updated = [...(section.slides || [])];
                                                            updated[sIndex] = { ...slide, title: e.target.value };
                                                            onUpdate(section.id, { slides: updated });
                                                        }}
                                                        placeholder="Tytuł slajdu"
                                                        className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-sm text-white"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={slide.subtitle || ''}
                                                        onChange={(e) => {
                                                            const updated = [...(section.slides || [])];
                                                            updated[sIndex] = { ...slide, subtitle: e.target.value };
                                                            onUpdate(section.id, { slides: updated });
                                                        }}
                                                        placeholder="Podtytuł slajdu"
                                                        className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-sm text-white"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input
                                                        type="text"
                                                        value={slide.buttonText || ''}
                                                        onChange={(e) => {
                                                            const updated = [...(section.slides || [])];
                                                            updated[sIndex] = { ...slide, buttonText: e.target.value };
                                                            onUpdate(section.id, { slides: updated });
                                                        }}
                                                        placeholder="Tekst przycisku"
                                                        className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-sm text-white"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={slide.buttonLink || ''}
                                                        onChange={(e) => {
                                                            const updated = [...(section.slides || [])];
                                                            updated[sIndex] = { ...slide, buttonLink: e.target.value };
                                                            onUpdate(section.id, { slides: updated });
                                                        }}
                                                        placeholder="Link przycisku"
                                                        className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-sm text-white"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const updated = section.slides!.filter((_, i) => i !== sIndex);
                                                    onUpdate(section.id, { slides: updated });
                                                }}
                                                className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 border-2 border-dashed border-zinc-800 rounded-lg">
                                <p className="text-zinc-600 text-sm">Brak slajdów. Dodaj przynajmniej jeden.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* FEATURES (KAFELKI) */}
                {section.type === 'features' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Układ</label>
                                <select
                                    value={section.sectionLayout || 'grid'}
                                    onChange={(e) => onUpdate(section.id, { sectionLayout: e.target.value as any })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                >
                                    <option value="grid">Siatka (Standard)</option>
                                    <option value="centered">Wyśrodkowany</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Rozmiar</label>
                                <select
                                    value={section.featureSize || 'normal'}
                                    onChange={(e) => onUpdate(section.id, { featureSize: e.target.value as any })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                >
                                    <option value="normal">Normalny</option>
                                    <option value="large">Duży (Premium)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Kafelki</h4>
                            <button
                                onClick={() => {
                                    const newFeature: FeatureItem = {
                                        id: Math.random().toString(36).substr(2, 9),
                                        title: 'Nowy Kafelek',
                                        items: ['Cecha 1'],
                                        enabled: true,
                                        buttonText: '',
                                        buttonLink: ''
                                    };
                                    onUpdate(section.id, {
                                        features: [...(section.features || []), newFeature]
                                    });
                                }}
                                className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold rounded hover:bg-green-500/30 transition-all flex items-center gap-1"
                            >
                                <Plus size={14} /> Dodaj kafelkę
                            </button>
                        </div>

                        <div className="space-y-4">
                            {(section.features || []).map((feature, fIndex) => (
                                <div key={feature.id || fIndex} className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1 mr-4">
                                            <input
                                                type="text"
                                                value={feature.title}
                                                onChange={(e) => {
                                                    const updated = [...(section.features || [])];
                                                    updated[fIndex] = { ...feature, title: e.target.value };
                                                    onUpdate(section.id, { features: updated });
                                                }}
                                                className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-white font-bold"
                                                placeholder="Tytuł kafelka"
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                const updated = section.features!.filter((_, i) => i !== fIndex);
                                                onUpdate(section.id, { features: updated });
                                            }}
                                            className="text-zinc-500 hover:text-red-500"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs text-zinc-500 mb-1">Cechy (oddziel przecinkami)</label>
                                            <textarea
                                                value={feature.items.join(', ')}
                                                onChange={(e) => {
                                                    const updated = [...(section.features || [])];
                                                    updated[fIndex] = { ...feature, items: e.target.value.split(',').map(s => s.trim()).filter(Boolean) };
                                                    onUpdate(section.id, { features: updated });
                                                }}
                                                className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-sm text-white h-20"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-700/50">
                                            <div>
                                                <label className="block text-xs text-zinc-400 mb-1">Tekst przycisku</label>
                                                <input
                                                    type="text"
                                                    value={feature.buttonText || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(section.features || [])];
                                                        updated[fIndex] = { ...feature, buttonText: e.target.value };
                                                        onUpdate(section.id, { features: updated });
                                                    }}
                                                    placeholder="np. Oferta dla firm"
                                                    className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-1.5 text-sm text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-zinc-400 mb-1">Link</label>
                                                <input
                                                    type="text"
                                                    value={feature.buttonLink || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(section.features || [])];
                                                        updated[fIndex] = { ...feature, buttonLink: e.target.value };
                                                        onUpdate(section.id, { features: updated });
                                                    }}
                                                    placeholder="np. /oferta-b2b"
                                                    className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-1.5 text-sm text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* CERTIFICATES */}
                {section.type === 'certificates' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Układ / Rozmiar</label>
                                <select
                                    value={section.certificateSize || 'medium'}
                                    onChange={(e) => onUpdate(section.id, { certificateSize: e.target.value as any })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                >
                                    <option value="small">Mały (Kompaktowy)</option>
                                    <option value="medium">Średni (Standard)</option>
                                    <option value="large">Duży (Widoczny)</option>
                                    <option value="readable">Bardzo Duży (Czytelny bez klikania)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Certyfikaty i Uprawnienia</h4>
                            <button
                                onClick={() => {
                                    const newCert: CertificateItem = {
                                        id: Math.random().toString(36).substr(2, 9),
                                        title: 'NSTS-01',
                                        subtitle: 'Certyfikat ULC',
                                        image: '',
                                        description: ''
                                    };
                                    onUpdate(section.id, {
                                        certificates: [...(section.certificates || []), newCert]
                                    });
                                }}
                                className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold rounded hover:bg-yellow-500/30 transition-all flex items-center gap-1"
                            >
                                <Plus size={14} /> Dodaj certyfikat
                            </button>
                        </div>

                        {section.certificates && section.certificates.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {section.certificates.map((cert, cIndex) => (
                                    <div key={cert.id} className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 relative rounded border border-zinc-600 overflow-hidden bg-zinc-900 shrink-0">
                                                {cert.image ? (
                                                    <img src={cert.image} alt="" className="w-full h-full object-contain" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                                        <ImageIcon size={20} />
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => { openMediaPicker(section.id, { target: 'single', index: cIndex }); }}
                                                    className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
                                                >
                                                    <span className="text-[10px] text-white font-bold uppercase">Zmień</span>
                                                </button>
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    type="text"
                                                    value={cert.title || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(section.certificates || [])];
                                                        updated[cIndex] = { ...cert, title: e.target.value };
                                                        onUpdate(section.id, { certificates: updated });
                                                    }}
                                                    placeholder="Nazwa (np. NSTS-01)"
                                                    className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm text-white font-bold"
                                                />
                                                <input
                                                    type="text"
                                                    value={cert.subtitle || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(section.certificates || [])];
                                                        updated[cIndex] = { ...cert, subtitle: e.target.value };
                                                        onUpdate(section.id, { certificates: updated });
                                                    }}
                                                    placeholder="Podtytuł (np. Certyfikat ULC)"
                                                    className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-xs text-zinc-400"
                                                />
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const updated = section.certificates!.filter((_, i) => i !== cIndex);
                                                    onUpdate(section.id, { certificates: updated });
                                                }}
                                                className="p-1.5 text-zinc-500 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <textarea
                                            value={cert.description || ''}
                                            onChange={(e) => {
                                                const updated = [...(section.certificates || [])];
                                                updated[cIndex] = { ...cert, description: e.target.value };
                                                onUpdate(section.id, { certificates: updated });
                                            }}
                                            placeholder="Dodatkowy opis..."
                                            className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-xs text-white h-16"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 border-2 border-dashed border-zinc-800 rounded-lg">
                                <p className="text-zinc-600 text-sm">Brak certyfikatów. Dodaj przynajmniej jeden.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* B2B HERO */}
                {section.type === 'b2b_hero' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Tag (nad tytułem)</label>
                                <input type="text" value={section.tag || ''} onChange={e => onUpdate(section.id, { tag: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white" placeholder="np. ROZWIĄZANIA DLA PRZEMYSŁU" />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Tytuł (HTML)</label>
                                <input type="text" value={section.title || ''} onChange={e => onUpdate(section.id, { title: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Podtytuł</label>
                            <input type="text" value={section.subtitle || ''} onChange={e => onUpdate(section.id, { subtitle: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white" />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs text-zinc-500 mb-1">Tło (Image URL)</label>
                                <div className="flex gap-2">
                                    <input type="text" value={section.image || ''} onChange={e => onUpdate(section.id, { image: e.target.value })} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white" />
                                    <button onClick={() => { openMediaPicker(section.id, { target: 'single' }); }} className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-white uppercase font-bold">Wybierz</button>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Tekst przycisku</label>
                                <input type="text" value={section.buttonText || ''} onChange={e => onUpdate(section.id, { buttonText: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white" />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Link przycisku</label>
                                <input type="text" value={section.buttonLink || ''} onChange={e => onUpdate(section.id, { buttonLink: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white" />
                            </div>
                        </div>
                    </div>
                )}

                {/* B2B STATS */}
                {section.type === 'b2b_stats' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Statystyki B2B</h4>
                            <button
                                onClick={() => {
                                    const newStat: B2BStat = { id: Math.random().toString(36).substr(2, 9), value: '100', label: 'Nowa statystyka' };
                                    onUpdate(section.id, { b2b_stats: [...(section.b2b_stats || []), newStat] });
                                }}
                                className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30 hover:bg-blue-500/30 font-bold"
                            >
                                + DODAJ
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {(section.b2b_stats || []).map((stat, sIndex) => (
                                <div key={stat.id} className="bg-zinc-800 p-3 rounded border border-zinc-700 relative group">
                                    <button onClick={() => onUpdate(section.id, { b2b_stats: section.b2b_stats!.filter((_, i) => i !== sIndex) })} className="absolute top-2 right-2 text-zinc-600 hover:text-red-500"><Trash2 size={12} /></button>
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <input type="text" value={stat.prefix || ''} onChange={e => { const up = [...section.b2b_stats!]; up[sIndex].prefix = e.target.value; onUpdate(section.id, { b2b_stats: up }); }} placeholder="Prefix" className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-400" />
                                        <input type="text" value={stat.suffix || ''} onChange={e => { const up = [...section.b2b_stats!]; up[sIndex].suffix = e.target.value; onUpdate(section.id, { b2b_stats: up }); }} placeholder="Suffix" className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-400" />
                                    </div>
                                    <input type="text" value={stat.value} onChange={e => { const up = [...section.b2b_stats!]; up[sIndex].value = e.target.value; onUpdate(section.id, { b2b_stats: up }); }} placeholder="Wartość" className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white font-bold mb-2" />
                                    <input type="text" value={stat.label} onChange={e => { const up = [...section.b2b_stats!]; up[sIndex].label = e.target.value; onUpdate(section.id, { b2b_stats: up }); }} placeholder="Etykieta" className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-400" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* B2B LOGOS */}
                {section.type === 'b2b_logos' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Logotypy Klientów / Partnerów</h4>
                            <button
                                onClick={() => {
                                    const newLogo: B2BLogo = { id: Math.random().toString(36).substr(2, 9), image: '' };
                                    onUpdate(section.id, { b2b_logos: [...(section.b2b_logos || []), newLogo] });
                                }}
                                className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded border border-purple-500/30 hover:bg-purple-500/30 font-bold"
                            >
                                + DODAJ LOGO
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {(section.b2b_logos || []).map((logo, lIndex) => (
                                <div key={logo.id} className="relative aspect-square bg-zinc-800 rounded border border-zinc-700 overflow-hidden flex items-center justify-center p-2">
                                    {logo.image ? <img src={logo.image} className="max-w-full max-h-full object-contain filter grayscale invert opacity-50" /> : <ImageIcon className="text-zinc-700" size={24} />}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity">
                                        <button onClick={() => { openMediaPicker(section.id, { target: 'single', index: lIndex }); }} className="text-[10px] bg-white text-black px-2 py-1 rounded font-bold uppercase">Zmień</button>
                                        <button onClick={() => onUpdate(section.id, { b2b_logos: section.b2b_logos!.filter((_, i) => i !== lIndex) })} className="text-[10px] bg-red-500 text-white px-2 py-1 rounded font-bold uppercase">Usuń</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* B2B PROCESS */}
                {section.type === 'b2b_process' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Tytuł Sekcji (HTML)</label>
                                <input type="text" value={section.title || ''} onChange={e => onUpdate(section.id, { title: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white" />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Tag (nad tytułem)</label>
                                <input type="text" value={section.subtitle || ''} onChange={e => onUpdate(section.id, { subtitle: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white" />
                            </div>
                        </div>
                        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg space-y-3">
                            <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Mały boks (np. Bezpieczeństwo)</h5>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-zinc-600 mb-1">Nagłówek boksu</label>
                                    <input type="text" value={section.featureTitle || ''} onChange={e => onUpdate(section.id, { featureTitle: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-600 mb-1">Treść boksu</label>
                                    <input type="text" value={section.featureContent || ''} onChange={e => onUpdate(section.id, { featureContent: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Proces Współpracy (SLA)</h4>
                            <button
                                onClick={() => {
                                    const nextStep = (section.b2b_process?.length || 0) + 1;
                                    const newStep: B2BProcessStep = { id: Math.random().toString(36).substr(2, 9), title: 'Nowy krok', description: 'Opis kroku...', stepNumber: `0${nextStep}` };
                                    onUpdate(section.id, { b2b_process: [...(section.b2b_process || []), newStep] });
                                }}
                                className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30 hover:bg-green-500/30 font-bold"
                            >
                                + DODAJ KROK
                            </button>
                        </div>
                        <div className="space-y-3">
                            {(section.b2b_process || []).map((step, pIndex) => (
                                <div key={step.id} className="bg-zinc-800 p-4 rounded border border-zinc-700 flex gap-4 items-start">
                                    <div className="text-2xl font-black text-green-500/20 shrink-0">{step.stepNumber}</div>
                                    <div className="flex-1 space-y-2">
                                        <input type="text" value={step.title} onChange={e => { const up = [...section.b2b_process!]; up[pIndex].title = e.target.value; onUpdate(section.id, { b2b_process: up }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-sm text-white font-bold" />
                                        <textarea value={step.description} onChange={e => { const up = [...section.b2b_process!]; up[pIndex].description = e.target.value; onUpdate(section.id, { b2b_process: up }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-xs text-zinc-400 h-16" />
                                    </div>
                                    <button onClick={() => onUpdate(section.id, { b2b_process: section.b2b_process!.filter((_, i) => i !== pIndex) })} className="text-zinc-600 hover:text-red-500"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* B2B CASES */}
                {section.type === 'b2b_cases' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Case Studies (Projekty)</h4>
                            <button
                                onClick={() => {
                                    const newCase: B2BCaseStudy = { id: Math.random().toString(36).substr(2, 9), title: 'Nowy Case Study', client: 'Klient Inc.', description: 'Opis realizacji...', image: '' };
                                    onUpdate(section.id, { b2b_cases: [...(section.b2b_cases || []), newCase] });
                                }}
                                className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded border border-orange-500/30 hover:bg-orange-500/30 font-bold"
                            >
                                + DODAJ PROJEKT
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(section.b2b_cases || []).map((cse, cIndex) => (
                                <div key={cse.id} className="bg-zinc-800 p-4 rounded border border-zinc-700 space-y-3">
                                    <div className="flex gap-4 items-start">
                                        <div className="w-24 h-24 bg-zinc-900 rounded border border-zinc-700 overflow-hidden relative group shrink-0">
                                            {cse.image ? <img src={cse.image} className="w-full h-full object-cover" /> : <ImageIcon className="m-auto mt-8 text-zinc-800" size={24} />}
                                            <button onClick={() => { openMediaPicker(section.id, { target: 'single', index: cIndex }); }} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] text-white font-bold uppercase transition-opacity">Zmień</button>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <input type="text" value={cse.title} onChange={e => { const up = [...section.b2b_cases!]; up[cIndex].title = e.target.value; onUpdate(section.id, { b2b_cases: up }); }} placeholder="Tytuł projektu" className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white font-bold" />
                                            <input type="text" value={cse.client} onChange={e => { const up = [...section.b2b_cases!]; up[cIndex].client = e.target.value; onUpdate(section.id, { b2b_cases: up }); }} placeholder="Klient" className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-400" />
                                        </div>
                                        <button onClick={() => onUpdate(section.id, { b2b_cases: section.b2b_cases!.filter((_, i) => i !== cIndex) })} className="text-zinc-600 hover:text-red-500"><Trash2 size={16} /></button>
                                    </div>
                                    <textarea value={cse.description} onChange={e => { const up = [...section.b2b_cases!]; up[cIndex].description = e.target.value; onUpdate(section.id, { b2b_cases: up }); }} placeholder="Opis realizacji..." className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-400 h-20" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* INFO BAND */}
                {section.type === 'info_band' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Tytuł Sekcji (Biała)</label>
                                <input type="text" value={section.title || ''} onChange={e => onUpdate(section.id, { title: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white" />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Tag / Podtytuł</label>
                                <input type="text" value={section.subtitle || ''} onChange={e => onUpdate(section.id, { subtitle: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Elementy InfoBand (Ikony/Zdjęcia)</h4>
                            <button
                                onClick={() => {
                                    const newItem: InfoBandItem = { id: Math.random().toString(36).substr(2, 9), title: 'Nowy element', description: 'Opis...', icon: 'Zap' };
                                    onUpdate(section.id, { infoband_items: [...(section.infoband_items || []), newItem] });
                                }}
                                className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30 hover:bg-blue-500/30 font-bold"
                            >
                                + DODAJ ELEMENT
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(section.infoband_items || []).map((item, iIndex) => (
                                <div key={item.id} className="bg-zinc-800 p-4 rounded border border-zinc-700 space-y-4">
                                    <div className="flex gap-4 items-start">
                                        <div className="w-20 h-20 bg-zinc-900 rounded border border-zinc-700 overflow-hidden relative group shrink-0 flex items-center justify-center">
                                            {item.image ? (
                                                <img src={item.image} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-blue-500">
                                                    <Layout size={32} />
                                                </div>
                                            )}
                                            <button onClick={() => { openMediaPicker(section.id, { target: 'single', index: iIndex }); }} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] text-white font-bold uppercase transition-opacity">Wgraj Zdjęcie</button>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex gap-2">
                                                <select
                                                    value={item.icon || 'Zap'}
                                                    onChange={e => {
                                                        const up = [...section.infoband_items!];
                                                        up[iIndex].icon = e.target.value;
                                                        onUpdate(section.id, { infoband_items: up });
                                                    }}
                                                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white"
                                                >
                                                    <option value="Building2">🏢 Budynek / Korpo</option>
                                                    <option value="Factory">🏭 Fabryka / Industry</option>
                                                    <option value="Warehouse">📦 Magazyn / Logistics</option>
                                                    <option value="Truck">🚚 Transport / Ciężarówka</option>
                                                    <option value="Plane">✈️ Samolot / Aviation</option>
                                                    <option value="Ship">🚢 Statek / Maritime</option>
                                                    <option value="HardHat">👷 Budowa / Safety</option>
                                                    <option value="Zap">⚡ Energia / Akcja</option>
                                                    <option value="ShieldCheck">🛡️ Bezpieczeństwo</option>
                                                    <option value="Crosshair">🎯 Dron / Precyzja</option>
                                                    <option value="Thermometer">🌡️ Termowizja</option>
                                                    <option value="Activity">📈 Monitorowanie</option>
                                                    <option value="Gauge">⏱️ Prędkość / Wydajność</option>
                                                    <option value="Globe">🌐 Global / Zasięg</option>
                                                    <option value="MapPin">📍 Lokalizacja</option>
                                                    <option value="Camera">📸 Fotografia</option>
                                                    <option value="Workflow">⚙️ Procesy</option>
                                                    <option value="Cpu">💻 Technologia</option>
                                                    <option value="Layers">📑 Dokumentacja</option>
                                                    <option value="Trees">🌳 Eko / Teren</option>
                                                    <option value="Box">📦 Przesyłki</option>
                                                    <option value="Construction">🏗️ Konstrukcje</option>
                                                    <option value="Hammer">🛠️ Naprawa</option>
                                                </select>
                                                <button onClick={() => onUpdate(section.id, { infoband_items: section.infoband_items!.filter((_, i) => i !== iIndex) })} className="text-zinc-600 hover:text-red-500"><Trash2 size={16} /></button>
                                            </div>
                                            <input type="text" value={item.title} onChange={e => { const up = [...section.infoband_items!]; up[iIndex].title = e.target.value; onUpdate(section.id, { infoband_items: up }); }} placeholder="Tytuł" className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white font-bold" />
                                            <input type="text" value={item.link || ''} onChange={e => { const up = [...section.infoband_items!]; up[iIndex].link = e.target.value; onUpdate(section.id, { infoband_items: up }); }} placeholder="Link (opcjonalnie)" className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-400 mt-1" />
                                        </div>
                                    </div>
                                    <textarea value={item.description} onChange={e => { const up = [...section.infoband_items!]; up[iIndex].description = e.target.value; onUpdate(section.id, { infoband_items: up }); }} placeholder="Krótki opis..." className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-400 h-16" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* B2B RFQ */}
                {section.type === 'b2b_contact' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Tytuł Sekcji RFQ</label>
                                <input type="text" value={section.title || ''} onChange={e => onUpdate(section.id, { title: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white" placeholder="np. Zapytanie Ofertowe" />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Podtytuł</label>
                                <input type="text" value={section.subtitle || ''} onChange={e => onUpdate(section.id, { subtitle: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PageBuilder({ sections, onChange }: PageBuilderProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Global MediaPicker State
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [mediaPickerTarget, setMediaPickerTarget] = useState<'single' | 'gallery'>('single');
    const [mediaPickerContext, setMediaPickerContext] = useState<'visual' | 'thermal' | null>(null);
    const [sectionEditIndex, setSectionEditIndex] = useState(-1);
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

    const openMediaPicker = (sectionId: string, options: { target: 'single' | 'gallery', context?: 'visual' | 'thermal', index?: number }) => {
        setActiveSectionId(sectionId);
        setMediaPickerTarget(options.target);
        setMediaPickerContext(options.context || null);
        setSectionEditIndex(options.index ?? -1);
        setShowMediaPicker(true);
    };

    const handleGlobalImageSelect = (url: string | string[]) => {
        if (!activeSectionId) return;
        const section = sections.find(s => s.id === activeSectionId);
        if (!section) return;

        const imageUrl = Array.isArray(url) ? url[0] : url;

        if (section.type === 'thermal_slider') {
            if (sectionEditIndex >= 0) {
                const updated = [...(section.thermalSections || [])];
                if (mediaPickerContext === 'visual') {
                    updated[sectionEditIndex] = { ...updated[sectionEditIndex], visualImage: imageUrl };
                } else if (mediaPickerContext === 'thermal') {
                    updated[sectionEditIndex] = { ...updated[sectionEditIndex], thermalImage: imageUrl };
                }
                updateSection(activeSectionId, { thermalSections: updated });
            } else {
                if (mediaPickerContext === 'visual') {
                    updateSection(activeSectionId, { image: imageUrl });
                } else if (mediaPickerContext === 'thermal') {
                    updateSection(activeSectionId, { thermalImage: imageUrl });
                }
            }
        } else if (section.type === 'hero_slider') {
            const updated = [...(section.slides || [])];
            if (sectionEditIndex >= 0) {
                updated[sectionEditIndex] = { ...updated[sectionEditIndex], image: imageUrl };
                updateSection(activeSectionId, { slides: updated });
            }
        } else if (['certificates', 'b2b_logos', 'b2b_cases'].includes(section.type)) {
            if (section.type === 'certificates') {
                const updated = [...(section.certificates || [])];
                if (sectionEditIndex >= 0) {
                    updated[sectionEditIndex] = { ...updated[sectionEditIndex], image: imageUrl };
                    updateSection(activeSectionId, { certificates: updated });
                }
            } else if (section.type === 'b2b_logos') {
                const updated = [...(section.b2b_logos || [])];
                if (sectionEditIndex >= 0) {
                    updated[sectionEditIndex] = { ...updated[sectionEditIndex], image: imageUrl };
                    updateSection(activeSectionId, { b2b_logos: updated });
                }
            } else if (section.type === 'b2b_cases') {
                const updated = [...(section.b2b_cases || [])];
                if (sectionEditIndex >= 0) {
                    updated[sectionEditIndex] = { ...updated[sectionEditIndex], image: imageUrl };
                    updateSection(activeSectionId, { b2b_cases: updated });
                }
            } else if (section.type === 'info_band') {
                const updated = [...(section.infoband_items || [])];
                if (sectionEditIndex >= 0) {
                    updated[sectionEditIndex] = { ...updated[sectionEditIndex], image: imageUrl };
                    updateSection(activeSectionId, { infoband_items: updated });
                }
            }
        } else if (mediaPickerTarget === 'single') {
            updateSection(activeSectionId, { image: imageUrl });
        } else {
            const newImages = Array.isArray(url) ? url : [url];
            updateSection(activeSectionId, { images: [...(section.images || []), ...newImages] });
        }
        setShowMediaPicker(false);
    };

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

        if (type === 'b2b_stats') {
            newSection.b2b_stats = [
                { id: Math.random().toString(36).substr(2, 9), value: '15+', label: 'Lat doświadczenia', prefix: '', suffix: '' },
                { id: Math.random().toString(36).substr(2, 9), value: '500+', label: 'Zrealizowanych projektów', prefix: '', suffix: '' },
                { id: Math.random().toString(36).substr(2, 9), value: '100%', label: 'Bezpieczeństwa operacji', prefix: '', suffix: '' }
            ];
        } else if (type === 'b2b_process') {
            newSection.title = 'Proces oparty na <span class="text-yellow-500">precyzji</span> i SLA.';
            newSection.subtitle = 'Standardy Operacyjne';
            newSection.featureTitle = 'Bezpieczeństwo';
            newSection.featureContent = 'SORA / LUC';
            newSection.b2b_process = [
                { id: Math.random().toString(36).substr(2, 9), title: 'Kontakt i Wycena', description: 'Analizujemy Twoje potrzeby i przygotowujemy dedykowaną ofertę.', stepNumber: '01' },
                { id: Math.random().toString(36).substr(2, 9), title: 'Realizacja Operacji', description: 'Wykonujemy naloty wg najwyższych standardów bezpieczeństwa.', stepNumber: '02' },
                { id: Math.random().toString(36).substr(2, 9), title: 'Analiza i Raport', description: 'Przetwarzamy dane i dostarczamy gotowy produkt w 48h.', stepNumber: '03' }
            ];
        } else if (type === 'b2b_cases') {
            newSection.b2b_cases = [];
        } else if (type === 'b2b_logos') {
            newSection.b2b_logos = [];
        } else if (type === 'b2b_hero') {
            newSection.title = 'Innowacyjne rozwiązania <span class="text-yellow-500">dla Twojego biznesu</span>';
            newSection.subtitle = 'Profesjonalne usługi dronem, termowizja i inspekcje techniczne z powietrza.';
            newSection.tag = 'B2B SOLUTIONS';
            newSection.buttonText = 'ZAPYTAJ O OFERTĘ';
            newSection.buttonLink = '#rfq';
        } else if (type === 'info_band') {
            newSection.title = 'Wsparcie Twojego <span class="text-yellow-500">biznesu</span>';
            newSection.subtitle = 'KOMPLEKSOWA OBSŁUGA';
            newSection.infoband_items = [
                { id: Math.random().toString(36).substr(2, 9), icon: 'Building2', title: 'Budynki i Infrastruktura', description: 'Inspekcje techniczne i inwentaryzacje z powietrza.' },
                { id: Math.random().toString(36).substr(2, 9), icon: 'Truck', title: 'Transport i Logistyka', description: 'Monitoring procesów i dokumentacja transportowa.' },
                { id: Math.random().toString(36).substr(2, 9), icon: 'Crosshair', title: 'Precyzyjne Pomiary', description: 'Fotogrametria i modele 3D terenu.' }
            ];
        } else if (type === 'b2b_contact') {
            newSection.title = 'Zapytaj o <span class="text-yellow-500">ofertę B2B.</span>';
            newSection.subtitle = 'Nasz doradca techniczny skontaktuje się z Tobą w ciągu 4 godzin roboczych.';
        }

        onChange([...sections, newSection]);
    };

    const applyTemplate = (templateName: string) => {
        let templateSections: PageSection[] = [];
        const baseId = () => Math.random().toString(36).substr(2, 9);

        if (templateName === 'thermal') {
            templateSections = [
                {
                    id: baseId(), type: 'b2b_hero', tag: 'TERMOWIZJA Z POWIETRZA',
                    title: 'Wykrywamy to, co <span class="text-yellow-500">niewidoczne</span> dla oka.',
                    subtitle: 'Dzięki kamerze termowizyjne wykrywamy nieszczelności, mostki cieplne i przegrzewające się elementy w instalacjach. Idealne dla przemysłu i OZE.',
                    buttonText: 'ZAMÓW AUDYT TERMICZNY',
                    buttonLink: '#rfq'
                },
                {
                    id: baseId(), type: 'info_band', title: 'Energia pod <span class="text-yellow-500">kontrolą</span>',
                    subtitle: 'ZAKRES DIAGNOSTYKI',
                    infoband_items: [
                        { id: baseId(), icon: 'Thermometer', title: 'Dachy i Fasady', description: 'Lokalizacja ubytków izolacji i mostków cieplnych w budynkach mieszkalnych i halach.' },
                        { id: baseId(), icon: 'Zap', title: 'Diagnostyka PV', description: 'Szybkie wykrywanie uszkodzonych ogniw i gorących punktów (hot-spots) na farmach.' },
                        { id: baseId(), icon: 'ShieldCheck', title: 'Wczesne Wykrywanie', description: 'Identyfikacja awarii instalacji elektrycznych przed wystąpieniem pożaru.' }
                    ]
                },
                {
                    id: baseId(), type: 'b2b_process', title: 'Raport z certyfikatem w <span class="text-yellow-500">48h</span>.',
                    subtitle: 'PROCES ANALITYCZNY',
                    b2b_process: [
                        { id: baseId(), title: 'Nalot Radiometryczny', description: 'Zbiór precyzyjnych danych temperaturowych z każdej sekcji obiektu.', stepNumber: '01' },
                        { id: baseId(), title: 'Analiza Ekspercka', description: 'Weryfikacja anomalii przez certyfikowanych specjalistów termografii.', stepNumber: '02' },
                        { id: baseId(), title: 'Raport z zaleceniami', description: 'Pełna dokumentacja wskazująca miejsca wymagające interwencji.', stepNumber: '03' }
                    ]
                },
                { id: baseId(), type: 'b2b_contact', title: 'Masz podejrzenie strat ciepła?', subtitle: 'Skontaktuj się z nami. Wykonamy profesjonalną analizę termowizyjną Twojego obiektu.' }
            ];
        } else if (templateName === 'construction') {
            templateSections = [
                {
                    id: baseId(), type: 'b2b_hero', tag: 'MONITORING INWESTYCJI',
                    title: 'Pełna kontrola nad <span class="text-yellow-500">Twoją budową</span>',
                    subtitle: 'Regularna dokumentacja postępów prac, profesjonalne raporty dla inwestorów i widok 360° na cały plac budowy.',
                    buttonText: 'ZAMÓW MONITORING',
                    buttonLink: '#rfq'
                },
                {
                    id: baseId(), type: 'info_band', title: 'Dane, które <span class="text-yellow-500">budują zysk</span>',
                    subtitle: 'KORZYŚCI DLA INWESTORA',
                    infoband_items: [
                        { id: baseId(), icon: 'Building2', title: 'Raporty Postępów', description: 'Cotygodniowe lub miesięczne serie ujęć dokumentujące każdą fazę realizacji.' },
                        { id: baseId(), icon: 'Maximize2', title: 'Panorama 360°', description: 'Interaktywny widok na cały plac budowy umożliwiający zdalny nadzór.' },
                        { id: baseId(), icon: 'Map', title: 'Mapowanie Terenu', description: 'Tworzenie ortofotomap i precyzyjnych modeli 3D do planowania inwestycji.' }
                    ]
                },
                {
                    id: baseId(), type: 'b2b_process', title: 'Logistyka <span class="text-yellow-500">nadzoru</span>.',
                    subtitle: 'SCHEMAT DZIAŁANIA',
                    b2b_process: [
                        { id: baseId(), title: 'Ustalenie Harmonogramu', description: 'Definiujemy kluczowe etapy i częstotliwość nalotów.', stepNumber: '01' },
                        { id: baseId(), title: 'Realizacja Sesji', description: 'Wykonujemy powtarzalne naloty z tych samych punktów kontrolnych.', stepNumber: '02' },
                        { id: baseId(), title: 'Dostarczenie Raportu', description: 'Udostępniamy materiały w chmurze gotowe do prezentacji inwestorom.', stepNumber: '03' }
                    ]
                },
                { id: baseId(), type: 'b2b_contact', title: 'Chcesz usprawnić nadzór nad budową?', subtitle: 'Dostosujemy częstotliwość nalotów i zakres dokumentacji do Twoich potrzeb.' }
            ];
        } else if (templateName === 'google_360') {
            templateSections = [
                {
                    id: baseId(), type: 'b2b_hero', tag: 'PROMOCJA & WIZYTÓWKI',
                    title: 'Pokaż swoją firmę w <span class="text-yellow-500">standardzie 4K.</span>',
                    subtitle: 'Wirtualne spacery Google Street View i profesjonalne filmy promocyjne, które wyróżnią Cię w Mapach Google i social mediach.',
                    buttonText: 'ZAMÓW SESJĘ 360',
                    buttonLink: '#rfq'
                },
                {
                    id: baseId(), type: 'info_band', title: 'Wideo, które <span class="text-yellow-500">sprzedaje</span>',
                    subtitle: 'MARKETING Z POWIETRZA',
                    infoband_items: [
                        { id: baseId(), icon: 'Camera', title: 'Filmy 4K', description: 'Dynamiczne ujęcia korporacyjne z montażem i podkładem muzycznym.' },
                        { id: baseId(), icon: 'Maximize2', title: 'Wirtualny Spacer', description: 'Integracja spaceru 3D z wizytówką Google Twojej firmy.' },
                        { id: baseId(), icon: 'Search', title: 'SEO Lokalne', description: 'Zwiększona widoczność w wynikach wyszukiwania dzięki profesjonalnym mediom.' }
                    ]
                },
                { id: baseId(), type: 'b2b_contact', title: 'Chcesz wyróżnić swoją siedzibę w Mapach?', subtitle: 'Napisz do certyfikowanego fotografa Google. Przygotujemy profesjonalne ujęcia Twojego lokalu.' }
            ];
        } else if (templateName === 'building_analysis') {
            templateSections = [
                {
                    id: baseId(), type: 'b2b_hero', tag: 'INSPEKCJE TECHNICZNE',
                    title: 'Szybki i bezpieczny <span class="text-yellow-500">przegląd obiektu.</span>',
                    subtitle: 'Szczegółowe inspekcje dachów, elewacji, konstrukcji stalowych i instalacji PV bez rusztowań i podnośników.',
                    buttonText: 'ZAMÓW INSPEKCJĘ',
                    buttonLink: '#rfq'
                },
                {
                    id: baseId(), type: 'info_band', title: 'Specjalistyczna <span class="text-yellow-500">analiza konstrukcji</span>',
                    subtitle: 'ZAKRES INSPEKCJI',
                    infoband_items: [
                        { id: baseId(), icon: 'ShieldCheck', title: 'Dachy i Elewacje', description: 'Wykrywanie nieszczelności, pęknięć tynku i ubytków poszycia.' },
                        { id: baseId(), icon: 'HardHat', title: 'Konstrukcje Stalowe', description: 'Kontrola stanu antykorozyjnego i połączeń w trudno dostępnych miejscach.' },
                        { id: baseId(), icon: 'Zap', title: 'Reklamy i Maszty', description: 'Bezpieczny przegląd konstrukcji reklam wielkoformatowych i oświetlenia.' }
                    ]
                },
                { id: baseId(), type: 'b2b_contact', title: 'Potrzebujesz udokumentować stan obiektu?', subtitle: 'Dostarczamy ultra-szczegółowe zdjęcia i filmy dla ekip serwisowych i działów technicznych.' }
            ];
        } else if (templateName === 'master_business') {
            templateSections = [
                {
                    id: baseId(), type: 'hero_slider', slides: [
                        { id: baseId(), image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?q=80&w=2070&auto=format&fit=crop', title: 'Inspekcje Dronowe i Monitoring', subtitle: 'Konkretna dokumentacja, która ma zastosowanie biznesowe. Bez marketingu, same fakty.', buttonText: 'ZAPYTAJ O OFERTĘ', buttonLink: '#rfq' },
                        { id: baseId(), image: 'https://images.unsplash.com/photo-1485083269755-a7b559a4fe5e?q=80&w=2070&auto=format&fit=crop', title: 'Rzetelna Dokumentacja Inwestycji', subtitle: 'Kontroluj jakość i stan techniczny obiektów bez przestojów i rusztowań.', buttonText: 'POZNAJ PROCES', buttonLink: '#process' }
                    ]
                },
                { id: baseId(), type: 'b2b_stats', b2b_stats: [{ id: baseId(), value: 'ITC', label: 'Certyfikacja Level 1', prefix: '', suffix: '' }, { id: baseId(), value: '100', label: 'Inwestycji', prefix: '+', suffix: '' }, { id: baseId(), value: 'OC', label: 'Polisa Komercyjna', prefix: '', suffix: '' }] },
                {
                    id: baseId(), type: 'info_band', title: 'Technologie & <span class="text-yellow-500">Bezpieczeństwo</span>',
                    subtitle: 'OBSZARY DZIAŁANIA',
                    infoband_items: [
                        { id: baseId(), icon: 'ShieldCheck', title: 'Inspekcje Techniczne', description: 'Szczegółowe przeglądy dachów, elewacji i konstrukcji bez rusztowań. Nie wstrzymujemy pracy obiektu.' },
                        { id: baseId(), icon: 'Thermometer', title: 'Termowizja ITC Level 1', description: 'Diagnostyka strat ciepła, nieszczelności i awarii PV. Raporty dla przemysłu i OZE.' },
                        { id: baseId(), icon: 'Building2', title: 'Monitoring Inwestycji', description: 'Cykliczna dokumentacja postępu prac. Spójny zapis "krok po kroku" dla inwestora.' }
                    ]
                },
                {
                    id: baseId(), type: 'info_band', title: 'Media & <span class="text-yellow-500">Długi Termin</span>',
                    subtitle: 'FORMATY DANYCH',
                    infoband_items: [
                        { id: baseId(), icon: 'Clock', title: 'Timelapse Budowlany', description: 'Długoterminowa rejestracja postępów. Film pokazujący cały proces powstawania inwestycji.' },
                        { id: baseId(), icon: 'Camera', title: 'Foto/Video dla Firm', description: 'Materiały 4K do raportów, prezentacji inwestorskich i promocji obiektów.' },
                        { id: baseId(), icon: 'AlertTriangle', title: 'Jasny Zakres Usług', description: 'Nie wykonujemy: ortofotomap, modeli 3D ani pomiarów geodezyjnych. Stawiamy na obraz i termowizję.' }
                    ]
                },
                {
                    id: baseId(), type: 'b2b_process', title: 'Prosty proces <span class="text-yellow-500">współpracy</span>',
                    subtitle: 'JAK DZIAŁAMY?',
                    b2b_process: [
                        { id: baseId(), title: 'Kontakt i Zakres', description: 'Omawiamy potrzeby: monitoring, timelapse czy inspekcja.', stepNumber: '01' },
                        { id: baseId(), title: 'Plan Realizacji', description: 'Ustalamy harmonogram i sposób raportowania.', stepNumber: '02' },
                        { id: baseId(), title: 'Realizacja i Raport', description: 'Wykonujemy naloty i dostarczamy gotową dokumentację.', stepNumber: '03' }
                    ]
                },
                {
                    id: baseId(), type: 'b2b_cases', title: 'Przykładowe Realizacje',
                    b2b_cases: [
                        {
                            id: baseId(), client: 'SEKTOR PRZEMYSŁOWY', title: 'Inspekcja Termowizyjna Hali', category: 'Termowizja',
                            image: 'https://images.unsplash.com/photo-1592833159057-6fdc2a5c3789?q=80&w=2070&auto=format&fit=crop',
                            description: 'Audyt szczelności dachu i elewacji. Wykrycie mostków cieplnych bez konieczności użycia podnośników.'
                        },
                        {
                            id: baseId(), client: 'DEWELOPERZY', title: 'Monitoring Osiedla Mieszkaniowego', category: 'Construction',
                            image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop',
                            description: 'Cotygodniowe raporty zdjęciowe i wideo dokumentujące postęp prac dla zarządu i klientów.'
                        },
                        {
                            id: baseId(), client: 'INFRASTRUKTURA', title: 'Timelapse Budowy Drogi', category: 'Timelapse',
                            image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop',
                            description: 'Półroczny zapis wideo pokazujący każdy etap powstawania nowej drogi dojazdowej.'
                        }
                    ]
                },
                {
                    id: baseId(), type: 'certificates', certificateSize: 'readable', title: 'Gwarancja Bezpieczeństwa',
                    certificates: [
                        { id: baseId(), title: 'UAV Pilot', subtitle: 'A1/A2/A3/STS', description: 'Licencjonowane operacje w całej Europie.' },
                        { id: baseId(), title: 'Termowizja ITC', subtitle: 'Level 1 Certified', description: 'Międzynarodowy certyfikat diagnostyki termowizyjnej.' },
                        { id: baseId(), icon: 'ShieldCheck', title: 'Ubezpieczenie OC', subtitle: 'Polisa Komercyjna', description: 'Pełna ochrona dla każdej realizowanej misji.' }
                    ]
                },
                { id: baseId(), type: 'b2b_contact', title: 'Zapytanie ofertowe', subtitle: 'Opisz krótko projekt. Na tej podstawie przygotuję konkretną wycenę i harmonogram.' }
            ];
        }

        if (confirm('Czy chcesz zastąpić obecne sekcje wybranym szablonem? Operacja jest nieodwracalna.')) {
            onChange(templateSections);
        }
    };

    const updateSection = (id: string, data: Partial<PageSection>) => {
        onChange(sections.map(s => s.id === id ? { ...s, ...data } : s));
    };

    const removeSection = (id: string) => {
        onChange(sections.filter(s => s.id !== id));
    };

    const moveSection = (id: string, direction: 'up' | 'down') => {
        const index = sections.findIndex(s => s.id === id);
        if (direction === 'up' && index > 0) {
            onChange(arrayMove(sections, index, index - 1));
        } else if (direction === 'down' && index < sections.length - 1) {
            onChange(arrayMove(sections, index, index + 1));
        }
    };

    return (
        <div className="space-y-6">
            {/* Quick Templates Panel */}
            <div className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 mb-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Stars size={80} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Stars size={16} className="text-yellow-500" /> Szybki Start: Szablony Biznesowe
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => applyTemplate('thermal')}
                            className="px-5 py-3 bg-white/5 hover:bg-yellow-500 hover:text-black text-white text-xs font-bold rounded-xl transition-all border border-white/5 flex items-center gap-2"
                        >
                            <Zap size={14} /> Ekspert Termowizji
                        </button>
                        <button
                            onClick={() => applyTemplate('construction')}
                            className="px-5 py-3 bg-white/5 hover:bg-yellow-500 hover:text-black text-white text-xs font-bold rounded-xl transition-all border border-white/5 flex items-center gap-2"
                        >
                            <Building2 size={14} /> Monitoring & Dron
                        </button>
                        <button
                            onClick={() => applyTemplate('google_360')}
                            className="px-5 py-3 bg-white/5 hover:bg-yellow-500 hover:text-black text-white text-xs font-bold rounded-xl transition-all border border-white/5 flex items-center gap-2"
                        >
                            <Camera size={14} /> Wizytówka Google 360
                        </button>
                        <button
                            onClick={() => applyTemplate('building_analysis')}
                            className="px-5 py-3 bg-white/5 hover:bg-yellow-500 hover:text-black text-white text-xs font-bold rounded-xl transition-all border border-white/5 flex items-center gap-2"
                        >
                            <ShieldCheck size={14} /> Analiza Budynków
                        </button>
                        <button
                            onClick={() => applyTemplate('master_business')}
                            className="px-5 py-3 bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-400 text-xs font-bold rounded-xl transition-all border border-blue-500/20 flex items-center gap-2"
                        >
                            <Stars size={14} /> PEŁNA OFERTA (Master)
                        </button>
                        <div className="h-10 w-px bg-zinc-800 mx-2 hidden md:block" />
                        <button
                            onClick={() => { if (confirm('Na pewno wyczyścić stronę?')) onChange([]); }}
                            className="px-5 py-3 bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white text-xs font-bold rounded-xl transition-all border border-red-500/10 flex items-center gap-2"
                        >
                            <Trash2 size={14} /> Wyczyść sekcje
                        </button>
                    </div>
                    <p className="mt-4 text-[10px] text-zinc-500 italic">
                        Wybierz szablon, aby automatycznie wygenerować sprawdzony układ sekcji dla konkretnej branży.
                    </p>
                </div>
            </div>

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
                <button onClick={() => addSection('contact_form')} className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded text-sm text-blue-400 transition-colors">
                    <Layout className="w-4 h-4" /> Formularz Kontaktowy
                </button>
                <button onClick={() => addSection('thermal_slider')} className="flex items-center gap-2 px-4 py-2 bg-gold-600/20 hover:bg-gold-600/30 border border-gold-500/30 rounded text-sm text-gold-400 transition-colors">
                    <Layout className="w-4 h-4" /> Thermal Slider
                </button>
                <button onClick={() => addSection('hero_slider')} className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded text-sm text-purple-400 transition-colors">
                    <Layout className="w-4 h-4" /> Hero Slider (Multislide)
                </button>
                <button onClick={() => addSection('features')} className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded text-sm text-green-400 transition-colors">
                    <Layout className="w-4 h-4" /> Kafelki (Features)
                </button>
                <button onClick={() => addSection('certificates')} className="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 rounded text-sm text-yellow-400 transition-colors">
                    <ShieldCheck className="w-4 h-4" /> Certyfikaty
                </button>
            </div>

            <div className="flex gap-2 flex-wrap border-t border-zinc-800 pt-4 mt-2">
                <span className="w-full text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1 ml-1">Moduły B2B Premium</span>
                <button onClick={() => addSection('b2b_hero')} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/50 rounded text-sm text-zinc-300 transition-colors group">
                    <Stars className="w-4 h-4 text-yellow-500" /> B2B Hero
                </button>
                <button onClick={() => addSection('b2b_stats')} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/50 rounded text-sm text-zinc-300 transition-colors group">
                    <BarChart3 className="w-4 h-4 text-blue-500" /> B2B Stats
                </button>
                <button onClick={() => addSection('b2b_logos')} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/50 rounded text-sm text-zinc-300 transition-colors group">
                    <Award className="w-4 h-4 text-purple-500" /> B2B Logos
                </button>
                <button onClick={() => addSection('b2b_process')} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/50 rounded text-sm text-zinc-300 transition-colors group">
                    <Workflow className="w-4 h-4 text-green-500" /> B2B Process
                </button>
                <button onClick={() => addSection('b2b_cases')} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/50 rounded text-sm text-zinc-300 transition-colors group">
                    <Briefcase className="w-4 h-4 text-orange-500" /> B2B Cases
                </button>
                <button onClick={() => addSection('b2b_contact')} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/50 rounded text-sm text-zinc-300 transition-colors group">
                    <FileText className="w-4 h-4 text-red-500" /> B2B RFQ
                </button>
                <button onClick={() => addSection('info_band')} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/50 rounded text-sm text-zinc-300 transition-colors group">
                    <Layout className="w-4 h-4 text-blue-400" /> InfoBand (White)
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
                            onMove={moveSection}
                            openMediaPicker={openMediaPicker}
                        />
                    ))}
                </SortableContext>
            </DndContext>

            {sections.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-lg text-zinc-500">
                    Dodaj pierwszą sekcję, aby rozpocząć budowanie strony.
                </div>
            )}

            <MediaPicker
                isOpen={showMediaPicker}
                onClose={() => setShowMediaPicker(false)}
                onSelect={(urls: string | string[], id: number | number[]) => {
                    handleGlobalImageSelect(urls);
                }}
                multiple={mediaPickerTarget === 'gallery'}
            />
        </div>
    );
}
