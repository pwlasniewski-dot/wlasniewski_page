'use client';

// Status Page - for inviter to track challenge progress
// Route: /foto-wyzwanie/status/[id]

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Copy, Share2, Check } from 'lucide-react';
import ProgressSteps from '@/components/PhotoChallenge/ProgressSteps';
import CountdownTimer from '@/components/PhotoChallenge/CountdownTimer';
import type { PhotoChallengeWithDetails } from '@/types/photo-challenge';

export default function ChallengeStatusPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const challengeId = params?.id as string;
    const shareableUrl = searchParams?.get('link');

    const [challenge, setChallenge] = useState<PhotoChallengeWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (challengeId) {
            fetchChallenge();
            // Poll for updates every 10 seconds
            const interval = setInterval(fetchChallenge, 10000);
            return () => clearInterval(interval);
        }
    }, [challengeId]);

    const fetchChallenge = async () => {
        try {
            const response = await fetch(`/api/photo-challenge/check-status/${challengeId}`);
            const data = await response.json();
            if (data.success) {
                setChallenge(data.challenge);
            }
        } catch (error) {
            console.error('Error fetching challenge:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        if (shareableUrl) {
            navigator.clipboard.writeText(shareableUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-gold-400 text-xl">Ładowanie...</div>
            </div>
        );
    }

    if (!challenge) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center px-4">
                <div className="text-center">
                    <h1 className="text-3xl font-display text-gold-400 mb-4">
                        Wyzwanie nie znalezione
                    </h1>
                    <p className="text-gray-400">Sprawdź czy link jest prawidłowy</p>
                </div>
            </div>
        );
    }

    const statusMap: Record<string, 'sent' | 'viewed' | 'accepted' | 'scheduled' | 'completed' | 'gallery'> = {
        sent: 'sent',
        viewed: 'viewed',
        accepted: 'accepted',
        scheduled: 'scheduled',
        completed: 'completed',
    };

    return (
        <div className="min-h-screen bg-black text-white py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-5xl md:text-7xl font-display font-bold text-gold-400 mb-6">
                        Status Twojego Wyzwania
                    </h1>
                    <p className="text-gray-300 text-xl md:text-2xl">
                        Zaprosiłeś <span className="text-white font-semibold">{challenge.invitee_name}</span> na sesję zdjęciową
                    </p>
                </motion.div>

                {/* Progress Steps */}
                <ProgressSteps currentStep={statusMap[challenge.status] || 'sent'} />

                {/* Current Status */}
                <div className="premium-card p-10 rounded-2xl mb-8 border-2 border-gold-400/20">
                    <div className="text-center">
                        <div className="text-8xl mb-6">
                            {challenge.status === 'sent' && '📤'}
                            {challenge.status === 'viewed' && '👀'}
                            {challenge.status === 'accepted' && '🎉'}
                            {challenge.status === 'scheduled' && '📅'}
                            {challenge.status === 'completed' && '✅'}
                            {challenge.status === 'rejected' && '😔'}
                            {challenge.status === 'expired' && '⏰'}
                        </div>
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-gold-400 mb-4">
                            {challenge.status === 'sent' && 'Wyzwanie wysłane'}
                            {challenge.status === 'viewed' && 'Wyzwanie wyświetlone!'}
                            {challenge.status === 'accepted' && 'Wyzwanie zaakceptowane! 🎊'}
                            {challenge.status === 'scheduled' && 'Termin ustalony'}
                            {challenge.status === 'completed' && 'Sesja zakończona'}
                            {challenge.status === 'rejected' && 'Wyzwanie odrzucone'}
                            {challenge.status === 'expired' && 'Wyzwanie wygasło'}
                        </h2>
                        <p className="text-gray-300 text-lg md:text-xl">
                            {challenge.status === 'sent' && 'Czekamy aż osoba zaproszona otworzy link...'}
                            {challenge.status === 'viewed' && `${challenge.invitee_name} obejrzał(a) wyzwanie! Czekamy na akceptację...`}
                            {challenge.status === 'accepted' && `${challenge.invitee_name} zaakceptował(a) wyzwanie! Skontaktujemy się z Wami wkrótce.`}
                            {challenge.status === 'scheduled' && 'Termin sesji został ustalony'}
                            {challenge.status === 'completed' && 'Sesja zakończona! Galeria będzie wkrótce dostępna.'}
                            {challenge.status === 'rejected' && `${challenge.invitee_name} odrzucił(a) wyzwanie.`}
                            {challenge.status === 'expired' && 'Minął czas na akceptację wyzwania.'}
                        </p>
                    </div>
                </div>

                {/* Countdown Timer (if not yet accepted/rejected/expired) */}
                {challenge.acceptance_deadline && !['accepted', 'rejected', 'expired', 'completed'].includes(challenge.status) && (
                    <div className="mb-8">
                        <CountdownTimer
                            deadline={challenge.acceptance_deadline}
                            onExpire={() => fetchChallenge()}
                        />
                    </div>
                )}

                <div className="grid md:grid-cols-1 gap-6 mb-8">
                    <div className="premium-card p-8 rounded-2xl border-2 border-gold-400/20">
                        <h3 className="text-2xl md:text-3xl font-display font-semibold text-gold-400 mb-6 text-center">📤 Wyślij link do {challenge.invitee_name}</h3>
                        <p className="text-gray-300 text-lg mb-6 text-center">
                            Wybierz sposób wysłania zaproszenia:
                        </p>

                        <div className="space-y-4 mb-6">
                            <a
                                href={`https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareableUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/foto-wyzwanie/akceptuj/${challenge.unique_link}`)}&app_id=YOUR_APP_ID&redirect_uri=${typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : ''}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full px-8 py-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all text-center text-2xl font-bold shadow-lg hover:shadow-xl border-2 border-blue-400"
                            >
                                💬 Wyślij przez Messengera
                            </a>

                            <a
                                href={`https://wa.me/${challenge.invitee_contact}?text=${encodeURIComponent(`Cześć ${challenge.invitee_name}! Zapraszam Cię do Foto Wyzwania: ${shareableUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/foto-wyzwanie/akceptuj/${challenge.unique_link}`}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full px-8 py-5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all text-center text-xl font-semibold shadow-lg hover:shadow-xl"
                            >
                                📱 WhatsApp
                            </a>

                            <a
                                href={`mailto:${challenge.invitee_contact}?subject=${encodeURIComponent('Zaproszenie do Foto Wyzwania')}&body=${encodeURIComponent(`Cześć ${challenge.invitee_name}!\n\nZapraszam Cię do udziału w Foto Wyzwaniu!\n\nKliknij tutaj: ${shareableUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/foto-wyzwanie/akceptuj/${challenge.unique_link}`}`)}`}
                                className="block w-full px-8 py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all text-center text-xl font-semibold shadow-lg hover:shadow-xl"
                            >
                                📧 Email
                            </a>

                            <a
                                href={`sms:${challenge.invitee_contact}?body=${encodeURIComponent(`Cześć ${challenge.invitee_name}! Zapraszam Cię do Foto Wyzwania: ${shareableUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/foto-wyzwanie/akceptuj/${challenge.unique_link}`}`)}`}
                                className="block w-full px-8 py-5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all text-center text-xl font-semibold shadow-lg hover:shadow-xl"
                            >
                                📱 SMS
                            </a>
                        </div>

                        <div className="pt-6 border-t border-gray-800">
                            <p className="text-gray-400 text-sm mb-3 text-center">Lub skopiuj link:</p>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={shareableUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/foto-wyzwanie/akceptuj/${challenge.unique_link}`}
                                    readOnly
                                    className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
                                />
                                <button
                                    onClick={copyLink}
                                    className="px-6 py-3 bg-gold-400 text-black rounded-lg hover:bg-gold-500 transition-colors font-semibold"
                                >
                                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>
                            {copied && <p className="text-green-400 text-sm mt-2 text-center">✓ Link skopiowany!</p>}
                        </div>
                    </div>

                    <div className="premium-card p-8 rounded-2xl">
                        <h3 className="text-2xl font-display font-semibold text-gold-400 mb-6">📊 Szczegóły wyzwania</h3>
                        <div className="space-y-4 text-base">
                            <div className="flex justify-between py-3 border-b border-gray-800">
                                <span className="text-gray-400">Pakiet:</span>
                                <span className="text-white font-semibold">{challenge.package?.name}</span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-gray-800">
                                <span className="text-gray-400">Cena po rabacie:</span>
                                <div className="text-right">
                                    <span className="text-gold-400 font-bold text-xl">
                                        {challenge.package?.challenge_price} zł
                                    </span>
                                    <span className="ml-3 text-gray-500 line-through text-sm">
                                        {challenge.package?.base_price} zł
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between py-3 border-b border-gray-800">
                                <span className="text-gray-400">Oszczędność:</span>
                                <span className="text-green-400 font-semibold text-lg">
                                    {challenge.discount_amount} zł ({challenge.discount_percentage}%)
                                </span>
                            </div>
                            {challenge.location && (
                                <div className="flex justify-between py-3">
                                    <span className="text-gray-400">Lokalizacja:</span>
                                    <span className="text-white font-semibold">{challenge.location.name}</span>
                                </div>
                            )}
                            {challenge.custom_location && (
                                <div className="flex justify-between py-3">
                                    <span className="text-gray-400">Lokalizacja:</span>
                                    <span className="text-white font-semibold">{challenge.custom_location}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Session Date (if scheduled) */}
                {challenge.session_date && (
                    <div className="premium-card p-6 rounded-xl mb-8">
                        <h3 className="text-lg font-semibold text-gold-400 mb-2">Termin sesji</h3>
                        <p className="text-2xl font-display text-white">
                            {new Date(challenge.session_date).toLocaleDateString('pl-PL', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
