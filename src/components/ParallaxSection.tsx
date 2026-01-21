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

    // Configuration
    height?: string;
    overlayOpacity?: number;
    textOpacity?: number;
    textColor?: string;
    fontFamily?: 'sans' | 'serif' | 'display' | 'handwriting';
    textAnimation?: 'fade' | 'slide-up' | 'scale' | 'artistic';

    // Legacy/Unused but kept for compatibility
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
        const selected = isMobile && image_mobile
            ? image_mobile
            : image_desktop || image || imageSrc || '';
        setFinalImage(selected);
    }, [isMobile, image_mobile, image_desktop, image, imageSrc]);

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const yRange = isMobile ? ["-15%", "15%"] : ["-25%", "25%"];
    const y = useTransform(scrollYProgress, [0, 1], yRange);

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
            className={`relative w-full ${height} overflow-hidden bg-black flex items-center justify-center`}
        >
            {/* BACKGROUND LAYER */}
            <div className="absolute inset-x-0 -top-[30%] h-[160%] z-0 pointer-events-none">
                {finalImage && (
                    <motion.div
                        style={{ y, willChange: 'transform' }}
                        className="relative w-full h-full"
                    >
                        <div
                            className="absolute inset-0 bg-cover bg-no-repeat"
                            style={{
                                backgroundImage: `url(${finalImage})`,
                                backgroundPosition: 'center 15%'
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
                        initial={textVariants[textAnimation].initial}
                        whileInView={textVariants[textAnimation].animate}
                        viewport={{ once: true, margin: "-20%" }}
                        transition={{ duration: 1.2, ease: "easeOut" }} // Slower duration for artistic feel
                    >
                        <h2
                            className={`text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight drop-shadow-2xl ${activeFont}`}
                            style={{
                                color: textColor,
                                textShadow: '0 4px 30px rgba(0,0,0,0.8)' // Stronger shadow for readability
                            }}
                            dangerouslySetInnerHTML={{ __html: title || '' }}
                        />
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
