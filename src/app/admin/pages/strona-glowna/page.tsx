/**
 * strona-glowna/page.tsx - Edytor strony głównej
 * Ostatnia aktualizacja: 2024-12-09 23:48
 * Przywrócono z commit 71870e92 - wybór koloru tła dla sekcji
 * Funkcje: Hero slider, sekcje dynamiczne, parallax, foto wyzwania, opinie
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api-config';
import { Save, ArrowLeft, Plus, Trash2, Image as ImageIcon, Eye, EyeOff, MoveUp, MoveDown, Layout, LayoutTemplate } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import MediaPicker from '@/components/admin/MediaPicker';
import templates from '@/lib/homepageModuleTemplates';

// --- Types ---

interface HeroSlide {
    id: string;
    image: string;
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
    label: string; // Display name in admin
    enabled: boolean;
    backgroundColor?: 'black' | 'zinc-900' | 'zinc-800' | 'gold-900' | 'white';
}

interface AboutSection extends BaseSection {
    type: 'about';
    data: {
        title: string;
        content: string;
        image: string;
        cta1Text: string;
        cta1Link: string;
        cta2Text: string;
        cta2Link: string;
        imageShape?: 'square' | 'circle';
        imageSize?: number;
        textPosition?: 'left' | 'center' | 'right';
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
        image: string;
        title: string;
        content: string;
        position?: 'left' | 'center' | 'right';
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
        // Visual effects
        effect: 'none' | 'carousel' | 'masonry' | 'puzzle' | 'orbiting3d';
        photos: string[];
        // Advanced Mode
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

                // Load Hero Slides
                if (parsed.hero_slider) setHeroSlides(parsed.hero_slider);

                // Load Sections - check if using new structure or migrate old one
                if (parsed.sections && Array.isArray(parsed.sections)) {
                    setSections(parsed.sections);
                } else {
                    // Migration from old structure
                    const newSections: Section[] = [];

                    if (parsed.about_section) {
                        newSections.push({
                            id: 'about',
                            type: 'about',
                            label: 'Sekcja "O mnie"',
                            enabled: parsed.about_section.enabled ?? true,
                            data: parsed.about_section
                        });
                    }

                    if (parsed.features) {
                        newSections.push({
                            id: 'features',
                            type: 'features',
                            label: 'Kafelki (Features)',
                            enabled: true,
                            data: { features: parsed.features }
                        });
                    }

                    if (parsed.challenge_banner) {
                        newSections.push({
                            id: 'challenge',
                            type: 'challenge_banner',
                            label: 'Baner Foto Wyzwania',
                            enabled: parsed.challenge_banner.enabled ?? true,
                            data: {
                                ...parsed.challenge_banner,
                                effect: parsed.foto_wyzwanie_effect || 'none',
                                photos: parsed.foto_wyzwanie_photos || [],
                                advanced: {
                                    enabled: false,
                                    items: [],
                                    config: { autoScroll: true, interval: 5, height: '600px', floating: false }
                                }
                            }
                        });
                    }

                    if (parsed.parallax1) {
                        newSections.push({
                            id: 'parallax1',
                            type: 'parallax',
                            label: 'Parallax 1 (Środek)',
                            enabled: parsed.parallax1.enabled ?? true,
                            data: parsed.parallax1
                        });
                    }

                    if (parsed.info_band) {
                        newSections.push({
                            id: 'info_band',
                            type: 'info_band',
                            label: 'Sekcja Informacyjna (Biała)',
                            enabled: parsed.info_band.enabled ?? true,
                            data: {
                                ...parsed.info_band,
                                position: 'left'
                            }
                        });
                    }

                    if (parsed.parallax2) {
                        newSections.push({
                            id: 'parallax2',
                            type: 'parallax',
                            label: 'Parallax 2 (Dół)',
                            enabled: parsed.parallax2.enabled ?? true,
                            data: parsed.parallax2
                        });
                    }

                    setSections(newSections);
                }

                // Ensure testimonials section exists (add if missing)
                setSections(currentSections => {
                    const hasTestimonials = currentSections.some(s => s.type === 'testimonials');
                    if (!hasTestimonials) {
                        return [...currentSections, {
                            id: 'testimonials',
                            type: 'testimonials',
                            label: 'Opinie',
                            enabled: true,
                            data: {
                                title: 'Co mówią klienci',
                                subtitle: ''
                            }
                        }];
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

    // --- Quick-add module helpers (use templates from lib) ---
    const addAboutSectionTemplate = () => {
        const tpl = templates.createAboutSectionTemplate();
        setSections(prev => [...prev, tpl]);
        toast.success('Dodano sekcję O mnie (pamiętaj zapisać)');
    };

    const addFeaturesSectionTemplate = () => {
        const tpl = templates.createFeaturesSectionTemplate();
        setSections(prev => [...prev, tpl]);
        toast.success('Dodano sekcję Kafelki (pamiętaj zapisać)');
    };

    const addParallaxSectionTemplate = () => {
        const tpl = templates.createParallaxSectionTemplate();
        setSections(prev => [...prev, tpl]);
        toast.success('Dodano sekcję Parallax (pamiętaj zapisać)');
    };

    const addInfoBandTemplate = () => {
        const tpl = templates.createInfoBandTemplate();
        setSections(prev => [...prev, tpl]);
        toast.success('Dodano Info Band (pamiętaj zapisać)');
    };

    const addChallengeBannerTemplate = () => {
        const tpl = templates.createChallengeBannerTemplate();
        setSections(prev => [...prev, tpl]);
        toast.success('Dodano Foto Wyzwanie (pamiętaj zapisać)');
    };

    const addTestimonialsTemplate = () => {
        const tpl = templates.createTestimonialsTemplate();
        setSections(prev => [...prev, tpl]);
        toast.success('Dodano Opinie (pamiętaj zapisać)');
    };

    const addHeroSlideTemplate = () => {
        const tpl = templates.createHeroSlideTemplate();
        setHeroSlides(prev => [...prev, tpl]);
        toast.success('Dodano slajd do hero (pamiętaj zapisać)');
    };

    // --- Add all modules at once (szybkie wypełnienie wszystkimi moduły) ---
    const addAllModulesAtOnce = () => {
        // Clear existing sections and add all templates
        const allSections: Section[] = [
            templates.createAboutSectionTemplate() as AboutSection,
            templates.createFeaturesSectionTemplate() as FeaturesSection,
            templates.createParallaxSectionTemplate() as ParallaxSection,
            templates.createInfoBandTemplate() as InfoBandSection,
            templates.createChallengeBannerTemplate() as ChallengeBannerSection,
            templates.createTestimonialsTemplate() as TestimonialsSection
        ];
        setSections(allSections);
        
        // Add hero slides
        const heroSlides = [
            templates.createHeroSlideTemplate()
        ];
        setHeroSlides(heroSlides);
        
        toast.success('Dodano wszystkie moduły! Uzupełnij treści i kliknij Zapisz zmiany');
    };

    // --- Media Picker ---

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
            // Handle different image fields for hero slides
            if (currentPickerTarget.field === 'image_desktop') {
                updated[currentPickerTarget.index].image_desktop = filePath;
            } else if (currentPickerTarget.field === 'image_mobile') {
                updated[currentPickerTarget.index].image_mobile = filePath;
            } else {
                updated[currentPickerTarget.index].image = filePath;
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
                // Add new photos, limit to 2
                const newPhotos = [...currentPhotos, ...filePaths].slice(0, 2);
                updateBannerItem(currentPickerTarget.index, currentPickerTarget.subIndex, 'challengePhotos', newPhotos);
            }
            setSections(updated);
        } else {
            const updated = [...sections];
            const section = updated[currentPickerTarget.index];

            if (section.type === 'about' || section.type === 'parallax' || section.type === 'info_band') {
                // Handle different image fields for sections
                if (currentPickerTarget.field === 'image_desktop') {
                    (section.data as any).image_desktop = filePath;
                } else if (currentPickerTarget.field === 'image_mobile') {
                    (section.data as any).image_mobile = filePath;
                } else {
                    (section.data as any).image = filePath;
                }
            } else if (section.type === 'challenge_banner') {
                // For challenge banner, we might be selecting multiple photos for the effect
                if (currentPickerTarget.field === 'photos') {
                    (section.data as any).photos = filePaths;
                }
            }

            setSections(updated);
        }

        setMediaPickerOpen(false);
        setCurrentPickerTarget(null);
    };

    // --- Section Management ---

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

    // --- Hero Slider Functions ---

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
        section.data.features.push({
            id: `feature-${Date.now()}`,
            title: 'Nowa sekcja',
            items: ['Punkt 1', 'Punkt 2'],
            enabled: true
        });
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
            section.data.advanced = {
                enabled: true,
                items: [],
                config: { autoScroll: true, interval: 5, height: '600px', floating: false }
            };
        } else {
            section.data.advanced.enabled = !section.data.advanced.enabled;
        }
        setSections(newSections);
    };

    const addBannerItem = (index: number) => {
        const newSections = [...sections];
        const section = newSections[index] as ChallengeBannerSection;
        if (!section.data.advanced) return;

        section.data.advanced.items.push({
            id: Date.now().toString(),
            type: 'image',
            src: '',
            title: 'Nowy Slajd',
            subtitle: '',
            ctaText: '',
            ctaLink: '',
            animation: 'fade'
        });
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

            {/* Quick-add toolbar: insert commonly used modules */}
            <div className="mb-6 flex flex-wrap gap-2">
                <button onClick={addAllModulesAtOnce} className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black rounded text-sm font-semibold">⭐ Dodaj wszystkie moduły</button>
                <button onClick={addHeroSlideTemplate} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm">Dodaj slajd (Hero)</button>
                <button onClick={addAboutSectionTemplate} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm">Dodaj O mnie</button>
                <button onClick={addFeaturesSectionTemplate} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm">Dodaj Kafelki</button>
                <button onClick={addParallaxSectionTemplate} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm">Dodaj Parallax</button>
                <button onClick={addInfoBandTemplate} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm">Dodaj Info Band</button>
                <button onClick={addChallengeBannerTemplate} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm">Dodaj Foto Wyzwanie</button>
                <button onClick={addTestimonialsTemplate} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm">Dodaj Opinie</button>
            </div>

            <div className="space-y-8">
                {/* HERO SLIDER (Always First) */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Layout className="w-5 h-5 text-gold-400" />
                            Hero Slider (Zawsze na górze)
                        </h2>
                        <button
                            onClick={addHeroSlide}
                            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm font-medium flex items-center gap-1"
                        >
                            <Plus className="w-4 h-4" />
                            Dodaj slajd
                        </button>
                    </div>

                    {heroSlides.map((slide, index) => (
                        <div key={slide.id} className="border border-zinc-700 rounded p-4 space-y-4 bg-zinc-900/50">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gold-400">Slajd #{index + 1}</span>
                                <div className="flex gap-1">
                                    <button onClick={() => moveHeroSlide(index, 'up')} disabled={index === 0} className="p-1 text-zinc-400 hover:text-white disabled:opacity-30"><MoveUp className="w-4 h-4" /></button>
                                    <button onClick={() => moveHeroSlide(index, 'down')} disabled={index === heroSlides.length - 1} className="p-1 text-zinc-400 hover:text-white disabled:opacity-30"><MoveDown className="w-4 h-4" /></button>
                                    <button onClick={() => updateHeroSlide(index, 'enabled', !slide.enabled)} className={`p-1 ${slide.enabled ? 'text-green-400' : 'text-zinc-500'}`}>{slide.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
                                    <button onClick={() => removeHeroSlide(index)} className="p-1 text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            {/* Images: fallback, desktop, mobile */}
                            <div className="grid md:grid-cols-3 gap-3 bg-zinc-800/30 p-3 rounded border border-zinc-700">
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Zdjęcie (fallback)</label>
                                    <div className="flex gap-2">
                                        {slide.image && <img src={slide.image} alt="" className="w-16 h-12 object-cover rounded" />}
                                        <button onClick={() => openMediaPicker('hero', index)} className="px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-xs text-white hover:bg-zinc-600 flex items-center gap-1">
                                            <ImageIcon className="w-3 h-3" /> {slide.image ? 'Zmień' : 'Wybierz'}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Desktop</label>
                                    <div className="flex gap-2">
                                        {slide.image_desktop && <img src={slide.image_desktop} alt="" className="w-16 h-12 object-cover rounded" />}
                                        <button onClick={() => openMediaPicker('hero', index, 'image_desktop')} className="px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-xs text-white hover:bg-zinc-600 flex items-center gap-1">
                                            <ImageIcon className="w-3 h-3" /> {slide.image_desktop ? 'Zmień' : 'Dodaj'}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Mobile (pionowy)</label>
                                    <div className="flex gap-2">
                                        {slide.image_mobile && <img src={slide.image_mobile} alt="" className="w-10 h-12 object-cover rounded" />}
                                        <button onClick={() => openMediaPicker('hero', index, 'image_mobile')} className="px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-xs text-white hover:bg-zinc-600 flex items-center gap-1">
                                            <ImageIcon className="w-3 h-3" /> {slide.image_mobile ? 'Zmień' : 'Dodaj'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Text Fields */}
                            <div className="space-y-2">
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Tytuł</label>
                                    <input type="text" value={slide.title} onChange={e => updateHeroSlide(index, 'title', e.target.value)} placeholder="Główny tytuł" className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Podtytuł</label>
                                    <input type="text" value={slide.subtitle} onChange={e => updateHeroSlide(index, 'subtitle', e.target.value)} placeholder="Podtytuł/opis krótki" className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Opis (szczegółowy)</label>
                                    <textarea rows={2} value={slide.description || ''} onChange={e => updateHeroSlide(index, 'description', e.target.value)} placeholder="Dodatkowy opis pod podtytułem" className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white" />
                                </div>
                            </div>

                            {/* Button Fields */}
                            <div className="grid md:grid-cols-2 gap-3 bg-zinc-800/30 p-3 rounded border border-zinc-700">
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Tekst przycisku</label>
                                    <input type="text" value={slide.buttonText || ''} onChange={e => updateHeroSlide(index, 'buttonText', e.target.value)} placeholder="np. Zobacz Portfolio" className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Link przycisku</label>
                                    <input type="text" value={slide.buttonLink || ''} onChange={e => updateHeroSlide(index, 'buttonLink', e.target.value)} placeholder="np. /portfolio" className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white" />
                                </div>
                            </div>

                            {/* Animation */}
                            <div className="bg-zinc-800/30 p-3 rounded border border-zinc-700">
                                <label className="block text-sm text-zinc-400 mb-2">Animacja tekstu</label>
                                <div className="grid md:grid-cols-3 gap-2">
                                    {(['fade', 'slide-up', 'slide-down', 'scale', 'bounce', 'zoom-in'] as const).map(anim => (
                                        <button
                                            key={anim}
                                            onClick={() => updateHeroSlide(index, 'textAnimation', anim)}
                                            className={`px-2 py-1 rounded text-xs border transition-colors ${
                                                slide.textAnimation === anim
                                                    ? 'bg-gold-500 text-black border-gold-500'
                                                    : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-600'
                                            }`}
                                        >
                                            {anim === 'slide-up' ? '↑ Slide Up' : anim === 'slide-down' ? '↓ Slide Down' : anim === 'zoom-in' ? '🔍 Zoom' : anim}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* DYNAMIC SECTIONS */}
                {sections.map((section, index) => (
                    <div key={section.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4 transition-all">
                        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={() => moveSection(index, 'up')}
                                        disabled={index === 0}
                                        className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="Przesuń wyżej"
                                    >
                                        <MoveUp className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => moveSection(index, 'down')}
                                        disabled={index === sections.length - 1}
                                        className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="Przesuń niżej"
                                    >
                                        <MoveDown className="w-4 h-4" />
                                    </button>
                                </div>
                                <h2 className="text-lg font-semibold text-white">{section.label}</h2>
                            </div>
                            <button
                                onClick={() => toggleSection(index)}
                                className={`px-3 py-2 rounded text-sm font-medium flex items-center gap-2 ${section.enabled ? 'bg-green-600/20 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}
                            >
                                {section.enabled ? <><Eye className="w-4 h-4" /> Włączona</> : <><EyeOff className="w-4 h-4" /> Wyłączona</>}
                            </button>
                        </div>

                        {/* SECTION CONTENT EDITORS */}
                        <div className={!section.enabled ? 'opacity-50 pointer-events-none' : ''}>

                            {/* ABOUT EDITOR */}
                            {section.type === 'about' && (
                                <div className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Tytuł</label>
                                            <input type="text" value={section.data.title} onChange={e => updateSectionData(index, 'title', e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Zdjęcie</label>
                                            <div className="flex gap-2">
                                                {section.data.image && <img src={section.data.image} alt="" className="w-10 h-10 rounded-full object-cover" />}
                                                <button onClick={() => openMediaPicker('section', index)} className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white hover:bg-zinc-700 flex items-center gap-2">
                                                    <ImageIcon className="w-4 h-4" /> Wybierz
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Kształt zdjęcia</label>
                                            <select
                                                value={section.data.imageShape || 'square'}
                                                onChange={e => updateSectionData(index, 'imageShape', e.target.value)}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                                            >
                                                <option value="square">Kwadrat</option>
                                                <option value="circle">Koło</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Rozmiar zdjęcia (%)</label>
                                            <input
                                                type="number"
                                                min="50"
                                                max="200"
                                                value={section.data.imageSize || 100}
                                                onChange={e => updateSectionData(index, 'imageSize', parseInt(e.target.value))}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Pozycja tekstu</label>
                                            <select
                                                value={section.data.textPosition || 'center'}
                                                onChange={e => updateSectionData(index, 'textPosition', e.target.value)}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                                            >
                                                <option value="left">Lewo</option>
                                                <option value="center">Środek</option>
                                                <option value="right">Prawo</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-1">Treść</label>
                                        <textarea rows={4} value={section.data.content} onChange={e => updateSectionData(index, 'content', e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white" />
                                    </div>
                                </div>
                            )}

                            {/* FEATURES EDITOR */}
                            {section.type === 'features' && (
                                <div className="space-y-4">
                                    <button onClick={() => addFeature(index)} className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1">
                                        <Plus className="w-4 h-4" /> Dodaj kafelkę
                                    </button>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        {section.data.features.map((feature, fIndex) => (
                                            <div key={feature.id} className="border border-zinc-700 rounded p-3 bg-zinc-800/50">
                                                <div className="flex justify-between mb-2">
                                                    <input type="text" value={feature.title} onChange={e => updateFeature(index, fIndex, 'title', e.target.value)} className="bg-transparent border-b border-zinc-600 text-white w-full mr-2" />
                                                    <button onClick={() => removeFeature(index, fIndex)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                                <div className="space-y-2">
                                                    {feature.items.map((item, iIndex) => (
                                                        <div key={iIndex} className="flex gap-1">
                                                            <input type="text" value={item} onChange={e => updateFeatureItem(index, fIndex, iIndex, e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white" />
                                                            <button onClick={() => removeFeatureItem(index, fIndex, iIndex)} className="text-red-400"><Trash2 className="w-3 h-3" /></button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => addFeatureItem(index, fIndex)} className="text-xs text-zinc-500 hover:text-white">+ punkt</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* PARALLAX EDITOR */}
                            {section.type === 'parallax' && (
                                <div className="space-y-4">
                                    {/* Basic fields */}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Tytuł</label>
                                            <input type="text" value={section.data.title} onChange={e => updateSectionData(index, 'title', e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Zdjęcie tła (fallback)</label>
                                            <div className="flex gap-2">
                                                {section.data.image && <img src={section.data.image} alt="" className="w-20 h-10 object-cover rounded" />}
                                                <button onClick={() => openMediaPicker('section', index)} className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white hover:bg-zinc-700 flex items-center gap-2">
                                                    <ImageIcon className="w-4 h-4" /> Wybierz
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Desktop & Mobile Images */}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Zdjęcie Desktop</label>
                                            <div className="flex gap-2">
                                                {section.data.image_desktop && <img src={section.data.image_desktop} alt="" className="w-20 h-10 object-cover rounded" />}
                                                <button onClick={() => openMediaPicker('section', index, 'image_desktop')} className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white hover:bg-zinc-700 flex items-center gap-2">
                                                    <ImageIcon className="w-4 h-4" /> {section.data.image_desktop ? 'Zmień' : 'Wybierz'}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Zdjęcie Mobile</label>
                                            <div className="flex gap-2">
                                                {section.data.image_mobile && <img src={section.data.image_mobile} alt="" className="w-20 h-10 object-cover rounded" />}
                                                <button onClick={() => openMediaPicker('section', index, 'image_mobile')} className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white hover:bg-zinc-700 flex items-center gap-2">
                                                    <ImageIcon className="w-4 h-4" /> {section.data.image_mobile ? 'Zmień' : 'Wybierz'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Text Style Settings */}
                                    <div className="grid md:grid-cols-3 gap-4 bg-zinc-800/50 p-3 rounded border border-zinc-700">
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Kolor tekstu</label>
                                            <input 
                                                type="color" 
                                                value={section.data.textColor || '#FFFFFF'} 
                                                onChange={e => updateSectionData(index, 'textColor', e.target.value)} 
                                                className="w-full h-8 rounded cursor-pointer" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Przezroczystość tekstu</label>
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="1" 
                                                step="0.1" 
                                                value={section.data.textOpacity || 1} 
                                                onChange={e => updateSectionData(index, 'textOpacity', parseFloat(e.target.value))} 
                                                className="w-full" 
                                            />
                                            <span className="text-xs text-zinc-500">{((section.data.textOpacity || 1) * 100).toFixed(0)}%</span>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Animacja tekstu</label>
                                            <select 
                                                value={section.data.textAnimation || 'slide-up'} 
                                                onChange={e => updateSectionData(index, 'textAnimation', e.target.value)} 
                                                className="w-full px-2 py-2 bg-zinc-900 border border-zinc-700 rounded text-white text-sm"
                                            >
                                                <option value="fade">Fade</option>
                                                <option value="slide-up">Slide Up</option>
                                                <option value="scale">Scale</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Parallax Effect Settings */}
                                    <div className="grid md:grid-cols-3 gap-4 bg-zinc-800/50 p-3 rounded border border-zinc-700">
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Efekt pływającego zdjęcia</label>
                                            <button
                                                onClick={() => updateSectionData(index, 'floatingImage', !section.data.floatingImage)}
                                                className={`w-full px-3 py-2 rounded text-sm font-medium border transition-colors ${
                                                    section.data.floatingImage 
                                                        ? 'bg-green-600/20 text-green-400 border-green-500' 
                                                        : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                                                }`}
                                            >
                                                {section.data.floatingImage ? '✓ Włączony' : 'Wyłączony'}
                                            </button>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Szybkość parallaxu</label>
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="1" 
                                                step="0.1" 
                                                value={section.data.parallaxSpeed || 0.5} 
                                                onChange={e => updateSectionData(index, 'parallaxSpeed', parseFloat(e.target.value))} 
                                                className="w-full" 
                                            />
                                            <span className="text-xs text-zinc-500">{((section.data.parallaxSpeed || 0.5) * 100).toFixed(0)}%</span>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Offset zdjęcia (px)</label>
                                            <input 
                                                type="number" 
                                                min="0" 
                                                max="100" 
                                                value={section.data.imageOffset || 20} 
                                                onChange={e => updateSectionData(index, 'imageOffset', parseInt(e.target.value))} 
                                                className="w-full px-2 py-2 bg-zinc-900 border border-zinc-700 rounded text-white text-sm" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* INFO BAND EDITOR */}
                            {section.type === 'info_band' && (
                                <div className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Tytuł</label>
                                            <input type="text" value={section.data.title} onChange={e => updateSectionData(index, 'title', e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Zdjęcie</label>
                                            <div className="flex gap-2">
                                                {section.data.image && <img src={section.data.image} alt="" className="w-20 h-10 object-cover rounded" />}
                                                <button onClick={() => openMediaPicker('section', index)} className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white hover:bg-zinc-700 flex items-center gap-2">
                                                    <ImageIcon className="w-4 h-4" /> Wybierz
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-1">Pozycja Zdjęcia</label>
                                        <div className="flex gap-2">
                                            {['left', 'center', 'right'].map(pos => (
                                                <button
                                                    key={pos}
                                                    onClick={() => updateSectionData(index, 'position', pos)}
                                                    className={`px-3 py-1 rounded text-sm border ${section.data.position === pos ? 'bg-gold-500 text-black border-gold-500' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}
                                                >
                                                    {pos === 'left' && 'Lewa'}
                                                    {pos === 'center' && 'Środek'}
                                                    {pos === 'right' && 'Prawa'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-1">Treść (HTML)</label>
                                        <textarea rows={4} value={section.data.content} onChange={e => updateSectionData(index, 'content', e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white font-mono text-sm" />
                                    </div>
                                </div>
                            )}

                            {/* TESTIMONIALS EDITOR */}
                            {section.type === 'testimonials' && (
                                <div className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Tytuł sekcji</label>
                                            <input
                                                type="text"
                                                value={section.data.title}
                                                onChange={e => updateSectionData(index, 'title', e.target.value)}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Podtytuł</label>
                                            <input
                                                type="text"
                                                value={section.data.subtitle}
                                                onChange={e => updateSectionData(index, 'subtitle', e.target.value)}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-zinc-800/50 p-4 rounded-lg">
                                        <p className="text-sm text-zinc-400">
                                            Opinie są zarządzane w osobnej zakładce:<br />
                                            <Link href="/admin/testimonials" className="text-gold-400 hover:text-gold-300 underline">
                                                Panel Admin → Opinie
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* CHALLENGE BANNER EDITOR */}
                            {section.type === 'challenge_banner' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-white font-medium">Konfiguracja Banera</h3>
                                    </div>

                                    {!section.data.advanced?.enabled ? (
                                        // SIMPLE MODE
                                        <>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm text-zinc-400 mb-1">Tytuł</label>
                                                    <input type="text" value={section.data.title} onChange={e => updateSectionData(index, 'title', e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-zinc-400 mb-1">Efekt wizualny</label>
                                                    <select
                                                        value={section.data.effect === 'none' && section.data.advanced?.enabled ? 'advanced_banner' : (section.data.effect || 'none')}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            if (val === 'advanced_banner') {
                                                                updateSectionData(index, 'effect', 'none');
                                                                const newSections = [...sections];
                                                                const sec = newSections[index] as ChallengeBannerSection;
                                                                if (!sec.data.advanced) {
                                                                    sec.data.advanced = { enabled: true, items: [], config: { autoScroll: true, interval: 5, height: '600px', floating: false, loop: true, imageSize: 100, layout: 'full', position: 'left' } };
                                                                } else {
                                                                    sec.data.advanced.enabled = true;
                                                                }
                                                                setSections(newSections);
                                                            } else {
                                                                updateSectionData(index, 'effect', val);
                                                                const newSections = [...sections];
                                                                const sec = newSections[index] as ChallengeBannerSection;
                                                                if (sec.data.advanced) sec.data.advanced.enabled = false;
                                                                setSections(newSections);
                                                            }
                                                        }}
                                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                                                    >
                                                        <option value="none">Brak (Ikona aparatu)</option>
                                                        <option value="carousel">Karuzela</option>
                                                        <option value="masonry">Mozaika</option>
                                                        <option value="puzzle">Puzzle (Animowane)</option>
                                                        <option value="orbiting3d">Orbita 3D</option>
                                                        <option value="advanced_banner">Baner (Slajdy)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Photos for effect */}
                                            {(section.data.effect && section.data.effect !== 'none') && (
                                                <div>
                                                    <label className="block text-sm text-zinc-400 mb-1">Zdjęcia do efektu</label>
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {section.data.photos?.map((photo, pIndex) => (
                                                            <div key={pIndex} className="relative group">
                                                                <img src={photo} alt="" className="w-16 h-16 object-cover rounded border border-zinc-700" />
                                                                <button
                                                                    onClick={() => {
                                                                        const newPhotos = section.data.photos.filter((_, i) => i !== pIndex);
                                                                        updateSectionData(index, 'photos', newPhotos);
                                                                    }}
                                                                    className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Trash2 className="w-3 h-3 text-white" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => openMediaPicker('section', index, 'photos')}
                                                            className="w-16 h-16 border border-dashed border-zinc-600 rounded flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-400"
                                                        >
                                                            <Plus className="w-6 h-6" />
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-zinc-500">
                                                        {section.data.effect === 'orbiting3d' ? 'Wybierz dokładnie 2 zdjęcia.' : 'Wybierz kilka zdjęć.'}
                                                        {section.data.effect === 'puzzle' && ' Wybierz dokładnie 2 zdjęcia (pionowe).'}
                                                    </p>
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-sm text-zinc-400 mb-1">Treść</label>
                                                <textarea rows={2} value={section.data.content} onChange={e => updateSectionData(index, 'content', e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        // ADVANCED MODE
                                        <div className="space-y-6 border-t border-zinc-800 pt-4">
                                            <div className="grid grid-cols-2 gap-4 bg-zinc-800/30 p-4 rounded-lg">
                                                <div>
                                                    <label className="block text-xs text-zinc-400 mb-1">Wysokość</label>
                                                    <input
                                                        type="text"
                                                        value={section.data.advanced?.config.height}
                                                        onChange={e => updateBannerConfig(index, 'height', e.target.value)}
                                                        className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-zinc-400 mb-1">Czas slajdu (s)</label>
                                                    <input
                                                        type="number"
                                                        value={section.data.advanced?.config.interval}
                                                        onChange={e => updateBannerConfig(index, 'interval', parseInt(e.target.value))}
                                                        className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={section.data.advanced?.config.autoScroll}
                                                        onChange={e => updateBannerConfig(index, 'autoScroll', e.target.checked)}
                                                    />
                                                    <label className="text-sm text-zinc-300">Auto-przewijanie</label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={section.data.advanced?.config.floating}
                                                        onChange={e => updateBannerConfig(index, 'floating', e.target.checked)}
                                                    />
                                                    <label className="text-sm text-zinc-300">Efekt Pływający</label>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {section.data.advanced?.items.map((item, iIndex) => (
                                                    <div key={item.id} className="border border-zinc-700 rounded-lg p-4 bg-zinc-800/20">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <span className="text-gold-400 font-medium text-sm">Slajd #{iIndex + 1}</span>
                                                            <button onClick={() => removeBannerItem(index, iIndex)} className="text-red-400 hover:text-red-300">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        <div className="grid md:grid-cols-2 gap-6">
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <label className="block text-xs text-zinc-400 mb-1">Typ Slajdu</label>
                                                                    <select
                                                                        value={item.type || 'image'}
                                                                        onChange={e => updateBannerItem(index, iIndex, 'type', e.target.value)}
                                                                        className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-white mb-3"
                                                                    >
                                                                        <option value="image">Zdjęcie</option>
                                                                        <option value="video">Wideo</option>
                                                                        <option value="challenge">Foto Wyzwanie (Puzzle)</option>
                                                                    </select>

                                                                    {item.type === 'challenge' ? (
                                                                        <div>
                                                                            <label className="block text-xs text-zinc-400 mb-1">Zdjęcia do Puzzli (2 szt.)</label>
                                                                            <div className="flex gap-2">
                                                                                {item.challengePhotos?.map((photo, pIdx) => (
                                                                                    <div key={pIdx} className="relative group">
                                                                                        <img src={photo} className="w-16 h-16 object-cover rounded border border-zinc-700" />
                                                                                        <button onClick={() => {
                                                                                            const newPhotos = item.challengePhotos?.filter((_, i) => i !== pIdx);
                                                                                            updateBannerItem(index, iIndex, 'challengePhotos', newPhotos);
                                                                                        }} className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100">
                                                                                            <Trash2 className="w-3 h-3 text-white" />
                                                                                        </button>
                                                                                    </div>
                                                                                ))}
                                                                                {(item.challengePhotos?.length || 0) < 2 && (
                                                                                    <button onClick={() => openMediaPicker('advanced_challenge', index, undefined, iIndex)} className="w-16 h-16 border border-dashed border-zinc-600 rounded flex items-center justify-center hover:border-zinc-400 transition-colors">
                                                                                        <Plus className="w-4 h-4 text-zinc-500" />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div>
                                                                            <label className="block text-xs text-zinc-400 mb-1">Media</label>
                                                                            <div className="flex gap-3">
                                                                                {item.src && (
                                                                                    item.type === 'video' ?
                                                                                        <video src={item.src} className="w-24 h-16 object-cover rounded border border-zinc-700" /> :
                                                                                        <img src={item.src} alt="" className="w-24 h-16 object-cover rounded border border-zinc-700" />
                                                                                )}
                                                                                <button onClick={() => openMediaPicker('advanced', index, undefined, iIndex)} className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white hover:bg-zinc-700 flex items-center justify-center gap-2 transition-colors">
                                                                                    <ImageIcon className="w-4 h-4" /> Wybierz Media
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div>
                                                                        <label className="block text-xs text-zinc-400 mb-1">Animacja</label>
                                                                        <select
                                                                            value={item.animation}
                                                                            onChange={e => updateBannerItem(index, iIndex, 'animation', e.target.value)}
                                                                            className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                                                                        >
                                                                            <option value="fade">Zanikanie</option>
                                                                            <option value="slide-left">Wjazd z lewej</option>
                                                                            <option value="slide-right">Wjazd z prawej</option>
                                                                            <option value="zoom">Powiększanie</option>
                                                                            <option value="rotate">Obrót</option>
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs text-zinc-400 mb-1">Pozycja treści</label>
                                                                        <select
                                                                            value={item.contentPosition || 'center'}
                                                                            onChange={e => updateBannerItem(index, iIndex, 'contentPosition', e.target.value)}
                                                                            className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                                                                        >
                                                                            <option value="left">Lewo</option>
                                                                            <option value="center">Środek</option>
                                                                            <option value="right">Prawo</option>
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs text-zinc-400 mb-1">Rozmiar zdjęcia (%)</label>
                                                                        <input
                                                                            type="number"
                                                                            min="50"
                                                                            max="200"
                                                                            value={item.imageSize || 100}
                                                                            onChange={e => updateBannerItem(index, iIndex, 'imageSize', parseInt(e.target.value))}
                                                                            className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs text-zinc-400 mb-1">Kształt zdjęcia</label>
                                                                        <select
                                                                            value={item.imageShape || 'square'}
                                                                            onChange={e => updateBannerItem(index, iIndex, 'imageShape', e.target.value)}
                                                                            className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                                                                        >
                                                                            <option value="square">Kwadrat</option>
                                                                            <option value="circle">Koło</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <div className="md:col-span-2">
                                                                    <label className="block text-xs text-zinc-400 mb-1">Tytuł</label>
                                                                    <input
                                                                        type="text"
                                                                        value={item.title}
                                                                        onChange={e => updateBannerItem(index, iIndex, 'title', e.target.value)}
                                                                        className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                                                                    />
                                                                </div>
                                                                <div className="md:col-span-2">
                                                                    <label className="block text-xs text-zinc-400 mb-1">Podtytuł</label>
                                                                    <input
                                                                        type="text"
                                                                        value={item.subtitle}
                                                                        onChange={e => updateBannerItem(index, iIndex, 'subtitle', e.target.value)}
                                                                        className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs text-zinc-400 mb-1">Tekst przycisku</label>
                                                                    <input
                                                                        type="text"
                                                                        value={item.ctaText}
                                                                        onChange={e => updateBannerItem(index, iIndex, 'ctaText', e.target.value)}
                                                                        className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs text-zinc-400 mb-1">Link przycisku</label>
                                                                    <input
                                                                        type="text"
                                                                        value={item.ctaLink}
                                                                        onChange={e => updateBannerItem(index, iIndex, 'ctaLink', e.target.value)}
                                                                        className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => addBannerItem(index)}
                                                    className="w-full py-2 border-2 border-dashed border-zinc-700 rounded-lg text-zinc-400 hover:border-gold-500 hover:text-gold-500 transition-colors"
                                                >
                                                    + Dodaj Slajd
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div >
                ))
                }
            </div >

            <MediaPicker
                isOpen={mediaPickerOpen}
                onClose={() => setMediaPickerOpen(false)}
                onSelect={handleMediaSelect}
                multiple={currentPickerTarget?.field === 'photos'}
            />
        </div >
    );
}
