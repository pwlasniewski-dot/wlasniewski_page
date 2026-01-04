'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface GiftCardProps {
    code: string;
    value: number;
    theme: 'christmas' | 'wosp' | 'valentines' | 'easter' | 'halloween' | 'mothers-day' | 'childrens-day' | 'wedding' | 'birthday';
    logoUrl?: string;
    recipientName?: string;
    senderName?: string;
    message?: string;
    cardTitle?: string;
    cardDescription?: string;
    isPrint?: boolean;
    hideCode?: boolean; // Hide code until after payment
    orderId?: string; // Unique reference number
}

type ThemeConfig = {
    bgGradient: string;
    accentColor: string;
    icon: string;
    title: string;
    description: string;
    borderPattern: string;
    textColor: string;
};

const themeConfigs: Record<string, ThemeConfig> = {
    christmas: {
        bgGradient: 'from-red-900 via-red-800 to-green-900',
        accentColor: 'text-red-300',
        icon: '🎄',
        title: 'Boże Narodzenie',
        description: 'Życzenia pięknego świąt',
        borderPattern: '🎅🎄🎅🎄',
        textColor: 'text-white'
    },
    wosp: {
        bgGradient: 'from-red-600 via-red-700 to-gold-700',
        accentColor: 'text-gold-300',
        icon: '💛',
        title: 'Karta Pomocy',
        description: 'Wspieraj co w Tobie dobre',
        borderPattern: '✨💫✨💫',
        textColor: 'text-white'
    },
    valentines: {
        bgGradient: 'from-pink-900 via-pink-700 to-red-900',
        accentColor: 'text-pink-200',
        icon: '💝',
        title: 'Walentynki',
        description: 'Z miłością',
        borderPattern: '💕💕💕💕',
        textColor: 'text-white'
    },
    easter: {
        bgGradient: 'from-gold-600 via-gold-500 to-gold-700',
        accentColor: 'text-purple-600',
        icon: '🐰',
        title: 'Wielkanoc',
        description: 'Wesołych Świąt',
        borderPattern: '🐣🐰🐣🐰',
        textColor: 'text-white'
    },
    halloween: {
        bgGradient: 'from-orange-900 via-black to-orange-900',
        accentColor: 'text-orange-300',
        icon: '👻',
        title: 'Halloween',
        description: 'Straszna zniżka czeka!',
        borderPattern: '👻🎃👻🎃',
        textColor: 'text-white'
    },
    'mothers-day': {
        bgGradient: 'from-purple-700 via-pink-600 to-purple-700',
        accentColor: 'text-gold-200',
        icon: '💐',
        title: 'Dzień Matki',
        description: 'Dla najwspanialszej mamy',
        borderPattern: '🌹💐🌹💐',
        textColor: 'text-white'
    },
    'childrens-day': {
        bgGradient: 'from-blue-600 via-purple-500 to-pink-600',
        accentColor: 'text-gold-300',
        icon: '🎈',
        title: 'Dzień Dziecka',
        description: 'Dla małego uśmieszku',
        borderPattern: '🎈🎉🎈🎉',
        textColor: 'text-white'
    },
    wedding: {
        bgGradient: 'from-purple-300 via-pink-200 to-purple-300',
        accentColor: 'text-purple-700',
        icon: '💒',
        title: 'Ślub',
        description: 'Życzenia szczęścia',
        borderPattern: '💍💒💍💒',
        textColor: 'text-gray-800'
    },
    birthday: {
        bgGradient: 'from-cyan-500 via-blue-500 to-purple-600',
        accentColor: 'text-gold-200',
        icon: '🎂',
        title: 'Urodziny',
        description: 'Wiele szczęścia!',
        borderPattern: '🎉🎂🎉🎂',
        textColor: 'text-white'
    }
};

