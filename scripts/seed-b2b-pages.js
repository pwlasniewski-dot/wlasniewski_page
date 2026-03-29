/**
 * seed-b2b-pages.js
 * 
 * Tworzy/Upsertuje strony B2B w bazie danych CMS tak,
 * żeby były widoczne w panelu Admin → Strony.
 * 
 * Użycie: node scripts/seed-b2b-pages.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const B2B_PAGES = [
    {
        slug: 'b2b',
        title: 'FOTO-DRON — Usługi Dronem dla Biznesu',
        meta_title: 'FOTO-DRON | Inspekcje Dronem, Termowizja — aeroanaliza.pl',
        meta_description: 'Profesjonalne usługi dronem dla biznesu: inspekcje termowizyjne Mavic 3 Thermal, monitoring inwestycji, ortofotomapy. Licencjonowany operator UAVO. Toruń, kujawsko-pomorskie.',
        meta_keywords: 'inspekcje dronem toruń,termowizja dronem,Mavic 3 Thermal,inspekcja dachu dronem,ortofotomapy dron,monitoring budowy dron,operator UAVO kujawsko-pomorskie,FOTO-DRON,aeroanaliza.pl',
        is_published: true,
        page_type: 'b2b',
        content: `
<h1>Usługi Dronem dla Biznesu — FOTO-DRON</h1>

<p>Oferujemy profesjonalne usługi dronowe dla przemysłu, budownictwa, rolnictwa i energetyki.
Dysponujemy dronem DJI Mavic 3 Thermal wyposażonym w kamerę termowizyjną 640×512px i szerokokątną kamerę 48MP.
Jesteśmy licencjonowanym operatorem UAVO z zezwoleniem ULC. Zasięg: Toruń, Bydgoszcz, Grudziądz, kujawsko-pomorskie i cała Polska.</p>

<h2>Nasze Usługi</h2>

<h3>Inspekcje Termowizyjne</h3>
<p>Wykrywamy mostki cieplne, awarie paneli fotowoltaicznych, nieszczelności izolacji i wycieki ciepła.
Raporty PDF z zaznaczonymi anomaliami termicznymi. Usługa dostępna całorocznie.</p>

<h3>Inspekcje Dachów i Infrastruktury</h3>
<p>Bezpieczna ocena stanu technicznego dachu, elewacji i infrastruktury bez konieczności wchodzenia na wysokość.
Zdjęcia wysokiej rozdzielczości, wideo 4K, dokładna dokumentacja każdej anomalii.</p>

<h3>Monitoring Inwestycji (Timeline Budowy)</h3>
<p>Regularna dokumentacja postępów budowy z tej samej perspektywy co 2 i 4 tygodnie.
Raporty wizualne dla inwestorów i instytucji finansujących inwestycję.</p>

<h3>Ortofotomapy i Rolnictwo Precyzyjne</h3>
<p>Szacowanie szkód łowieckich, analiza stanu upraw, mapowanie terenu dla geodetów i zarządców gruntów.
Pliki GeoTIFF, integracja z systemami GIS.</p>

<h2>Dlaczego My?</h2>
<ul>
<li>Licencja UAVO + ubezpieczenie OC 1 mln PLN</li>
<li>Flota: DJI Mavic 3 Thermal (kamera 640×512px IR + RGB 48MP)</li>
<li>Raporty PDF z opisem i zdjęciami anomalii</li>
<li>Obsługa: Toruń, Bydgoszcz, Grudziądz, kujawsko-pomorskie</li>
<li>NIP: 8781430365</li>
</ul>

<h2>Kontakt</h2>
<p>Tel: +48 530 788 694 | drony@wlasniewski.pl</p>
        `.trim(),
        sections: JSON.stringify([
            {
                id: 'b2b-hero',
                type: 'hero',
                data: {
                    title: 'Wnieś Swój Biznes <span class="text-gold-500">Na Wyższy Poziom</span>',
                    subtitle: 'Precyzyjne inspekcje techniczne, termowizja i monitoring inwestycji z lotu ptaka. Technologia, która oszczędza Twój czas i pieniądze.',
                    image_url: 'https://images.unsplash.com/photo-1506947411487-a5673826e6e0?q=80&w=2000&auto=format&fit=crop',
                    overlay_opacity: 70,
                    full_height: true,
                    buttons: [
                        { id: 'b1', label: 'ZAPYTAJ O OFERTĘ', url: '/b2b/kontakt', style: 'primary' },
                        { id: 'b2', label: 'ZOBACZ REALIZACJE', url: '#realizacje', style: 'outline-white' }
                    ]
                }
            },
            {
                id: 'b2b-stats',
                type: 'b2b_stats',
                data: {
                    b2b_stats: [
                        { id: 's1', value: '4K', label: 'Rozdzielczość Video', prefix: '', suffix: '' },
                        { id: 's2', value: '50+', label: 'Zbadanych Dachów', prefix: '', suffix: '' },
                        { id: 's3', value: '100%', label: 'Zgodności z ULC', prefix: '', suffix: '' }
                    ]
                }
            },
            {
                id: 'b2b-offer',
                type: 'features',
                data: {
                    title: 'Specjalistyczne Usługi Dronem',
                    subtitle: 'Dostarczamy dane krytyczne dla Twojej branży.',
                    items: [
                        { id: 'f1', title: 'Inspekcje Termowizyjne', text: 'Wykrywanie mostków cieplnych, awarii paneli PV i wycieków ciepła za pomocą kamery Mavic 3 Thermal.', icon: 'thermometer' },
                        { id: 'f2', title: 'Monitoring Inwestycji', text: 'Regularna dokumentacja postępów budowy z tej samej perspektywy (Timelapse). Raporty dla inwestorów.', icon: 'building' },
                        { id: 'f3', title: 'Inspekcje Dachów i Infrastruktury', text: 'Bezpieczna ocena stanu technicznego bez konieczności wchodzenia na wysokość.', icon: 'shield' },
                        { id: 'f4', title: 'Rolnictwo Precyzyjne', text: 'Szacowanie szkód łowieckich, analiza stanu upraw i mapowanie terenu.', icon: 'leaf' }
                    ]
                }
            },
            {
                id: 'b2b-tech',
                type: 'parallax',
                data: {
                    image_url: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?q=80&w=2000&auto=format&fit=crop',
                    title: 'Flota: DJI Mavic 3 Thermal',
                    content: 'Korzystamy z najnowocześniejszego sprzętu wyposażonego w kamery termowizyjne 640x512px oraz szerokokątne kamery 48MP. Gwarancja precyzji co do centymetra.',
                    height: '500px',
                    overlay_color: '#000000',
                    overlay_opacity: 80
                }
            },
            {
                id: 'b2b-cta',
                type: 'info_band',
                data: {
                    title: 'Gotowy na współpracę?',
                    text: 'Skontaktuj się z nami, aby omówić szczegóły Twojego projektu. Wycena jest zawsze darmowa.',
                    background_color: '#1a1a1a',
                    text_color: '#ffffff',
                    link: '/b2b/kontakt'
                }
            }
        ])
    },
    {
        slug: 'b2b-dron',
        title: 'Termowizja i Inspekcje Dronem — Mavic 3 Thermal',
        meta_title: 'Inspekcje Termowizyjne Dronem | Mavic 3 Thermal | FOTO-DRON Toruń',
        meta_description: 'Inspekcje termowizyjne Mavic 3 Thermal: mostki cieplne, awarie paneli PV, inspekcje dachów. Monitoring budów, ortofotomapy, koła łowieckie. Kujawsko-Pomorskie. NIP: 8781430365.',
        meta_keywords: 'Mavic 3 Thermal,termowizja dronem toruń,inspekcja dachu dronem bydgoszcz,analiza paneli fotowoltaicznych dronem,ortofotomapy dron,monitoring budowy dron,koła łowieckie termowizja,operator UAVO',
        is_published: true,
        page_type: 'b2b',
        content: `
<h1>Inspekcje Termowizyjne Dronem — Mavic 3 Thermal</h1>

<p>Specjalistyczne usługi dronem dla branży budowlanej, energetycznej i rolniczej w Polsce.
Kamera termowizyjna 640×512px na platformie DJI Mavic 3 Thermal pozwala wykryć problemy niewidoczne gołym okiem.</p>

<h2>Termowizja Mavic 3 Thermal</h2>
<p>Mavic 3 Thermal to profesjonalny dron z podwójną kamerą: termowizyjną 640×512px (radiometryczny RJPEG)
i szerokokątną 48MP. Idealne narzędzie do inspekcji budowlanych, fotowoltaiki i infrastruktury przemysłowej
w Toruniu, Bydgoszczy, Grudziądzu i całym kujawsko-pomorskim.</p>

<h2>Zakres Usług</h2>
<ul>
<li><strong>Inspekcje budynków</strong> — mostki cieplne, nieszczelności izolacji, wycieki ciepła</li>
<li><strong>Panele fotowoltaiczne</strong> — diagnostyka awarii ogniw, hotspoty, zacienione moduły</li>
<li><strong>Inspekcje dachów</strong> — stan pokrycia, wilgoć, uszkodzenia bez wchodzenia na dach</li>
<li><strong>Monitoring budów</strong> — timeline 2D/3D postępów, raporty dla inwestorów</li>
<li><strong>Ortofotomapy</strong> — precyzyjne mapy 2D terenu, GeoTIFF dla GIS</li>
<li><strong>Rolnictwo</strong> — szacowanie szkód łowieckich, analiza stanu upraw</li>
</ul>

<h2>Obszar Działania</h2>
<p>Obsługujemy zlecenia w Toruniu, Bydgoszczy, Grudziądzu, Chełmnie, Wąbrzeźnie i całym województwie kujawsko-pomorskim.
Na zlecenie realizujemy inspekcje w całej Polsce.</p>

<h2>Licencje i Ubezpieczenie</h2>
<p>Posiadamy ważną licencję UAVO, zezwolenie ULC na operacje BVLOS i ubezpieczenie OC.
NIP: 8781430365. Tel: +48 530 788 694</p>
        `.trim(),
        sections: null
    }
];

async function seed() {
    console.log('🚁 Seeding B2B pages...\n');

    for (const page of B2B_PAGES) {
        const { sections, ...rest } = page;
        const data = sections !== null ? { ...rest, sections } : rest;

        const result = await prisma.page.upsert({
            where: { slug: page.slug },
            update: {
                ...rest,
                ...(sections !== null ? { sections } : {}),
            },
            create: {
                ...rest,
                ...(sections !== null ? { sections } : {}),
            },
        });

        console.log(`✅ ${result.slug} (id=${result.id}) — "${result.meta_title}"`);
    }

    console.log('\n✨ Done! B2B pages are now in the database.');
    console.log('   → Admin panel: /admin/pages');
    console.log('   → SEO panel:   /admin/seo (keyword analytics B2B will now show data)');
    console.log('   → Sitemap:     aeroanaliza.pl/sitemap.xml');
}

seed()
    .catch(e => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
