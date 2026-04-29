'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Calendar, MapPin, Camera, ExternalLink, LogOut, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface Challenge {
    id: number;
    unique_link: string;
    inviter_name: string;
    invitee_name: string;
    role?: 'invitee' | 'inviter';
    status: string;
    session_date: string | null;
    package: {
        name: string;
    };
    location?: {
        name: string;
    };
    custom_location?: string;
    gallery?: {
        is_published: boolean;
    } | null;
}

export default function ChallengePanelPage() {
    const router = useRouter();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('client_token');
        if (!token) {
            router.push('/foto-wyzwanie/login');
            return;
        }

        fetchChallenges(token);
    }, []);

    const fetchChallenges = async (token: string) => {
        try {
            const res = await fetch('/api/photo-challenge/client/challenges', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setChallenges(data.challenges);
                setUser(data.user || null);
            } else {
                // If token invalid, redirect to login
                localStorage.removeItem('client_token');
                router.push('/foto-wyzwanie/login');
            }
        } catch (err) {
            console.error('Failed to fetch challenges');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('client_token');
        router.push('/foto-wyzwanie/login');
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'accepted': return { label: 'Zaakceptowane', color: 'bg-blue-500/20 text-blue-400' };
            case 'scheduled': return { label: 'Zaplanowane', color: 'bg-green-500/20 text-green-400' };
            case 'completed': return { label: 'Zakończone', color: 'bg-gold-500/20 text-gold-400' };
            default: return { label: status, color: 'bg-zinc-700 text-zinc-400' };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-gold-400 animate-pulse">Ładowanie Twoich wyzwań...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="min-w-0">
                        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 flex items-center gap-3">
                            <Trophy className="text-gold-500 shrink-0" size={32} />
                            <span>Cześć{user?.name ? `, ${user.name}` : ''}!</span>
                        </h1>
                        <p className="text-zinc-400 text-sm md:text-base">
                            {user?.email ? (
                                <>Zalogowany jako <span className="text-zinc-300 font-mono text-xs">{user.email}</span> · Twoje sesje i galerie</>
                            ) : (
                                <>Twoje sesje i galerie w jednym miejscu</>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white shrink-0"
                    >
                        <LogOut size={18} /> Wyloguj się
                    </button>
                </div>

                {/* Challenges Grid */}
                <div className="grid gap-6">
                    {challenges.length === 0 ? (
                        <div className="bg-zinc-800/30 border border-zinc-800 rounded-2xl p-12 text-center">
                            <Camera size={48} className="mx-auto text-zinc-600 mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Brak aktywnych wyzwań</h2>
                            <p className="text-zinc-500 mb-8">Nie masz jeszcze żadnych powiązanych wyzwań z tym kontem.</p>
                            <Link href="/foto-wyzwanie" className="text-gold-500 hover:underline">
                                Zobacz jak to działa →
                            </Link>
                        </div>
                    ) : (
                        challenges.map(challenge => {
                            const status = getStatusLabel(challenge.status);
                            const hasGallery = challenge.gallery?.is_published;

                            return (
                                <div key={challenge.id} className="bg-zinc-800/50 border border-zinc-700 rounded-2xl overflow-hidden hover:border-zinc-500 transition-colors">
                                    <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                                        {/* Status & Icon */}
                                        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0">
                                            {challenge.status === 'completed' ? <Trophy className="text-gold-500" /> : <Calendar className="text-blue-500" />}
                                        </div>

                                        {/* Main Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status.color}`}>
                                                    {status.label}
                                                </span>
                                                {challenge.role && (
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${challenge.role === 'inviter' ? 'bg-amber-500/15 text-amber-300' : 'bg-blue-500/15 text-blue-300'}`}>
                                                        {challenge.role === 'inviter' ? 'Zapraszasz' : 'Zaproszony/a'}
                                                    </span>
                                                )}
                                                <h2 className="text-xl font-bold">{challenge.package.name}</h2>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={16} className="text-zinc-500" />
                                                    {challenge.session_date ? new Date(challenge.session_date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Termin wkrótce'}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin size={16} className="text-zinc-500" />
                                                    {challenge.location?.name || challenge.custom_location || 'Lokalizacja wkrótce'}
                                                </div>
                                            </div>
                                            <p className="mt-3 text-sm italic text-zinc-500">
                                                {challenge.role === 'inviter' ? `Zaproszony/a: ${challenge.invitee_name}` : `Zaproszenie od: ${challenge.inviter_name}`}
                                            </p>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                            {hasGallery && (
                                                <Link
                                                    href={`/foto-wyzwanie/gallery/${challenge.unique_link}`}
                                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-black font-bold rounded-xl transition-all shadow-lg shadow-gold-500/20"
                                                >
                                                    <ImageIcon size={20} /> Zobacz Zdjęcia
                                                </Link>
                                            )}
                                            <Link
                                                href={`/foto-wyzwanie/invite/${challenge.unique_link}`}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-xl transition-all"
                                            >
                                                Szczegóły wyzwania <ChevronRight size={18} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Help */}
                <div className="mt-20 border-t border-zinc-800 pt-12 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                    <div>
                        <h3 className="text-xl font-bold mb-2">Potrzebujesz pomocy?</h3>
                        <p className="text-zinc-500">Masz pytania dotyczące sesji lub problem z logowaniem?</p>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/kontakt" className="px-6 py-3 border border-zinc-700 hover:border-zinc-500 rounded-xl transition-colors">
                            Kontakt z fotografem
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
