'use client';

import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Plus, Trash2, GripVertical, Image as ImageIcon, Type, Layout, LayoutTemplate,
    MoveUp, MoveDown, ShieldCheck, Stars, BarChart3, Award, Workflow,
    Briefcase, FileText, Zap, Building2, Maximize2, Thermometer, Cpu, Crosshair,
    Camera, Droplets, Map, Search, HardHat, Video, FileSearch, X
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import MediaPicker from './MediaPicker';

export type SectionType = 'hero_parallax' | 'hero' | 'rich_text' | 'image_text' | 'gallery' | 'contact' | 'thermal_slider' | 'contact_form' | 'hero_slider' | 'about' | 'features' | 'parallax' | 'info_band' | 'testimonials' | 'challenge_banner' | 'creative_slider' | 'certificates' | 'b2b_hero' | 'b2b_stats' | 'b2b_logos' | 'b2b_process' | 'b2b_cases' | 'b2b_contact' | 'b2b_video' | 'thermal_hero' | 'hero_video' | 'parallax_video' | 'thermal_report' | 'mini_gallery' | 'story_hero' | 'magazine_layout' | 'masonry_gallery' | 'client_story' | 'process_timeline' | 'investment_teaser' | 'narrative_text' | 'featured_carousel' | 'stories_grid' | 'chronological_gallery' | 'floating_button' | 'pointcloud_hero' | 'pointcloud_viewer' | 'pointcloud_services' | 'pointcloud_showcase' | 'pointcloud_tech' | 'photo_cube_3d';

export interface SliderSlide {
    id: string;
    title?: string;
    subtitle?: string;
    buttonText?: string;
    buttonLink?: string;
    image: string;
    videoUrl?: string;
    overlayOpacity?: number;
    textAnimation?: 'fade' | 'slide-up' | 'scale';
    is_before_after?: boolean;
    before_image?: string;
}

export interface MiniGalleryItem {
    id: string;
    image: string;
    title?: string;
    description?: string;
    link?: string;
    spanCols?: number;
    spanRows?: number;
}

export interface MiniGalleryConfig {
    columns: number;
    gap: number;
    aspectRatio: 'square' | 'video' | 'portrait' | 'auto';
    style: 'classic' | 'masonry' | 'floating';
    textPosition: 'below' | 'overlay' | 'hover';
    corners: 'square' | 'rounded' | 'pill';
    backgroundColor?: string;
}

export interface ThermalHeroSlide {
    id: string;
    category: string;
    title: string;
    subtitle?: string;
    description?: string;
    visualMedia: string;
    thermalMedia: string;
    mediaType?: 'image' | 'video';
    labelLeft?: string;
    labelRight?: string;
    buttonText?: string;
    buttonLink?: string;
    buttonStyle?: 'gold' | 'white' | 'transparent';
    textAnimation?: 'fade' | 'slide-up' | 'scale';
}



