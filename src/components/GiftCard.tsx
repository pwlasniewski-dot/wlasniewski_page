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
    isPrint?: boolean;    hideCode?: boolean; // Hide code until after payment}

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
        bgGradient: 'from-red-600 via-red-700 to-amber-700',
        accentColor: 'text-amber-300',
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
        bgGradient: 'from-yellow-600 via-yellow-500 to-yellow-700',
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
        accentColor: 'text-yellow-200',
        icon: '💐',
        title: 'Dzień Matki',
        description: 'Dla najwspanialszej mamy',
        borderPattern: '🌹💐🌹💐',
        textColor: 'text-white'
    },
    'childrens-day': {
        bgGradient: 'from-blue-600 via-purple-500 to-pink-600',
        accentColor: 'text-yellow-300',
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
        accentColor: 'text-yellow-200',
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
    hideCode = false
}: GiftCardProps) {
    const config = themeConfigs[theme] || themeConfigs.christmas;
    const displayTitle = cardTitle || 'KARTA PODARUNKOWA';
    const displayDescription = cardDescription || config.description;

    const cardStyle = isPrint
        ? { width: '540px', height: '340px' } // Standard gift card size in pixels (for printing)
        : {};

    return (
        <motion.div
            className={`relative overflow-hidden rounded-3xl ${isPrint ? '' : 'shadow-2xl hover:shadow-3xl'} transition-shadow duration-300`}
            style={{
                ...cardStyle,
                aspectRatio: '1.588 / 1', // Standard credit card ratio (ISO/IEC 7810 ID-1)
            }}
            animate={!isPrint ? { scale: [1, 1.02, 1] } : {}}
            transition={!isPrint ? { duration: 4, repeat: Infinity } : {}}
        >
            {/* Main background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient}`}></div>

            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10">
                <div className="w-full h-full flex flex-wrap items-center justify-around content-around text-6xl">
                    {Array(12).fill(0).map((_, i) => (
                        <span key={i} className="opacity-40">{config.borderPattern.split('').map(c => c).join('')}</span>
                    ))}
                </div>
            </div>

            {/* Shine effect */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ pointerEvents: 'none' }}
            />

            {/* Content */}
            <div className={`relative h-full p-4 sm:p-6 flex flex-col justify-between ${config.textColor} z-10`}>
                {/* Top section - Logo and theme */}
                <div className="flex items-start justify-between">
                    {logoUrl && (
                        <div className="relative w-10 h-10 sm:w-20 sm:h-20">
                            <Image
                                src={logoUrl}
                                alt="Logo"
                                fill
                                className="object-contain"
                                quality={100}
                            />
                        </div>
                    )}
                    <div className="text-3xl sm:text-6xl">{config.icon}</div>
                </div>

                {/* Center section - Card title and message */}
                <div className="flex-1 flex flex-col justify-center items-center text-center -mt-2">
                    <h2 className="text-lg sm:text-3xl font-bold mb-1 drop-shadow-lg leading-tight">
                        {displayTitle}
                    </h2>
                    <p className={`text-xs sm:text-base opacity-90 mb-2 drop-shadow leading-tight`}>
                        {displayDescription}
                    </p>

                    {recipientName && (
                        <p className="text-xs sm:text-base italic opacity-75 mb-1">
                            Dla: <span className="font-semibold">{recipientName}</span>
                        </p>
                    )}
                </div>

                {/* Value and Code section - compacted for mobile */}
                <div className="flex flex-col items-center gap-1 sm:gap-4 mt-auto">
                    {/* Value */}
                    <div className="text-center">
                        <p className="text-[10px] sm:text-sm opacity-75 mb-0.5">Wartość karty</p>
                        <p className="text-2xl sm:text-5xl font-bold drop-shadow-lg leading-none">
                            {value} zł
                        </p>
                    </div>

                    {/* Code */}
                    {!hideCode ? (
                        <div className="w-full bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-1.5 sm:p-4 border border-white/40 mt-1 sm:mt-0">
                            <p className="text-[9px] sm:text-xs opacity-75 text-center mb-0.5">KOD PROMOCYJNY</p>
                            <p className="font-mono text-base sm:text-2xl font-bold text-center tracking-widest drop-shadow-md">
                                {code}
                            </p>
                        </div>
                    ) : (
                        <div className="w-full bg-blue-500/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-1.5 sm:p-4 border border-blue-400/30 mt-1 sm:mt-0">
                            <p className="text-[9px] sm:text-xs opacity-75 text-center mb-0.5 text-blue-300">KOD WYSŁANY NA EMAIL</p>
                            <p className="font-mono text-base sm:text-lg font-bold text-center text-blue-300 opacity-75">
                                Po potwierddzeniu płatności
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Corner decorations for non-print view */}
            {!isPrint && (
                <>
                    <motion.div
                        className="absolute top-2 right-4 text-3xl"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity }}
                    >
                        {config.icon}
                    </motion.div>
                    <motion.div
                        className="absolute bottom-2 left-4 text-3xl"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 5, repeat: Infinity }}
                    >
                        {config.icon}
                    </motion.div>
                </>
            )}
        </motion.div>
    );
}
