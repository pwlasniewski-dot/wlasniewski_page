'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, CheckCircle, XCircle, Clock, Calendar, Trophy, Search, Mail, Trash2 } from 'lucide-react';

interface Challenge {
    id: number;
    unique_link: string;
    inviter_name: string;
    invitee_name: string;
    invitee_contact: string;
    status: string;
    created_at: string;
    session_date: string | null;
    package?: {
        package_name: string;
        challenge_price: number;
    };
}

export default function ChallengesAdminPage() {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchChallenges();
    }, []);

    const fetchChallenges = async () => {
        try {
            const res = await fetch('/api/photo-challenge/admin/list');
            const data = await res.json();
            if (data.success) {
                setChallenges(data.challenges || []);
            }
        } catch (error) {
            console.error('Failed to fetch challenges');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { label: string; color: string; icon: any }> = {
            'pending_payment': { label: 'Oczekuje płatności', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Clock },
            'sent': { label: 'Wysłane', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock },
            'viewed': { label: 'Wyświetlone', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Eye },
            'accepted': { label: 'Zaakceptowane', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
            'rejected': { label: 'Odrzucone', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
            'scheduled': { label: 'Zaplanowane', color: 'bg-gold-500/20 text-gold-400 border-gold-500/30', icon: Calendar },
            'completed': { label: 'Zakończone', color: 'bg-green-600/20 text-green-300 border-green-600/30', icon: Trophy },
            'expired': { label: 'Wygasłe', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: XCircle },
        };

        const badge = badges[status] || badges.sent;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${badge.color}`}>
                <Icon className="w-4 h-4" />
                {badge.label}
            </span>
        );
    };

    const filteredChallenges = challenges.filter(c => {
        const matchesFilter = filter === 'all' || c.status === filter;
        const matchesSearch =
            c.inviter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.invitee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.invitee_contact.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (loading) return <div className="text-zinc-400">Ładowanie...</div>;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-white mb-2">
                    🏆 Foto Wyzwania
                </h1>
                <p className="text-zinc-400 mb-6">
                    Zarządzaj wszystkimi wyzwaniami fotograficznymi
                </p>

                <div className="flex gap-4 mb-6">
                    <Link
                        href="/admin/challenges/packages"
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-medium transition-colors"
                    >
                        📦 Pakiety
                    </Link>
                    <Link
                        href="/admin/challenges/locations"
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-medium transition-colors"
                    >
                        📍 Lokalizacje
                    </Link>
                    <Link
                        href="/admin/challenges/config"
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-medium transition-colors"
                    >
                        ⚙️ Ustawienia
                    </Link>
                </div>

                {/* Search and Filter */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-zinc-500" size={20} />
                        <input
                            type="text"
                            placeholder="Szukaj po imieniu lub emailu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-gold-500"
                        />
                    </div>

                    <div className="flex gap-2">
                        {['all', 'pending_payment', 'sent', 'viewed', 'accepted', 'completed'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    filter === s
                                        ? 'bg-gold-500 text-black'
                                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                            >
                                {s === 'all' ? 'Wszystkie' : s.replace(/_/g, ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-zinc-900/50 border-b border-zinc-700">
                        <tr>
                            <th className="px-6 py-4 text-left font-semibold text-zinc-300">Zapraszający</th>
                            <th className="px-6 py-4 text-left font-semibold text-zinc-300">Zaproszony</th>
                            <th className="px-6 py-4 text-left font-semibold text-zinc-300">Email</th>
                            <th className="px-6 py-4 text-left font-semibold text-zinc-300">Status</th>
                            <th className="px-6 py-4 text-left font-semibold text-zinc-300">Data sesji</th>
                            <th className="px-6 py-4 text-left font-semibold text-zinc-300">Akcje</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-700">
                        {filteredChallenges.length > 0 ? (
                            filteredChallenges.map(challenge => (
                                <tr key={challenge.id} className="hover:bg-zinc-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-medium text-white">{challenge.inviter_name}</div>
                                            <div className="text-xs text-zinc-500">{new Date(challenge.created_at).toLocaleDateString('pl-PL')}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-white">{challenge.invitee_name}</td>
                                    <td className="px-6 py-4">
                                        <a href={`mailto:${challenge.invitee_contact}`} className="text-gold-400 hover:text-gold-300">
                                            {challenge.invitee_contact}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(challenge.status)}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-400">
                                        {challenge.session_date
                                            ? new Date(challenge.session_date).toLocaleDateString('pl-PL')
                                            : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                title="Wyślij maila"
                                                className="p-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-400 transition-colors"
                                            >
                                                <Mail size={18} />
                                            </button>
                                            <Link
                                                href={`/foto-wyzwanie/invite/${challenge.unique_link}`}
                                                title="Zobacz zaproszenie"
                                                className="p-2 bg-gold-600/20 hover:bg-gold-600/40 rounded-lg text-gold-400 transition-colors"
                                                target="_blank"
                                            >
                                                <Eye size={18} />
                                            </Link>
                                            <button
                                                title="Usuń"
                                                className="p-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-400 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                                    Brak wyzwań pasujących do kryteriów
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4 mt-8">
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
                    <div className="text-zinc-400 text-sm mb-2">Wszystkich wyzwań</div>
                    <div className="text-3xl font-bold text-white">{challenges.length}</div>
                </div>
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
                    <div className="text-zinc-400 text-sm mb-2">Zaakceptowanych</div>
                    <div className="text-3xl font-bold text-green-400">{challenges.filter(c => c.status === 'accepted').length}</div>
                </div>
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
                    <div className="text-zinc-400 text-sm mb-2">Zakończonych</div>
                    <div className="text-3xl font-bold text-gold-400">{challenges.filter(c => c.status === 'completed').length}</div>
                </div>
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
                    <div className="text-zinc-400 text-sm mb-2">Oczekujących płatności</div>
                    <div className="text-3xl font-bold text-orange-400">{challenges.filter(c => c.status === 'pending_payment').length}</div>
                </div>
            </div>
        </div>
    );
}
