'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AccountPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [giftCards, setGiftCards] = useState<any[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('user_token');
        if (!token) {
            router.push('/logowanie');
            return;
        }

        // Fetch user data & cards
        async function fetchData() {
            try {
                const res = await fetch('/api/user/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                    setGiftCards(data.user.gift_cards || []);
                    // also orders?
                } else {
                    localStorage.removeItem('user_token');
                    router.push('/logowanie');
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_info');
        router.push('/logowanie');
    };

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Ładowanie...</div>;

    return (
        <div className="min-h-screen bg-black text-white pt-32 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-display font-bold text-gold-400">Twoje Konto</h1>
                    <button onClick={handleLogout} className="text-zinc-500 hover:text-white transition-colors">Wyloguj</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Sidebar / Profile Info */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                            <h2 className="text-xl font-bold text-white mb-4">Profil</h2>
                            <p className="text-zinc-400 mb-1">Imię: <span className="text-white">{user?.name}</span></p>
                            <p className="text-zinc-400">Email: <span className="text-white">{user?.email}</span></p>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-8">

                        {/* Gift Cards Section */}
                        <section>
                            <h2 className="text-2xl font-bold text-gold-400 mb-4">Twoje Karty Podarunkowe</h2>
                            {giftCards.length === 0 ? (
                                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl text-center">
                                    <p className="text-zinc-500 mb-4">Nie masz jeszcze żadnych kart podarunkowych.</p>
                                    <Link href="/karta-podarunkowa" className="inline-block px-6 py-2 bg-gold-600/20 text-gold-400 border border-gold-600/50 rounded-full hover:bg-gold-600/30 transition-colors">
                                        Kup kartę
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {giftCards.map((card) => (
                                        <div key={card.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex justify-between items-center group hover:border-gold-500/50 transition-colors">
                                            <div>
                                                <div className="text-gold-400 font-bold uppercase tracking-wider text-sm mb-1">{card.card_title || 'Karta Podarunkowa'}</div>
                                                <div className="text-2xl font-bold text-white mb-2">{card.value} PLN</div>
                                                <div className="text-zinc-500 text-sm">Kod: <span className="font-mono text-zinc-300">{card.code}</span></div>
                                            </div>
                                            <Link href={`/karta-podarunkowa/dostep/${card.access_token || ''}`} className="px-4 py-2 bg-white text-black font-bold rounded hover:bg-zinc-200 transition-colors">
                                                Otwórz
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
