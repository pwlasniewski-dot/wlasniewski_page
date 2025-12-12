'use client';

import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

interface ParallaxSectionProps {
    // Content
    image?: string;
    image_desktop?: string;
    image_mobile?: string;

    title?: string;
    subtitle?: string;

    // Configuration matches logic from previous component for compatibility
    height?: string; // Tailwind class e.g. "min-h-screen"
    overlayOpacity?: number;
    textOpacity?: number;
    textColor?: string;
    textAnimation?: 'fade' | 'slide-up' | 'scale';

    // Legacy/Unused but kept for strict prop compatibility if spread
    floatingImage?: boolean;
    parallaxSpeed?: number;
    imageOffset?: number; // kept for compatibility but logic is internal now
    children?: React.ReactNode;

    // Allow alternate prop names from CMS
    imageSrc?: string;
}

export default function ParallaxSection({
    image,
    imageSrc,
    image_desktop,
    image_mobile,

    title,
    subtitle,
    height = "min-h-[80vh] md:min-h-screen",
    overlayOpacity = 0.4,
    textColor = '#FFFFFF',
    textOpacity = 1,
    textAnimation = 'slide-up',
    children
}: ParallaxSectionProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [finalImage, setFinalImage] = useState('');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        // Priority: Mobile Specific -> Desktop Specific -> Generic -> ImageSrc (CMS)
        const selected = isMobile && image_mobile
            ? image_mobile
            : image_desktop || image || imageSrc || '';
        setFinalImage(selected);
    }, [isMobile, image_mobile, image_desktop, image, imageSrc]);

    // Track scroll progress of this specific section
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    // SMOOTH SCROLL PHYSICS
    // We map scroll 0..1 to Y transform.
    // To prevent gaps, we need the image to be taller than the container.
    // Implementation:
    // Container: h-full (relative)
    // Image: h-[120%] (absolute), top: -10% (centered)
    // Movement: -10% to +10% of section height is the safe range.
    // Let's use pixels for better control or % relative to image.

    // We move the image slowly against the scroll direction.
    // "start end" (bottom of viewport) -> y: -50px
    // "end start" (top of viewport) -> y: 50px
    // This allows the image to travel 100px total.
    // With 120% height, we have plenty of buffer.

    const springY = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const y = useTransform(springY, [0, 1], ["-30%", "30%"]);

    // Text Animations
    const textVariants = {
        'fade': { initial: { opacity: 0 }, animate: { opacity: textOpacity } },
        'slide-up': { initial: { opacity: 0, y: 50 }, animate: { opacity: textOpacity, y: 0 } },
        'scale': { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: textOpacity, scale: 1 } }
    };



    return (
        <section
            ref={ref}
            className={`relative w-full ${height} overflow-hidden bg-black flex items-center justify-center`}
        >
            {/* BACKGROUND LAYER */}
            {/* Absolute container that is TALLER than the section */}
            <div className="absolute inset-x-0 -top-[30%] h-[160%] z-0 pointer-events-none">
                {finalImage && (
                    <motion.div
                        style={{ y }}
                        className="relative w-full h-full"
                    >
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${finalImage})` }}
                        />
                    </motion.div>
                )}
            </div>

            {/* EDGE BLURS (Vignette/Fade) */}
            <div className="absolute top-0 left-0 w-full h-32 md:h-64 bg-gradient-to-b from-black via-black/60 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-32 md:h-64 bg-gradient-to-t from-black via-black/60 to-transparent z-10 pointer-events-none" />

            {/* OVERLAY LAYER */}
            <div
                className="absolute inset-0 z-10 bg-black pointer-events-none"
                style={{ opacity: overlayOpacity }}
            />

            {/* CONTENT LAYER */}
            <div className="relative z-20 w-full max-w-7xl mx-auto px-6 flex items-center justify-center text-center">
                {children || (
                    <motion.div
                        initial={textVariants[textAnimation].initial}
                        whileInView={textVariants[textAnimation].animate}
                        viewport={{ once: true, margin: "-20%" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <h2
                            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight drop-shadow-2xl"
                            style={{
                                color: textColor,
                                textShadow: '0 4px 20px rgba(0,0,0,0.5)'
                            }}
                        >
                            {title}
                        </h2>
                        {subtitle && (
                            <p
                                className="text-lg md:text-2xl font-light tracking-wide mt-4"
                                style={{
                                    color: (textColor === '#FFFFFF' || textColor === 'white') ? '#e4e4e7' : '#18181b',
                                    textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                                }}
                            >
                                {subtitle}
                            </p>
                        )}
                    </motion.div>
                )}
            </div>
        </section>
    );
}
