'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Phone } from 'lucide-react';

export default function MobileReservationButton() {
    const [isVisible, setIsVisible] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show after scrolling down 300px
            if (currentScrollY > 300) {
                // Hide when scrolling up fast, show when scrolling down or stable
                if (currentScrollY < lastScrollY - 50) {
                    setIsVisible(false);
                } else {
                    setIsVisible(true);
                }
            } else {
                setIsVisible(false);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25 }}
                    className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
                >
                    {/* Gradient fade */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none" style={{ height: '120%', top: '-20%' }} />

                    {/* Buttons */}
                    <div className="relative flex gap-3 p-4 pb-6">
                        <a
                            href="tel:+48530788694"
                            className="flex-1 flex items-center justify-center gap-2 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors border border-zinc-700"
                        >
                            <Phone className="w-5 h-5" />
                            <span>Zadzwoń</span>
                        </a>
                        <Link
                            href="/rezerwacja"
                            className="flex-[2] flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-black rounded-xl font-bold transition-all shadow-lg shadow-gold-500/20"
                        >
                            <Calendar className="w-5 h-5" />
                            <span>Zarezerwuj sesję</span>
                        </Link>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
