'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api-config';
import Link from 'next/link';
import { Eye, CheckCircle, XCircle, Clock, Calendar, Trophy } from 'lucide-react';

interface Challenge {
    id: number;
    unique_link: string;
    inviter_name: string;
    invitee_name: string;
    status: string;
    created_at: string;
    acceptance_deadline: string | null;
    session_date: string | null;
    package_id: number;
}

export default function ChallengesAdminPage() {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        fetchChallenges();
    }, []);

    const fetchChallenges = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl('photo-challenge/admin/list'), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
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
            sent: { label: 'Wysłane', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock },
            viewed: { label: 'Wyświetlone', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Eye },
            accepted: { label: 'Zaakceptowane', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
            rejected: { label: 'Odrzucone', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
            scheduled: { label: 'Zaplanowane', color: 'bg-gold-500/20 text-gold-400 border-gold-500/30', icon: Calendar },
            completed: { label: 'Zakończone', color: 'bg-green-600/20 text-green-300 border-green-600/30', icon: Trophy },
            expired: { label: 'Wygasłe', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: XCircle },
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

    const filteredChallenges = filter === 'all'
        ? challenges
        : challenges.filter(c => c.status === filter);

    if (loading) return <div className="text-zinc-400">Ładowanie...</div>;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-white mb-2">
                    🏆 Foto Wyzwania
                </h1>
                <p className="text-zinc-400 mb-6">
                    Zarządzaj wszystkimi wyzwaniami zdjęciowymi
                </p>

                <div className="flex gap-4">
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
                        ⚙️ Konfiguracja
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-2">
                {[
                    { value: 'all', label: 'Wszystkie' },
                    { value: 'sent', label: 'Wysłane' },
                    { value: 'viewed', label: 'Wyświetlone' },
                    { value: 'accepted', label: 'Zaakceptowane' },
                    { value: 'scheduled', label: 'Zaplanowane' },
                    { value: 'completed', label: 'Zakończone' },
                ].map(({ value, label }) => (
                    <button
                        key={value}
                        onClick={() => setFilter(value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === value
                            ? 'bg-gold-500 text-black'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Challenges Table */}
            <div className="bg-zinc-900 shadow overflow-hidden sm:rounded-lg border border-zinc-800">
                <table className="min-w-full divide-y divide-zinc-800">
                    <thead className="bg-zinc-800/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Zapraszający
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Zaproszony
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Data utworzenia
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Termin sesji
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Akcje
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {filteredChallenges.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                                    Brak wyzwań do wyświetlenia
                                </td>
                            </tr>
                        ) : (
                            filteredChallenges.map((challenge) => (
                                <tr key={challenge.id} className="hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gold-400">
                                        #{challenge.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        {challenge.inviter_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        {challenge.invitee_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(challenge.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                        {new Date(challenge.created_at).toLocaleDateString('pl-PL')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                        {challenge.session_date
                                            ? new Date(challenge.session_date).toLocaleDateString('pl-PL')
                                            : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link
                                            href={`/admin/challenges/${challenge.id}`}
                                            className="text-gold-400 hover:text-gold-300 transition-colors"
                                        >
                                            Szczegóły →
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {filteredChallenges.length > 0 && (
                <div className="mt-4 text-sm text-zinc-500">
                    Wyświetlono {filteredChallenges.length} wyzwan{filteredChallenges.length === 1 ? 'ie' : 'ia/ń'}
                </div>
            )}
        </div>
    );
}
