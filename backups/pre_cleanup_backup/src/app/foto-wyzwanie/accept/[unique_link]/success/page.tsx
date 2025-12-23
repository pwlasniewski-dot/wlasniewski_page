'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, Facebook, MessageCircle, Mail, Copy, Trophy } from 'lucide-react';
import { useState } from 'react';

export default function SuccessPage() {
    const params = useParams();
    const uniqueLink = params.unique_link as string;
    const [copied, setCopied] = useState(false);

    const galleryUrl = `${window?.location.origin}/foto-wyzwanie/gallery/${uniqueLink}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(galleryUrl)}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Właśnie zaakceptowałem wyzwanie fotograficzne! Zapraszam do obejrzenia naszych zdjęć: ${galleryUrl}`)}`;
    const mailUrl = `mailto:?subject=Nasze foto-wyzwanie&body=${encodeURIComponent(`Hej!\n\nZaakceptowaliśmy wyzwanie fotograficzne! Sprawdź nasze zdjęcia:\n${galleryUrl}`)}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(galleryUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-white py-20 px-4">
            {/* Confetti animation background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {Array.from({ length: 50 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute animate-pulse"
                        style={{
                            left: Math.random() * 100 + '%',
                            top: Math.random() * 100 + '%',
                            fontSize: Math.random() * 2 + 1 + 'rem',
                            animation: `float-up ${Math.random() * 5 + 3}s ease-in infinite`,
                            animationDelay: Math.random() * 2 + 's'
                        }}
                    >
                        {['🎉', '🎊', '💝', '✨', '🌟'][Math.floor(Math.random() * 5)]}
                    </div>
                ))}
            </div>

            <div className="max-w-2xl mx-auto relative z-10">
                {/* Main celebration card */}
                <div className="text-center mb-12">
                    <div className="text-8xl mb-6 animate-bounce">🎉</div>
                    <h1 className="text-5xl md:text-6xl font-display font-bold mb-4 bg-gradient-to-r from-pink-400 via-gold-400 to-pink-400 bg-clip-text text-transparent">
                        Hurra!
                    </h1>
                    <p className="text-2xl text-zinc-300 mb-2">
                        Zaakceptowałeś wyzwanie!
                    </p>
                    <p className="text-lg text-zinc-400 mb-8">
                        Twoja rezerwacja została potwierdzona 🎊
                    </p>
                </div>

                {/* Info cards */}
                <div className="grid md:grid-cols-2 gap-4 mb-12">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                        <div className="text-3xl mb-2">📧</div>
                        <h3 className="font-bold mb-2">Email potwierdzenia</h3>
                        <p className="text-sm text-zinc-400">
                            Wysłaliśmy potwierdzenie rezerwacji na Twój email
                        </p>
                    </div>

                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                        <div className="text-3xl mb-2">🎞️</div>
                        <h3 className="font-bold mb-2">Twoja galeria</h3>
                        <p className="text-sm text-zinc-400">
                            Po sesji znajdziesz tu wszystkie zdjęcia
                        </p>
                    </div>

                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
                        <div className="text-3xl mb-2">💌</div>
                        <h3 className="font-bold mb-2">Przypomnienia</h3>
                        <p className="text-sm text-zinc-400">
                            Pošlemy Ci wiadomość dzień przed sesją
                        </p>
                    </div>

                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
                        <div className="text-3xl mb-2">📱</div>
                        <h3 className="font-bold mb-2">Udostępniaj</h3>
                        <p className="text-sm text-zinc-400">
                            Pochwal się galeria ze znajomymi!
                        </p>
                    </div>
                </div>

                {/* Gallery Link Section */}
                <div className="bg-gradient-to-r from-gold-500/20 to-pink-500/20 border border-gold-500/50 rounded-xl p-8 mb-8">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <Trophy className="text-gold-400" />
                        Link do Twojej galerii
                    </h2>

                    <div className="bg-zinc-900 p-4 rounded-lg mb-4 break-all text-sm text-zinc-400 border border-zinc-700">
                        {galleryUrl}
                    </div>

                    <button
                        onClick={handleCopy}
                        className={`w-full py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 ${
                            copied
                                ? 'bg-green-600 text-white'
                                : 'bg-gold-500 hover:bg-gold-600 text-black'
                        }`}
                    >
                        <Copy size={20} />
                        {copied ? 'Skopiowano!' : 'Kopiuj link'}
                    </button>
                </div>

                {/* Social Share Section */}
                <div className="bg-zinc-800/50 rounded-xl p-8 border border-zinc-700 mb-8">
                    <h3 className="text-xl font-bold mb-6">Pochwal się na mediach społecznościowych!</h3>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <a
                            href={facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-4 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <Facebook size={24} />
                            Facebook
                        </a>

                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-4 rounded-lg font-bold bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <MessageCircle size={24} />
                            WhatsApp
                        </a>

                        <a
                            href={mailUrl}
                            className="py-4 rounded-lg font-bold bg-gray-600 hover:bg-gray-700 text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <Mail size={24} />
                            Email
                        </a>

                        <button
                            onClick={handleCopy}
                            className="py-4 rounded-lg font-bold bg-zinc-700 hover:bg-zinc-600 text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <Copy size={24} />
                            Kopiuj link
                        </button>
                    </div>

                    <p className="text-sm text-zinc-400 text-center">
                        Udostępnij galerię przyjaciołom! Im więcej osób zobaczy Wasze zdjęcia, tym lepiej 😊
                    </p>
                </div>

                {/* Next Steps */}
                <div className="bg-zinc-800/50 rounded-xl p-8 border border-zinc-700 mb-8">
                    <h3 className="text-xl font-bold mb-4">Co dalej?</h3>

                    <ol className="space-y-3 text-zinc-300">
                        <li className="flex gap-3">
                            <span className="font-bold text-gold-400 flex-shrink-0">1.</span>
                            <span>Czekaj na potwierdzenie szczegółów sesji na mailu</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-bold text-gold-400 flex-shrink-0">2.</span>
                            <span>Dzień przed sesją wyślemy Ci przypomnienie i instrukcje</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-bold text-gold-400 flex-shrink-0">3.</span>
                            <span>Przyjdź do wybranej lokalizacji o umówionej godzinie</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-bold text-gold-400 flex-shrink-0">4.</span>
                            <span>Po sesji zdjęcia pojawią się w Twojej galerii</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-bold text-gold-400 flex-shrink-0">5.</span>
                            <span>Pochwal się galeria na mediach społecznościowych!</span>
                        </li>
                    </ol>
                </div>

                {/* CTAs */}
                <div className="flex gap-4 mb-8">
                    <Link
                        href="/foto-wyzwanie"
                        className="flex-1 py-3 rounded-lg font-bold border border-zinc-600 hover:border-zinc-500 transition-colors text-center"
                    >
                        Wróć do wyzwań
                    </Link>
                    <Link
                        href="/"
                        className="flex-1 py-3 rounded-lg font-bold bg-gold-500 hover:bg-gold-600 text-black transition-colors text-center"
                    >
                        Strona główna
                    </Link>
                </div>

                {/* Footer message */}
                <div className="text-center text-zinc-500">
                    <p>
                        Czy masz pytania? Skontaktuj się na{' '}
                        <a href="mailto:rezerwacje@wlasniewski.pl" className="text-gold-400 hover:text-gold-300">
                            rezerwacje@wlasniewski.pl
                        </a>
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes float-up {
                    0% {
                        transform: translateY(0) translateX(0);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-100vh) translateX(20px);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
}
