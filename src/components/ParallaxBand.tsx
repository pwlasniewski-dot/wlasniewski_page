'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

interface ParallaxSectionData {
    image?: string;
    image_desktop?: string;
    image_mobile?: string;
    title?: string;
    floatingImage?: boolean;
    parallaxSpeed?: number;
    imageOffset?: number;
    textOpacity?: number;
    textColor?: string;
    textAnimation?: 'fade' | 'slide-up' | 'scale';
}

interface ParallaxBandProps extends ParallaxSectionData {
    settingKey?: string;
    imageSrc?: string;
    height?: string;
    overlayOpacity?: number;
    children?: React.ReactNode;
}

export default function ParallaxBand({
    settingKey,
    imageSrc,
    title,
    height = "min-h-[60vh] md:min-h-[80vh] lg:min-h-screen",
    overlayOpacity = 0.4,
    image,
    image_desktop,
    image_mobile,
    floatingImage = true,
    parallaxSpeed = 0.5,
    imageOffset = 20,
    textOpacity = 1,
    textColor = 'white',
    textAnimation = 'fade',
    children
}: ParallaxBandProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [finalImage, setFinalImage] = useState(imageSrc || image || '');

    // Determine image based on screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Select image based on device
    useEffect(() => {
        const selectedImage = isMobile && image_mobile ? image_mobile : image_desktop || image || imageSrc || '';
        setFinalImage(selectedImage);
    }, [isMobile, image_mobile, image_desktop, image, imageSrc]);

    // Parallax scroll effect
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const parallaxY = useTransform(
        scrollYProgress,
        [0, 1],
        [imageOffset, -imageOffset * parallaxSpeed]
    );

    // Text animation variants
    const textVariants = {
        'fade': {
            initial: { opacity: 0 },
            animate: { opacity: textOpacity },
            transition: { duration: 1.2, ease: "easeOut" }
        },
        'slide-up': {
            initial: { opacity: 0, y: 60 },
            animate: { opacity: textOpacity, y: 0 },
            transition: { duration: 1, ease: "easeOut" }
        },
        'scale': {
            initial: { opacity: 0, scale: 0.8 },
            animate: { opacity: textOpacity, scale: 1 },
            transition: { duration: 1.2, ease: "easeOut" }
        }
    };

    if (!finalImage) return null;

    return (
        <section
            ref={ref}
            className={`relative ${height} w-full flex items-center justify-center overflow-hidden bg-black`}
            aria-label={title}
        >
            {/* Parallax Background Container */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                {floatingImage ? (
                    // Floating image with parallax effect
                    <motion.div
                        style={{
                            y: parallaxY,
                        }}
                        className="absolute inset-0 w-full h-full"
                    >
                        <div
                            className="w-full h-full bg-cover bg-center bg-no-repeat"
                            style={{
                                backgroundImage: `url(${finalImage})`,
                                backgroundAttachment: 'fixed',
                            }}
                        />
                    </motion.div>
                ) : (
                    // Static background image
                    <div
                        className="w-full h-full bg-cover bg-center bg-no-repeat"
                        style={{
                            backgroundImage: `url(${finalImage})`,
                        }}
                    />
                )}
            </div>

            {/* Gradient Overlay with customizable opacity */}
            <div
                className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60 z-10"
                style={{ opacity: overlayOpacity }}
            />

            {/* Content Container */}
            <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
                {children || (
                    <motion.div
                        initial={textVariants[textAnimation].initial}
                        whileInView={textVariants[textAnimation].animate}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={textVariants[textAnimation].transition}
                        className="text-center space-y-4"
                    >
                        <h2
                            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tighter drop-shadow-2xl font-display leading-tight"
                            style={{
                                color: textColor,
                                textShadow: '0 8px 32px rgba(0, 0, 0, 0.7), 0 4px 16px rgba(0, 0, 0, 0.5)',
                                opacity: textOpacity
                            }}
                        >
                            {title}
                        </h2>
                    </motion.div>
                )}
            </div>
        </section>
    );
}