export interface ThermalReport {
    id: string;
    title: string;
    date: string;
    location: string;
    equipment: string;
    pdfUrl: string;
    thumbnailUrl: string;
    type: string;
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

export interface StoryGridItem {
    id: string;
    title: string;
    image: string;
    link: string;
    category?: string;
}

export interface ChronologicalGalleryItem {
    id: string;
    image: string;
    description?: string;
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
    videoUrl?: string; // New field for video
    logo?: string; // New field for logo
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
    verifiedTag?: string; // For certificates
    certTag?: string; // For certificates
    descriptionLabel?: string; // For certificates
    infoband_items?: InfoBandItem[];
    logoHeight?: number; // For b2b_logos resizing
    textAnimation?: 'fade' | 'slide-up' | 'scale' | 'artistic'; // For parallax_video & hero_parallax
    fontFamily?: 'sans' | 'serif' | 'display' | 'handwriting'; // For hero_parallax
    stories_items?: StoryGridItem[]; // For stories_grid
    chronological_items?: ChronologicalGalleryItem[]; // For chronological_gallery
    gallery_layout?: 'grid' | 'list'; // For chronological_gallery
    mini_gallery_items?: MiniGalleryItem[];
    mini_gallery_config?: MiniGalleryConfig;
    thermal_hero_slides?: ThermalHeroSlide[];
    thermal_reports?: ThermalReport[];
    data?: any; // For legacy / homepage sections
    // Video Section Properties
    videoUrl?: string;
    videoType?: 'youtube' | 'vimeo' | 'direct';
    videoAutoPlay?: boolean;
    videoMuted?: boolean;
    videoLoop?: boolean;
    switchInterval?: number; // For thermal_slider
    overlayOpacity?: number; // For video modules
    imageObjectFit?: 'cover' | 'contain'; // For image_text
    backgroundColor?: 'black' | 'zinc-900' | 'zinc-950'; // For image_text
    // Point Cloud / Surveying Properties
    pointcloud_projects?: PointCloudProject[];
    pointcloud_services?: PointCloudServiceItem[];
    pointcloud_tech_steps?: PointCloudTechStep[];
    pointcloud_stats?: Array<{ label: string; value: string }>;
    modelUrl?: string; // For 3D GLB file
}

export interface PointCloudProject {
    id: string;
    title: string;
    subtitle?: string;
    description?: string;
    category?: string;
    location?: string;
    date?: string;
    area?: string;
    pointCount?: string;
    accuracy?: string;
    modelUrl?: string;
    coverImage?: string;
    images?: string[];
    tags?: string[];
}

export interface PointCloudServiceItem {
    id: string;
    icon: string;
    title: string;
    description: string;
    features?: string[];
    image?: string;
    modelUrl?: string;
}

export interface PointCloudTechStep {
    id: string;
    stepNumber: string;
    title: string;
    description: string;
    details?: string;
    image?: string;
    icon?: string;
}

interface PageBuilderProps {
    sections: PageSection[];
    onChange: (sections: PageSection[]) => void;
    pageType?: string;
}

function SortableSection({ section, index, onRemove, onUpdate, onMove, openMediaPicker }: {
    section: PageSection;
    index: number;
    onRemove: (id: string) => void;
    onUpdate: (id: string, data: Partial<PageSection>) => void;
    onMove: (id: string, direction: 'up' | 'down') => void;
    openMediaPicker: (sectionId: string, options: { target: 'single' | 'gallery', context?: 'visual' | 'thermal' | 'before' | 'case_logo' | 'case_video' | 'video' | 'mini_gallery_item' | 'story_cover' | 'chronological', index?: number }) => void;
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

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Czcionka</label>
                                <select
                                    value={section.fontFamily || 'sans'}
                                    onChange={(e) => onUpdate(section.id, { fontFamily: e.target.value as any })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                >
                                    <option value="sans">Sans (Nowoczesna)</option>
                                    <option value="serif">Serif (Elegancka)</option>
                                    <option value="display">Display (Ozdobna)</option>
                                    <option value="handwriting">Handwriting (Podpis)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Animacja Tekstu</label>
                                <select
                                    value={section.textAnimation || 'fade'}
                                    onChange={(e) => onUpdate(section.id, { textAnimation: e.target.value as any })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                >
                                    <option value="fade">Zanikanie (Fade)</option>
                                    <option value="slide-up">Wjazd od dołu</option>
                                    <option value="scale">Powiększenie</option>
                                    <option value="artistic">Artystyczna (Blur)</option>
                                </select>
                            </div>
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Left Column: Image & visual settings */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Zdjęcie</label>
                                    {section.image ? (
                                        <img src={section.image} alt="Preview" className={`w-full aspect-video rounded border border-zinc-700 mb-2 ${section.imageObjectFit === 'contain' ? 'object-contain bg-black' : 'object-cover'}`} />
                                    ) : (
                                        <div className="w-full aspect-video bg-zinc-800 rounded border border-zinc-700 mb-2" />
                                    )}
                                    <button
                                        onClick={() => { openMediaPicker(section.id, { target: 'single' }); }}
                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-300 hover:text-white mb-2"
                                    >
                                        Wybierz zdjęcie
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Dopasowanie zdjęcia</label>
                                    <select
                                        value={section.imageObjectFit || 'cover'}
                                        onChange={(e) => onUpdate(section.id, { imageObjectFit: e.target.value as 'cover' | 'contain' })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                    >
                                        <option value="cover">Wypełnij (Cover)</option>
                                        <option value="contain">Dopasuj (Contain)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Tło sekcji</label>
                                    <select
                                        value={section.backgroundColor || 'zinc-950'}
                                        onChange={(e) => onUpdate(section.id, { backgroundColor: e.target.value as any })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                    >
                                        <option value="zinc-950">Bardzo Ciemne (Zinc-950)</option>
                                        <option value="zinc-900">Ciemne (Zinc-900)</option>
                                        <option value="black">Czerń (Black)</option>
                                    </select>
                                </div>

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
                            </div>

                            {/* Middle & Right Column: Content */}
                            <div className="md:col-span-2 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-zinc-400 mb-1">Tytuł (Opcjonalny)</label>
                                        <input
                                            type="text"
                                            value={section.title || ''}
                                            onChange={(e) => onUpdate(section.id, { title: e.target.value })}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                            placeholder="np. O Mnie"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-zinc-400 mb-1">Podtytuł (Accent)</label>
                                        <input
                                            type="text"
                                            value={section.subtitle || ''}
                                            onChange={(e) => onUpdate(section.id, { subtitle: e.target.value })}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                            placeholder="np. MOJA PASJA"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Treść</label>
                                    <RichTextEditor
                                        value={section.content || ''}
                                        onChange={(val) => onUpdate(section.id, { content: val })}
                                        placeholder="Główna treść sekcji..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-4">
                                    <div>
                                        <label className="block text-xs text-zinc-400 mb-1">Tekst przycisku</label>
                                        <input
                                            type="text"
                                            value={section.buttonText || ''}
                                            onChange={(e) => onUpdate(section.id, { buttonText: e.target.value })}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                            placeholder="np. Zobacz portfolio"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-zinc-400 mb-1">Link przycisku</label>
                                        <input
                                            type="text"
                                            value={section.buttonLink || ''}
                                            onChange={(e) => onUpdate(section.id, { buttonLink: e.target.value })}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                            placeholder="np. /portfolio"
                                        />
                                    </div>
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

                {/* MINI GALLERY "PRO" */}
                {section.type === 'mini_gallery' && (
                    <div className="space-y-6">
                        {/* Config Panel */}
                        <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800">
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Layout size={14} /> Konfiguracja Siatki
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Kolumny</label>
                                    <select
                                        value={section.mini_gallery_config?.columns || 4}
                                        onChange={(e) => onUpdate(section.id, {
                                            mini_gallery_config: { ...section.mini_gallery_config!, columns: parseInt(e.target.value) }
                                        })}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white"
                                    >
                                        {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Styl</label>
                                    <select
                                        value={section.mini_gallery_config?.style || 'classic'}
                                        onChange={(e) => onUpdate(section.id, {
                                            mini_gallery_config: { ...section.mini_gallery_config!, style: e.target.value as any }
                                        })}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white"
                                    >
                                        <option value="classic">Klasyczny (Siatka)</option>
                                        <option value="masonry">Masonry (Cegiełki)</option>
                                        <option value="floating">Floating (Pro)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Narożniki</label>
                                    <select
                                        value={section.mini_gallery_config?.corners || 'square'}
                                        onChange={(e) => onUpdate(section.id, {
                                            mini_gallery_config: { ...section.mini_gallery_config!, corners: e.target.value as any }
                                        })}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white"
                                    >
                                        <option value="square">Proste</option>
                                        <option value="rounded">Zaokrąglone</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Pozycja Tekstu</label>
                                    <select
                                        value={section.mini_gallery_config?.textPosition || 'below'}
                                        onChange={(e) => onUpdate(section.id, {
                                            mini_gallery_config: { ...section.mini_gallery_config!, textPosition: e.target.value as any }
                                        })}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white"
                                    >
                                        <option value="below">Pod zdjęciem</option>
                                        <option value="overlay">Na zdjęciu</option>
                                        <option value="hover">Hover (Po najechaniu)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Gap (Odstęp)</label>
                                    <input
                                        type="range" min="0" max="10" step="1"
                                        value={(section.mini_gallery_config?.gap !== undefined ? section.mini_gallery_config.gap : 4)}
                                        onChange={(e) => onUpdate(section.id, {
                                            mini_gallery_config: { ...section.mini_gallery_config!, gap: parseInt(e.target.value) }
                                        })}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="space-y-4">
                            {section.mini_gallery_items?.map((item, idx) => (
                                <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex gap-4 items-start group hover:border-zinc-700 transition-colors">
                                    {/* Image Selector */}
                                    <div
                                        className="w-20 h-20 shrink-0 bg-zinc-950 rounded border border-zinc-800 flex items-center justify-center cursor-pointer hover:border-zinc-500 overflow-hidden relative"
                                        onClick={() => openMediaPicker(section.id, { target: 'single', context: 'mini_gallery_item', index: idx })}
                                    >
                                        {item.image ? (
                                            <img src={item.image} className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon size={20} className="text-zinc-600" />
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <p className="text-[10px] text-white">Zmień</p>
                                        </div>
                                    </div>

                                    {/* Inputs */}
                                    <div className="flex-1 space-y-2">
                                        <input
                                            type="text"
                                            value={item.title || ''}
                                            onChange={(e) => {
                                                const newItems = [...(section.mini_gallery_items || [])];
                                                newItems[idx] = { ...item, title: e.target.value };
                                                onUpdate(section.id, { mini_gallery_items: newItems });
                                            }}
                                            placeholder="Tytuł elementu..."
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:border-yellow-500 focus:outline-none"
                                        />
                                        <input
                                            type="text"
                                            value={item.description || ''}
                                            onChange={(e) => {
                                                const newItems = [...(section.mini_gallery_items || [])];
                                                newItems[idx] = { ...item, description: e.target.value };
                                                onUpdate(section.id, { mini_gallery_items: newItems });
                                            }}
                                            placeholder="Opis (opcjonalny)..."
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-400 focus:border-yellow-500 focus:outline-none"
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={item.link || ''}
                                                onChange={(e) => {
                                                    const newItems = [...(section.mini_gallery_items || [])];
                                                    newItems[idx] = { ...item, link: e.target.value };
                                                    onUpdate(section.id, { mini_gallery_items: newItems });
                                                }}
                                                placeholder="Link (np. /oferta)..."
                                                className="w-full flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-400 focus:border-yellow-500 focus:outline-none"
                                            />
                                            {/* Span Controls - optional enhancement */}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <button
                                        onClick={() => {
                                            const newItems = section.mini_gallery_items?.filter((_, i) => i !== idx);
                                            onUpdate(section.id, { mini_gallery_items: newItems });
                                        }}
                                        className="text-zinc-600 hover:text-red-500 p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}

                            <button
                                onClick={() => {
                                    const newItem: MiniGalleryItem = {
                                        id: crypto.randomUUID(),
                                        image: '',
                                        title: 'Nowy Element',
                                        spanCols: 1,
                                        spanRows: 1
                                    };
                                    onUpdate(section.id, { mini_gallery_items: [...(section.mini_gallery_items || []), newItem] });
                                }}
                                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-300 font-medium flex items-center justify-center gap-2 transition-colors"
                            >
                                <Plus size={16} /> Dodaj Element
                            </button>
                        </div>
                    </div>
                )}

                {/* STORY HERO - Premium Editorial Split Layout */}
                {section.type === 'story_hero' && (
                    <div className="space-y-4">
                        <div className="bg-zinc-950/30 p-3 rounded border border-zinc-800 mb-4">
                            <p className="text-xs text-zinc-500">
                                📖 <strong className="text-yellow-500">Story Hero:</strong> Editorial split layout with image + text. Uses premium typography.
                            </p>
                        </div>

                        {/* Image Selector */}
                        <div>
                            <label className="block text-xs text-zinc-400 mb-2">Featured Image</label>
                            <div className="flex gap-4 items-center">
                                {section.image && (
                                    <div className="relative w-32 h-40 rounded border border-zinc-700 overflow-hidden">
                                        <img src={section.image} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <button
                                    onClick={() => openMediaPicker(section.id, { target: 'single' })}
                                    className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-300 hover:text-white"
                                >
                                    {section.image ? 'Change Image' : 'Select Image'}
                                </button>
                            </div>
                        </div>

                        {/* Layout & Content */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Image Position</label>
                                <select
                                    value={section.layout || 'left'}
                                    onChange={(e) => onUpdate(section.id, { layout: e.target.value as 'left' | 'right' })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                >
                                    <option value="left">Left</option>
                                    <option value="right">Right</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Subtitle (Uppercase)</label>
                                <input
                                    type="text"
                                    value={section.subtitle || ''}
                                    onChange={(e) => onUpdate(section.id, { subtitle: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white uppercase"
                                    placeholder="NASZA PASJA"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Headline (H1)</label>
                            <input
                                type="text"
                                value={section.title || ''}
                                onChange={(e) => onUpdate(section.id, { title: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-lg"
                                placeholder="Chwile pełne emocji"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Story Content</label>
                            <RichTextEditor
                                value={section.content || ''}
                                onChange={(val) => onUpdate(section.id, { content: val })}
                                placeholder="Historia, emocje, narracja..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Button Text</label>
                                <input
                                    type="text"
                                    value={section.buttonText || ''}
                                    onChange={(e) => onUpdate(section.id, { buttonText: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                    placeholder="Zobacz portfolio"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Button Link</label>
                                <input
                                    type="text"
                                    value={section.buttonLink || ''}
                                    onChange={(e) => onUpdate(section.id, { buttonLink: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                    placeholder="/portfolio"
                                />
                            </div>
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

                {/* STORIES GRID EDITOR */}
                {section.type === 'stories_grid' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Tytuł Sekcji</label>
                                <input type="text" value={section.title || ''} onChange={e => onUpdate(section.id, { title: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Podtytuł</label>
                                <input type="text" value={section.subtitle || ''} onChange={e => onUpdate(section.id, { subtitle: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase">Kafelki Historii</h4>
                            <button
                                onClick={() => {
                                    const newStory: StoryGridItem = { id: Math.random().toString(36).substr(2, 9), title: 'Nowa Historia', image: '', link: '', category: 'Reportaż' };
                                    onUpdate(section.id, { stories_items: [...(section.stories_items || []), newStory] });
                                }}
                                className="text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded border border-pink-500/30 font-bold"
                            >
                                + DODAJ HISTORIĘ
                            </button>
                        </div>
                        <div className="space-y-3">
                            {(section.stories_items || []).map((story, idx) => (
                                <div key={story.id} className="bg-zinc-800 p-3 rounded border border-zinc-700 flex gap-4 items-start">
                                    <div className="w-16 h-24 shrink-0 bg-zinc-900 border border-zinc-600 rounded overflow-hidden relative group cursor-pointer"
                                        onClick={() => openMediaPicker(section.id, { target: 'single', context: 'story_cover', index: idx })}
                                    >
                                        {story.image ? <img src={story.image} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-zinc-600"><ImageIcon size={16} /></div>}
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-white font-bold uppercase">Zmień</div>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <input type="text" value={story.title} onChange={e => { const up = [...section.stories_items!]; up[idx].title = e.target.value; onUpdate(section.id, { stories_items: up }); }} placeholder="Tytuł Historii" className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white" />
                                        <input type="text" value={story.link} onChange={e => { const up = [...section.stories_items!]; up[idx].link = e.target.value; onUpdate(section.id, { stories_items: up }); }} placeholder="Link (np. /historie/asia-i-tomek)" className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-blue-400" />
                                        <input type="text" value={story.category} onChange={e => { const up = [...section.stories_items!]; up[idx].category = e.target.value; onUpdate(section.id, { stories_items: up }); }} placeholder="Kategoria" className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-400" />
                                    </div>
                                    <button onClick={() => onUpdate(section.id, { stories_items: section.stories_items!.filter((_, i) => i !== idx) })} className="text-zinc-500 hover:text-red-500"><Trash2 size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* CHRONOLOGICAL GALLERY EDITOR */}
                {section.type === 'chronological_gallery' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Tytuł Galerii</label>
                                <input type="text" value={section.title || ''} onChange={e => onUpdate(section.id, { title: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Układ</label>
                                <select
                                    value={section.gallery_layout || 'grid'}
                                    onChange={e => onUpdate(section.id, { gallery_layout: e.target.value as any })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-xs"
                                >
                                    <option value="grid">Siatka (Grid)</option>
                                    <option value="list">Lista (Kolumna)</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase">Zdjęcia ({section.chronological_items?.length || 0})</h4>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onUpdate(section.id, { chronological_items: [] })}
                                    className="text-xs text-red-500 hover:text-red-400 px-2 py-1"
                                >
                                    Wyczyść
                                </button>
                                <button
                                    onClick={() => openMediaPicker(section.id, { target: 'gallery', context: 'chronological' })}
                                    className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded border border-cyan-500/30 font-bold"
                                >
                                    + DODAJ MASOWO
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 bg-zinc-900/50 rounded border border-zinc-800">
                            {(section.chronological_items || []).map((item, idx) => (
                                <div key={item.id || idx} className="relative aspect-square group">
                                    <img src={item.image} className="w-full h-full object-cover rounded bg-zinc-800" />
                                    <button
                                        onClick={() => onUpdate(section.id, { chronological_items: section.chronological_items!.filter((_, i) => i !== idx) })}
                                        className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                    <input
                                        type="text"
                                        value={item.description || ''}
                                        onChange={(e) => {
                                            const items = [...section.chronological_items!];
                                            items[idx].description = e.target.value;
                                            onUpdate(section.id, { chronological_items: items });
                                        }}
                                        placeholder="Opis..."
                                        className="absolute bottom-0 left-0 w-full bg-black/70 text-[8px] text-white px-1 border-none focus:ring-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    />
                                </div>
                            ))}
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
                            <div className="flex items-center gap-6">
                                <div className="flex-1">
                                    <label className="block text-xs text-zinc-400 mb-2 font-bold uppercase tracking-tight">Pokaż Tytuł w Sliderze</label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={section.showCategoryTitle || false}
                                            onChange={(e) => onUpdate(section.id, { showCategoryTitle: e.target.checked })}
                                            className="w-4 h-4 rounded border-zinc-600 text-yellow-500"
                                        />
                                        <span className="text-sm text-zinc-300">Wyświetl nagłówek i kategorię</span>
                                    </label>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs text-zinc-400 mb-2 font-bold uppercase tracking-tight">Czas zmiany (sekundy)</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            max="60"
                                            value={section.switchInterval || 8}
                                            onChange={(e) => onUpdate(section.id, { switchInterval: parseInt(e.target.value) || 8 })}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                                        />
                                    </div>
                                </div>
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
                                                <label className="block text-xs text-zinc-500 mb-1">Opis / Podtytuł kategorii...</label>
                                                <RichTextEditor
                                                    value={ts.description || ''}
                                                    onChange={(val) => {
                                                        const updated = [...(section.thermalSections || [])];
                                                        updated[tsIndex] = { ...ts, description: val };
                                                        onUpdate(section.id, { thermalSections: updated });
                                                    }}
                                                    placeholder="Opis / Podtytuł kategorii..."
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
                                            <div className="flex flex-col gap-2 shrink-0">
                                                <div className="w-24 h-24 relative rounded border border-zinc-600 overflow-hidden bg-zinc-900">
                                                    {slide.image ? (
                                                        <img src={slide.image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                                            <ImageIcon size={24} />
                                                        </div>
                                                    )}
                                                    <div className="absolute top-0 left-0 bg-black/60 px-1 py-0.5 text-[8px] text-white font-bold uppercase">PO (MAIN)</div>
                                                    <button
                                                        onClick={() => { openMediaPicker(section.id, { target: 'single', index: sIndex }); }}
                                                        className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
                                                    >
                                                        <span className="text-[10px] text-white font-bold uppercase">Zmień</span>
                                                    </button>
                                                </div>

                                                {slide.is_before_after && (
                                                    <div className="w-24 h-24 relative rounded border border-zinc-600 overflow-hidden bg-zinc-900">
                                                        {slide.before_image ? (
                                                            <img src={slide.before_image} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                                                <ImageIcon size={24} />
                                                            </div>
                                                        )}
                                                        <div className="absolute top-0 left-0 bg-yellow-500/80 px-1 py-0.5 text-[8px] text-black font-bold uppercase">PRZED</div>
                                                        <button
                                                            onClick={() => { openMediaPicker(section.id, { target: 'single', context: 'before', index: sIndex }); }}
                                                            className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
                                                        >
                                                            <span className="text-[10px] text-white font-bold uppercase">Zmień</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-2 pb-2 border-b border-zinc-700/50">
                                                    <input
                                                        type="checkbox"
                                                        checked={slide.is_before_after || false}
                                                        onChange={(e) => {
                                                            const updated = [...(section.slides || [])];
                                                            updated[sIndex] = { ...slide, is_before_after: e.target.checked };
                                                            onUpdate(section.id, { slides: updated });
                                                        }}
                                                        className="rounded bg-zinc-700 border-zinc-600 text-yellow-500 focus:ring-yellow-500/50"
                                                    />
                                                    <label className="text-xs text-yellow-500 font-bold uppercase tracking-wider">Tryb "Przed i Po"</label>
                                                </div>
                                                <div className="text-[10px] text-zinc-500 font-mono mb-1">
                                                    Wsparcie dla HTML: <span className="text-yellow-500">&lt;span class="text-yellow-500"&gt;text&lt;/span&gt;</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <textarea
                                                        value={slide.title || ''}
                                                        onChange={(e) => {
                                                            const updated = [...(section.slides || [])];
                                                            updated[sIndex] = { ...slide, title: e.target.value };
                                                            onUpdate(section.id, { slides: updated });
                                                        }}
                                                        placeholder="Tytuł Slajdu (HTML)"
                                                        className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-sm text-white h-16 font-mono"
                                                    />
                                                    <textarea
                                                        value={slide.subtitle || ''}
                                                        onChange={(e) => {
                                                            const updated = [...(section.slides || [])];
                                                            updated[sIndex] = { ...slide, subtitle: e.target.value };
                                                            onUpdate(section.id, { slides: updated });
                                                        }}
                                                        placeholder="Podtytuł (HTML)"
                                                        className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-sm text-white h-12 font-mono"
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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                            <div>
                                <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Etykieta "Verified"</label>
                                <input
                                    type="text"
                                    value={section.verifiedTag || ''}
                                    onChange={(e) => onUpdate(section.id, { verifiedTag: e.target.value })}
                                    placeholder="np. Dokument Zweryfikowany"
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Typ Certyfikatu (Tag)</label>
                                <input
                                    type="text"
                                    value={section.certTag || ''}
                                    onChange={(e) => onUpdate(section.id, { certTag: e.target.value })}
                                    placeholder="np. Certyfikat Oficjalny"
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Etykieta Opisu</label>
                                <input
                                    type="text"
                                    value={section.descriptionLabel || ''}
                                    onChange={(e) => onUpdate(section.id, { descriptionLabel: e.target.value })}
                                    placeholder="np. Zakres uprawnień"
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                                />
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

                {/* B2B VIDEO */}
                {section.type === 'b2b_video' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Tytuł Sekcji (opcjonalnie)</label>
                                <input type="text" value={section.title || ''} onChange={e => onUpdate(section.id, { title: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white" />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Podtytuł</label>
                                <input type="text" value={section.subtitle || ''} onChange={e => onUpdate(section.id, { subtitle: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Typ Wideo</label>
                                <select
                                    value={section.videoType || 'youtube'}
                                    onChange={e => onUpdate(section.id, { videoType: e.target.value as any })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                                >
                                    <option value="youtube">YouTube</option>
                                    <option value="vimeo">Vimeo</option>
                                    <option value="direct">Bezpośredni Link (S3/MP4)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Layout</label>
                                <select
                                    value={section.sectionLayout || 'full'}
                                    onChange={e => onUpdate(section.id, { sectionLayout: e.target.value as any })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                                >
                                    <option value="full">Pełna Szerokość (Full Width)</option>
                                    <option value="centered">Wyśrodkowany (Contained)</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">URL Wideo / ID</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={section.videoUrl || ''}
                                    onChange={e => onUpdate(section.id, { videoUrl: e.target.value })}
                                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                                    placeholder={section.videoType === 'direct' ? 'https://.../video.mp4' : 'ID filmu lub pełny URL'}
                                />
                                {section.videoType === 'direct' && (
                                    <button onClick={() => { openMediaPicker(section.id, { target: 'single' }); }} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-white border border-zinc-700">Wybierz Plik</button>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-6 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={section.videoAutoPlay} onChange={e => onUpdate(section.id, { videoAutoPlay: e.target.checked })} className="rounded bg-zinc-800 border-zinc-700 text-yellow-500" />
                                <span className="text-xs text-zinc-400 group-hover:text-white transition-colors">Autoodtwarzanie</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={section.videoMuted} onChange={e => onUpdate(section.id, { videoMuted: e.target.checked })} className="rounded bg-zinc-800 border-zinc-700 text-yellow-500" />
                                <span className="text-xs text-zinc-400 group-hover:text-white transition-colors">Wyciszony</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={section.videoLoop} onChange={e => onUpdate(section.id, { videoLoop: e.target.checked })} className="rounded bg-zinc-800 border-zinc-700 text-yellow-500" />
                                <span className="text-xs text-zinc-400 group-hover:text-white transition-colors">Pętla</span>
                            </label>
                        </div>
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex-1">
                                <label className="block text-xs text-zinc-500 mb-1">Tło (Image URL)</label>
                                <div className="flex gap-2">
                                    <input type="text" value={section.image || ''} onChange={e => onUpdate(section.id, { image: e.target.value })} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white" />
                                    <button onClick={() => { openMediaPicker(section.id, { target: 'single' }); }} className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-white uppercase font-bold">Wybierz</button>
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-zinc-500 mb-1">Wideo w tle (Opcjonalnie)</label>
                                <div className="flex gap-2">
                                    <input type="text" value={section.videoUrl || ''} onChange={e => onUpdate(section.id, { videoUrl: e.target.value })} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white" placeholder="URL YouTube/Vimeo/MP4" />
                                    <button onClick={() => { openMediaPicker(section.id, { target: 'single', context: 'video' as any }); }} className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-white uppercase font-bold">Plik</button>
                                </div>
                            </div>
                        </div>

                        {section.videoUrl && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Typ Wideo</label>
                                    <select
                                        value={section.videoType || 'youtube'}
                                        onChange={e => onUpdate(section.id, { videoType: e.target.value as any })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                                    >
                                        <option value="youtube">YouTube</option>
                                        <option value="vimeo">Vimeo</option>
                                        <option value="direct">Bezpośredni Link (MP4)</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-4 pt-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={section.videoAutoPlay !== false} onChange={e => onUpdate(section.id, { videoAutoPlay: e.target.checked })} className="rounded bg-zinc-800 border-zinc-700 text-yellow-500" />
                                        <span className="text-xs text-zinc-400">Autoplay</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={section.videoMuted !== false} onChange={e => onUpdate(section.id, { videoMuted: e.target.checked })} className="rounded bg-zinc-800 border-zinc-700 text-yellow-500" />
                                        <span className="text-xs text-zinc-400">Wyciszony</span>
                                    </label>
                                </div>
                            </div>
                        )}

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

                        {/* Logo Size Control */}
                        <div className="bg-zinc-800 p-3 rounded border border-zinc-700">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs text-zinc-400 font-bold uppercase">Wielkość Logotypów</label>
                                <span className="text-yellow-500 text-xs font-mono">{section.logoHeight || 40}px</span>
                            </div>
                            <input
                                type="range"
                                min="20"
                                max="120"
                                step="5"
                                value={section.logoHeight || 40}
                                onChange={(e) => onUpdate(section.id, { logoHeight: parseInt(e.target.value) })}
                                className="w-full accent-yellow-500"
                            />
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
                            <div className="col-span-2">
                                <label className="block text-xs text-zinc-500 mb-1">Główny Opis Sekcji</label>
                                <textarea
                                    value={section.description || ''}
                                    onChange={e => onUpdate(section.id, { description: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-300 h-20"
                                    placeholder="Dostarczamy dane najwyższej jakości..."
                                />
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
                                <div key={cse.id} className="bg-zinc-800 p-4 rounded border border-zinc-700 space-y-3 relative group">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm("Czy na pewno usunąć ten projekt?")) {
                                                onUpdate(section.id, { b2b_cases: section.b2b_cases!.filter((_, i) => i !== cIndex) });
                                            }
                                        }}
                                        className="absolute top-2 right-2 text-zinc-500 hover:text-red-500 z-10 bg-zinc-800/80 rounded-full p-1"
                                        title="Usuń projekt"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    <div className="flex gap-4 items-start pr-6">
                                        <div className="w-24 h-24 bg-zinc-900 rounded border border-zinc-700 overflow-hidden relative group/img shrink-0">
                                            {cse.image ? <img src={cse.image} className="w-full h-full object-cover" /> : <ImageIcon className="m-auto mt-8 text-zinc-800" size={24} />}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                                <button onClick={() => { openMediaPicker(section.id, { target: 'single', index: cIndex }); }} className="p-1.5 bg-zinc-700 hover:bg-zinc-600 rounded text-white" title="Zmień okładkę"><ImageIcon size={14} /></button>
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <input type="text" value={cse.title} onChange={e => { const up = [...section.b2b_cases!]; up[cIndex].title = e.target.value; onUpdate(section.id, { b2b_cases: up }); }} placeholder="Tytuł projektu" className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white font-bold" />
                                            <input type="text" value={cse.client} onChange={e => { const up = [...section.b2b_cases!]; up[cIndex].client = e.target.value; onUpdate(section.id, { b2b_cases: up }); }} placeholder="Nazwa klienta" className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-yellow-500 font-bold" />
                                            <div className="flex gap-2">
                                                <div className="flex items-center gap-2 flex-1">
                                                    {cse.logo && <img src={cse.logo} className="h-6 w-auto opacity-50" />}
                                                    <button onClick={() => openMediaPicker(section.id, { target: 'single', context: 'case_logo', index: cIndex })} className={`flex-1 py-1 text-[10px] uppercase font-bold rounded border ${cse.logo ? 'bg-purple-900/20 text-purple-400 border-purple-500/30' : 'bg-zinc-700 text-zinc-400 border-transparent'}`}>
                                                        {cse.logo ? 'Zmień Logo' : '+ Logo'}
                                                    </button>
                                                </div>
                                                <button onClick={() => openMediaPicker(section.id, { target: 'single', context: 'case_video', index: cIndex })} className={`flex-1 py-1 text-[10px] uppercase font-bold rounded border ${cse.videoUrl ? 'bg-blue-900/20 text-blue-400 border-blue-500/30' : 'bg-zinc-700 text-zinc-400 border-transparent'}`}>
                                                    {cse.videoUrl ? 'Wideo Dodane' : '+ Wideo'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <textarea
                                        value={cse.description}
                                        onChange={e => { const up = [...section.b2b_cases!]; up[cIndex].description = e.target.value; onUpdate(section.id, { b2b_cases: up }); }}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-2 text-xs text-zinc-300 font-sans min-h-[100px]"
                                        placeholder="Opis realizacji (HTML)..."
                                    />
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-zinc-600">ID: {cse.id}</span>
                                    </div>
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
                                </div >
                            ))
                            }
                        </div >
                    </div >
                )}

                {/* B2B RFQ */}
                {
                    section.type === 'b2b_contact' && (
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
                    )
                }

                {/* THERMAL HERO SLIDER */}
                {
                    section.type === 'thermal_hero' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 bg-zinc-800/30 p-4 rounded-xl border border-zinc-700/50 mb-4">
                                <div>
                                    <label className="block text-[10px] text-zinc-500 uppercase font-black mb-1">Czas zmiany (sekundy)</label>
                                    <input
                                        type="number"
                                        value={section.switchInterval || 10}
                                        onChange={e => onUpdate(section.id, { switchInterval: parseInt(e.target.value) })}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                                        placeholder="np. 10"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Slajdy Thermal Hero</h4>
                                <button
                                    onClick={() => {
                                        const newSlide: ThermalHeroSlide = {
                                            id: Math.random().toString(36).substr(2, 9),
                                            category: 'ANALIZA TERMICZNA',
                                            title: 'Tytuł <span class="text-yellow-500">Slajdu</span>',
                                            visualMedia: '',
                                            thermalMedia: '',
                                            mediaType: 'image'
                                        };
                                        onUpdate(section.id, { thermal_hero_slides: [...(section.thermal_hero_slides || []), newSlide] });
                                    }}
                                    className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold rounded hover:bg-yellow-500/30 transition-all flex items-center gap-1"
                                >
                                    <Plus size={14} /> Dodaj slajd
                                </button>
                            </div>
                            {(section.thermal_hero_slides || []).map((slide, sIndex) => (
                                <div key={slide.id} className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700 space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <input type="text" value={slide.category} onChange={e => { const up = [...section.thermal_hero_slides!]; up[sIndex].category = e.target.value; onUpdate(section.id, { thermal_hero_slides: up }); }} className="bg-zinc-700 border border-zinc-600 rounded px-3 py-1 text-xs text-yellow-500 font-black uppercase tracking-widest" placeholder="Kategoria" />
                                        <button onClick={() => onUpdate(section.id, { thermal_hero_slides: section.thermal_hero_slides!.filter((_, i) => i !== sIndex) })} className="text-zinc-500 hover:text-red-500"><Trash2 size={16} /></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] text-zinc-500 uppercase font-black mb-1">Widok Optyczny (L)</label>
                                                <div className="flex gap-2">
                                                    <div className="w-16 h-16 bg-zinc-900 rounded overflow-hidden border border-zinc-600 shrink-0">
                                                        {slide.visualMedia && (slide.mediaType === 'video' ? <Video className="m-auto mt-5 text-zinc-700" size={20} /> : <img src={slide.visualMedia} className="w-full h-full object-cover" />)}
                                                    </div>
                                                    <button onClick={() => openMediaPicker(section.id, { target: 'single', context: 'visual', index: sIndex })} className="flex-1 bg-zinc-700 hover:bg-zinc-600 rounded text-[10px] font-bold text-zinc-300 uppercase px-2">Wybierz Media</button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-zinc-500 uppercase font-black mb-1">Widok Termiczny (R)</label>
                                                <div className="flex gap-2">
                                                    <div className="w-16 h-16 bg-zinc-900 rounded overflow-hidden border border-zinc-600 shrink-0">
                                                        {slide.thermalMedia && (slide.mediaType === 'video' ? <Video className="m-auto mt-5 text-zinc-700" size={20} /> : <img src={slide.thermalMedia} className="w-full h-full object-cover" />)}
                                                    </div>
                                                    <button onClick={() => openMediaPicker(section.id, { target: 'single', context: 'thermal', index: sIndex })} className="flex-1 bg-zinc-700 hover:bg-zinc-600 rounded text-[10px] font-bold text-zinc-300 uppercase px-2">Wybierz Media</button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <select value={slide.mediaType || 'image'} onChange={e => { const up = [...section.thermal_hero_slides!]; up[sIndex].mediaType = e.target.value as any; onUpdate(section.id, { thermal_hero_slides: up }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-xs text-white">
                                                <option value="image">Format: Zdjęcie</option>
                                                <option value="video">Format: Wideo</option>
                                            </select>
                                            <input type="text" value={slide.title} onChange={e => { const up = [...section.thermal_hero_slides!]; up[sIndex].title = e.target.value; onUpdate(section.id, { thermal_hero_slides: up }); }} placeholder="Tytuł Slajdu (HTML)" className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-xs text-white" />
                                            <input type="text" value={slide.subtitle || ''} onChange={e => { const up = [...section.thermal_hero_slides!]; up[sIndex].subtitle = e.target.value; onUpdate(section.id, { thermal_hero_slides: up }); }} placeholder="Podtytuł" className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-400" />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="text" value={slide.buttonText || ''} onChange={e => { const up = [...section.thermal_hero_slides!]; up[sIndex].buttonText = e.target.value; onUpdate(section.id, { thermal_hero_slides: up }); }} placeholder="Tekst przycisku" className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-[10px] text-white" />
                                                <input type="text" value={slide.buttonLink || ''} onChange={e => { const up = [...section.thermal_hero_slides!]; up[sIndex].buttonLink = e.target.value; onUpdate(section.id, { thermal_hero_slides: up }); }} placeholder="Link przycisku" className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-[10px] text-zinc-400" />
                                            </div>
                                            <select value={slide.buttonStyle || 'gold'} onChange={e => { const up = [...section.thermal_hero_slides!]; up[sIndex].buttonStyle = e.target.value as any; onUpdate(section.id, { thermal_hero_slides: up }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-[10px] text-white">
                                                <option value="gold">Styl: Gold</option>
                                                <option value="white">Styl: White</option>
                                                <option value="transparent">Styl: Transparent</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                }

                {/* HERO VIDEO SLIDER */}
                {
                    section.type === 'hero_video' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Slajdy Wideo Hero</h4>
                                <button
                                    onClick={() => {
                                        const newSlide: any = { id: Math.random().toString(36).substr(2, 9), title: 'Tytuł Wideo', videoUrl: '', overlayOpacity: 0.4 };
                                        onUpdate(section.id, { slides: [...(section.slides || []), newSlide] });
                                    }}
                                    className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold rounded hover:bg-blue-500/30 transition-all flex items-center gap-1"
                                >
                                    <Plus size={14} /> Dodaj slajd
                                </button>
                            </div>
                            {(section.slides || []).map((slide, sIndex) => (
                                <div key={slide.id} className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <div className="w-16 h-16 bg-zinc-900 rounded border border-zinc-600 flex items-center justify-center text-blue-500 shrink-0">
                                                <Video size={24} />
                                            </div>
                                            <button onClick={() => openMediaPicker(section.id, { target: 'single', index: sIndex })} className="flex-1 bg-zinc-700 hover:bg-zinc-600 rounded text-[10px] font-bold text-zinc-300 uppercase px-2">Wgraj Wideo</button>
                                        </div>
                                        <input type="text" value={slide.title} onChange={e => { const up = [...section.slides!]; up[sIndex].title = e.target.value; onUpdate(section.id, { slides: up }); }} placeholder="Tytuł" className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <input type="text" value={slide.subtitle || ''} onChange={e => { const up = [...section.slides!]; up[sIndex].subtitle = e.target.value; onUpdate(section.id, { slides: up }); }} placeholder="Podtytuł" className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-400" />
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-zinc-500 uppercase font-black">Overlay</span>
                                            <input type="range" min="0" max="1" step="0.1" value={slide.overlayOpacity ?? 0.4} onChange={e => { const up = [...section.slides!]; (up[sIndex] as any).overlayOpacity = parseFloat(e.target.value); onUpdate(section.id, { slides: up }); }} className="flex-1" />
                                        </div>
                                        <button onClick={() => onUpdate(section.id, { slides: section.slides!.filter((_, i) => i !== sIndex) })} className="w-full py-1 text-[10px] font-bold text-red-500 hover:bg-red-500/10 rounded border border-red-500/20 uppercase transition-all">Usuń Slajd</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                }

                {/* PARALLAX VIDEO */}
                {
                    section.type === 'parallax_video' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs text-zinc-500 mb-1">Wideo Paralaksa</label>
                                        <div className="flex gap-3">
                                            <div className="w-20 h-20 bg-zinc-900 rounded border border-zinc-700 flex items-center justify-center text-purple-500 shrink-0">
                                                <Video size={32} />
                                            </div>
                                            <button onClick={() => openMediaPicker(section.id, { target: 'single' })} className="flex-1 border-2 border-dashed border-zinc-700 rounded text-xs font-bold text-zinc-500 hover:text-white hover:border-zinc-500 transition-all uppercase">Wybierz Wideo</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-zinc-500 mb-1">Tytuł (HTML)</label>
                                        <div className="text-[10px] text-zinc-500 font-mono mb-1">
                                            Wsparcie dla HTML: <span className="text-yellow-500">&lt;span class="text-yellow-500"&gt;text&lt;/span&gt;</span>
                                        </div>
                                        <textarea
                                            value={section.title || ''}
                                            onChange={e => onUpdate(section.id, { title: e.target.value })}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white font-bold h-20 font-mono"
                                            placeholder="Tytuł sekcji..."
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs text-zinc-500 mb-1">Podtytuł</label>
                                        <input type="text" value={section.subtitle || ''} onChange={e => onUpdate(section.id, { subtitle: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-400" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-zinc-500 mb-1">Overlay Opacity</label>
                                        <input type="number" step="0.1" min="0" max="1" value={section.overlayOpacity ?? 0.4} onChange={e => onUpdate(section.id, { overlayOpacity: parseFloat(e.target.value) })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-zinc-500 mb-1">Animacja Tekstu</label>
                                        <select
                                            value={section.textAnimation || 'slide-up'}
                                            onChange={e => onUpdate(section.id, { textAnimation: e.target.value as any })}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                                        >
                                            <option value="fade">Zanikanie (Fade)</option>
                                            <option value="slide-up">Wjazd od dołu (Slide Up)</option>
                                            <option value="scale">Powiększenie (Scale)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* MAGAZINE LAYOUT */}
                {
                    section.type === 'magazine_layout' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-2">Główne Zdjęcie</label>
                                    <div className="flex gap-4 items-center">
                                        {section.image && (
                                            <div className="relative w-24 h-32 rounded border border-zinc-700 overflow-hidden">
                                                <img src={section.image} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => openMediaPicker(section.id, { target: 'single' })}
                                            className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 hover:text-white"
                                        >
                                            Wybierz
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-2">Drugie Zdjęcie (Detail)</label>
                                    <div className="flex gap-4 items-center">
                                        {section.secondaryImage && (
                                            <div className="relative w-24 h-32 rounded border border-zinc-700 overflow-hidden">
                                                <img src={section.secondaryImage} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => openMediaPicker(section.id, { target: 'single', context: 'secondary' })}
                                            className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 hover:text-white"
                                        >
                                            Wybierz
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Układ</label>
                                    <select
                                        value={section.layout || 'left'}
                                        onChange={(e) => onUpdate(section.id, { layout: e.target.value as any })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                    >
                                        <option value="left">Zdjęcie Główne Lewo</option>
                                        <option value="right">Zdjęcie Główne Prawo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Tag (Uppercase)</label>
                                    <input
                                        type="text"
                                        value={section.subtitle || ''}
                                        onChange={(e) => onUpdate(section.id, { subtitle: e.target.value })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Tytuł (Headline)</label>
                                <input
                                    type="text"
                                    value={section.title || ''}
                                    onChange={(e) => onUpdate(section.id, { title: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Treść</label>
                                <RichTextEditor
                                    value={section.content || ''}
                                    onChange={(val) => onUpdate(section.id, { content: val })}
                                />
                            </div>
                        </div>
                    )
                }

                {/* MASONRY GALLERY */}
                {
                    section.type === 'masonry_gallery' && (
                        <div className="space-y-4">
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
                                    <label className="block text-xs text-zinc-400 mb-1">Tag</label>
                                    <input
                                        type="text"
                                        value={section.subtitle || ''}
                                        onChange={(e) => onUpdate(section.id, { subtitle: e.target.value })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {section.images?.map((img, idx) => (
                                    <div key={idx} className="relative group w-20 h-20">
                                        <img src={img} alt="" className="w-full h-full object-cover rounded border border-zinc-700" />
                                        <button
                                            onClick={() => {
                                                const newImages = section.images?.filter((_, i) => i !== idx);
                                                onUpdate(section.id, { images: newImages });
                                            }}
                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => openMediaPicker(section.id, { target: 'gallery' })}
                                    className="w-20 h-20 flex items-center justify-center border-2 border-dashed border-zinc-700 rounded text-zinc-500 hover:text-zinc-300"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )
                }

                {/* CLIENT STORY */}
                {
                    section.type === 'client_story' && (
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="shrink-0">
                                    <label className="block text-xs text-zinc-400 mb-2">Zdjęcie Klienta</label>
                                    <div className="relative w-24 h-32 rounded border border-zinc-700 overflow-hidden bg-zinc-800">
                                        {section.image ? (
                                            <img src={section.image} className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="m-auto mt-8 text-zinc-700" size={24} />
                                        )}
                                        <button onClick={() => openMediaPicker(section.id, { target: 'single' })} className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold uppercase">Zmień</button>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-zinc-400 mb-1">Imię Klienta / Pary</label>
                                            <input
                                                type="text"
                                                value={section.tag || ''}
                                                onChange={(e) => onUpdate(section.id, { tag: e.target.value })}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-400 mb-1">Tytuł Historii</label>
                                            <input
                                                type="text"
                                                value={section.title || ''}
                                                onChange={(e) => onUpdate(section.id, { title: e.target.value })}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-zinc-400 mb-1">Lokalizacja</label>
                                            <input
                                                type="text"
                                                value={section.subtitle || ''}
                                                onChange={(e) => onUpdate(section.id, { subtitle: e.target.value })}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-400 mb-1">Data</label>
                                            <input
                                                type="text"
                                                value={section.buttonText || ''}
                                                onChange={(e) => onUpdate(section.id, { buttonText: e.target.value })}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Testimonial (Treść)</label>
                                <RichTextEditor
                                    value={section.content || ''}
                                    onChange={(val) => onUpdate(section.id, { content: val })}
                                />
                            </div>
                        </div>
                    )
                }

                {/* PROCESS TIMELINE */}
                {
                    section.type === 'process_timeline' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Tytuł Sekcji</label>
                                    <input type="text" value={section.title || ''} onChange={e => onUpdate(section.id, { title: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Podtytuł</label>
                                    <input type="text" value={section.subtitle || ''} onChange={e => onUpdate(section.id, { subtitle: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase">Kroki Procesu</h4>
                                <button
                                    onClick={() => {
                                        const nextNum = (section.b2b_process?.length || 0) + 1;
                                        const newStep: B2BProcessStep = { id: Math.random().toString(36).substr(2, 9), title: 'Nowy Krok', description: 'Opis...', stepNumber: `0${nextNum}` };
                                        onUpdate(section.id, { b2b_process: [...(section.b2b_process || []), newStep] });
                                    }}
                                    className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded border border-yellow-500/30 font-bold"
                                >
                                    + DODAJ KROK
                                </button>
                            </div>
                            <div className="space-y-3">
                                {(section.b2b_process || []).map((step, pIndex) => (
                                    <div key={step.id} className="bg-zinc-800 p-4 rounded border border-zinc-700 flex gap-4 items-start">
                                        <input type="text" value={step.stepNumber} onChange={e => { const up = [...section.b2b_process!]; up[pIndex].stepNumber = e.target.value; onUpdate(section.id, { b2b_process: up }); }} className="w-12 bg-zinc-900 border border-zinc-700 rounded text-center py-1 text-sm text-yellow-500 font-bold" />
                                        <div className="flex-1 space-y-2">
                                            <input type="text" value={step.title} onChange={e => { const up = [...section.b2b_process!]; up[pIndex].title = e.target.value; onUpdate(section.id, { b2b_process: up }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-sm text-white font-bold" />
                                            <textarea value={step.description} onChange={e => { const up = [...section.b2b_process!]; up[pIndex].description = e.target.value; onUpdate(section.id, { b2b_process: up }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-xs text-zinc-400 h-16" />
                                        </div>
                                        <button onClick={() => onUpdate(section.id, { b2b_process: section.b2b_process!.filter((_, i) => i !== pIndex) })} className="text-zinc-600 hover:text-red-500"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {/* INVESTMENT TEASER */}
                {
                    section.type === 'investment_teaser' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Tytuł Sekcji</label>
                                    <input type="text" value={section.title || ''} onChange={e => onUpdate(section.id, { title: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Podtytuł</label>
                                    <input type="text" value={section.subtitle || ''} onChange={e => onUpdate(section.id, { subtitle: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase">Pakiety Ofertowe</h4>
                                <button
                                    onClick={() => {
                                        const newPkg: FeatureItem = { id: Math.random().toString(36).substr(2, 9), title: 'Nowy Pakiet', items: ['Cecha 1'], enabled: true, buttonText: 'od 1500 zł' };
                                        onUpdate(section.id, { features: [...(section.features || []), newPkg] });
                                    }}
                                    className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded border border-green-500/30 font-bold"
                                >
                                    + DODAJ PAKIET
                                </button>
                            </div>
                            <div className="space-y-4">
                                {(section.features || []).map((pkg, fIndex) => (
                                    <div key={pkg.id} className="bg-zinc-800 p-4 rounded border border-zinc-700 space-y-3">
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="block text-[8px] text-zinc-500 uppercase mb-1">Nazwa Pakietu</label>
                                                <input type="text" value={pkg.title} onChange={e => { const up = [...section.features!]; up[fIndex].title = e.target.value; onUpdate(section.id, { features: up }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white font-bold" />
                                            </div>
                                            <div className="w-32">
                                                <label className="block text-[8px] text-zinc-500 uppercase mb-1">Cena (Tekst)</label>
                                                <input type="text" value={pkg.buttonText || ''} onChange={e => { const up = [...section.features!]; up[fIndex].buttonText = e.target.value; onUpdate(section.id, { features: up }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-yellow-500 font-bold" />
                                            </div>
                                            <div className="flex items-center pt-4">
                                                <label className="flex items-center gap-1 cursor-pointer">
                                                    <input type="checkbox" checked={pkg.enabled} onChange={e => { const up = [...section.features!]; up[fIndex].enabled = e.target.checked; onUpdate(section.id, { features: up }); }} className="rounded bg-zinc-900" />
                                                    <span className="text-[10px] text-zinc-400">Popular</span>
                                                </label>
                                            </div>
                                            <button onClick={() => onUpdate(section.id, { features: section.features!.filter((_, i) => i !== fIndex) })} className="text-zinc-600 hover:text-red-500 pt-4"><Trash2 size={16} /></button>
                                        </div>
                                        <textarea value={pkg.items.join(', ')} onChange={e => { const up = [...section.features!]; up[fIndex].items = e.target.value.split(',').map(s => s.trim()).filter(Boolean); onUpdate(section.id, { features: up }); }} placeholder="Cechy (oddziel przecinkami)..." className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-400 h-16" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {/* NARRATIVE TEXT */}
                {
                    section.type === 'narrative_text' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Tytuł (Headline)</label>
                                    <input type="text" value={section.title || ''} onChange={e => onUpdate(section.id, { title: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Podtytuł</label>
                                    <input type="text" value={section.subtitle || ''} onChange={e => onUpdate(section.id, { subtitle: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Kolumny</label>
                                    <select value={section.layout || 'left'} onChange={e => onUpdate(section.id, { layout: e.target.value as any })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white">
                                        <option value="left">1 Kolumna</option>
                                        <option value="right">2 Kolumny</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                    <input type="checkbox" checked={section.showCategoryTitle ?? true} onChange={e => onUpdate(section.id, { showCategoryTitle: e.target.checked })} className="rounded bg-zinc-800" />
                                    <label className="text-xs text-zinc-400">Pokaż Inicjał (Drop Cap)</label>
                                </div>
                            </div>
                            <div>
                                <RichTextEditor
                                    value={section.content || ''}
                                    onChange={(val) => onUpdate(section.id, { content: val })}
                                />
                            </div>
                        </div>
                    )
                }

                {/* FEATURED CAROUSEL */}
                {
                    section.type === 'featured_carousel' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Tytuł Sekcji</label>
                                    <input type="text" value={section.title || ''} onChange={e => onUpdate(section.id, { title: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Podtytuł</label>
                                    <input type="text" value={section.subtitle || ''} onChange={e => onUpdate(section.id, { subtitle: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase">Slajdy Karuzeli</h4>
                                <button
                                    onClick={() => {
                                        const newSlide: SliderSlide = { id: Math.random().toString(36).substr(2, 9), image: '', title: 'Nowy Slajd', subtitle: 'Podtytuł' };
                                        onUpdate(section.id, { slides: [...(section.slides || []), newSlide] });
                                    }}
                                    className="text-xs bg-blue-500/20 text-blue-500 px-2 py-1 rounded border border-blue-500/30 font-bold"
                                >
                                    + DODAJ SLAJD
                                </button>
                            </div>
                            <div className="space-y-3">
                                {(section.slides || []).map((slide, sIndex) => (
                                    <div key={slide.id} className="bg-zinc-800 p-4 rounded border border-zinc-700 flex gap-4 items-center">
                                        <div className="w-20 h-12 bg-zinc-900 rounded overflow-hidden relative group shrink-0">
                                            {slide.image ? <img src={slide.image} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="m-auto mt-3 text-zinc-700" />}
                                            <button onClick={() => openMediaPicker(section.id, { target: 'single', index: sIndex })} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 text-[8px] text-white font-bold uppercase transition-opacity">Zmień</button>
                                        </div>
                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                            <input type="text" value={slide.title} onChange={e => { const up = [...section.slides!]; up[sIndex].title = e.target.value; onUpdate(section.id, { slides: up }); }} placeholder="Tytuł" className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white" />
                                            <input type="text" value={slide.subtitle} onChange={e => { const up = [...section.slides!]; up[sIndex].subtitle = e.target.value; onUpdate(section.id, { slides: up }); }} placeholder="Tag" className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-[10px] text-zinc-400 uppercase font-bold" />
                                        </div>
                                        <button onClick={() => onUpdate(section.id, { slides: section.slides!.filter((_, i) => i !== sIndex) })} className="text-zinc-600 hover:text-red-500"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {/* THERMAL REPORT SHOWCASE */}
                {
                    section.type === 'thermal_report' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Tytuł Sekcji</label>
                                    <input type="text" value={section.title || ''} onChange={e => onUpdate(section.id, { title: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white font-bold" />
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Podtytuł</label>
                                    <input type="text" value={section.subtitle || ''} onChange={e => onUpdate(section.id, { subtitle: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-400" />
                                </div>
                            </div>

                            {/* CTA Editor */}
                            <div className="bg-yellow-500/5 p-6 rounded-3xl border border-yellow-500/10 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Stars size={16} className="text-yellow-500" />
                                    <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Sekcja "Potrzebujesz analizy?" (CTA)</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] text-zinc-500 mb-1 uppercase font-black">Tytuł CTA</label>
                                        <input type="text" value={section.featureTitle || ''} onChange={e => onUpdate(section.id, { featureTitle: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white" placeholder="np. Potrzebujesz profesjonalnej analizy?" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-zinc-500 mb-1 uppercase font-black">Przycisk CTA</label>
                                        <input type="text" value={section.buttonText || ''} onChange={e => onUpdate(section.id, { buttonText: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white" placeholder="np. DOWIEDZ SIĘ WIĘCEJ" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-zinc-500 mb-1 uppercase font-black">Opis CTA</label>
                                    <textarea value={section.featureContent || ''} onChange={e => onUpdate(section.id, { featureContent: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-300 min-h-[60px]" placeholder="Opis działania raportów..." />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-zinc-500 mb-1 uppercase font-black">Link Przycisku</label>
                                    <input type="text" value={section.buttonLink || ''} onChange={e => onUpdate(section.id, { buttonLink: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white" placeholder="np. /kontakt lub #rfq" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-zinc-600 uppercase tracking-widest">Baza Raportów PDF</h4>
                                <button
                                    onClick={() => {
                                        const newReport: ThermalReport = { id: Math.random().toString(36).substr(2, 9), title: 'Nowy Raport', date: '30.12.2025', location: 'Toruń PL', equipment: 'DJI Mavic 3 Thermal', pdfUrl: '', thumbnailUrl: '', type: 'INSPEKCJA PV' };
                                        onUpdate(section.id, { thermal_reports: [...(section.thermal_reports || []), newReport] });
                                    }}
                                    className="text-[10px] bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full border border-yellow-500/20 hover:bg-yellow-500/20 font-black uppercase tracking-widest"
                                >
                                    + DODAJ RAPORT
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(section.thermal_reports || []).map((rep, rIndex) => (
                                    <div key={rep.id} className="bg-zinc-800/80 p-5 rounded-2xl border border-white/5 space-y-4 hover:border-yellow-500/20 transition-all group">
                                        <div className="flex items-start justify-between">
                                            <div className="w-12 h-12 bg-zinc-900 rounded-xl border border-zinc-700 flex items-center justify-center text-yellow-500 shrink-0">
                                                <FileText size={24} />
                                            </div>
                                            <div className="flex-1 ml-4 space-y-1">
                                                <input type="text" value={rep.title} onChange={e => { const up = [...section.thermal_reports!]; up[rIndex].title = e.target.value; onUpdate(section.id, { thermal_reports: up }); }} className="w-full bg-transparent border-none p-0 text-sm text-white font-bold" placeholder="Tytuł raportu" />
                                                <input type="text" value={rep.type} onChange={e => { const up = [...section.thermal_reports!]; up[rIndex].type = e.target.value; onUpdate(section.id, { thermal_reports: up }); }} className="w-full bg-transparent border-none p-0 text-[10px] text-yellow-500/60 font-black uppercase tracking-tighter" placeholder="TYP: PV / BUDYNEK" />
                                            </div>
                                            <button onClick={() => onUpdate(section.id, { thermal_reports: section.thermal_reports!.filter((_, i) => i !== rIndex) })} className="text-zinc-600 hover:text-red-500 ml-2"><Trash2 size={16} /></button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 pb-3 border-b border-white/5">
                                            <div className="space-y-1">
                                                <label className="text-[8px] text-zinc-600 uppercase font-black">Data</label>
                                                <input type="text" value={rep.date} onChange={e => { const up = [...section.thermal_reports!]; up[rIndex].date = e.target.value; onUpdate(section.id, { thermal_reports: up }); }} className="w-full bg-zinc-900/50 border border-zinc-700 rounded px-2 py-1 text-[10px] text-zinc-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] text-zinc-600 uppercase font-black">Lokalizacja</label>
                                                <input type="text" value={rep.location} onChange={e => { const up = [...section.thermal_reports!]; up[rIndex].location = e.target.value; onUpdate(section.id, { thermal_reports: up }); }} className="w-full bg-zinc-900/50 border border-zinc-700 rounded px-2 py-1 text-[10px] text-zinc-300" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <label className="text-[8px] text-zinc-600 uppercase font-black mb-1 block">Miniaturka</label>
                                                    <div className="flex gap-2">
                                                        <div className="w-10 h-10 bg-zinc-900 rounded overflow-hidden border border-zinc-700 shrink-0 flex items-center justify-center">
                                                            {rep.thumbnailUrl ? (
                                                                <img src={rep.thumbnailUrl} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <ImageIcon size={16} className="text-zinc-700" />
                                                            )}
                                                        </div>
                                                        <button onClick={() => openMediaPicker(section.id, { target: 'single', context: 'visual', index: rIndex })} className="flex-1 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-[10px] font-bold text-white rounded uppercase px-2 transition-colors">
                                                            {rep.thumbnailUrl ? 'Zmień Foto' : 'Wybierz Foto'}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-[8px] text-zinc-600 uppercase font-black mb-1 block">PDF Raport</label>
                                                    <div className="flex gap-2">
                                                        <div className={`w-10 h-10 rounded overflow-hidden border shrink-0 flex items-center justify-center transition-colors ${rep.pdfUrl ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-zinc-900 border-zinc-700 text-zinc-700'}`}>
                                                            <FileText size={16} />
                                                        </div>
                                                        <button onClick={() => openMediaPicker(section.id, { target: 'single', context: 'thermal', index: rIndex })} className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase transition-all border ${rep.pdfUrl ? 'bg-zinc-900 text-yellow-500 border-yellow-500/20 hover:border-yellow-500' : 'bg-zinc-800 text-zinc-400 border-transparent hover:bg-zinc-700'}`}>
                                                            {rep.pdfUrl ? 'Zmień PDF' : 'Wgraj PDF'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <input type="text" value={rep.equipment} onChange={e => { const up = [...section.thermal_reports!]; up[rIndex].equipment = e.target.value; onUpdate(section.id, { thermal_reports: up }); }} placeholder="Sprzęt pomiarowy" className="w-full bg-zinc-900/50 border border-zinc-700 rounded px-3 py-1.5 text-[10px] text-zinc-500 italic" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }
                {/* STORY HERO - Premium Editorial Split Layout */}
                {
                    section.type === 'story_hero' && (
                        <div className="space-y-4">
                            {/* ... existing story_hero content or if it was removed in previous steps, re-add or skip if it's already there ... */}
                            {/* Wait, I saw story_hero earlier. I should just append my new blocks. */}
                        </div>
                    )
                }
                {/* Re-adding previous block closure to ensure I don't break anything, actually I'll just append to the end of thermal_report block */}

                {/* STORIES GRID */}
                {
                    section.type === 'stories_grid' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Tytuł Sekcji</label>
                                    <input type="text" value={section.title || ''} onChange={e => onUpdate(section.id, { title: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Podtytuł</label>
                                    <input type="text" value={section.subtitle || ''} onChange={e => onUpdate(section.id, { subtitle: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase">Kafelki Historii</h4>
                                <button
                                    onClick={() => {
                                        const newStory: StoryGridItem = { id: Math.random().toString(36).substr(2, 9), title: 'Nowa Historia', image: '', link: '', category: '' };
                                        onUpdate(section.id, { stories_items: [...(section.stories_items || []), newStory] });
                                    }}
                                    className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded border border-yellow-500/30 font-bold"
                                >
                                    + DODAJ HISTORIĘ
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(section.stories_items || []).map((item, idx) => (
                                    <div key={item.id} className="bg-zinc-800 p-4 rounded border border-zinc-700 flex gap-4 items-start relative group">
                                        <div className="w-20 h-24 bg-zinc-900 rounded overflow-hidden relative border border-zinc-600 shrink-0">
                                            {item.image ? (
                                                <img src={item.image} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-700"><ImageIcon size={20} /></div>
                                            )}
                                            <button onClick={() => openMediaPicker(section.id, { target: 'single', context: 'visual', index: idx })} className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center text-[9px] text-white font-bold uppercase transition-opacity">Zmień</button>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <input type="text" value={item.title} onChange={e => { const up = [...section.stories_items!]; up[idx].title = e.target.value; onUpdate(section.id, { stories_items: up }); }} placeholder="Tytuł Historii" className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white mobile-bounce" />
                                            <input type="text" value={item.category || ''} onChange={e => { const up = [...section.stories_items!]; up[idx].category = e.target.value; onUpdate(section.id, { stories_items: up }); }} placeholder="Kategoria (np. WESELE)" className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-[10px] text-yellow-500 font-bold uppercase" />
                                            <input type="text" value={item.link} onChange={e => { const up = [...section.stories_items!]; up[idx].link = e.target.value; onUpdate(section.id, { stories_items: up }); }} placeholder="Link (np. /historie/ola-i-tomek)" className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-400" />
                                        </div>
                                        <button onClick={() => onUpdate(section.id, { stories_items: section.stories_items!.filter((_, i) => i !== idx) })} className="absolute top-2 right-2 text-zinc-600 hover:text-red-500"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {/* CHRONOLOGICAL GALLERY */}
                {
                    section.type === 'chronological_gallery' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase">Chronologiczna Galeria</h4>
                                <div className="flex gap-2">
                                    <select
                                        value={section.gallery_layout || 'grid'}
                                        onChange={(e) => onUpdate(section.id, { gallery_layout: e.target.value as any })}
                                        className="bg-zinc-800 border border-zinc-700 rounded text-xs text-white px-2 py-1"
                                    >
                                        <option value="grid">Siatka (Grid)</option>
                                        <option value="list">Lista (Kolumna)</option>
                                    </select>
                                    <button
                                        onClick={() => {
                                            // Sort items by filename
                                            const sorted = [...(section.chronological_items || [])].sort((a, b) => {
                                                const nameA = a.image.split('/').pop() || '';
                                                const nameB = b.image.split('/').pop() || '';
                                                return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
                                            });
                                            onUpdate(section.id, { chronological_items: sorted });
                                        }}
                                        className="text-xs bg-blue-500/20 text-blue-500 px-2 py-1 rounded border border-blue-500/30 font-bold hover:bg-blue-500/30 transition-colors"
                                    >
                                        A-Z SORTUJ
                                    </button>
                                    <button
                                        onClick={() => openMediaPicker(section.id, { target: 'gallery' })}
                                        className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded border border-yellow-500/30 font-bold hover:bg-yellow-500/30 transition-colors"
                                    >
                                        + DODAJ ZDJĘCIA
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                {(section.chronological_items || []).map((item, idx) => (
                                    <div key={item.id} className="relative group aspect-square bg-zinc-800 rounded overflow-hidden border border-zinc-700">
                                        <img src={item.image} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                            <textarea
                                                value={item.description || ''}
                                                onChange={(e) => {
                                                    const up = [...(section.chronological_items || [])];
                                                    up[idx].description = e.target.value;
                                                    onUpdate(section.id, { chronological_items: up });
                                                }}
                                                placeholder="Opis..."
                                                className="w-full bg-transparent text-[10px] text-white border-b border-zinc-600 focus:border-yellow-500 outline-none resize-none h-12 mb-6"
                                            />
                                            <button
                                                onClick={() => {
                                                    const up = section.chronological_items!.filter((_, i) => i !== idx);
                                                    onUpdate(section.id, { chronological_items: up });
                                                }}
                                                className="absolute top-1 right-1 p-1 text-red-500 hover:text-red-400 bg-black/50 rounded-full"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                        <span className="absolute bottom-1 right-1 text-[8px] bg-black/50 text-zinc-400 px-1 rounded pointer-events-none">
                                            {item.image.split('/').pop()?.slice(0, 10)}...
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {/* FLOATING BUTTON */}
                {
                    section.type === 'floating_button' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Tekst przycisku</label>
                                    <input
                                        type="text"
                                        value={section.buttonText || ''}
                                        onChange={e => onUpdate(section.id, { buttonText: e.target.value })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                        placeholder="np. Wróć"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Link</label>
                                    <input
                                        type="text"
                                        value={section.buttonLink || ''}
                                        onChange={e => onUpdate(section.id, { buttonLink: e.target.value })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                        placeholder="np. / lub /portfolio"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Pozycja</label>
                                    <select
                                        value={section.layout || 'bottom-right'}
                                        onChange={e => onUpdate(section.id, { layout: e.target.value as any })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                    >
                                        <option value="top-left">Góra Lewy (Top-Left)</option>
                                        <option value="top-right">Góra Prawy (Top-Right)</option>
                                        <option value="bottom-left">Dół Lewy (Bottom-Left)</option>
                                        <option value="bottom-right">Dół Prawy (Bottom-Right)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Ikona</label>
                                    <select
                                        value={section.imagePosition || 'arrow-left'}
                                        onChange={e => onUpdate(section.id, { imagePosition: e.target.value as any })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                    >
                                        <option value="arrow-left">Strzałka Lewo</option>
                                        <option value="arrow-right">Strzałka Prawo</option>
                                        <option value="home">Dom (Home)</option>
                                        <option value="external">Link Zewnętrzny</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* POINTCLOUD HERO */}
                {section.type === 'pointcloud_hero' && (
                    <div className="space-y-4">
                        <div className="bg-cyan-950/30 p-3 rounded border border-cyan-800 mb-2">
                            <p className="text-xs text-zinc-400">🌐 <strong className="text-cyan-400">Chmura Punktów Hero:</strong> Główna sekcja powitalna dla strony pomiarowej B2B. Obsługuje model 3D (.glb) lub zdjęcie tła.</p>
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Tag (nad tytułem)</label>
                            <input type="text" value={section.tag || ''} onChange={e => onUpdate(section.id, { tag: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" placeholder="POMIARY & GEODEZJA 3D" />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Tytuł (HTML)</label>
                            <textarea value={section.title || ''} onChange={e => onUpdate(section.id, { title: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white h-20" />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Podtytuł</label>
                            <textarea value={section.subtitle || ''} onChange={e => onUpdate(section.id, { subtitle: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white h-16" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Tekst przycisku</label>
                                <input type="text" value={section.buttonText || ''} onChange={e => onUpdate(section.id, { buttonText: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Link przycisku</label>
                                <input type="text" value={section.buttonLink || ''} onChange={e => onUpdate(section.id, { buttonLink: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Zdjęcie tła (opcjonalne)</label>
                                <div className="flex gap-2 items-center">
                                    {section.image && <img src={section.image} alt="" className="h-16 w-24 object-cover rounded border border-zinc-700" />}
                                    <button onClick={() => openMediaPicker(section.id, { target: 'single' })} className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-300 hover:text-white">Wybierz</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Model 3D (.glb)</label>
                                <div className="flex gap-2 items-center">
                                    {section.modelUrl && <span className="text-[10px] text-cyan-400 truncate max-w-[150px]">✓ {section.modelUrl.split('/').pop()}</span>}
                                    <button onClick={() => openMediaPicker(section.id, { target: 'single', context: 'pc_model' as any })} className="px-3 py-2 bg-cyan-900/40 border border-cyan-700/50 rounded text-sm text-cyan-300 hover:text-white hover:bg-cyan-800/60">📦 Wgraj model</button>
                                    {section.modelUrl && <button onClick={() => onUpdate(section.id, { modelUrl: '' })} className="text-red-500 hover:text-red-400"><Trash2 size={14} /></button>}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-2">Quick Stats (Hero)</label>
                            {(section.pointcloud_stats || []).map((stat, idx) => (
                                <div key={idx} className="flex gap-2 mb-2">
                                    <input type="text" value={stat.value} onChange={e => { const s = [...(section.pointcloud_stats || [])]; s[idx] = { ...stat, value: e.target.value }; onUpdate(section.id, { pointcloud_stats: s }); }} placeholder="Wartość" className="w-24 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white" />
                                    <input type="text" value={stat.label} onChange={e => { const s = [...(section.pointcloud_stats || [])]; s[idx] = { ...stat, label: e.target.value }; onUpdate(section.id, { pointcloud_stats: s }); }} placeholder="Etykieta" className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-400" />
                                    <button onClick={() => onUpdate(section.id, { pointcloud_stats: section.pointcloud_stats?.filter((_, i) => i !== idx) })} className="text-red-500 hover:text-red-400 px-1"><Trash2 size={14} /></button>
                                </div>
                            ))}
                            <button onClick={() => onUpdate(section.id, { pointcloud_stats: [...(section.pointcloud_stats || []), { value: '', label: '' }] })} className="text-xs text-cyan-400 hover:text-cyan-300">+ Dodaj stat</button>
                        </div>
                    </div>
                )}

                {/* POINTCLOUD VIEWER */}
                {section.type === 'pointcloud_viewer' && (
                    <div className="space-y-4">
                        <div className="bg-cyan-950/30 p-3 rounded border border-cyan-800 mb-2">
                            <p className="text-xs text-zinc-400">📦 <strong className="text-cyan-400">Viewer 3D:</strong> Samodzielna sekcja z modelem 3D (.glb) w przeglądarce. Wklej URL do pliku modelu.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Tytuł (HTML)</label>
                                <input type="text" value={section.title || ''} onChange={e => onUpdate(section.id, { title: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Podtytuł (Tag)</label>
                                <input type="text" value={section.subtitle || ''} onChange={e => onUpdate(section.id, { subtitle: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Model 3D (.glb)</label>
                            <div className="flex gap-2 items-center">
                                {section.modelUrl && <span className="text-[10px] text-cyan-400 truncate max-w-[200px]">✓ {section.modelUrl.split('/').pop()}</span>}
                                <button onClick={() => openMediaPicker(section.id, { target: 'single', context: 'pc_model' as any })} className="px-3 py-2 bg-cyan-900/40 border border-cyan-700/50 rounded text-sm text-cyan-300 hover:text-white hover:bg-cyan-800/60">📦 Wgraj model</button>
                                {section.modelUrl && <button onClick={() => onUpdate(section.id, { modelUrl: '' })} className="text-red-500 hover:text-red-400"><Trash2 size={14} /></button>}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Poster (Zdjęcie ładowania)</label>
                            <div className="flex gap-2 items-center">
                                {section.image && <img src={section.image} alt="" className="h-16 w-24 object-cover rounded border border-zinc-700" />}
                                <button onClick={() => openMediaPicker(section.id, { target: 'single' })} className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-300 hover:text-white">Wybierz</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Opis (pod viewerem)</label>
                            <textarea value={section.description || ''} onChange={e => onUpdate(section.id, { description: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white h-16" />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-2">Statystyki modelu</label>
                            {(section.pointcloud_stats || []).map((stat, idx) => (
                                <div key={idx} className="flex gap-2 mb-2">
                                    <input type="text" value={stat.value} onChange={e => { const s = [...(section.pointcloud_stats || [])]; s[idx] = { ...stat, value: e.target.value }; onUpdate(section.id, { pointcloud_stats: s }); }} placeholder="Wartość" className="w-24 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white" />
                                    <input type="text" value={stat.label} onChange={e => { const s = [...(section.pointcloud_stats || [])]; s[idx] = { ...stat, label: e.target.value }; onUpdate(section.id, { pointcloud_stats: s }); }} placeholder="Etykieta" className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-400" />
                                    <button onClick={() => onUpdate(section.id, { pointcloud_stats: section.pointcloud_stats?.filter((_, i) => i !== idx) })} className="text-red-500 hover:text-red-400 px-1"><Trash2 size={14} /></button>
                                </div>
                            ))}
                            <button onClick={() => onUpdate(section.id, { pointcloud_stats: [...(section.pointcloud_stats || []), { value: '', label: '' }] })} className="text-xs text-cyan-400 hover:text-cyan-300">+ Dodaj stat</button>
                        </div>
                    </div>
                )}

                {/* POINTCLOUD SERVICES */}
                {section.type === 'pointcloud_services' && (
                    <div className="space-y-4">
                        <div className="bg-cyan-950/30 p-3 rounded border border-cyan-800 mb-2">
                            <p className="text-xs text-zinc-400">🛠️ <strong className="text-cyan-400">Usługi Pomiarowe:</strong> Karty usług z ikonami i listą feature. Idealne do prezentacji oferty.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Tytuł (HTML)</label>
                                <input type="text" value={section.title || ''} onChange={e => onUpdate(section.id, { title: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Podtytuł</label>
                                <input type="text" value={section.subtitle || ''} onChange={e => onUpdate(section.id, { subtitle: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase">Usługi ({section.pointcloud_services?.length || 0})</h4>
                                <button onClick={() => {
                                    const newSvc = { id: Math.random().toString(36).substr(2, 9), icon: 'Layers', title: 'Nowa Usługa', description: 'Opis usługi...', features: ['Feature 1'] };
                                    onUpdate(section.id, { pointcloud_services: [...(section.pointcloud_services || []), newSvc] });
                                }} className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded border border-cyan-500/30 font-bold">+ DODAJ USŁUGĘ</button>
                            </div>
                            {(section.pointcloud_services || []).map((svc, idx) => (
                                <div key={svc.id} className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-[10px] text-zinc-500 mb-1">Ikona</label>
                                                <select value={svc.icon} onChange={e => { const s = [...(section.pointcloud_services || [])]; s[idx] = { ...svc, icon: e.target.value }; onUpdate(section.id, { pointcloud_services: s }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white">
                                                    <option value="Mountain">🏔️ Mountain</option>
                                                    <option value="Building2">🏢 Building</option>
                                                    <option value="Truck">🚛 Truck</option>
                                                    <option value="Zap">⚡ Zap</option>
                                                    <option value="Layers">📐 Layers</option>
                                                    <option value="MapPin">📍 MapPin</option>
                                                    <option value="Ruler">📏 Ruler</option>
                                                    <option value="Box">📦 Box</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-[10px] text-zinc-500 mb-1">Tytuł</label>
                                                <input type="text" value={svc.title} onChange={e => { const s = [...(section.pointcloud_services || [])]; s[idx] = { ...svc, title: e.target.value }; onUpdate(section.id, { pointcloud_services: s }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white" />
                                            </div>
                                        </div>
                                        <button onClick={() => onUpdate(section.id, { pointcloud_services: section.pointcloud_services?.filter((_, i) => i !== idx) })} className="text-zinc-500 hover:text-red-500 ml-2"><Trash2 size={14} /></button>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-zinc-500 mb-1">Opis</label>
                                        <textarea value={svc.description} onChange={e => { const s = [...(section.pointcloud_services || [])]; s[idx] = { ...svc, description: e.target.value }; onUpdate(section.id, { pointcloud_services: s }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 h-16" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-zinc-500 mb-1">Features (po jednym na linię)</label>
                                        <textarea value={(svc.features || []).join('\n')} onChange={e => { const s = [...(section.pointcloud_services || [])]; s[idx] = { ...svc, features: e.target.value.split('\n').filter(Boolean) }; onUpdate(section.id, { pointcloud_services: s }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-400 h-16" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-zinc-500 mb-1">Model 3D (.glb) — interaktywny podgląd</label>
                                        <div className="flex gap-2 items-center">
                                            {svc.modelUrl && <span className="text-[9px] text-cyan-400 truncate max-w-[150px]">✓ {svc.modelUrl.split('/').pop()}</span>}
                                            <button onClick={() => openMediaPicker(section.id, { target: 'single', context: 'pc_svc_model' as any, index: idx })} className="px-2 py-1 bg-cyan-900/40 border border-cyan-700/50 rounded text-[10px] text-cyan-300 hover:text-white hover:bg-cyan-800/60">📦 Wgraj model</button>
                                            {svc.modelUrl && <button onClick={() => { const s = [...(section.pointcloud_services || [])]; s[idx] = { ...svc, modelUrl: '' }; onUpdate(section.id, { pointcloud_services: s }); }} className="text-red-500 hover:text-red-400"><Trash2 size={12} /></button>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-zinc-500 mb-1">Zdjęcie (fallback jeśli brak modelu)</label>
                                        <input type="text" value={svc.image || ''} onChange={e => { const s = [...(section.pointcloud_services || [])]; s[idx] = { ...svc, image: e.target.value }; onUpdate(section.id, { pointcloud_services: s }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-400" placeholder="URL zdjęcia" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* POINTCLOUD SHOWCASE */}
                {section.type === 'pointcloud_showcase' && (
                    <div className="space-y-4">
                        <div className="bg-cyan-950/30 p-3 rounded border border-cyan-800 mb-2">
                            <p className="text-xs text-zinc-400">🗂️ <strong className="text-cyan-400">Showcase Projektów:</strong> Galeria realizacji z możliwością podglądu modelu 3D. Kliknięcie otwiera lightbox z viewerem.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Tytuł (HTML)</label>
                                <input type="text" value={section.title || ''} onChange={e => onUpdate(section.id, { title: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Podtytuł</label>
                                <input type="text" value={section.subtitle || ''} onChange={e => onUpdate(section.id, { subtitle: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase">Projekty ({section.pointcloud_projects?.length || 0})</h4>
                                <button onClick={() => {
                                    const newProj = { id: Math.random().toString(36).substr(2, 9), title: 'Nowy Projekt', category: 'Pomiar', location: '', modelUrl: '', coverImage: '', tags: [] as string[] };
                                    onUpdate(section.id, { pointcloud_projects: [...(section.pointcloud_projects || []), newProj] });
                                }} className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded border border-cyan-500/30 font-bold">+ DODAJ PROJEKT</button>
                            </div>
                            {(section.pointcloud_projects || []).map((proj, idx) => (
                                <div key={proj.id} className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <h5 className="text-sm font-bold text-white">#{idx + 1} {proj.title}</h5>
                                        <button onClick={() => onUpdate(section.id, { pointcloud_projects: section.pointcloud_projects?.filter((_, i) => i !== idx) })} className="text-zinc-500 hover:text-red-500"><Trash2 size={14} /></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] text-zinc-500 mb-1">Tytuł</label>
                                            <input type="text" value={proj.title} onChange={e => { const p = [...(section.pointcloud_projects || [])]; p[idx] = { ...proj, title: e.target.value }; onUpdate(section.id, { pointcloud_projects: p }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-zinc-500 mb-1">Kategoria</label>
                                            <input type="text" value={proj.category || ''} onChange={e => { const p = [...(section.pointcloud_projects || [])]; p[idx] = { ...proj, category: e.target.value }; onUpdate(section.id, { pointcloud_projects: p }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-[10px] text-zinc-500 mb-1">📍 Lokalizacja</label>
                                            <input type="text" value={proj.location || ''} onChange={e => { const p = [...(section.pointcloud_projects || [])]; p[idx] = { ...proj, location: e.target.value }; onUpdate(section.id, { pointcloud_projects: p }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-400" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-zinc-500 mb-1">📐 Obszar</label>
                                            <input type="text" value={proj.area || ''} onChange={e => { const p = [...(section.pointcloud_projects || [])]; p[idx] = { ...proj, area: e.target.value }; onUpdate(section.id, { pointcloud_projects: p }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-400" placeholder="np. 15 ha" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-zinc-500 mb-1">📅 Data</label>
                                            <input type="text" value={proj.date || ''} onChange={e => { const p = [...(section.pointcloud_projects || [])]; p[idx] = { ...proj, date: e.target.value }; onUpdate(section.id, { pointcloud_projects: p }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-400" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] text-zinc-500 mb-1">Punktów</label>
                                            <input type="text" value={proj.pointCount || ''} onChange={e => { const p = [...(section.pointcloud_projects || [])]; p[idx] = { ...proj, pointCount: e.target.value }; onUpdate(section.id, { pointcloud_projects: p }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-400" placeholder="np. 12M" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-zinc-500 mb-1">Dokładność</label>
                                            <input type="text" value={proj.accuracy || ''} onChange={e => { const p = [...(section.pointcloud_projects || [])]; p[idx] = { ...proj, accuracy: e.target.value }; onUpdate(section.id, { pointcloud_projects: p }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-400" placeholder="np. ±2cm" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-zinc-500 mb-1">Opis (HTML)</label>
                                        <textarea value={proj.description || ''} onChange={e => { const p = [...(section.pointcloud_projects || [])]; p[idx] = { ...proj, description: e.target.value }; onUpdate(section.id, { pointcloud_projects: p }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 h-16" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] text-zinc-500 mb-1">Cover Image</label>
                                            <div className="flex gap-2 items-center">
                                                {proj.coverImage && <img src={proj.coverImage} alt="" className="h-10 w-14 object-cover rounded border border-zinc-700" />}
                                                <button onClick={() => openMediaPicker(section.id, { target: 'single', context: 'pc_cover' as any, index: idx })} className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 hover:text-white">Wybierz</button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-zinc-500 mb-1">Model 3D (.glb)</label>
                                            <div className="flex gap-2 items-center">
                                                {proj.modelUrl && <span className="text-[9px] text-cyan-400 truncate max-w-[120px]">✓ {proj.modelUrl.split('/').pop()}</span>}
                                                <button onClick={() => openMediaPicker(section.id, { target: 'single', context: 'pc_model' as any, index: idx })} className="px-2 py-1 bg-cyan-900/40 border border-cyan-700/50 rounded text-[10px] text-cyan-300 hover:text-white hover:bg-cyan-800/60">📦 Wgraj</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-zinc-500 mb-1">Tagi (po przecinku)</label>
                                        <input type="text" value={(proj.tags || []).join(', ')} onChange={e => { const p = [...(section.pointcloud_projects || [])]; p[idx] = { ...proj, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }; onUpdate(section.id, { pointcloud_projects: p }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-400" placeholder="LiDAR, fotogrametria, DSM" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* PHOTO CUBE 3D */}
                {section.type === 'photo_cube_3d' && (
                    <div className="space-y-4">
                        <div className="bg-yellow-950/30 p-3 rounded border border-yellow-800 mb-2">
                            <p className="text-xs text-zinc-400">🎲 <strong className="text-yellow-400">Kostka 3D:</strong> Interaktywna, obracana kostka ze zdjęciami na 6 ściankach. Podaj URL-e zdjęć i skonfiguruj wygląd.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Tytuł (opcjonalnie)</label>
                                <input type="text" value={section.title || ''} onChange={e => onUpdate(section.id, { title: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" placeholder="np. Portfolio 3D" />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Podtytuł (opcjonalnie)</label>
                                <input type="text" value={section.subtitle || ''} onChange={e => onUpdate(section.id, { subtitle: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Zdjęcia na ścianki kostki (6 URL-i, po jednym na linię)</label>
                            <textarea
                                value={(section.data?.images || []).join('\n')}
                                onChange={e => onUpdate(section.id, { data: { ...section.data, images: e.target.value.split('\n').filter((u: string) => u.trim()) } })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white h-28 font-mono text-xs"
                                placeholder={"/uploads/photo1.jpg\n/uploads/photo2.jpg\n..."}
                            />
                            <p className="text-[10px] text-zinc-500 mt-1">Podaj do 6 URL-i zdjęć. Każde zdjęcie = jedna ścianka kostki.</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Rozmiar kostki (px)</label>
                                <input type="number" value={section.data?.cube_size || 320} onChange={e => onUpdate(section.id, { data: { ...section.data, cube_size: parseInt(e.target.value) } })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Kolor krawędzi</label>
                                <input type="color" value={section.data?.edge_color || '#c8a960'} onChange={e => onUpdate(section.id, { data: { ...section.data, edge_color: e.target.value } })} className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded cursor-pointer" />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Grubość krawędzi</label>
                                <input type="number" step="0.5" min="0" max="5" value={section.data?.edge_width ?? 1.5} onChange={e => onUpdate(section.id, { data: { ...section.data, edge_width: parseFloat(e.target.value) } })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Kolor tła</label>
                                <input type="color" value={section.data?.background_color || '#000000'} onChange={e => onUpdate(section.id, { data: { ...section.data, background_color: e.target.value } })} className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded cursor-pointer" />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Dopasowanie zdjęć</label>
                                <select value={section.data?.image_fit || 'cover'} onChange={e => onUpdate(section.id, { data: { ...section.data, image_fit: e.target.value } })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white">
                                    <option value="cover">Cover (wypełnia)</option>
                                    <option value="contain">Contain (mieści)</option>
                                    <option value="fill">Fill (rozciąga)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Kierunek wjazdu</label>
                                <select value={section.data?.entry_direction || 'left'} onChange={e => onUpdate(section.id, { data: { ...section.data, entry_direction: e.target.value } })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white">
                                    <option value="left">Z lewej</option>
                                    <option value="right">Z prawej</option>
                                    <option value="top">Z góry</option>
                                    <option value="bottom">Z dołu</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <input type="checkbox" checked={section.data?.auto_rotate ?? true} onChange={e => onUpdate(section.id, { data: { ...section.data, auto_rotate: e.target.checked } })} className="w-4 h-4 accent-gold-500" />
                                <label className="text-xs text-zinc-400">Auto-rotacja (gdy nie dotykasz)</label>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Prędkość auto-rotacji</label>
                                <input type="number" step="0.05" min="0.01" max="1" value={section.data?.auto_rotate_speed ?? 0.15} onChange={e => onUpdate(section.id, { data: { ...section.data, auto_rotate_speed: parseFloat(e.target.value) } })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                            </div>
                        </div>
                    </div>
                )}

                {/* POINTCLOUD TECHNOLOGY */}
                {section.type === 'pointcloud_tech' && (
                    <div className="space-y-4">
                        <div className="bg-purple-950/30 p-3 rounded border border-purple-800 mb-2">
                            <p className="text-xs text-zinc-400">⚙️ <strong className="text-purple-400">Technologia & Proces:</strong> Przedstawienie pipeline'u pomiarowego krok po kroku. Sticky layout jak w B2B Process.</p>
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Tytuł (HTML)</label>
                            <input type="text" value={section.title || ''} onChange={e => onUpdate(section.id, { title: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Podtytuł (Tag)</label>
                            <input type="text" value={section.subtitle || ''} onChange={e => onUpdate(section.id, { subtitle: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Opis kontekstowy</label>
                            <textarea value={section.description || ''} onChange={e => onUpdate(section.id, { description: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white h-16" />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Zdjęcie technologii (opcjonalne)</label>
                            <div className="flex gap-2 items-center">
                                {section.image && <img src={section.image} alt="" className="h-16 w-24 object-cover rounded border border-zinc-700" />}
                                <button onClick={() => openMediaPicker(section.id, { target: 'single' })} className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-300 hover:text-white">Wybierz</button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase">Etapy ({section.pointcloud_tech_steps?.length || 0})</h4>
                                <button onClick={() => {
                                    const newStep = { id: Math.random().toString(36).substr(2, 9), stepNumber: String(((section.pointcloud_tech_steps?.length || 0) + 1)).padStart(2, '0'), title: 'Nowy Etap', description: 'Opis etapu...' };
                                    onUpdate(section.id, { pointcloud_tech_steps: [...(section.pointcloud_tech_steps || []), newStep] });
                                }} className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded border border-purple-500/30 font-bold">+ DODAJ ETAP</button>
                            </div>
                            {(section.pointcloud_tech_steps || []).map((step, idx) => (
                                <div key={step.id} className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <span className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-black">{step.stepNumber || idx + 1}</span>
                                            <span className="text-sm font-bold text-white">{step.title}</span>
                                        </div>
                                        <button onClick={() => onUpdate(section.id, { pointcloud_tech_steps: section.pointcloud_tech_steps?.filter((_, i) => i !== idx) })} className="text-zinc-500 hover:text-red-500"><Trash2 size={14} /></button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-3">
                                        <div>
                                            <label className="block text-[10px] text-zinc-500 mb-1">Nr</label>
                                            <input type="text" value={step.stepNumber} onChange={e => { const s = [...(section.pointcloud_tech_steps || [])]; s[idx] = { ...step, stepNumber: e.target.value }; onUpdate(section.id, { pointcloud_tech_steps: s }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white" />
                                        </div>
                                        <div className="col-span-3">
                                            <label className="block text-[10px] text-zinc-500 mb-1">Tytuł</label>
                                            <input type="text" value={step.title} onChange={e => { const s = [...(section.pointcloud_tech_steps || [])]; s[idx] = { ...step, title: e.target.value }; onUpdate(section.id, { pointcloud_tech_steps: s }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-zinc-500 mb-1">Opis (główny)</label>
                                        <textarea value={step.description} onChange={e => { const s = [...(section.pointcloud_tech_steps || [])]; s[idx] = { ...step, description: e.target.value }; onUpdate(section.id, { pointcloud_tech_steps: s }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 h-12" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-zinc-500 mb-1">Szczegóły techniczne (opcjonalne)</label>
                                        <textarea value={step.details || ''} onChange={e => { const s = [...(section.pointcloud_tech_steps || [])]; s[idx] = { ...step, details: e.target.value }; onUpdate(section.id, { pointcloud_tech_steps: s }); }} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-500 h-12" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div >
        </div >
    );
}

export default function PageBuilder({ sections, onChange, pageType }: PageBuilderProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Global MediaPicker State
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [mediaPickerTarget, setMediaPickerTarget] = useState<'single' | 'gallery'>('single');
    const [mediaPickerContext, setMediaPickerContext] = useState<'visual' | 'thermal' | 'before' | 'case_logo' | 'case_video' | 'video' | 'mini_gallery_item' | 'story_cover' | 'chronological' | 'pc_model' | 'pc_cover' | 'pc_svc_model' | null>(null);
    const [sectionEditIndex, setSectionEditIndex] = useState(-1);
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

    const openMediaPicker = (sectionId: string, options: { target: 'single' | 'gallery', context?: 'visual' | 'thermal' | 'before' | 'case_logo' | 'case_video' | 'video' | 'mini_gallery_item' | 'story_cover' | 'chronological' | 'pc_model' | 'pc_cover' | 'pc_svc_model', index?: number }) => {
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
                if (mediaPickerContext === 'before') {
                    updated[sectionEditIndex] = { ...updated[sectionEditIndex], before_image: imageUrl };
                } else {
                    updated[sectionEditIndex] = { ...updated[sectionEditIndex], image: imageUrl };
                }
                updateSection(activeSectionId, { slides: updated });
            }
        } else if (section.type === 'thermal_hero') {
            const updated = [...(section.thermal_hero_slides || [])];
            if (sectionEditIndex >= 0) {
                if (mediaPickerContext === 'visual') {
                    updated[sectionEditIndex] = { ...updated[sectionEditIndex], visualMedia: imageUrl };
                } else if (mediaPickerContext === 'thermal') {
                    updated[sectionEditIndex] = { ...updated[sectionEditIndex], thermalMedia: imageUrl };
                }
                updateSection(activeSectionId, { thermal_hero_slides: updated });
            }
        } else if (section.type === 'thermal_report') {
            const updated = [...(section.thermal_reports || [])];
            if (sectionEditIndex >= 0) {
                if (mediaPickerContext === 'visual') {
                    updated[sectionEditIndex] = { ...updated[sectionEditIndex], thumbnailUrl: imageUrl };
                } else if (mediaPickerContext === 'thermal') {
                    updated[sectionEditIndex] = { ...updated[sectionEditIndex], pdfUrl: imageUrl };
                }
                updateSection(activeSectionId, { thermal_reports: updated });
            }
        } else if (['certificates', 'b2b_logos', 'b2b_cases', 'info_band'].includes(section.type)) {
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
        } else if (section.type === 'magazine_layout') {
            if (mediaPickerContext === 'thermal' || mediaPickerContext === 'secondary') {
                updateSection(activeSectionId, { secondaryImage: imageUrl });
            } else {
                updateSection(activeSectionId, { image: imageUrl });
            }
        } else if (section.type === 'featured_carousel') {
            const updated = [...(section.slides || [])];
            if (sectionEditIndex >= 0) {
                updated[sectionEditIndex] = { ...updated[sectionEditIndex], image: imageUrl };
                updateSection(activeSectionId, { slides: updated });
            }
        } else if (section.type === 'mini_gallery') {
            const updated = [...(section.mini_gallery_items || [])];
            if (sectionEditIndex >= 0) {
                updated[sectionEditIndex] = { ...updated[sectionEditIndex], image: imageUrl };
                updateSection(activeSectionId, { mini_gallery_items: updated });
            }

        } else if (section.type === 'b2b_video' || (section.type === 'b2b_hero' && mediaPickerContext === ('video' as any))) {
            updateSection(activeSectionId, { videoUrl: imageUrl });
        } else if (section.type === 'b2b_cases' && mediaPickerContext === ('case_video' as any)) {
            const updated = [...(section.b2b_cases || [])];
            if (sectionEditIndex >= 0) {
                updated[sectionEditIndex] = { ...updated[sectionEditIndex], videoUrl: imageUrl };
                updateSection(activeSectionId, { b2b_cases: updated });
            }
        } else if (section.type === 'b2b_cases' && mediaPickerContext === ('case_logo' as any)) {
            const updated = [...(section.b2b_cases || [])];
            if (sectionEditIndex >= 0) {
                updated[sectionEditIndex] = { ...updated[sectionEditIndex], logo: imageUrl };
                updateSection(activeSectionId, { b2b_cases: updated });
            }
        } else if (section.type === 'parallax_video') {
            updateSection(activeSectionId, { videoUrl: imageUrl });
        } else if (section.type === 'stories_grid') {
            const updated = [...(section.stories_items || [])];
            if (sectionEditIndex >= 0) {
                updated[sectionEditIndex] = { ...updated[sectionEditIndex], image: imageUrl };
                updateSection(activeSectionId, { stories_items: updated });
            }
        } else if (section.type === 'chronological_gallery') {
            if (mediaPickerTarget === 'gallery') {
                const newUrls = Array.isArray(url) ? url : [url];
                const newItems: ChronologicalGalleryItem[] = newUrls.map(u => ({
                    id: Math.random().toString(36).substr(2, 9),
                    image: u,
                    description: ''
                }));
                updateSection(activeSectionId, { chronological_items: [...(section.chronological_items || []), ...newItems] });
            } else if (sectionEditIndex >= 0) {
                // Handle single item update
                const updated = [...(section.chronological_items || [])];
                updated[sectionEditIndex] = { ...updated[sectionEditIndex], image: imageUrl };
                updateSection(activeSectionId, { chronological_items: updated });
            }
        } else if (section.type === 'pointcloud_hero' || section.type === 'pointcloud_viewer') {
            if (mediaPickerContext === ('pc_model' as any)) {
                updateSection(activeSectionId, { modelUrl: imageUrl });
            } else {
                updateSection(activeSectionId, { image: imageUrl });
            }
        } else if (section.type === 'pointcloud_services' && mediaPickerContext === ('pc_svc_model' as any)) {
            const updated = [...(section.pointcloud_services || [])];
            if (sectionEditIndex >= 0) {
                updated[sectionEditIndex] = { ...updated[sectionEditIndex], modelUrl: imageUrl };
                updateSection(activeSectionId, { pointcloud_services: updated });
            }
        } else if (section.type === 'pointcloud_showcase') {
            const updated = [...(section.pointcloud_projects || [])];
            if (sectionEditIndex >= 0) {
                if (mediaPickerContext === ('pc_model' as any)) {
                    updated[sectionEditIndex] = { ...updated[sectionEditIndex], modelUrl: imageUrl };
                } else if (mediaPickerContext === ('pc_cover' as any)) {
                    updated[sectionEditIndex] = { ...updated[sectionEditIndex], coverImage: imageUrl };
                }
                updateSection(activeSectionId, { pointcloud_projects: updated });
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
            newSection.videoType = 'youtube';
            newSection.videoAutoPlay = true;
            newSection.videoMuted = true;
            newSection.videoLoop = true;
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
        } else if (type === 'b2b_video') {
            newSection.videoType = 'youtube';
            newSection.sectionLayout = 'full';
            newSection.videoAutoPlay = false;
            newSection.videoMuted = true;
            newSection.videoLoop = true;
        } else if (type === 'thermal_hero') {
            newSection.thermal_hero_slides = [];
        } else if (type === 'hero_video') {
            newSection.slides = [];
        } else if (type === 'parallax_video') {
            newSection.videoUrl = '';
            newSection.overlayOpacity = 0.4;
        } else if (type === 'thermal_report') {
            newSection.thermal_reports = [];
        } else if (type === 'mini_gallery') {
            newSection.mini_gallery_items = [];
            newSection.mini_gallery_config = {
                columns: 4,
                gap: 4,
                aspectRatio: 'square',
                style: 'classic',
                textPosition: 'below',
                corners: 'square'
            };
        } else if (type === 'magazine_layout') {
            newSection.title = 'Nasza Misja i <span class="text-yellow-500">Wizja</span>';
            newSection.subtitle = 'O NAS';
            newSection.image = '';
            newSection.thermalImage = '';
            newSection.layout = 'left';
            newSection.content = 'Opowiedz historię swojej marki w unikalnym, redakcyjnym stylu...';
        } else if (type === 'masonry_gallery') {
            newSection.title = 'Najnowsze Realizacje';
            newSection.subtitle = 'PORTFOLIO';
            newSection.images = [];
        } else if (type === 'client_story') {
            newSection.title = 'Historia Miłości Ani i Marcina';
            newSection.tag = 'ANIA & MARCIN';
            newSection.subtitle = 'Pałac Goetz, Brzesko';
            newSection.buttonText = '15.06.2024';
            newSection.content = 'To był wyjątkowy dzień, pełen emocji i niezapomnianych chwil...';
            newSection.image = '';
        } else if (type === 'process_timeline') {
            newSection.title = 'Jak pracujemy';
            newSection.subtitle = 'PROCES';
            newSection.b2b_process = [
                { id: Math.random().toString(36).substr(2, 9), title: 'Pierwsze spotkanie', description: 'Poznajemy Wasze oczekiwania i wspólnie planujemy dzień.', stepNumber: '01' },
                { id: Math.random().toString(36).substr(2, 9), title: 'Dzień Ślubu', description: 'Jesteśmy z Wami, dyskretnie łapiąc każdy ważny moment.', stepNumber: '02' },
                { id: Math.random().toString(36).substr(2, 9), title: 'Dostarczenie zdjęć', description: 'W ciągu 30 dni otrzymujecie gotową galerię online.', stepNumber: '03' }
            ];
        } else if (type === 'investment_teaser') {
            newSection.title = 'Wybierz swój pakiet';
            newSection.subtitle = 'INWESTYCJA';
            newSection.features = [
                { id: Math.random().toString(36).substr(2, 9), title: 'Pakiet Silver', items: ['10h reportażu', '300 zdjęć', 'Galeria online'], enabled: false, buttonText: 'od 3500 zł' },
                { id: Math.random().toString(36).substr(2, 9), title: 'Pakiet Gold', items: ['12h reportażu', '500 zdjęć', 'Album premium'], enabled: true, buttonText: 'od 5000 zł' },
                { id: Math.random().toString(36).substr(2, 9), title: 'Sesja Narzeczeńska', items: ['2h sesji', '30 zdjęć', 'Piękna pamiątka'], enabled: false, buttonText: 'od 800 zł' }
            ];
        } else if (type === 'narrative_text') {
            newSection.title = 'Koncepcja Artystyczna';
            newSection.subtitle = 'NASZA FILOZOFIA';
            newSection.layout = 'left';
            newSection.showCategoryTitle = true;
            newSection.content = '<p>Zaczynamy od pasji do światła i autentyczności. Każdy kadr to dla nas nowa opowieść...</p>';
        } else if (type === 'featured_carousel') {
            newSection.title = 'Kluczowe Realizacje';
            newSection.subtitle = 'WYRÓŻNIONE';
            newSection.slides = [];
        } else if (type === 'story_hero') {
            newSection.title = 'Chwile pełne emocji';
            newSection.subtitle = 'NASZA PASJA';
            newSection.layout = 'left';
        } else if (type === 'stories_grid') {
            newSection.title = 'Wasze Historie';
            newSection.subtitle = 'REPORTAŻE';
            newSection.stories_items = [];
        } else if (type === 'chronological_gallery') {
            newSection.chronological_items = [];
            newSection.gallery_layout = 'grid';
        } else if (type === 'floating_button') {
            newSection.buttonText = 'Wróć';
            newSection.buttonLink = '/';
            newSection.layout = 'bottom-right';
            newSection.imagePosition = 'arrow-left'; // abusing this field for icon
        } else if (type === 'pointcloud_hero') {
            newSection.title = 'Precyzyjne pomiary & <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-yellow-500">Chmura Punktów 3D</span>';
            newSection.subtitle = 'Skaning laserowy, fotogrametria z drona i modele 3D terenu dla inwestorów, geodetów i firm budowlanych.';
            newSection.tag = 'POMIARY & GEODEZJA 3D';
            newSection.buttonText = 'ZAMÓW POMIAR';
            newSection.buttonLink = '#rfq';
            newSection.pointcloud_stats = [
                { value: '2cm', label: 'Dokładność GSD' },
                { value: '500+', label: 'Ha Zmapowanych' },
                { value: '48h', label: 'Czas Realizacji' }
            ];
        } else if (type === 'pointcloud_viewer') {
            newSection.title = 'Model 3D <span class="text-cyan-400">w przeglądarce</span>';
            newSection.subtitle = 'INTERAKTYWNY PODGLĄD';
            newSection.modelUrl = '';
            newSection.pointcloud_stats = [
                { value: '12M+', label: 'Punktów' },
                { value: '2cm', label: 'GSD' },
                { value: 'GLB', label: 'Format' },
                { value: '360°', label: 'Widok' }
            ];
        } else if (type === 'pointcloud_services') {
            newSection.title = 'Co możemy dla Ciebie <span class="text-cyan-400">zrobić</span>?';
            newSection.subtitle = 'Profesjonalne usługi pomiarowe z wykorzystaniem najnowszej technologii dronowej';
            newSection.pointcloud_services = [
                { id: Math.random().toString(36).substr(2, 9), icon: 'Mountain', title: 'Pomiary Hałd i Składowisk', description: 'Precyzyjne obliczanie objętości mas ziemnych, hałd węgla, kruszywa i innych materiałów sypkich. Dokładność do 2% objętości.', features: ['Obliczanie objętości V=∑ΔV', 'Porównanie z poprzednimi pomiarami', 'Mapy różnicowe', 'Raport z certyfikatem'] },
                { id: Math.random().toString(36).substr(2, 9), icon: 'Truck', title: 'Monitoring Autostrad i Dróg', description: 'Dokumentacja postępu prac drogowych, profile podłużne i poprzeczne, kontrola geometrii nawierzchni.', features: ['Profile podłużne i poprzeczne', 'Ortofotomapy w skali', 'Monitoring postępu prac', 'Porównanie z projektem'] },
                { id: Math.random().toString(36).substr(2, 9), icon: 'Building2', title: 'Inwentaryzacja Budynków', description: 'Skanowanie 3D elewacji, dachów i wnętrz. Tworzenie modeli BIM-ready do projektowania i remontów.', features: ['Model 3D elewacji', 'Przekroje i rzuty', 'Wykrywanie deformacji', 'Dane do BIM'] },
                { id: Math.random().toString(36).substr(2, 9), icon: 'Layers', title: 'Ortofotomapy i Mapy 2D', description: 'Ultra-dokładne ortofotomapy terenu z naniesionymi pomiarami. Gotowe do wczytania w GIS i CAD.', features: ['Rozdzielczość 1-3cm/px', 'Georeferencja EPSG', 'Export GeoTIFF', 'Warstwice i profile'] },
                { id: Math.random().toString(36).substr(2, 9), icon: 'Zap', title: 'Modele 3D Terenu (DSM/DTM)', description: 'Numeryczne Modele Terenu i Pokrycia Terenu z chmury punktów do analiz inżynierskich i planowania przestrzennego.', features: ['DSM — z pokryciem', 'DTM — oczyszczony teren', 'Analiza spadków', 'Eksport do CAD/GIS'] },
                { id: Math.random().toString(36).substr(2, 9), icon: 'MapPin', title: 'Kontrola Deformacji', description: 'Cykliczne pomiary porównawcze obiektów inżynierskich, wałów, nasypów i konstrukcji. Wykrywanie przemieszczeń.', features: ['Mapy różnicowe 3D', 'Raporty przemieszczeń', 'Monitoring cykliczny', 'Alerty przekroczeń'] }
            ];
        } else if (type === 'pointcloud_showcase') {
            newSection.title = 'Nasze <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">realizacje</span>';
            newSection.subtitle = 'Zobacz przykłady pomiarów i modeli 3D z naszych projektów';
            newSection.pointcloud_projects = [];
        } else if (type === 'photo_cube_3d') {
            newSection.title = 'Kostka 3D';
            newSection.subtitle = '';
            newSection.data = {
                images: [],
                cube_size: 320,
                image_fit: 'cover',
                rotation_speed: 0.5,
                smoothness: 0.96,
                entry_speed: 1800,
                entry_direction: 'left',
                background_color: '#000000',
                edge_color: '#c8a960',
                edge_width: 1.5,
                auto_rotate: true,
                auto_rotate_speed: 0.15
            };
        } else if (type === 'pointcloud_tech') {
            newSection.title = 'Pipeline <span class="text-cyan-400">pomiarowy</span> od A do Z.';
            newSection.subtitle = 'TECHNOLOGIA';
            newSection.description = 'Od nalotu dronem, przez przetwarzanie chmury punktów, po gotowy model 3D — cały proces realizujemy bez zewnętrznych podwykonawców.';
            newSection.pointcloud_tech_steps = [
                { id: Math.random().toString(36).substr(2, 9), stepNumber: '01', title: 'Planowanie Misji', description: 'Analiza terenu, wyznaczenie GCP (punktów kontrolnych), planowanie trasy przelotu z uwzględnieniem pokrycia podłużnego i poprzecznego.', details: 'Używamy oprogramowania DJI Pilot 2 / Litchi z automatycznym planowaniem siatki nalotu. Minimum 80% pokrycia podłużnego, 70% poprzecznego.' },
                { id: Math.random().toString(36).substr(2, 9), stepNumber: '02', title: 'Nalot Fotogrametryczny', description: 'Wykonanie serii zdjęć z drona w trybie automatycznym. Zbieranie danych GPS/RTK. Rozdzielczość naziemna (GSD) od 1cm/px.', details: 'Dron DJI Mavic 3 Enterprise z kamerą 20MP lub Matrice 350 RTK z LiDAR L2. Precyzja pozycjonowania RTK ±2cm.' },
                { id: Math.random().toString(36).substr(2, 9), stepNumber: '03', title: 'Tworzenie Chmury Punktów', description: 'Przetwarzanie zdjęć w oprogramowaniu fotogrametrycznym. Generowanie gęstej chmury punktów z milionami pomiarów 3D.', details: 'Agisoft Metashape Professional / DJI Terra — SfM (Structure from Motion) + MVS (Multi-View Stereo). Klasyfikacja punktów: grunt, budynki, roślinność.' },
                { id: Math.random().toString(36).substr(2, 9), stepNumber: '04', title: 'Model 3D i Produkty Końcowe', description: 'Generowanie modelu 3D mesh, ortofotomapy, DSM/DTM, przekrojów i raportów objętościowych. Export do formatów CAD, GIS i BIM.', details: 'Formaty: LAS/LAZ, TIF (ortofoto), DXF/DWG (CAD), GLB/OBJ (3D), PDF (raport). Każdy produkt wsparty georeferencją.' }
            ];
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
        } else if (templateName === 'pointcloud_surveying') {
            templateSections = [
                {
                    id: baseId(), type: 'pointcloud_hero',
                    tag: 'POMIARY & GEODEZJA 3D',
                    title: 'Precyzyjne pomiary & <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-yellow-500">Chmura Punktów 3D</span>',
                    subtitle: 'Skaning laserowy, fotogrametria z drona i modele 3D terenu dla inwestorów, geodetów i firm budowlanych. Dokładność do 2cm GSD.',
                    buttonText: 'ZAMÓW POMIAR',
                    buttonLink: '#rfq',
                    pointcloud_stats: [
                        { value: '2cm', label: 'Dokładność GSD' },
                        { value: '500+', label: 'Ha Zmapowanych' },
                        { value: '48h', label: 'Czas Realizacji' }
                    ]
                } as any,
                {
                    id: baseId(), type: 'b2b_stats',
                    title: 'Liczby mówią za siebie',
                    b2b_stats: [
                        { id: baseId(), value: '500+', label: 'Hektarów zmapowanych', prefix: '', suffix: 'ha' },
                        { id: baseId(), value: '50M+', label: 'Punktów przetworzonych', prefix: '', suffix: '' },
                        { id: baseId(), value: '2cm', label: 'Dokładność GSD', prefix: '±', suffix: '' },
                        { id: baseId(), value: '48h', label: 'Średni czas realizacji', prefix: '', suffix: '' }
                    ]
                },
                {
                    id: baseId(), type: 'pointcloud_services',
                    title: 'Co możemy dla Ciebie <span class="text-cyan-400">zrobić</span>?',
                    subtitle: 'Profesjonalne usługi pomiarowe z wykorzystaniem najnowszej technologii dronowej i fotogrametrii',
                    pointcloud_services: [
                        {
                            id: baseId(), icon: 'Mountain', title: 'Pomiary Hałd i Składowisk',
                            description: 'Precyzyjne obliczanie objętości mas ziemnych, hałd węgla, kruszywa i innych materiałów sypkich. Dokładność do 2% objętości.',
                            features: ['Obliczanie objętości V=∑ΔV', 'Porównanie z poprzednimi pomiarami', 'Mapy różnicowe', 'Raport z certyfikatem']
                        },
                        {
                            id: baseId(), icon: 'Truck', title: 'Monitoring Autostrad i Dróg',
                            description: 'Dokumentacja postępu prac drogowych, profile podłużne i poprzeczne, kontrola geometrii nawierzchni.',
                            features: ['Profile podłużne i poprzeczne', 'Ortofotomapy w skali', 'Monitoring postępu prac', 'Porównanie z projektem']
                        },
                        {
                            id: baseId(), icon: 'Building2', title: 'Inwentaryzacja Budynków',
                            description: 'Skanowanie 3D elewacji, dachów i wnętrz. Tworzenie modeli BIM-ready do projektowania i remontów.',
                            features: ['Model 3D elewacji', 'Przekroje i rzuty', 'Wykrywanie deformacji', 'Dane do BIM']
                        },
                        {
                            id: baseId(), icon: 'Layers', title: 'Ortofotomapy i Mapy 2D',
                            description: 'Ultra-dokładne ortofotomapy terenu z naniesionymi pomiarami. Gotowe do wczytania w GIS i CAD.',
                            features: ['Rozdzielczość 1-3cm/px', 'Georeferencja EPSG', 'Export GeoTIFF', 'Warstwice i profile']
                        },
                        {
                            id: baseId(), icon: 'Zap', title: 'Modele 3D Terenu (DSM/DTM)',
                            description: 'Numeryczne Modele Terenu i Pokrycia Terenu z chmury punktów do analiz inżynierskich i planowania przestrzennego.',
                            features: ['DSM — z pokryciem', 'DTM — oczyszczony teren', 'Analiza spadków', 'Eksport do CAD/GIS']
                        },
                        {
                            id: baseId(), icon: 'MapPin', title: 'Kontrola Deformacji',
                            description: 'Cykliczne pomiary porównawcze obiektów inżynierskich, wałów, nasypów i konstrukcji. Wykrywanie przemieszczeń.',
                            features: ['Mapy różnicowe 3D', 'Raporty przemieszczeń', 'Monitoring cykliczny', 'Alerty przekroczeń']
                        }
                    ]
                } as any,
                {
                    id: baseId(), type: 'pointcloud_tech',
                    title: 'Pipeline <span class="text-cyan-400">pomiarowy</span> od A do Z.',
                    subtitle: 'TECHNOLOGIA',
                    description: 'Od nalotu dronem, przez przetwarzanie chmury punktów, po gotowy model 3D — cały proces realizujemy bez zewnętrznych podwykonawców.',
                    pointcloud_tech_steps: [
                        { id: baseId(), stepNumber: '01', title: 'Planowanie Misji', description: 'Analiza terenu, wyznaczenie GCP (punktów kontrolnych), planowanie trasy przelotu z uwzględnieniem pokrycia podłużnego i poprzecznego.', details: 'Używamy DJI Pilot 2 / Litchi z automatycznym planowaniem siatki nalotu. Min. 80% pokrycia podłużnego, 70% poprzecznego.' },
                        { id: baseId(), stepNumber: '02', title: 'Nalot Fotogrametryczny', description: 'Wykonanie serii zdjęć z drona w trybie automatycznym. Zbieranie danych GPS/RTK. Rozdzielczość naziemna (GSD) od 1cm/px.', details: 'DJI Mavic 3 Enterprise z kamerą 20MP lub Matrice 350 RTK z LiDAR L2. Precyzja pozycjonowania RTK ±2cm.' },
                        { id: baseId(), stepNumber: '03', title: 'Tworzenie Chmury Punktów', description: 'Przetwarzanie w oprogramowaniu fotogrametrycznym. Generowanie gęstej chmury punktów z milionami pomiarów 3D.', details: 'Agisoft Metashape Professional / DJI Terra — SfM + MVS. Klasyfikacja punktów: grunt, budynki, roślinność.' },
                        { id: baseId(), stepNumber: '04', title: 'Model 3D i Produkty Końcowe', description: 'Generowanie modelu 3D mesh, ortofotomapy, DSM/DTM, przekrojów i raportów objętościowych.', details: 'Formaty: LAS/LAZ, TIF, DXF/DWG, GLB/OBJ, PDF. Georeferencja w wymaganym układzie współrzędnych.' }
                    ]
                } as any,
                {
                    id: baseId(), type: 'pointcloud_showcase',
                    title: 'Nasze <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">realizacje</span>',
                    subtitle: 'Zobacz przykłady pomiarów i modeli 3D z naszych projektów',
                    pointcloud_projects: [
                        {
                            id: baseId(), title: 'Pomiar Objętości Hałdy Kruszywa', category: 'Hałda / Składowisko',
                            location: 'Wałycz', date: '02/2026', area: '8.5 ha', pointCount: '12M', accuracy: '±2cm',
                            description: 'Kompleksowy pomiar objętości hałdy kruszywa naturalnego z wykorzystaniem drona RTK. Model 3D textured z możliwością podglądu w przeglądarce.',
                            coverImage: '', modelUrl: '', tags: ['fotogrametria', 'RTK', 'objętość', 'mesh 3D']
                        },
                        {
                            id: baseId(), title: 'Monitoring Budowy Drogi S10', category: 'Infrastruktura Drogowa',
                            location: 'Bydgoszcz - Toruń', date: '01/2026', area: '25 ha', pointCount: '45M', accuracy: '±3cm',
                            description: 'Cykliczny monitoring postępu prac na odcinku drogi ekspresowej S10. Ortofotomapy i modele porównawcze co 2 tygodnie.',
                            coverImage: '', modelUrl: '', tags: ['droga', 'monitoring', 'ortofotomapa']
                        },
                        {
                            id: baseId(), title: 'Inwentaryzacja Zabytkowej Kamienicy', category: 'Budynki',
                            location: 'Toruń', date: '12/2025', area: '0.3 ha', pointCount: '8M', accuracy: '±1cm',
                            description: 'Skanowanie 3D elewacji i dachu zabytkowej kamienicy na potrzeby renowacji. Model BIM-ready z pełną dokumentacją.',
                            coverImage: '', modelUrl: '', tags: ['inwentaryzacja', 'elewacja', 'BIM', 'zabytek']
                        }
                    ]
                } as any,
                {
                    id: baseId(), type: 'info_band',
                    title: 'Dlaczego <span class="text-yellow-500">warto</span> z nami współpracować?',
                    subtitle: 'KORZYŚCI DLA INWESTORA',
                    infoband_items: [
                        { id: baseId(), icon: 'Crosshair', title: 'Precyzja sub-centymetrowa', description: 'Pomiary RTK z dokładnością do ±2cm. Referencja do sieci ASG-EUPOS lub własnych GCP.' },
                        { id: baseId(), icon: 'Zap', title: 'Realizacja od 48h', description: 'Od nalotu do gotowego produktu w 2-5 dni roboczych. Ekspresowo dla pilnych projektów.' },
                        { id: baseId(), icon: 'ShieldCheck', title: 'Certyfikowani piloci UAV', description: 'Licencja A1/A2/A3/STS. OC komercyjne. Pełna zgodność z przepisami EASA i ULC.' },
                        { id: baseId(), icon: 'Building2', title: 'Formaty CAD/GIS/BIM', description: 'Eksportujemy dane w formatach LAS, DXF, DWG, GeoTIFF, GLB. Gotowe do wczytania w dowolny system.' }
                    ]
                },
                {
                    id: baseId(), type: 'certificates', certificateSize: 'readable', title: 'Kwalifikacje & Sprzęt',
                    certificates: [
                        { id: baseId(), title: 'UAV Pilot', subtitle: 'A1/A2/A3/STS', description: 'Licencjonowane operacje w całej UE.' },
                        { id: baseId(), title: 'Fotogrametria', subtitle: 'Agisoft Certified', description: 'Profesjonalne przetwarzanie chmur punktów.' },
                        { id: baseId(), icon: 'ShieldCheck', title: 'Ubezpieczenie OC', subtitle: 'Polisa Komercyjna', description: 'Pełna ochrona każdej misji pomiarowej.' },
                        { id: baseId(), title: 'DJI Enterprise', subtitle: 'Mavic 3E / M350 RTK', description: 'Profesjonalny sprzęt z modułem RTK.' }
                    ]
                },
                { id: baseId(), type: 'b2b_contact', title: 'Zamów <span class="text-cyan-400">wycenę pomiaru</span>', subtitle: 'Opisz projekt — lokalizację, obszar i oczekiwane produkty. Wycenę otrzymasz w ciągu 4 godzin roboczych.' }
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
            {/* Quick Templates Panel - Only for B2B */}
            {(pageType === 'b2b' || pageType === 'dron') && (
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
                                onClick={() => applyTemplate('pointcloud_surveying')}
                                className="px-5 py-3 bg-cyan-500/10 hover:bg-cyan-500 hover:text-white text-cyan-400 text-xs font-bold rounded-xl transition-all border border-cyan-500/20 flex items-center gap-2"
                            >
                                <Crosshair size={14} /> Chmura Punktów & Pomiary
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
            )}

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
                <button onClick={() => addSection('story_hero')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded text-sm text-emerald-400 transition-colors">
                    <Type className="w-4 h-4" /> Story Hero 📖
                </button>
                <button onClick={() => addSection('contact')} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm text-white transition-colors">
                    <MoveUp className="w-4 h-4" /> CTA / Kontakt
                </button>
                <button onClick={() => addSection('contact_form')} className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded text-sm text-blue-400 transition-colors">
                    <Layout className="w-4 h-4" /> Formularz Kontaktowy
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

                <button onClick={() => addSection('stories_grid')} className="flex items-center gap-2 px-4 py-2 bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/30 rounded text-sm text-pink-400 transition-colors">
                    <Layout className="w-4 h-4" /> Stories Grid (Wasze Historie)
                </button>
                <button onClick={() => addSection('chronological_gallery')} className="flex items-center gap-2 px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 rounded text-sm text-cyan-400 transition-colors">
                    <ImageIcon className="w-4 h-4" /> Chronological Gallery 📸
                </button>

                <div className="w-full h-px bg-zinc-800 my-2" />
                <span className="w-full text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1 ml-1">Editorial & Storytelling (Premium)</span>

                <button onClick={() => addSection('magazine_layout')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded text-sm text-indigo-400 transition-colors">
                    <Layout className="w-4 h-4" /> Magazine Layout 📖
                </button>
                <button onClick={() => addSection('masonry_gallery')} className="flex items-center gap-2 px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 rounded text-sm text-rose-400 transition-colors">
                    <ImageIcon className="w-4 h-4" /> Masonry Gallery 🖼️
                </button>
                <button onClick={() => addSection('client_story')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded text-sm text-emerald-400 transition-colors">
                    <Stars className="w-4 h-4" /> Client Story ✍️
                </button>
                <button onClick={() => addSection('process_timeline')} className="flex items-center gap-2 px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 rounded text-sm text-amber-400 transition-colors">
                    <Workflow className="w-4 h-4" /> Process Timeline ⏳
                </button>
                <button onClick={() => addSection('investment_teaser')} className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded text-sm text-blue-400 transition-colors">
                    <Award className="w-4 h-4" /> Investment Teaser 💎
                </button>
                <button onClick={() => addSection('narrative_text')} className="flex items-center gap-2 px-4 py-2 bg-zinc-600/20 hover:bg-zinc-600/30 border border-zinc-500/30 rounded text-sm text-zinc-400 transition-colors">
                    <Type className="w-4 h-4" /> Narrative Text 🖋️
                </button>
                <button onClick={() => addSection('featured_carousel')} className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded text-sm text-purple-400 transition-colors">
                    <LayoutTemplate className="w-4 h-4" /> Featured Carousel 🎡
                </button>
                <button onClick={() => addSection('floating_button')} className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded text-sm text-blue-400 transition-colors">
                    <Layout className="w-4 h-4" /> Floating Button 🧭
                </button>
                <button onClick={() => addSection('photo_cube_3d')} className="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 rounded text-sm text-yellow-400 transition-colors">
                    <Layout className="w-4 h-4" /> Kostka 3D 🎲
                </button>

            </div>

            {/* Moduły B2B Premium - Only for B2B */}
            {(pageType === 'b2b' || pageType === 'dron') && (
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
                    <button onClick={() => addSection('b2b_video')} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/50 rounded text-sm text-zinc-300 transition-colors group">
                        <Video className="w-4 h-4 text-orange-400" /> B2B Video
                    </button>
                    <button onClick={() => addSection('thermal_hero')} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/50 rounded text-sm text-zinc-300 transition-colors group">
                        <Thermometer className="w-4 h-4 text-red-500" /> Thermal Hero
                    </button>
                    <button onClick={() => addSection('hero_video')} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/50 rounded text-sm text-zinc-300 transition-colors group">
                        <Video className="w-4 h-4 text-blue-500" /> Hero Video Slider
                    </button>
                    <button onClick={() => addSection('parallax_video')} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/50 rounded text-sm text-zinc-300 transition-colors group">
                        <MoveUp className="w-4 h-4 text-purple-500" /> Parallax Video
                    </button>
                    <button onClick={() => addSection('thermal_report')} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/50 rounded text-sm text-zinc-300 transition-colors group">
                        <FileSearch className="w-4 h-4 text-yellow-500" /> Thermal Reports
                    </button>
                    <button onClick={() => addSection('thermal_slider')} className="flex items-center gap-2 px-4 py-2 bg-gold-600/10 hover:bg-gold-600/20 border border-gold-500/20 rounded text-sm text-gold-400 transition-colors">
                        <Layout className="w-4 h-4" /> Thermal Slider
                    </button>
                    <button onClick={() => addSection('mini_gallery')} className="flex items-center gap-2 px-4 py-2 bg-pink-600/10 hover:bg-pink-600/20 border border-pink-500/20 rounded text-sm text-pink-400 transition-colors">
                        <Layout className="w-4 h-4" /> Mini Gallery (Pro)
                    </button>
                    <div className="w-full h-px bg-cyan-900/30 my-1" />
                    <span className="w-full text-[10px] font-bold text-cyan-700 uppercase tracking-widest mb-1 ml-1">Moduły Chmura Punktów / Pomiary</span>
                    <button onClick={() => addSection('pointcloud_hero')} className="flex items-center gap-2 px-4 py-2 bg-cyan-900/20 hover:bg-cyan-800/40 border border-cyan-700/30 rounded text-sm text-cyan-400 transition-colors">
                        <Crosshair className="w-4 h-4" /> PC Hero
                    </button>
                    <button onClick={() => addSection('pointcloud_viewer')} className="flex items-center gap-2 px-4 py-2 bg-cyan-900/20 hover:bg-cyan-800/40 border border-cyan-700/30 rounded text-sm text-cyan-400 transition-colors">
                        <Map className="w-4 h-4" /> 3D Viewer
                    </button>
                    <button onClick={() => addSection('pointcloud_services')} className="flex items-center gap-2 px-4 py-2 bg-cyan-900/20 hover:bg-cyan-800/40 border border-cyan-700/30 rounded text-sm text-cyan-400 transition-colors">
                        <HardHat className="w-4 h-4" /> Usługi PC
                    </button>
                    <button onClick={() => addSection('pointcloud_showcase')} className="flex items-center gap-2 px-4 py-2 bg-cyan-900/20 hover:bg-cyan-800/40 border border-cyan-700/30 rounded text-sm text-cyan-400 transition-colors">
                        <Camera className="w-4 h-4" /> Showcase PC
                    </button>
                    <button onClick={() => addSection('pointcloud_tech')} className="flex items-center gap-2 px-4 py-2 bg-cyan-900/20 hover:bg-cyan-800/40 border border-cyan-700/30 rounded text-sm text-cyan-400 transition-colors">
                        <Cpu className="w-4 h-4" /> Technologia PC
                    </button>
                </div>
            )}

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
