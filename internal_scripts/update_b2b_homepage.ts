import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateB2BHomepage() {
  try {
    const sections = [
      // SEKCJA 1: HERO
      {
        id: "b2b-hero-v2",
        type: "hero",
        image: "https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/1767087102009-dji_20251230082636_0004_t.webp",
        title: "Profesjonalne Usługi Dronem dla Biznesu w Województwie Kujawsko-Pomorskim",
        subtitle: "Wstępna diagnostyka termowizyjna, monitoring inwestycji i bezpieczne inspekcje techniczne z powietrza. Obsługujemy Toruń, Bydgoszcz, Włocławek, Grudziądz i całe kujawsko-pomorskie. Certyfikowani operatorzy, sprzęt DJI Mavic 3 Thermal, szybkie i rzetelne raporty.",
        overlay_opacity: 70,
        full_height: true,
        buttons: [
          {
            id: "b1",
            label: "ZAPYTAJ O OFERTĘ",
            url: "/b2b/kontakt",
            style: "primary"
          },
          {
            id: "b2",
            label: "ZOBACZ REALIZACJE",
            url: "#realizacje",
            style: "outline-white"
          }
        ]
      },

      // SEKCJA 2: INTRO — KIM JESTEŚMY
      {
        id: "b2b-intro",
        type: "rich_text",
        title: "Specjalistyczne Usługi Dronem dla Biznesu — Kujawsko-Pomorskie i Cała Polska",
        content: `<p><strong>FOTO-DRON</strong> to profesjonalny operator bezzałogowych statków powietrznych z siedzibą w Płużnicy (powiat toruński). Świadczymy zaawansowane usługi inspekcyjne i dokumentacyjne dla firm, generalnych wykonawców, zarządców nieruchomości oraz przedsiębiorstw na terenie całego województwa kujawsko-pomorskiego (m.in. Toruń, Bydgoszcz, Włocławek, Grudziądz).</p>

<p>Nasze kluczowe usługi to:</p>

<ul>
<li><strong>Termowizja z lotu ptaka</strong> — wykrywanie anomalii temperaturowych, wstępna diagnostyka dla audytorów energetycznych, kontrola instalacji PV.</li>
<li><strong>Monitoring budów i inwestycji</strong> — regularna dokumentacja postępów, poglądowe ortofotomapy, time-lapse z powietrza.</li>
<li><strong>Inspekcje techniczne dachów i obiektów wysokościowych</strong> — bezpieczna analiza wizualna bez konieczności wynajmu kosztownych wysięgników.</li>
</ul>

<p>Posiadamy uprawnienia operatora UAVO (kategorie A1, A2, A3 zgodne z przepisami EASA), ważne ubezpieczenie OC oraz sprzęt klasy profesjonalnej (DJI Mavic 3 Thermal z kamerą termowizyjną o rozdzielczości 640×512 px). Posiadamy certyfikat ITC Level 1, gwarantujący poprawne czytanie i interpretację termogramów.</p>`
      },

      // SEKCJA 3: STATYSTYKI B2B
      {
        id: "b2b-stats-v2",
        type: "b2b_stats",
        b2b_stats: [
          {
            id: "s1",
            value: "640×512",
            label: "Rozdzielczość Kamery Termowizyjnej",
            suffix: "px"
          },
          {
            id: "s2",
            value: "ITC Level 1",
            label: "Certyfikowana Wiedza Termowizyjna",
            prefix: "",
            suffix: ""
          },
          {
            id: "s3",
            value: "4K",
            label: "Rozdzielczość Dokumentacji Video",
            prefix: "",
            suffix: ""
          },
          {
            id: "s4",
            value: "100%",
            label: "Zgodności z Przepisami PAŻP i EASA",
            prefix: "",
            suffix: ""
          }
        ]
      },

      // SEKCJA 4: USŁUGI SZCZEGÓŁOWE
      {
        id: "b2b-services",
        type: "features",
        title: "Nasze Usługi",
        subtitle: "Kompleksowe wsparcie dla biznesu z wykorzystaniem technologii dronowej",
        items: [
          {
            id: "f1",
            title: "🔥 Termowizja Dronem — Wstępna Diagnostyka i Wykrywanie Anomalii",
            text: "Wstępna analiza termowizyjna i dokumentacja zdjęciowa dla audytorów energetycznych (budynki mieszkalne, biurowe, hale). Inspekcje instalacji fotowoltaicznych, kontrola sieci ciepłowniczych, lokalizacja widocznych mostków termicznych oraz diagnostyka instalacji elektrycznych pod obciążeniem. Sprzęt: DJI Mavic 3 Thermal (640×512 px, +/- 2°C dokładność). Raport: Analiza termowizyjna, zestawienie zdjęć RGB z termogramem.",
            icon: "thermometer"
          },
          {
            id: "f2",
            title: "🏗️ Monitoring Inwestycji Budowlanych i Time-Lapse",
            text: "Regularne przeloty dokumentacyjne z powtarzalnej pozycji GPS. Tworzymy poglądowe ortofotomapy placu budowy (idealne do wizualnej dokumentacji postępów bez wchodzenia w zasób geodezyjny) oraz animacje time-lapse. Dostarczamy wizualną dokumentację zgodności z założeniami projektu dla inwestorów, banków i nadzoru budowlanego. Działamy lokalnie, a przy dużych projektach B2B — w całej Polsce.",
            icon: "building"
          },
          {
            id: "f3",
            title: "🏚️ Inspekcje Dachów, Kominów i Obiektów Wysokościowych",
            text: "Inspekcja dronem to bezpieczna, szybka i ekonomiczna alternatywa dla wynajmu podnośników koszowych czy rusztowań. Sprawdzamy stan pokrycia dachowego, kominów, obróbek blacharskich oraz orynnowania. Wykonujemy również wizualną kontrolę miejsc po wichurach czy gradobiciach, dostarczając gotowy materiał dowodowy dla ubezpieczalni w kilkanaście minut.",
            icon: "shield"
          },
          {
            id: "f4",
            title: "🌾 Dokumentacja Terenów Rolnych i Leśnych",
            text: "Z powietrza szybko i precyzyjnie szacujemy szkody łowieckie (dziki, jelenie), dostarczając czytelną dokumentację wizualną RGB do wniosków dla kół łowieckich czy nadleśnictw. Wykonujemy mapowanie poglądowe gruntów rolnych i działek leśnych, monitoring melioracji oraz wizualną inwentaryzację gruntów pod planowane farmy fotowoltaiczne.",
            icon: "leaf"
          }
        ]
      },

      // SEKCJA 5: DLACZEGO MY
      {
        id: "b2b-why-us",
        type: "rich_text",
        title: "Dlaczego Biznes Wybiera Nasze Usługi?",
        content: `<ul class="space-y-3 text-lg">
<li>✅ <strong>Pełne uprawnienia UAVO</strong> — praca w 100% legalna i zgodna z aktualnymi przepisami EASA.</li>
<li>✅ <strong>Ubezpieczenie OC operatora</strong> — działamy profesjonalnie, posiadając polisę chroniącą mienie na obszarze prac.</li>
<li>✅ <strong>Sprzęt klasy Enterprise</strong> — latamy na sprawdzonym, profesjonalnym sprzęcie (DJI Mavic 3 Thermal).</li>
<li>✅ <strong>Certyfikat ITC Level 1</strong> — nie tylko "robimy zdjęcia", ale rozumiemy zasady fizyki cieplnej.</li>
<li>✅ <strong>Szybka realizacja</strong> — terminowe dostarczanie materiałów raportowych.</li>
<li>✅ <strong>Wiedza o strefach lotniczych</strong> — płynnie obsługujemy zgłoszenia w strefach kontrolowanych CTR i ATZ.</li>
</ul>`
      },

      // SEKCJA 6: LOKALIZACJA I ZASIĘG
      {
        id: "b2b-location",
        type: "rich_text",
        title: "Zasięg Naszych Działań – Kujawsko-Pomorskie i Cała Polska",
        content: `<p>Główna siedziba firmy znajduje się w <strong>Płużnicy (powiat toruński)</strong>. Nasze pełne portfolio usług realizujemy standardowo we wszystkich większych miastach i powiatach regionu: <strong>Bydgoszcz, Toruń, Włocławek, Grudziądz, Inowrocław, Chełmno, Brodnica, Świecie</strong>. Dzięki dogodnej lokalizacji jesteśmy w stanie szybko dotrzeć na miejsce zlecenia.</p>

<p><strong>Współpraca ogólnopolska:</strong> Przy wymagających, wysokobudżetowych projektach (np. cykliczny monitoring dużych inwestycji infrastrukturalnych, kompleksowe inspekcje zakładów przemysłowych) świadczymy usługi na terenie całej Polski. Zawsze dopasowujemy logistykę tak, by współpraca była efektywna i opłacalna dla biznesu.</p>`
      },

      // SEKCJA 7: FAQ
      {
        id: "b2b-faq",
        type: "rich_text",
        title: "Najczęściej Zadawane Pytania",
        content: `<div class="space-y-6">
<div>
<h3 class="font-bold text-lg mb-2">Czy mogę dostać fakturę VAT?</h3>
<p>Tak, wystawiamy faktury VAT. Współpracujemy zarówno z firmami B2B, instytucjami, jak i klientami indywidualnymi.</p>
</div>

<div>
<h3 class="font-bold text-lg mb-2">Jak długo trwa inspekcja z użyciem drona?</h3>
<p>Sam lot zajmuje zazwyczaj od 15 do 45 minut w zależności od wielkości obiektu. Raport z zebranym materiałem dostarczamy najczęściej w ciągu 48h.</p>
</div>

<div>
<h3 class="font-bold text-lg mb-2">Czy wykonujecie ortofotomapy geodezyjne?</h3>
<p>Obecnie dostarczamy ortofotomapy poglądowe, które świetnie sprawdzają się do celów dokumentacyjnych, raportowych i wizualnych. Nie posiadamy modułu RTK, dlatego nasze mapy nie służą celom strict geodezyjnym o centymetrowej precyzji wpisywanym do zasobów.</p>
</div>

<div>
<h3 class="font-bold text-lg mb-2">Czy latacie w każdych warunkach pogodowych?</h3>
<p>Dron ma swoje ograniczenia. Nie wykonujemy lotów przy wietrze powyżej 10 m/s, podczas opadów deszczu czy śniegu oraz w gęstej mgle. Inspekcje termowizyjne wymagają dodatkowo odpowiedniego „okna pogodowego" (np. brak silnego nasłonecznienia, odpowiednia różnica temperatur).</p>
</div>

<div>
<h3 class="font-bold text-lg mb-2">Jak uzyskać wycenę?</h3>
<p>Wystarczy kontakt telefoniczny lub mailowy. Ponieważ każde zlecenie, zwłaszcza w branży budowlanej, ma inną specyfikę (wymaga różnego sprzętu, zgód na lot czy czasu), wycenę przygotowujemy indywidualnie i całkowicie za darmo.</p>
</div>
</div>`
      },

      // SEKCJA 8: CTA KONTAKT
      {
        id: "b2b-cta-final",
        type: "info_band",
        title: "Gotowy na współpracę?",
        text: "Skontaktuj się z nami, aby omówić szczegóły Twojego projektu. Wycena jest zawsze darmowa.",
        background_color: "#1a1a1a",
        text_color: "#ffffff",
        link: "/b2b/kontakt"
      }
    ];

    // Update B2B homepage
    const result = await prisma.page.update({
      where: {
        slug: 'b2b'
      },
      data: {
        title: 'FOTO-DRON — Usługi Dronem dla Biznesu',
        meta_title: 'Usługi Dronem Toruń Bydgoszcz | Termowizja Monitoring | FOTO-DRON',
        meta_description: 'Profesjonalne usługi dronem w woj. kujawsko-pomorskim. Wstępna termowizja, monitoring budów, inspekcje dachów. Toruń, Bydgoszcz. Szybki raport, Certyfikat ITC.',
        sections: JSON.stringify(sections),
        is_published: true
      }
    });

    console.log('✅ B2B Homepage updated successfully!');
    console.log(`Total sections: ${sections.length}`);
    console.log(`Page ID: ${result.id}`);

  } catch (error) {
    console.error('❌ Error updating B2B homepage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateB2BHomepage();
