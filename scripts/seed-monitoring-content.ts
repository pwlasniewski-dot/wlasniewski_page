
import { PrismaClient } from '@prisma/client';

throw new Error('Ten historyczny seeder Aero Analiza jest wyłączony. Edytuj monitoring w CMS po publikacji wersji v2.');

const prisma = new PrismaClient();

async function seedMonitoringContent() {
    console.log('🏗️ Seeding B2B Monitoring Content...');

    // 1. Define the content structure based on PageBuilder
    // We align with the section types found in PageBuilder.tsx: 'b2b_hero', 'info_band', 'b2b_cases'
    const sections = [
        // HERO SECTION
        {
            id: 'hero_' + Math.random().toString(36).substr(2, 9),
            type: 'b2b_hero',
            tag: 'MONITORING INWESTYCJI',
            title: 'Kontroluj budowę <span class="text-yellow-500">bez wychodzenia z biura.</span>',
            subtitle: 'Cyfrowa dokumentacja postępów, ortofotomapy i precyzyjny monitoring inwestycji dronem. Zredukuj błędy i oszczędź czas na dojazdach.',
            buttonText: 'Zamów monitoring postępów',
            buttonLink: '/kontakt',
            // Using a placeholder or existing image if available, else generic construction or drone image
            image: '/images/monitoring-hero-placeholder.jpg', // User will likely update this via CMS
            videoUrl: '', // Optional video background
            overlayOpacity: 0.6
        },
        // INFO BAND (Trzy Filary)
        {
            id: 'pillars_' + Math.random().toString(36).substr(2, 9),
            type: 'info_band',
            title: 'Trzy Filary Usługi',
            subtitle: 'Kompleksowe wsparcie procesu budowlanego',
            infoband_items: [
                {
                    id: 'p1',
                    title: 'Cykliczne Raporty',
                    description: 'Zdjęcia i wideo z tych samych punktów co 7/14 dni. Pełna historia budowy i dowód dla inwestora.',
                    icon: 'Activity' // Represents frequent updates
                },
                {
                    id: 'p2',
                    title: 'Ortofotomapy RGB',
                    description: 'Wielkie, szczegółowe zdjęcie całego terenu (jak Google Maps, ale aktualne). Możliwość nanoszenia projektów CAD na stan faktyczny.',
                    icon: 'MapPin' // Represents mapping
                },
                {
                    id: 'p3',
                    title: 'Inwentaryzacja Stanu Zero',
                    description: 'Dokumentacja terenu i dróg przed wjazdem ciężkiego sprzętu. Ochrona przed niesłusznymi roszczeniami o zniszczenia.',
                    icon: 'ShieldCheck' // Represents protection/verification
                }
            ]
        },
        // CASE STUDY
        {
            id: 'cases_' + Math.random().toString(36).substr(2, 9),
            type: 'b2b_cases',
            b2b_cases: [
                {
                    id: 'c1',
                    title: 'Optymalizacja logistyki na placu budowy [Miasto]',
                    client: 'Inwestycja X',
                    description: 'Dzięki regularnym nalotom co 2 tygodnie, inwestor był w stanie wykryć kolizję składowania materiałów z planowanym przyłączem mediów na 10 dni przed wejściem ekipy.<br><br><strong>Technologia:</strong> Nalot fotogrametryczny (Mavic 3 Thermal), przetwarzanie danych w WebODM.',
                    image: '/images/case-study-placeholder.jpg', // Placeholder
                    logo: ''
                }
            ]
        }
    ];

    // 2. Define SEO Metadata
    const seoData = {
        meta_title: 'Monitoring Budowy Dronem Toruń, Bydgoszcz | Ortofotomapy | Właśniewski',
        meta_description: 'Profesjonalny monitoring inwestycji i postępów prac budowlanych dronem. Dokumentacja wizualna, ortofotomapy i inwentaryzacje w kujawsko-pomorskim.',
        meta_keywords: 'monitoring budowy dronem, ortofotomapa toruń, dokumentacja budowy z powietrza, naloty cykliczne dronem, deweloper monitoring inwestycji, fotogrametria niskiego pułapu'
    };

    try {
        // 3. Find and Update the Page
        // Try 'monitoring' slug first, then 'b2b/monitoring' just in case.
        let page = await prisma.page.findFirst({
            where: { slug: 'monitoring' }
        });

        if (!page) {
            console.log('Page "monitoring" not found, trying "b2b/monitoring"...');
            page = await prisma.page.findFirst({
                where: { slug: 'b2b/monitoring' }
            });
        }

        if (page) {
            console.log(`✅ Found page: ${page.title} (${page.slug})`);

            await prisma.page.update({
                where: { id: page.id },
                data: {
                    content: JSON.stringify(sections), // Serialize sections to JSON string
                    ...seoData,
                    title: 'Monitoring Inwestycji' // Ensure title is professional
                }
            });
            console.log('🚀 Successfully updated Monitoring page content & SEO.');
        } else {
            console.error('❌ Error: Monitoring page not found in database. Please ensure the page exists first.');
            // Optional: Create it if missing? 
            // For now, let's assume it exists from previous steps. If not, we should probably create it.
            console.log('⚠️ Attempting to create missing Monitoring page...');
            await prisma.page.create({
                data: {
                    slug: 'monitoring',
                    title: 'Monitoring Inwestycji',
                    content: JSON.stringify(sections),
                    ...seoData,
                    page_type: 'b2b',
                    is_published: true,
                    is_in_menu: true
                }
            });
            console.log('✅ Created new Monitoring page.');
        }

    } catch (e) {
        console.error('❌ Error during seeding:', e);
    }
}

seedMonitoringContent()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
