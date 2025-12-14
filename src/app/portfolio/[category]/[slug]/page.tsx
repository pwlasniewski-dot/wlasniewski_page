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

    console.log('[SessionPage] Parsed gallery IDs:', galleryIds);

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
            {/* Hero Section */}
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
                    // First 5 gallery images as subsequent slides
                    ...galleryImages.slice(0, 5).map((img, index) => ({
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
                    }))
                ]}
            />

            {/* Back Link Overlay (Absolute positioning over slider) */}
            <div className="absolute top-24 left-4 md:left-8 z-30">
                <Link
                    href={`/portfolio/${category}`}
                    className="inline-flex items-center text-white/80 hover:text-gold-400 transition-colors bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full"
                >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Powrót do {category}
                </Link>
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
