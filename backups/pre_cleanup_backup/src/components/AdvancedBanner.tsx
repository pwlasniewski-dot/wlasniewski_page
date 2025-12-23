'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import PuzzleGallery from './VisualEffects/PuzzleGallery';

interface BannerItem {
    id: string;
    type: 'image' | 'video' | 'challenge';
    src: string;
    challengePhotos?: string[];
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaLink?: string;
    animation?: 'fade' | 'slide-left' | 'slide-right' | 'zoom' | 'rotate';
    imageSize?: number;
    contentPosition?: 'left' | 'center' | 'right';
    imageShape?: 'original' | 'square' | 'circle' | 'rectangle';
    layout?: 'full' | 'split';
}

interface AdvancedBannerProps {
    items: BannerItem[];
    config?: {
        autoScroll?: boolean;
        interval?: number;
        height?: string;
        floating?: boolean;
    };
}

export default function AdvancedBanner({ items, config }: AdvancedBannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const autoScroll = config?.autoScroll ?? true;
    const interval = (config?.interval || 5) * 1000;
    const height = config?.height || '600px';
    const isFloating = config?.floating ?? false;

    useEffect(() => {
        if (!autoScroll || isHovered || items.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, interval);

        return () => clearInterval(timer);
    }, [autoScroll, interval, isHovered, items.length]);

    if (!items || items.length === 0) return null;
    const currentItem = items[currentIndex];

    const getVariants = (animType: string = 'fade') => {
        switch (animType) {
            case 'slide-left':
                return { initial: { x: -100, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: 100, opacity: 0 } };
            case 'slide-right':
                return { initial: { x: 100, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: -100, opacity: 0 } };
            case 'zoom':
                return { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 1.2, opacity: 0 } };
            case 'rotate':
                return { initial: { rotate: -5, opacity: 0, scale: 0.9 }, animate: { rotate: 0, opacity: 1, scale: 1 }, exit: { rotate: 5, opacity: 0, scale: 1.1 } };
            case 'fade':
            default:
                return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
        }
    };

    const textVariants = getVariants(currentItem.animation);

    // Prepare Photos for Puzzle - duplicate if only 1 photo
    let challengeParams = currentItem.challengePhotos || [];
    if (currentItem.type === 'challenge' && challengeParams.length === 1) {
        challengeParams = [challengeParams[0], challengeParams[0]];
    }
    const isValidChallenge = currentItem.type === 'challenge' && challengeParams.length >= 2;
    const imageSrc = currentItem.src;

    // Determine Visual Content
    let VisualContent = null;
    if (isValidChallenge) {
        VisualContent = (
            <div className="w-full h-full flex items-center justify-center scale-75 md:scale-100 origin-center bg-zinc-900">
                <PuzzleGallery photos={challengeParams.map((url: string) => ({ url }))} />
            </div>
        );
    } else if (imageSrc || (currentItem.type === 'video' && currentItem.src)) {
        VisualContent = (
            <>
                {currentItem.type === 'video' && currentItem.src ? (
                    <video
                        src={currentItem.src}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className={`object-cover ${currentItem.imageShape === 'circle' ? 'rounded-full aspect-square w-[min(80vh,80vw)] h-[min(80vh,80vw)]' :
                            currentItem.imageShape === 'square' ? 'aspect-square w-[min(80vh,80vw)] h-[min(80vh,80vw)]' :
                                currentItem.imageShape === 'rectangle' ? 'aspect-[4/3] w-[min(80vh,80vw)]' :
                                    'min-w-full min-h-full'}`}
                        style={{ transform: `scale(${(currentItem.imageSize || 100) / 100})` }}
                    />
                ) : (
                    <img
                        src={imageSrc}
                        alt={currentItem.title || 'Banner Slide'}
                        className={`object-cover ${currentItem.imageShape === 'circle' ? 'rounded-full aspect-square w-[min(80vh,80vw)] h-[min(80vh,80vw)]' :
                            currentItem.imageShape === 'square' ? 'aspect-square w-[min(80vh,80vw)] h-[min(80vh,80vw)]' :
                                currentItem.imageShape === 'rectangle' ? 'aspect-[4/3] w-[min(80vh,80vw)]' :
                                    'min-w-full min-h-full'}`}
                        style={{ transform: `scale(${(currentItem.imageSize || 100) / 100})` }}
                    />
                )}
            </>
        );
    }

    return (
        <div
            className={`relative w-full overflow-hidden bg-black ${isFloating ? 'bg-fixed' : ''}`}
            // Mobile: Auto height or min-height. Desktop: fixed height from config
            style={{
                height: 'auto',
                minHeight: 'min(100vh, 600px)'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Desktop Height Enforcer via generic CSS if needed, but inline style preferred for flexibility */}
            <style jsx>{`
                @media (min-width: 768px) {
                    div[data-banner-container] {
                        height: ${height} !important;
                    }
                }
            `}</style>

            <div data-banner-container className="relative w-full h-full min-h-[500px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentItem.id}
                        className="absolute inset-0 w-full h-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <div className={`w-full h-full relative flex flex-col md:block ${currentItem.layout === 'split' ? 'md:grid md:grid-cols-2' : ''}`}>
                            {/* Visual Side */}
                            <div className={`relative w-full h-[50vh] md:h-full overflow-hidden flex items-center justify-center ${currentItem.layout === 'split' ? (currentItem.contentPosition === 'left' ? 'order-1 md:order-2' : 'order-1') : 'absolute inset-0'}`}>
                                {VisualContent}
                                {currentItem.layout === 'full' && !isValidChallenge && <div className="absolute inset-0 bg-black/40" />}
                            </div>

                            {/* Content Side */}
                            <div className={`relative z-10 flex flex-col justify-center p-4 md:p-16 flex-grow md:flex-grow-0 ${currentItem.layout === 'split'
                                ? (currentItem.contentPosition === 'left' ? 'order-2 md:order-1 bg-zinc-900' : 'order-2 bg-zinc-900')
                                : 'pointer-events-none absolute inset-0'
                                }`}>
                                <div className={`pointer-events-auto max-w-4xl break-words ${currentItem.layout === 'split'
                                    ? (currentItem.contentPosition === 'left' ? 'text-left mr-auto' : currentItem.contentPosition === 'right' ? 'text-right ml-auto' : 'text-center mx-auto')
                                    : 'text-center mx-auto mt-[40%] md:mt-0 px-4' // Push text down on mobile full layout
                                    }`}>
                                    {currentItem.title && (
                                        <motion.h2
                                            variants={textVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            transition={{ duration: 0.8, delay: 0.2 }}
                                            className="text-3xl md:text-6xl font-bold text-white mb-4 font-display drop-shadow-lg"
                                        >
                                            {currentItem.title}
                                        </motion.h2>
                                    )}

                                    {currentItem.subtitle && (
                                        <motion.p
                                            variants={textVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            transition={{ duration: 0.8, delay: 0.4 }}
                                            className="text-base md:text-2xl text-zinc-200 mb-6 md:mb-8 max-w-2xl drop-shadow-md leading-relaxed"
                                        >
                                            {currentItem.subtitle}
                                        </motion.p>
                                    )}

                                    {currentItem.ctaText && currentItem.ctaLink && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.6 }}
                                        >
                                            <Link
                                                href={currentItem.ctaLink}
                                                className="inline-block bg-gold-500 hover:bg-gold-400 text-black font-bold px-6 py-3 md:px-8 md:py-4 rounded-full transition-transform hover:scale-105 shadow-lg text-sm md:text-base"
                                            >
                                                {currentItem.ctaText}
                                            </Link>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Dots */}
                {items.length > 1 && (
                    <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                        {items.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-gold-500 w-6 md:w-8' : 'bg-white/50 w-2 md:w-3 hover:bg-white'}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
