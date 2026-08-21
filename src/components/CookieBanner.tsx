'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Link from 'next/link';

export default function CookieBanner({ variant = 'default' }: { variant?: 'default' | 'aero' }) {
    const [showBanner, setShowBanner] = useState(false);
    const [hasDecision, setHasDecision] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        setHasDecision(Boolean(consent));
        if (!consent) {
            // Show banner after a short delay
            setTimeout(() => setShowBanner(true), 1000);
        }
    }, []);

    const acceptCookies = () => {
        localStorage.setItem('cookie_consent', 'accepted');
        setHasDecision(true);
        window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: 'accepted' }));
        setShowBanner(false);
    };

    const rejectCookies = () => {
        localStorage.setItem('cookie_consent', 'rejected');
        localStorage.removeItem('analytics_v2_user_id');
        localStorage.removeItem('analytics_v2_session');
        for (const cookie of document.cookie.split(';')) {
            const name = cookie.split('=')[0]?.trim();
            if (!name || !/^(_ga|_gid|_gat|_gcl|_fbp|_fbc)/.test(name)) continue;
            document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
            document.cookie = `${name}=; Max-Age=0; path=/; domain=.${location.hostname}; SameSite=Lax`;
        }
        setHasDecision(true);
        window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: 'rejected' }));
        setShowBanner(false);
        // Usuwa również już załadowane integracje zewnętrzne (GA/GTM/Meta), jeśli
        // użytkownik wycofał zgodę w trakcie bieżącej sesji.
        window.location.reload();
    };

    const isAero = variant === 'aero';

    if (!showBanner) {
        return hasDecision ? (
            <button
                type="button"
                onClick={() => setShowBanner(true)}
                className={`fixed bottom-3 left-3 z-40 rounded-full px-3 py-2 text-xs shadow-lg ${isAero ? 'border border-[#cbd9e3] bg-white/95 font-semibold text-[#38556e] hover:text-[#1f6feb]' : 'border border-zinc-700 bg-zinc-900/90 text-zinc-300 hover:text-white'}`}
            >
                Ustawienia cookies
            </button>
        ) : null;
    }

    return (
        <div className={`fixed bottom-0 left-0 right-0 z-50 border-t p-4 shadow-2xl backdrop-blur-sm ${isAero ? 'border-[#d2dee7] bg-white/95' : 'border-zinc-800 bg-zinc-900/95'}`}>
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className={`flex-1 text-sm ${isAero ? 'text-[#5a6f81]' : 'text-zinc-300'}`}>
                    <p className="mb-2">
                        <strong className={isAero ? 'text-[#173754]' : 'text-white'}>Ta strona używa plików cookies</strong>
                    </p>
                    <p>
                        Wykorzystujemy pliki cookies do zapewnienia prawidłowego działania strony oraz analizy ruchu.
                        Więcej informacji znajdziesz w naszej{' '}
                        <Link href="/polityka-prywatnosci" className={isAero ? 'font-semibold text-[#1b5fa7] hover:underline' : 'text-gold-400 hover:underline'}>
                            Polityce Prywatności
                        </Link>.
                    </p>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                    <button
                        onClick={rejectCookies}
                        className={`px-4 py-2 text-sm transition-colors ${isAero ? 'font-semibold text-[#607588] hover:text-[#173754]' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Odrzuć
                    </button>
                    <button
                        onClick={acceptCookies}
                        className={`rounded px-6 py-2 text-sm font-bold transition-colors ${isAero ? 'bg-[#ff5d37] text-white hover:bg-[#e94c28]' : 'bg-gold-500 text-black hover:bg-gold-400'}`}
                    >
                        Akceptuję
                    </button>
                </div>
                <button
                    onClick={rejectCookies}
                    className={`absolute right-2 top-2 transition-colors md:relative md:right-0 md:top-0 ${isAero ? 'text-[#8296a7] hover:text-[#173754]' : 'text-zinc-500 hover:text-white'}`}
                    aria-label="Zamknij"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
