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
import RichTextEditor from '@/components/admin/RichTextEditor';
import templates from '@/lib/homepageModuleTemplates';

// --- Types ---

interface HeroSlide {
    id: string;
    image: string;
    image_desktop?: string;
    image_mobile?: string;
    title: string;
    subtitle: string;
    description?: string;
    buttonText: string;
    buttonLink: string;
    enabled: boolean;
    order: number;
    textAnimation?: 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'bounce' | 'zoom-in';
}

interface Feature {
    id: string;
    title: string;
    items: string[];
    enabled: boolean;
    buttonText?: string;
    buttonLink?: string;
}

type SectionType = 'about' | 'features' | 'parallax' | 'info_band' | 'challenge_banner' | 'testimonials' | 'mini_gallery';

interface BaseSection {
    id: string;
    type: SectionType;
    label: string; // Display name in admin
    enabled: boolean;
    backgroundColor?: 'black' | 'zinc-900' | 'zinc-800' | 'gold-900' | 'white';
}

interface AboutSection {
    id: string;
    type: 'about';
    label?: string;
    enabled: boolean;
    backgroundColor?: 'black' | 'zinc-900' | 'zinc-800' | 'gold-900' | 'white';
    textVariant?: 'light' | 'dark';
    data: {
        title: string;
        content: string;
        image: string;
        imageShape?: 'square' | 'circle';
        imageSize?: number;
        position?: 'left' | 'center' | 'right';
        cta1Text?: string;
        cta1Link?: string;
        cta2Text?: string;
        cta2Link?: string;
        // New structure for multiple blocks
        blocks?: {
            id: string;
            title: string;
            content: string;
            image: string;
            imageShape?: 'square' | 'circle';
            imageSize?: number;
            position: 'left' | 'right';
        }[];
    };
}

interface FeaturesSection extends BaseSection {
    type: 'features';
    data: {
        features: Feature[];
        sectionLayout?: 'grid' | 'centered';
        featureSize?: 'normal' | 'large';
    };
}

