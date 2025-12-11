'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Facebook, MessageCircle, Mail, Share2, Check, X } from 'lucide-react';

interface ChallengeData {
    id: number;
    inviter_name: string;
    invitee_name: string;
    package_id: number;
    location_id?: number;
    status: string;
    package?: {
        package_name: string;
        package_description?: string;
        challenge_price: number;
    };
    location?: {
        location_name: string;
        location_description?: string;
    };
}

export default function InvitePage() {
    const params = useParams();
    const router = useRouter();
    const uniqueLink = params.unique_link as string;

    const [challenge, setChallenge] = useState<ChallengeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [responded, setResponded] = useState<'accepted' | 'rejected' | null>(null);
    const [shareMode, setShareMode] = useState(false);

    useEffect(() => {
        fetchChallenge();
    }, [uniqueLink]);

    const fetchChallenge = async () => {
        try {
            const res = await fetch(`/api/photo-challenge/${uniqueLink}`);
            const data = await res.json();

            if (data.success) {
                setChallenge(data.challenge);
            } else {
                setError('Zaproszenie nie znalezione');
            }
        } catch (err) {
            setError('Błąd przy ładowaniu zaproszenia');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!challenge) return;

        try {
            const res = await fetch(`/api/photo-challenge/${uniqueLink}/accept-invite`, {
                method: 'POST'
            });

            const data = await res.json();
            if (data.success) {
                setResponded('accepted');
                // Redirect to accept flow after 2s
                setTimeout(() => {
                    router.push(`/foto-wyzwanie/accept/${uniqueLink}`);
                }, 2000);
            }
        } catch (err) {
            console.error('Error accepting challenge:', err);
        }
    };

    const handleReject = async () => {
        if (!challenge) return;

        try {
            const res = await fetch(`/api/photo-challenge/${uniqueLink}/reject`, {
                method: 'POST'
            });

            const data = await res.json();
            if (data.success) {
                setResponded('rejected');
            }
        } catch (err) {
            console.error('Error rejecting challenge:', err);
        }
    };

    const shareUrl = `${window?.location.origin}/foto-wyzwanie/invite/${uniqueLink}`;
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Hej! ${challenge?.inviter_name} zaprosił mnie na foto-wyzwanie! Chcesz się przyłączyć? ${shareUrl}`)}`;
    const mailUrl = `mailto:?subject=Zaproszenie na foto-wyzwanie&body=${encodeURIComponent(`Hej!\n\n${challenge?.inviter_name} zaprosił mnie na foto-wyzwanie fotograficzne! Możesz się przyłączyć tutaj: ${shareUrl}\n\nZaproszenie czyni życie bardziej kolorowe!`)}`;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 flex items-center justify-center px-4">
                <div className="text-gold-400 text-xl">Ładowanie zaproszenia...</div>
            </div>
        );
    }

    if (error || !challenge) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <div className="text-5xl mb-4">❌</div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2">Coś poszło nie tak</h1>
                    <p className="text-zinc-400 mb-8">{error || 'Zaproszenie nie znalezione'}</p>
                    <Link
                        href="/foto-wyzwanie"
                        className="inline-block px-6 py-3 bg-gold-500 hover:bg-gold-600 text-black font-bold rounded-lg transition-colors"
                    >
                        Wróć do wyzwań
                    </Link>
                </div>
            </div>
        );
    }

    const discountPercentage = challenge.package?.challenge_price ? (challenge.package.challenge_price * 0.1) : 0;

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-white py-20 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Celebration animation - shown after accept */}
                {responded === 'accepted' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                        <div className="text-center">
                            <div className="text-8xl mb-4 animate-bounce">🎉</div>
                            <h2 className="text-4xl font-display font-bold text-gold-400 mb-2">
                                Hurra! 🎊
                            </h2>
                            <p className="text-xl text-zinc-300 mb-6">
                                Zaakceptowałeś wyzwanie!
                            </p>
                            <p className="text-zinc-400">
                                Redirectowanie do wyboru daty...
                            </p>
                        </div>
                    </div>
                )}

                {/* Main Card */}
                {!responded ? (
                    <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 rounded-2xl p-8 border border-zinc-700 shadow-2xl mb-8">
                        {/* Header */}
                        <div className="text-center mb-10">
                            <Heart className="inline mb-4 text-pink-500 animate-pulse" size={56} />
                            <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 bg-gradient-to-r from-gold-400 to-pink-400 bg-clip-text text-transparent">
                                {challenge.inviter_name} zaprasza Cię!
                            </h1>
                            <p className="text-xl text-zinc-300">
                                na niezapomniane <span className="text-pink-400 font-bold">foto-wyzwanie</span>
                            </p>
                        </div>

                        {/* Package Info */}
                        {challenge.package && (
                            <div className="bg-zinc-900/50 rounded-xl p-6 mb-6 border border-gold-500/30">
                                <div className="flex justify-between items-start mb-3">
                                    <h2 className="text-2xl font-bold text-gold-400">
                                        {challenge.package.package_name}
                                    </h2>
                                    <div className="text-right">
                                        <div className="text-xs text-zinc-400 line-through mb-1">
                                            {challenge.package.challenge_price}zł
                                        </div>
                                        <div className="text-2xl font-bold text-green-400">
                                            {(challenge.package.challenge_price * 0.9).toFixed(0)}zł
                                        </div>
                                        <div className="text-xs text-green-400 font-bold">
                                            Już opłacone!
                                        </div>
                                    </div>
                                </div>
                                {challenge.package.package_description && (
                                    <p className="text-zinc-300">{challenge.package.package_description}</p>
                                )}
                            </div>
                        )}

                        {/* Location Info */}
                        {challenge.location && (
                            <div className="bg-zinc-900/50 rounded-xl p-4 mb-8 border border-zinc-700">
                                <p className="text-sm text-zinc-400 mb-1">📍 Proponowana lokalizacja:</p>
                                <h3 className="text-lg font-bold">{challenge.location.location_name}</h3>
                                {challenge.location.location_description && (
                                    <p className="text-sm text-zinc-400 mt-2">{challenge.location.location_description}</p>
                                )}
                            </div>
                        )}

                        {/* Info Box */}
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-8">
                            <p className="text-sm text-blue-200">
                                ℹ️ To zaproszenie straciło ważność za 30 dni. Kliknij "Przyjmij wyzwanie", aby wybrać datę i godzinę sesji.
                            </p>
                        </div>

                        {/* Main CTA Buttons */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <button
                                onClick={handleAccept}
                                className="py-4 rounded-lg font-bold text-lg bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                            >
                                <Check size={24} />
                                Przyjmij!
                            </button>
                            <button
                                onClick={handleReject}
                                className="py-4 rounded-lg font-bold text-lg bg-zinc-700 hover:bg-zinc-600 text-white transition-colors flex items-center justify-center gap-2"
                            >
                                <X size={24} />
                                Odrzuć
                            </button>
                        </div>

                        {/* Share Section */}
                        <div>
                            <button
                                onClick={() => setShareMode(!shareMode)}
                                className="w-full py-3 rounded-lg font-bold border-2 border-gold-500/50 hover:border-gold-500 hover:bg-gold-500/10 text-gold-400 transition-colors flex items-center justify-center gap-2 mb-4"
                            >
                                <Share2 size={20} />
                                Prześlij dalej znajomym
                            </button>

                            {shareMode && (
                                <div className="grid grid-cols-2 gap-3">
                                    <a
                                        href={facebookShareUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="py-3 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Facebook size={20} />
                                        Facebook
                                    </a>
                                    <a
                                        href={whatsappUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="py-3 rounded-lg font-bold bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle size={20} />
                                        WhatsApp
                                    </a>
                                    <a
                                        href={mailUrl}
                                        className="py-3 rounded-lg font-bold bg-gray-600 hover:bg-gray-700 text-white transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Mail size={20} />
                                        Email
                                    </a>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(shareUrl);
                                            alert('Link skopiowany do schowka!');
                                        }}
                                        className="py-3 rounded-lg font-bold bg-zinc-700 hover:bg-zinc-600 text-white transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Share2 size={20} />
                                        Kopiuj link
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : responded === 'rejected' ? (
                    <div className="bg-zinc-800/50 rounded-2xl p-8 border border-zinc-700 text-center">
                        <div className="text-6xl mb-4">😢</div>
                        <h2 className="text-3xl font-bold mb-2">No, trudno...</h2>
                        <p className="text-zinc-400 mb-6">
                            Może następnym razem!
                        </p>
                        <Link
                            href="/foto-wyzwanie"
                            className="inline-block px-6 py-3 bg-gold-500 hover:bg-gold-600 text-black font-bold rounded-lg transition-colors"
                        >
                            Wróć do wyzwań
                        </Link>
                    </div>
                ) : null}

                {/* Footer Link */}
                <div className="text-center mt-12 text-zinc-500">
                    <Link href="/foto-wyzwanie" className="hover:text-gold-400 transition-colors">
                        ← Wróć do wyzwań
                    </Link>
                </div>
            </div>
        </div>
    );
}
