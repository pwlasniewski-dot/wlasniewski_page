'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight, X, Gift } from 'lucide-react';

interface PromoMessage {
    id: number;
    title: string;
    message: string;
    cta_text: string;
    icon: string;
    colors: {
        bg: string;
        accent: string;
    };
}

export default function GiftCardPromoBar() {
    const [isVisible, setIsVisible] = useState(true);
    const [currentMessage, setCurrentMessage] = useState(0);
    const [messages, setMessages] = useState<PromoMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch promo settings from admin
        const fetchPromoSettings = async () => {
            try {
                const res = await fetch('/api/admin/gift-card-promo');
                const data = await res.json();
                
                if (data.enabled && data.messages) {
                    setMessages(data.messages);
                    setIsVisible(true);
                } else {
                    setIsVisible(false);
                }
            } catch (error) {
                console.error('Failed to fetch promo settings');
                setIsVisible(false);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPromoSettings();
    }, []);

    // Auto-rotate messages
    useEffect(() => {
        if (!isVisible || messages.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentMessage((prev) => (prev + 1) % messages.length);
        }, 6000);

        return () => clearInterval(interval);
    }, [messages.length, isVisible]);

    if (isLoading || !isVisible || messages.length === 0) return null;

    const message = messages[currentMessage];

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                    className="fixed top-20 left-0 right-0 z-40"
                >
                    <div
                        className="relative overflow-hidden mx-4 rounded-2xl shadow-2xl border border-opacity-30"
                        style={{
                            background: `linear-gradient(135deg, ${message.colors.bg} 0%, ${message.colors.accent}20 100%)`,
                            borderColor: message.colors.accent
                        }}
                    >
                        {/* Animated background pattern */}
                        <div className="absolute inset-0 opacity-20">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-0"
                            >
                                {Array(12).fill(0).map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute text-4xl opacity-20"
                                        style={{
                                            left: `${(i % 4) * 25}%`,
                                            top: `${Math.floor(i / 4) * 33}%`,
                                            transform: `rotate(${i * 30}deg)`
                                        }}
                                    >
                                        {message.icon}
                                    </div>
                                ))}
                            </motion.div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 px-6 py-4 md:py-5 flex items-center justify-between gap-4">
                            {/* Left - Icon and Text */}
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="text-3xl md:text-4xl flex-shrink-0"
                                >
                                    {message.icon}
                                </motion.div>

                                <div className="flex-1 min-w-0">
                                    <motion.h3
                                        key={`title-${currentMessage}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                        className="font-bold text-white text-sm md:text-base truncate"
                                    >
                                        {message.title}
                                    </motion.h3>
                                    <motion.p
                                        key={`msg-${currentMessage}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3, delay: 0.05 }}
                                        className="text-white/85 text-xs md:text-sm truncate"
                                    >
                                        {message.message}
                                    </motion.p>
                                </div>
                            </div>

                            {/* Right - CTA Button */}
                            <Link
                                href="/karta-podarunkowa"
                                className="flex-shrink-0 inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold text-black transition-all hover:shadow-lg hover:scale-105 whitespace-nowrap text-sm md:text-base"
                                style={{ backgroundColor: message.colors.accent }}
                            >
                                {message.cta_text}
                                <ChevronRight className="w-4 h-4" />
                            </Link>

                            {/* Close Button */}
                            <button
                                onClick={() => setIsVisible(false)}
                                className="flex-shrink-0 p-2 text-white/70 hover:text-white transition-colors"
                                aria-label="Close promo bar"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Progress dots */}
                        {messages.length > 1 && (
                            <div className="relative z-10 flex items-center justify-center gap-2 px-6 py-3 border-t border-white/10">
                                {messages.map((_, idx) => (
                                    <motion.button
                                        key={idx}
                                        onClick={() => setCurrentMessage(idx)}
                                        className={`h-2 rounded-full transition-all ${
                                            idx === currentMessage
                                                ? 'w-8 bg-white'
                                                : 'w-2 bg-white/40 hover:bg-white/60'
                                        }`}
                                        whileHover={{ scale: 1.2 }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
