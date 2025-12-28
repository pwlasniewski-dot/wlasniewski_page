import { notFound } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import PageRenderer from '@/components/PageRenderer';
import { Metadata } from 'next';
import { PageSection } from '@/components/admin/PageBuilder';

async function getB2BPage() {
    // Try to find a page specifically named/slugged as b2b
    const page = await prisma.page.findFirst({
        where: {
            slug: { in: ['b2b', 'strona-b2b', 'oferta-b2b'] },
            is_published: true
        },
        orderBy: { updated_at: 'desc' }
    });
    return page;
}

export async function generateMetadata(): Promise<Metadata> {
    const page = await getB2BPage();

    if (!page) {
        return {
            title: 'Oferta B2B | Profesjonalne Usługi Dronem',
            description: 'Kompleksowe rozwiązania korporacyjne: inspekcje, termowizja i monitoring z powietrza.'
        };
    }

    return {
        title: page.meta_title || page.title,
        description: page.meta_description,
    };
}

export default async function B2BPage() {
    const page = await getB2BPage();

    let sections: PageSection[] = [];

    if (page?.sections) {
        try {
            sections = JSON.parse(page.sections);
        } catch (e) {
            console.error('Failed to parse B2B sections', e);
        }
    }

    // Default B2B sections if none found in DB (Bootstrap)
    if (sections.length === 0) {
        sections = [
            {
                id: 'default_b2b_hero',
                type: 'b2b_hero',
                title: 'Innowacyjne rozwiązania <span class="text-yellow-500">dla Twojego biznesu</span>',
                subtitle: 'Profesjonalne usługi dronem, termowizja i inspekcje techniczne z powietrza.',
                tag: 'B2B SOLUTIONS',
                buttonText: 'ZAPYTAJ O OFERTĘ',
                buttonLink: '#rfq'
            },
            {
                id: 'default_b2b_stats',
                type: 'b2b_stats',
                b2b_stats: [
                    { id: '1', value: '15+', label: 'Lat doświadczenia', prefix: '', suffix: '' },
                    { id: '2', value: '500+', label: 'Projektów', prefix: '', suffix: '' },
                    { id: '3', value: '100%', label: 'Bezpieczeństwa', prefix: '', suffix: '' }
                ]
            }
        ];
    }

    return (
        <main className="min-h-screen bg-black text-white selection:bg-yellow-500 selection:text-black">
            <PageRenderer sections={sections} />
        </main>
    );
}
