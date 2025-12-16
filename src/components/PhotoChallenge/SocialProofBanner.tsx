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
    const [localStats, setLocalStats] = useState<any>(null);

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
                        const total = parseInt(data.settings.social_proof_total_clients || '100');
                        const slots = parseInt(data.settings.urgency_slots_remaining || '5');

                        const fetchedStats = {
                            accepted_this_month: Math.floor(total / 12) + 2, // Approximate
                            completed_sessions: total,
                            remaining_monthly_slots: slots
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
    if (!activeStats) return null;

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
        </motion.div>
    );
}
