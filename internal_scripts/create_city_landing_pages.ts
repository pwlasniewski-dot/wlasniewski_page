import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const cities = [
    {
        slug: 'grudziadz',
        name: 'Grudziądz',
        distance: '35 km',
        landmarks: 'Twierdza Grudziądz, Most Drogowy, Stare Miasto',
        population: '90 tys.',
        industries: 'przemysł spożywczy, magazyny, deweloperka mieszkaniowa'
    },
    {
        slug: 'inowroclaw',
        name: 'Inowrocław',
        distance: '40 km',
        landmarks: 'Solanki, Park Solankowy, Stare Miasto',
        population: '70 tys.',
        industries: 'uzdrowiska, przemysł chemiczny, rozwój mieszkaniowy'
    },
    {
        slug: 'brodnica',
        name: 'Brodnica',
        distance: '55 km',
        landmarks: 'Zamek, Rynek, Jezioro Zbiczno',
        population: '27 tys.',
        industries: 'turystyka, rolnictwo, małe i średnie przedsiębiorstwa'
    },
    {
        slug: 'swiecie',
        name: 'Świecie',
        distance: '50 km',
        landmarks: 'Bulwary Nadwiślańskie, Most Wisły',
        population: '25 tys.',
        industries: 'przemysł papierniczy, transport, logistyka'
    },
    {
        slug: 'chelmno',
        name: 'Chełmno',
        distance: '25 km',
        landmarks: 'Mury Obronne, Ratusz, Stare Miasto',
        population: '19 tys.',
        industries: 'turystyka historyczna, małe firmy, rzemiosło'
    },
    {
        slug: 'mogilno',
        name: 'Mogilno',
        distance: '70 km',
        landmarks: 'Jezioro Mogileńskie, Bazylika',
        population: '12 tys.',
        industries: 'turystyka jeziorowa, gospodarka rolna'
    }
];

