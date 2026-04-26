import { Metadata } from 'next';
import prisma from '@/lib/db/prisma';
import AlbumsCatalog from '@/components/sklep/AlbumsCatalog';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export const metadata: Metadata = {
    title: 'Profesjonalne Albumy Fotograficzne nPhoto | Wlasniewski Photography',
    description:
        'Premium albumy fotograficzne nPhoto na ślub, komunię, urodziny i sesje rodzinne. Najwyższa jakość druku, ręczna oprawa, eleganckie etui. Zobacz pełną kolekcję.',
    openGraph: {
        title: 'Profesjonalne Albumy Fotograficzne nPhoto',
        description:
            'Premium albumy nPhoto - ślubne, komunijne, rodzinne. Najwyższa jakość druku i ręcznej oprawy.',
        type: 'website',
    },
    alternates: { canonical: '/sklep/albumy' },
};

export default async function AlbumsCatalogPage() {
    const albums = await prisma.nphotoAlbum.findMany({
        where: { is_active: true },
        orderBy: [{ is_featured: 'desc' }, { sort_order: 'asc' }, { created_at: 'desc' }],
    });

    // Build ItemList JSON-LD for SEO
    const itemListSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Albumy fotograficzne nPhoto',
        numberOfItems: albums.length,
        itemListElement: albums.map((album, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            url: `/sklep/albumy/${album.slug}`,
            name: album.title,
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
            />
            <AlbumsCatalog albums={JSON.parse(JSON.stringify(albums))} />
        </>
    );
}
