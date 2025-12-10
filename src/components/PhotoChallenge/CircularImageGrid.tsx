'use client';

// Circular Image Grid with animations

import { motion } from 'framer-motion';
import Image from 'next/image';

interface CircularImageGridProps {
    images: Array<{
        url: string;
        alt: string;
        caption?: string;
    }>;
    columns?: 3 | 4 | 5;
}

export default function CircularImageGrid({ images, columns = 4 }: CircularImageGridProps) {
    const gridCols = {
        3: 'grid-cols-2 md:grid-cols-3',
        4: 'grid-cols-2 md:grid-cols-4',
        5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    };

    return (
        <div className={`grid ${gridCols[columns]} gap-6 md:gap-8 w-full max-w-5xl mx-auto`}>
            {images.map((image, index) => (
                <div key={index} className="flex flex-col items-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{
                            duration: 0.5,
                            delay: index * 0.1,
                            ease: 'easeOut',
                        }}
                        whileHover={{ scale: 1.1 }}
                        className="relative aspect-square w-full mb-4"
                    >
                        <div className="circular-frame w-full h-full relative overflow-hidden">
                            <Image
                                src={image.url}
                                alt={image.alt}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, 25vw"
                            />
                            <div className="absolute inset-0 bg-gold-400/0 hover:bg-gold-400/10 transition-all duration-300" />
                        </div>
                    </motion.div>
                    {image.caption && (
                        <p className="text-zinc-300 text-sm text-center font-medium mt-2">
                            {image.caption}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}
