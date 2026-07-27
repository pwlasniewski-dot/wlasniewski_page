'use client';

// Social Proof Banner with animated stats

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [localStats, setLocalStats] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(true);
    const [isEnabled, setIsEnabled] = useState(Boolean(stats));

    useEffect(() => {
        // Check if user dismissed this banner
        const isDismissed = localStorage.getItem('social-proof-banner-dismissed');
        if (isDismissed === 'true') {
            setIsVisible(false);
        }
    }, []);

    useEffect(() => {
        if (stats) {
            // Animate numbers counting up (existing logic)
            animateStats(stats);
        } else {
            // Fetch from API if stats not provided
            const fetchSettings = async () => {
                try {
                    const res = await fetch('/api/settings/public');
                    const data = await res.json();
                    if (data.success && data.settings) {
                        // Check if enabled in settings
                        const enabled = data.settings.social_proof_enabled === true
                            || data.settings.social_proof_enabled === 'true';
                        setIsEnabled(enabled);

                        const total = Number(data.settings.social_proof_total_clients);
                        const slots = Number(data.settings.urgency_slots_remaining);
                        if (!enabled || !Number.isFinite(total) || total <= 0) return;

                        const fetchedStats = {
                            accepted_this_month: 0,
                            completed_sessions: total,
                            remaining_monthly_slots: Number.isFinite(slots) && slots >= 0
                                ? slots
                                : undefined,
                        };
                        animateStats(fetchedStats);
                    }
                } catch (error) {
                    console.error('Failed to fetch social stats', error);
                }
            };
            fetchSettings();
        }
    }, [stats]);

    const animateStats = (targetStats: any) => {
        setLocalStats(targetStats); // Store fully for render access

        const duration = 1500;
        const steps = 60;
        const interval = duration / steps;

        let step = 0;
        const timer = setInterval(() => {
            step++;
            const progress = step / steps;

            setDisplayStats({
                accepted: Math.floor((targetStats.accepted_this_month || 0) * progress),
                completed: Math.floor((targetStats.completed_sessions || 0) * progress),
            });

            if (step >= steps) {
                clearInterval(timer);
                setDisplayStats({
                    accepted: targetStats.accepted_this_month || 0,
                    completed: targetStats.completed_sessions || 0,
                });
            }
        }, interval);
        return () => clearInterval(timer);
    };

    const activeStats = stats || localStats;
    if (!activeStats || !isVisible || !isEnabled) return null;

    const defaultMessage = `${displayStats.completed} zakończonych sesji`;
    const displayMessage = message?.replace('{count}', String(displayStats.accepted)) || defaultMessage;

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('social-proof-banner-dismissed', 'true');
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.6 }}
                    className="relative w-full bg-gradient-to-r from-black via-gold-900/20 to-black border-y border-gold-400/30 py-2 md:py-4 px-4 md:px-6 z-[40]"
                >
                    <div className="max-w-6xl mx-auto">
                        <div className="flex items-center gap-2 md:gap-4">
                            {/* Close Button - LEFT SIDE to avoid chat widget overlap */}
                            <button
                                onClick={handleClose}
                                className="flex-shrink-0 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                aria-label="Zamknij banner"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 text-center flex-1 min-w-0">
                                {/* Main Message */}
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">🎉</span>
                                    <p className="text-gold-100 text-sm md:text-xl font-semibold">
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
                                {activeStats.remaining_monthly_slots !== undefined && (
                                    <>
                                        <div className="hidden md:block w-px h-8 bg-gold-400/30" />
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">⚡</span>
                                            <p className="text-gray-300">
                                                Zostało tylko{' '}
                                                <span className="text-gold-400 font-bold text-xl">
                                                    {activeStats.remaining_monthly_slots}
                                                </span>
                                                {' '}miejsc w tym miesiącu
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
