'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Camera, ArrowRight, Sparkles } from 'lucide-react';

interface PhotoChallengeBannerProps {
    title?: string;
    subtitle?: string;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
    layout?: 'full-width' | 'centered' | 'split' | 'overlay' | 'cards';
    backgroundImage?: string;
    accentColor?: string;
    animationStyle?: 'fade' | 'slide' | 'bounce' | 'pulse' | 'zoom';
    enableParticles?: boolean;
    enableCountdown?: boolean;
    photoGridImages?: string[];
    height?: string;
    textPosition?: 'center' | 'left' | 'right' | 'top' | 'bottom';
}

export default function PhotoChallengeBanner({
    title = '📸 Foto Wyzwanie',
    subtitle = 'Pokaż Swoją Kreatywność',
    description = 'Podejmij wyzwanie i wygraj fantastyczne nagrody! 10 kreatywnych zadań czeka na Ciebie.',
    buttonText = 'Dołącz Teraz',
    buttonLink = '/foto-wyzwanie',
    layout = 'full-width',
    backgroundImage = '/images/pattern.png',
    accentColor = 'gold',
    animationStyle = 'fade',
    enableParticles = true,
    enableCountdown = false,
    photoGridImages = [],
    height = 'min-h-[70vh]',
    textPosition = 'center'
}: PhotoChallengeBannerProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const colorClasses = {
        gold: {
            bg: 'from-gold-500/20 to-gold-500/5',
            button: 'bg-gold-500 hover:bg-gold-400 text-black',
            icon: 'text-gold-500',
            border: 'border-gold-500/30'
        },
        purple: {
            bg: 'from-purple-500/20 to-purple-500/5',
            button: 'bg-purple-500 hover:bg-purple-400 text-white',
            icon: 'text-purple-400',
            border: 'border-purple-500/30'
        },
        pink: {
            bg: 'from-pink-500/20 to-pink-500/5',
            button: 'bg-pink-500 hover:bg-pink-400 text-white',
            icon: 'text-pink-400',
            border: 'border-pink-500/30'
        },
        cyan: {
            bg: 'from-cyan-500/20 to-cyan-500/5',
            button: 'bg-cyan-500 hover:bg-cyan-400 text-black',
            icon: 'text-cyan-400',
            border: 'border-cyan-500/30'
        }
    };

    const colors = colorClasses[accentColor as keyof typeof colorClasses] || colorClasses.gold;

    // Render FULL WIDTH layout - максимально импресивный
    if (layout === 'full-width') {
        return (
            <section className={`relative w-full ${height} overflow-hidden bg-gradient-to-br from-zinc-900 via-black to-zinc-900`}>
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 1200 600">
                        <defs>
                            <pattern id="hero-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                                <circle cx="50" cy="50" r="1" fill="currentColor" />
                            </pattern>
                        </defs>
                        <rect width="1200" height="600" fill="url(#hero-pattern)" />
                    </svg>
                </div>

                {/* Animated gradient orbs */}
                {enableParticles && (
                    <>
                        <motion.div
                            className={`absolute top-20 -left-40 w-96 h-96 rounded-full bg-gradient-to-r ${colors.bg} blur-3xl`}
                            animate={{ y: [0, 50, 0], x: [0, 30, 0] }}
                            transition={{ duration: 8, repeat: Infinity }}
                        />
                        <motion.div
                            className={`absolute bottom-20 -right-40 w-96 h-96 rounded-full bg-gradient-to-l ${colors.bg} blur-3xl`}
                            animate={{ y: [0, -50, 0], x: [0, -30, 0] }}
                            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
                        />
                    </>
                )}

                {/* Content container */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="max-w-5xl mx-auto text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={isVisible ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.8 }}
                    >
                        {/* Icon badge */}
                        <motion.div
                            className={`inline-flex items-center justify-center gap-2 mb-6 px-4 py-2 rounded-full border ${colors.border} bg-white/5 backdrop-blur-sm`}
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Sparkles className={`w-4 h-4 ${colors.icon}`} />
                            <span className="text-sm font-semibold text-white">Limitowana edycja</span>
                        </motion.div>

                        {/* Main title with split animation */}
                        <motion.h1
                            className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-white mb-4 leading-tight"
                            initial={{ opacity: 0, y: 40 }}
                            animate={isVisible ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.8, delay: 0.1 }}
                        >
                            {title}
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            className={`text-2xl sm:text-3xl font-medium mb-6 bg-gradient-to-r from-white via-${accentColor}-200 to-white bg-clip-text text-transparent`}
                            initial={{ opacity: 0 }}
                            animate={isVisible ? { opacity: 1 } : {}}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            {subtitle}
                        </motion.p>

                        {/* Description */}
                        <motion.p
                            className="text-lg text-zinc-300 mb-12 max-w-2xl mx-auto leading-relaxed"
                            initial={{ opacity: 0 }}
                            animate={isVisible ? { opacity: 1 } : {}}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        >
                            {description}
                        </motion.p>

                        {/* CTA Button with hover effects */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={isVisible ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.8, delay: 0.4 }}
                        >
                            <Link
                                href={buttonLink}
                                className={`inline-flex items-center gap-3 px-10 py-5 ${colors.button} font-bold text-lg rounded-2xl shadow-2xl transition-all transform hover:scale-110 hover:shadow-2xl`}
                            >
                                {buttonText}
                                <motion.div
                                    animate={{ x: [0, 5, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    <ArrowRight className="w-6 h-6" />
                                </motion.div>
                            </Link>
                        </motion.div>

                        {/* Floating elements */}
                        <motion.div
                            className="mt-16 flex justify-center gap-8 flex-wrap"
                            animate={{ y: [0, 20, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                        >
                            <div className={`flex items-center gap-3 px-6 py-3 rounded-xl bg-white/10 border ${colors.border} backdrop-blur-sm`}>
                                <Camera className={`w-5 h-5 ${colors.icon}`} />
                                <span className="text-white font-semibold">10 Zadań</span>
                            </div>
                            <div className={`flex items-center gap-3 px-6 py-3 rounded-xl bg-white/10 border ${colors.border} backdrop-blur-sm`}>
                                <Sparkles className={`w-5 h-5 ${colors.icon}`} />
                                <span className="text-white font-semibold">Nagrody</span>
                            </div>
                            <div className={`flex items-center gap-3 px-6 py-3 rounded-xl bg-white/10 border ${colors.border} backdrop-blur-sm`}>
                                <Camera className={`w-5 h-5 ${colors.icon}`} />
                                <span className="text-white font-semibold">Twoja Kreacja</span>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Bottom gradient fade */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            </section>
        );
    }

    // Render CENTERED layout - simpler but still impressive
    if (layout === 'centered') {
        return (
            <section className={`relative w-full ${height} overflow-hidden bg-gradient-to-b from-zinc-900 to-black py-20 px-4`}>
                <div className="absolute inset-0 opacity-20 bg-[url('/images/pattern.png')]"></div>

                <div className="relative z-10 h-full flex items-center justify-center">
                    <motion.div
                        className="max-w-3xl mx-auto text-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={isVisible ? { opacity: 1, scale: 1 } : {}}
                        transition={{ duration: 0.8 }}
                    >
                        <div className={`mb-8 inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br ${colors.bg} border ${colors.border}`}>
                            <Camera className={`w-12 h-12 ${colors.icon}`} />
                        </div>

                        <h2 className="text-5xl sm:text-6xl font-display font-bold text-white mb-6">{title}</h2>
                        <p className="text-xl text-zinc-300 mb-12">{description}</p>

                        <Link
                            href={buttonLink}
                            className={`inline-flex items-center gap-2 px-8 py-4 ${colors.button} font-bold rounded-xl shadow-lg transition-all transform hover:scale-105`}
                        >
                            {buttonText}
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </motion.div>
                </div>
            </section>
        );
    }

    // Render SPLIT layout - text on one side, visual on the other
    if (layout === 'split') {
        return (
            <section className={`relative w-full ${height} overflow-hidden bg-gradient-to-br from-zinc-900 to-black`}>
                <div className="h-full grid md:grid-cols-2 gap-0">
                    {/* Left side - Visuals */}
                    <motion.div
                        className="relative flex items-center justify-center"
                        initial={{ opacity: 0, x: -50 }}
                        animate={isVisible ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.8 }}
                    >
                        <div className={`relative w-full h-full bg-gradient-to-br ${colors.bg}`}>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div
                                    className={`w-64 h-64 rounded-3xl bg-gradient-to-br ${colors.bg} border ${colors.border} flex items-center justify-center`}
                                    animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                >
                                    <Camera className={`w-32 h-32 ${colors.icon}`} />
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right side - Text */}
                    <motion.div
                        className="relative flex flex-col items-start justify-center p-12 lg:p-16"
                        initial={{ opacity: 0, x: 50 }}
                        animate={isVisible ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-5xl lg:text-6xl font-display font-bold text-white mb-6">{title}</h2>
                        <p className="text-zinc-300 text-lg mb-8 leading-relaxed">{description}</p>

                        <Link
                            href={buttonLink}
                            className={`inline-flex items-center gap-2 px-8 py-4 ${colors.button} font-bold rounded-xl shadow-lg transition-all transform hover:scale-105`}
                        >
                            {buttonText}
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </motion.div>
                </div>
            </section>
        );
    }

    // Render OVERLAY layout - image background with text overlay
    if (layout === 'overlay') {
        return (
            <section className={`relative w-full ${height} overflow-hidden`}>
                {backgroundImage && (
                    <Image
                        src={backgroundImage}
                        alt="Photo Challenge Banner"
                        fill
                        className="object-cover"
                        quality={100}
                    />
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>

                {/* Content */}
                <div className="relative z-10 h-full flex items-center p-6 sm:p-12">
                    <motion.div
                        className="max-w-2xl"
                        initial={{ opacity: 0, y: 30 }}
                        animate={isVisible ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-5xl sm:text-6xl font-display font-bold text-white mb-6">{title}</h2>
                        <p className="text-xl text-zinc-200 mb-10">{description}</p>

                        <Link
                            href={buttonLink}
                            className={`inline-flex items-center gap-2 px-8 py-4 ${colors.button} font-bold rounded-xl shadow-lg transition-all transform hover:scale-105`}
                        >
                            {buttonText}
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </motion.div>
                </div>
            </section>
        );
    }

    // Render CARDS layout - grid of interactive cards
    if (layout === 'cards') {
        return (
            <section className={`relative w-full ${height} overflow-hidden bg-gradient-to-b from-black to-zinc-900 px-4 py-12`}>
                <div className="relative z-10 max-w-6xl mx-auto">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        animate={isVisible ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-5xl font-display font-bold text-white mb-4">{title}</h2>
                        <p className="text-zinc-300 text-xl max-w-2xl mx-auto">{description}</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { icon: Camera, label: '10 Zadań', desc: 'Kreatywne wyzwania' },
                            { icon: Sparkles, label: 'Nagrody', desc: 'Fantastyczne ceny' },
                            { icon: ArrowRight, label: 'Dołącz', desc: 'Zaraz teraz' }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                className={`p-8 rounded-2xl bg-gradient-to-br ${colors.bg} border ${colors.border} backdrop-blur-sm`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.8, delay: i * 0.1 }}
                                whileHover={{ scale: 1.05, y: -10 }}
                            >
                                <item.icon className={`w-12 h-12 ${colors.icon} mb-4`} />
                                <h3 className="text-xl font-bold text-white mb-2">{item.label}</h3>
                                <p className="text-zinc-400">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        className="text-center mt-12"
                        initial={{ opacity: 0 }}
                        animate={isVisible ? { opacity: 1 } : {}}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        <Link
                            href={buttonLink}
                            className={`inline-flex items-center gap-2 px-10 py-5 ${colors.button} font-bold text-lg rounded-xl shadow-lg transition-all transform hover:scale-110`}
                        >
                            {buttonText}
                            <ArrowRight className="w-6 h-6" />
                        </Link>
                    </motion.div>
                </div>
            </section>
        );
    }

    return null;
}
