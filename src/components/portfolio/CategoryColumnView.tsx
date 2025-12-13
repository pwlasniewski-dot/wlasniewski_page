'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { PortfolioSession } from '@/lib/portfolio';
import Image from 'next/image';

interface CategoryColumnViewProps {
    sessions: PortfolioSession[];
}

export default function CategoryColumnView({ sessions }: CategoryColumnViewProps) {
    return (
        <div className="w-full min-h-screen bg-black pt-0 md:pt-28 pb-0 md:pb-12 px-0 md:px-8">
            <div className="w-full max-w-[1800px] mx-auto space-y-1 md:space-y-24">
                {sessions.map((session, index) => (
                    <motion.div
                        key={session.slug}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-10%" }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className="group relative block w-full h-[85vh] md:h-auto md:aspect-[21/9] overflow-hidden rounded-none md:rounded-lg"
                    >
                        <Link href={`/portfolio/${session.category}/${session.slug}`} className="block w-full h-full">
                            {/* Image Layer */}
                            <div className="absolute inset-0 w-full h-full transition-transform duration-[1.5s] group-hover:scale-105">
                                {/* Mobile Image (if available) - Only on small screens */}
                                {(session as any).cover_image_mobile_url && (
                                    <div className="block md:hidden w-full h-full relative">
                                        <Image
                                            src={(session as any).cover_image_mobile_url}
                                            alt={session.title}
                                            fill
                                            className="object-cover"
                                            sizes="100vw"
                                            priority={index < 2}
                                        />
                                    </div>
                                )}

                                {/* Desktop Image (or fallback for mobile if no mobile specific image) */}
                                {session.coverImage && (
                                    <div className={`${(session as any).cover_image_mobile_url ? 'hidden md:block' : 'block'} w-full h-full relative`}>
                                        <Image
                                            src={session.coverImage}
                                            alt={session.title}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 90vw"
                                            priority={index < 2}
                                        />
                                    </div>
                                )}

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                            </div>

                            {/* Text Content */}
                            <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 z-10 flex flex-col items-center md:items-start justify-end h-full text-center md:text-left">
                                <motion.div
                                    initial={{ y: 30, opacity: 0 }}
                                    whileInView={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="max-w-4xl"
                                >
                                    <h2 className="text-4xl md:text-7xl font-display font-medium text-white mb-3 md:mb-6 tracking-tight drop-shadow-2xl">
                                        {session.title}
                                    </h2>
                                    {session.description && (
                                        <p className="text-zinc-200 text-base md:text-xl font-light line-clamp-3 md:line-clamp-2 drop-shadow-lg max-w-2xl mx-auto md:mx-0">
                                            {session.description}
                                        </p>
                                    )}

                                    <div className="mt-8 inline-flex items-center text-sm md:text-base font-medium text-gold-400 uppercase tracking-[0.2em] border-b border-gold-400 pb-2 group-hover:text-white group-hover:border-white transition-colors">
                                        Zobacz sesję
                                    </div>
                                </motion.div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Scroll Indicator */}
            {sessions.length > 3 && (
                <div className="text-center mt-12 mb-12 text-zinc-500 text-xs tracking-widest uppercase">
                    Koniec listy
                </div>
            )}
        </div>
    );
}
