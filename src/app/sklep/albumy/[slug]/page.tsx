import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import AlbumDetail from '@/components/sklep/AlbumDetail';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const album = await prisma.nphotoAlbum.findUnique({ where: { slug } });
    if (!album) return { title: 'Album nie znaleziony' };

    return {
        title: album.seo_title || `${album.title} | Albumy nPhoto`,
        description:
            album.seo_description ||
            album.subtitle ||
            album.description?.substring(0, 160) ||
            `Profesjonalny album fotograficzny ${album.title}`,
        openGraph: {
            title: album.seo_title || album.title,
            description: album.seo_description || album.subtitle || undefined,
            images: album.cover_image ? [album.cover_image] : undefined,
            type: 'website',
        },
        alternates: { canonical: `/sklep/albumy/${album.slug}` },
    };
}

export default async function AlbumDetailPage({ params }: PageProps) {
    const { slug } = await params;
    const album = await prisma.nphotoAlbum.findUnique({ where: { slug } });
    if (!album || !album.is_active) notFound();

    // Recommend related albums (same category)
    const related = await prisma.nphotoAlbum.findMany({
        where: {
            is_active: true,
            id: { not: album.id },
            ...(album.category ? { category: album.category } : {}),
        },
        take: 3,
        orderBy: [{ is_featured: 'desc' }, { sort_order: 'asc' }],
    });

    return (
        <>
            {album.schema_markup && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(album.schema_markup) }}
                />
            )}
            <AlbumDetail
                album={JSON.parse(JSON.stringify(album))}
                related={JSON.parse(JSON.stringify(related))}
            />
        </>
    );
}
