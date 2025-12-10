'use client';

// Countdown Timer Component with FOMO styling

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
    deadline: string; // ISO date string
    onExpire?: () => void;
}

interface TimeRemaining {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
}

export default function CountdownTimer({ deadline, onExpire }: CountdownTimerProps) {
    const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

    useEffect(() => {
        const calculateTimeRemaining = (): TimeRemaining => {
            const now = new Date().getTime();
            const end = new Date(deadline).getTime();
            const total = Math.max(0, end - now);

            const seconds = Math.floor((total / 1000) % 60);
            const minutes = Math.floor((total / 1000 / 60) % 60);
            const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
            const days = Math.floor(total / (1000 * 60 * 60 * 24));

            return { days, hours, minutes, seconds, total };
        };

        // Initial calculation
        setTimeRemaining(calculateTimeRemaining());

        // Update every second
        const interval = setInterval(() => {
            const remaining = calculateTimeRemaining();
            setTimeRemaining(remaining);

            if (remaining.total === 0 && onExpire) {
                onExpire();
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [deadline, onExpire]);

    if (!timeRemaining) {
        return null;
    }

    const { days, hours, minutes, seconds, total } = timeRemaining;

    // Check if we're in the final 6 hours (urgent state)
    const isUrgent = total > 0 && total < 6 * 60 * 60 * 1000;
    const isExpired = total === 0;

    if (isExpired) {
        return (
            <div className="text-center py-6 px-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-lg font-semibold">
                    ⏰ Wyzwanie wygasło
                </p>
            </div>
        );
    }

    return (
        <div
            className={`
        relative py-6 px-4 rounded-lg border-2 transition-all duration-300
        ${isUrgent
                    ? 'bg-red-900/10 border-red-500/50 pulse-gold'
                    : 'bg-gradient-to-br from-black/50 to-gold-900/20 border-gold-400/30 gold-glow'
                }
      `}
        >
            <div className="text-center mb-4">
                <p className={`text-sm uppercase tracking-wider ${isUrgent ? 'text-red-400' : 'text-gold-400'}`}>
                    {isUrgent ? '⚠️ Czas ucieka!' : 'Czas na akceptację'}
                </p>
            </div>

            <div className="grid grid-cols-4 gap-2 md:gap-4">
                <TimeUnit value={days} label="Dni" isUrgent={isUrgent} />
                <TimeUnit value={hours} label="Godz" isUrgent={isUrgent} />
                <TimeUnit value={minutes} label="Min" isUrgent={isUrgent} />
                <TimeUnit value={seconds} label="Sek" isUrgent={isUrgent} />
            </div>

            {isUrgent && (
                <p className="text-center mt-4 text-red-300 text-sm animate-pulse">
                    Zostało mniej niż 6 godzin!
                </p>
            )}
        </div>
    );
}

function TimeUnit({ value, label, isUrgent }: { value: number; label: string; isUrgent: boolean }) {
    return (
        <div className="text-center">
            <div
                className={`
          text-3xl md:text-4xl font-display font-bold mb-1
          ${isUrgent ? 'text-red-400' : 'text-gold-400'}
        `}
            >
                {String(value).padStart(2, '0')}
            </div>
            <div className={`text-xs uppercase tracking-wide ${isUrgent ? 'text-red-200' : 'text-gray-400'}`}>
                {label}
            </div>
        </div>
    );
}
