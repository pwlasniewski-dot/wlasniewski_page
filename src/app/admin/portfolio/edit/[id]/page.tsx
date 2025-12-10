'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getApiUrl } from '@/lib/api-config';
import { Save, ArrowLeft, Image as ImageIcon, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import MediaPicker from '@/components/admin/MediaPicker';

export default function EditSessionPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        category: 'wedding',
        description: '',
        cover_image: '',
        cover_image_id: 0,
        media_ids: [] as number[],
        session_date: new Date().toISOString().split('T')[0],
        is_published: false,
    });
    const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showCoverPicker, setShowCoverPicker] = useState(false);
    const [showGalleryPicker, setShowGalleryPicker] = useState(false);

    const [categories, setCategories] = useState<string[]>(['wedding', 'family', 'portrait', 'communion']);

    useEffect(() => {
        fetchSettings();
        fetchSession();
    }, [id]);

    const fetchSettings = async () => {
        try {
            const res = await fetch(getApiUrl('settings'));
            const data = await res.json();
            if (data.success && data.settings.portfolio_categories) {
                let cats: string[] = [];
                if (typeof data.settings.portfolio_categories === 'string') {
                    try {
                        cats = JSON.parse(data.settings.portfolio_categories);
                    } catch (e) {
                        cats = data.settings.portfolio_categories.split(',').map((s: string) => s.trim());
                    }
                } else if (Array.isArray(data.settings.portfolio_categories)) {
                    cats = data.settings.portfolio_categories;
                }

                if (cats.length > 0) {
                    setCategories(cats);
                }
            }
        } catch (error) {
            console.error('Failed to fetch categories');
        }
    };

    const fetchSession = async () => {
        try {
            const res = await fetch(`${getApiUrl('portfolio')}`);
            const data = await res.json();

            if (data.success) {
                const session = data.sessions.find((s: any) => s.id === parseInt(id));

                if (session) {
                    setFormData({
                        title: session.title,
                        slug: session.slug,
                        category: session.category,
                        description: session.description || '',
                        cover_image: session.cover_image_url || '',
                        cover_image_id: session.cover_image_id || 0,
                        media_ids: session.media_ids ? JSON.parse(session.media_ids) : [],
                        session_date: session.session_date.split('T')[0],
                        is_published: session.is_published,
                    });

                    // Load gallery images
                    if (session.media_ids) {
                        const mediaIds = JSON.parse(session.media_ids);
                        await loadGalleryImages(mediaIds);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch session', error);
            toast.error('Błąd ładowania sesji');
        } finally {
            setLoading(false);
        }
    };

    const loadGalleryImages = async (mediaIds: number[]) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl('media'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                const urls = mediaIds
                    .map(id => data.media.find((m: any) => m.id === id)?.file_path)
                    .filter(Boolean);
                setGalleryUrls(urls);
            }
        } catch (error) {
            console.error('Failed to load gallery images', error);
        }
    };

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        setFormData(prev => ({
            ...prev,
            title,
            slug: generateSlug(title)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${getApiUrl('portfolio')}?id=${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success('Sesja zaktualizowana');
                router.push('/admin/portfolio');
            } else {
                throw new Error('Failed to update session');
            }
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Błąd aktualizacji sesji');
        } finally {
            setSaving(false);
        }
    };

    const handleGallerySelect = (urls: string | string[], ids: number | number[]) => {
        if (Array.isArray(urls) && Array.isArray(ids)) {
            setGalleryUrls(prev => [...prev, ...urls]);
            setFormData(prev => ({
                ...prev,
                media_ids: [...prev.media_ids, ...ids]
            }));
        }
    };

    const removeGalleryImage = (index: number) => {
        setGalleryUrls(prev => prev.filter((_, i) => i !== index));
        setFormData(prev => ({
            ...prev,
            media_ids: prev.media_ids.filter((_, i) => i !== index)
        }));
    };

    if (loading) {
        return (
            <div className="max-w-4xl">
                <div className="text-center py-12 text-zinc-400">Ładowanie...</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/portfolio" className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <h1 className="text-2xl font-display font-semibold text-white">Edytuj sesję</h1>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-gold-500 hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
                >
                    <Save className="-ml-1 mr-2 h-5 w-5" />
                    {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
                </button>
            </div>

            <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Tytuł sesji</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={handleTitleChange}
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                            placeholder="np. Ślub Ani i Tomka"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Slug (URL)</label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={e => setFormData({ ...formData, slug: e.target.value })}
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-zinc-400 shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Kategoria</label>
                        <select
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Data sesji</label>
                        <input
                            type="date"
                            value={formData.session_date}
                            onChange={e => setFormData({ ...formData, session_date: e.target.value })}
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Zdjęcie okładkowe</label>
                    <div className="flex items-center gap-4">
                        {formData.cover_image && (
                            <div className="relative h-20 w-20 rounded-md overflow-hidden border border-zinc-700">
                                <img src={formData.cover_image} alt="Cover" className="h-full w-full object-cover" />
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => setShowCoverPicker(true)}
                            className="inline-flex items-center px-3 py-2 border border-zinc-700 shadow-sm text-sm leading-4 font-medium rounded-md text-zinc-300 bg-zinc-800 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
                        >
                            <ImageIcon className="-ml-0.5 mr-2 h-4 w-4" />
                            Zmień okładkę
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Zdjęcia w galerii</label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 mb-4">
                        {galleryUrls.map((url, index) => (
                            <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-zinc-700 group">
                                <img src={url} alt={`Gallery ${index}`} className="h-full w-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeGalleryImage(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setShowGalleryPicker(true)}
                            className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-md hover:border-gold-500 hover:text-gold-500 text-zinc-400 transition-colors"
                        >
                            <ImageIcon className="h-6 w-6 mb-1" />
                            <span className="text-xs">Dodaj</span>
                        </button>
                    </div>
                </div>

                <MediaPicker
                    isOpen={showCoverPicker}
                    onClose={() => setShowCoverPicker(false)}
                    onSelect={(url: string | string[], id: number | number[]) => setFormData({ ...formData, cover_image: url as string, cover_image_id: id as number })}
                />

                <MediaPicker
                    isOpen={showGalleryPicker}
                    onClose={() => setShowGalleryPicker(false)}
                    onSelect={handleGallerySelect}
                    multiple={true}
                />

                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Opis</label>
                    <textarea
                        rows={4}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        placeholder="Krótki opis sesji..."
                    />
                </div>

                <div className="flex items-center">
                    <input
                        id="published"
                        type="checkbox"
                        checked={formData.is_published}
                        onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                        className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-gold-500 focus:ring-gold-500"
                    />
                    <label htmlFor="published" className="ml-2 block text-sm text-zinc-300">
                        Opublikuj w portfolio
                    </label>
                </div>
            </div>
        </div>
    );
}