export default function GiftCard({
    code,
    value,
    theme = 'christmas',
    logoUrl,
    recipientName,
    senderName,
    message,
    cardTitle,
    cardDescription,
    isPrint = false,
    hideCode = false,
    orderId
}: GiftCardProps) {
    const config = themeConfigs[theme] || themeConfigs.christmas;
    const displayTitle = cardTitle || 'KARTA PODARUNKOWA';
    const displayDescription = cardDescription || config.description;

    const cardStyle = isPrint
        ? { width: '540px', height: '340px' } // Standard gift card size in pixels (for printing)
        : {};

    return (
        <motion.div
            className={`relative overflow-hidden rounded-xl md:rounded-2xl ${isPrint ? '' : 'shadow-xl hover:shadow-2xl'} transition-shadow duration-300 w-full`}
            style={{
                ...cardStyle,
                aspectRatio: '1.586 / 1',
                // For web, we ensure it doesn't get too small or too big
                maxWidth: isPrint ? 'none' : '550px',
                minWidth: isPrint ? 'auto' : '260px'
            }}
            animate={!isPrint ? { scale: [1, 1.01, 1] } : {}}
            transition={!isPrint ? { duration: 4, repeat: Infinity } : {}}
        >
            {/* Main background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient}`}></div>

            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="w-full h-full flex flex-wrap items-center justify-around content-around text-4xl sm:text-6xl overflow-hidden">
                    {Array(8).fill(0).map((_, i) => (
                        <span key={i} className="opacity-20 select-none whitespace-nowrap">{config.borderPattern}</span>
                    ))}
                </div>
            </div>

            {/* Shine effect */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />

            {/* Content Container */}
            <div className={`relative h-full w-full p-2 sm:p-3 md:p-5 flex flex-col justify-between ${config.textColor} z-10 overflow-hidden`}>
                {/* Top section - Logo and theme */}
                <div className="flex items-start justify-between shrink-0">
                    {logoUrl ? (
                        <div className="relative w-5 h-5 sm:w-8 sm:h-8 md:w-12 md:h-12">
                            <Image
                                src={logoUrl}
                                alt="Logo"
                                fill
                                className="object-contain"
                                quality={100}
                            />
                        </div>
                    ) : <div className="w-5 h-5 sm:w-8" />}
                    <div className="text-lg sm:text-xl md:text-3xl">{config.icon}</div>
                </div>

                {/* Center section - Card title and description */}
                <div className="flex-1 flex flex-col justify-start items-center text-center px-1 sm:px-2 min-w-0 pt-0 sm:pt-1 md:pt-2">
                    <h2 className={`font-bold mb-1 drop-shadow-xl leading-tight w-full line-clamp-2 ${displayTitle.length > 25 ? 'text-[10px] sm:text-xs md:text-base lg:text-lg' : 'text-[11px] sm:text-sm md:text-lg lg:text-xl'
                        }`}>
                        {displayTitle}
                    </h2>
                    <p className={`opacity-85 drop-shadow-md leading-tight line-clamp-2 max-w-[95%] font-medium ${displayDescription.length > 50 ? 'text-[7px] sm:text-[8px] md:text-[10px]' : 'text-[8px] sm:text-[9px] md:text-xs'
                        }`}>
                        {displayDescription}
                    </p>

                    {recipientName && (
                        <div className="mt-1 sm:mt-1.5 py-0 px-2.5 bg-black/15 backdrop-blur-sm rounded-full border border-white/10 shadow-sm">
                            <p className="text-[6px] sm:text-[8px] md:text-[10px] italic opacity-100 font-semibold tracking-tight">
                                Dla: <span className="not-italic">{recipientName}</span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Bottom section - Value and Code */}
                <div className="flex flex-col items-center gap-1 sm:gap-2 md:gap-3 mt-auto w-full shrink-0">
                    {/* Value */}
                    <div className="text-center">
                        <p className="text-[6px] sm:text-[7px] md:text-[9px] opacity-60 mb-0 uppercase tracking-tighter sm:tracking-widest font-bold">Wartość karty</p>
                        <p className="text-[14px] sm:text-lg md:text-2xl lg:text-3xl font-black drop-shadow-2xl leading-none">
                            {value} zł
                        </p>
                    </div>

                    {/* Code / Payment Notice */}
                    <div className="w-full max-w-[90%] sm:max-w-[85%] mx-auto pb-0.5">
                        {!hideCode ? (
                            <div className="bg-white/15 backdrop-blur-md rounded-lg p-0.5 sm:p-1 md:p-2 border border-white/20 shadow-lg">
                                <p className="text-[5px] sm:text-[7px] md:text-[9px] opacity-60 text-center mb-0 uppercase font-bold tracking-widest leading-none">KOD PROMOCYJNY</p>
                                <p className="font-mono text-xs sm:text-base md:text-lg lg:text-xl font-black text-center tracking-[0.1em] sm:tracking-[0.3em] md:tracking-[0.4em] drop-shadow-lg leading-tight">
                                    {code}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-blue-600/15 backdrop-blur-md rounded-lg p-0.5 sm:p-1 md:p-1.5 border border-blue-400/30 shadow-xl">
                                <p className="text-[5px] sm:text-[6px] md:text-[8px] opacity-80 text-center mb-0 text-blue-100 uppercase tracking-tighter sm:tracking-widest font-black leading-none py-0.5">DOSTĘPNY PO OPŁACENIU</p>
                                <p className="hidden sm:block font-mono text-[6px] md:text-[8px] font-bold text-center text-white opacity-70 italic leading-none mt-0">
                                    Wysłanie kodu na email
                                </p>
                            </div>
                        )}
                    </div>

                    {orderId && (
                        <div className="absolute bottom-1 right-4 text-[8px] md:text-[10px] opacity-40 font-mono font-bold">
                            #ID: {orderId}
                        </div>
                    )}
                </div>
            </div>

            {/* Corner decorations for non-print view */}
            {!isPrint && (
                <>
                    <div className="absolute top-4 left-4 text-4xl opacity-10 pointer-events-none">
                        {config.icon}
                    </div>
                </>
            )}
        </motion.div>
    );
}
