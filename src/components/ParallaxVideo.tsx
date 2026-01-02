'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

interface ParallaxVideoProps {
    videoUrl: string;
    title?: string;
    subtitle?: string;
    height?: string; // e.g. "min-h-screen"
    overlayOpacity?: number;
    textColor?: string;
    textAnimation?: 'fade' | 'slide-up' | 'scale';
}

export default function ParallaxVideo({
    videoUrl,
    title,
    subtitle,
    height = "min-h-[80vh] md:min-h-screen",
    overlayOpacity = 0.4,
    textColor = '#FFFFFF',
    textAnimation = 'slide-up'
}: ParallaxVideoProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const springY = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // Mapped movement for parallax effect
    const yRange = isMobile ? ["-10%", "10%"] : ["-20%", "20%"];
    const y = useTransform(springY, [0, 1], yRange);

    const textVariants = {
        'fade': { initial: { opacity: 0 }, animate: { opacity: 1 } },
        'slide-up': { initial: { opacity: 0, y: 50 }, animate: { opacity: 1, y: 0 } },
        'scale': { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 } }
    };

    return (
        <section
            ref={ref}
            className={`relative w-full ${height} overflow-hidden bg-black flex items-center justify-center`}
        >
            {/* Background Video Layer with Parallax */}
            <div className="absolute inset-x-0 -top-[20%] h-[140%] z-0 pointer-events-none">
                <motion.div
                    style={{ y, willChange: 'transform' }}
                    className="relative w-full h-full"
                >
                    {videoUrl ? (
                        <video
                            src={videoUrl}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-zinc-900" />
                    )}
                </motion.div>
            </div>

            {/* Overlays */}
            <div
                className="absolute inset-0 z-10 bg-black pointer-events-none"
                style={{ opacity: overlayOpacity }}
            />

            {/* Edge Blurs */}
            <div className="absolute top-0 left-0 w-full h-32 md:h-64 bg-gradient-to-b from-black via-black/40 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-32 md:h-64 bg-gradient-to-t from-black via-black/40 to-transparent z-10 pointer-events-none" />

            {/* Content */}
            <div className="relative z-20 w-full max-w-7xl mx-auto px-6 text-center">
                <motion.div
                    initial={textVariants[textAnimation].initial}
                    whileInView={textVariants[textAnimation].animate}
                    viewport={{ once: true, margin: "-20%" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <h2
                        className="text-4xl md:text-7xl lg:text-9xl font-black tracking-tight drop-shadow-2xl"
                        style={{
                            color: textColor,
                            textShadow: '0 4px 30px rgba(0,0,0,0.5)'
                        }}
                        dangerouslySetInnerHTML={{ __html: title || '' }}
                    />
                    {subtitle && (
                        <p
                            className="text-lg md:text-3xl font-light tracking-wide mt-6 drop-shadow-xl"
                            style={{
                                color: (textColor === '#FFFFFF' || textColor === 'white') ? '#e4e4e7' : '#18181b',
                            }}
                        >
                            {subtitle}
                        </p>
                    )}
                </motion.div>
            </div>
        </section>
    );
}
