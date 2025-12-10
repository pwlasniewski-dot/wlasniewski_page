'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api-config';
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface PortfolioSession {
    id: number;
    title: string;
    category: string;
    session_date: string;
    is_published: boolean;
}

export default function PortfolioPage() {
    const [sessions, setSessions] = useState<PortfolioSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await fetch(getApiUrl('portfolio'));
            const data = await res.json();
            if (data.success) {
                setSessions(data.sessions);
            }
        } catch (error) {
            console.error('Failed to fetch sessions', error);
            toast.error('Błąd pobierania sesji');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        console.log('🗑️ DELETE CLICKED - ID:', id);

        if (!confirm('Na pewno chcesz usunąć tę sesję?')) {
            console.log('❌ User cancelled');
            return;
        }

        console.log('✅ User confirmed deletion');

        try {
            const token = localStorage.getItem('admin_token');
            console.log('🔑 Token exists:', !!token);

            const url = `${getApiUrl('portfolio')}?id=${id}`;
            console.log('🌐 DELETE URL:', url);

            const res = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('📡 Response status:', res.status);
            const data = await res.json();
            console.log('📦 Response data:', data);

            if (res.ok) {
                console.log('✅ DELETE successful');
                toast.success('Sesja usunięta');
                fetchSessions();
            } else {
                console.error('❌ DELETE failed:', data);
                toast.error(`Błąd: ${data.error || 'Nieznany błąd'}`);
                throw new Error('Delete failed');
            }
        } catch (error) {
            console.error('💥 DELETE exception:', error);
            toast.error('Błąd usuwania sesji');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-display font-semibold text-white">Portfolio</h1>
                <Link
                    href="/admin/portfolio/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-gold-500 hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Nowa sesja
                </Link>
            </div>

            <div className="bg-zinc-900 shadow overflow-hidden sm:rounded-md border border-zinc-800">
                <ul className="divide-y divide-zinc-800">
                    {loading ? (
                        <li className="px-6 py-4 text-zinc-400">Ładowanie...</li>
                    ) : sessions.length === 0 ? (
                        <li className="px-6 py-4 text-zinc-400">Brak sesji. Dodaj pierwszą!</li>
                    ) : (
                        sessions.map((session) => (
                            <li key={session.id}>
                                <div className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-gold-400 truncate">{session.title}</p>
                                            <div className="ml-2 flex-shrink-0 flex">
                                                <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${session.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {session.is_published ? 'Opublikowana' : 'Szkic'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-zinc-500">
                                                    {session.category}
                                                </p>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-zinc-500 sm:mt-0">
                                                <p>
                                                    Data sesji: {new Date(session.session_date).toLocaleDateString('pl-PL')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-5 flex-shrink-0 flex gap-2">
                                        <Link href={`/admin/portfolio/edit/${session.id}`} className="p-2 text-zinc-400 hover:text-white transition-colors">
                                            <Edit className="h-5 w-5" />
                                        </Link>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(session.id);
                                            }}
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
