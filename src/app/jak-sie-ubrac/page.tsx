import React from 'react';
import { Metadata } from 'next';
import StyleGuideContent from './StyleGuideContent';
import prisma from '@/lib/db/prisma';
import { publicStyleGuideCategoryFilter } from '@/lib/styleGuideAccess';

export const revalidate = 3600; // Cache for 1 hour

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Jak się ubrać na sesję? | Poradnik stylizacji',
        description: 'Profesjonalny poradnik jak się ubrać na sesję fotograficzną. Palety kolorów, przykładowe zestawy dla rodzin, par i grup. Porady stylistyczne dla różnych lokalizacji i pór roku.',
        keywords: ['jak się ubrać na sesję', 'stylizacja sesja rodzinna', 'paleta kolorów sesja', 'co ubrać na zdjęcia', 'poradnik fotograficzny'],
        alternates: { canonical: 'https://wlasniewski.pl/jak-sie-ubrac' },
        robots: { index: true, follow: true },
    };
}

export default async function JakSieUbracPage() {
    // Fetch featured content for SSR
    const [featuredPalettes, featuredOutfits, featuredTips, faqs] = await Promise.all([
        prisma.colorPalette.findMany({
            where: { is_active: true },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                season: true,
                location_type: true,
                mood: true,
                colors: true,
                example_images: true
            },
            orderBy: { display_order: 'asc' },
            take: 8
        }),
        
        prisma.outfitSet.findMany({
            where: { 
                is_active: true,
                is_featured: true,
                ...publicStyleGuideCategoryFilter(),
            },
            include: {
                palette: {
                    select: {
                        name: true,
                        colors: true
                    }
                }
            },
            orderBy: { display_order: 'asc' },
            take: 6
        }),
        
        prisma.styleGuideTip.findMany({
            where: { 
                is_active: true,
                is_featured: true,
                ...publicStyleGuideCategoryFilter(),
            },
            select: {
                id: true,
                title: true,
                content: true,
                tip_type: true,
                icon: true,
                is_featured: true
            },
            orderBy: { display_order: 'asc' },
            take: 6
        }),
        
        prisma.styleGuideFaq.findMany({
            where: { is_active: true, ...publicStyleGuideCategoryFilter() },
            select: {
                id: true,
                question: true,
                answer: true,
                category: true
            },
            orderBy: { display_order: 'asc' }
        })
    ]);

    return (
        <StyleGuideContent
            featuredPalettes={featuredPalettes}
            featuredOutfits={featuredOutfits}
            featuredTips={featuredTips}
            faqs={faqs}
        />
    );
}
