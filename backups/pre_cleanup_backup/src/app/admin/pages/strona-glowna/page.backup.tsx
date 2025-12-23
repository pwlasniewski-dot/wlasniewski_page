// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api-config';
import { Save, ArrowLeft, Plus, Trash2, Image as ImageIcon, Eye, EyeOff, MoveUp, MoveDown, Layout, LayoutTemplate, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import MediaPicker from '@/components/admin/MediaPicker';

// --- Types ---

interface HeroSlide {
    id: string;
    image: string;
    mobileImage?: string;
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
    enabled: boolean;
    order: number;
}

interface Feature {
    id: string;
    title: string;
    items: string[];
    enabled: boolean;
}

type SectionType = 'about' | 'features' | 'parallax' | 'info_band' | 'challenge_banner' | 'testimonials';

interface BaseSection {
    id: string;
    type: SectionType;
    label: string;
    enabled: boolean;
    backgroundColor?: 'black' | 'zinc-900' | 'zinc-800' | 'gold-900' | 'white';
    textVariant?: 'light' | 'dark';
}

interface AboutSection extends BaseSection {
    type: 'about';
    data: {
        title?: string;
        content?: string;
        image?: string;
        cta1Text?: string;
        cta1Link?: string;
        cta2Text?: string;
        cta2Link?: string;
        imageShape?: 'square' | 'circle';
        imageSize?: number;
        textPosition?: 'left' | 'center' | 'right';
        blocks?: Array<{
            id: string;
            image: string;
            title: string;
            content: string;
            position: 'left' | 'right';
            imageShape?: 'square' | 'circle';
            imageSize?: number;
        }>;
    };
}

interface FeaturesSection extends BaseSection {
    type: 'features';
    data: {
        features: Feature[];
    };
}

interface ParallaxSection extends BaseSection {
    type: 'parallax';
    data: {
        image: string;
        title: string;
    };
}

interface InfoBandSection extends BaseSection {
    type: 'info_band';
    data: {
        image?: string;
        title?: string;
        content?: string;
        position?: 'left' | 'center' | 'right';
        blocks?: Array<{
            id: string;
            image: string;
            title: string;
            content: string;
            position: 'left' | 'right';
            imageShape?: 'square' | 'circle';
            imageSize?: number;
        }>;
    };
}

interface TestimonialsSection extends BaseSection {
    type: 'testimonials';
    data: {
        title: string;
        subtitle: string;
    };
}

interface BannerItem {
    id: string;
    type: 'image' | 'video' | 'challenge';
    src: string;
    challengePhotos?: string[];
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    animation: 'fade' | 'slide-left' | 'slide-right' | 'zoom' | 'rotate';
    imageSize?: number;
    contentPosition?: 'left' | 'center' | 'right';
    imageShape?: 'square' | 'circle';
}

interface ChallengeBannerSection extends BaseSection {
    type: 'challenge_banner';
    data: {
        title: string;
        content: string;
        buttonText: string;
        buttonLink: string;
        effect: 'none' | 'carousel' | 'masonry' | 'puzzle' | 'orbiting3d';
        photos: string[];
        advanced?: {
            enabled: boolean;
            items: BannerItem[];
            config: {
                autoScroll: boolean;
                interval: number;
                height: string;
                floating: boolean;
                loop?: boolean;
                imageSize?: number;
                layout?: 'full' | 'split';
                position?: 'left' | 'right';
            };
        };
    };
}

type Section = AboutSection | FeaturesSection | ParallaxSection | InfoBandSection | ChallengeBannerSection | TestimonialsSection;

export default function HomepageManager() {
    const router = useRouter();
    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
    const [sections, setSections] = useState<Section[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
    const [currentPickerTarget, setCurrentPickerTarget] = useState<{ type: 'hero' | 'section' | 'advanced' | 'advanced_challenge', index: number, field?: string, subIndex?: number } | null>(null);

    useEffect(() => {
        fetchHomepage();
    }, []);

    const fetchHomepage = async () => {
        try {
            const res = await fetch(`${getApiUrl('pages')}?slug=strona-glowna`);
            const data = await res.json();

            if (data.success && data.page?.home_sections) {
                const parsed = JSON.parse(data.page.home_sections);

                if (parsed.hero_slider) setHeroSlides(parsed.hero_slider);

                if (parsed.sections && Array.isArray(parsed.sections)) {
                    setSections(parsed.sections);
                } else {
                    const newSections: Section[] = [];
                    if (parsed.about_section) newSections.push({ id: 'about', type: 'about', label: 'Sekcja "O mnie"', enabled: parsed.about_section.enabled ?? true, data: parsed.about_section });
                    if (parsed.features) newSections.push({ id: 'features', type: 'features', label: 'Kafelki (Features)', enabled: true, data: { features: parsed.features } });
                    if (parsed.challenge_banner) newSections.push({ id: 'challenge', type: 'challenge_banner', label: 'Baner Foto Wyzwania', enabled: parsed.challenge_banner.enabled ?? true, data: { ...parsed.challenge_banner, effect: parsed.foto_wyzwanie_effect || 'none', photos: parsed.foto_wyzwanie_photos || [], advanced: { enabled: false, items: [], config: { autoScroll: true, interval: 5, height: '600px', floating: false } } } });
                    if (parsed.parallax1) newSections.push({ id: 'parallax1', type: 'parallax', label: 'Parallax 1 (Środek)', enabled: parsed.parallax1.enabled ?? true, data: parsed.parallax1 });
                    if (parsed.info_band) newSections.push({ id: 'info_band', type: 'info_band', label: 'Sekcja Informacyjna (Biała)', enabled: parsed.info_band.enabled ?? true, data: { ...parsed.info_band, position: 'left' } });
                    if (parsed.parallax2) newSections.push({ id: 'parallax2', type: 'parallax', label: 'Parallax 2 (Dół)', enabled: parsed.parallax2.enabled ?? true, data: parsed.parallax2 });
                    setSections(newSections);
                }
                setSections(currentSections => {
                    if (!currentSections.some(s => s.type === 'testimonials')) {
                        return [...currentSections, { id: 'testimonials', type: 'testimonials', label: 'Opinie', enabled: true, data: { title: 'Co mówią klienci', subtitle: '' } }];
                    }
                    return currentSections;
                });
            }
        } catch (error) {
            console.error('Failed to fetch homepage', error);
            toast.error('Błąd ładowania danych');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('admin_token');
            const homeSections = {
                hero_slider: heroSlides,
                sections: sections
            };

            const res = await fetch(getApiUrl('pages'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    slug: 'strona-glowna',
                    title: 'Strona główna',
                    content: '',
                    is_published: true,
                    home_sections: JSON.stringify(homeSections)
                }),
            });

            if (res.ok) {
                toast.success('Zapisano zmiany');
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error(error);
            toast.error('Błąd zapisu');
        } finally {
            setSaving(false);
        }
    };

    const openMediaPicker = (type: 'hero' | 'section' | 'advanced' | 'advanced_challenge', index: number, field?: string, subIndex?: number) => {
        setCurrentPickerTarget({ type, index, field, subIndex });
        setMediaPickerOpen(true);
    };

    const handleMediaSelect = (url: string | string[]) => {
        const filePath = Array.isArray(url) ? url[0] : url;
        const filePaths = Array.isArray(url) ? url : [url];

        if (!currentPickerTarget) return;

        if (currentPickerTarget.type === 'hero') {
            const updated = [...heroSlides];
            const slide = updated[currentPickerTarget.index];
            if (currentPickerTarget.field === 'mobileImage') {
                slide.mobileImage = filePath;
            } else {
                slide.image = filePath;
            }
            setHeroSlides(updated);
        } else if (currentPickerTarget.type === 'advanced') {
            const updated = [...sections];
            const section = updated[currentPickerTarget.index] as ChallengeBannerSection;
            if (section.data.advanced && typeof currentPickerTarget.subIndex === 'number') {
                const item = section.data.advanced.items[currentPickerTarget.subIndex];
                item.src = filePath;
                item.type = filePath.endsWith('.mp4') ? 'video' : 'image';
            }
            setSections(updated);
        } else if (currentPickerTarget.type === 'advanced_challenge') {
            const updated = [...sections];
            if (currentPickerTarget.subIndex !== undefined) {
                const section = updated[currentPickerTarget.index] as ChallengeBannerSection;
                const item = section.data.advanced!.items[currentPickerTarget.subIndex];
                const currentPhotos = item.challengePhotos || [];
                const newPhotos = [...currentPhotos, ...filePaths].slice(0, 2);
                updateBannerItem(currentPickerTarget.index, currentPickerTarget.subIndex, 'challengePhotos', newPhotos);
            }
            setSections(updated);
        } else {
            const updated = [...sections];
            const section = updated[currentPickerTarget.index];

            if (currentPickerTarget.field && currentPickerTarget.field.startsWith('blocks.')) {
                const parts = currentPickerTarget.field.split('.');
                const blockIndex = parseInt(parts[1]);
                const blockField = parts[2];

                if ((section.type === 'about' || section.type === 'info_band') && section.data.blocks) {
                    (section.data.blocks[blockIndex] as any)[blockField] = filePath;
                }
            } else if (section.type === 'about' || section.type === 'parallax' || section.type === 'info_band') {
                (section.data as any).image = filePath;
            } else if (section.type === 'challenge_banner') {
                if (currentPickerTarget.field === 'photos') {
                    const currentPhotos = (section.data as any).photos || [];
                    (section.data as any).photos = [...currentPhotos, ...filePaths];
                }
            }
            setSections(updated);
        }
        setMediaPickerOpen(false);
        setCurrentPickerTarget(null);
    };

    const moveSection = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === sections.length - 1) return;
        const newSections = [...sections];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
        setSections(newSections);
    };

    const toggleSection = (index: number) => {
        const newSections = [...sections];
        newSections[index].enabled = !newSections[index].enabled;
        setSections(newSections);
    };

    const updateSectionData = (index: number, field: string, value: any) => {
        const newSections = [...sections];
        (newSections[index].data as any)[field] = value;
        setSections(newSections);
    };

    const addHeroSlide = () => {
        setHeroSlides([...heroSlides, {
            id: `slide-${Date.now()}`,
            image: '',
            title: 'Nowy slajd',
            subtitle: '',
            buttonText: 'Zobacz więcej',
            buttonLink: '/portfolio',
            enabled: true,
            order: heroSlides.length
        }]);
    };

    const removeHeroSlide = (index: number) => {
        setHeroSlides(heroSlides.filter((_, i) => i !== index));
    };

    const updateHeroSlide = (index: number, field: string, value: any) => {
        const updated = [...heroSlides];
        updated[index] = { ...updated[index], [field]: value };
        setHeroSlides(updated);
    };

    const moveHeroSlide = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= heroSlides.length) return;
        const updated = [...heroSlides];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        setHeroSlides(updated);
    };

    // --- Feature Specific Functions ---
    const addFeature = (sectionIndex: number) => {
        const newSections = [...sections];
        const section = newSections[sectionIndex] as FeaturesSection;
        section.data.features.push({ id: `feature-${Date.now()}`, title: 'Nowa sekcja', items: ['Punkt 1', 'Punkt 2'], enabled: true });
        setSections(newSections);
    };

    const removeFeature = (sectionIndex: number, featureIndex: number) => {
        const newSections = [...sections];
        const section = newSections[sectionIndex] as FeaturesSection;
        section.data.features = section.data.features.filter((_, i) => i !== featureIndex);
        setSections(newSections);
    };

    const updateFeature = (sectionIndex: number, featureIndex: number, field: string, value: any) => {
        const newSections = [...sections];
        const section = newSections[sectionIndex] as FeaturesSection;
        (section.data.features[featureIndex] as any)[field] = value;
        setSections(newSections);
    };

    const addFeatureItem = (sectionIndex: number, featureIndex: number) => {
        const newSections = [...sections];
        const section = newSections[sectionIndex] as FeaturesSection;
        section.data.features[featureIndex].items.push('Nowy punkt');
        setSections(newSections);
    };

    const updateFeatureItem = (sectionIndex: number, featureIndex: number, itemIndex: number, value: string) => {
        const newSections = [...sections];
        const section = newSections[sectionIndex] as FeaturesSection;
        section.data.features[featureIndex].items[itemIndex] = value;
        setSections(newSections);
    };

    const removeFeatureItem = (sectionIndex: number, featureIndex: number, itemIndex: number) => {
        const newSections = [...sections];
        const section = newSections[sectionIndex] as FeaturesSection;
        section.data.features[featureIndex].items = section.data.features[featureIndex].items.filter((_, i) => i !== itemIndex);
        setSections(newSections);
    };

    // --- Advanced Banner Functions ---
    const toggleAdvancedMode = (index: number) => {
        const newSections = [...sections];
        const section = newSections[index] as ChallengeBannerSection;
        if (!section.data.advanced) {
            section.data.advanced = { enabled: true, items: [], config: { autoScroll: true, interval: 5, height: '600px', floating: false } };
        } else {
            section.data.advanced.enabled = !section.data.advanced.enabled;
        }
        setSections(newSections);
    };

    const addBannerItem = (index: number) => {
        const newSections = [...sections];
        const section = newSections[index] as ChallengeBannerSection;
        if (!section.data.advanced) return;
        section.data.advanced.items.push({ id: Date.now().toString(), type: 'image', src: '', title: 'Nowy Slajd', subtitle: '', ctaText: '', ctaLink: '', animation: 'fade' });
        setSections(newSections);
    };

    const removeBannerItem = (sectionIndex: number, itemIndex: number) => {
        const newSections = [...sections];
        const section = newSections[sectionIndex] as ChallengeBannerSection;
        if (!section.data.advanced) return;
        section.data.advanced.items = section.data.advanced.items.filter((_, i) => i !== itemIndex);
        setSections(newSections);
    };

    const updateBannerItem = (sectionIndex: number, itemIndex: number, field: keyof BannerItem, value: any) => {
        const newSections = [...sections];
        const section = newSections[sectionIndex] as ChallengeBannerSection;
        if (!section.data.advanced) return;
        (section.data.advanced.items[itemIndex] as any)[field] = value;
        setSections(newSections);
    };

    const updateBannerConfig = (sectionIndex: number, field: string, value: any) => {
        const newSections = [...sections];
        const section = newSections[sectionIndex] as ChallengeBannerSection;
        if (!section.data.advanced) return;
        (section.data.advanced.config as any)[field] = value;
        setSections(newSections);
    };

    if (loading) return <div className="text-zinc-400 p-8">Ładowanie...</div>;

    return (
        <div className="max-w-7xl pb-20">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/pages" className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <h1 className="text-2xl font-semibold text-white">Zarządzanie stroną główną</h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black rounded-md font-medium disabled:opacity-50 flex items-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
                </button>
            </div>

            <div className="space-y-8">
                {/* HERO SLIDER */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Layout className="w-5 h-5 text-gold-400" />
                            Hero Slider (Zawsze na górze)
                        </h2>
                        <button onClick={addHeroSlide} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm font-medium flex items-center gap-1">
                            <Plus className="w-4 h-4" /> Dodaj slajd
                        </button>
                    </div>

                    <div className="space-y-4">
                        {heroSlides.map((slide, index) => (
                            <div key={slide.id} className="bg-black/50 border border-zinc-800 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-medium text-zinc-400">Slajd #{index + 1}</span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => moveHeroSlide(index, 'up')} disabled={index === 0} className="p-1 text-zinc-500 hover:text-white disabled:opacity-30"><MoveUp className="w-4 h-4" /></button>
                                        <button onClick={() => moveHeroSlide(index, 'down')} disabled={index === heroSlides.length - 1} className="p-1 text-zinc-500 hover:text-white disabled:opacity-30"><MoveDown className="w-4 h-4" /></button>
                                        <button onClick={() => updateHeroSlide(index, 'enabled', !slide.enabled)} className={`p-1 ${slide.enabled ? 'text-green-400' : 'text-zinc-600'}`}>{slide.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
                                        <button onClick={() => removeHeroSlide(index)} className="p-1 text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    {/* Desktop Image */}
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Zdjęcie Desktop</label>
                                        <div className="flex gap-2">
                                            <div className="relative w-24 h-16 bg-black rounded border border-zinc-700 overflow-hidden flex-shrink-0">
                                                {slide.image ? <img src={slide.image} alt="Slide" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-600"><ImageIcon className="w-6 h-6" /></div>}
                                            </div>
                                            <div className="flex flex-col justify-center gap-2">
                                                <button onClick={() => openMediaPicker('hero', index)} className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700">{slide.image ? 'Zmień' : 'Wybierz'}</button>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Mobile Image */}
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Zdjęcie Mobile</label>
                                        <div className="flex gap-2">
                                            <div className="relative w-16 h-20 bg-black rounded border border-zinc-700 overflow-hidden flex-shrink-0">
                                                {slide.mobileImage ? <img src={slide.mobileImage} alt="Mobile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-600"><ImageIcon className="w-6 h-6" /></div>}
                                            </div>
                                            <div className="flex flex-col justify-center gap-2">
                                                <button onClick={() => openMediaPicker('hero', index, 'mobileImage')} className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700">{slide.mobileImage ? 'Zmień' : 'Wybierz'}</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <input type="text" value={slide.title} onChange={(e) => updateHeroSlide(index, 'title', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white text-sm" placeholder="Nagłówek" />
                                        <input type="text" value={slide.subtitle} onChange={(e) => updateHeroSlide(index, 'subtitle', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-400 text-sm" placeholder="Podtytuł" />
                                    </div>
                                    <div className="space-y-3">
                                        <input type="text" value={slide.buttonText} onChange={(e) => updateHeroSlide(index, 'buttonText', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-300 text-sm" placeholder="Tekst przycisku" />
                                        <input type="text" value={slide.buttonLink} onChange={(e) => updateHeroSlide(index, 'buttonLink', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-300 text-sm" placeholder="Link przycisku" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SECTIONS LIST */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2 px-1">
                        <LayoutTemplate className="w-5 h-5 text-gold-400" />
                        Sekcje strony
                    </h2>

                    {sections.map((section, index) => (
                        <div key={section.id} className={`bg-zinc-900 border ${section.enabled ? 'border-zinc-700' : 'border-zinc-800 opacity-60'} rounded-lg overflow-hidden transition-all duration-200`}>
                            <div className="bg-zinc-950/50 p-4 flex items-center justify-between border-b border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-8 rounded-full ${section.enabled ? 'bg-gold-500' : 'bg-zinc-700'}`} />
                                    <div>
                                        <h3 className="font-medium text-white">{section.label}</h3>
                                        <span className="text-xs text-zinc-500 uppercase tracking-wider">{section.type}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {/* Global Section Styles */}
                                    {section.enabled && (
                                        <div className="flex items-center gap-2 mr-4 border-r border-zinc-800 pr-4">
                                            <select
                                                value={section.backgroundColor || 'zinc-900'}
                                                onChange={(e) => {
                                                    const newSections = [...sections];
                                                    newSections[index].backgroundColor = e.target.value as any;
                                                    setSections(newSections);
                                                }}
                                                className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-400"
                                            >
                                                <option value="black">Czarne tło</option>
                                                <option value="zinc-950">Bardzo ciemne (Zinc-950)</option>
                                                <option value="zinc-900">Ciemne (Zinc-900)</option>
                                                <option value="zinc-800">Szare (Zinc-800)</option>
                                                <option value="white">Białe tło</option>
                                                <option value="gold-900">Złote ciemne</option>
                                            </select>
                                            <select
                                                value={section.textVariant || 'light'}
                                                onChange={(e) => {
                                                    const newSections = [...sections];
                                                    newSections[index].textVariant = e.target.value as any;
                                                    setSections(newSections);
                                                }}
                                                className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-400"
                                            >
                                                <option value="light">Jasny tekst</option>
                                                <option value="dark">Ciemny tekst</option>
                                            </select>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="p-2 text-zinc-500 hover:text-white disabled:opacity-30"><MoveUp className="w-4 h-4" /></button>
                                        <button onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1} className="p-2 text-zinc-500 hover:text-white disabled:opacity-30"><MoveDown className="w-4 h-4" /></button>
                                        <button onClick={() => toggleSection(index)} className={`p-2 ${section.enabled ? 'text-green-400' : 'text-zinc-600'}`}>{section.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
                                    </div>
                                </div>
                            </div>

                            {section.enabled && (
                                <div className="p-6 space-y-6">
                                    {section.type === 'about' && (
                                        <div className="space-y-4">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm text-zinc-400 mb-1">Tytuł sekcji</label>
                                                    <input type="text" value={section.data.title || ''} onChange={e => updateSectionData(index, 'title', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-zinc-400 mb-1">Zdjęcie główne</label>
                                                    <div className="flex gap-2">
                                                        <input type="text" value={section.data.image || ''} readOnly className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-400 text-sm" />
                                                        <button onClick={() => openMediaPicker('section', index)} className="px-3 bg-zinc-800 border border-zinc-700 rounded hover:bg-zinc-700 text-white"><ImageIcon className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Advanced Appearance Controls */}
                                            <div className="grid md:grid-cols-3 gap-4 p-4 bg-zinc-950/50 rounded border border-zinc-800/50">
                                                <div>
                                                    <label className="block text-xs uppercase text-zinc-500 mb-1">Kształt zdjęcia</label>
                                                    <select
                                                        value={section.data.imageShape || 'square'}
                                                        onChange={e => updateSectionData(index, 'imageShape', e.target.value)}
                                                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-white text-sm"
                                                    >
                                                        <option value="square">Kwadrat / Prostokąt</option>
                                                        <option value="circle">Koło</option>
                                                        <option value="blob">Organiczny (Blob)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs uppercase text-zinc-500 mb-1">Pozycja Tekstu</label>
                                                    <select
                                                        value={section.data.textPosition || 'left'}
                                                        onChange={e => updateSectionData(index, 'textPosition', e.target.value)}
                                                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-white text-sm"
                                                    >
                                                        <option value="left">Tekst po lewej, Zdjęcie po prawej</option>
                                                        <option value="right">Tekst po prawej, Zdjęcie po lewej</option>
                                                        <option value="center">Wyśrodkowane</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs uppercase text-zinc-500 mb-1">Rozmiar zdjęcia (%)</label>
                                                    <input
                                                        type="number"
                                                        value={section.data.imageSize || 100}
                                                        onChange={e => updateSectionData(index, 'imageSize', parseInt(e.target.value))}
                                                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-white text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm text-zinc-400 mb-1">Treść (HTML)</label>
                                                <textarea value={section.data.content || ''} onChange={e => updateSectionData(index, 'content', e.target.value)} rows={6} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white font-mono text-sm" />
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs uppercase text-zinc-500 mb-1">Przycisk 1 (Tekst)</label>
                                                    <input type="text" value={section.data.cta1Text || ''} onChange={e => updateSectionData(index, 'cta1Text', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white text-sm" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs uppercase text-zinc-500 mb-1">Przycisk 1 (Link)</label>
                                                    <input type="text" value={section.data.cta1Link || ''} onChange={e => updateSectionData(index, 'cta1Link', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-400 text-sm" />
                                                </div>
                                            </div>

                                            {/* BLOCKS MANAGER */}
                                            <div className="pt-6 border-t border-zinc-800">
                                                <h4 className="text-sm font-medium text-zinc-400 mb-4">Dodatkowe Bloki (Multi-Blocks)</h4>
                                                <div className="space-y-4">
                                                    {(section.data.blocks || []).map((block, bIdx) => (
                                                        <div key={block.id || bIdx} className="bg-zinc-950 p-4 rounded border border-zinc-800 relative">
                                                            <button
                                                                onClick={() => {
                                                                    const newSections = [...sections];
                                                                    (newSections[index].data as any).blocks = section.data.blocks!.filter((_, i) => i !== bIdx);
                                                                    setSections(newSections);
                                                                }}
                                                                className="absolute top-2 right-2 text-zinc-600 hover:text-red-400"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <div className="flex gap-2 mb-2">
                                                                        <div className="relative w-16 h-16 bg-black border border-zinc-800 rounded overflow-hidden flex-shrink-0">
                                                                            {block.image ? <img src={block.image} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full"><ImageIcon className="w-4 h-4 text-zinc-600" /></div>}
                                                                        </div>
                                                                        <button onClick={() => openMediaPicker('section', index, `blocks.${bIdx}.image`)} className="px-3 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-300">Zmień zdjęcie</button>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <select
                                                                            value={block.imageShape || 'square'}
                                                                            onChange={e => {
                                                                                const newSections = [...sections];
                                                                                (newSections[index].data as any).blocks[bIdx].imageShape = e.target.value;
                                                                                setSections(newSections);
                                                                            }}
                                                                            className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-400"
                                                                        >
                                                                            <option value="square">Kwadrat</option>
                                                                            <option value="circle">Koło</option>
                                                                        </select>
                                                                        <select
                                                                            value={block.position || 'left'}
                                                                            onChange={e => {
                                                                                const newSections = [...sections];
                                                                                (newSections[index].data as any).blocks[bIdx].position = e.target.value;
                                                                                setSections(newSections);
                                                                            }}
                                                                            className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-400"
                                                                        >
                                                                            <option value="left">Lewo</option>
                                                                            <option value="right">Prawo</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <input type="text" value={block.title} onChange={e => {
                                                                        const newSections = [...sections];
                                                                        (newSections[index].data as any).blocks[bIdx].title = e.target.value;
                                                                        setSections(newSections);
                                                                    }} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-white text-sm" placeholder="Tytuł bloku" />
                                                                    <textarea value={block.content} onChange={e => {
                                                                        const newSections = [...sections];
                                                                        (newSections[index].data as any).blocks[bIdx].content = e.target.value;
                                                                        setSections(newSections);
                                                                    }} rows={3} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-white text-xs font-mono" placeholder="Treść bloku" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => {
                                                            const newSections = [...sections];
                                                            if (!(newSections[index].data as any).blocks) (newSections[index].data as any).blocks = [];
                                                            (newSections[index].data as any).blocks.push({
                                                                id: Date.now().toString(),
                                                                title: 'Nowy blok',
                                                                content: '',
                                                                image: '',
                                                                position: 'left',
                                                                imageShape: 'square'
                                                            });
                                                            setSections(newSections);
                                                        }}
                                                        className="w-full py-2 border border-dashed border-zinc-800 text-zinc-500 hover:text-white rounded text-sm"
                                                    >
                                                        + Dodaj kolejny blok
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {section.type === 'features' && (
                                        <div className="space-y-6">
                                            {(section.data.features as Feature[]).map((feature, fIndex) => (
                                                <div key={feature.id} className="bg-black/30 border border-zinc-800 rounded p-4 relative group">
                                                    <button onClick={() => removeFeature(index, fIndex)} className="absolute top-2 right-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                                                    <div className="mb-4">
                                                        <label className="block text-xs uppercase text-zinc-500 mb-1">Tytuł kafelka</label>
                                                        <input type="text" value={feature.title} onChange={e => updateFeature(index, fIndex, 'title', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="block text-xs uppercase text-zinc-500">Lista punktów</label>
                                                        {feature.items.map((item, iIndex) => (
                                                            <div key={iIndex} className="flex gap-2">
                                                                <input type="text" value={item} onChange={e => updateFeatureItem(index, fIndex, iIndex, e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-300" />
                                                                <button onClick={() => removeFeatureItem(index, fIndex, iIndex)} className="text-zinc-600 hover:text-red-400"><X className="w-4 h-4" /></button>
                                                            </div>
                                                        ))}
                                                        <button onClick={() => addFeatureItem(index, fIndex)} className="text-xs text-gold-500 hover:text-gold-400 font-medium">+ Dodaj punkt</button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={() => addFeature(index)} className="w-full py-2 border border-dashed border-zinc-700 text-zinc-400 rounded hover:border-zinc-500 hover:text-white text-sm">+ Dodaj kafelek</button>
                                        </div>
                                    )}

                                    {section.type === 'parallax' && (
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-zinc-400 mb-1">Tekst na zdjęciu</label>
                                                <input type="text" value={section.data.title || ''} onChange={e => updateSectionData(index, 'title', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white" />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-zinc-400 mb-1">Zdjęcie w tle</label>
                                                <div className="flex gap-2">
                                                    <input type="text" value={section.data.image || ''} readOnly className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-400 text-sm" />
                                                    <button onClick={() => openMediaPicker('section', index)} className="px-3 bg-zinc-800 border border-zinc-700 rounded hover:bg-zinc-700 text-white"><ImageIcon className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {section.type === 'info_band' && (
                                        <div className="space-y-4">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm text-zinc-400 mb-1">Tytuł</label>
                                                    <input type="text" value={section.data.title || ''} onChange={e => updateSectionData(index, 'title', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-zinc-400 mb-1">Zdjęcie</label>
                                                    <div className="flex gap-2">
                                                        <input type="text" value={section.data.image || ''} readOnly className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-400 text-sm" />
                                                        <button onClick={() => openMediaPicker('section', index)} className="px-3 bg-zinc-800 border border-zinc-700 rounded hover:bg-zinc-700 text-white"><ImageIcon className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs uppercase text-zinc-500 mb-1">Pozycja zdjęcia</label>
                                                    <select
                                                        value={section.data.position || 'left'}
                                                        onChange={e => updateSectionData(index, 'position', e.target.value)}
                                                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-white text-sm"
                                                    >
                                                        <option value="left">Zdjęcie po lewej</option>
                                                        <option value="right">Zdjęcie po prawej</option>
                                                        <option value="center">Zgrupowane (Centralnie)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm text-zinc-400 mb-1">Treść</label>
                                                <textarea value={section.data.content || ''} onChange={e => updateSectionData(index, 'content', e.target.value)} rows={3} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white font-mono text-sm" />
                                            </div>

                                            {/* BLOCKS MANAGER FOR INFO BAND */}
                                            <div className="pt-6 border-t border-zinc-800">
                                                <h4 className="text-sm font-medium text-zinc-400 mb-4">Dodatkowe Bloki (Multi-Blocks)</h4>
                                                <div className="space-y-4">
                                                    {(section.data.blocks || []).map((block, bIdx) => (
                                                        <div key={block.id || bIdx} className="bg-zinc-950 p-4 rounded border border-zinc-800 relative">
                                                            <button
                                                                onClick={() => {
                                                                    const newSections = [...sections];
                                                                    (newSections[index].data as any).blocks = section.data.blocks!.filter((_, i) => i !== bIdx);
                                                                    setSections(newSections);
                                                                }}
                                                                className="absolute top-2 right-2 text-zinc-600 hover:text-red-400"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <div className="flex gap-2 mb-2">
                                                                        <div className="relative w-16 h-16 bg-black border border-zinc-800 rounded overflow-hidden flex-shrink-0">
                                                                            {block.image ? <img src={block.image} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full"><ImageIcon className="w-4 h-4 text-zinc-600" /></div>}
                                                                        </div>
                                                                        <button onClick={() => openMediaPicker('section', index, `blocks.${bIdx}.image`)} className="px-3 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-300">Zmień zdjęcie</button>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <select
                                                                            value={block.imageShape || 'square'}
                                                                            onChange={e => {
                                                                                const newSections = [...sections];
                                                                                (newSections[index].data as any).blocks[bIdx].imageShape = e.target.value;
                                                                                setSections(newSections);
                                                                            }}
                                                                            className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-400"
                                                                        >
                                                                            <option value="square">Kwadrat</option>
                                                                            <option value="circle">Koło</option>
                                                                        </select>
                                                                        <select
                                                                            value={block.position || 'left'}
                                                                            onChange={e => {
                                                                                const newSections = [...sections];
                                                                                (newSections[index].data as any).blocks[bIdx].position = e.target.value;
                                                                                setSections(newSections);
                                                                            }}
                                                                            className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-400"
                                                                        >
                                                                            <option value="left">Lewo</option>
                                                                            <option value="right">Prawo</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <input type="text" value={block.title} onChange={e => {
                                                                        const newSections = [...sections];
                                                                        (newSections[index].data as any).blocks[bIdx].title = e.target.value;
                                                                        setSections(newSections);
                                                                    }} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-white text-sm" placeholder="Tytuł bloku" />
                                                                    <textarea value={block.content} onChange={e => {
                                                                        const newSections = [...sections];
                                                                        (newSections[index].data as any).blocks[bIdx].content = e.target.value;
                                                                        setSections(newSections);
                                                                    }} rows={3} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-white text-xs font-mono" placeholder="Treść bloku" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => {
                                                            const newSections = [...sections];
                                                            if (!(newSections[index].data as any).blocks) (newSections[index].data as any).blocks = [];
                                                            (newSections[index].data as any).blocks.push({
                                                                id: Date.now().toString(),
                                                                title: 'Nowy blok',
                                                                content: '',
                                                                image: '',
                                                                position: 'left',
                                                                imageShape: 'square'
                                                            });
                                                            setSections(newSections);
                                                        }}
                                                        className="w-full py-2 border border-dashed border-zinc-800 text-zinc-500 hover:text-white rounded text-sm"
                                                    >
                                                        + Dodaj kolejny blok
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {section.type === 'testimonials' && (
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-zinc-400 mb-1">Nagłówek sekcji</label>
                                                <input type="text" value={section.data.title} onChange={e => updateSectionData(index, 'title', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white" />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-zinc-400 mb-1">Podtytuł</label>
                                                <input type="text" value={section.data.subtitle} onChange={e => updateSectionData(index, 'subtitle', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white" />
                                            </div>
                                        </div>
                                    )}

                                    {section.type === 'challenge_banner' && (
                                        <div className="space-y-4">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm text-zinc-400 mb-1">Tytuł Baneru</label>
                                                    <input type="text" value={section.data.title || ''} onChange={e => updateSectionData(index, 'title', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-zinc-400 mb-1">Efekt Wizualny</label>
                                                    <select
                                                        value={section.data.effect || 'none'}
                                                        onChange={e => updateSectionData(index, 'effect', e.target.value)}
                                                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white"
                                                    >
                                                        <option value="none">Brak (Standardowy)</option>
                                                        <option value="puzzle">Puzzle (Rozsypane zdjęcia)</option>
                                                        <option value="orbiting3d">Orbita 3D (Krążące zdjęcia)</option>
                                                        <option value="carousel">Karuzela</option>
                                                        <option value="masonry">Masonry (Kafelki)</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm text-zinc-400 mb-1">Tekst przycisku</label>
                                                    <input type="text" value={section.data.buttonText || ''} onChange={e => updateSectionData(index, 'buttonText', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-zinc-400 mb-1">Link przycisku</label>
                                                    <input type="text" value={section.data.buttonLink || ''} onChange={e => updateSectionData(index, 'buttonLink', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-400" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm text-zinc-400 mb-1">Treść (opis)</label>
                                                <textarea value={section.data.content || ''} onChange={e => updateSectionData(index, 'content', e.target.value)} rows={2} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white font-mono text-sm" />
                                            </div>

                                            {/* PHOTO GALLERY FOR EFFECTS */}
                                            <div className="mt-4 p-4 bg-zinc-950/30 rounded border border-zinc-800/50">
                                                <label className="block text-sm text-zinc-400 mb-3">Galeria zdjęć (dla efektów: Puzzle, Orbita, Karuzela)</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {(section.data.photos || []).map((photo, pIdx) => (
                                                        <div key={pIdx} className="relative w-20 h-20 bg-black border border-zinc-800 rounded overflow-hidden group">
                                                            <img src={photo} className="w-full h-full object-cover" />
                                                            <button
                                                                onClick={() => {
                                                                    const newSections = [...sections];
                                                                    (newSections[index].data as any).photos = section.data.photos.filter((_, i) => i !== pIdx);
                                                                    setSections(newSections);
                                                                }}
                                                                className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => openMediaPicker('section', index, 'photos')}
                                                        className="w-20 h-20 border border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50 rounded flex flex-col items-center justify-center text-zinc-500 hover:text-white transition-all"
                                                    >
                                                        <Plus className="w-5 h-5 mb-1" />
                                                        <span className="text-[10px] uppercase tracking-wide">Dodaj</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Advanced Banner Toggle */}
                                            <div className="pt-4 border-t border-zinc-800">
                                                <button
                                                    onClick={() => toggleAdvancedMode(index)}
                                                    className={`flex items-center gap-2 text-sm font-medium ${section.data.advanced?.enabled ? 'text-gold-400' : 'text-zinc-500'}`}
                                                >
                                                    <div className={`w-4 h-4 border rounded relative flex items-center justify-center ${section.data.advanced?.enabled ? 'border-gold-400 bg-gold-400/10' : 'border-zinc-600'}`}>
                                                        {section.data.advanced?.enabled && <div className="w-2 h-2 bg-gold-400 rounded-sm" />}
                                                    </div>
                                                    Tryb Zaawansowany (Animowane Slajdy Puzzli)
                                                </button>

                                                {section.data.advanced?.enabled && (
                                                    <div className="mt-4 space-y-6 pl-4 border-l border-zinc-800">
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-950 p-4 rounded-lg">
                                                            <div>
                                                                <label className="block text-xs text-zinc-500 mb-1">Interwał (s)</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={section.data.advanced.config.interval}
                                                                    onChange={e => updateBannerConfig(index, 'interval', parseInt(e.target.value))}
                                                                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-sm"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-zinc-500 mb-1">Wysokość</label>
                                                                <input
                                                                    type="text"
                                                                    value={section.data.advanced.config.height}
                                                                    onChange={e => updateBannerConfig(index, 'height', e.target.value)}
                                                                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-sm"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2 pt-4">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={section.data.advanced.config.autoScroll}
                                                                    onChange={e => updateBannerConfig(index, 'autoScroll', e.target.checked)}
                                                                    className="rounded bg-zinc-900 border-zinc-700 text-gold-500"
                                                                />
                                                                <label className="text-sm text-zinc-400">Auto-przewijanie</label>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            {section.data.advanced.items.map((item, iIndex) => (
                                                                <div key={item.id} className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                                                                    <div className="flex justify-between items-start mb-4">
                                                                        <span className="text-zinc-400 font-medium text-sm">Slajd #{iIndex + 1}</span>
                                                                        <button onClick={() => removeBannerItem(index, iIndex)} className="text-zinc-600 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                                                                    </div>
                                                                    <div className="grid md:grid-cols-2 gap-4">
                                                                        <div>
                                                                            <label className="block text-xs text-zinc-500 mb-1">Typ</label>
                                                                            <select
                                                                                value={item.type || 'image'}
                                                                                onChange={e => updateBannerItem(index, iIndex, 'type', e.target.value)}
                                                                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-sm mb-2"
                                                                            >
                                                                                <option value="image">Zdjęcie</option>
                                                                                <option value="video">Wideo</option>
                                                                                <option value="challenge">Foto Wyzwanie (A vs B)</option>
                                                                            </select>

                                                                            {item.type === 'challenge' ? (
                                                                                <div className="flex gap-2 mt-2">
                                                                                    {item.challengePhotos?.map((photo, pIdx) => (
                                                                                        <div key={pIdx} className="relative group w-16 h-16">
                                                                                            <img src={photo} className="w-full h-full object-cover rounded" />
                                                                                            <button
                                                                                                onClick={() => {
                                                                                                    const newPhotos = item.challengePhotos?.filter((_, i) => i !== pIdx);
                                                                                                    updateBannerItem(index, iIndex, 'challengePhotos', newPhotos);
                                                                                                }}
                                                                                                className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100"
                                                                                            >
                                                                                                <X className="w-3 h-3 text-white" />
                                                                                            </button>
                                                                                        </div>
                                                                                    ))}
                                                                                    {(item.challengePhotos?.length || 0) < 2 && (
                                                                                        <button onClick={() => openMediaPicker('advanced_challenge', index, undefined, iIndex)} className="w-16 h-16 border border-dashed border-zinc-700 rounded flex items-center justify-center hover:border-zinc-500">
                                                                                            <Plus className="w-5 h-5 text-zinc-600" />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex gap-2">
                                                                                    {item.src && (item.type === 'video' ? <video src={item.src} className="w-16 h-12 object-cover rounded" /> : <img src={item.src} className="w-16 h-12 object-cover rounded" />)}
                                                                                    <button onClick={() => openMediaPicker('advanced', index, undefined, iIndex)} className="text-xs px-3 bg-zinc-800 border border-zinc-700 rounded text-zinc-300 hover:text-white flex-1">Wybierz plik</button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <input type="text" value={item.title} onChange={e => updateBannerItem(index, iIndex, 'title', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-sm" placeholder="Tytuł" />
                                                                            <input type="text" value={item.subtitle} onChange={e => updateBannerItem(index, iIndex, 'subtitle', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-400 text-sm" placeholder="Podtytuł" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <button onClick={() => addBannerItem(index)} className="w-full py-2 border border-dashed border-zinc-700 rounded text-zinc-400 hover:text-white text-sm">+ Dodaj slajd</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <MediaPicker
                isOpen={mediaPickerOpen}
                onClose={() => setMediaPickerOpen(false)}
                onSelect={handleMediaSelect}
                multiple={currentPickerTarget?.field === 'photos'}
            />
        </div>
    );
}
