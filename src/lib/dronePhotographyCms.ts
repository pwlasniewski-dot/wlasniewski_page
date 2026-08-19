import 'server-only';
import prisma from '@/lib/db/prisma';
import {
    DEFAULT_DRONE_PHOTOGRAPHY_CONFIG,
    parseDronePhotographyConfig,
    type DronePhotographyConfig,
} from '@/lib/dronePhotographyOffer';

export type DronePhotographyCmsPage = {
    config: DronePhotographyConfig;
    title: string;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string[];
    fromCms: boolean;
};

export async function loadDronePhotographyCmsPage(): Promise<DronePhotographyCmsPage> {
    try {
        const page = await prisma.page.findFirst({
            where: { slug: { equals: 'fotografia-z-drona', mode: 'insensitive' } },
            select: {
                title: true,
                sections: true,
                meta_title: true,
                meta_description: true,
                meta_keywords: true,
                is_published: true,
            },
        });

        if (page?.sections && page.is_published) {
            return {
                config: parseDronePhotographyConfig(page.sections),
                title: page.title || 'Fotografia z drona',
                metaTitle: page.meta_title || 'Zdjęcia i filmy z drona Toruń | Pakiety od 449 zł',
                metaDescription: page.meta_description || 'Zdjęcia i filmy z drona w Toruniu i kujawsko-pomorskim: nieruchomości, firmy i śluby. Wybierz zakres i sprawdź termin.',
                metaKeywords: (page.meta_keywords || '').split(',').map(item => item.trim()).filter(Boolean),
                fromCms: true,
            };
        }
    } catch (error) {
        console.warn('[drone-photography] CMS unavailable, using safe defaults', error);
    }

    return {
        config: parseDronePhotographyConfig(DEFAULT_DRONE_PHOTOGRAPHY_CONFIG),
        title: 'Fotografia z drona',
        metaTitle: 'Zdjęcia i filmy z drona Toruń | Pakiety od 449 zł',
        metaDescription: 'Zdjęcia i filmy z drona w Toruniu i kujawsko-pomorskim: nieruchomości, firmy i śluby. Wybierz zakres i sprawdź termin.',
        metaKeywords: ['zdjęcia z drona Toruń', 'filmowanie dronem Toruń', 'fotografia nieruchomości dron kujawsko-pomorskie', 'dron na ślub Toruń'],
        fromCms: false,
    };
}
