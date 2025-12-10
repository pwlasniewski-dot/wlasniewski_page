const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding Photo Challenge data...');

    // 1. Seed Packages
    const packages = [
        {
            name: 'Pakiet Mini',
            description: 'Idealny na szybką sesję w plenerze',
            base_price: 299,
            challenge_price: 249,
            discount_percentage: 17,
            included_items: JSON.stringify(['30 minut sesji', '5 zdjęć po retuszu', 'Galeria online', 'Wydruki 15x23cm']),
            display_order: 1,
        },
        {
            name: 'Pakiet Standard',
            description: 'Najczęściej wybierany - pełna historia Waszej miłości',
            base_price: 449,
            challenge_price: 369,
            discount_percentage: 18,
            included_items: JSON.stringify(['60 minut sesji', '15 zdjęć po retuszu', 'Galeria online', 'Wydruki 15x23cm', 'Możliwość zmiany stylizacji']),
            display_order: 2,
        },
        {
            name: 'Pakiet Premium',
            description: 'Dla wymagających - sesja w kilku lokalizacjach',
            base_price: 699,
            challenge_price: 549,
            discount_percentage: 21,
            included_items: JSON.stringify(['90-120 minut sesji', '30 zdjęć po retuszu', 'Galeria online', 'Wydruki 15x23cm', '2-3 lokalizacje', 'Pendrive ze zdjęciami']),
            display_order: 3,
        },
    ];

    for (const pkg of packages) {
        await prisma.challengePackage.upsert({
            where: { id: pkg.display_order }, // Using display_order as pseudo-ID for upsert logic simplicity in seed
            update: pkg,
            create: pkg,
        });
    }
    console.log('✅ Packages seeded');

    // 2. Seed Locations
    const locations = [
        {
            name: 'Toruńska Starówka',
            description: 'Klimatyczne uliczki, ceglane mury i magia gotyku',
            address: 'Rynek Staromiejski, Toruń',
            display_order: 1,
        },
        {
            name: 'Bulwar Filadelfijski',
            description: 'Romantyczny spacer nad Wisłą z widokiem na panoramę',
            address: 'Bulwar Filadelfijski, Toruń',
            display_order: 2,
        },
        {
            name: 'Park Bydgoski',
            description: 'Zieleń, stara architektura i piękna fontanna',
            address: 'Park Miejski, Toruń',
            display_order: 3,
        },
        {
            name: 'Zamek Dybowski',
            description: 'Ruiny zamku i dzika natura - idealne na sesję boho',
            address: 'Dybowska, Toruń',
            display_order: 4,
        },
        {
            name: 'Barbarka',
            description: 'Las, stawy i drewniane pomosty',
            address: 'Przysiecka, Toruń',
            display_order: 5,
        },
    ];

    for (const loc of locations) {
        await prisma.challengeLocation.upsert({
            where: { id: loc.display_order },
            update: loc,
            create: loc,
        });
    }
    console.log('✅ Locations seeded');

    // 3. Seed Settings
    const settings = [
        { setting_key: 'module_enabled', setting_value: 'true', setting_type: 'boolean' },
        { setting_key: 'fomo_countdown_hours', setting_value: '24', setting_type: 'number' },
        { setting_key: 'landing_headline', setting_value: 'Przyjmij foto-wyzwanie', setting_type: 'text' },
        { setting_key: 'landing_subtitle', setting_value: 'Zaproś kogoś na sesję i zgarnij mega rabat', setting_type: 'text' },
        { setting_key: 'cta_button_text', setting_value: 'Zacznij wyzwanie', setting_type: 'text' },
        { setting_key: 'social_proof_enabled', setting_value: 'true', setting_type: 'boolean' },
        { setting_key: 'public_gallery_enabled', setting_value: 'true', setting_type: 'boolean' },
    ];

    for (const setting of settings) {
        await prisma.challengeSetting.upsert({
            where: { setting_key: setting.setting_key },
            update: {},
            create: setting,
        });
    }
    console.log('✅ Settings seeded');

    // 4. Seed Mock Media (if needed)
    // Check if we have media
    const mediaCount = await prisma.mediaLibrary.count();
    let mediaId = 1;

    if (mediaCount === 0) {
        console.log('Creating mock media...');
        const media = await prisma.mediaLibrary.create({
            data: {
                file_name: 'couple1.jpg',
                original_name: 'couple1.jpg',
                file_path: '/images/couples/couple1.jpg',
                file_size: 1024,
                mime_type: 'image/jpeg',
                folder: 'couples',
            }
        });
        mediaId = media.id;
    } else {
        const firstMedia = await prisma.mediaLibrary.findFirst();
        mediaId = firstMedia.id;
    }

    // 5. Seed Galleries
    const galleries = [
        {
            title: 'Anna i Marek',
            couple_names: 'Anna i Marek',
            session_type: 'para',
            testimonial_text: 'To była niesamowita przygoda! Zdjęcia wyszły przepięknie, a rabat był super dodatkiem.',
            is_published: true,
            show_in_public_gallery: true,
            published_at: new Date(),
        },
        {
            title: 'Kasia i Tomek',
            couple_names: 'Kasia i Tomek',
            session_type: 'narzeczeńska',
            testimonial_text: 'Polecamy każdemu! Przemek to profesjonalista.',
            is_published: true,
            show_in_public_gallery: true,
            published_at: new Date(),
        }
    ];

    for (const gal of galleries) {
        const gallery = await prisma.challengeGallery.create({
            data: gal,
        });

        // Add cover photo
        await prisma.challengePhoto.create({
            data: {
                gallery_id: gallery.id,
                media_id: mediaId,
                is_cover: true,
            }
        });
    }
    console.log('✅ Galleries seeded');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
