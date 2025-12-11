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
                    initial={{ x: -400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -400, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 80, damping: 25 }}
                    className="fixed left-0 top-1/2 -translate-y-1/2 z-40 w-96"
                >
                    <div
                        className="relative overflow-hidden rounded-r-2xl shadow-2xl border border-opacity-30 px-4 py-6 md:py-8"
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
                        <div className="relative z-10 px-4 py-2 flex flex-col items-start justify-between gap-3">
                            {/* Icon and Text */}
                            <div className="flex items-start gap-3 w-full">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="text-3xl flex-shrink-0"
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
                                        className="font-bold text-white text-sm line-clamp-2"
                                    >
                                        {message.title}
                                    </motion.h3>
                                    <motion.p
                                        key={`msg-${currentMessage}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3, delay: 0.05 }}
                                        className="text-white/85 text-xs line-clamp-3"
                                    >
                                        {message.message}
                                    </motion.p>
                                </div>
                            </div>

                            {/* CTA Button - Full width */}
                            <Link
                                href="/karta-podarunkowa"
                                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold text-black text-xs transition-all hover:shadow-lg hover:scale-105 whitespace-nowrap"
                                style={{ backgroundColor: message.colors.accent }}
                            >
                                {message.cta_text}
                                <ChevronRight className="w-3 h-3" />
                            </Link>

                            {/* Close Button */}
                            <button
                                onClick={() => setIsVisible(false)}
                                className="absolute top-2 right-2 p-1 text-white/70 hover:text-white transition-colors"
                                aria-label="Close promo bar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