interface ParallaxSection extends BaseSection {
    type: 'parallax';
    data: {
        image: string;
        image_desktop?: string;
        image_mobile?: string;
        title: string;
        floatingImage?: boolean;
        parallaxSpeed?: number;
        imageOffset?: number;
        textOpacity?: number;
        overlayOpacity?: number;
        textColor?: string;
        textAnimation?: string;
        height?: string;
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


// --- Mini Gallery Types ---
interface MiniGalleryItem {
    id: string;
    image: string;
    title?: string;
    description?: string;
    link?: string;
    spanCols?: number;
    spanRows?: number;
}

interface MiniGalleryConfig {
    columns: number;
    gap: number;
    aspectRatio: 'square' | 'video' | 'portrait' | 'auto';
    style: 'classic' | 'masonry' | 'floating';
    textPosition: 'below' | 'overlay' | 'hover';
    corners: 'square' | 'rounded' | 'pill';
    backgroundColor?: string;
    description?: string;
    descriptionAlign?: 'left' | 'center' | 'right';
    descriptionWidth?: 'narrow' | 'medium' | 'wide' | 'full';
    descriptionPlacement?: 'top' | 'bottom';
}

interface MiniGallerySection extends BaseSection {
    type: 'mini_gallery';
    data: {
        mini_gallery_items: MiniGalleryItem[];
        mini_gallery_config: MiniGalleryConfig;
    };
}

type Section = AboutSection | FeaturesSection | ParallaxSection | InfoBandSection | ChallengeBannerSection | TestimonialsSection | MiniGallerySection;

export default function HomepageManager() {
    const router = useRouter();
    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [pageId, setPageId] = useState<number | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
    const [currentPickerTarget, setCurrentPickerTarget] = useState<{ type: 'hero' | 'section' | 'advanced' | 'advanced_challenge' | 'rte' | 'mini_gallery_item', index: number, field?: string, subIndex?: number } | null>(null);

    useEffect(() => {
        fetchHomepage();
    }, []);

    const fetchHomepage = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            // Fetch homepage by slug (ID can differ between environments)
            const res = await fetch(`${getApiUrl('pages')}?slug=strona-glowna`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success && data.page?.home_sections) {
                if (typeof data.page.id === 'number') {
                    setPageId(data.page.id);
                }
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
                            data: {
                                ...parsed.about_section,
                                blocks: parsed.about_section.blocks || (parsed.about_section.image ? [{
                                    id: Date.now().toString(),
                                    title: parsed.about_section.title,
                                    content: parsed.about_section.content,
                                    image: parsed.about_section.image,
                                    imageShape: parsed.about_section.imageShape || 'square',
                                    imageSize: parsed.about_section.imageSize || 100,
                                    position: parsed.about_section.position === 'right' ? 'right' : 'left'
                                }] : [])
                            }
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

    const removeSection = (index: number) => {
        if (confirm('Czy na pewno chcesz usunąć tę sekcję? Tej operacji nie można cofnąć.')) {
            const newSections = [...sections];
            newSections.splice(index, 1);
            setSections(newSections);
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

            const effectivePageId = pageId ?? undefined;

            const res = await fetch(getApiUrl('pages'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...(effectivePageId ? { id: effectivePageId } : { slug: 'strona-glowna' }),
                    slug: 'strona-glowna',
                    title: 'Strona główna',
                    content: '',
                    is_published: true,
                    home_sections: JSON.stringify(homeSections),
                    sections: JSON.stringify(sections)  // Also send sections separately for new system
                }),
            });

            if (res.ok) {
                toast.success('Zapisano zmiany');
            } else {
                const errorData = await res.json().catch(() => ({}));
                console.error('Save error:', res.status, errorData);
                throw new Error(`Failed to save: ${res.status} ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Nieznany błąd';
            console.error('Save failed:', message, error);
            toast.error(`Błąd zapisu: ${message}`);
        } finally {
            setSaving(false);
        }
    };

    // --- Quick-add module helpers (use templates from lib) ---
    const addAboutSectionTemplate = () => {
        const tpl = templates.createAboutSectionTemplate() as AboutSection;
        setSections(prev => [...prev, tpl]);
        toast.success('Dodano sekcję O mnie (pamiętaj zapisać)');
    };

    const addFeaturesSectionTemplate = () => {
        const tpl = templates.createFeaturesSectionTemplate() as FeaturesSection;
        setSections(prev => [...prev, tpl]);
        toast.success('Dodano sekcję Kafelki (pamiętaj zapisać)');
    };

    const addParallaxSectionTemplate = () => {
        const tpl = templates.createParallaxSectionTemplate() as ParallaxSection;
        setSections(prev => [...prev, tpl]);
        toast.success('Dodano sekcję Parallax (pamiętaj zapisać)');
    };

    const addInfoBandTemplate = () => {
        const tpl = templates.createInfoBandTemplate() as InfoBandSection;
        setSections(prev => [...prev, tpl]);
        toast.success('Dodano Info Band (pamiętaj zapisać)');
    };

    const addChallengeBannerTemplate = () => {
        const tpl = templates.createChallengeBannerTemplate() as ChallengeBannerSection;
        setSections(prev => [...prev, tpl]);
        toast.success('Dodano Foto Wyzwanie (pamiętaj zapisać)');
    };

    const addTestimonialsTemplate = () => {
        const tpl = templates.createTestimonialsTemplate() as TestimonialsSection;
        setSections(prev => [...prev, tpl]);
        toast.success('Dodano Opinie (pamiętaj zapisać)');
    };

    const addMiniGalleryTemplate = () => {
        const tpl: MiniGallerySection = {
            id: `minigallery-${Date.now()}`,
            type: 'mini_gallery',
            label: 'Mini Galeria',
            enabled: true,
            data: {
                mini_gallery_items: [],
                mini_gallery_config: {
                    columns: 4,
                    gap: 4,
                    aspectRatio: 'square',
                    style: 'classic',
                    textPosition: 'below',
                    corners: 'square'
                }
            }
        };
        setSections(prev => [...prev, tpl]);
        toast.success('Dodano Mini Galerię (pamiętaj zapisać)');
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

    const openMediaPicker = (type: 'hero' | 'section' | 'advanced' | 'advanced_challenge' | 'rte' | 'mini_gallery_item', index: number, field?: string, subIndex?: number) => {
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
        } else if (currentPickerTarget.type === 'rte') {
            const updated = [...sections];
            const section = updated[currentPickerTarget.index];
            const fieldName = currentPickerTarget.field || 'content';

            // Handle inserting image into content string
            const imgTag = `<img src="${filePath}" alt="" class="max-w-full h-auto rounded-lg my-4" />`;

            if (currentPickerTarget.subIndex !== undefined && (section.data as any).blocks) {
                const currentBlockContent = (section.data as any).blocks[currentPickerTarget.subIndex].content || '';
                (section.data as any).blocks[currentPickerTarget.subIndex].content = currentBlockContent + imgTag;
            } else {
                const currentContent = (section.data as any)[fieldName] || '';
                (section.data as any)[fieldName] = currentContent + imgTag;
            }

            setSections(updated);
        } else if (currentPickerTarget.type === 'mini_gallery_item') {
            const updated = [...sections];
            const section = updated[currentPickerTarget.index] as MiniGallerySection;
            if (currentPickerTarget.subIndex !== undefined) {
                const item = section.data.mini_gallery_items[currentPickerTarget.subIndex];
                item.image = filePath;
            }
            setSections(updated);
        } else {
            const updated = [...sections];
            const section = updated[currentPickerTarget.index];

            if (section.type === 'about' || section.type === 'parallax' || section.type === 'info_band') {
                // Handle different image fields for sections
                if (currentPickerTarget.subIndex !== undefined && (section.data as any).blocks) {
                    // Update specific block image
                    (section.data as any).blocks[currentPickerTarget.subIndex].image = filePath;
                } else if (currentPickerTarget.field === 'image_desktop') {
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

    const addAboutBlock = (sectionIndex: number) => {
        const updated = [...sections];
        const section = updated[sectionIndex] as AboutSection;
        if (!section.data.blocks) section.data.blocks = [];

        section.data.blocks.push({
            id: Date.now().toString(),
            title: 'Nowy blok',
            content: '',
            image: '',
            imageShape: 'square',
            imageSize: 100,
            position: section.data.blocks.length % 2 === 0 ? 'left' : 'right'
        });
        setSections(updated);
    };

    const removeAboutBlock = (sectionIndex: number, blockIndex: number) => {
        const updated = [...sections];
        const section = updated[sectionIndex] as AboutSection;
        if (section.data.blocks) {
            section.data.blocks.splice(blockIndex, 1);
            setSections(updated);
        }
    };

    const updateAboutBlock = (sectionIndex: number, blockIndex: number, field: string, value: any) => {
        const updated = [...sections];
        const section = updated[sectionIndex] as AboutSection;
        if (section.data.blocks && section.data.blocks[blockIndex]) {
            (section.data.blocks[blockIndex] as any)[field] = value;
            setSections(updated);
        }
    };

    const moveAboutBlock = (sectionIndex: number, blockIndex: number, direction: 'up' | 'down') => {
        const updated = [...sections];
        const section = updated[sectionIndex] as AboutSection;
        if (!section.data.blocks) return;

        const newIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
        if (newIndex >= 0 && newIndex < section.data.blocks.length) {
            const temp = section.data.blocks[blockIndex];
            section.data.blocks[blockIndex] = section.data.blocks[newIndex];
            section.data.blocks[newIndex] = temp;
            setSections(updated);
        }
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
            enabled: true,
            buttonText: '',
            buttonLink: ''
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

    // --- Mini Gallery Helpers ---
    const addMiniGalleryItem = (index: number) => {
        const newSections = [...sections];
        const section = newSections[index] as MiniGallerySection;
        section.data.mini_gallery_items.push({
            id: Date.now().toString(),
            image: '',
            title: 'Nowe zdjęcie',
            spanCols: 1,
            spanRows: 1
        });
        setSections(newSections);
    };

    const removeMiniGalleryItem = (sectionIndex: number, itemIndex: number) => {
        const newSections = [...sections];
        const section = newSections[sectionIndex] as MiniGallerySection;
        section.data.mini_gallery_items = section.data.mini_gallery_items.filter((_, i) => i !== itemIndex);
        setSections(newSections);
    };

    const updateMiniGalleryItem = (sectionIndex: number, itemIndex: number, field: keyof MiniGalleryItem, value: any) => {
        const newSections = [...sections];
        const section = newSections[sectionIndex] as MiniGallerySection;
        (section.data.mini_gallery_items[itemIndex] as any)[field] = value;
        setSections(newSections);
    };

    const updateMiniGalleryConfig = (sectionIndex: number, field: keyof MiniGalleryConfig, value: any) => {
        const newSections = [...sections];
        const section = newSections[sectionIndex] as MiniGallerySection;
        (section.data.mini_gallery_config as any)[field] = value;
        setSections(newSections);
    };

    const moveMiniGalleryItem = (sectionIndex: number, itemIndex: number, direction: 'left' | 'right') => {
        const newSections = [...sections];
        const section = newSections[sectionIndex] as MiniGallerySection;
        const items = section.data.mini_gallery_items;
        const targetIndex = direction === 'left' ? itemIndex - 1 : itemIndex + 1;

        if (targetIndex >= 0 && targetIndex < items.length) {
            [items[itemIndex], items[targetIndex]] = [items[targetIndex], items[itemIndex]];
            setSections(newSections);
        }
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
                <button onClick={addMiniGalleryTemplate} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm border border-gold-500/30 text-gold-400">Dodaj Mini Galerię (Pro)</button>
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
                                            className={`px-2 py-1 rounded text-xs border transition-colors ${slide.textAnimation === anim
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
                                title={section.enabled ? 'Ukryj sekcję' : 'Pokaż sekcję'}
                            >
                                {section.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => removeSection(index)}
                                className="px-3 py-2 bg-red-500/10 text-red-500 rounded text-sm font-medium hover:bg-red-500/20 transition-colors"
                                title="Usuń sekcję całkowicie"
                            >
                                <Trash2 className="w-4 h-4" />
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
                                                value={section.data.position || 'center'}
                                                onChange={e => updateSectionData(index, 'position', e.target.value)}
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
                                        <RichTextEditor
                                            value={section.data.content}
                                            onChange={(val) => updateSectionData(index, 'content', val)}
                                            placeholder="Opisz siebie..."
                                            onImageRequest={() => openMediaPicker('rte', index, 'content')}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* FEATURES EDITOR */}
                            {/* FEATURES EDITOR */}
                            {section.type === 'features' && (
                                <div className="space-y-6">
                                    <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-zinc-400 mb-1">Układ sekcji</label>
                                            <select
                                                value={section.data.sectionLayout || 'grid'}
                                                onChange={e => updateSectionData(index, 'sectionLayout', e.target.value)}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white"
                                            >
                                                <option value="grid">Siatka (Standard)</option>
                                                <option value="centered">Wyśrodkowany</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-400 mb-1">Rozmiar</label>
                                            <select
                                                value={section.data.featureSize || 'normal'}
                                                onChange={e => updateSectionData(index, 'featureSize', e.target.value)}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white"
                                            >
                                                <option value="normal">Normalny</option>
                                                <option value="large">Duży (Premium)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button onClick={() => addFeature(index)} className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1 font-medium">
                                        <Plus className="w-4 h-4" /> Dodaj kafelkę
                                    </button>

                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {section.data.features.map((feature, fIndex) => (
                                            <div key={feature.id} className="border border-zinc-700 rounded-lg p-4 bg-zinc-800/30 flex flex-col h-full">
                                                <div className="flex justify-between mb-4 border-b border-zinc-700 pb-2">
                                                    <input
                                                        type="text"
                                                        value={feature.title}
                                                        onChange={e => updateFeature(index, fIndex, 'title', e.target.value)}
                                                        className="bg-transparent text-white font-bold w-full mr-2 outline-none focus:text-gold-400"
                                                        placeholder="Tytuł kafelka"
                                                    />
                                                    <button onClick={() => removeFeature(index, fIndex)} className="text-zinc-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>

                                                <div className="space-y-2 flex-1 mb-4">
                                                    {feature.items.map((item, iIndex) => (
                                                        <div key={iIndex} className="flex gap-2 items-center group">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0"></div>
                                                            <input
                                                                type="text"
                                                                value={item}
                                                                onChange={e => updateFeatureItem(index, fIndex, iIndex, e.target.value)}
                                                                className="flex-1 bg-transparent border-b border-zinc-800 focus:border-zinc-500 px-1 py-0.5 text-sm text-zinc-300 outline-none"
                                                            />
                                                            <button onClick={() => removeFeatureItem(index, fIndex, iIndex)} className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => addFeatureItem(index, fIndex)} className="text-xs text-zinc-500 hover:text-gold-400 mt-2 flex items-center gap-1 transition-colors">
                                                        <Plus className="w-3 h-3" /> Dodaj punkt
                                                    </button>
                                                </div>

                                                <div className="mt-auto pt-3 border-t border-zinc-700/50 space-y-3">
                                                    <div>
                                                        <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Tekst przycisku</label>
                                                        <input
                                                            type="text"
                                                            value={feature.buttonText || ''}
                                                            onChange={e => updateFeature(index, fIndex, 'buttonText', e.target.value)}
                                                            placeholder="np. Oferta"
                                                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-gold-500/50 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Link</label>
                                                        <input
                                                            type="text"
                                                            value={feature.buttonLink || ''}
                                                            onChange={e => updateFeature(index, fIndex, 'buttonLink', e.target.value)}
                                                            placeholder="np. /oferta"
                                                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-gold-500/50 outline-none"
                                                        />
                                                    </div>
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
                                        <div className="md:col-span-2 bg-zinc-800/30 p-3 rounded border border-zinc-700">
                                            <label className="block text-sm text-zinc-400 mb-1">Wysokość sekcji (VH)</label>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="range"
                                                    min="50"
                                                    max="130"
                                                    step="10"
                                                    value={parseInt((section.data.height || "min-h-[80vh]").match(/\d+/)?.[0] || "80")}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        // Update with Tailwind class format
                                                        updateSectionData(index, 'height', `min-h-[${val}vh] md:min-h-[${val}vh]`);
                                                    }}
                                                    className="flex-1"
                                                />
                                                <span className="text-sm font-mono text-gold-400 w-16 text-right">
                                                    {parseInt((section.data.height || "min-h-[80vh]").match(/\d+/)?.[0] || "80")} vh
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-1">Dostosuj wysokość obszaru parallax. Standardowo 80-100vh.</p>
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
                                                className={`w-full px-3 py-2 rounded text-sm font-medium border transition-colors ${section.data.floatingImage
                                                    ? 'bg-green-600/20 text-green-400 border-green-500'
                                                    : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                                                    }`}
                                            >
                                                {section.data.floatingImage ? '✓ Włączony' : 'Wyłączony'}
                                            </button>
                                        </div>
                                        <div className="col-span-2 flex gap-4">
                                            <div className="w-1/2">
                                                <label className="block text-sm text-zinc-400 mb-1">Szybkość parallaxu</label>
                                                <input
                                                    type="range"
                                                    min="0.1"
                                                    max="1.5"
                                                    step="0.1"
                                                    value={section.data.parallaxSpeed || 0.5}
                                                    onChange={e => updateSectionData(index, 'parallaxSpeed', parseFloat(e.target.value))}
                                                    className="w-full"
                                                />
                                                <span className="text-xs text-zinc-500">{((section.data.parallaxSpeed || 0.5) * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="w-1/2">
                                                <label className="block text-sm text-zinc-400 mb-1">Przyciemnienie (Opacity)</label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="0.9"
                                                    step="0.1"
                                                    value={section.data.overlayOpacity ?? 0.4}
                                                    onChange={e => updateSectionData(index, 'overlayOpacity', parseFloat(e.target.value))}
                                                    className="w-full"
                                                />
                                                <span className="text-xs text-zinc-500">{((section.data.overlayOpacity ?? 0.4) * 100).toFixed(0)}%</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Offset zdjęcia (px)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="200"
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
                                <div className="space-y-6">
                                    <div className="bg-zinc-800/50 p-4 rounded-lg">
                                        <p className="text-sm text-zinc-400 mb-2">Główne ustawienia sekcji</p>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-zinc-400 mb-1">Tytuł główny (opcjonalny)</label>
                                                <input type="text" value={section.data.title || ''} onChange={e => updateSectionData(index, 'title', e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white" placeholder="np. O mnie" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {(section.data as any).blocks?.map((block: any, bIdx: number) => (
                                            <div key={block.id || bIdx} className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 space-y-4 relative group">
                                                <div className="absolute top-2 right-2 flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => moveAboutBlock(index, bIdx, 'up')} disabled={bIdx === 0} className="p-1 text-zinc-400 hover:text-white"><MoveUp className="w-4 h-4" /></button>
                                                    <button onClick={() => moveAboutBlock(index, bIdx, 'down')} disabled={bIdx === ((section.data as any).blocks?.length || 0) - 1} className="p-1 text-zinc-400 hover:text-white"><MoveDown className="w-4 h-4" /></button>
                                                    <button onClick={() => removeAboutBlock(index, bIdx)} className="p-1 text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                                                </div>

                                                <div className="pr-12">
                                                    <span className="text-xs font-mono text-gold-500 mb-2 block">BLOK #{bIdx + 1}</span>
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm text-zinc-400 mb-1">Tytuł bloku</label>
                                                            <input type="text" value={block.title} onChange={e => updateAboutBlock(index, bIdx, 'title', e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-zinc-400 mb-1">Zdjęcie</label>
                                                            <div className="flex gap-2">
                                                                {block.image && <img src={block.image} alt="" className="w-16 h-12 object-cover rounded" />}
                                                                <button onClick={() => openMediaPicker('section', index, 'image', bIdx)} className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white hover:bg-zinc-700 flex items-center gap-2">
                                                                    <ImageIcon className="w-4 h-4" /> Wybierz
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-xs text-zinc-400 mb-1">Układ</label>
                                                        <div className="flex gap-1">
                                                            <button onClick={() => updateAboutBlock(index, bIdx, 'position', 'left')} className={`flex-1 py-1 text-xs border rounded ${block.position === 'left' ? 'bg-gold-500 text-black border-gold-500' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>Zdjęcie Lewo</button>
                                                            <button onClick={() => updateAboutBlock(index, bIdx, 'position', 'right')} className={`flex-1 py-1 text-xs border rounded ${block.position === 'right' ? 'bg-gold-500 text-black border-gold-500' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>Zdjęcie Prawo</button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-zinc-400 mb-1">Kształt</label>
                                                        <select value={block.imageShape || 'square'} onChange={e => updateAboutBlock(index, bIdx, 'imageShape', e.target.value)} className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white">
                                                            <option value="square">Kwadrat (Rounded)</option>
                                                            <option value="circle">Koło</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm text-zinc-400 mb-1">Treść</label>
                                                    <RichTextEditor
                                                        value={block.content}
                                                        onChange={(val) => updateAboutBlock(index, bIdx, 'content', val)}
                                                        placeholder="Treść bloku..."
                                                        onImageRequest={() => openMediaPicker('rte', index, 'content', bIdx)}
                                                    />
                                                </div>
                                            </div>
                                        ))}

                                        <button onClick={() => addAboutBlock(index)} className="w-full py-3 border-2 border-dashed border-zinc-700 rounded-lg text-zinc-400 hover:border-gold-500 hover:text-gold-500 transition-colors flex items-center justify-center gap-2">
                                            <Plus className="w-5 h-5" /> Dodaj kolejny blok
                                        </button>
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

                            {/* MINI GALLERY EDITOR */}
                            {section.type === 'mini_gallery' && (
                                <div className="space-y-6">
                                    {/* Config Bar */}
                                    <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-xs text-zinc-400 mb-1">Kolumny</label>
                                            <input
                                                type="range" min="2" max="6" step="1"
                                                value={section.data.mini_gallery_config.columns}
                                                onChange={e => updateMiniGalleryConfig(index, 'columns', parseInt(e.target.value))}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-zinc-500">
                                                <span>2</span><span>{section.data.mini_gallery_config.columns}</span><span>6</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-400 mb-1">Odstęp (Gap)</label>
                                            <input
                                                type="range" min="0" max="10" step="1"
                                                value={section.data.mini_gallery_config.gap}
                                                onChange={e => updateMiniGalleryConfig(index, 'gap', parseInt(e.target.value))}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-zinc-500">
                                                <span>0</span><span>{section.data.mini_gallery_config.gap}</span><span>10</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-400 mb-1">Styl Rogów</label>
                                            <select
                                                value={section.data.mini_gallery_config.corners}
                                                onChange={e => updateMiniGalleryConfig(index, 'corners', e.target.value)}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded text-xs px-2 py-1 text-white"
                                            >
                                                <option value="square">Kwadratowe</option>
                                                <option value="rounded">Zaokrąglone</option>
                                                <option value="pill">Pigułka</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-400 mb-1">Pozycja Tekstu</label>
                                            <select
                                                value={section.data.mini_gallery_config.textPosition}
                                                onChange={e => updateMiniGalleryConfig(index, 'textPosition', e.target.value)}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded text-xs px-2 py-1 text-white"
                                            >
                                                <option value="below">Pod zdjęciem</option>
                                                <option value="overlay">Na zdjęciu</option>
                                                <option value="hover">Shover (Overlay)</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2 md:col-span-4 border-t border-zinc-700/50 pt-2 mt-2">
                                            <div className="flex items-center gap-4">
                                                <label className="text-xs text-zinc-400">Tło sekcji:</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={section.data.mini_gallery_config.backgroundColor || '#000000'}
                                                        onChange={e => updateMiniGalleryConfig(index, 'backgroundColor', e.target.value)}
                                                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={section.data.mini_gallery_config.backgroundColor || ''}
                                                        onChange={e => updateMiniGalleryConfig(index, 'backgroundColor', e.target.value)}
                                                        placeholder="#000000"
                                                        className="bg-zinc-900 border border-zinc-700 rounded text-xs px-2 py-1 text-white w-24"
                                                    />
                                                    <button
                                                        onClick={() => updateMiniGalleryConfig(index, 'backgroundColor', '')}
                                                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs rounded border border-zinc-700"
                                                    >
                                                        Reset (Przezroczyste)
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description Editor */}
                                    <div className="my-6 border-t border-zinc-700/50 pt-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium text-zinc-300">
                                                Opis Sekcji (Profesjonalny)
                                            </label>
                                            <span className="text-xs text-zinc-500">
                                                Obsługuje formatowanie, nagłówki i kolory
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-xs text-zinc-400 mb-1">Szerokość Opisu</label>
                                                <select
                                                    value={section.data.mini_gallery_config.descriptionWidth || 'medium'}
                                                    onChange={e => updateMiniGalleryConfig(index, 'descriptionWidth', e.target.value)}
                                                    className="w-full bg-zinc-900 border border-zinc-700 rounded text-xs px-2 py-1 text-white"
                                                >
                                                    <option value="narrow">Wąski (Compact)</option>
                                                    <option value="medium">Średni (Standard)</option>
                                                    <option value="wide">Szeroki (Wide)</option>
                                                    <option value="full">Pełna szerokość (Full)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-zinc-400 mb-1">Wyrównanie Kontenera</label>
                                                <select
                                                    value={section.data.mini_gallery_config.descriptionAlign || 'center'}
                                                    onChange={e => updateMiniGalleryConfig(index, 'descriptionAlign', e.target.value)}
                                                    className="w-full bg-zinc-900 border border-zinc-700 rounded text-xs px-2 py-1 text-white"
                                                >
                                                    <option value="left">Do lewej</option>
                                                    <option value="center">Wyśrodkowany</option>
                                                    <option value="right">Do prawej</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs text-zinc-400 mb-1">Położenie Opisu</label>
                                                <select
                                                    value={section.data.mini_gallery_config.descriptionPlacement || 'top'}
                                                    onChange={e => updateMiniGalleryConfig(index, 'descriptionPlacement', e.target.value)}
                                                    className="w-full bg-zinc-900 border border-zinc-700 rounded text-xs px-2 py-1 text-white"
                                                >
                                                    <option value="top">Nad galerią (Standard)</option>
                                                    <option value="bottom">Pod galerią</option>
                                                </select>
                                            </div>
                                        </div>

                                        <RichTextEditor
                                            value={section.data.mini_gallery_config.description || ''}
                                            onChange={(val) => updateMiniGalleryConfig(index, 'description', val)}
                                            placeholder="Tutaj wpisz profesjonalny opis galerii (np. 300 słów)..."
                                        />
                                    </div>

                                    {/* Items Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {section.data.mini_gallery_items.map((item, mIndex) => (
                                            <div key={item.id || mIndex} className="bg-zinc-800/30 border border-zinc-700 rounded p-3 relative group">

                                                {/* Image */}
                                                <div className="aspect-square bg-zinc-900 rounded mb-2 overflow-hidden relative">
                                                    {item.image ? (
                                                        <img src={item.image} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-zinc-600">Brak zdjęcia</div>
                                                    )}

                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => moveMiniGalleryItem(index, mIndex, 'left')}
                                                            disabled={mIndex === 0}
                                                            className="p-1.5 bg-zinc-800 rounded-full text-white hover:bg-zinc-700 disabled:opacity-50"
                                                        >
                                                            <ArrowLeft className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => openMediaPicker('mini_gallery_item', index, undefined, mIndex)}
                                                            className="p-1.5 bg-blue-600 rounded-full text-white hover:bg-blue-500"
                                                        >
                                                            <ImageIcon className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => moveMiniGalleryItem(index, mIndex, 'right')}
                                                            disabled={mIndex === section.data.mini_gallery_items.length - 1}
                                                            className="p-1.5 bg-zinc-800 rounded-full text-white hover:bg-zinc-700 disabled:opacity-50"
                                                        >
                                                            <ArrowLeft className="w-4 h-4 rotate-180" />
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => removeMiniGalleryItem(index, mIndex)}
                                                        className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>

                                                {/* Fields */}
                                                <div className="space-y-2">
                                                    <input
                                                        type="text" placeholder="Tytuł"
                                                        value={item.title || ''}
                                                        onChange={e => updateMiniGalleryItem(index, mIndex, 'title', e.target.value)}
                                                        className="w-full bg-transparent border-b border-zinc-700 focus:border-gold-500 text-xs text-white px-1 py-0.5 outline-none"
                                                    />
                                                    <input
                                                        type="text" placeholder="Link (opcjonalny)"
                                                        value={item.link || ''}
                                                        onChange={e => updateMiniGalleryItem(index, mIndex, 'link', e.target.value)}
                                                        className="w-full bg-transparent border-b border-zinc-700 focus:border-gold-500 text-xs text-zinc-400 px-1 py-0.5 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            onClick={() => addMiniGalleryItem(index)}
                                            className="aspect-square border-2 border-dashed border-zinc-700 rounded hover:border-gold-500 hover:text-gold-500 text-zinc-500 flex flex-col items-center justify-center gap-2 transition-colors"
                                        >
                                            <Plus className="w-8 h-8" />
                                            <span className="text-xs font-medium">Dodaj element</span>
                                        </button>
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
                    </div>
                ))
                }
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
