
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- REPAIRING PAGES CONTENT V4 ---');

    // 1. Fetch recent media - simplified query
    // If this fails, we fall back to placeholders immediately
    let media: any[] = [];
    try {
        const result = await prisma.mediaLibrary.findMany({
            take: 20
        });
        // manually sort since orderBy was crashing
        media = result.sort((a, b) => b.id - a.id);
        console.log(`Found ${media.length} recent media items.`);
    } catch (e) {
        console.log('⚠️ Failed to fetch media, using placeholders.');
        console.error(e);
    }

    // Attempt to guess images:
    // User uploaded 2 for gift cards? (screenshot appeared to show B&W outdoor)
    // User uploaded 1 for about me? (ballerina)

    const image1 = media[0]?.file_url || 'https://wlasniewski.pl/uploads/placeholder-hero.jpg';
    const image2 = media[1]?.file_url || media[0]?.file_url || 'https://wlasniewski.pl/uploads/placeholder-parallax.jpg';

    console.log(`Using Image 1 for Gift Card Hero: ${image1}`);
    console.log(`Using Image 2 for About Me Parallax: ${image2}`);

    // 2. Repair 'karta-podarunkowa'
    const giftCardSections = [
        {
            id: 'hero_repair_' + Date.now(),
            type: 'hero',
            data: {
                title: 'Karty Podarunkowe',
                subtitle: 'Podaruj bliskim coś więcej niż przedmiot. Podaruj niezapomniane wspomnienia.',
                image: image1,
                tag: 'PREMIUM GIFT CARDS',
                buttonText: '',
                buttonLink: ''
            }
        }
    ];

    await prisma.page.update({
        where: { slug: 'karta-podarunkowa' },
        data: {
            sections: JSON.stringify(giftCardSections),
            hero_image: image1,
            is_published: true
        }
    });
    console.log('✅ Repaired "karta-podarunkowa"');

    // 3. Repair 'o-mnie'
    // Preserve content if exists
    const aboutPage = await prisma.page.findUnique({ where: { slug: 'o-mnie' } });
    let existingContent = '';

    if (aboutPage && aboutPage.content && aboutPage.content.length > 20) {
        existingContent = aboutPage.content;
    } else {
        existingContent = `
            <h2>Emocje i naturalność:</h2>
            <p>Stawiam na autentyczność i dobrą zabawę w plenerze.</p>
            <h3>Bezstresowa atmosfera:</h3>
            <ul>
                <li>Robię wszystko, żebyś przed obiektywem czuł się swobodnie. Trzymam się jednej, żelaznej zasady. Naturalne emocje, to coś co uwielbiam szukać.</li>
            </ul>
            <h3>Naturalne światło:</h3>
            <ul>
                <li>Nie mam studia i wcale go nie potrzebuję – to słońce i otoczenie tworzą u mnie klimat, którego nie da się podrobić w czterech ścianach.</li>
            </ul>
            <h3>Wszechstronność:</h3>
            <ul>
                <li>Mój aparat towarzyszy mi wszędzie. Od intymnych sesji, przez rodzinne spotkania, aż po dynamiczne koncerty, urodziny czy eventy. Portfolio mówi samo za siebie – po prostu lubię łapać ważne momenty, niezależnie od okazji.</li>
            </ul>
        `;
    }

    const aboutMeSections = [
        {
            id: 'parallax_repair_' + Date.now(),
            type: 'parallax',
            data: {
                image: image2,
                title: 'Nowy parallax',
                subtitle: ''
            }
        },
        {
            id: 'text_repair_' + Date.now(),
            type: 'rich_text',
            data: {
                content: existingContent
            }
        }
    ];

    await prisma.page.update({
        where: { slug: 'o-mnie' },
        data: {
            sections: JSON.stringify(aboutMeSections),
            content: existingContent,
            parallax_sections: JSON.stringify([{ image: image2, title: 'Nowy parallax' }]),
            is_published: true
        }
    });
    console.log('✅ Repaired "o-mnie"');
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
