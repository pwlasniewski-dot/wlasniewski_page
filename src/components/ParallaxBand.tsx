'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { getApiUrl } from "@/lib/api-config";

interface ParallaxBandProps {
    settingKey?: string;
    imageSrc?: string;
    title?: string;
    height?: string;
    overlayOpacity?: number;
    children?: React.ReactNode;
}

export default function ParallaxBand({
    settingKey,
    imageSrc,
    title,
    height = "min-h-[70vh] md:min-h-[80vh]",
    overlayOpacity = 0.35,
    children
}: ParallaxBandProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [finalImage, setFinalImage] = useState(imageSrc || '');

    // Framer Motion parallax scroll tracking
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    // Transform scroll progress to Y movement (-30% to +30% for visible effect)
    const y = useTransform(scrollYProgress, [0, 1], ["-30%", "30%"]);

    useEffect(() => {
        if (imageSrc) return;
        if (settingKey) {
            const fetchSettings = async () => {
                try {
                    const res = await fetch(getApiUrl('settings/public'));
                    const data = await res.json();
                    if (data.success && data.settings?.[settingKey]) {
                        setFinalImage(data.settings[settingKey]);
                    }
                } catch (error) {
                    // silent fail
                }
            };
            fetchSettings();
        }
    }, [settingKey, imageSrc]);

    if (!finalImage) return null;

    return (
        <section
            ref={ref}
            className={`relative ${height} w-full flex items-center justify-center overflow-hidden bg-zinc-950`}
            aria-label={title}
        >
            {/* Parallax Background - moves with scroll */}
            <motion.div
                style={{
                    y,
                    backgroundImage: `url(${finalImage})`,
                }}
                className="absolute inset-0 w-full h-[150%] -top-[25%] bg-cover bg-center bg-no-repeat z-0"
            />

            {/* Gradient Overlay */}
            <div
                className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50 z-10"
                style={{ opacity: overlayOpacity }}
            />

            {/* Content */}
            <div className="relative z-20 w-full max-w-7xl mx-auto px-4 flex items-center justify-center">
                {children || (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="text-center"
                    >
                        <h2 className="text-white text-5xl md:text-8xl lg:text-9xl font-extrabold tracking-tight drop-shadow-[0_4px_40px_rgba(0,0,0,0.95)] font-display leading-tight">
                            {title}
                        </h2>
                    </motion.div>
                )}
            </div>
        </section>
    );
}
