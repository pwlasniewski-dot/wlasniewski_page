'use client';

// Social Proof Banner with animated stats

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SocialProofBannerProps {
    stats?: {
        accepted_this_month?: number;
        completed_sessions?: number;
        remaining_monthly_slots?: number;
    };
    message?: string;
}

export default function SocialProofBanner({ stats, message }: SocialProofBannerProps) {
    const [displayStats, setDisplayStats] = useState({
        accepted: 0,
        completed: 0,
    });

    useEffect(() => {
        if (stats) {
            // Animate numbers counting up
            const duration = 1500;
            const steps = 60;
            const interval = duration / steps;

            let step = 0;
            const timer = setInterval(() => {
                step++;
                const progress = step / steps;

                setDisplayStats({
                    accepted: Math.floor((stats.accepted_this_month || 0) * progress),
                    completed: Math.floor((stats.completed_sessions || 0) * progress),
                });

                if (step >= steps) {
                    clearInterval(timer);
                    setDisplayStats({
                        accepted: stats.accepted_this_month || 0,
                        completed: stats.completed_sessions || 0,
                    });
                }
            }, interval);

            return () => clearInterval(timer);
        }
    }, [stats]);

    if (!stats) return null;

    const defaultMessage = `W tym miesiącu ${displayStats.accepted} par przyjęło wyzwanie`;
    const displayMessage = message?.replace('{count}', String(displayStats.accepted)) || defaultMessage;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full bg-gradient-to-r from-black via-gold-900/20 to-black border-y border-gold-400/30 py-4 px-6"
        >
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center">
                    {/* Main Message */}
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🎉</span>
                        <p className="text-gold-100 text-lg md:text-xl font-semibold">
                            {displayMessage}
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-8 bg-gold-400/30" />

                    {/* Completed Sessions */}
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">📸</span>
                        <p className="text-gray-300">
                            <span className="text-gold-400 font-bold text-xl">{displayStats.completed}</span>
                            {' '}zakończonych sesji
                        </p>
                    </div>

                    {/* Remaining Slots (if enabled) */}
                    {stats.remaining_monthly_slots !== undefined && (
                        <>
                            <div className="hidden md:block w-px h-8 bg-gold-400/30" />
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">⚡</span>
                                <p className="text-gray-300">
                                    Zostało tylko{' '}
                                    <span className="text-gold-400 font-bold text-xl">
                                        {stats.remaining_monthly_slots}
                                    </span>
                                    {' '}miejsc w tym miesiącu
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
