'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface GiftCardProps {
    code: string;
    value: number;
    theme: 'christmas' | 'wosp' | 'valentines' | 'easter' | 'halloween' | 'mothers-day' | 'childrens-day' | 'wedding' | 'birthday' | 'gold' | 'blue' | 'green';
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
    },
    // Generic Premium Themes
    gold: {
        bgGradient: 'from-amber-700 via-yellow-600 to-amber-900',
        accentColor: 'text-yellow-200',
        icon: '✨',
        title: 'Wyjątkowy Prezent',
        description: 'Chwile warte zapamiętania',
        borderPattern: '✨✨✨✨',
        textColor: 'text-white'
    },
    blue: {
        bgGradient: 'from-blue-900 via-indigo-800 to-slate-900',
        accentColor: 'text-blue-200',
        icon: '🌟',
        title: 'Wyjątkowy Prezent',
        description: 'Chwile warte zapamiętania',
        borderPattern: '🌟🌟🌟🌟',
        textColor: 'text-white'
    },
    green: {
        bgGradient: 'from-emerald-900 via-green-800 to-teal-900',
        accentColor: 'text-emerald-200',
        icon: '🌿',
        title: 'Wyjątkowy Prezent',
        description: 'Chwile warte zapamiętania',
        borderPattern: '🌿🌿🌿🌿',
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

    return (
        <motion.div
            className={`relative overflow-hidden rounded-[2cqw] ${isPrint ? '' : 'shadow-2xl hover:shadow-3xl'} transition-all duration-500 w-full`}
            style={{
                aspectRatio: '1.586 / 1',
                containerType: 'inline-size',
                maxWidth: isPrint ? 'none' : '800px',
            }}
            animate={!isPrint ? {
                scale: [1, 1.005, 1],
                filter: ['brightness(1)', 'brightness(1.05)', 'brightness(1)']
            } : {}}
            transition={!isPrint ? { duration: 6, repeat: Infinity, ease: "easeInOut" } : {}}
        >
            {/* Main background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient}`}></div>

            {/* Premium Texture Overlay */}
            <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div className="w-full h-full flex flex-wrap items-center justify-around content-around text-[10cqw] overflow-hidden">
                    {Array(12).fill(0).map((_, i) => (
                        <span key={i} className="select-none whitespace-nowrap rotate-12">{config.icon}</span>
                    ))}
                </div>
            </div>

            {/* Shine effect */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
                animate={{ x: ['-200%', '300%'] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />

            {/* Content Container */}
            <div className={`relative h-full w-full p-[4cqw] flex flex-col justify-between ${config.textColor} z-10 overflow-hidden`}>
                {/* Top section - Logo and theme */}
                <div className="flex items-start justify-between shrink-0">
                    {logoUrl ? (
                        <div className="relative w-[12cqw] h-[12cqw]">
                            <Image
                                src={logoUrl}
                                alt="Logo"
                                fill
                                className="object-contain"
                                quality={100}
                            />
                        </div>
                    ) : <div className="w-[12cqw] h-[12cqw]" />}
                    <div className="text-[6cqw] drop-shadow-lg">{config.icon}</div>
                </div>

                {/* Center section - Card title and description */}
                <div className="flex-1 flex flex-col justify-start items-center text-center px-[2cqw] pt-[1cqw]">
                    <h2 className="font-bold drop-shadow-2xl leading-tight w-full line-clamp-2 text-[4.5cqw] tracking-tight uppercase">
                        {displayTitle}
                    </h2>
                    <p className="opacity-80 drop-shadow-md leading-relaxed line-clamp-2 max-w-[90%] font-medium mt-[1cqw] text-[2cqw]">
                        {displayDescription}
                    </p>

                    {recipientName && (
                        <div className="mt-[2cqw] py-[0.5cqw] px-[3cqw] bg-black/20 backdrop-blur-md rounded-full border border-white/10 shadow-inner">
                            <p className="text-[1.8cqw] italic opacity-100 font-semibold tracking-tight">
                                Dla: <span className="not-italic text-white">{recipientName}</span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Bottom section - Value and Code */}
                <div className="flex flex-col items-center gap-[1.5cqw] mt-auto w-full shrink-0">
                    {/* Value */}
                    <div className="text-center">
                        <p className="text-[1.5cqw] opacity-60 mb-0 uppercase tracking-[0.3em] font-black">Wartość karty</p>
                        <p className="text-[8cqw] font-black drop-shadow-2xl leading-none tracking-tighter">
                            {value} PLN
                        </p>
                    </div>

                    {/* Code / Payment Notice */}
                    <div className="w-full max-w-[85%] mx-auto">
                        {!hideCode ? (
                            <div className="bg-white/10 backdrop-blur-xl rounded-[1.5cqw] p-[1.5cqw] border border-white/20 shadow-2xl relative group overflow-hidden">
                                <p className="text-[1.5cqw] opacity-70 text-center mb-[1cqw] uppercase font-bold tracking-[0.4em] leading-none">KOD PROMOCYJNY</p>
                                <p className="font-mono text-[4.5cqw] font-black text-center tracking-[0.2em] drop-shadow-lg leading-none text-white">
                                    {code}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-blue-600/20 backdrop-blur-xl rounded-[1.5cqw] p-[2cqw] border border-blue-400/30 shadow-xl text-center">
                                <p className="text-[1.8cqw] opacity-90 text-blue-100 uppercase tracking-widest font-black leading-none py-0.5">DOSTĘPNY PO OPŁACENIU</p>
                            </div>
                        )}
                    </div>

                    {orderId && (
                        <div className="absolute bottom-[2cqw] right-[4cqw] text-[1.2cqw] opacity-30 font-mono font-bold tracking-widest">
                            REF-{orderId}
                        </div>
                    )}
                </div>
            </div>

            {/* Background elements */}
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 blur-3xl rounded-full"></div>
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-black/20 blur-3xl rounded-full"></div>
        </motion.div>
    );
}
