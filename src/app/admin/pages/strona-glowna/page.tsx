/**
 * strona-glowna/page.tsx - Edytor strony głównej
 * Ostatnia aktualizacja: 2024-12-09 23:48
 * Przywrócono z commit 71870e92 - wybór koloru tła dla sekcji
 * Funkcje: Hero slider, sekcje dynamiczne, parallax, foto wyzwania, opinie
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api-config';
import {
    Layout, GripVertical, Image as ImageIcon, Type, Save, Plus, Trash2,
    ArrowLeft, Eye, EyeOff, MoveUp, MoveDown, LayoutTemplate, X,
    ShieldCheck, Workflow, Award, Stars, FileText, Video, Thermometer, FileSearch,
    Briefcase, BarChart3
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import MediaPicker from '@/components/admin/MediaPicker';
import RichTextEditor from '@/components/admin/RichTextEditor';
import templates from '@/lib/homepageModuleTemplates';

import {
    PageSection as Section,
    FeatureItem,
    BannerItem,
    MiniGalleryItem,
    MiniGalleryConfig,
    StoryGridItem,
    SectionType as PBSectionType
} from '@/components/admin/PageBuilder';

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

type SectionType = 'about' | 'features' | 'parallax' | 'info_band' | 'challenge_banner' | 'testimonials' | 'mini_gallery' | 'stories_grid' | 'chronological_gallery' |
    'magazine_layout' | 'masonry_gallery' | 'client_story' | 'process_timeline' | 'investment_teaser' | 'narrative_text' | 'featured_carousel' | 'photo_cube_3d' | 'b2b_hero' | 'b2b_stats' | 'b2b_logos' | 'b2b_process' | 'b2b_cases' | 'b2b_contact' | 'b2b_video' | 'thermal_hero' | 'hero_video' | 'parallax_video' | 'thermal_report' | 'thermal_slider';

interface ChronologicalItem {
    id: string;
    image: string;
    description?: string;
}

type EditorSection = Section & {
    enabled?: boolean;
    label?: string;
    backgroundColor?: 'black' | 'zinc-900' | 'zinc-950' | 'zinc-800' | 'gold-900' | 'white' | string;
    data?: any;
    textVariant?: 'light' | 'dark';
};

type AboutSection = EditorSection;
type FeaturesSection = EditorSection;
type ParallaxSection = EditorSection;
type InfoBandSection = EditorSection;
type ChallengeBannerSection = EditorSection;
type TestimonialsSection = EditorSection;
type MiniGallerySection = EditorSection;
type StoriesGridSection = EditorSection;
type ChronologicalGallerySection = EditorSection;
type MagazineSection = EditorSection;
type MasonryGallerySection = EditorSection;
type ClientStorySection = EditorSection;
type ProcessTimelineSection = EditorSection;
type InvestmentTeaserSection = EditorSection;
type NarrativeTextSection = EditorSection;
type FeaturedCarouselSection = EditorSection;
type PhotoCube3DSection = EditorSection;

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

type HeadingLevel = 'H1' | 'H2' | 'H3';

type HeadingAuditRow = {
    location: string;
    level: HeadingLevel;
    current: string;
    shouldBe: string;
    keywordHint: string;
};

type SeoCategory = 'ogolna' | 'slubna' | 'rodzinna' | 'komunijna' | 'narzeczenska' | 'biznesowa' | 'nieruchomosci';
type SeoIntent = 'heading' | 'body' | 'cta';

type SeoAudit = {
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    weakWords: string[];
    recommendation: string;
};




// --- Mini Gallery Types ---


// --- Stories Grid Types ---


export default function HomepageManager() {
    const router = useRouter();
    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
    const [sections, setSections] = useState<EditorSection[]>([]);
    const [pageId, setPageId] = useState<number | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
    const [currentPickerTarget, setCurrentPickerTarget] = useState<{ type: 'hero' | 'section' | 'advanced' | 'advanced_challenge' | 'rte' | 'mini_gallery_item' | 'story_cover' | 'chronological_gallery' | 'masonry_gallery' | 'featured_carousel_slide', index: number, field?: string, subIndex?: number } | null>(null);

    const [seoCategory, setSeoCategory] = useState<SeoCategory>('ogolna');
    const [seoCities, setSeoCities] = useState<string[]>(['Toruń', 'Grudziądz', 'Chełmno', 'Płużnica', 'Wąbrzeźno']);

    const seoKeywordBank: Record<SeoCategory, string[]> = {
        ogolna: ['fotograf toruń', 'fotograf kujawsko pomorskie', 'sesje zdjęciowe toruń'],
        slubna: ['fotograf ślubny toruń', 'reportaż ślubny grudziądz', 'sesja ślubna chełmno'],
        rodzinna: ['sesja rodzinna toruń', 'fotografia rodzinna grudziądz', 'sesja plenerowa kujawsko pomorskie'],
        komunijna: ['fotograf komunijny toruń', 'sesja komunijna grudziądz', 'zdjęcia komunijne chełmno'],
        narzeczenska: ['sesja narzeczeńska toruń', 'fotograf zaręczynowy grudziądz', 'sesja dla par kujawsko pomorskie'],
        biznesowa: ['fotografia biznesowa toruń', 'sesja wizerunkowa grudziądz', 'zdjęcia firmowe kujawsko pomorskie'],
        nieruchomosci: ['fotografia nieruchomości toruń', 'zdjęcia wnętrz grudziądz', 'fotograf apartamentów kujawsko pomorskie'],
    };

    const weakKeywordPatterns = [
        'profesjonalny',
        'najlepszy',
        'kreatywny',
        'wysoka jakość',
        'pasja',
        'unikalny',
        'doskonały',
    ];

    const trimText = (value: string | undefined | null) => (value || '').replace(/\s+/g, ' ').trim();
    const normalize = (value: string | undefined | null) => trimText(value).toLowerCase();
    const stripHtml = (value: string | undefined | null) => trimText((value || '').replace(/<[^>]*>/g, ' '));

    const cityKeywords = useMemo(
        () => seoCities.map(city => `fotograf ${city.toLowerCase()}`),
        [seoCities]
    );

    const seoKeywords = useMemo(
        () => Array.from(new Set([...seoKeywordBank[seoCategory], ...cityKeywords])),
        [seoCategory, cityKeywords]
    );

    const cityLabel = seoCities.join(', ');

    const analyzeSeoText = (input: string, intent: SeoIntent): SeoAudit => {
        const clean = stripHtml(input);
        const lower = normalize(clean);
        const words = clean.split(' ').filter(Boolean);

        const matchedKeywords = seoKeywords.filter(keyword => lower.includes(keyword.toLowerCase()));
        const missingKeywords = seoKeywords.filter(keyword => !lower.includes(keyword.toLowerCase()));
        const weakWords = weakKeywordPatterns.filter(keyword => lower.includes(keyword));

        const keywordCoverage = seoKeywords.length > 0 ? (matchedKeywords.length / seoKeywords.length) * 70 : 0;
        const cityCoverage = seoCities.length > 0
            ? (seoCities.filter(city => lower.includes(city.toLowerCase())).length / seoCities.length) * 20
            : 0;

        let quality = 10;
        if (intent === 'heading') {
            if (words.length >= 6 && words.length <= 14) quality += 10;
            if (words.length > 16) quality -= 8;
        }

        if (intent === 'body' && words.length >= 40) quality += 8;
        if (intent === 'body' && words.length < 20) quality -= 6;
        if (intent === 'cta' && words.length > 8) quality -= 5;

        const penalty = weakWords.length * 6;
        const score = Math.max(0, Math.min(100, Math.round(keywordCoverage + cityCoverage + quality - penalty)));

        let recommendation = 'Treść jest dobra i gotowa pod publikację.';
        if (score < 85) recommendation = 'Dodaj więcej lokalizacji i fraz usługowych z aktualnej kategorii.';
        if (score < 65) recommendation = 'Treść wymaga przebudowy: za mało konkretu lokalnego i intencji usługowej.';
        if (score < 45) recommendation = 'Treść jest słaba SEO. Użyj gotowej propozycji i dołóż frazy miasto + usługa.';

        return { score, matchedKeywords, missingKeywords, weakWords, recommendation };
    };

    const buildSuggestedText = (current: string, intent: SeoIntent): string => {
        const clean = stripHtml(current);
        const primaryCity = seoCities[0] || 'Toruń';
        const secondaryCity = seoCities[1] || 'Grudziądz';

        if (intent === 'heading') {
            if (seoCategory === 'slubna') return `Fotograf ślubny ${primaryCity} i ${secondaryCity} - naturalny reportaż ślubny`;
            if (seoCategory === 'rodzinna') return `Sesja rodzinna ${primaryCity} i ${secondaryCity} - naturalna fotografia`;
            if (seoCategory === 'komunijna') return `Fotograf komunijny ${primaryCity} i ${secondaryCity} - reportaż i portrety`;
            if (seoCategory === 'biznesowa') return `Fotografia biznesowa ${primaryCity} i ${secondaryCity} - profesjonalny wizerunek firmy`;
            return `Fotograf ${primaryCity} i ${secondaryCity} - sesje ślubne, rodzinne i komunijne`;
        }

        if (intent === 'cta') {
            return `Sprawdź ofertę fotografa z ${primaryCity} i umów termin sesji`; 
        }

        if (clean.length > 40) return clean;
        return `Tworzę naturalne reportaże i sesje zdjęciowe na terenie ${cityLabel}. Specjalizuję się w fotografii ${seoCategory === 'ogolna' ? 'ślubnej, rodzinnej i komunijnej' : seoCategory}. Każda sesja jest planowana pod Waszą historię, klimat i lokalizację.`;
    };

    const renderSeoAssistant = (
        value: string,
        intent: SeoIntent,
        label: string,
        onApply: (next: string) => void,
    ) => {
        const clean = stripHtml(value || '');
        const audit = analyzeSeoText(clean, intent);
        const suggestion = buildSuggestedText(clean, intent);
        const scoreColor = audit.score >= 85 ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' : audit.score >= 65 ? 'text-amber-300 border-amber-500/30 bg-amber-500/10' : 'text-red-300 border-red-500/30 bg-red-500/10';

        return (
            <div className="mt-2 rounded border border-zinc-700 bg-zinc-900/50 p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] text-zinc-400">SEO Assistant: {label}</p>
                    <span className={`text-[11px] px-2 py-0.5 rounded border ${scoreColor}`}>SEO {audit.score}%</span>
                </div>

                <p className="text-[11px] text-zinc-500">{audit.recommendation}</p>

                {audit.missingKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {audit.missingKeywords.slice(0, 4).map(kw => (
                            <span key={kw} className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">Brakuje: {kw}</span>
                        ))}
                    </div>
                )}

                {audit.weakWords.length > 0 && (
                    <p className="text-[10px] text-red-300">Nieistotne/słabe słowa: {audit.weakWords.join(', ')}</p>
                )}

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onApply(suggestion)}
                        className="text-[11px] px-2 py-1 rounded bg-sky-600/20 border border-sky-500/30 text-sky-300 hover:bg-sky-600/30"
                    >
                        Podmień na sugestię
                    </button>
                    <button
                        type="button"
                        onClick={() => onApply(`${clean} ${audit.missingKeywords.slice(0, 2).join(', ')}`.trim())}
                        className="text-[11px] px-2 py-1 rounded bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30"
                    >
                        Dodaj brakujące frazy
                    </button>
                </div>
            </div>
        );
    };

    const toggleSeoCity = (city: string) => {
        setSeoCities(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]);
    };

    const suggestHeading = (current: string, location: string, level: HeadingLevel): { text: string; hint: string } => {
        const clean = trimText(current);
        const lower = clean.toLowerCase();
        const longHeading = clean.length > 95 || clean.split(' ').filter(Boolean).length > 14;

        if (level === 'H1') {
            return {
                text: `Fotograf ${cityLabel} — Przemysław Właśniewski. Sesje rodzinne, ślubne i komunijne`,
                hint: 'fotograf toruń + miasta + usługi',
            };
        }

        if (location.includes('Slajd')) {
            if (lower.includes('komuni')) return { text: 'Fotograf komunijny Toruń i okolice — naturalne kadry', hint: 'fotograf komunijny toruń' };
            if (lower.includes('slub')) return { text: 'Fotograf ślubny Toruń, Grudziądz, Chełmno', hint: 'fotograf ślubny toruń' };
            if (lower.includes('rodzin')) return { text: 'Sesja rodzinna Toruń i Grudziądz — naturalna fotografia', hint: 'sesja rodzinna toruń' };
            return { text: 'Fotograf Toruń i okolice — naturalna fotografia rodzinna i ślubna', hint: 'fotograf toruń' };
        }

        if (location.includes('Opinie')) return { text: 'Opinie klientów — fotograf Toruń i okolice', hint: 'fotograf toruń opinie' };
        if (location.includes('Oferta')) return { text: 'Fotograf Toruń, Grudziądz, Chełmno, Płużnica i Wąbrzeźno — sprawdź ofertę', hint: 'fotograf + miasta' };
        if (location.includes('Kontakt') || location.includes('Napisz')) return { text: 'Napisz do mnie — fotograf Toruń, Grudziądz, Chełmno, Płużnica, Wąbrzeźno', hint: 'kontakt fotograf toruń' };

        if (longHeading) {
            return {
                text: 'Fotograf Toruń i okolice — naturalne sesje rodzinne, ślubne i komunijne',
                hint: 'skrót + lokalizacja + intencja',
            };
        }

        return {
            text: clean || 'Fotograf Toruń i okolice — naturalna fotografia',
            hint: 'dodaj lokalizację i usługę',
        };
    };

    const headingAuditRows = useMemo<HeadingAuditRow[]>(() => {
        const rows: HeadingAuditRow[] = [];

        const h1Current = `Fotograf ${cityLabel} — Przemysław Właśniewski. Sesje rodzinne, ślubne i komunijne`;
        const h1Suggestion = suggestHeading(h1Current, 'Globalny H1 (SSR)', 'H1');
        rows.push({
            location: 'Globalny H1 (SSR)',
            level: 'H1',
            current: h1Current,
            shouldBe: h1Suggestion.text,
            keywordHint: h1Suggestion.hint,
        });

        heroSlides
            .filter(s => s.enabled !== false)
            .forEach((slide, idx) => {
                const title = trimText(slide.title);
                if (!title) return;
                const suggestion = suggestHeading(title, `Hero Slider: Slajd #${idx + 1}`, 'H2');
                rows.push({
                    location: `Hero Slider: Slajd #${idx + 1} (pole: Tytuł)`,
                    level: 'H2',
                    current: title,
                    shouldBe: suggestion.text,
                    keywordHint: suggestion.hint,
                });
            });

        sections
            .filter(s => s.enabled !== false)
            .forEach((section, idx) => {
                const base = `${section.label || section.type} #${idx + 1}`;

                if (section.type === 'testimonials') {
                    const title = trimText((section as any)?.data?.title);
                    if (title) {
                        const suggestion = suggestHeading(title, `${base}: Opinie`, 'H2');
                        rows.push({ location: `${base}: tytuł sekcji`, level: 'H2', current: title, shouldBe: suggestion.text, keywordHint: suggestion.hint });
                    }
                }

                if (section.type === 'stories_grid') {
                    const title = trimText((section as any)?.data?.title);
                    if (title) {
                        const suggestion = suggestHeading(title, `${base}: Wybierzcie swoją historię`, 'H2');
                        rows.push({ location: `${base}: tytuł sekcji`, level: 'H2', current: title, shouldBe: suggestion.text, keywordHint: suggestion.hint });
                    }

                    const items = ((section as any)?.data?.items || []) as Array<{ title?: string }>;
                    items.forEach((item, itemIdx) => {
                        const t = trimText(item.title);
                        if (!t) return;
                        const suggestion = suggestHeading(t, `${base}: historia ${itemIdx + 1}`, 'H3');
                        rows.push({ location: `${base}: historia #${itemIdx + 1}`, level: 'H3', current: t, shouldBe: suggestion.text, keywordHint: suggestion.hint });
                    });
                }

                if (section.type === 'features') {
                    const features = ((section as any)?.data?.features || []) as Array<{ title?: string }>;
                    features.forEach((f, fIdx) => {
                        const t = trimText(f.title);
                        if (!t) return;
                        const suggestion = suggestHeading(t, `${base}: kafelek ${fIdx + 1}`, 'H3');
                        rows.push({ location: `${base}: kafelek #${fIdx + 1}`, level: 'H3', current: t, shouldBe: suggestion.text, keywordHint: suggestion.hint });
                    });
                }

                if (section.type === 'narrative_text' || section.type === 'featured_carousel' || section.type === 'info_band' || section.type === 'about') {
                    const title = trimText((section as any)?.data?.title);
                    if (title) {
                        const suggestion = suggestHeading(title, `${base}: tytuł`, 'H2');
                        rows.push({ location: `${base}: tytuł sekcji`, level: 'H2', current: title, shouldBe: suggestion.text, keywordHint: suggestion.hint });
                    }
                }
            });

        return rows;
    }, [heroSlides, sections, cityLabel]);

    const problematicHeadingCount = headingAuditRows.filter(row => trimText(row.current) !== trimText(row.shouldBe)).length;

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
            backgroundColor: 'black',
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

    const addStoriesGridTemplate = () => {
        const tpl = templates.createStoriesGridTemplate() as StoriesGridSection;
        setSections(prev => [tpl, ...prev]);
        toast.success('Dodano Stories Grid na górę (pamiętaj zapisać)');
    };

    const addChronologicalGalleryTemplate = () => {
        const tpl = templates.createChronologicalGalleryTemplate() as ChronologicalGallerySection;
        setSections(prev => [tpl, ...prev]);
        toast.success('Dodano Chronological Gallery na górę (pamiętaj zapisać)');
    };

    const addMagazineLayoutTemplate = () => {
        const tpl = templates.createMagazineLayoutTemplate() as MagazineSection;
        setSections(prev => [tpl, ...prev]);
        toast.success('Dodano Magazine Layout na górę (pamiętaj zapisać)');
    };

    const addMasonryGalleryTemplate = () => {
        const tpl = templates.createMasonryGalleryTemplate() as MasonryGallerySection;
        setSections(prev => [tpl, ...prev]);
        toast.success('Dodano Masonry Gallery na górę (pamiętaj zapisać)');
    };

    const addClientStoryTemplate = () => {
        const tpl = templates.createClientStoryTemplate() as ClientStorySection;
        setSections(prev => [tpl, ...prev]);
        toast.success('Dodano Client Story na górę (pamiętaj zapisać)');
    };

    const addProcessTimelineTemplate = () => {
        const tpl = templates.createProcessTimelineTemplate() as ProcessTimelineSection;
        setSections(prev => [tpl, ...prev]);
        toast.success('Dodano Process Timeline na górę (pamiętaj zapisać)');
    };

    const addInvestmentTeaserTemplate = () => {
        const tpl = templates.createInvestmentTeaserTemplate() as InvestmentTeaserSection;
        setSections(prev => [tpl, ...prev]);
        toast.success('Dodano Investment Teaser na górę (pamiętaj zapisać)');
    };

    const addNarrativeTextTemplate = () => {
        const tpl = templates.createNarrativeTextTemplate() as NarrativeTextSection;
        setSections(prev => [tpl, ...prev]);
        toast.success('Dodano Narrative Text na górę (pamiętaj zapisać)');
    };

    const addFeaturedCarouselTemplate = () => {
        const tpl = templates.createFeaturedCarouselTemplate() as FeaturedCarouselSection;
        setSections(prev => [tpl, ...prev]);
        toast.success('Dodano Featured Carousel na górę (pamiętaj zapisać)');
    };

    const addPhotoCube3DTemplate = () => {
        const tpl = templates.createPhotoCube3DTemplate() as PhotoCube3DSection;
        setSections(prev => [tpl, ...prev]);
        toast.success('Dodano Kostkę 3D na górę (pamiętaj zapisać)');
    };

    const addHeroSlideTemplate = () => {
        const tpl = templates.createHeroSlideTemplate();
        setHeroSlides(prev => [...prev, tpl]);
        toast.success('Dodano slajd do hero (pamiętaj zapisać)');
    };

    // --- Add all modules at once (szybkie wypełnienie wszystkimi moduły) ---
    const addAllModulesAtOnce = () => {
        // Clear existing sections and add all templates
        const allSections: EditorSection[] = [
            templates.createAboutSectionTemplate() as AboutSection,
            templates.createFeaturesSectionTemplate() as FeaturesSection,
            templates.createParallaxSectionTemplate() as ParallaxSection,
            templates.createInfoBandTemplate() as InfoBandSection,
            templates.createChallengeBannerTemplate() as ChallengeBannerSection,
            templates.createTestimonialsTemplate() as TestimonialsSection,
            templates.createStoriesGridTemplate() as StoriesGridSection,
            templates.createChronologicalGalleryTemplate() as ChronologicalGallerySection,
            templates.createMagazineLayoutTemplate() as MagazineSection,
            templates.createMasonryGalleryTemplate() as MasonryGallerySection,
            templates.createClientStoryTemplate() as ClientStorySection,
            templates.createProcessTimelineTemplate() as ProcessTimelineSection,
            templates.createInvestmentTeaserTemplate() as InvestmentTeaserSection,
            templates.createNarrativeTextTemplate() as NarrativeTextSection,
            templates.createFeaturedCarouselTemplate() as FeaturedCarouselSection
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

    const openMediaPicker = (type: 'hero' | 'section' | 'advanced' | 'advanced_challenge' | 'rte' | 'mini_gallery_item' | 'story_cover' | 'chronological_gallery' | 'masonry_gallery' | 'featured_carousel_slide' | 'cube_face', index: number, field?: string, subIndex?: number) => {
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
        } else if (currentPickerTarget.type === 'story_cover') {
            const updated = [...sections];
            const section = updated[currentPickerTarget.index] as StoriesGridSection;
            if (currentPickerTarget.subIndex !== undefined) {
                const item = section.data.stories_items[currentPickerTarget.subIndex];
                item.image = filePath;
            }
            setSections(updated);
        } else if (currentPickerTarget.type === 'chronological_gallery') {
            const sectionIdx = currentPickerTarget.index;
            setSections(prevSections => prevSections.map((sec, idx) => {
                if (idx !== sectionIdx) return sec;

                const newData = { ...(sec.data || {}) };
                const currentItems = Array.isArray(newData.chronological_items) ? newData.chronological_items : [];

                const newItems: ChronologicalItem[] = filePaths.map(path => ({
                    id: Math.random().toString(36).substr(2, 9),
                    image: path,
                    description: ''
                }));

                return {
                    ...sec,
                    data: { ...newData, chronological_items: [...currentItems, ...newItems] }
                };
            }));
        } else if (currentPickerTarget.type === 'masonry_gallery') {
            const sectionIdx = currentPickerTarget.index;
            setSections(prevSections => prevSections.map((sec, idx) => {
                if (idx !== sectionIdx) return sec;

                const newData = { ...(sec.data || {}) };
                const currentImages = Array.isArray(newData.images) ? newData.images : [];

                return {
                    ...sec,
                    data: { ...newData, images: [...currentImages, ...filePaths] }
                };
            }));
        } else if (currentPickerTarget.type === 'featured_carousel_slide') {
            const updated = [...sections];
            const section = updated[currentPickerTarget.index];
            if (currentPickerTarget.subIndex !== undefined && section.data?.items) {
                section.data.items[currentPickerTarget.subIndex].image = filePath;
                setSections(updated);
            }
        } else if (currentPickerTarget.type === 'cube_face') {
            const sectionIdx = currentPickerTarget.index;
            const faceIdx = currentPickerTarget.subIndex ?? 0;
            setSections(prevSections => prevSections.map((sec, idx) => {
                if (idx !== sectionIdx) return sec;
                const images = [...(sec.data?.images || [])];
                // Ensure array is long enough
                while (images.length <= faceIdx) images.push('');
                images[faceIdx] = filePath;
                return { ...sec, data: { ...sec.data, images } };
            }));
        } else {
            const updated = [...sections];
            const section = updated[currentPickerTarget.index];
            const fieldName = currentPickerTarget.field || 'image'; // Default to 'image' if no field specified

            if (section.type === 'about' || section.type === 'parallax' || section.type === 'info_band') {
                // Handle complex nested updates for legacy sections
                if (currentPickerTarget.subIndex !== undefined && (section.data as any).blocks) {
                    (section.data as any).blocks[currentPickerTarget.subIndex].image = filePath;
                } else if (fieldName === 'image_desktop') {
                    (section.data as any).image_desktop = filePath;
                } else if (fieldName === 'image_mobile') {
                    (section.data as any).image_mobile = filePath;
                } else {
                    // Fallback for standard fields in these sections
                    (section.data as any)[fieldName] = filePath;
                }
            } else if (section.type === 'challenge_banner' && fieldName === 'photos') {
                // Challenge banner special field
                (section.data as any).photos = filePaths;
            } else {
                // Generic handler for all other sections (including Magazine Layout)
                // This allows openMediaPicker('section', index, 'secondaryImage') to work
                if (!section.data) section.data = {};
                (section.data as any)[fieldName] = filePath;
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
        if (!newSections[index].data) {
            newSections[index].data = {};
        }
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
        section.data.features = section.data.features.filter((_: any, i: number) => i !== featureIndex);
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
        <div className="min-h-screen bg-black text-white p-8 pb-32">
            <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10 p-4 -mx-8 -mt-8 mb-8 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                    <Link href="/admin/pages" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Powrót</span>
                    </Link>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">Zarządzanie stroną główną</h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black px-6 py-2 rounded font-semibold transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)] disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
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
                <button onClick={addStoriesGridTemplate} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm border border-pink-500/30 text-pink-400">Dodaj Stories Grid</button>
                <button onClick={addChronologicalGalleryTemplate} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm border border-cyan-500/30 text-cyan-400">Dodaj Chronological Gallery</button>

                <button onClick={addMagazineLayoutTemplate} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm border border-indigo-500/30 text-indigo-400">Dodaj Magazine Layout</button>
                <button onClick={addMasonryGalleryTemplate} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm border border-green-500/30 text-green-400">Dodaj Masonry Gallery</button>
                <button onClick={addClientStoryTemplate} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm border border-purple-500/30 text-purple-400">Dodaj Client Story</button>
                <button onClick={addProcessTimelineTemplate} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm border border-orange-500/30 text-orange-400">Dodaj Timeline</button>
                <button onClick={addInvestmentTeaserTemplate} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm border border-yellow-500/30 text-yellow-400">Dodaj Investment</button>
                <button onClick={addNarrativeTextTemplate} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm border border-gray-500/30 text-gray-400">Dodaj Tekst Narracyjny</button>
                <button onClick={addFeaturedCarouselTemplate} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm border border-blue-500/30 text-blue-400">Dodaj Karuzelę</button>
                <button onClick={addPhotoCube3DTemplate} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm border border-yellow-500/30 text-yellow-400">Dodaj Kostkę 3D 🎲</button>
            </div>

            <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-semibold text-white">Silnik słów kluczowych dla edytorów</h2>
                        <p className="text-xs text-zinc-400 mt-1">Każdy asystent pola tekstowego bierze frazy z tej konfiguracji.</p>
                    </div>
                    <span className="text-[11px] px-2 py-1 rounded border border-zinc-700 text-zinc-300 bg-zinc-800/70">Aktywna kategoria: {seoCategory}</span>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1">Kategoria fotografii</label>
                        <select
                            value={seoCategory}
                            onChange={e => setSeoCategory(e.target.value as SeoCategory)}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                        >
                            <option value="ogolna">Ogólna</option>
                            <option value="slubna">Ślubna</option>
                            <option value="rodzinna">Rodzinna</option>
                            <option value="komunijna">Komunijna</option>
                            <option value="narzeczenska">Narzeczeńska</option>
                            <option value="biznesowa">Biznesowa</option>
                            <option value="nieruchomosci">Nieruchomości</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs text-zinc-400 mb-1">Miasta docelowe (Kujawsko-Pomorskie)</label>
                        <div className="flex flex-wrap gap-2">
                            {['Toruń', 'Grudziądz', 'Chełmno', 'Płużnica', 'Wąbrzeźno', 'Bydgoszcz', 'Świecie', 'Golub-Dobrzyń'].map(city => (
                                <button
                                    key={city}
                                    type="button"
                                    onClick={() => toggleSeoCity(city)}
                                    className={`text-xs px-2 py-1 rounded border ${seoCities.includes(city) ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}
                                >
                                    {city}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* SEO Heading Map */}
            <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Mapa nagłówków SEO (H1/H2/H3)</h2>
                        <p className="text-sm text-zinc-400 mt-1">
                            Tutaj dokładnie widzisz: gdzie jest nagłówek, jaki ma typ, co jest teraz i co warto podmienić pod pozycjonowanie lokalne.
                        </p>
                    </div>
                    <div className="text-xs px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300">
                        Do poprawy: {problematicHeadingCount}
                    </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                    {seoKeywords.map((kw) => (
                        <span key={kw} className="text-[11px] px-2 py-1 rounded border border-zinc-700 text-zinc-300 bg-zinc-800/60">
                            {kw}
                        </span>
                    ))}
                </div>
                <p className="text-[11px] text-zinc-500 mb-3">Frazy powyżej są używane przez podpowiadacze przy polach tekstowych w całym module.</p>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
                                <th className="py-2 pr-3">Miejsce</th>
                                <th className="py-2 pr-3">Typ</th>
                                <th className="py-2 pr-3">Jest</th>
                                <th className="py-2 pr-3">Powinno być</th>
                                <th className="py-2">Fraza</th>
                            </tr>
                        </thead>
                        <tbody>
                            {headingAuditRows.map((row, idx) => {
                                const changed = trimText(row.current) !== trimText(row.shouldBe);
                                return (
                                    <tr key={`${row.location}-${idx}`} className="border-b border-zinc-800/60 align-top">
                                        <td className="py-2 pr-3 text-zinc-300">{row.location}</td>
                                        <td className="py-2 pr-3">
                                            <span className={`text-xs px-2 py-0.5 rounded ${row.level === 'H1' ? 'bg-fuchsia-500/15 text-fuchsia-300' : row.level === 'H2' ? 'bg-sky-500/15 text-sky-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                                                {row.level}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-3 text-zinc-400">{row.current || '—'}</td>
                                        <td className={`py-2 pr-3 ${changed ? 'text-amber-300' : 'text-emerald-300'}`}>{row.shouldBe || '—'}</td>
                                        <td className="py-2 text-zinc-500">{row.keywordHint}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
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
                                    <label className="block text-sm text-zinc-400 mb-1">Tytuł <span className="text-sky-300">(renderuje się jako H2)</span></label>
                                    <input type="text" value={slide.title} onChange={e => updateHeroSlide(index, 'title', e.target.value)} placeholder="Główny tytuł" className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white" />
                                    <p className="text-[11px] text-zinc-500 mt-1">W tym polu wpisuj frazę lokalną + usługę, np. „Fotograf ślubny Toruń i Grudziądz”.</p>
                                    {renderSeoAssistant(slide.title, 'heading', `Hero Slider #${index + 1} - Tytuł`, (next) => updateHeroSlide(index, 'title', next))}
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Podtytuł</label>
                                    <input type="text" value={slide.subtitle} onChange={e => updateHeroSlide(index, 'subtitle', e.target.value)} placeholder="Podtytuł/opis krótki" className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white" />
                                    <p className="text-[11px] text-zinc-500 mt-1">To jest tekst pomocniczy, nie nagłówek SEO. Trzymaj go krótko i sprzedażowo.</p>
                                    {renderSeoAssistant(slide.subtitle, 'body', `Hero Slider #${index + 1} - Podtytuł`, (next) => updateHeroSlide(index, 'subtitle', next))}
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Opis (szczegółowy)</label>
                                    <textarea rows={2} value={slide.description || ''} onChange={e => updateHeroSlide(index, 'description', e.target.value)} placeholder="Dodatkowy opis pod podtytułem" className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white" />
                                    {renderSeoAssistant(slide.description || '', 'body', `Hero Slider #${index + 1} - Opis`, (next) => updateHeroSlide(index, 'description', next))}
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
                                            {renderSeoAssistant(section.data.title || '', 'heading', `${section.label} - Tytuł`, (next) => updateSectionData(index, 'title', next))}
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
                                        {renderSeoAssistant(section.data.content || '', 'body', `${section.label} - Treść`, (next) => updateSectionData(index, 'content', next))}
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
                                                    {renderSeoAssistant(feature.title || '', 'heading', `${section.label} - Kafelek #${fIndex + 1}`, (next) => updateFeature(index, fIndex, 'title', next))}
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

                            {/* MAGAZINE LAYOUT EDITOR */}
                            {section.type === 'magazine_layout' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-zinc-400 mb-2">Główne Zdjęcie</label>
                                            <div className="flex gap-4 items-center">
                                                {section.data.image && (
                                                    <div className="relative w-24 h-32 rounded border border-zinc-700 overflow-hidden">
                                                        <img src={section.data.image} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => openMediaPicker('section', index, 'image')}
                                                    className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 hover:text-white"
                                                >
                                                    Wybierz
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-400 mb-2">Drugie Zdjęcie (Detail)</label>
                                            <div className="flex gap-4 items-center">
                                                {section.data.secondaryImage && (
                                                    <div className="relative w-24 h-32 rounded border border-zinc-700 overflow-hidden">
                                                        <img src={section.data.secondaryImage} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => openMediaPicker('section', index, 'secondaryImage')}
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
                                                value={section.data.layout || 'left'}
                                                onChange={(e) => updateSectionData(index, 'layout', e.target.value)}
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
                                                value={section.data.subtitle || ''}
                                                onChange={(e) => updateSectionData(index, 'subtitle', e.target.value)}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-zinc-400 mb-1">Tytuł (Headline)</label>
                                        <input
                                            type="text"
                                            value={section.data.title || ''}
                                            onChange={(e) => updateSectionData(index, 'title', e.target.value)}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-lg"
                                        />
                                        {renderSeoAssistant(section.data.title || '', 'heading', `${section.label} - Headline`, (next) => updateSectionData(index, 'title', next))}
                                    </div>
                                    <div>
                                        <label className="block text-xs text-zinc-400 mb-1">Treść</label>
                                        <RichTextEditor
                                            value={section.data.content || ''}
                                            onChange={(val) => updateSectionData(index, 'content', val)}
                                        />
                                        {renderSeoAssistant(section.data.content || '', 'body', `${section.label} - Treść`, (next) => updateSectionData(index, 'content', next))}
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
                                                {renderSeoAssistant(section.data.title || '', 'heading', `${section.label} - Tytuł`, (next) => updateSectionData(index, 'title', next))}
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
                                                            {renderSeoAssistant(block.title || '', 'heading', `${section.label} - Blok #${bIdx + 1} tytuł`, (next) => updateAboutBlock(index, bIdx, 'title', next))}
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
                                                    {renderSeoAssistant(block.content || '', 'body', `${section.label} - Blok #${bIdx + 1} treść`, (next) => updateAboutBlock(index, bIdx, 'content', next))}
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
                                            {renderSeoAssistant(section.data.title || '', 'heading', `${section.label} - Tytuł`, (next) => updateSectionData(index, 'title', next))}
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Podtytuł</label>
                                            <input
                                                type="text"
                                                value={section.data.subtitle}
                                                onChange={e => updateSectionData(index, 'subtitle', e.target.value)}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                                            />
                                            {renderSeoAssistant(section.data.subtitle || '', 'body', `${section.label} - Podtytuł`, (next) => updateSectionData(index, 'subtitle', next))}
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
                                                <div className="flex-1">
                                                    <label className="block text-xs text-zinc-400 mb-1">Układ Mobilny (Kolumny)</label>
                                                    <select
                                                        value={section.data.mini_gallery_config.mobileColumns || 1}
                                                        onChange={e => updateMiniGalleryConfig(index, 'mobileColumns', parseInt(e.target.value))}
                                                        className="w-full bg-zinc-900 border border-zinc-700 rounded text-xs px-2 py-1 text-white"
                                                    >
                                                        <option value={1}>1 Kolumna (Standard)</option>
                                                        <option value={2}>2 Kolumny (Compact)</option>
                                                    </select>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-xs text-zinc-400 mb-1">Szerokość Desktop</label>
                                                    <select
                                                        value={section.data.mini_gallery_config.containerWidth || 'full'}
                                                        onChange={e => updateMiniGalleryConfig(index, 'containerWidth', e.target.value)}
                                                        className="w-full bg-zinc-900 border border-zinc-700 rounded text-xs px-2 py-1 text-white"
                                                    >
                                                        <option value="full">Pełna szerokość (100%)</option>
                                                        <option value="3/4">Szeroka (75%)</option>
                                                        <option value="1/2">Wąska (50%)</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 mt-3">
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
                                        {renderSeoAssistant(section.data.mini_gallery_config.description || '', 'body', `${section.label} - Opis galerii`, (next) => updateMiniGalleryConfig(index, 'description', next))}
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
                                                    {renderSeoAssistant(section.data.title || '', 'heading', `${section.label} - Tytuł`, (next) => updateSectionData(index, 'title', next))}
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
                                                {renderSeoAssistant(section.data.content || '', 'body', `${section.label} - Treść`, (next) => updateSectionData(index, 'content', next))}
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

                            {/* STORIES GRID EDITOR */}
                            {section.type === 'stories_grid' && (
                                <div className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Tytuł</label>
                                            <input type="text" value={section.data.title} onChange={e => updateSectionData(index, 'title', e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white" />
                                            {renderSeoAssistant(section.data.title || '', 'heading', `${section.label} - Tytuł`, (next) => updateSectionData(index, 'title', next))}
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Podtytuł</label>
                                            <input type="text" value={section.data.subtitle} onChange={e => updateSectionData(index, 'subtitle', e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white" />
                                            {renderSeoAssistant(section.data.subtitle || '', 'body', `${section.label} - Podtytuł`, (next) => updateSectionData(index, 'subtitle', next))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-zinc-500 uppercase">Historie</label>
                                        {(section.data.stories_items || []).map((story, sIdx) => (
                                            <div key={story.id} className="bg-zinc-800 p-3 rounded border border-zinc-700 flex gap-4 items-start">
                                                <div className="w-16 h-24 shrink-0 bg-zinc-900 border border-zinc-600 rounded overflow-hidden relative group cursor-pointer"
                                                    onClick={() => openMediaPicker('story_cover', index, undefined, sIdx)}
                                                >
                                                    {story.image ? <img src={story.image} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-zinc-600"><ImageIcon size={16} /></div>}
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-white font-bold uppercase">Zmień</div>
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <input
                                                        type="text"
                                                        value={story.title}
                                                        onChange={e => {
                                                            const newItems = [...section.data.stories_items];
                                                            newItems[sIdx].title = e.target.value;
                                                            updateSectionData(index, 'stories_items', newItems);
                                                        }}
                                                        placeholder="Tytuł Historii"
                                                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white"
                                                    />
                                                    {renderSeoAssistant(story.title || '', 'heading', `${section.label} - Historia #${sIdx + 1} tytuł`, (next) => {
                                                        const newItems = [...section.data.stories_items];
                                                        newItems[sIdx].title = next;
                                                        updateSectionData(index, 'stories_items', newItems);
                                                    })}
                                                    <input
                                                        type="text"
                                                        value={story.link}
                                                        onChange={e => {
                                                            const newItems = [...section.data.stories_items];
                                                            newItems[sIdx].link = e.target.value;
                                                            updateSectionData(index, 'stories_items', newItems);
                                                        }}
                                                        placeholder="Link (np. /historie/asia-i-tomek)"
                                                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-blue-400"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={story.category}
                                                        onChange={e => {
                                                            const newItems = [...section.data.stories_items];
                                                            newItems[sIdx].category = e.target.value;
                                                            updateSectionData(index, 'stories_items', newItems);
                                                        }}
                                                        placeholder="Kategoria"
                                                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-400"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const newItems = section.data.stories_items.filter((_, i) => i !== sIdx);
                                                        updateSectionData(index, 'stories_items', newItems);
                                                    }}
                                                    className="text-zinc-500 hover:text-red-500"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => {
                                                const newStory: StoryGridItem = { id: Math.random().toString(36).substr(2, 9), title: 'Nowa Historia', image: '', link: '', category: 'Reportaż' };
                                                const newItems = [...(section.data.stories_items || []), newStory];
                                                updateSectionData(index, 'stories_items', newItems);
                                            }}
                                            className="w-full py-2 border-2 border-dashed border-zinc-700 rounded text-zinc-400 hover:border-gold-500 hover:text-gold-500 transition-colors text-xs font-bold uppercase"
                                        >
                                            + Dodaj Historię
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* CHRONOLOGICAL GALLERY EDITOR */}
                            {section.type === 'chronological_gallery' && (
                                <div className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Tytuł Galerii</label>
                                            <input type="text" value={section.data.title} onChange={e => updateSectionData(index, 'title', e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Układ</label>
                                            <select
                                                value={section.data.gallery_layout || 'grid'}
                                                onChange={e => updateSectionData(index, 'gallery_layout', e.target.value)}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                                            >
                                                <option value="grid">Siatka (Grid)</option>
                                                <option value="list">Lista (Kolumna)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-xs font-bold text-zinc-500 uppercase">Zdjęcia ({section.data.chronological_items?.length || 0})</label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => updateSectionData(index, 'chronological_items', [])}
                                                    className="text-xs text-red-500 hover:text-red-400 px-2 py-1"
                                                >
                                                    Wyczyść
                                                </button>
                                                <button
                                                    onClick={() => openMediaPicker('chronological_gallery', index)}
                                                    className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded border border-cyan-500/30 font-bold"
                                                >
                                                    + MASOWO
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 bg-zinc-900/50 rounded border border-zinc-800">
                                            {(section.data.chronological_items || []).map((item, cIdx) => (
                                                <div key={item.id || cIdx} className="relative aspect-square group">
                                                    <img src={item.image} className="w-full h-full object-cover rounded bg-zinc-800" />
                                                    <button
                                                        onClick={() => {
                                                            const newItems = section.data.chronological_items.filter((_, i) => i !== cIdx);
                                                            updateSectionData(index, 'chronological_items', newItems);
                                                        }}
                                                        className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                    <input
                                                        type="text"
                                                        value={item.description || ''}
                                                        onChange={(e) => {
                                                            const newItems = [...section.data.chronological_items];
                                                            newItems[cIdx].description = e.target.value;
                                                            updateSectionData(index, 'chronological_items', newItems);
                                                        }}
                                                        placeholder="Opis..."
                                                        className="absolute bottom-0 left-0 w-full bg-black/70 text-[8px] text-white px-1 border-none focus:ring-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* MASONRY GALLERY EDITOR */}
                            {section.type === 'masonry_gallery' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-zinc-500 uppercase">Masonry Gallery</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-zinc-400 mb-1">Tytuł Sekcji</label>
                                            <input
                                                type="text"
                                                value={section.data?.title || ''}
                                                onChange={(e) => updateSectionData(index, 'title', e.target.value)}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                            />
                                            {renderSeoAssistant(section.data?.title || '', 'heading', `${section.label} - Tytuł`, (next) => updateSectionData(index, 'title', next))}
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-400 mb-1">Podtytuł</label>
                                            <input
                                                type="text"
                                                value={section.data?.subtitle || ''}
                                                onChange={(e) => updateSectionData(index, 'subtitle', e.target.value)}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                            />
                                            {renderSeoAssistant(section.data?.subtitle || '', 'body', `${section.label} - Podtytuł`, (next) => updateSectionData(index, 'subtitle', next))}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(section.data?.images || []).map((img: string, idx: number) => (
                                            <div key={idx} className="relative group w-20 h-20">
                                                <img src={img} alt="" className="w-full h-full object-cover rounded border border-zinc-700" />
                                                <button
                                                    onClick={() => {
                                                        const newImages = section.data?.images?.filter((_: string, i: number) => i !== idx);
                                                        updateSectionData(index, 'images', newImages);
                                                    }}
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => openMediaPicker('masonry_gallery', index)}
                                            className="w-20 h-20 flex items-center justify-center border-2 border-dashed border-zinc-700 rounded text-zinc-500 hover:text-zinc-300"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* CLIENT STORY EDITOR */}
                            {section.type === 'client_story' && (
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="shrink-0">
                                            <label className="block text-xs text-zinc-400 mb-2">Zdjęcie Klienta</label>
                                            <div className="relative w-24 h-32 rounded border border-zinc-700 overflow-hidden bg-zinc-800">
                                                {section.data?.image ? (
                                                    <img src={section.data.image} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="m-auto mt-8 text-zinc-700" size={24} />
                                                )}
                                                <button onClick={() => openMediaPicker('section', index, 'image')} className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold uppercase">Zmień</button>
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs text-zinc-400 mb-1">Imię Klienta / Pary</label>
                                                    <input
                                                        type="text"
                                                        value={section.data?.tag || ''}
                                                        onChange={(e) => updateSectionData(index, 'tag', e.target.value)}
                                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-zinc-400 mb-1">Tytuł Historii</label>
                                                    <input
                                                        type="text"
                                                        value={section.data?.title || ''}
                                                        onChange={(e) => updateSectionData(index, 'title', e.target.value)}
                                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                                    />
                                                    {renderSeoAssistant(section.data?.title || '', 'heading', `${section.label} - Tytuł historii`, (next) => updateSectionData(index, 'title', next))}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs text-zinc-400 mb-1">Lokalizacja</label>
                                                    <input
                                                        type="text"
                                                        value={section.data?.subtitle || ''}
                                                        onChange={(e) => updateSectionData(index, 'subtitle', e.target.value)}
                                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                                    />
                                                    {renderSeoAssistant(section.data?.subtitle || '', 'body', `${section.label} - Lokalizacja`, (next) => updateSectionData(index, 'subtitle', next))}
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-zinc-400 mb-1">Tekst Przycisku</label>
                                                    <input
                                                        type="text"
                                                        value={section.data?.buttonText || ''}
                                                        onChange={(e) => updateSectionData(index, 'buttonText', e.target.value)}
                                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-zinc-400 mb-1">Testimonial (Treść)</label>
                                        <RichTextEditor
                                            value={section.data?.content || ''}
                                            onChange={(val) => updateSectionData(index, 'content', val)}
                                        />
                                        {renderSeoAssistant(section.data?.content || '', 'body', `${section.label} - Treść`, (next) => updateSectionData(index, 'content', next))}
                                    </div>
                                </div>
                            )}

                            {/* PROCESS TIMELINE EDITOR */}
                            {section.type === 'process_timeline' && (
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs text-zinc-400 mb-1">Tytuł Sekcji</label>
                                                    <input
                                                        type="text"
                                                        value={section.data?.title || ''}
                                                        onChange={(e) => updateSectionData(index, 'title', e.target.value)}
                                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                                    />
                                                    {renderSeoAssistant(section.data?.title || '', 'heading', `${section.label} - Tytuł`, (next) => updateSectionData(index, 'title', next))}
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-zinc-400 mb-1">Podtytuł</label>
                                                    <input
                                                        type="text"
                                                        value={section.data?.subtitle || ''}
                                                        onChange={(e) => updateSectionData(index, 'subtitle', e.target.value)}
                                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                                    />
                                                    {renderSeoAssistant(section.data?.subtitle || '', 'body', `${section.label} - Podtytuł`, (next) => updateSectionData(index, 'subtitle', next))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold text-zinc-500 uppercase">Kroki Procesu</h4>
                                            <button
                                                onClick={() => {
                                                    const newSteps = [...(section.data?.steps || [])];
                                                    newSteps.push({
                                                        id: Math.random().toString(36).substr(2, 9),
                                                        title: 'Nowy Krok',
                                                        description: 'Opis kroku...'
                                                    });
                                                    updateSectionData(index, 'steps', newSteps);
                                                }}
                                                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-2 py-1 rounded flex items-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" /> Dodaj Krok
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {(section.data?.steps || []).map((step: any, sIdx: number) => (
                                                <div key={sIdx} className="bg-zinc-900 border border-zinc-800 p-3 rounded">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-mono text-zinc-500">Krok {sIdx + 1}</span>
                                                        <button
                                                            onClick={() => {
                                                                const newSteps = section.data?.steps.filter((_: any, i: number) => i !== sIdx);
                                                                updateSectionData(index, 'steps', newSteps);
                                                            }}
                                                            className="text-red-400 hover:text-red-300"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        <input
                                                            type="text"
                                                            value={step.title || ''}
                                                            onChange={(e) => {
                                                                const newSteps = [...section.data.steps];
                                                                newSteps[sIdx].title = e.target.value;
                                                                updateSectionData(index, 'steps', newSteps);
                                                            }}
                                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                                                            placeholder="Tytuł kroku"
                                                        />
                                                        {renderSeoAssistant(step.title || '', 'heading', `${section.label} - Krok ${sIdx + 1}`, (next) => {
                                                            const newSteps = [...section.data.steps];
                                                            newSteps[sIdx].title = next;
                                                            updateSectionData(index, 'steps', newSteps);
                                                        })}
                                                        <textarea
                                                            value={step.description || ''}
                                                            onChange={(e) => {
                                                                const newSteps = [...section.data.steps];
                                                                newSteps[sIdx].description = e.target.value;
                                                                updateSectionData(index, 'steps', newSteps);
                                                            }}
                                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white h-20"
                                                            placeholder="Opis kroku"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* INVESTMENT TEASER EDITOR */}
                            {section.type === 'investment_teaser' && (
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="shrink-0">
                                            <label className="block text-xs text-zinc-400 mb-2">Zdjęcie Tła</label>
                                            <div className="relative w-24 h-32 rounded border border-zinc-700 overflow-hidden bg-zinc-800">
                                                {section.data?.image ? (
                                                    <img src={section.data.image} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="m-auto mt-8 text-zinc-700" size={24} />
                                                )}
                                                <button onClick={() => openMediaPicker('section', index, 'image')} className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold uppercase">Zmień</button>
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs text-zinc-400 mb-1">Tytuł</label>
                                                    <input
                                                        type="text"
                                                        value={section.data?.title || ''}
                                                        onChange={(e) => updateSectionData(index, 'title', e.target.value)}
                                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                                    />
                                                    {renderSeoAssistant(section.data?.title || '', 'heading', `${section.label} - Tytuł`, (next) => updateSectionData(index, 'title', next))}
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-zinc-400 mb-1">Cena (od)</label>
                                                    <input
                                                        type="text"
                                                        value={section.data?.price || ''}
                                                        onChange={(e) => updateSectionData(index, 'price', e.target.value)}
                                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-zinc-400 mb-1">Opis</label>
                                                <textarea
                                                    value={section.data?.description || ''}
                                                    onChange={(e) => updateSectionData(index, 'description', e.target.value)}
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white h-20"
                                                />
                                                {renderSeoAssistant(section.data?.description || '', 'body', `${section.label} - Opis`, (next) => updateSectionData(index, 'description', next))}
                                            </div>
                                            <div>
                                                <label className="block text-xs text-zinc-400 mb-1">Tekst Przycisku</label>
                                                <input
                                                    type="text"
                                                    value={section.data.buttonText || ''}
                                                    onChange={(e) => updateSectionData(index, 'buttonText', e.target.value)}
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-zinc-400 mb-1">Link Przycisku</label>
                                                <input
                                                    type="text"
                                                    value={section.data?.buttonLink || ''}
                                                    onChange={(e) => updateSectionData(index, 'buttonLink', e.target.value)}
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                                    placeholder="/kontakt"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold text-zinc-500 uppercase">Cechy Oferty</h4>
                                            <button
                                                onClick={() => {
                                                    const newFeatures = [...(section.data.features || [])];
                                                    newFeatures.push('Nowa Cecha');
                                                    updateSectionData(index, 'features', newFeatures);
                                                }}
                                                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-2 py-1 rounded flex items-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" /> Dodaj Cechę
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {(section.data.features || []).map((feature: string, fIdx: number) => (
                                                <div key={fIdx} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={feature}
                                                        onChange={(e) => {
                                                            const newFeatures = [...section.data.features];
                                                            newFeatures[fIdx] = e.target.value;
                                                            updateSectionData(index, 'features', newFeatures);
                                                        }}
                                                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const newFeatures = section.data.features.filter((_: string, i: number) => i !== fIdx);
                                                            updateSectionData(index, 'features', newFeatures);
                                                        }}
                                                        className="text-red-400 hover:text-red-300 px-2"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* NARRATIVE TEXT EDITOR */}
                            {section.type === 'narrative_text' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs text-zinc-400 mb-1">Tytuł Sekcji (Opcjonalnie)</label>
                                        <input
                                            type="text"
                                            value={section.data?.title || ''}
                                            onChange={(e) => updateSectionData(index, 'title', e.target.value)}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white mb-2"
                                        />
                                        {renderSeoAssistant(section.data?.title || '', 'heading', `${section.label} - Tytuł`, (next) => updateSectionData(index, 'title', next))}
                                    </div>
                                    <div>
                                        <label className="block text-xs text-zinc-400 mb-1">Dłuższy Tekst z Formatowaniem</label>
                                        <RichTextEditor
                                            value={section.data?.content || ''}
                                            onChange={(val) => updateSectionData(index, 'content', val)}
                                        />
                                        {renderSeoAssistant(section.data?.content || '', 'body', `${section.label} - Treść`, (next) => updateSectionData(index, 'content', next))}
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-xs text-zinc-400 mb-1">Kolor Tła</label>
                                            <select
                                                value={section.data?.bgColor || 'black'}
                                                onChange={(e) => updateSectionData(index, 'bgColor', e.target.value)}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                            >
                                                <option value="black">Czarny</option>
                                                <option value="zinc-900">Ciemny Szary</option>
                                                <option value="white">Biały</option>
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs text-zinc-400 mb-1">Wyrównanie Tekstu</label>
                                            <select
                                                value={section.data?.alignment || 'left'}
                                                onChange={(e) => updateSectionData(index, 'alignment', e.target.value)}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                                            >
                                                <option value="left">Do Lewej</option>
                                                <option value="center">Wyśrodkowane</option>
                                                <option value="right">Do Prawej</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* FEATURED CAROUSEL EDITOR */}
                            {section.type === 'featured_carousel' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-zinc-500 uppercase">Slajdy Promowane</h4>
                                        <button
                                            onClick={() => {
                                                const newItems = [...(section.data?.items || [])];
                                                newItems.push({
                                                    image: '',
                                                    title: 'Nowy Slajd',
                                                    subtitle: 'Opis',
                                                    link: '#'
                                                });
                                                updateSectionData(index, 'items', newItems);
                                            }}
                                            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-2 py-1 rounded flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> Dodaj Slajd
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {(section.data?.items || []).map((item: any, i: number) => (
                                            <div key={i} className="bg-zinc-900 border border-zinc-800 p-3 rounded flex gap-4">
                                                <div className="shrink-0 w-20 h-20 bg-zinc-800 rounded overflow-hidden relative group">
                                                    {item.image ? (
                                                        <img src={item.image} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="text-zinc-600 m-auto mt-6" />
                                                    )}
                                                    <button
                                                        onClick={() => openMediaPicker('featured_carousel_slide', index, 'image', i)}
                                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] uppercase font-bold"
                                                    >
                                                        Zmień
                                                    </button>
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input
                                                            type="text"
                                                            value={item.title || ''}
                                                            onChange={(e) => {
                                                                const newItems = [...(section.data?.items || [])];
                                                                newItems[i].title = e.target.value;
                                                                updateSectionData(index, 'items', newItems);
                                                            }}
                                                            placeholder="Tytuł"
                                                            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white"
                                                        />
                                                        {renderSeoAssistant(item.title || '', 'heading', `${section.label} - Slajd ${i + 1} tytuł`, (next) => {
                                                            const newItems = [...(section.data?.items || [])];
                                                            newItems[i].title = next;
                                                            updateSectionData(index, 'items', newItems);
                                                        })}
                                                        <input
                                                            type="text"
                                                            value={item.subtitle || ''}
                                                            onChange={(e) => {
                                                                const newItems = [...(section.data?.items || [])];
                                                                newItems[i].subtitle = e.target.value;
                                                                updateSectionData(index, 'items', newItems);
                                                            }}
                                                            placeholder="Podtytuł"
                                                            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={item.link || ''}
                                                            onChange={(e) => {
                                                                const newItems = [...section.data.items];
                                                                newItems[i].link = e.target.value;
                                                                updateSectionData(index, 'items', newItems);
                                                            }}
                                                            placeholder="Link"
                                                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                const newItems = section.data.items.filter((_: any, idx: number) => idx !== i);
                                                                updateSectionData(index, 'items', newItems);
                                                            }}
                                                            className="text-red-400 hover:text-red-300 px-2"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* PHOTO CUBE 3D EDITOR */}
                            {section.type === 'photo_cube_3d' && (
                                <div className="space-y-5">
                                    <div className="bg-yellow-950/30 p-3 rounded border border-yellow-800 mb-2">
                                        <p className="text-xs text-zinc-400">🎲 <strong className="text-yellow-400">Kostka 3D:</strong> Interaktywna, obracana kostka ze zdjęciami na 6 ściankach. Przeciągaj myszką aby obracać. Pełna konfiguracja fizyki, animacji i wyglądu.</p>
                                    </div>

                                    {/* === TYTUŁ & PODTYTUŁ === */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-zinc-400 mb-1">Tytuł sekcji (opcjonalnie)</label>
                                            <input type="text" value={section.data?.title || ''} onChange={e => updateSectionData(index, 'title', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm" placeholder="np. Moje Portfolio 3D" />
                                            {renderSeoAssistant(section.data?.title || '', 'heading', `${section.label} - Tytuł`, (next) => updateSectionData(index, 'title', next))}
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-400 mb-1">Podtytuł (opcjonalnie)</label>
                                            <input type="text" value={section.data?.subtitle || ''} onChange={e => updateSectionData(index, 'subtitle', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm" placeholder="np. Najlepsze kadry z sesji" />
                                            {renderSeoAssistant(section.data?.subtitle || '', 'body', `${section.label} - Podtytuł`, (next) => updateSectionData(index, 'subtitle', next))}
                                        </div>
                                    </div>

                                    {/* === ZDJĘCIA NA ŚCIANKACH === */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Zdjęcia na ściankach ({(section.data?.images || []).filter(Boolean).length}/6)</label>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['Przód', 'Tył', 'Prawo', 'Lewo', 'Góra', 'Dół'].map((face, fIdx) => {
                                                const img = (section.data?.images || [])[fIdx];
                                                return (
                                                    <div key={fIdx} className="relative group">
                                                        <div className="text-[10px] text-zinc-500 mb-1 font-bold uppercase tracking-wider">{face}</div>
                                                        <div
                                                            className="aspect-square rounded-lg border-2 border-dashed border-zinc-700 hover:border-yellow-500/50 cursor-pointer flex items-center justify-center overflow-hidden bg-zinc-800/50 transition-colors"
                                                            onClick={() => openMediaPicker('cube_face', index, undefined, fIdx)}
                                                        >
                                                            {img ? (
                                                                <img src={img} alt={face} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-zinc-600 text-xs">+ Dodaj</span>
                                                            )}
                                                        </div>
                                                        {img && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); const images = [...(section.data?.images || [])]; images[fIdx] = ''; updateSectionData(index, 'images', images); }}
                                                                className="absolute top-5 right-1 w-5 h-5 bg-red-600 rounded-full text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >✕</button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <details className="mt-2">
                                            <summary className="text-[10px] text-zinc-500 cursor-pointer hover:text-zinc-400">Lub wklej URL-e ręcznie...</summary>
                                            <textarea
                                                value={(section.data?.images || []).join('\n')}
                                                onChange={e => updateSectionData(index, 'images', e.target.value.split('\n').filter((u: string) => u.trim()))}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white h-24 font-mono text-xs mt-1"
                                                placeholder={"/uploads/photo1.jpg\n/uploads/photo2.jpg\n(do 6 URL-i)"}
                                            />
                                        </details>
                                    </div>

                                    {/* === ROZMIAR & STYL === */}
                                    <div>
                                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Rozmiar & Styl</div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-[10px] text-zinc-500 mb-1">Rozmiar kostki (px)</label>
                                                <input type="number" min="150" max="600" step="10" value={section.data?.cube_size || 320} onChange={e => updateSectionData(index, 'cube_size', parseInt(e.target.value))} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-zinc-500 mb-1">Kolor krawędzi</label>
                                                <div className="flex gap-2 items-center">
                                                    <input type="color" value={section.data?.edge_color || '#c8a960'} onChange={e => updateSectionData(index, 'edge_color', e.target.value)} className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded cursor-pointer shrink-0" />
                                                    <input type="text" value={section.data?.edge_color || '#c8a960'} onChange={e => updateSectionData(index, 'edge_color', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-2 text-xs text-zinc-400 font-mono" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-zinc-500 mb-1">Grubość krawędzi (px)</label>
                                                <input type="number" step="0.5" min="0" max="5" value={section.data?.edge_width ?? 1.5} onChange={e => updateSectionData(index, 'edge_width', parseFloat(e.target.value))} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 mt-3">
                                            <div>
                                                <label className="block text-[10px] text-zinc-500 mb-1">Kolor tła sekcji</label>
                                                <div className="flex gap-2 items-center">
                                                    <input type="color" value={section.data?.background_color || '#000000'} onChange={e => updateSectionData(index, 'background_color', e.target.value)} className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded cursor-pointer shrink-0" />
                                                    <input type="text" value={section.data?.background_color || '#000000'} onChange={e => updateSectionData(index, 'background_color', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-2 text-xs text-zinc-400 font-mono" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-zinc-500 mb-1">Dopasowanie zdjęć</label>
                                                <select value={section.data?.image_fit || 'cover'} onChange={e => updateSectionData(index, 'image_fit', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm">
                                                    <option value="cover">Cover (wypełnia)</option>
                                                    <option value="contain">Contain (mieści całe)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-zinc-500 mb-1">Kierunek wjazdu</label>
                                                <select value={section.data?.entry_direction || 'left'} onChange={e => updateSectionData(index, 'entry_direction', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm">
                                                    <option value="left">Z lewej </option>
                                                    <option value="right">Z prawej </option>
                                                    <option value="top">Z góry</option>
                                                    <option value="bottom">Z dołu</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* === FIZYKA & ANIMACJA === */}
                                    <div>
                                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Fizyka & Animacja</div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] text-zinc-500 mb-1">Czułość obracania <span className="text-zinc-600">(0.1 = wolno, 2.0 = szybko)</span></label>
                                                <input type="range" min="0.1" max="2" step="0.1" value={section.data?.rotation_speed ?? 0.5} onChange={e => updateSectionData(index, 'rotation_speed', parseFloat(e.target.value))} className="w-full accent-yellow-500" />
                                                <div className="flex justify-between text-[10px] text-zinc-600"><span>Precyzja</span><span className="text-yellow-500 font-bold">{section.data?.rotation_speed ?? 0.5}</span><span>Szybkość</span></div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-zinc-500 mb-1">Bezwładność <span className="text-zinc-600">(0.85 = mało, 0.99 = dużo)</span></label>
                                                <input type="range" min="0.85" max="0.99" step="0.01" value={section.data?.smoothness ?? 0.96} onChange={e => updateSectionData(index, 'smoothness', parseFloat(e.target.value))} className="w-full accent-yellow-500" />
                                                <div className="flex justify-between text-[10px] text-zinc-600"><span>Zatrzymuje szybko</span><span className="text-yellow-500 font-bold">{section.data?.smoothness ?? 0.96}</span><span>Ślizga się</span></div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-3">
                                            <div>
                                                <label className="block text-[10px] text-zinc-500 mb-1">Czas animacji wjazdu (ms)</label>
                                                <input type="number" step="100" min="500" max="5000" value={section.data?.entry_speed ?? 1800} onChange={e => updateSectionData(index, 'entry_speed', parseInt(e.target.value))} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm" />
                                            </div>
                                            <div className="flex flex-col justify-end">
                                                <div className="flex items-center gap-3 bg-zinc-800/50 rounded-lg px-3 py-2 border border-zinc-700">
                                                    <input type="checkbox" checked={section.data?.auto_rotate ?? true} onChange={e => updateSectionData(index, 'auto_rotate', e.target.checked)} className="w-4 h-4 accent-yellow-500" />
                                                    <label className="text-xs text-zinc-400">Auto-rotacja <span className="text-zinc-600">(gdy nie dotykasz)</span></label>
                                                </div>
                                            </div>
                                        </div>
                                        {(section.data?.auto_rotate ?? true) && (
                                            <div className="mt-3">
                                                <label className="block text-[10px] text-zinc-500 mb-1">Prędkość auto-rotacji <span className="text-zinc-600">(°/klatka)</span></label>
                                                <input type="range" min="0.02" max="0.5" step="0.01" value={section.data?.auto_rotate_speed ?? 0.15} onChange={e => updateSectionData(index, 'auto_rotate_speed', parseFloat(e.target.value))} className="w-full accent-yellow-500" />
                                                <div className="flex justify-between text-[10px] text-zinc-600"><span>Subtelnie</span><span className="text-yellow-500 font-bold">{section.data?.auto_rotate_speed ?? 0.15}°</span><span>Dynamicznie</span></div>
                                            </div>
                                        )}
                                    </div>
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
