'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api-config';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface BlogPost {
    id: number;
    title: string;
    slug: string;
    is_published: boolean;
    created_at: string;
}

export default function BlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await fetch(getApiUrl('blog'));
            const data = await res.json();
            if (data.success) {
                setPosts(data.posts);
            }
        } catch (error) {
            console.error('Failed to fetch posts', error);
            toast.error('Błąd pobierania postów');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number, title: string) => {
        if (!confirm(`Czy na pewno chcesz usunąć wpis "${title}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${getApiUrl('blog')}?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                toast.success('Wpis został usunięty');
                fetchPosts(); // Refresh list
            } else {
                throw new Error('Failed to delete');
            }
        } catch (error) {
            console.error('Failed to delete post', error);
            toast.error('Błąd usuwania wpisu');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-display font-semibold text-white">Blog</h1>
                <Link
                    href="/admin/blog/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-gold-500 hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Nowy wpis
                </Link>
            </div>

            <div className="bg-zinc-900 shadow overflow-hidden sm:rounded-md border border-zinc-800">
                <ul className="divide-y divide-zinc-800">
                    {loading ? (
                        <li className="px-6 py-4 text-zinc-400">Ładowanie...</li>
                    ) : posts.length === 0 ? (
                        <li className="px-6 py-4 text-zinc-400">Brak wpisów. Dodaj pierwszy!</li>
                    ) : (
                        posts.map((post) => (
                            <li key={post.id}>
                                <div className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-gold-400 truncate">{post.title}</p>
                                            <div className="ml-2 flex-shrink-0 flex">
                                                <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${post.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {post.is_published ? 'Opublikowany' : 'Szkic'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-zinc-500">
                                                    /{post.slug}
                                                </p>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-zinc-500 sm:mt-0">
                                                <p>
                                                    Utworzono {new Date(post.created_at).toLocaleDateString('pl-PL')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-5 flex-shrink-0 flex gap-2">
                                        <Link href={`/admin/blog/edit/${post.id}`} className="p-2 text-zinc-400 hover:text-white transition-colors">
                                            <Edit className="h-5 w-5" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(post.id, post.title)}
                                            className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
