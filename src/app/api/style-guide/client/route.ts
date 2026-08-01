import prisma from '@/lib/db/prisma';
import { verifyToken } from '@/lib/auth/jwt';
import { publicStyleGuideCategoryFilter } from '@/lib/styleGuideAccess';
import { createClientPreparationGuideGetHandler } from '@/lib/clientPreparationGuideHandler';
import { PREPARATION_GUIDE_PAGE_SLUG } from '@/lib/preparationGuideCms';

export const dynamic = 'force-dynamic';

export const GET = createClientPreparationGuideGetHandler({
    verifyToken,
    findUser: (id) => prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, is_active: true, deleted_at: true },
        }),
    findOffer: (id) => prisma.offer.findUnique({
            where: { id },
            select: {
                id: true,
                category: true,
                client_id: true,
                client_email: true,
                session_location: true,
            },
        }),
    findPalettes: () => prisma.colorPalette.findMany({
        where: { is_active: true },
        select: {
            id: true, name: true, slug: true, description: true, season: true,
            location_type: true, mood: true, colors: true, example_images: true,
        },
        orderBy: { display_order: 'asc' },
        take: 6,
    }),
    findOutfits: () => prisma.outfitSet.findMany({
        where: {
            is_active: true,
            is_featured: true,
            ...publicStyleGuideCategoryFilter(),
        },
        include: {
            palette: { select: { id: true, name: true, colors: true } },
        },
        orderBy: { display_order: 'asc' },
        take: 6,
    }),
    findWardrobeTips: () => prisma.styleGuideTip.findMany({
        where: { is_active: true, ...publicStyleGuideCategoryFilter() },
        select: {
            id: true, title: true, slug: true, content: true, tip_type: true,
            category: true, icon: true, is_featured: true,
        },
        orderBy: [{ is_featured: 'desc' }, { display_order: 'asc' }],
        take: 12,
    }),
    findPoseTips: () => prisma.styleGuideTip.findMany({
        where: { is_active: true, category: 'pose' },
        select: {
            id: true, title: true, slug: true, content: true, tip_type: true,
            category: true, icon: true, is_featured: true,
        },
        orderBy: { display_order: 'asc' },
    }),
    findWardrobeFaqs: () => prisma.styleGuideFaq.findMany({
        where: { is_active: true, ...publicStyleGuideCategoryFilter() },
        select: { id: true, question: true, answer: true, category: true },
        orderBy: { display_order: 'asc' },
    }),
    findPoseFaqs: () => prisma.styleGuideFaq.findMany({
        where: { is_active: true, category: 'pose' },
        select: { id: true, question: true, answer: true, category: true },
        orderBy: { display_order: 'asc' },
    }),
    findCmsGuide: async () => {
        const page = await prisma.page.findUnique({
            where: { slug: PREPARATION_GUIDE_PAGE_SLUG },
            select: { content: true },
        });
        return page?.content ?? null;
    },
});
