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
                    console.log('[SeasonalEffects] Setting effect to:', data.settings.seasonal_effect);
                    setEffect(data.settings.seasonal_effect);
                } else {
                    console.log('[SeasonalEffects] No seasonal_effect in settings:', data.settings);
                }
            })
            .catch((err) => {
                console.error('[SeasonalEffects] Error fetching settings:', err);
            });
    }, [pathname]); // Re-check on nav? Or just once. Usually global setting.

    // Don't show on admin pages
    if (pathname?.startsWith('/admin')) return null;

    if (effect === 'none') return null;

    console.log('[SeasonalEffects] Rendering effect:', effect);
    return (
        <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden" aria-hidden="true">
            {effect === 'snow' && <SnowEffect />}
            {effect === 'lights' && <LightsEffect />}
            {effect === 'hearts' && <HeartsEffect />}
            {effect === 'halloween' && <HalloweenEffect />}
            {effect === 'easter' && <EasterEffect />}
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
    useEffect(() => {
        // Inject keyframes dynamically
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            @keyframes twinkle {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 1; }
            }
        `;
        document.head.appendChild(styleSheet);
        return () => {
            document.head.removeChild(styleSheet);
        };
    }, []);

    const lights = Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100 + '%',
        top: Math.random() * 20 + '%',
        size: Math.random() * 2 + 4 + 'px',
        duration: Math.random() * 1 + 1.5 + 's',
        delay: Math.random() * 2 + 's',
        color: ['#FFD700', '#FFA500', '#FF6347', '#00FF00', '#0099FF'][Math.floor(Math.random() * 5)]
    }));

    return (
        <>
            {lights.map(light => (
                <div
                    key={light.id}
                    style={{
                        position: 'absolute',
                        top: light.top,
                        left: light.left,
                        width: light.size,
                        height: light.size,
                        backgroundColor: light.color,
                        borderRadius: '50%',
                        animation: `twinkle ${light.duration} ease-in-out infinite`,
                        animationDelay: light.delay,
                        boxShadow: `0 0 20px ${light.color}, inset 0 0 10px ${light.color}`,
                        pointerEvents: 'none'
                    }}
                />
            ))}
        </>
    );
}

function HeartsEffect() {
    useEffect(() => {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            @keyframes float-up {
                0% { transform: translateY(0) scale(0.5) rotate(0deg); opacity: 0; }
                20% { opacity: 1; }
                80% { opacity: 1; }
                100% { transform: translateY(-120vh) scale(1.2) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(styleSheet);
        return () => {
            document.head.removeChild(styleSheet);
        };
    }, []);

    const hearts = Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100 + '%',
        animationDuration: Math.random() * 4 + 3 + 's',
        delay: Math.random() * 6 + 's',
        size: Math.random() * 1.5 + 1 + 'rem'
    }));

    return (
        <>
            {hearts.map(h => (
                <div
                    key={h.id}
                    style={{
                        position: 'absolute',
                        left: h.left,
                        bottom: '-50px',
                        fontSize: h.size,
                        animation: `float-up ${h.animationDuration} ease-in infinite`,
                        animationDelay: h.delay,
                        pointerEvents: 'none',
                        filter: 'drop-shadow(0 0 3px rgba(255, 105, 180, 0.6))'
                    }}
                >
                    ❤️
                </div>
            ))}
        </>
    );
}

function HalloweenEffect() {
    useEffect(() => {
        console.log('[HalloweenEffect] Mounting'); const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            @keyframes spooky-float {
                0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(-120vh) translateX(30px) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(styleSheet);
        return () => {
            document.head.removeChild(styleSheet);
        };
    }, []);

    const ghosts = Array.from({ length: 25 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100 + '%',
        duration: Math.random() * 5 + 6 + 's',
        delay: Math.random() * 3 + 's',
        emoji: Math.random() > 0.6 ? '🎃' : '👻' // 40% Chance for Pumpkin
    }));

    return (
        <>
            {ghosts.map(g => (
                <div
                    key={g.id}
                    style={{
                        position: 'absolute',
                        bottom: '-50px',
                        left: g.left,
                        fontSize: '2.5rem',
                        animation: `spooky-float ${g.duration} linear infinite`,
                        animationDelay: g.delay,
                        pointerEvents: 'none',
                        filter: 'drop-shadow(0 0 8px rgba(255, 165, 0, 0.5))'
                    }}
                >
                    {g.emoji}
                </div>
            ))}
        </>
    );
}

function EasterEffect() {
    useEffect(() => {
        console.log('[EasterEffect] Mounting');
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            @keyframes easter-float {
                0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(-120vh) translateX(30px) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(styleSheet);
        return () => {
            document.head.removeChild(styleSheet);
        };
    }, []);

    const creatures = Array.from({ length: 25 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100 + '%',
        duration: Math.random() * 5 + 6 + 's',
        delay: Math.random() * 3 + 's',
        emoji: i % 3 === 0 ? '🐰' : i % 3 === 1 ? '🐑' : '🥚' // Bunny, Lamb, Egg
    }));

    return (
        <>
            {creatures.map(creature => (
                <div
                    key={creature.id}
                    style={{
                        position: 'absolute',
                        bottom: '-50px',
                        left: creature.left,
                        fontSize: '2.2rem',
                        animation: `easter-float ${creature.duration} linear infinite`,
                        animationDelay: creature.delay,
                        pointerEvents: 'none',
                        filter: 'drop-shadow(0 0 5px rgba(139, 69, 19, 0.4))'
                    }}
                >
                    {creature.emoji}
                </div>
            ))}
        </>
    );
}
