'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Phone, Mail } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function FloatingContact() {
    const [isOpen, setIsOpen] = useState(false);
    const [isAdminPanel, setIsAdminPanel] = useState(false);
    const pathname = usePathname();
    const whatsappUrl = 'https://wa.me/48530788694?text=' + encodeURIComponent('Cześć Przemek! Piszę ze strony wlasniewski.pl — chciał(a)bym zapytać o sesję.');
    const phoneUrl = 'tel:+48530788694';
    const emailUrl = 'mailto:kontakt@wlasniewski.pl?subject=Zapytanie%20o%20sesj%C4%99';

    useEffect(() => {
        setIsAdminPanel(pathname?.startsWith('/admin') || false);
    }, [pathname]);

    const trackClick = (channel: string) => {
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'contact_click', { channel, page: pathname });
        }
    };

    if (isAdminPanel) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3 pointer-events-none">
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
                            className="flex items-center gap-3 bg-white text-zinc-900 pl-4 pr-3 py-2.5 rounded-full shadow-lg border border-zinc-200 hover:bg-amber-50 group whitespace-nowrap"
                        >
                            <span className="text-sm font-medium">Zadzwoń</span>
                            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
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
                {!isOpen && (
                    <motion.span
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.5 }}
                        className="hidden sm:inline-block bg-zinc-900/95 text-white text-sm font-medium px-3 py-2 rounded-lg shadow-lg border border-amber-400/30"
                    >
                        Napisz do mnie!
                    </motion.span>
                )}
                <motion.button
                    layout
                    aria-label={isOpen ? 'Zamknij menu kontaktu' : 'Otwórz menu kontaktu'}
                    onClick={() => setIsOpen(!isOpen)}
                    className={`h-16 w-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 relative ${isOpen ? 'bg-zinc-900 text-white rotate-90' : 'bg-amber-500 text-white hover:scale-105 hover:bg-amber-400'}`}
                >
                    {!isOpen && (
                        <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping -z-10"></span>
                    )}
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
