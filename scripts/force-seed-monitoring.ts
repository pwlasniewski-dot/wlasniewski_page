
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MONITORING_SECTIONS = [
    {
        id: 'mon_hero_01', type: 'b2b_hero', tag: 'MONITORING INWESTYCJI',
        title: 'Pełna kontrola nad <span class="text-yellow-500">Twoją budową</span>',
        subtitle: 'Regularna dokumentacja postępów prac, profesjonalne raporty dla inwestorów i widok 360° na cały plac budowy.',
        buttonText: 'ZAMÓW MONITORING',
        buttonLink: '#rfq',
        layout: 'left'
    },
    {
        id: 'mon_info_01', type: 'info_band', title: 'Dane, które <span class="text-yellow-500">budują zysk</span>',
        subtitle: 'KORZYŚCI DLA INWESTORA',
        infoband_items: [
            { id: 'mi_01', icon: 'Building2', title: 'Raporty Postępów', description: 'Cotygodniowe lub miesięczne serie ujęć dokumentujące każdą fazę realizacji.' },
            { id: 'mi_02', icon: 'Maximize2', title: 'Panorama 360°', description: 'Interaktywny widok na cały plac budowy umożliwiający zdalny nadzór.' },
            { id: 'mi_03', icon: 'Map', title: 'Mapowanie Terenu', description: 'Tworzenie ortofotomap i precyzyjnych modeli 3D do planowania inwestycji.' }
        ],
        layout: 'left'
    },
    {
        id: 'mon_cases_01', type: 'b2b_cases', title: 'Case Study: Realizacje',
        b2b_cases: [
            {
                id: 'mc_01', client: 'DEWELOPERZY', title: 'Monitoring Osiedla Mieszkaniowego', category: 'Construction',
                image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop',
                description: 'Cotygodniowe raporty zdjęciowe i wideo dokumentujące postęp prac dla zarządu i klientów.'
            },
            {
                id: 'mc_02', client: 'INFRASTRUKTURA', title: 'Timelapse Budowy Drogi', category: 'Timelapse',
                image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop',
                description: 'Półroczny zapis wideo pokazujący każdy etap powstawania nowej drogi dojazdowej.'
            }
        ],
        layout: 'left'
    },
    {
        id: 'mon_process_01', type: 'b2b_process', title: 'Logistyka <span class="text-yellow-500">nadzoru</span>.',
        subtitle: 'SCHEMAT DZIAŁANIA',
        b2b_process: [
            { id: 'mp_01', title: 'Ustalenie Harmonogramu', description: 'Definiujemy kluczowe etapy i częstotliwość nalotów.', stepNumber: '01' },
            { id: 'mp_02', title: 'Realizacja Sesji', description: 'Wykonujemy powtarzalne naloty z tych samych punktów kontrolnych.', stepNumber: '02' },
            { id: 'mp_03', title: 'Dostarczenie Raportu', description: 'Udostępniamy materiały w chmurze gotowe do prezentacji inwestorom.', stepNumber: '03' }
        ],
        layout: 'left'
    },
    { id: 'mon_contact_01', type: 'b2b_contact', title: 'Chcesz usprawnić nadzór nad budową?', subtitle: 'Dostosujemy częstotliwość nalotów i zakres dokumentacji do Twoich potrzeb.', layout: 'left' }
];

async function restoreMonitoring() {
    console.log('🏗️ Restoring Monitoring Page Content...');

    try {
        const page = await prisma.page.findFirst({
            where: { slug: 'monitoring' } // Using the corrected slug
        });

        if (page) {
            await prisma.page.update({
                where: { id: page.id },
                data: {
                    sections: JSON.stringify(MONITORING_SECTIONS),
                    title: 'Monitoring Inwestycji',
                    meta_description: 'Profesjonalny monitoring budowy z drona. Dokumentacja postępów prac, panoramy 360 i raporty dla inwestorów.',
                    updated_at: new Date()
                }
            });
            console.log('✅ Monitoring page restored with Template + Case Study');
        } else {
            console.error('❌ Page "monitoring" not found. Creating it...');
            await prisma.page.create({
                data: {
                    slug: 'monitoring',
                    title: 'Monitoring Inwestycji',
                    content: '',
                    sections: JSON.stringify(MONITORING_SECTIONS),
                    is_published: true,
                    page_type: 'b2b',
                    meta_title: 'Monitoring Inwestycji | Dron Bydgoszcz Toruń',
                    meta_description: 'Profesjonalny monitoring budowy z drona.',
                }
            });
            console.log('✅ Monitoring page CREATED with Template + Case Study');
        }

    } catch (e) {
        console.error('❌ Error restoring monitoring:', e);
    }
}

restoreMonitoring()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
