const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

throw new Error('Ten historyczny seeder Aero Analiza jest wyłączony. Użyj panelu Ustawienia → Aero Analiza oraz wersjonowanych stron v2.');

async function main() {
    console.log('🌱 Seeding/Updating B2B Page...');

    const sections = [
        // 1. HERO SECTION
        {
            id: "b2b-hero-seed",
            type: "b2b_hero",
            title: 'Wnieś Swój Biznes <span class="text-yellow-500">Na Wyższy Poziom</span>',
            subtitle: "Precyzyjne inspekcje techniczne, termowizja i monitoring inwestycji z lotu ptaka. Technologia, która oszczędza Twój czas i pieniądze.",
            tag: "B2B SOLUTIONS",
            image: "https://images.unsplash.com/photo-1506947411487-a5673826e6e0?q=80&w=2000&auto=format&fit=crop",
            buttonText: "ZAPYTAJ O OFERTĘ",
            buttonLink: "/b2b/kontakt"
        },
        // 2. STATS SECTION
        {
            id: "b2b-stats-seed",
            type: "b2b_stats",
            b2b_stats: [
                { id: "s1", value: "4K", label: "Rozdzielczość Video", prefix: "", suffix: "" },
                { id: "s2", value: "50+", label: "Zbadanych Dachów", prefix: "", suffix: "" },
                { id: "s3", value: "100%", label: "Zgodności z ULC", prefix: "", suffix: "" }
            ]
        },
        // 3. SERVICES (INFO BAND GRID)
        {
            id: "b2b-services-seed",
            type: "info_band",
            title: 'Specjalistyczne <span class="text-yellow-500">Usługi Dronem</span>',
            subtitle: "OBSZARY DZIAŁANIA",
            infoband_items: [
                {
                    id: "f1",
                    icon: "Thermometer",
                    title: "Inspekcje Termowizyjne",
                    description: "Wykrywanie mostków cieplnych, awarii paneli PV i wycieków ciepła za pomocą kamery Mavic 3 Thermal."
                },
                {
                    id: "f2",
                    icon: "Building2",
                    title: "Monitoring Inwestycji",
                    description: "Regularna dokumentacja postępów budowy z tej samej perspektywy (Timelapse). Raporty dla inwestorów."
                },
                {
                    id: "f3",
                    icon: "ShieldCheck",
                    title: "Inspekcje Infrastruktury",
                    description: "Bezpieczna ocena stanu technicznego bez konieczności wchodzenia na wysokość. Zdjęcia wysokiej rozdzielczości."
                },
                {
                    id: "f4",
                    icon: "Trees",
                    title: "Rolnictwo Precyzyjne",
                    description: "Szacowanie szkód łowieckich, analiza stanu upraw i mapowanie terenu."
                }
            ]
        },
        // 4. PARALLAX
        {
            id: "b2b-parallax-seed",
            type: "parallax",
            image: "https://images.unsplash.com/photo-1579829366248-204fe8413f31?q=80&w=2000&auto=format&fit=crop",
            title: "Flota: DJI Mavic 3 Thermal",
            subtitle: "Korzystamy z najnowocześniejszego sprzętu wyposażonego w kamery termowizyjne 640x512px oraz szerokokątne kamery 48MP."
        },
        // 5. CONTACT CTA
        {
            id: "b2b-cta-seed",
            type: "b2b_contact",
            title: "Gotowy na współpracę?",
            subtitle: "Skontaktuj się z nami, aby omówić szczegóły Twojego projektu. Wycena jest zawsze darmowa."
        }
    ];

    const existingPage = await prisma.page.findFirst({
        where: {
            slug: { in: ['b2b', 'oferta-b2b'] }
        }
    });

    if (existingPage) {
        console.log(`⚠️ Page found (ID: ${existingPage.id}). Updating sections...`);
        await prisma.page.update({
            where: { id: existingPage.id },
            data: {
                sections: JSON.stringify(sections),
                meta_title: "FOTO-DRON | Inspekcje Dronem, Termowizja, B2B",
                meta_description: "Profesjonalne usługi dronowe dla przemysłu i biznesu. Termowizja, inspekcje techniczne, monitoring inwestycji.",
                // Force title update if needed, but mostly sections are key
                title: "Oferta B2B",
                slug: "b2b"
            }
        });
        console.log('✅ B2B Page updated successfully!');
    } else {
        console.log('✨ Creating new B2B Page...');
        await prisma.page.create({
            data: {
                title: "Oferta B2B",
                slug: "b2b",
                content: "Strona Biznesowa",
                is_published: true,
                sections: JSON.stringify(sections),
                meta_title: "FOTO-DRON | Inspekcje Dronem, Termowizja, B2B",
                meta_description: "Profesjonalne usługi dronowe dla przemysłu i biznesu. Termowizja, inspekcje techniczne, monitoring inwestycji."
            }
        });
        console.log('✅ B2B Page created successfully!');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
