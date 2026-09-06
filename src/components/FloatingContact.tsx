'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Phone, Mail, Facebook } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { hideFloatingContact, readFloatingFacebook } from '@/lib/floating-facebook';

export default function FloatingContact() {
    const [isOpen, setIsOpen] = useState(false);
    const [facebook, setFacebook] = useState(() => readFloatingFacebook(null));
    const [cookiesVisible, setCookiesVisible] = useState(true);
    const pathname = usePathname();
    const whatsappUrl = 'https://wa.me/48530788694?text=' + encodeURIComponent('Cześć Przemek! Piszę ze strony wlasniewski.pl — chciał(a)bym zapytać o sesję.');
    const phoneUrl = 'tel:+48530788694';
    const emailUrl = 'mailto:pwlasniewski@gmail.com?subject=Zapytanie%20o%20sesj%C4%99';

    useEffect(() => {
        const controller = new AbortController();
        fetch('/api/settings/public', { signal: controller.signal })
            .then(response => response.ok ? response.json() : null)
            .then(data => {
                if (data?.success && data.settings?.footer_config) {
                    setFacebook(readFloatingFacebook(JSON.parse(data.settings.footer_config)));
                }
            }).catch(() => { /* Safe defaults when CMS is unavailable. */ });
        return () => controller.abort();
    }, []);

    useEffect(() => {
        try { setCookiesVisible(!localStorage.getItem('cookie_consent')); } catch { setCookiesVisible(true); }
        const visibility = (event: Event) => setCookiesVisible(Boolean((event as CustomEvent).detail));
        const decision = () => setCookiesVisible(false);
        window.addEventListener('cookie-banner-visibility', visibility);
        window.addEventListener('cookie-consent-changed', decision);
        return () => {
            window.removeEventListener('cookie-banner-visibility', visibility);
            window.removeEventListener('cookie-consent-changed', decision);
        };
    }, []);

    useEffect(() => { setIsOpen(false); }, [pathname]);

    const trackClick = (channel: string) => {
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'contact_click', { channel, page: pathname });
        }
    };

    if (hideFloatingContact(pathname) || cookiesVisible) return null;

    return (
        <div className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] md:bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-40 flex flex-col items-end gap-3 pointer-events-none print:hidden">
            <AnimatePresence>
                {isOpen && (
                    <div className="flex flex-col gap-2.5 pointer-events-auto mb-2">
                        {/* Telefon — tap to call (najszybsza konwersja na mobile) */}
                        <motion.a
                            initial={{ opacity: 0, x: 20, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.8 }}
                            transition={{ delay: 0.05 }}
                            href={phoneUrl}
                            onClick={() => trackClick('phone')}
                            className="flex items-center gap-3 bg-white text-zinc-900 pl-4 pr-3 py-2.5 rounded-full shadow-lg border border-zinc-200 hover:bg-stone-50 group whitespace-nowrap"
                        >
                            <span className="text-sm font-medium">Zadzwoń</span>
                            <div className="w-10 h-10 rounded-full bg-[#5b554e] flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                                <Phone className="w-5 h-5" />
                            </div>
                        </motion.a>

                        {/* WhatsApp */}
                        <motion.a
                            initial={{ opacity: 0, x: 20, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.8 }}
                            transition={{ delay: 0.1 }}
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackClick('whatsapp')}
                            className="flex items-center gap-3 bg-white text-zinc-900 pl-4 pr-3 py-2.5 rounded-full shadow-lg border border-zinc-200 hover:bg-zinc-50 group whitespace-nowrap"
                        >
                            <span className="text-sm font-medium">WhatsApp</span>
                            <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                                <Send className="w-5 h-5" />
                            </div>
                        </motion.a>

                        {/* Email */}
                        <motion.a
                            initial={{ opacity: 0, x: 20, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.8 }}
                            transition={{ delay: 0.15 }}
                            href={emailUrl}
                            onClick={() => trackClick('email')}
                            className="flex items-center gap-3 bg-white text-zinc-900 pl-4 pr-3 py-2.5 rounded-full shadow-lg border border-zinc-200 hover:bg-zinc-50 group whitespace-nowrap"
                        >
                            <span className="text-sm font-medium">Email</span>
                            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                                <Mail className="w-5 h-5" />
                            </div>
                        </motion.a>
                    </div>
                )}
            </AnimatePresence>

            {/* Główny przycisk + label "Napisz do mnie!" */}
            <div className="flex items-center gap-3 pointer-events-auto">
                {!isOpen && facebook.enabled && facebook.url && (
                    <a href={facebook.url} target="_blank" rel="noopener noreferrer"
                        aria-label={`${facebook.label} — otwiera się w nowej karcie`}
                        className="inline-flex min-h-12 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-800 shadow-lg hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700">
                        <Facebook aria-hidden="true" className="h-5 w-5 text-[#0866ff]" />
                        <span>{facebook.label}</span>
                    </a>
                )}
                {!isOpen && (
                    <motion.span
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.5 }}
                        className="hidden lg:inline-block bg-zinc-900/95 text-white text-sm font-medium px-3 py-2 rounded-lg shadow-lg border border-white/10"
                    >
                        Napisz do mnie!
                    </motion.span>
                )}
                <motion.button
                    layout
                    aria-label={isOpen ? 'Zamknij menu kontaktu' : 'Otwórz menu kontaktu'}
                    aria-expanded={isOpen}
                    onClick={() => setIsOpen(!isOpen)}
                    className={`h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 relative ${isOpen ? 'bg-zinc-900 text-white rotate-90' : 'bg-[#5b554e] text-white hover:scale-105 hover:bg-[#3d3934]'}`}
                >
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                                <X className="w-7 h-7" />
                            </motion.div>
                        ) : (
                            <motion.div key="message" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                                <MessageCircle className="w-7 h-7 fill-current" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>
        </div>
    );
}
