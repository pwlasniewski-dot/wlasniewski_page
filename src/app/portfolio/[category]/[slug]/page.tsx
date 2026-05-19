import { notFound } from 'next/navigation';
import { getCategory } from '@/lib/portfolio';
import { getApiUrl } from '@/lib/api-config';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LightboxGallery from '@/components/LightboxGallery';
import HeroSlider from '@/components/HeroSlider';

type Props = {
    params: Promise<{ category: string; slug: string }>;
};

// PERFORMANCE: Enable ISR instead of force-dynamic
// Revalidate every hour for better performance
export const revalidate = 3600;

export async function generateMetadata({ params }: Props) {
    const { slug } = await params;
    
    try {
        const prisma = (await import('@/lib/db/prisma')).default;
        const session = await prisma.portfolioSession.findUnique({
            where: { slug },
            select: {
                title: true,
                description: true,
                category: true,
                cover_image: {
                    select: {
                        file_path: true
                    }
                }
            }
        });

        if (!session) {
            return {
                title: 'Sesja nie znaleziona',
            };
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl';
        const coverImageUrl = session.cover_image?.file_path || null;

        return {
            title: `${session.title} | Portfolio`,
            description: session.description || `Zobacz zdjęcia z sesji: ${session.title}`,
            openGraph: {
                title: session.title,
                description: session.description || `Zobacz zdjęcia z sesji: ${session.title}`,
                type: 'website',
                url: `${baseUrl}/portfolio/${session.category}/${slug}`,
                images: coverImageUrl ? [{
                    url: coverImageUrl.startsWith('http') ? coverImageUrl : `${baseUrl}${coverImageUrl}`,
                    width: 1200,
                    height: 630,
                    alt: session.title,
                }] : [],
            },
        };
    } catch (error) {
        console.error('Error generating metadata:', error);
        return {
            title: 'Portfolio',
        };
    }
}

export async function generateStaticParams() {
    try {
        const prisma = (await import('@/lib/db/prisma')).default;
        const sessions = await prisma.portfolioSession.findMany({
            select: {
                slug: true,
                category: true
            }
        });

        return sessions.map((session: any) => ({
            category: session.category,
            slug: session.slug
        }));
    } catch (error) {
        console.error('Failed to generate static params:', error);
        // Fallback - will use ISR for new pages
        return [];
    }
}

export default async function SessionPage({ params }: Props) {
    const { category, slug } = await params;

    // Fetch session directly from database
    let session = null;
    try {
        const prisma = (await import('@/lib/db/prisma')).default;
        const dbSession = await prisma.portfolioSession.findUnique({
            where: {
                slug: slug
            },
            include: {
                cover_image: true
            }
        });

        if (dbSession) {
            session = {
                ...dbSession,
                id: Number(dbSession.id),
                cover_image_id: dbSession.cover_image_id ? Number(dbSession.cover_image_id) : null,
                cover_image_url: dbSession.cover_image?.file_path || null,
            };
        }
    } catch (error) {
        console.error('Failed to fetch session from DB', error);
    }

    if (!session) {
        notFound();
    }

    // Parse gallery image IDs
    let galleryIds: number[] = [];
    try {
        galleryIds = session.media_ids ? JSON.parse(session.media_ids) : [];

        // Handle case where media_ids might be just a string if legacy
        if (typeof galleryIds === 'string') {
            galleryIds = JSON.parse(galleryIds);
        }
    } catch (e) {
        console.error('Error parsing media_ids', e);
        galleryIds = [];
    }

    // Fetch actual image URLs directly from MediaLibrary
    let galleryImages: Array<{ id: number; url: string }> = [];
    if (galleryIds.length > 0) {
        try {
            const prisma = (await import('@/lib/db/prisma')).default;
            const mediaItems = await prisma.mediaLibrary.findMany({
                where: {
                    id: { in: galleryIds }
                }
            });

            galleryImages = galleryIds
                .map(id => {
                    const media = mediaItems.find(m => Number(m.id) === id);
                    return media ? { id, url: media.file_path } : null;
                })
                .filter(Boolean) as Array<{ id: number; url: string }>;

        } catch (error) {
            console.error('Failed to fetch gallery images from DB', error);
        }
    }

    return (
        <main className="min-h-screen bg-black text-white">
            {/* Hero Section Wrapper for Overlay */}
            <div className="relative">
                <HeroSlider
                    slides={[
                        // Cover Image as first slide
                        ...(session.cover_image_url ? [{
                            id: 'cover',
                            image: session.cover_image_url,
                            title: session.title,
                            subtitle: category,
                            description: session.description || undefined,
                            enabled: true,
                            order: 0,
                            textAnimation: 'fade' as const,
                            buttonText: 'Zobacz Zdjęcia',
                            buttonLink: '#gallery' // smooth scroll anchor
                        }] : []),
                        // Gallery images logic:
                        // 1. If there are starred (highlighted) images, show ALL of them (in order of appearance in gallery).
                        // 2. If no stars, show first 5 images as fallback.
                        ...(() => {
                            // Parse highlighted IDs
                            let highlightedIds: number[] = [];
                            try {
                                if (session.highlighted_media_ids) {
                                    highlightedIds = typeof session.highlighted_media_ids === 'string'
                                        ? JSON.parse(session.highlighted_media_ids)
                                        : session.highlighted_media_ids;
                                }
                            } catch (e) { console.error('Error parsing highlighted_ids', e); }

                            // Filter images that are highlighted
                            const starredImages = galleryImages.filter(img => highlightedIds.includes(img.id));

                            // Decide which set to use
                            const slidesImages = starredImages.length > 0 ? starredImages : galleryImages.slice(0, 5);

                            return slidesImages.map((img, index) => ({
                                id: img.id,
                                image: img.url,
                                title: session.title,
                                subtitle: category,
                                description: session.description || undefined,
                                enabled: true,
                                order: index + 1,
                                textAnimation: 'fade' as const,
                                buttonText: 'Zobacz Zdjęcia',
                                buttonLink: '#gallery'
                            }));
                        })()
                    ]}
                />

                {/* Back Link Overlay (Bottom Center) */}
                <div className="absolute bottom-32 sm:bottom-24 left-1/2 -translate-x-1/2 z-30 w-full flex justify-center pointer-events-none">
                    <Link
                        href={`/portfolio/${category}`}
                        className="pointer-events-auto inline-flex items-center text-white/90 hover:text-gold-400 transition-all bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 hover:border-gold-500/50 hover:bg-black/60 shadow-lg group"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="uppercase tracking-widest text-xs font-medium">Powrót</span>
                    </Link>
                </div>
            </div>

            {/* Gallery Grid Anchor */}
            <div id="gallery" />

            {/* Gallery Grid */}
            <section className="py-16 mx-auto">
                {galleryImages.length === 0 ? (
                    <div className="text-center py-32">
                        <p className="text-zinc-500 text-xl">Brak zdjęć w galerii</p>
                    </div>
                ) : (
                    <div className="max-w-[1920px] mx-auto md:px-8">
                        <LightboxGallery
                            photos={galleryImages.map(img => ({
                                src: img.url,
                                alt: session.title
                            }))}
                        />
                    </div>
                )}
            </section>

            {/* Session Info */}
            {session.session_date && (
                <section className="py-16 px-6 md:px-8 max-w-4xl mx-auto text-center border-t border-white/10">
                    <p className="text-zinc-400">
                        Data sesji: {new Date(session.session_date).toLocaleDateString('pl-PL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </section>
            )}
        </main>
    );
}
