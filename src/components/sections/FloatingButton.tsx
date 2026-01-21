import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Home, ArrowRight, ExternalLink } from 'lucide-react';

export interface FloatingButtonProps {
    text?: string;
    link?: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    iconType?: 'home' | 'arrow-left' | 'arrow-right' | 'external';
}

export default function FloatingButton({
    text = 'Wróć',
    link = '/',
    position = 'bottom-right',
    iconType = 'arrow-left'
}: FloatingButtonProps) {

    const positionClasses = {
        'top-left': 'top-24 left-6 md:left-10', // top-24 to avoid colliding with navbar usually
        'top-right': 'top-24 right-6 md:right-10',
        'bottom-left': 'bottom-8 left-6 md:left-10',
        'bottom-right': 'bottom-8 right-6 md:right-10',
    };

    const getIcon = () => {
        switch (iconType) {
            case 'home': return <Home size={18} />;
            case 'arrow-right': return <ArrowRight size={18} />;
            case 'external': return <ExternalLink size={18} />;
            default: return <ArrowLeft size={18} />;
        }
    };

    // Determine safe position class
    const selectedPosition = positionClasses[position as keyof typeof positionClasses] || positionClasses['bottom-right'];

    return (
        <div className={`fixed z-[100] ${selectedPosition} pointer-events-auto print:hidden`}>
            <Link href={link || '/'} className="block">
                <button className="group flex items-center gap-3 px-6 py-4 bg-zinc-950/80 hover:bg-zinc-900 backdrop-blur-xl rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-white/10 hover:border-yellow-500/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                    <span className="text-zinc-400 group-hover:text-yellow-500 transition-colors">
                        {getIcon()}
                    </span>

                    {text && (
                        <span className="text-xs font-bold text-white uppercase tracking-[0.2em] group-hover:text-yellow-500 transition-colors">
                            {text}
                        </span>
                    )}
                </button>
            </Link>
        </div>
    );
}
