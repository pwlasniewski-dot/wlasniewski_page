'use client';

import { motion } from 'framer-motion';

export const cyan = '#54f4ff';
export const violet = '#9b7cff';
export const orange = '#ff9a57';
export const lime = '#b8ff6a';
export const ink = '#081524';
export const white = '#f7fbff';
export const muted = '#9eb3c7';

export function Arrow({
    x1,
    y1,
    x2,
    y2,
    label,
    color = cyan,
    delay = 0,
    width = 7,
}: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    label?: string;
    color?: string;
    delay?: number;
    width?: number;
}) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const head = 15;
    const leftX = x2 - head * Math.cos(angle - Math.PI / 6);
    const leftY = y2 - head * Math.sin(angle - Math.PI / 6);
    const rightX = x2 - head * Math.cos(angle + Math.PI / 6);
    const rightY = y2 - head * Math.sin(angle + Math.PI / 6);
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay, duration: 0.35 }}
        >
            <motion.line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={width}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay, duration: 0.65 }}
            />
            <motion.polygon
                points={`${x2},${y2} ${leftX},${leftY} ${rightX},${rightY}`}
                fill={color}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.5, type: 'spring' }}
                style={{ transformOrigin: `${x2}px ${y2}px` }}
            />
            {label && (
                <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 14}
                    fill={white}
                    textAnchor="middle"
                    fontSize="20"
                    fontWeight="800"
                >
                    {label}
                </text>
            )}
        </motion.g>
    );
}

export function Label({ x, y, children, color = white, size = 19 }: { x: number; y: number; children: React.ReactNode; color?: string; size?: number }) {
    return <text x={x} y={y} fill={color} fontSize={size} fontWeight="800" textAnchor="middle">{children}</text>;
}

export function Base({ children, title }: { children: React.ReactNode; title: string }) {
    return (
        <svg viewBox="0 0 640 360" role="img" aria-label={title} className="physics-animation-svg">
            <defs>
                <radialGradient id="labGlow" cx="50%" cy="45%" r="70%">
                    <stop offset="0%" stopColor="#17365c" stopOpacity="0.86" />
                    <stop offset="100%" stopColor="#06101f" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f9fdff" />
                    <stop offset="45%" stopColor="#91a9bc" />
                    <stop offset="72%" stopColor="#eff8ff" />
                    <stop offset="100%" stopColor="#71879a" />
                </linearGradient>
                <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#72f4ff" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#3178ff" stopOpacity="0.95" />
                </linearGradient>
                <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="7" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>
            <rect width="640" height="360" rx="28" fill={ink} />
            <rect width="640" height="360" rx="28" fill="url(#labGlow)" />
            <g opacity="0.16">
                {Array.from({ length: 13 }).map((_, index) => (
                    <line key={`v-${index}`} x1={index * 52} y1="0" x2={index * 52} y2="360" stroke={cyan} strokeWidth="1" />
                ))}
                {Array.from({ length: 8 }).map((_, index) => (
                    <line key={`h-${index}`} x1="0" y1={index * 52} x2="640" y2={index * 52} stroke={cyan} strokeWidth="1" />
                ))}
            </g>
            {children}
        </svg>
    );
}
