'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api-config';
import { Save, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import MediaPicker from '@/components/admin/MediaPicker';
import RichTextEditor from '@/components/admin/RichTextEditor';

export default function NewPostPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        cover_image: '',
        featured_image_id: 0,
        is_published: false,
    });
    const [saving, setSaving] = useState(false);
    const [showMediaPicker, setShowMediaPicker] = useState(false);

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
            const res = await fetch(getApiUrl('blog'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success('Utworzono wpis');
                router.push('/admin/blog');
            } else {
                throw new Error('Failed to create post');
            }
        } catch (error) {
            toast.error('Błąd tworzenia wpisu');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/blog" className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <h1 className="text-2xl font-display font-semibold text-white">Nowy wpis</h1>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-gold-500 hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
                >
                    <Save className="-ml-1 mr-2 h-5 w-5" />
                    {saving ? 'Zapisywanie...' : 'Zapisz'}
                </button>
            </div>

            <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Tytuł</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={handleTitleChange}
                        className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        placeholder="Wpisz tytuł posta..."
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
                            onClick={() => setShowMediaPicker(true)}
                            className="inline-flex items-center px-3 py-2 border border-zinc-700 shadow-sm text-sm leading-4 font-medium rounded-md text-zinc-300 bg-zinc-800 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
                        >
                            <ImageIcon className="-ml-0.5 mr-2 h-4 w-4" />
                            Wybierz z biblioteki
                        </button>
                    </div>
                </div>

                <MediaPicker
                    isOpen={showMediaPicker}
                    onClose={() => setShowMediaPicker(false)}
                    onSelect={(urls: string | string[], ids: number | number[]) => {
                        const url = Array.isArray(urls) ? urls[0] : urls;
                        const id = Array.isArray(ids) ? ids[0] : ids;
                        setFormData({ ...formData, cover_image: url || '', featured_image_id: id || 0 });
                    }}
                />

                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Krótki opis (Excerpt)</label>
                    <textarea
                        rows={3}
                        value={formData.excerpt}
                        onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                        className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Treść</label>
                    <RichTextEditor
                        value={formData.content}
                        onChange={(value) => setFormData({ ...formData, content: value })}
                        placeholder="Napisz treść wpisu..."
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
                        Opublikuj od razu
                    </label>
                </div>
            </div>
        </div>
    );
}
