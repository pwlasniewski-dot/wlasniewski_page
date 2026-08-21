
import { PrismaClient } from '@prisma/client';

throw new Error('Ten historyczny seeder Aero Analiza jest wyłączony. Użyj panelu Ustawienia → Aero Analiza oraz wersjonowanych stron v2.');

const prisma = new PrismaClient();

const B2B_PAGES = [
    {
        slug: 'b2b',
        title: 'Przemysław Właśniewski Fotografia B2B',
        content: 'Home B2B Content',
        page_type: 'b2b',
        is_published: true,
        meta_title: 'Fotografia Biznesowa i Usługi Dronem | B2B',
        meta_description: 'Profesjonalne usługi dla firm: Termowizja, Inspekcje Dronem, Zdjęcia Biznesowe.',
        sections: [
            {
                id: 'hero-b2b',
                type: 'hero_slider',
                content: {
                    title: 'Wsparcie Biznesu i Przemysłu',
                    subtitle: 'Termowizja • Dron • Dokumentacja'
                },
                isVisible: true,
                order: 0
            },
            {
                id: 'services-grid',
                type: 'features',
                content: {
                    title: 'Dedykowane Usługi',
                    items: [
                        { title: 'Audyty Termowizyjne', description: 'Wykrywanie mostków cieplnych i wad izolacji.' },
                        { title: 'Inspekcje Dronem', description: 'Bezpieczna ocena stanu technicznego z powietrza.' }
                    ]
                },
                isVisible: true,
                order: 1
            }
        ]
    },
    {
        slug: 'dron',
        title: 'Usługi Dronem - Termowizja i Inspekcje',
        content: 'Drone Services Content',
        page_type: 'b2b',
        is_published: true,
        meta_title: 'Usługi Dronem Toruń | Termowizja z Powietrza',
        meta_description: 'Licencjonowane usługi dronem: inspekcje termowizyjne, ortofotomapy, wideo 4K.',
        sections: [] // Dynamic content handled by DronContent.tsx
    }
];

async function restoreB2B() {
    console.log('🔄 Starting B2B Pages Restoration...');

    for (const page of B2B_PAGES) {
        try {
            await prisma.page.upsert({
                where: { slug: page.slug },
                update: {
                    title: page.title,
                    page_type: page.page_type,
                    is_published: page.is_published,
                    meta_title: page.meta_title,
                    meta_description: page.meta_description,
                    sections: JSON.stringify(page.sections)
                },
                create: {
                    slug: page.slug,
                    title: page.title,
                    content: page.content,
                    page_type: page.page_type,
                    is_published: page.is_published,
                    meta_title: page.meta_title,
                    meta_description: page.meta_description,
                    sections: JSON.stringify(page.sections)
                }
            });
            console.log(`✅ Restored B2B Page: /${page.slug}`);
        } catch (e) {
            console.error(`❌ Failed to restore /${page.slug}:`, e);
        }
    }
}

restoreB2B()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
