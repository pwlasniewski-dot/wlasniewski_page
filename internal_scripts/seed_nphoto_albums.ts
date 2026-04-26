/**
 * Seed: 6 reprezentatywnych albumów nPhoto.
 * Po wgraniu admin może edytować/usunąć/dodać własne w panelu /admin/nphoto-albums.
 *
 * Zdjęcia: tymczasowe placeholdery z Unsplash (royalty-free).
 * Zamień URL-e na własne fotki z portfolio gdy gotowe.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const albums = [
    {
        title: 'Album Ślubny Premium Square',
        slug: 'album-slubny-premium-square',
        subtitle: 'Klasyczny album w oprawie skórzanej, format 30×30 cm',
        description:
            'Premium album ślubny nPhoto w eleganckiej oprawie ze skóry naturalnej. Kwadratowy format 30×30 cm, 40 stron z najwyższej jakości papieru fotograficznego. Idealny na wspomnienia z najważniejszego dnia. Każda strona drukowana cyfrowo w jakości studyjnej. Ręczna oprawa, eleganckie etui w komplecie.',
        category: 'wedding',
        occasion: ['wedding', 'engagement'],
        price: 1890,
        price_from: 1890,
        format: '30×30 cm',
        pages_count: 40,
        cover_type: 'Skóra naturalna',
        paper_type: 'Papier fotograficzny matowy 250g',
        cover_image_url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=85',
        preview_images: [
            'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=85',
            'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=85',
            'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=85',
        ],
        nphoto_shop_url: 'https://nphoto.com/album-slubny-premium',
        seo_title: 'Album Ślubny Premium 30×30 cm w oprawie skórzanej | Wlasniewski Photography',
        seo_description:
            'Premium album ślubny nPhoto w oprawie ze skóry naturalnej. Format 30×30 cm, 40 stron, papier matowy 250g. Idealna pamiątka z dnia ślubu.',
        seo_keywords: 'album ślubny, fotoksiążka ślubna, premium album, nphoto, fotograf toruń',
        is_active: true,
        is_featured: true,
        sort_order: 1,
    },
    {
        title: 'Fotoksiążka Ślubna Lux 30×20',
        slug: 'fotoksiazka-slubna-lux-30x20',
        subtitle: 'Lekka fotoksiążka w twardej oprawie, format poziomy',
        description:
            'Elegancka fotoksiążka w twardej oprawie z personalizowanym frontem (zdjęcie + grawer). Format poziomy 30×20 cm, 30 stron. Świetne rozwiązanie dla par ceniących minimalistyczny design. Cena startowa za 30 stron — możliwość rozszerzenia do 80.',
        category: 'wedding',
        occasion: ['wedding'],
        price: 890,
        price_from: 890,
        format: '30×20 cm',
        pages_count: 30,
        cover_type: 'Twarda oprawa z grawerem',
        paper_type: 'Papier fotograficzny błyszczący 200g',
        cover_image_url: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200&q=85',
        preview_images: [
            'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=85',
            'https://images.unsplash.com/photo-1525258946800-98cfd641d0de?w=1200&q=85',
        ],
        nphoto_shop_url: 'https://nphoto.com/fotoksiazka-slubna-lux',
        seo_title: 'Fotoksiążka Ślubna Lux 30×20 cm | Personalizowana okładka',
        seo_description:
            'Elegancka fotoksiążka ślubna w twardej oprawie z grawerem. Format poziomy 30×20, 30 stron, papier 200g. Cena od 890 zł.',
        seo_keywords: 'fotoksiążka ślubna, album ślubny, twarda oprawa, fotograf toruń',
        is_active: true,
        is_featured: true,
        sort_order: 2,
    },
    {
        title: 'Album Komunijny Klasyczny 25×25',
        slug: 'album-komunijny-klasyczny',
        subtitle: 'Pamiątka I Komunii Świętej w eleganckiej oprawie',
        description:
            'Album komunijny w klasycznej, kwadratowej oprawie 25×25 cm. 24 strony z miejscem na zdjęcia z uroczystości kościelnej, sesji portretowej i przyjęcia rodzinnego. Oprawa z eko-skóry z tłoczonym krzyżykiem. Pamiątka, która zostanie z dzieckiem na całe życie.',
        category: 'communion',
        occasion: ['communion'],
        price: 690,
        price_from: 690,
        format: '25×25 cm',
        pages_count: 24,
        cover_type: 'Eko-skóra z tłoczeniem',
        paper_type: 'Papier fotograficzny matowy 200g',
        cover_image_url: 'https://images.unsplash.com/photo-1541516160071-4bb0c5af65ba?w=1200&q=85',
        preview_images: [
            'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=1200&q=85',
            'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=1200&q=85',
        ],
        nphoto_shop_url: 'https://nphoto.com/album-komunijny',
        seo_title: 'Album Komunijny 25×25 cm | Pamiątka I Komunii Świętej',
        seo_description:
            'Klasyczny album komunijny w oprawie z eko-skóry z tłoczonym krzyżykiem. Format 25×25, 24 strony. Pamiątka z I Komunii Świętej na lata.',
        seo_keywords: 'album komunijny, fotoksiążka komunia, pamiątka komunijna, fotograf komunijny toruń',
        is_active: true,
        is_featured: true,
        sort_order: 3,
    },
    {
        title: 'Album Urodzinowy 18-stka',
        slug: 'album-urodzinowy-18-stka',
        subtitle: 'Nowoczesny album z 18-tych urodzin — premium prezent od rodziny',
        description:
            'Album urodzinowy w nowoczesnym designie. Kwadrat 30×30 cm, 32 strony, lakierowana okładka z indywidualnym projektem (imię, data, motyw). Idealny prezent od rodziców na 18-stkę — pamiątka z momentu wejścia w dorosłość. Dostępne motywy: gold-black, pastel, rustic, glamour.',
        category: 'birthday',
        occasion: ['birthday'],
        price: 990,
        price_from: 990,
        format: '30×30 cm',
        pages_count: 32,
        cover_type: 'Lakierowana okładka z grafiką',
        paper_type: 'Papier fotograficzny matowy 250g',
        cover_image_url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&q=85',
        preview_images: [
            'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&q=85',
            'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=85',
        ],
        nphoto_shop_url: 'https://nphoto.com/album-urodzinowy',
        seo_title: 'Album Urodzinowy na 18-stkę 30×30 cm | Premium prezent',
        seo_description:
            'Nowoczesny album z 18-tych urodzin. Format 30×30, 32 strony, lakierowana okładka z grafiką. Pamiątka pełnoletności jako prezent od rodziny.',
        seo_keywords: 'album 18 urodziny, fotoksiążka urodzinowa, prezent na 18-stkę, fotograf toruń',
        is_active: true,
        is_featured: true,
        sort_order: 4,
    },
    {
        title: 'Album Rodzinny Soft 25×20',
        slug: 'album-rodzinny-soft',
        subtitle: 'Lekka fotoksiążka rodzinna z miękką okładką',
        description:
            'Fotoksiążka rodzinna w miękkiej oprawie typu soft-cover. Format 25×20 cm, 24 strony. Idealna na wspomnienia z sesji rodzinnej w plenerze, wakacji, świąt. Lekka, łatwa do przechowywania i prezentowania. Cena startowa od 290 zł — najatrakcyjniejsza opcja w portfolio.',
        category: 'family',
        occasion: ['family', 'children'],
        price: 290,
        price_from: 290,
        format: '25×20 cm',
        pages_count: 24,
        cover_type: 'Miękka oprawa (soft-cover)',
        paper_type: 'Papier fotograficzny błyszczący 170g',
        cover_image_url: 'https://images.unsplash.com/photo-1581952976147-5a2d15560349?w=1200&q=85',
        preview_images: [
            'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=1200&q=85',
            'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200&q=85',
        ],
        nphoto_shop_url: 'https://nphoto.com/album-rodzinny',
        seo_title: 'Album Rodzinny Soft 25×20 cm | Fotoksiążka rodzinna od 290 zł',
        seo_description:
            'Lekka fotoksiążka rodzinna w miękkiej oprawie. Format 25×20, 24 strony. Idealna na sesję rodzinną, wakacje, święta. Cena od 290 zł.',
        seo_keywords: 'album rodzinny, fotoksiążka rodzinna, soft cover, sesja rodzinna toruń',
        is_active: true,
        is_featured: false,
        sort_order: 5,
    },
    {
        title: 'Album Noworodkowy Mini 20×20',
        slug: 'album-noworodkowy-mini',
        subtitle: 'Mały, miękki album z pierwszych dni życia',
        description:
            'Mini album noworodkowy w pastelowej, miękkiej oprawie. Format kwadrat 20×20 cm, 20 stron — idealny rozmiar do trzymania jedną ręką podczas karmienia. Pierwsze zdjęcia po porodzie, sesja noworodkowa, pierwszy spacer. Pamiątka, którą rodzice oglądają codziennie.',
        category: 'newborn',
        occasion: ['newborn', 'baby'],
        price: 390,
        price_from: 390,
        format: '20×20 cm',
        pages_count: 20,
        cover_type: 'Miękka pastelowa oprawa',
        paper_type: 'Papier fotograficzny matowy 200g',
        cover_image_url: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=1200&q=85',
        preview_images: [
            'https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=1200&q=85',
            'https://images.unsplash.com/photo-1521302200778-33500795e128?w=1200&q=85',
        ],
        nphoto_shop_url: 'https://nphoto.com/album-noworodkowy',
        seo_title: 'Album Noworodkowy Mini 20×20 cm | Pamiątka pierwszych dni',
        seo_description:
            'Mini album noworodkowy w pastelowej miękkiej oprawie. Format 20×20, 20 stron. Pamiątka z sesji noworodkowej i pierwszych dni życia.',
        seo_keywords: 'album noworodkowy, fotoksiążka noworodek, sesja noworodkowa, fotograf toruń',
        is_active: true,
        is_featured: false,
        sort_order: 6,
    },
];

(async () => {
    console.log('▶ Wgrywam 6 albumów startowych nPhoto...\n');
    let created = 0;
    let skipped = 0;
    for (const album of albums) {
        const existing = await prisma.nphotoAlbum.findUnique({ where: { slug: album.slug } });
        if (existing) {
            console.log(`  ⊘ Pomijam (już istnieje): ${album.title}`);
            skipped++;
            continue;
        }

        // Build JSON-LD Product schema
        const schema_markup = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: album.title,
            description: album.description,
            image: [album.cover_image_url, ...album.preview_images],
            brand: { '@type': 'Brand', name: 'nPhoto' },
            offers: {
                '@type': 'Offer',
                price: album.price,
                priceCurrency: 'PLN',
                availability: 'https://schema.org/InStock',
                url: `https://wlasniewski.pl/sklep/albumy/${album.slug}`,
            },
        };

        await prisma.nphotoAlbum.create({
            data: {
                ...album,
                preview_images: album.preview_images as any,
                schema_markup: schema_markup as any,
            },
        });
        console.log(`  ✓ Dodano: ${album.title} (${album.price} zł)`);
        created++;
    }
    console.log(`\n✓ Gotowe: utworzono ${created}, pominięto ${skipped}.`);
    console.log('  → Sprawdź https://wlasniewski.pl/sklep/albumy');
    console.log('  → Edytuj w panelu /admin/nphoto-albums');
    await prisma.$disconnect();
})();
