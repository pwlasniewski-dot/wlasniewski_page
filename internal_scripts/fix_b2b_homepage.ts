import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixB2BHomepage() {
  try {
    const sections = [
      // 1. B2B HERO
      {
        id: "premium-hero",
        type: "b2b_hero",
        title: "Profesjonalne Inspekcje Dronem <span class=\"text-yellow-500\">w Kujawsko-Pomorskim</span>",
        subtitle: "Termowizja budynków i instalacji PV, monitoring inwestycji budowlanych, inspekcje dachów i infrastruktury. Certyfikat ITC Level 1, uprawnienia UAVO, sprzęt DJI Mavic 3 Thermal. Działamy z Płużnicy na terenie całego województwa.",
        image: "https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/1767087102009-dji_20251230082636_0004_t.webp",
        buttonText: "ZAPYTAJ O OFERTĘ",
        buttonLink: "/b2b/kontakt"
      },

      // 2. INFO BAND
      {
        id: "main-usp",
        type: "info_band",
        title: "Dane, które budują <span class=\"text-yellow-500\">Twój sukces</span>",
        subtitle: "DLACZEGO NAS WYBIERAJĄ",
        text: "Certyfikat ITC Level 1 • Uprawnienia UAVO A1/A2/A3 • DJI Mavic 3 Thermal 640×512px • Raport w 48h • Ubezpieczenie OC • Obsługa stref CTR/ATZ",
        background: "dark"
      },

      // 3. B2B STATS
      {
        id: "stats-premium",
        type: "b2b_stats",
        b2b_stats: [
          {
            id: "s1",
            value: "640×512",
            label: "Rozdzielczość Termowizji",
            suffix: "px"
          },
          {
            id: "s2",
            value: "48",
            label: "Godziny do Raportu",
            suffix: "h"
          },
          {
            id: "s3",
            value: "4K",
            label: "Jakość Wideo"
          },
          {
            id: "s4",
            value: "100",
            label: "Zgodność z EASA",
            suffix: "%"
          }
        ]
      },

      // 4. IMAGE_TEXT - Termowizja
      {
        id: "termowizja-intro",
        type: "image_text",
        layout: "right",
        title: "Termowizja <span class=\"text-yellow-500\">z Certyfikatem ITC Level 1</span>",
        subtitle: "DIAGNOSTYKA TERMOWIZYJNA",
        content: `<p class="text-lg text-zinc-300 leading-relaxed mb-4">Wykonujemy profesjonalne inspekcje termowizyjne budynków mieszkalnych, obiektów przemysłowych oraz instalacji fotowoltaicznych na terenie województwa kujawsko-pomorskiego.</p>

<p class="text-lg text-zinc-300 leading-relaxed mb-6">Sprzęt: <strong class="text-yellow-500">DJI Mavic 3 Thermal</strong> z kamerą o rozdzielczości 640×512 px i dokładności ±2°C. Certyfikat ITC Level 1 gwarantuje profesjonalne czytanie i interpretację termogramów.</p>

<ul class="space-y-3 text-zinc-300">
<li>✓ Audyty energetyczne budynków (mostki cieplne, straty ciepła)</li>
<li>✓ Inspekcje instalacji fotowoltaicznych (hot spoty, zwarcia ogniw)</li>
<li>✓ Diagnostyka sieci ciepłowniczych i rurociągów</li>
<li>✓ Kontrola instalacji elektrycznych pod obciążeniem</li>
<li>✓ Raport z analizą + termogramy RGB w 48h</li>
</ul>`,
        image: "https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/1767087102009-dji_20251230082636_0004_t.webp",
        buttonText: "SZCZEGÓŁY TERMOWIZJI",
        buttonLink: "/b2b/termowizja"
      },

      // 5. IMAGE_TEXT - Monitoring
      {
        id: "monitoring-intro",
        type: "image_text",
        layout: "left",
        title: "Monitoring Budów <span class=\"text-yellow-500\">i Time-Lapse</span>",
        subtitle: "DOKUMENTACJA INWESTYCJI",
        content: `<p class="text-lg text-zinc-300 leading-relaxed mb-4">Regularna dokumentacja postępów budowy z powtarzalnej pozycji GPS. Idealne dla deweloperów, generalnych wykonawców i zarządców projektów.</p>

<p class="text-lg text-zinc-300 leading-relaxed mb-6">Tworzymy poglądowe ortofotomapy placu budowy oraz animacje time-lapse pokazujące cały proces inwestycji w kilkanaście sekund.</p>

<ul class="space-y-3 text-zinc-300">
<li>✓ Cykliczne przeloty (co tydzień/miesiąc) z tej samej wysokości</li>
<li>✓ Ortofotomapy 2D o rozdzielczości do 2 cm/px (dokumentacyjne)</li>
<li>✓ Time-lapse video 4K — postęp budowy w 1-2 minuty</li>
<li>✓ Raporty PDF dla inwestorów, banków, funduszy</li>
<li>✓ Dokumentacja zgodności z projektem budowlanym</li>
</ul>`,
        image: "https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/1767087102009-dji_20251230082636_0004_t.webp",
        buttonText: "SZCZEGÓŁY MONITORINGU",
        buttonLink: "/b2b/monitoring"
      },

      // 6. IMAGE_TEXT - Inspekcje Dachów
      {
        id: "dachy-intro",
        type: "image_text",
        layout: "right",
        title: "Inspekcje Dachów <span class=\"text-yellow-500\">Bez Ryzyka</span>",
        subtitle: "BEZPIECZNE KONTROLE",
        content: `<p class="text-lg text-zinc-300 leading-relaxed mb-4">Dron zastępuje kosztowne wysięgniki i eliminuje ryzyko pracy na wysokości. Szczegółowa dokumentacja stanu technicznego w kilkanaście minut.</p>

<ul class="space-y-3 text-zinc-300 mb-6">
<li>✓ Stan pokrycia dachowego (dachówki, blachodachówki, papa)</li>
<li>✓ Kominy, obróbki blacharskie, rynny, orynnowanie</li>
<li>✓ Korozja elementów stalowych, szczelność połączeń</li>
<li>✓ Kontrola po wichurach, gradobiciu (dla ubezpieczalni)</li>
<li>✓ Raport z HD zdjęciami + wideo + zalecenia w 24h</li>
</ul>

<p class="text-sm text-zinc-400 italic">Dla: wspólnot mieszkaniowych, zarządców nieruchomości, rzeczoznawców budowlanych, ubezpieczycieli</p>`,
        image: "https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/1767087102009-dji_20251230082636_0004_t.webp"
      },

      // 7. B2B PROCESS
      {
        id: "process",
        type: "b2b_process",
        title: "Prosty proces <span class=\"text-yellow-500\">współpracy</span>",
        subtitle: "OD ZGŁOSZENIA DO RAPORTU",
        steps: [
          {
            id: "step1",
            number: "01",
            title: "Kontakt i Wycena",
            description: "Opowiedz nam o projekcie. Przygotujemy darmową wycenę w ciągu kilku godzin."
          },
          {
            id: "step2",
            number: "02",
            title: "Planowanie Lotu",
            description: "Ustalamy termin, sprawdzamy pogodę, uzyskujemy zgody (jeśli potrzebne w strefie CTR/ATZ)."
          },
          {
            id: "step3",
            number: "03",
            title: "Inspekcja na Miejscu",
            description: "Profesjonalny przelot z certyfikowanym sprzętem. Możesz być obecny i oglądać podgląd live."
          },
          {
            id: "step4",
            number: "04",
            title: "Raport w 48h",
            description: "Otrzymujesz szczegółowy raport PDF + zdjęcia wysokiej rozdzielczości + termogramy (jeśli termowizja)."
          }
        ]
      },

      // 8. INFO_BAND - Lokalizacja
      {
        id: "location",
        type: "info_band",
        title: "Działamy w <span class=\"text-yellow-500\">całym województwie</span>",
        subtitle: "ZASIĘG USŁUG",
        text: "Siedziba: Płużnica (powiat toruński) • Regularnie: Toruń, Bydgoszcz, Włocławek, Grudziądz, Inowrocław, Chełmno, Brodnica, Świecie • Projekty ogólnopolskie: monitoring dużych inwestycji infrastrukturalnych",
        background: "gradient"
      },

      // 9. RICH_TEXT - FAQ
      {
        id: "faq",
        type: "rich_text",
        title: "Najczęstsze <span class=\"text-yellow-500\">Pytania</span>",
        content: `<div class="grid md:grid-cols-2 gap-8">
<div>
<h3 class="text-xl font-bold text-white mb-3">Czy wystawiasz fakturę VAT?</h3>
<p class="text-zinc-400">Tak, wystawiamy faktury VAT. Współpracujemy z firmami, instytucjami i klientami indywidualnymi.</p>
</div>

<div>
<h3 class="text-xl font-bold text-white mb-3">Jak długo trwa inspekcja?</h3>
<p class="text-zinc-400">Sam lot zajmuje 15-45 minut w zależności od wielkości obiektu. Raport dostarczamy w ciągu 48h.</p>
</div>

<div>
<h3 class="text-xl font-bold text-white mb-3">Czy robicie ortofotomapy geodezyjne?</h3>
<p class="text-zinc-400">Robimy ortofotomapy poglądowe do celów dokumentacyjnych. Nie mamy RTK, więc nie robimy map geodezyjnych o precyzji centymetrowej do zasobów.</p>
</div>

<div>
<h3 class="text-xl font-bold text-white mb-3">Jak uzyskać wycenę?</h3>
<p class="text-zinc-400">Zadzwoń lub napisz mail. Każde zlecenie ma inną specyfikę, więc przygotowujemy wycenę indywidualnie i całkowicie za darmo.</p>
</div>

<div>
<h3 class="text-xl font-bold text-white mb-3">Latacie w każdą pogodę?</h3>
<p class="text-zinc-400">Nie latamy przy wietrze >10 m/s, deszczu, śniegu i gęstej mgle. Termowizja wymaga odpowiedniego okna pogodowego (bez silnego słońca).</p>
</div>

<div>
<h3 class="text-xl font-bold text-white mb-3">Jakie macie uprawnienia?</h3>
<p class="text-zinc-400">Uprawnienia UAVO A1/A2/A3 (EASA), ubezpieczenie OC operatora drona, certyfikat ITC Level 1 (termowizja budowlana).</p>
</div>
</div>`
      },

      // 10. B2B CONTACT
      {
        id: "final-cta",
        type: "b2b_contact",
        title: "Gotowy na <span class=\"text-yellow-500\">współpracę?</span>",
        subtitle: "Skontaktuj się z nami. Wycena jest zawsze darmowa."
      }
    ];

    const result = await prisma.page.update({
      where: { slug: 'b2b' },
      data: {
        sections: JSON.stringify(sections)
      }
    });

    console.log('✅ B2B Homepage FIXED!');
    console.log('   - Fixed HTML parsing in image_text titles');
    console.log('   - Used working images from S3');
    console.log('   - Fixed layout properties');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixB2BHomepage();
