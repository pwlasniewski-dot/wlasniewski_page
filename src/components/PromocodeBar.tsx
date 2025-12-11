'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Tag } from 'lucide-react';

interface PromoBarProps {
    code?: string;
    discount?: number;
    discountType?: 'percentage' | 'fixed';
    expiryDate?: string;
    onDismiss?: () => void;
}

export default function PromocodeBar({
    code = 'ZIMA2024',
    discount = 20,
    discountType = 'percentage',
    expiryDate,
    onDismiss
}: PromoBarProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [copied, setCopied] = useState(false);

    const handleClose = () => {
        setIsVisible(false);
        onDismiss?.();
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        // Auto-dismiss if localStorage has a marker for this code
        const dismissed = localStorage.getItem(`promo-${code}-dismissed`);
        if (dismissed) {
            setIsVisible(false);
        }
    }, [code]);

    if (!isVisible || !code) return null;

    const discountText = discountType === 'percentage' ? `${discount}%` : `${discount} zł`;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="fixed top-32 left-4 right-4 sm:left-auto sm:right-8 z-40 max-w-sm"
            >
                <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-gold-500 via-gold-400 to-amber-500 opacity-95 backdrop-blur-md"></div>

                    {/* Animated border */}
                    <motion.div
                        className="absolute inset-0 opacity-30"
                        animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        style={{
                            backgroundImage: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                            backgroundSize: '200% 200%'
                        }}
                    />

                    {/* Content */}
                    <div className="relative p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                {/* Header */}
                                <div className="flex items-center gap-2 mb-2">
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Tag className="w-5 h-5 text-white" />
                                    </motion.div>
                                    <span className="font-bold text-white text-sm sm:text-base">KOD PROMOCYJNY DOSTĘPNY!</span>
                                </div>

                                {/* Main message */}
                                <p className="text-white font-semibold mb-3 text-sm sm:text-base">
                                    Zaoszczędź <span className="text-2xl">{discountText}</span> na rezerwacji
                                </p>

                                {/* Promo code box */}
                                <motion.button
                                    onClick={handleCopy}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full px-4 py-3 bg-white/20 hover:bg-white/30 border-2 border-white/40 rounded-xl text-white font-mono font-bold text-lg sm:text-xl mb-3 transition-all flex items-center justify-between gap-2"
                                >
                                    <span>{code}</span>
                                    <motion.div
                                        animate={{ scale: copied ? 1.2 : 1 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {copied ? (
                                            <Check className="w-5 h-5" />
                                        ) : (
                                            <Copy className="w-5 h-5" />
                                        )}
                                    </motion.div>
                                </motion.button>

                                {/* Expiry date if provided */}
                                {expiryDate && (
                                    <p className="text-white/80 text-xs sm:text-sm">
                                        ⏰ Ważny do: <strong>{expiryDate}</strong>
                                    </p>
                                )}
                            </div>

                            {/* Close button */}
                            <motion.button
                                onClick={handleClose}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex-shrink-0 p-2 hover:bg-white/20 rounded-lg transition-all"
                                aria-label="Zamknij"
                            >
                                <X className="w-5 h-5 text-white" />
                            </motion.button>
                        </div>
                    </div>

                    {/* Pulsing edge effect */}
                    <motion.div
                        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-white via-transparent to-white"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </div>

                {/* Instruction text below */}
                <p className="text-white/70 text-xs mt-2 text-center">
                    Kliknij żeby skopiować kod
                </p>
            </motion.div>
        </AnimatePresence>
    );
}
