'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 500) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    onClick={scrollToTop}
                    className="fixed bottom-10 left-10 z-[70] p-4 bg-zinc-900/50 backdrop-blur-2xl border border-white/10 text-yellow-500 rounded-2xl hover:bg-yellow-500 hover:text-black transition-all shadow-[0_10px_40px_rgba(0,0,0,0.5)] group"
                    aria-label="Wróć na górę"
                >
                    <ArrowUp size={24} className="group-hover:-translate-y-1 transition-transform" />

                    {/* Ghost effect border */}
                    <div className="absolute inset-0 rounded-2xl border border-yellow-500/0 group-hover:border-yellow-500/50 transition-colors animate-pulse" />
                </motion.button>
            )}
        </AnimatePresence>
    );
}
