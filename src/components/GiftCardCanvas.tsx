'use client';

import React from 'react';

export interface GiftCardData {
    recipientName: string;
    code: string;
    amount: number;
    discountType: 'percentage' | 'fixed';
    validUntil?: Date;
    template: 'gold' | 'dark' | 'classic';
}

interface GiftCardCanvasProps {
    data: GiftCardData;
}

export default function GiftCardCanvas({ data }: GiftCardCanvasProps) {
    const { recipientName, code, amount, discountType, validUntil, template } = data;

    // Template-specific styles
    const templates = {
        gold: {
            container: 'bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#422c00]',
            title: 'text-amber-400 font-display text-sm md:text-lg tracking-[0.3em] uppercase font-light',
            name: 'text-white font-serif text-3xl md:text-5xl my-4 md:my-8 italic',
            code: 'text-amber-200/90 text-sm md:text-lg font-mono tracking-widest bg-black/40 px-6 py-2 rounded-full border border-amber-500/20',
            footer: 'text-amber-200/40 text-[10px] tracking-[0.4em] uppercase font-medium',
            decoration: 'border-[1px] border-amber-500/30',
            ornament: (
                <>
                    <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 blur-[80px] rounded-full" />
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-500/10 blur-[60px] rounded-full" />
                </>
            )
        },
        dark: {
            container: 'bg-[#0a0a0a]',
            title: 'text-zinc-400 font-sans text-xs md:text-sm tracking-[0.5em] uppercase font-black',
            name: 'text-white font-sans text-4xl md:text-6xl font-black my-4 md:my-8 tracking-tighter uppercase',
            code: 'text-white text-sm md:text-lg font-mono tracking-[0.5em] bg-zinc-900 px-6 py-2 rounded-lg border border-zinc-800 shadow-2xl',
            footer: 'text-zinc-600 text-[9px] font-sans tracking-[0.6em] uppercase font-bold',
            decoration: 'border-[1px] border-zinc-900',
            ornament: (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
            )
        },
        classic: {
            container: 'bg-zinc-50',
            title: 'text-zinc-800 font-serif text-base md:text-xl tracking-widest font-medium border-b border-zinc-200 pb-2',
            name: 'text-zinc-950 font-serif text-4xl md:text-6xl my-6 md:my-10 italic font-light',
            code: 'text-zinc-800 text-sm md:text-base font-serif tracking-widest border border-zinc-300 px-8 py-3 rounded-sm',
            footer: 'text-zinc-400 text-[10px] font-serif italic tracking-widest',
            decoration: 'border-[1px] border-zinc-200',
            ornament: (
                <div className="absolute inset-4 border border-zinc-100 pointer-events-none" />
            )
        }
    };

    const currentTemplate = templates[template] || templates.gold;
    const discountText = discountType === 'percentage' ? `${amount}% ZNIŻKI` : `${amount} PLN ZNIŻKI`;

    return (
        <div
            id="gift-card-canvas"
            className={`relative w-full aspect-[1.586] ${currentTemplate.container} ${currentTemplate.decoration} rounded-xl shadow-2xl p-6 md:p-12 flex flex-col items-center justify-center overflow-hidden print:shadow-none print:rounded-none`}
            style={{ maxWidth: '800px' }}
        >
            {currentTemplate.ornament}

            <div className="relative z-10 text-center w-full flex flex-col items-center">
                <h3 className={currentTemplate.title}>
                    {template === 'gold' ? 'VOUCHER PODARUNKOWY' :
                        template === 'dark' ? 'KARTA PREZENTOWA' :
                            'BON FOTOGRAFICZNY'}
                </h3>

                <div className="w-12 h-[1px] bg-current opacity-20 my-2 md:my-4" />

                <div className={currentTemplate.name}>
                    {recipientName || 'Dla Ciebie'}
                </div>

                <div className="space-y-4 md:space-y-6 mb-6 md:mb-10 w-full flex flex-col items-center">
                    <div className={currentTemplate.code}>
                        {code}
                    </div>
                    <div className="text-current opacity-80 text-xl md:text-2xl font-bold tracking-tight">
                        {discountText}
                    </div>
                </div>

                {validUntil && (
                    <div className="text-[10px] md:text-xs opacity-50 mb-6 font-medium tracking-widest">
                        WAŻNY DO: {new Date(validUntil).toLocaleDateString('pl-PL')}
                    </div>
                )}

                <div className={currentTemplate.footer}>
                    © PRZEMYSŁAW WŁAŚNIEWSKI FOTOGRAFIA
                </div>
            </div>
        </div>
    );
}
