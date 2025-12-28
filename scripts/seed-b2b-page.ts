
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Seeding B2B Page...');

    const baseId = () => Math.random().toString(36).substr(2, 9);

    const templateSections = [
        {
            id: baseId(), type: 'hero_slider', slides: [
                { id: baseId(), image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?q=80&w=2070&auto=format&fit=crop', title: 'Inspekcje Dronowe i Monitoring', subtitle: 'Konkretna dokumentacja, która ma zastosowanie biznesowe. Bez marketingu, same fakty.', buttonText: 'ZAPYTAJ O OFERTĘ', buttonLink: '#rfq' },
                { id: baseId(), image: 'https://images.unsplash.com/photo-1485083269755-a7b559a4fe5e?q=80&w=2070&auto=format&fit=crop', title: 'Rzetelna Dokumentacja Inwestycji', subtitle: 'Kontroluj jakość i stan techniczny obiektów bez przestojów i rusztowań.', buttonText: 'POZNAJ PROCES', buttonLink: '#process' }
            ]
        },
        { id: baseId(), type: 'b2b_stats', b2b_stats: [{ id: baseId(), value: 'ITC', label: 'Certyfikacja Level 1', prefix: '', suffix: '' }, { id: baseId(), value: '100', label: 'Inwestycji', prefix: '+', suffix: '' }, { id: baseId(), value: 'OC', label: 'Polisa Komercyjna', prefix: '', suffix: '' }] },
        {
            id: baseId(), type: 'info_band', title: 'Technologie & <span class="text-yellow-500">Bezpieczeństwo</span>',
            subtitle: 'OBSZARY DZIAŁANIA',
            infoband_items: [
                { id: baseId(), icon: 'ShieldCheck', title: 'Inspekcje Techniczne', description: 'Szczegółowe przeglądy dachów, elewacji i konstrukcji bez rusztowań. Nie wstrzymujemy pracy obiektu.' },
                { id: baseId(), icon: 'Thermometer', title: 'Termowizja ITC Level 1', description: 'Diagnostyka strat ciepła, nieszczelności i awarii PV. Raporty dla przemysłu i OZE.' },
                { id: baseId(), icon: 'Building2', title: 'Monitoring Inwestycji', description: 'Cykliczna dokumentacja postępu prac. Spójny zapis "krok po kroku" dla inwestora.' }
            ]
        },
        {
            id: baseId(), type: 'info_band', title: 'Media & <span class="text-yellow-500">Długi Termin</span>',
            subtitle: 'FORMATY DANYCH',
            infoband_items: [
                { id: baseId(), icon: 'Clock', title: 'Timelapse Budowlany', description: 'Długoterminowa rejestracja postępów. Film pokazujący cały proces powstawania inwestycji.' },
                { id: baseId(), icon: 'Camera', title: 'Foto/Video dla Firm', description: 'Materiały 4K do raportów, prezentacji inwestorskich i promocji obiektów.' },
                { id: baseId(), icon: 'AlertTriangle', title: 'Jasny Zakres Usług', description: 'Nie wykonujemy: ortofotomap, modeli 3D ani pomiarów geodezyjnych. Stawiamy na obraz i termowizję.' }
            ]
        },
        {
            id: baseId(), type: 'b2b_process', title: 'Prosty proces <span class="text-yellow-500">współpracy</span>',
            subtitle: 'JAK DZIAŁAMY?',
            b2b_process: [
                { id: baseId(), title: 'Kontakt i Zakres', description: 'Omawiamy potrzeby: monitoring, timelapse czy inspekcja.', stepNumber: '01' },
                { id: baseId(), title: 'Plan Realizacji', description: 'Ustalamy harmonogram i sposób raportowania.', stepNumber: '02' },
                { id: baseId(), title: 'Realizacja i Raport', description: 'Wykonujemy naloty i dostarczamy gotową dokumentację.', stepNumber: '03' }
            ]
        },
        {
            id: baseId(), type: 'b2b_cases', title: 'Przykładowe Realizacje',
            b2b_cases: [
                {
                    id: baseId(), client: 'SEKTOR PRZEMYSŁOWY', title: 'Inspekcja Termowizyjna Hali', category: 'Termowizja',
                    image: 'https://images.unsplash.com/photo-1592833159057-6fdc2a5c3789?q=80&w=2070&auto=format&fit=crop',
                    description: 'Audyt szczelności dachu i elewacji. Wykrycie mostków cieplnych bez konieczności użycia podnośników.'
                },
                {
                    id: baseId(), client: 'DEWELOPERZY', title: 'Monitoring Osiedla Mieszkaniowego', category: 'Construction',
                    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop',
                    description: 'Cotygodniowe raporty zdjęciowe i wideo dokumentujące postęp prac dla zarządu i klientów.'
                },
                {
                    id: baseId(), client: 'INFRASTRUKTURA', title: 'Timelapse Budowy Drogi', category: 'Timelapse',
                    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop',
                    description: 'Półroczny zapis wideo pokazujący każdy etap powstawania nowej drogi dojazdowej.'
                }
            ]
        },
        {
            id: baseId(), type: 'certificates', certificateSize: 'readable', title: 'Gwarancja Bezpieczeństwa',
            certificates: [
                { id: baseId(), title: 'UAV Pilot', subtitle: 'A1/A2/A3/STS', description: 'Licencjonowane operacje w całej Europie.' },
                { id: baseId(), title: 'Termowizja ITC', subtitle: 'Level 1 Certified', description: 'Międzynarodowy certyfikat diagnostyki termowizyjnej.' },
                { id: baseId(), icon: 'ShieldCheck', title: 'Ubezpieczenie OC', subtitle: 'Polisa Komercyjna', description: 'Pełna ochrona dla każdej realizowanej misji.' }
            ]
        },
        { id: baseId(), type: 'b2b_contact', title: 'Zapytanie ofertowe', subtitle: 'Opisz krótko projekt. Na tej podstawie przygotuję konkretną wycenę i harmonogram.' }
    ];

    const slug = 'oferta-b2b';
    const title = 'Oferta B2B';

    try {
        const page = await prisma.page.upsert({
            where: { slug: slug },
            update: {
                title: title,
                content: '', // Required field
                sections: JSON.stringify(templateSections),
                is_published: true,
                page_type: 'regular',
                is_in_menu: true,
                menu_title: 'Oferta B2B',
                menu_order: 10,
                updated_at: new Date()
            },
            create: {
                slug: slug,
                title: title,
                content: '',
                sections: JSON.stringify(templateSections),
                is_published: true,
                page_type: 'regular',
                is_in_menu: true,
                menu_title: 'Oferta B2B',
                menu_order: 10
            }
        });

        console.log(`✅ Page '${slug}' updated successfully with ${templateSections.length} sections.`);
    } catch (error) {
        console.error('❌ Error updating page:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