async function main() {
    console.log('=== CREATING CITY LANDING PAGES ===\n');

    for (const city of cities) {
        console.log(`📍 Creating page for: ${city.name}`);

        const sections = [
            // 1. HERO
            {
                id: `hero-${city.slug}`,
                type: 'b2b_hero',
                title: `Inspekcje Dronem <span class="text-yellow-500">${city.name}</span>`,
                subtitle: `Profesjonalne usługi dronem w ${city.name}. Termowizja ITC Level 1, monitoring budów, inspekcje dachów. Dojeżdżamy z Płużnicy (${city.distance}). Certyfikat, raport w 48h.`,
                image: 'https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/1767269527658-dji_0027.webp',
                buttonText: 'ZAPYTAJ O WYCENĘ',
                buttonLink: '#rfq'
            },
            // 2. USP BAND
            {
                id: `usp-${city.slug}`,
                type: 'info_band',
                title: `Dlaczego ${city.name}?`,
                text: `Obsługujemy ${city.name} i okolice (${city.distance} z Płużnicy). ${city.landmarks}. Populacja ${city.population} – idealny rynek dla ${city.industries}.`,
                background: 'dark'
            },
            // 3. STATS
            {
                id: `stats-${city.slug}`,
                type: 'b2b_stats',
                b2b_stats: [
                    { id: 's1', value: '640×512', label: 'Rozdzielczość Termowizji', suffix: 'px' },
                    { id: 's2', value: city.distance.split(' ')[0], label: `Odległość z Płużnicy`, suffix: 'km' },
                    { id: 's3', value: '48', label: 'Godziny do Raportu', suffix: 'h' },
                    { id: 's4', value: '4K', label: 'Jakość Wideo' }
                ]
            },
            // 4. SERVICES
            {
                id: `termo-${city.slug}`,
                type: 'image_text',
                layout: 'right',
                title: `Termowizja <span class="text-yellow-500">w ${city.name}</span>`,
                subtitle: 'DIAGNOSTYKA TERMOWIZYJNA',
                content: `<p class="text-lg text-zinc-300 leading-relaxed mb-4">Audyty energetyczne budynków, inspekcje instalacji PV, diagnostyka sieci ciepłowniczych w ${city.name} i okolicach.</p>

<ul class="space-y-3 text-zinc-300">
<li>✓ Kamera 640×512 px, dokładność ±2°C</li>
<li>✓ Certyfikat ITC Level 1</li>
<li>✓ Hot spoty, mostki cieplne, straty ciepła</li>
<li>✓ Raport PDF + termogramy RGB w 48h</li>
</ul>`,
                image: 'https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/1767087068954-dji_20251230082630_0002_t.webp',
                buttonText: 'SZCZEGÓŁY TERMOWIZJI',
                buttonLink: '/b2b/termowizja'
            },
            {
                id: `monitoring-${city.slug}`,
                type: 'image_text',
                layout: 'left',
                title: `Monitoring Budów <span class="text-yellow-500">${city.name}</span>`,
                subtitle: 'DOKUMENTACJA INWESTYCJI',
                content: `<p class="text-lg text-zinc-300 leading-relaxed mb-4">Dokumentacja postępów budowy dla deweloperów i generalnych wykonawców w ${city.name}.</p>

<ul class="space-y-3 text-zinc-300">
<li>✓ Cykliczne przeloty z tej samej wysokości</li>
<li>✓ Ortofotomapy 2D (poglądowe)</li>
<li>✓ Time-lapse 4K postępu inwestycji</li>
<li>✓ Raporty PDF dla banków i funduszy</li>
</ul>`,
                image: 'https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/1767269534587-dji_0048.webp',
                buttonText: 'SZCZEGÓŁY MONITORINGU',
                buttonLink: '/b2b/monitoring'
            },
            {
                id: `dachy-${city.slug}`,
                type: 'image_text',
                layout: 'right',
                title: `Inspekcje Dachów <span class="text-yellow-500">${city.name}</span>`,
                subtitle: 'BEZPIECZNE KONTROLE',
                content: `<p class="text-lg text-zinc-300 leading-relaxed mb-4">Bezinwazyjne kontrole dachów wspólnot mieszkaniowych i zarządców w ${city.name}.</p>

<ul class="space-y-3 text-zinc-300">
<li>✓ Stan pokrycia dachowego bez wysięgników</li>
<li>✓ Kominy, rynny, obróbki blacharskie</li>
<li>✓ Kontrola po wichurach dla ubezpieczalni</li>
<li>✓ Raport HD + wideo + zalecenia w 24h</li>
</ul>`,
                image: 'https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/1767269531245-dji_0042.webp'
            },
            // 5. PROCESS
            {
                id: `process-${city.slug}`,
                type: 'b2b_process',
                title: 'Jak <span class="text-yellow-500">współpracujemy?</span>',
                subtitle: 'PROSTY PROCES',
                steps: [
                    { id: 'step1', number: '01', title: 'Kontakt', description: `Napisz lub zadzwoń. Przygotujemy wycenę dla ${city.name} w kilka godzin.` },
                    { id: 'step2', number: '02', title: 'Planowanie', description: 'Ustalamy termin, sprawdzamy pogodę, uzyskujemy zgody (jeśli potrzebne).' },
                    { id: 'step3', number: '03', title: 'Inspekcja', description: 'Profesjonalny przelot certyfikowanym sprzętem DJI Mavic 3 Thermal.' },
                    { id: 'step4', number: '04', title: 'Raport 48h', description: 'Szczegółowy raport PDF + zdjęcia HD + termogramy.' }
                ]
            },
            // 6. FAQ
            {
                id: `faq-${city.slug}`,
                type: 'rich_text',
                title: 'Najczęstsze <span class="text-yellow-500">Pytania</span>',
                content: `<div class="grid md:grid-cols-2 gap-8">
<div>
<h3 class="text-xl font-bold text-white mb-3">Dojeżdżacie do ${city.name}?</h3>
<p class="text-zinc-400">Tak, regularnie obsługujemy ${city.name} (${city.distance} z naszej bazy w Płużnicy). Brak dodatkowych opłat za dojazd.</p>
</div>

<div>
<h3 class="text-xl font-bold text-white mb-3">Jak długo trwa inspekcja?</h3>
<p class="text-zinc-400">Sam lot zajmuje 15-45 minut. Raport dostarczamy w ciągu 48h roboczych.</p>
</div>

<div>
<h3 class="text-xl font-bold text-white mb-3">Czy wystawiacie fakturę VAT?</h3>
<p class="text-zinc-400">Tak, współpracujemy z firmami, instytucjami i klientami indywidualnymi.</p>
</div>

<div>
<h3 class="text-xl font-bold text-white mb-3">Jakie macie uprawnienia?</h3>
<p class="text-zinc-400">UAVO A1/A2/A3 (EASA), ubezpieczenie OC operatora drona, certyfikat ITC Level 1 (termowizja).</p>
</div>
</div>`
            },
            // 7. FINAL CTA
            {
                id: `cta-${city.slug}`,
                type: 'b2b_contact',
                title: `Potrzebujesz inspekcji <span class="text-yellow-500">w ${city.name}?</span>`,
                subtitle: 'Skontaktuj się z nami. Wycena jest zawsze darmowa.'
            }
        ];

        // Check if page exists
        const existing = await prisma.page.findUnique({
            where: { slug: city.slug }
        });

        if (existing) {
            console.log(`  ⚠️  Page exists, updating...`);
            await prisma.page.update({
                where: { slug: city.slug },
                data: {
                    title: `Inspekcje Dronem ${city.name}`,
                    meta_title: `Inspekcje Dronem ${city.name} | Termowizja Monitoring`,
                    meta_description: `Profesjonalne usługi dronem w ${city.name}: termowizja ITC Level 1, monitoring budów, inspekcje dachów. Dojeżdżamy (${city.distance}). Raport 48h.`,
                    sections: JSON.stringify(sections),
                    is_published: true,
                    is_in_menu: false,
                    page_type: 'b2b',
                    updated_at: new Date()
                }
            });
        } else {
            console.log(`  ✅ Creating new page...`);
            await prisma.page.create({
                data: {
                    slug: city.slug,
                    title: `Inspekcje Dronem ${city.name}`,
                    meta_title: `Inspekcje Dronem ${city.name} | Termowizja Monitoring`,
                    meta_description: `Profesjonalne usługi dronem w ${city.name}: termowizja ITC Level 1, monitoring budów, inspekcje dachów. Dojeżdżamy (${city.distance}). Raport 48h.`,
                    content: '',
                    sections: JSON.stringify(sections),
                    is_published: true,
                    is_in_menu: false,
                    page_type: 'b2b',
                    menu_order: 999,
                    hero_image: null,
                    hero_subtitle: null
                }
            });
        }

        console.log(`  ✅ ${city.name} ready: /b2b/${city.slug}\n`);
    }

    console.log('🎯 All city landing pages created!');
    console.log('\n📍 URLs:');
    cities.forEach(c => {
        console.log(`   https://aeroanaliza.pl/b2b/${c.slug}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
