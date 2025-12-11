'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function FloatingContact() {
    const [isOpen, setIsOpen] = useState(false);
    const [isAdminPanel, setIsAdminPanel] = useState(false);
    const pathname = usePathname();
    const whatsappUrl = 'https://wa.me/48530788694';

    useEffect(() => {
        // Hide in admin panel
        setIsAdminPanel(pathname?.startsWith('/admin') || false);
    }, [pathname]);

    if (isAdminPanel) {
        return null; // Don't render in admin panel
    }

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3 pointer-events-none">
            {/* Panel opcji */}
            <AnimatePresence>
                {isOpen && (
                    <div className="flex flex-col gap-3 pointer-events-auto mb-2">
                        {/* WhatsApp */}
                        <motion.a
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.8 }}
                            transition={{ delay: 0.1 }}
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 bg-white text-zinc-900 pl-4 pr-3 py-2.5 rounded-full shadow-lg border border-zinc-200 hover:bg-zinc-50 group whitespace-nowrap"
                        >
                            <span className="text-sm font-medium">WhatsApp</span>
                            <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                                <Send className="w-5 h-5" />
                            </div>
                        </motion.a>
                    </div>
                )}
            </AnimatePresence>

            {/* Główny przycisk */}
            <motion.button
                layout
                onClick={() => setIsOpen(!isOpen)}
                className={`pointer-events-auto h-16 w-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 relative ${isOpen ? 'bg-zinc-900 text-white rotate-90' : 'bg-gold-500 text-white hover:scale-105 hover:bg-gold-400'
                    }`}
            >
                {/* Ping animation effect when closed */}
                {!isOpen && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75 animate-ping -z-10"></span>
                )}

                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <X className="w-7 h-7" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="message"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                        >
                            <MessageCircle className="w-7 h-7 fill-current" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
}
