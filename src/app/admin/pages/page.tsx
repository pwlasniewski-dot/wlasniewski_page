'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api-config';
import Link from 'next/link';
import { Edit, Plus, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Page {
    id: number;
    slug: string;
    title: string;
    page_type: string;
    is_published: boolean;
    updated_at: string;
}

export default function PagesListPage() {
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPageData, setNewPageData] = useState({ title: '', slug: '', page_type: 'regular', is_in_menu: false });
    const [creating, setCreating] = useState(false);

    const fetchPages = async () => {
        try {
            const res = await fetch(getApiUrl('pages'));
            const data = await res.json();
            if (data.success) {
                setPages(data.pages);
            }
        } catch (error) {
            console.error('Failed to fetch pages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPages();
    }, []);

    const deletePage = async (id: number) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl('pages') + `?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                toast.success('Strona usunięta');
                fetchPages();
            } else {
                throw new Error('Failed to delete');
            }
        } catch (error) {
            toast.error('Błąd usuwania strony');
        }
    };

    const handleCreatePage = async () => {
        if (!newPageData.title || !newPageData.slug) {
            toast.error('Wypełnij tytuł i slug');
            return;
        }

        setCreating(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl('pages'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: newPageData.title,
                    slug: newPageData.slug,
                    page_type: newPageData.page_type,
                    content: '',
                    is_published: false,
                    is_in_menu: newPageData.is_in_menu,
                    menu_title: newPageData.title
                }),
            });

            if (res.ok) {
                toast.success('Strona utworzona');
                setShowCreateModal(false);
                setNewPageData({ title: '', slug: '', page_type: 'regular', is_in_menu: false });
                fetchPages();
            } else {
                throw new Error('Failed to create');
            }
        } catch (error) {
            toast.error('Błąd tworzenia strony');
        } finally {
            setCreating(false);
        }
    };

    const generateSlug = (title: string) => {
        const slug = title
            .toLowerCase()
            .replace(/ł/g, 'l').replace(/ś/g, 's').replace(/ć/g, 'c').replace(/ą/g, 'a').replace(/ę/g, 'e').replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ź/g, 'z').replace(/ż/g, 'z')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-');
        setNewPageData(prev => ({ ...prev, title, slug }));
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-display font-semibold text-white">Strony statyczne</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-gold-500 hover:bg-gold-400"
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Dodaj stronę
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-zinc-400">Ładowanie...</div>
            ) : (
                <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                    <ul className="divide-y divide-zinc-800">
                        {pages.map((page) => (
                            <li key={page.id} className="p-6 hover:bg-zinc-800/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-medium text-white">
                                                {page.title}
                                            </h3>
                                            <span className={`px-2 py-0.5 rounded text-xs border ${page.page_type === 'home' ? 'bg-gold-500/10 text-gold-500 border-gold-500/30' :
                                                page.page_type === 'portfolio' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                                                    page.page_type === 'contact' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                                                        page.page_type === 'shop' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                                                            page.page_type === 'reviews' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                                                        'bg-zinc-800 text-zinc-400 border-zinc-700'
                                                }`}>
                                                {page.page_type === 'home' ? 'Strona główna' :
                                                    page.page_type === 'portfolio' ? 'Portfolio' :
                                                        page.page_type === 'about' ? 'O mnie' :
                                                            page.page_type === 'contact' ? 'Kontakt' :
                                                                page.page_type === 'shop' ? 'Sklep' :
                                                                    page.page_type === 'reviews' ? 'Opinie' :
                                                                        page.page_type === 'offer' ? 'Oferta' : 'Standardowa'}
                                            </span>
                                            {page.is_published ? (
                                                <span className="px-2 py-0.5 rounded text-xs bg-green-900/30 text-green-400 border border-green-900/50">
                                                    Opublikowana
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-400 border border-zinc-700">
                                                    Szkic
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-zinc-500 mt-1 font-mono">/{page.slug}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Link
                                            href={page.slug === '' ? '/admin/pages/strona-glowna' : `/admin/pages/${page.slug}`}
                                            className="inline-flex items-center px-3 py-1.5 border border-zinc-700 rounded-md text-sm font-medium text-zinc-300 hover:bg-zinc-800"
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edytuj treść
                                        </Link>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Czy na pewno chcesz usunąć tę stronę? Tej operacji nie można cofnąć.')) {
                                                    // handleDeletePage(page.id); // Need to define this function
                                                    deletePage(page.id);
                                                }
                                            }}
                                            className="inline-flex items-center px-3 py-1.5 border border-red-900/30 rounded-md text-sm font-medium text-red-500 hover:bg-red-900/20"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Usuń
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="absolute right-4 top-4 text-zinc-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold text-white mb-6">Nowa strona</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">
                                    Tytuł strony
                                </label>
                                <input
                                    type="text"
                                    value={newPageData.title}
                                    onChange={(e) => generateSlug(e.target.value)}
                                    placeholder="np. O mnie"
                                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-gold-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">
                                    Slug (adres URL)
                                </label>
                                <input
                                    type="text"
                                    value={newPageData.slug}
                                    onChange={(e) => setNewPageData({ ...newPageData, slug: e.target.value })}
                                    placeholder="np. o-mnie"
                                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-gold-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">
                                    Typ strony
                                </label>
                                <select
                                    value={newPageData.page_type}
                                    onChange={(e) => setNewPageData({ ...newPageData, page_type: e.target.value })}
                                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-gold-500"
                                >
                                    <option value="regular">Standardowa podstrona</option>
                                    {!pages.some(p => p.page_type === 'home') && (
                                        <option value="home">Strona Główna</option>
                                    )}
                                    <option value="about">O mnie</option>
                                    <option value="portfolio">Portfolio</option>
                                    <option value="jak-sie-ubrac">Jak się ubrać (paleta kolorów)</option>
                                    <option value="offer">Oferta</option>
                                    <option value="shop">Sklep (Karty Podarunkowe)</option>
                                    <option value="reviews">Opinie i Recenzje</option>
                                    <option value="contact">Kontakt</option>
                                </select>
                                <p className="text-xs text-zinc-500 mt-1">Typ strony pomaga w automatycznym budowaniu menu i struktury.</p>
                            </div>

                            <div className="flex items-center gap-3 py-2">
                                <input
                                    type="checkbox"
                                    id="is_in_menu"
                                    checked={newPageData.is_in_menu}
                                    onChange={(e) => setNewPageData({ ...newPageData, is_in_menu: e.target.checked })}
                                    className="w-5 h-5 rounded border-zinc-700 bg-zinc-950 text-gold-500 focus:ring-gold-500"
                                />
                                <label htmlFor="is_in_menu" className="text-sm text-white cursor-pointer">
                                    ✅ Dodaj do menu nawigacji
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-zinc-400 hover:text-white"
                                >
                                    Anuluj
                                </button>
                                <button
                                    onClick={handleCreatePage}
                                    disabled={creating}
                                    className="px-4 py-2 bg-gold-500 text-black font-bold rounded-lg hover:bg-gold-400 disabled:opacity-50"
                                >
                                    {creating ? 'Tworzenie...' : 'Utwórz'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
