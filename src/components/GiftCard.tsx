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
    isPrint = false
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
                aspectRatio: isPrint ? '1.588 / 1' : undefined,
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
            <div className={`relative h-full p-6 sm:p-8 flex flex-col justify-between ${config.textColor}`}>
                {/* Top section - Logo and theme */}
                <div className="flex items-start justify-between">
                    {logoUrl && (
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                            <Image
                                src={logoUrl}
                                alt="Logo"
                                fill
                                className="object-contain"
                                quality={100}
                            />
                        </div>
                    )}
                    <div className="text-5xl sm:text-6xl">{config.icon}</div>
                </div>

                {/* Center section - Card title and message */}
                <div className="flex flex-col items-center justify-center text-center flex-1 my-4">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2 drop-shadow-lg">
                        {displayTitle}
                    </h2>
                    <p className={`text-sm sm:text-base opacity-90 mb-4 drop-shadow`}>
                        {displayDescription}
                    </p>

                    {recipientName && (
                        <p className="text-sm sm:text-base italic opacity-75 mb-2">
                            Dla: <span className="font-semibold">{recipientName}</span>
                        </p>
                    )}

                    {message && (
                        <p className="text-xs sm:text-sm italic opacity-70 max-w-xs px-2">
                            {message}
                        </p>
                    )}
                </div>

                {/* Value and Code section */}
                <div className="flex flex-col items-center gap-4">
                    {/* Value */}
                    <div className="text-center">
                        <p className="text-xs sm:text-sm opacity-75 mb-1">Wartość karty</p>
                        <p className="text-4xl sm:text-5xl font-bold drop-shadow-lg">
                            {value} zł
                        </p>
                    </div>

                    {/* Code */}
                    <div className="w-full bg-white/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 border-2 border-white/40">
                        <p className="text-xs opacity-75 text-center mb-1">KOD PROMOCYJNY</p>
                        <p className="font-mono text-xl sm:text-2xl font-bold text-center tracking-widest drop-shadow-lg">
                            {code}
                        </p>
                    </div>

                    {/* Sender info if provided */}
                    {senderName && !isPrint && (
                        <p className="text-xs opacity-60 text-center mt-2">
                            Od: {senderName}
                        </p>
                    )}
                </div>

                {/* Footer - Brand */}
                {!isPrint && (
                    <div className="text-center text-xs opacity-75 mt-4">
                        <p className="font-semibold">Przemysław Właśniewski</p>
                        <p className="text-xs opacity-60">Fotografia</p>
                    </div>
                )}
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
