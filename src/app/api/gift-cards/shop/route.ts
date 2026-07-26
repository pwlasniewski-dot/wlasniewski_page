import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

const catalog = [
    { code: 'TPL-FAMILY-START-750', value: 750, theme: 'green', title: 'Sesja rodzinna Start', description: 'Spokojna sesja dla najbliższych. Dobra na prezent dla rodziny, która chce zachować wspólny czas na zdjęciach.' },
    { code: 'TPL-FAMILY-PLUS-1100', value: 1100, theme: 'green', title: 'Sesja rodzinna Plus', description: 'Więcej czasu i swobody podczas spotkania. Wariant dla większej rodziny albo sesji w dwóch miejscach.' },
    { code: 'TPL-GENERATIONS-1500', value: 1500, theme: 'mothers-day', title: 'Rodzinne pokolenia', description: 'Sesja dzieci, rodziców i dziadków. Prezent, który zostaje w rodzinie na lata.' },
    { code: 'TPL-COUPLE-750', value: 750, theme: 'valentines', title: 'Sesja dla dwojga', description: 'Naturalne zdjęcia pary bez wymuszonych póz. Na rocznicę, zaręczyny albo po prostu wspólny dzień.' },
    { code: 'TPL-MATERNITY-850', value: 850, theme: 'mothers-day', title: 'Sesja ciążowa', description: 'Subtelna pamiątka czasu oczekiwania. Sesję można zrealizować samodzielnie lub z partnerem i dziećmi.' },
    { code: 'TPL-PORTRAIT-750', value: 750, theme: 'gold', title: 'Portret premium', description: 'Dopracowana sesja portretowa dla kogoś, kto chce zobaczyć siebie w dobrym świetle.' },
    { code: 'TPL-BRAND-1100', value: 1100, theme: 'gold', title: 'Sesja wizerunkowa', description: 'Zdjęcia do strony, mediów społecznościowych i materiałów firmowych. Spójny wizerunek bez sztywnych kadrów.' },
    { code: 'TPL-CIVIL-WEDDING-1900', value: 1900, theme: 'wedding', title: 'Ślub cywilny', description: 'Reportaż z ceremonii, życzeń i krótkiej sesji pary. Zwarta opowieść z najważniejszej części dnia.' },
    { code: 'TPL-INTIMATE-WEDDING-2900', value: 2900, theme: 'wedding', title: 'Kameralny ślub', description: 'Ceremonia, spotkanie z bliskimi i portrety pary. Dla niewielkich uroczystości w spokojnym rytmie.' },
    { code: 'TPL-WEDDING-REPORTAGE-5000', value: 5000, theme: 'wedding', title: 'Reportaż ślubny', description: 'Fotografia ślubu kościelnego i przyjęcia. Pełna, uporządkowana historia dnia bez przypadkowych ujęć.' },
    { code: 'TPL-WEDDING-FULL-6500', value: 6500, theme: 'wedding', title: 'Pełny dzień ślubu', description: 'Reportaż od przygotowań po wieczorne przyjęcie oraz sesja pary. Najszerszy zakres dla kompletnej historii.' },
    { code: 'TPL-BIRTHDAY-1100', value: 1100, theme: 'birthday', title: 'Urodziny — krótki reportaż', description: 'Najważniejsze momenty urodzin, goście i rodzinne portrety. Dobry wybór na kameralne przyjęcie.' },
    { code: 'TPL-BIRTHDAY-FULL-1600', value: 1600, theme: 'birthday', title: 'Urodziny — pełny reportaż', description: 'Więcej czasu na emocje, detale i zdjęcia z bliskimi. Dla większego przyjęcia albo ważnej rocznicy.' },
    { code: 'TPL-COMMUNION-1500', value: 1500, theme: 'green', title: 'Komunia — ceremonia', description: 'Reportaż z uroczystości i rodzinne zdjęcia po Mszy. Dyskretna obecność i czytelna historia wydarzenia.' },
    { code: 'TPL-COMMUNION-FULL-2500', value: 2500, theme: 'green', title: 'Komunia i przyjęcie', description: 'Ceremonia, portrety rodzinne oraz najważniejsze chwile przyjęcia. Pełniejsza pamiątka dla dziecka i bliskich.' },
] as const;

export async function GET() {
    try {
        const settings = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });

        await Promise.all(catalog.map(product => prisma.giftCard.upsert({
            where: { code: product.code },
            update: {
                amount: product.value,
                value: product.value,
                theme: product.theme,
                card_title: product.title,
                card_description: product.description,
                notes: product.description,
                card_template: 'product',
                status: 'available',
                is_active: false,
                lowest_price_30d: product.value,
            },
            create: {
                code: product.code,
                amount: product.value,
                value: product.value,
                currency: 'PLN',
                theme: product.theme,
                card_title: product.title,
                card_description: product.description,
                notes: product.description,
                card_template: 'product',
                status: 'available',
                is_active: false,
                lowest_price_30d: product.value,
            },
        })));

        const cards = await prisma.giftCard.findMany({
            where: {
                code: { startsWith: 'TPL-' },
                status: 'available',
                card_template: 'product',
            },
            select: {
                id: true,
                value: true,
                amount: true,
                theme: true,
                card_title: true,
                card_description: true,
                notes: true,
                lowest_price_30d: true,
            },
        });

        const order = new Map(catalog.map((product, index) => [product.title, index]));
        const formattedCards = cards
            .map(card => ({
                id: card.id,
                code: 'PREVIEW',
                value: card.value || card.amount,
                theme: card.theme || 'gold',
                price: card.value || card.amount,
                lowest_price_30d: card.lowest_price_30d,
                description: card.card_description || card.notes,
                available: true,
                card_title: card.card_title,
                card_description: card.card_description,
            }))
            .sort((a, b) => (order.get(a.card_title || '') ?? 999) - (order.get(b.card_title || '') ?? 999));

        return NextResponse.json({
            cards: formattedCards,
            settings: {
                heroImage: (settings as any)?.gift_card_hero_image || null,
                heroOpacity: (settings as any)?.gift_card_hero_opacity || 0.6,
                rotationInterval: (settings as any)?.gift_card_promo_rotation_interval || 5,
                logoUrl: (settings as any)?.logo_url || null,
            },
        });
    } catch (error) {
        console.error('Error fetching gift cards:', error);
        return NextResponse.json({ error: 'Nie udało się pobrać kart podarunkowych.', cards: [] }, { status: 500 });
    }
}
