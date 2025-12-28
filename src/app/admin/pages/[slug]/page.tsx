'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api-config';
import { Save, ArrowLeft, Plus, Trash2, Image as ImageIcon, Eye, EyeOff, MoveUp, MoveDown, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import MediaPicker from '@/components/admin/MediaPicker';
import RichTextEditor from '@/components/admin/RichTextEditor';
import PageBuilder, { PageSection } from '@/components/admin/PageBuilder';

interface ColorPalette {
    id: string;
    title: string;
    description: string;
    colors: Array<{ hex: string; name: string }>;
    tips: string;
}

interface ParallaxSection {
    id: string;
    image: string;
    title: string;
    subtitle: string;
    enabled: boolean;
}

interface ContentCard {
    id: string;
    title: string;
    description: string;
    icon: string;
    enabled: boolean;
}

const AVAILABLE_ICONS = [
    { value: 'city', label: '🏙️ Miasto', emoji: '🏙️' },
    { value: 'nature', label: '🌳 Natura', emoji: '🌳' },
    { value: 'indoor', label: '🏛️ Wnętrze', emoji: '🏛️' },
    { value: 'sun', label: '☀️ Słońce', emoji: '☀️' },
    { value: 'moon', label: '🌙 Księżyc', emoji: '🌙' },
];

export default function EditPage({ params }: { params: Promise<{ slug: string }> }) {
    const [resolvedParams, setResolvedParams] = useState<{ slug: string } | null>(null);
    const router = useRouter();
    const [formData, setFormData] = useState({
        id: undefined as number | undefined,
        slug: '',
        title: '',
        page_type: 'regular',
        content: '',
        hero_image: '',
        hero_subtitle: '',
        is_published: true,
        is_in_menu: false,
        menu_title: '',
        menu_order: 0,
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
    });

    // Dynamic Page Builder State
    const [sections, setSections] = useState<PageSection[]>([]);

    // Legacy Features State
    const [colorPalettes, setColorPalettes] = useState<ColorPalette[]>([]);
    const [parallaxSections, setParallaxSections] = useState<ParallaxSection[]>([]);
    const [contentCards, setContentCards] = useState<ContentCard[]>([]);
    const [aboutPhoto, setAboutPhoto] = useState('');
    const [aboutTextSide, setAboutTextSide] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
    const [currentPickerTarget, setCurrentPickerTarget] = useState<string | null>(null);

    // Portfolio Slider State
    const [portfolioHeroSlides, setPortfolioHeroSlides] = useState<{ id: number; url: string }[]>([]);
    const [showPortfolioHeroPicker, setShowPortfolioHeroPicker] = useState(false);

    useEffect(() => {
        params.then(p => {
            setResolvedParams(p);
            setFormData(prev => ({ ...prev, slug: p.slug }));
        });
    }, [params]);

    useEffect(() => {
        if (!resolvedParams) return;

        const fetchPage = async () => {
            try {
                const res = await fetch(`${getApiUrl('pages')}?slug=${resolvedParams.slug}`);
                const data = await res.json();
                if (data.success) {
                    const page = data.page;
                    setFormData({
                        id: page.id,
                        slug: page.slug,
                        title: page.title,
                        page_type: page.page_type || 'regular',
                        content: page.content || '',
                        hero_image: page.hero_image || '',
                        hero_subtitle: page.hero_subtitle || '',
                        is_published: page.is_published,
                        is_in_menu: page.is_in_menu || false,
                        menu_title: page.menu_title || '',
                        menu_order: page.menu_order || 0,
                        meta_title: page.meta_title || '',
                        meta_description: page.meta_description || '',
                        meta_keywords: page.meta_keywords || '',
                    });

                    // Load Page Builder Sections
                    if (page.sections) {
                        try {
                            setSections(JSON.parse(page.sections));
                        } catch (e) {
                            console.error('Failed to parse sections', e);
                        }
                    }

                    // Load Legacy Features
                    if (page.content_images) {
                        try { setColorPalettes(JSON.parse(page.content_images)); } catch { }
                    }
                    if (page.parallax_sections) {
                        try { setParallaxSections(JSON.parse(page.parallax_sections)); } catch { }
                    }
                    if (page.content_cards) {
                        try { setContentCards(JSON.parse(page.content_cards)); } catch { }
                    }
                    if (page.about_photo) setAboutPhoto(page.about_photo);
                    if (page.about_photo) setAboutPhoto(page.about_photo);
                    if (page.about_text_side) setAboutTextSide(page.about_text_side);

                    // Load Portfolio Hero Slides
                    if (page.slug === 'portfolio' && page.content_images) {
                        try {
                            const parsed = JSON.parse(page.content_images);
                            if (Array.isArray(parsed)) setPortfolioHeroSlides(parsed);
                        } catch (e) { console.error('Failed to parse portfolio slides', e); }
                    }
                }
            } catch (error) {
                toast.error('Błąd pobierania strony');
            } finally {
                setLoading(false);
            }
        };
        fetchPage();
    }, [resolvedParams]);

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('admin_token');
            const dataToSave: any = {
                ...formData,
                sections: JSON.stringify(sections)
            };

            // Legacy support
            if (resolvedParams?.slug === 'jak-sie-ubrac' || resolvedParams?.slug === 'strona-glowna') {
                dataToSave.content_images = JSON.stringify(colorPalettes);
                dataToSave.parallax_sections = JSON.stringify(parallaxSections);
                dataToSave.content_cards = JSON.stringify(contentCards);
            }

            if (resolvedParams?.slug === 'o-mnie' || resolvedParams?.slug === 'strona-glowna') {
                dataToSave.parallax_sections = JSON.stringify(parallaxSections);
                dataToSave.about_photo = aboutPhoto;
                dataToSave.about_text_side = aboutTextSide;
                if (resolvedParams?.slug === 'o-mnie') {
                    dataToSave.content_cards = JSON.stringify(contentCards);
                }
            }

            // Portfolio Custom Slides
            if (resolvedParams?.slug === 'portfolio') {
                dataToSave.content_images = JSON.stringify(portfolioHeroSlides);
            }

            const res = await fetch(getApiUrl('pages'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataToSave),
            });

            if (res.ok) {
                toast.success('Zapisano zmiany');
            } else if (res.status === 401) {
                toast.error('Sesja wygasła. Zaloguj się ponownie.');
                // Optional: router.push('/admin/login');
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            toast.error('Błąd zapisu');
        } finally {
            setSaving(false);
        }
    };

    const openMediaPicker = (target: string) => {
        setCurrentPickerTarget(target);
        setMediaPickerOpen(true);
    };

    const handleMediaSelect = (url: string | string[], id?: number | number[]) => {
        const filePath = Array.isArray(url) ? url[0] : url;

        if (currentPickerTarget?.startsWith('parallax-')) {
            const index = parseInt(currentPickerTarget.split('-')[1]);
            const updated = [...parallaxSections];
            updated[index].image = filePath;
            setParallaxSections(updated);
        } else if (currentPickerTarget === 'about-photo') {
            setAboutPhoto(filePath);
        } else if (currentPickerTarget === 'hero') {
            setFormData({ ...formData, hero_image: filePath });
        }

        setMediaPickerOpen(false);
        setCurrentPickerTarget(null);
        setCurrentPickerTarget(null);
    };

    // Portfolio Hero Functions
    const handlePortfolioHeroSelect = (url: string | string[], id?: number | number[]) => {
        const urls = Array.isArray(url) ? url : [url];
        const ids = Array.isArray(id) ? id : (id ? [id] : []);

        const newSlides = urls.map((u, i) => ({
            id: ids[i] || Date.now() + i,
            url: u
        }));

        setPortfolioHeroSlides(prev => [...prev, ...newSlides]);
    };

    const removePortfolioSlide = (index: number) => {
        setPortfolioHeroSlides(prev => prev.filter((_, i) => i !== index));
    };

    // Helper for reordering
    const moveItem = <T,>(items: T[], index: number, direction: 'up' | 'down', setter: (items: T[]) => void) => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === items.length - 1) return;

        const newItems = [...items];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
        setter(newItems);
    };

    // Legacy Parallax functions
    const addParallax = () => {
        setParallaxSections([...parallaxSections, {
            id: `parallax-${Date.now()}`,
            image: '',
            title: 'Nowy parallax',
            subtitle: '',
            enabled: true
        }]);
    };

    const removeParallax = (index: number) => {
        setParallaxSections(parallaxSections.filter((_, i) => i !== index));
    };

    const updateParallax = (index: number, field: string, value: any) => {
        const updated = [...parallaxSections];
        updated[index] = { ...updated[index], [field]: value };
        setParallaxSections(updated);
    };

    // Content card functions
    const addCard = () => {
        setContentCards([...contentCards, {
            id: `card-${Date.now()}`,
            title: 'Nowa kafelka',
            description: '',
            icon: 'city',
            enabled: true
        }]);
    };

    const removeCard = (index: number) => {
        setContentCards(contentCards.filter((_, i) => i !== index));
    };

    const updateCard = (index: number, field: string, value: any) => {
        const updated = [...contentCards];
        updated[index] = { ...updated[index], [field]: value };
        setContentCards(updated);
    };

    // Color palette functions
    const addPalette = () => {
        setColorPalettes([...colorPalettes, {
            id: `palette-${Date.now()}`,
            title: 'Nowa paleta',
            description: '',
            colors: [{ hex: '#E8D5B7', name: 'Kolor 1' }],
            tips: ''
        }]);
    };

    const removePalette = (index: number) => {
        setColorPalettes(colorPalettes.filter((_, i) => i !== index));
    };

    const updatePalette = (index: number, field: string, value: any) => {
        const updated = [...colorPalettes];
        updated[index] = { ...updated[index], [field]: value };
        setColorPalettes(updated);
    };

    const updateColor = (paletteIndex: number, colorIndex: number, field: 'hex' | 'name', value: string) => {
        const updated = [...colorPalettes];
        updated[paletteIndex].colors[colorIndex][field] = value;
        setColorPalettes(updated);
    };

    const addColor = (paletteIndex: number) => {
        const updated = [...colorPalettes];
        updated[paletteIndex].colors.push({ hex: '#FFFFFF', name: 'Nowy kolor' });
        setColorPalettes(updated);
    };

    if (loading) return <div className="text-zinc-400">Ładowanie...</div>;

    const isJakSieUbrac = resolvedParams?.slug === 'jak-sie-ubrac';
    const isOMnie = resolvedParams?.slug === 'o-mnie';
    const isHomePage = resolvedParams?.slug === 'strona-glowna';
    const isPortfolio = resolvedParams?.slug === 'portfolio';

    return (
        <div className="max-w-6xl">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/pages" className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <h1 className="text-2xl font-semibold text-white">Edycja: {formData.title}</h1>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black rounded-md font-medium disabled:opacity-50"
                >
                    <Save className="w-4 h-4 inline mr-2" />
                    {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
                </button>
            </div>

            <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-white">Podstawowe informacje</h2>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Tytuł</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Slug (URL)</label>
                        <input
                            type="text"
                            value={formData.slug}
                            disabled
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-500 cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* Portfolio Specific Settings */}
                {isPortfolio && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4 border-l-4 border-l-gold-500">
                        <h2 className="text-lg font-semibold text-white">Ustawienia Portfolio</h2>
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="use_home_hero"
                                checked={formData.hero_subtitle === '1'}
                                onChange={e => setFormData({ ...formData, hero_subtitle: e.target.checked ? '1' : '0' })}
                                className="mt-1 w-5 h-5 rounded border-zinc-700 bg-zinc-950 text-gold-500 focus:ring-gold-500"
                            />
                            <div>
                                <label htmlFor="use_home_hero" className="text-sm font-medium text-white cursor-pointer select-none block">
                                    Pokaż Hero Slider ze Strony Głównej (gdy brak własnych)
                                </label>
                                <p className="text-xs text-zinc-400 mt-1">
                                    Jeśli zaznaczone, a <b>nie dodasz żadnych własnych zdjęć poniżej</b>, wyświetli się slider ze strony głównej.
                                    Własne zdjęcia w sekcji poniżej zawsze mają priorytet.
                                </p>
                            </div>
                        </div>

                        {/* Custom Portfolio Slider Images - Always visible */}
                        <div className="mt-6 pt-6 border-t border-zinc-800 animate-in fade-in slide-in-from-top-4">
                            <label className="block text-sm font-medium text-white mb-3">
                                Własne zdjęcia w nagłówku Portfolio (Priorytet)
                            </label>
                            <p className="text-xs text-zinc-400 mb-4">
                                Dodaj zdjęcia, aby stworzyć unikalny slider dla tej strony. Te zdjęcia <b>zastąpią</b> slider ze strony głównej.
                                Zostaw puste, aby użyć slidera głównego (jeśli zaznaczono powyżej) lub minimalistycznego nagłówka.
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {portfolioHeroSlides.map((slide, index) => (
                                    <div key={index} className="group relative aspect-video rounded-md overflow-hidden border border-zinc-700 bg-zinc-800">
                                        <img src={slide.url} alt="" className="h-full w-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => removePortfolioSlide(index)}
                                                className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setShowPortfolioHeroPicker(true)}
                                    className="aspect-video flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-md hover:border-gold-500 hover:text-gold-500 text-zinc-400 transition-colors bg-zinc-900/50"
                                >
                                    <ImageIcon className="h-8 w-8 mb-2" />
                                    <span className="text-xs font-medium uppercase tracking-wider">Dodaj zdjęcie</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <MediaPicker
                    isOpen={showPortfolioHeroPicker}
                    onClose={() => setShowPortfolioHeroPicker(false)}
                    onSelect={handlePortfolioHeroSelect}
                    multiple={true}
                />

                {/* SEO Settings */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-white">SEO</h2>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Meta Title</label>
                        <input
                            type="text"
                            value={formData.meta_title}
                            onChange={e => setFormData({ ...formData, meta_title: e.target.value })}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                            placeholder="Tytuł w wynikach wyszukiwania"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Meta Description</label>
                        <textarea
                            rows={3}
                            value={formData.meta_description}
                            onChange={e => setFormData({ ...formData, meta_description: e.target.value })}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                            placeholder="Opis w wynikach wyszukiwania"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Słowa kluczowe</label>
                        <input
                            type="text"
                            value={formData.meta_keywords}
                            onChange={e => setFormData({ ...formData, meta_keywords: e.target.value })}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                            placeholder="fotograf toruń, sesja ślubna, ..."
                        />
                    </div>
                </div>

                {/* Menu Settings */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-white">Menu nawigacji</h2>

                    <div className="flex items-center gap-3 py-2">
                        <input
                            type="checkbox"
                            id="is_in_menu_edit"
                            checked={formData.is_in_menu}
                            onChange={e => setFormData({ ...formData, is_in_menu: e.target.checked })}
                            className="w-5 h-5 rounded border-zinc-700 bg-zinc-950 text-gold-500 focus:ring-gold-500"
                        />
                        <label htmlFor="is_in_menu_edit" className="text-sm text-white cursor-pointer">
                            📋 Wyświetl w menu głównym
                        </label>
                    </div>

                    {formData.is_in_menu && (
                        <div className="grid md:grid-cols-2 gap-4 pl-8 border-l-2 border-gold-500/30">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">
                                    Tytuł w menu
                                    <span className="text-xs text-zinc-500 ml-2">(opcjonalnie)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.menu_title}
                                    onChange={e => setFormData({ ...formData, menu_title: e.target.value })}
                                    placeholder={formData.title}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder:text-zinc-500"
                                />
                                <p className="text-xs text-zinc-500 mt-1">Jeśli puste, użyty zostanie tytuł strony</p>
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">
                                    Kolejność w menu
                                </label>
                                <input
                                    type="number"
                                    value={formData.menu_order}
                                    onChange={e => setFormData({ ...formData, menu_order: parseInt(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                                    min="0"
                                />
                                <p className="text-xs text-zinc-500 mt-1">Niższe liczby → wcześniej w menu</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* PAGE BUILDER - Available for ALL pages */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-white">Kreator Strony (Page Builder)</h2>
                    <p className="text-sm text-zinc-400 mb-4">
                        Dodawaj i układaj sekcje, aby zbudować unikalny wygląd strony.
                    </p>
                    <PageBuilder sections={sections} onChange={setSections} />
                </div>

                {/* LEGACY CONTENT - Only for specific pages */}

                {/* Parallax Sections */}
                {(isJakSieUbrac || isOMnie || isHomePage) && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">Sekcje Parallax (Legacy)</h2>
                            <button
                                onClick={addParallax}
                                className="px-3 py-2 bg-gold-500 hover:bg-gold-400 text-black rounded text-sm font-medium"
                            >
                                <Plus className="w-4 h-4 inline mr-1" />
                                Dodaj parallax
                            </button>
                        </div>

                        {parallaxSections.map((parallax, index) => (
                            <div key={parallax.id} className="border border-zinc-700 rounded p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gold-400">Parallax #{index + 1}</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => moveItem(parallaxSections, index, 'up', setParallaxSections)}
                                            disabled={index === 0}
                                            className="p-1 text-zinc-400 hover:text-white disabled:opacity-30"
                                        >
                                            <MoveUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => moveItem(parallaxSections, index, 'down', setParallaxSections)}
                                            disabled={index === parallaxSections.length - 1}
                                            className="p-1 text-zinc-400 hover:text-white disabled:opacity-30"
                                        >
                                            <MoveDown className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => updateParallax(index, 'enabled', !parallax.enabled)}
                                            className={`p-1 rounded ${parallax.enabled ? 'text-green-400' : 'text-zinc-500'}`}
                                        >
                                            {parallax.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => removeParallax(index)}
                                            className="p-1 text-red-400 hover:text-red-300"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Zdjęcie</label>
                                    <div className="flex gap-2">
                                        {parallax.image && (
                                            <img src={parallax.image} alt="" className="w-20 h-20 object-cover rounded" />
                                        )}
                                        <button
                                            onClick={() => openMediaPicker(`parallax-${index}`)}
                                            className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white hover:bg-zinc-700"
                                        >
                                            <ImageIcon className="w-4 h-4 inline mr-1" />
                                            {parallax.image ? 'Zmień' : 'Wybierz'}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-zinc-400 mb-1">Tytuł</label>
                                        <input
                                            type="text"
                                            value={parallax.title}
                                            onChange={e => updateParallax(index, 'title', e.target.value)}
                                            className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-zinc-400 mb-1">Podtytuł</label>
                                        <input
                                            type="text"
                                            value={parallax.subtitle}
                                            onChange={e => updateParallax(index, 'subtitle', e.target.value)}
                                            className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Content Cards - tylko dla "jak-sie-ubrac", "strona-glowna" i "o-mnie" */}
                {(isJakSieUbrac || isHomePage || isOMnie) && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">Kafelki z treścią (Legacy)</h2>
                            <button
                                onClick={addCard}
                                className="px-3 py-2 bg-gold-500 hover:bg-gold-400 text-black rounded text-sm font-medium"
                            >
                                <Plus className="w-4 h-4 inline mr-1" />
                                Dodaj kafelkę
                            </button>
                        </div>

                        {contentCards.map((card, index) => (
                            <div key={card.id} className="border border-zinc-700 rounded p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gold-400">Kafelka #{index + 1}</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => moveItem(contentCards, index, 'up', setContentCards)}
                                            disabled={index === 0}
                                            className="p-1 text-zinc-400 hover:text-white disabled:opacity-30"
                                        >
                                            <MoveUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => moveItem(contentCards, index, 'down', setContentCards)}
                                            disabled={index === contentCards.length - 1}
                                            className="p-1 text-zinc-400 hover:text-white disabled:opacity-30"
                                        >
                                            <MoveDown className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => updateCard(index, 'enabled', !card.enabled)}
                                            className={`p-1 rounded ${card.enabled ? 'text-green-400' : 'text-zinc-500'}`}
                                        >
                                            {card.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => removeCard(index)}
                                            className="p-1 text-red-400 hover:text-red-300"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-zinc-400 mb-1">Tytuł</label>
                                        <input
                                            type="text"
                                            value={card.title}
                                            onChange={e => updateCard(index, 'title', e.target.value)}
                                            className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-zinc-400 mb-1">Ikonka</label>
                                        <select
                                            value={card.icon}
                                            onChange={e => updateCard(index, 'icon', e.target.value)}
                                            className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                                        >
                                            {AVAILABLE_ICONS.map(icon => (
                                                <option key={icon.value} value={icon.value}>{icon.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Opis</label>
                                    <textarea
                                        rows={2}
                                        value={card.description}
                                        onChange={e => updateCard(index, 'description', e.target.value)}
                                        className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Main Content - Legacy */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-white">Główna treść (Legacy)</h2>
                    <RichTextEditor
                        value={formData.content}
                        onChange={(value) => setFormData({ ...formData, content: value })}
                        placeholder="Wpisz treść strony..."
                    />

                    <div className="flex items-center">
                        <input
                            id="published"
                            type="checkbox"
                            checked={formData.is_published}
                            onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                            className="w-4 h-4 rounded"
                        />
                        <label htmlFor="published" className="ml-2 text-sm text-zinc-300">Opublikowana</label>
                    </div>
                </div>

                {/* Color Palettes - tylko dla "jak-sie-ubrac" i "strona-glowna" */}
                {(isJakSieUbrac || isHomePage) && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">Palety kolorów (Legacy)</h2>
                            <button
                                onClick={addPalette}
                                className="px-3 py-2 bg-gold-500 hover:bg-gold-400 text-black rounded text-sm font-medium"
                            >
                                <Plus className="w-4 h-4 inline mr-1" />
                                Dodaj paletę
                            </button>
                        </div>

                        {colorPalettes.map((palette, pIndex) => (
                            <div key={palette.id} className="border border-zinc-700 rounded p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gold-400">Paleta #{pIndex + 1}</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => moveItem(colorPalettes, pIndex, 'up', setColorPalettes)}
                                            disabled={pIndex === 0}
                                            className="p-1 text-zinc-400 hover:text-white disabled:opacity-30"
                                        >
                                            <MoveUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => moveItem(colorPalettes, pIndex, 'down', setColorPalettes)}
                                            disabled={pIndex === colorPalettes.length - 1}
                                            className="p-1 text-zinc-400 hover:text-white disabled:opacity-30"
                                        >
                                            <MoveDown className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => removePalette(pIndex)}
                                            className="p-1 text-red-400 hover:text-red-300"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-zinc-400 mb-1">Tytuł</label>
                                        <input
                                            type="text"
                                            value={palette.title}
                                            onChange={e => updatePalette(pIndex, 'title', e.target.value)}
                                            className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-zinc-400 mb-1">Opis</label>
                                        <input
                                            type="text"
                                            value={palette.description}
                                            onChange={e => updatePalette(pIndex, 'description', e.target.value)}
                                            className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs text-zinc-400">Kolory</label>
                                        <button
                                            onClick={() => addColor(pIndex)}
                                            className="text-xs text-gold-400 hover:text-gold-300"
                                        >
                                            + Dodaj kolor
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {palette.colors.map((color, cIndex) => (
                                            <div key={cIndex} className="flex gap-2 items-center">
                                                <input
                                                    type="color"
                                                    value={color.hex}
                                                    onChange={e => updateColor(pIndex, cIndex, 'hex', e.target.value)}
                                                    className="w-12 h-8 rounded border border-zinc-700 cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={color.name}
                                                    onChange={e => updateColor(pIndex, cIndex, 'name', e.target.value)}
                                                    placeholder="Nazwa"
                                                    className="flex-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Wskazówki</label>
                                    <textarea
                                        rows={2}
                                        value={palette.tips}
                                        onChange={e => updatePalette(pIndex, 'tips', e.target.value)}
                                        className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* About Photo Section - tylko dla "o-mnie" i "strona-glowna" */}
                {(isOMnie || isHomePage) && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-white text-white">Sekcja ze zdjęciem (Legacy)</h2>

                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Zdjęcie (prawa strona)</label>
                            <div className="flex gap-2 items-center">
                                {aboutPhoto && (
                                    <img src={aboutPhoto} alt="" className="w-24 h-24 object-cover rounded" />
                                )}
                                <button
                                    onClick={() => openMediaPicker('about-photo')}
                                    className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white hover:bg-zinc-700"
                                >
                                    <ImageIcon className="w-4 h-4 inline mr-1" />
                                    {aboutPhoto ? 'Zmień zdjęcie' : 'Wybierz zdjęcie'}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Tekst przy zdjęciu (lewa strona)</label>
                            <textarea
                                rows={6}
                                value={aboutTextSide}
                                onChange={e => setAboutTextSide(e.target.value)}
                                placeholder="Krótki opis o Tobie..."
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Media Picker Modal */}
            <MediaPicker
                isOpen={mediaPickerOpen}
                onClose={() => setMediaPickerOpen(false)}
                onSelect={handleMediaSelect}
                multiple={false}
            />
        </div >
    );
}
