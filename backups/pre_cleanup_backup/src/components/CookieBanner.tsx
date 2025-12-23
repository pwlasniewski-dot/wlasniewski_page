'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Link from 'next/link';

export default function CookieBanner() {
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            // Show banner after a short delay
            setTimeout(() => setShowBanner(true), 1000);
        }
    }, []);

    const acceptCookies = () => {
        localStorage.setItem('cookie_consent', 'accepted');
        setShowBanner(false);
    };

    const rejectCookies = () => {
        localStorage.setItem('cookie_consent', 'rejected');
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800 shadow-2xl">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 text-sm text-zinc-300">
                    <p className="mb-2">
                        <strong className="text-white">Ta strona używa plików cookies</strong>
                    </p>
                    <p>
                        Wykorzystujemy pliki cookies do zapewnienia prawidłowego działania strony oraz analizy ruchu.
                        Więcej informacji znajdziesz w naszej{' '}
                        <Link href="/polityka-prywatnosci" className="text-gold-400 hover:underline">
                            Polityce Prywatności
                        </Link>.
                    </p>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                    <button
                        onClick={rejectCookies}
                        className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                        Odrzuć
                    </button>
                    <button
                        onClick={acceptCookies}
                        className="px-6 py-2 bg-gold-500 text-black text-sm font-medium rounded hover:bg-gold-400 transition-colors"
                    >
                        Akceptuję
                    </button>
                </div>
                <button
                    onClick={rejectCookies}
                    className="absolute top-2 right-2 md:relative md:top-0 md:right-0 text-zinc-500 hover:text-white transition-colors"
                    aria-label="Zamknij"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
