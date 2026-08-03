'use client';

import { motion, useReducedMotion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef, useState, useEffect, type CSSProperties } from 'react';

interface ParallaxSectionProps {
    // Content
    image?: string;
    image_desktop?: string;
    image_mobile?: string;

    title?: string;
    subtitle?: string;

    // Configuration
    height?: string;
    overlayOpacity?: number;
    textOpacity?: number;
    textColor?: string;
    fontFamily?: 'sans' | 'serif' | 'display' | 'handwriting';
    textAnimation?: 'fade' | 'slide-up' | 'scale' | 'artistic';

    // Motion controls stored by the CMS
    floatingImage?: boolean;
    parallaxSpeed?: number;
    imageOffset?: number;
    children?: React.ReactNode;

    // Allow alternate prop names
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
    fontFamily = 'display',
    textAnimation = 'slide-up',
    floatingImage = true,
    parallaxSpeed = 0.5,
    imageOffset = 15,
    children
}: ParallaxSectionProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [finalImage, setFinalImage] = useState('');
    const [isMobile, setIsMobile] = useState(true);
    const [motionReady, setMotionReady] = useState(false);
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        const mobileQuery = window.matchMedia('(max-width: 767px)');
        const updateViewport = () => {
            setIsMobile(mobileQuery.matches);
            setMotionReady(true);
        };

        updateViewport();
        mobileQuery.addEventListener('change', updateViewport);
        return () => mobileQuery.removeEventListener('change', updateViewport);
    }, []);

    useEffect(() => {
        const selected = isMobile && image_mobile
            ? image_mobile
            : image_desktop || image || imageSrc || '';
        setFinalImage(selected);
    }, [isMobile, image_mobile, image_desktop, image, imageSrc]);

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const clampedSpeed = Math.min(Math.max(parallaxSpeed, 0), 1.5);
    const travel = 64 * clampedSpeed;
    const overscan = Math.ceil(travel + 20);
    const rawY = useTransform(scrollYProgress, [0, 1], [-travel, travel]);
    const smoothY = useSpring(rawY, { stiffness: 72, damping: 24, mass: 0.35 });
    const mobileHeightMatch = height.match(/(?:^|\s)min-h-\[(\d+)(?:s?vh)\]/);
    const desktopHeightMatch = height.match(/(?:^|\s)md:min-h-\[(\d+)(?:s?vh)\]/);
    const mobileHeight = Math.min(Math.max(parseInt(mobileHeightMatch?.[1] || '80', 10), 50), 130);
    const desktopHeight = Math.min(Math.max(parseInt(desktopHeightMatch?.[1] || (height.includes('md:min-h-screen') ? '100' : String(mobileHeight)), 10), 50), 130);
    const parallaxEnabled = motionReady && floatingImage && !isMobile && !shouldReduceMotion;
    const sectionStyle = {
        '--parallax-mobile-height': `${mobileHeight}svh`,
        '--parallax-desktop-height': `${desktopHeight}svh`,
    } as CSSProperties;

    // Font Styles Map
    const fontClasses = {
        'sans': 'font-sans',
        'serif': 'font-serif',
        'display': 'font-display',
        'handwriting': 'font-handwriting' // Ensure this exists in tailwind config or use a specific class
    };

    const activeFont = fontClasses[fontFamily] || 'font-display';

    // Animation Variants
    const textVariants = {
        'fade': { initial: { opacity: 0 }, animate: { opacity: textOpacity } },
        'slide-up': { initial: { opacity: 0, y: 50 }, animate: { opacity: textOpacity, y: 0 } },
        'scale': { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: textOpacity, scale: 1 } },
        'artistic': {
            initial: { opacity: 0, filter: 'blur(10px)', letterSpacing: '0.5em' },
            animate: { opacity: textOpacity, filter: 'blur(0px)', letterSpacing: 'normal' }
        }
    };

    return (
        <section
            ref={ref}
            className="relative w-full min-h-[var(--parallax-mobile-height)] md:min-h-[var(--parallax-desktop-height)] overflow-hidden bg-black flex items-center justify-center"
            style={sectionStyle}
        >
            {/* BACKGROUND LAYER */}
            <div
                className="absolute inset-x-0 z-0 pointer-events-none"
                style={{ top: -overscan, bottom: -overscan }}
            >
                {finalImage && (
                    <motion.div
                        style={{ y: parallaxEnabled ? smoothY : 0, willChange: parallaxEnabled ? 'transform' : 'auto' }}
                        className="relative w-full h-full"
                    >
                        <div
                            className="absolute inset-0 bg-cover bg-no-repeat"
                            style={{
                                backgroundImage: `url(${finalImage})`,
                                backgroundPosition: `center ${Math.min(Math.max(imageOffset, 0), 100)}%`
                            }}
                        />
                    </motion.div>
                )}
            </div>

            {/* EDGE BLURS */}
            <div className="absolute top-0 left-0 w-full h-32 md:h-64 bg-gradient-to-b from-black via-black/60 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-32 md:h-64 bg-gradient-to-t from-black via-black/60 to-transparent z-10 pointer-events-none" />

            {/* OVERLAY */}
            <div
                className="absolute inset-0 z-10 bg-black pointer-events-none"
                style={{ opacity: overlayOpacity }}
            />

            {/* CONTENT */}
            <div className="relative z-20 w-full max-w-7xl mx-auto px-6 flex items-center justify-center text-center">
                {children || (
                    <motion.div
                        initial={shouldReduceMotion ? { opacity: 0 } : textVariants[textAnimation].initial}
                        whileInView={shouldReduceMotion ? { opacity: textOpacity } : textVariants[textAnimation].animate}
                        viewport={{ once: true, margin: "-20%" }}
                        transition={{ duration: 1.2, ease: "easeOut" }} // Slower duration for artistic feel
                    >
                        {title && (
                            <h2
                                className={`text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight drop-shadow-2xl ${activeFont}`}
                                style={{
                                    color: textColor,
                                    textShadow: '0 4px 30px rgba(0,0,0,0.8)'
                                }}
                                dangerouslySetInnerHTML={{ __html: title }}
                            />
                        )}
                        {subtitle && (
                            <p
                                className="text-lg md:text-2xl font-light tracking-wide mt-6 max-w-3xl mx-auto leading-relaxed"
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
