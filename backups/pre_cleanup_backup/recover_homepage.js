
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recoverHomepage() {
    console.log('🔄 START: Homepage Recovery');

    // 1. Fetch Legacy Settings
    const settings = await prisma.setting.findFirst();
    if (!settings) {
        console.warn('⚠️ No settings found. Using hardcoded defaults.');
    }

    // 2. Construct Home Data
    // NOTE: Based on logic in src/app/page.tsx, we need a structure like:
    // {
    //    hero_slider: [...],
    //    sections: [...],
    //    about_section: { ... },
    //    ...
    // }

    const defaultHeroSlides = [
        {
            id: 1,
            image: "https://images.unsplash.com/photo-1511285560982-1356c11d4606", // Fallback image
            title: "Fotografia Pełna Emocji",
            subtitle: "Utrwalam najpiękniejsze chwile Twojego życia",
            buttonText: "Zobacz Portfolio",
            buttonLink: "/portfolio",
            overlayOpacity: 0.3
        }
    ];

    const homeData = {
        hero_slider: defaultHeroSlides,

        // sections: REMOVED to force fallback logic in page.tsx which merges 'data' correctly
        about_section: {
            enabled: true,
            title: "O mnie",
            content: settings?.about_me_text || "Cześć! Nazywam się Przemysław Właśniewski. Fotografia to moja pasja...",
            image: settings?.about_me_photo || "",
            buttonText: "Więcej o mnie",
            buttonLink: "/o-mnie"
        },
        info_band: {
            enabled: true,
            title: settings?.info_band_title || "Wolne Terminy 2025",
            content: settings?.info_band_content || "Zapytaj o dostępność na Twój ślub.",
            image: settings?.info_band_image || ""
        }
    };

    // 3. Upsert "strona-glowna" Page
    console.log('📝 Updating "strona-glowna"...');

    await prisma.page.upsert({
        where: { slug: 'strona-glowna' },
        update: {
            home_sections: JSON.stringify(homeData),
            title: "Strona Główna",
            menu_title: "Start",
            is_in_menu: true,
            is_published: true
        },
        create: {
            slug: 'strona-glowna',
            title: "Strona Główna",
            home_sections: JSON.stringify(homeData),
            content: "{}", // Required field
            menu_title: "Start",
            is_in_menu: true,
            is_published: true,
            menu_order: 1
        }
    });

    console.log('✅ RECOVERY COMPLETE: "strona-glowna" has been seeded with default structure.');
    console.log('👉 Go to /admin/pages/strona-glowna to edit content.');
}

recoverHomepage()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
