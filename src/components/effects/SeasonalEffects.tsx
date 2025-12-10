'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function SeasonalEffects() {
    const [effect, setEffect] = useState<string>('none');
    const pathname = usePathname();

    useEffect(() => {
        // Fetch settings - ideally this should be passed from layout or context to avoid extra fetch
        // But for isolation we fetch here or read from a global stash if available
        fetch('/api/settings/public')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.settings?.seasonal_effect) {
                    setEffect(data.settings.seasonal_effect);
                }
            })
            .catch(() => { });
    }, [pathname]); // Re-check on nav? Or just once. Usually global setting.

    // Don't show on admin pages
    if (pathname?.startsWith('/admin')) return null;

    if (effect === 'none') return null;

    return (
        <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden" aria-hidden="true">
            {effect === 'snow' && <SnowEffect />}
            {effect === 'lights' && <LightsEffect />}
            {effect === 'hearts' && <HeartsEffect />}
        </div>
    );
}

function SnowEffect() {
    useEffect(() => {
        // Inject keyframes dynamically
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            @keyframes snowfall {
                0% { 
                    transform: translateY(-10px) translateX(0) rotate(0deg); 
                    opacity: 1;
                }
                100% { 
                    transform: translateY(100vh) translateX(30px) rotate(360deg); 
                    opacity: 0.8;
                }
            }
        `;
        document.head.appendChild(styleSheet);
        return () => {
            document.head.removeChild(styleSheet);
        };
    }, []);

    const flakes = Array.from({ length: 60 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100 + '%',
        size: Math.random() * 4 + 2 + 'px',
        duration: Math.random() * 5 + 8 + 's', // Slower, more realistic
        delay: Math.random() * 8 + 's',
        opacity: Math.random() * 0.6 + 0.4
    }));

    return (
        <>
            {flakes.map(f => (
                <div
                    key={f.id}
                    style={{
                        position: 'absolute',
                        top: '-10px',
                        left: f.left,
                        width: f.size,
                        height: f.size,
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        opacity: f.opacity,
                        animation: `snowfall ${f.duration} linear infinite`,
                        animationDelay: f.delay,
                        boxShadow: '0 0 10px rgba(255,255,255,0.8)',
                        pointerEvents: 'none'
                    }}
                />
            ))}
        </>
    );
}

function LightsEffect() {
    return (
        <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-yellow-500/20 to-transparent flex justify-between px-4">
            {/* Placeholder for header lights */}
        </div>
    );
}

function HeartsEffect() {
    const hearts = Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100 + '%',
        animationDuration: Math.random() * 4 + 3 + 's',
        delay: Math.random() * 5 + 's'
    }));

    return (
        <>
            {hearts.map(h => (
                <div
                    key={h.id}
                    className="absolute bottom-0 text-red-500 animate-float-up text-2xl"
                    style={{
                        left: h.left,
                        animationDuration: h.animationDuration,
                        animationDelay: h.delay,
                        bottom: '-30px'
                    }}
                >
                    ❤️
                </div>
            ))}
            <style jsx global>{`
                @keyframes float-up {
                    0% { transform: translateY(0) scale(0.5); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateY(-100vh) scale(1.2); opacity: 0; }
                }
                .animate-float-up {
                    animation-name: float-up;
                    animation-timing-function: ease-in;
                    animation-iteration-count: infinite;
                }
            `}</style>
        </>
    );
}
