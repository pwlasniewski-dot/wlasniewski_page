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
            container: 'bg-gradient-to-br from-black via-zinc-900 to-amber-900',
            title: 'text-amber-400 font-serif text-xl tracking-wider',
            name: 'text-amber-300 font-script text-4xl my-6',
            code: 'text-white text-sm font-mono bg-black/30 px-4 py-2 rounded border border-amber-500/30',
            footer: 'text-amber-200/80 text-xs tracking-widest',
            decoration: 'border-4 border-amber-500/20',
            ornament: (
                <>
                    <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-amber-500/40" />
                    <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-amber-500/40" />
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-amber-500/40" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-amber-500/40" />
                </>
            )
        },
        dark: {
            container: 'bg-black',
            title: 'text-amber-400 font-sans text-sm tracking-[0.3em] uppercase',
            name: 'text-white font-sans text-3xl font-light my-6 tracking-wide',
            code: 'text-amber-400 text-xs font-mono tracking-wider',
            footer: 'text-white/60 text-[10px] font-sans tracking-widest uppercase',
            decoration: 'border border-amber-500/20',
            ornament: (
                <>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(245,158,11,0.03),transparent_50%)]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-amber-500/10" />
                </>
            )
        },
        classic: {
            container: 'bg-gradient-to-br from-amber-50 via-white to-amber-50',
            title: 'text-zinc-700 font-serif text-lg tracking-wide',
            name: 'text-zinc-900 font-script text-4xl my-6',
            code: 'text-amber-700 text-sm font-serif tracking-wide',
            footer: 'text-zinc-600 text-xs font-serif italic',
            decoration: 'border-4 border-amber-600/30',
            ornament: (
                <>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-amber-600/40 to-transparent" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-amber-600/40 to-transparent" />
                </>
            )
        }
    };

    const currentTemplate = templates[template];
    const discountText = discountType === 'percentage' ? `${amount}% RABATU` : `${amount} PLN RABATU`;

    return (
        <div
            id="gift-card-canvas"
            className={`relative w-full aspect-[1.586] ${currentTemplate.container} ${currentTemplate.decoration} rounded-lg shadow-2xl p-8 flex flex-col items-center justify-center overflow-hidden print:shadow-none`}
            style={{ maxWidth: '640px' }}
        >
            {currentTemplate.ornament}

            <div className="relative z-10 text-center w-full">
                <h3 className={currentTemplate.title}>
                    {template === 'gold' ? 'BON PODARUNKOWY' :
                        template === 'dark' ? 'GIFT CARD' :
                            'VOUCHER FOTOGRAFICZNY'}
                </h3>

                <div className={currentTemplate.name}>
                    {recipientName}
                </div>

                <div className="space-y-2 mb-6">
                    <div className={`${currentTemplate.code} inline-block`}>
                        KOD: {code}
                    </div>
                    <div className={currentTemplate.code.replace('text-xs', 'text-base').replace('bg-black/30', '')}>
                        {discountText}
                    </div>
                </div>

                {validUntil && (
                    <div className={`${currentTemplate.code} text-[10px] opacity-70 mb-4`}>
                        Ważny do: {new Date(validUntil).toLocaleDateString('pl-PL')}
                    </div>
                )}

                <div className={currentTemplate.footer}>
                    © PRZEMYSŁAW WŁAŚNIEWSKI FOTOGRAFIA
                </div>
            </div>
        </div>
    );
}
