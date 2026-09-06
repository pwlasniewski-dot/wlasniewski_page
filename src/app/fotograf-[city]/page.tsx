import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import CityPhotoStory, { type CityStoryPhoto } from '@/components/CityPhotoStory';
import CityLeadSection from '@/components/CityLeadSection';
import ParallaxSection from '@/components/ParallaxSection';
import type { PageSection } from '@/components/admin/PageBuilder';
import { getPortfolioCategories } from '@/lib/portfolio';
import { loadPhotoFunnelConfig } from '@/lib/marketing/photo-funnel.server';
import { loadPublicMinimumPrices, loadPublicPricingSnapshot, publicPriceLabel, type PublicMinimumPricesInCents } from '@/lib/publicPackagePricing';
import PromotionPriceBlock from '@/components/promotions/PromotionPriceBlock';

// ─── City Data with FAQs ─────────────────────────────────────────
interface CityInfo {
    slug: string;
    city: string;
    region: string;
    h1: string;
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    heroImage: string;
    intro: string[];
    sections: { title: string; icon: string; paragraphs: string[] }[];
    services: { name: string; description: string; href?: string }[];
    faqs: { question: string; answer: string }[];
    nearbyLinks: { label: string; href: string }[];
    lat: number;
    lng: number;
}

const CITIES: Record<string, CityInfo> = {
    torun: {
        slug: 'fotograf-torun',
        city: 'Toruń',
        region: 'kujawsko-pomorskie',
        h1: 'Fotograf w Toruniu — sesje rodzinne i śluby',
        metaTitle: 'Fotograf Toruń | Sesje rodzinne i śluby — Właśniewski',
        metaDescription: 'Fotograf w Toruniu. Sesje rodzinne i fotografia ślubna. Zobacz aktualne pakiety i sprawdź wolny termin online.',
        keywords: ['fotograf toruń', 'fotografia wizerunkowa toruń', 'fotograf portretowy toruń', 'fotograf toruń starówka', 'profesjonalna fotografia toruń', 'fotograf ślubny toruń', 'fotografia ślubna toruń', 'sesja zdjęciowa toruń', 'fotografia biznesowa toruń', 'sesja narzeczeńska toruń', 'sesja rodzinna toruń', 'plener ślubny toruń', 'zdjęcia biznesowe toruń', 'sesja w mieście toruń', 'fotograf bulwar filadelfijski'],
        heroImage: '/assets/portfolio/family/sesja-rodzinna-torun-plener-07.webp',
        lat: 53.0138,
        lng: 18.5984,
        intro: [
            'Jestem Przemek. W Toruniu fotografuję rodziny, pary i śluby — od krótkiej ceremonii w urzędzie po całodniowy reportaż. Przed zdjęciami ustalamy miejsce, godzinę i prosty plan. Podczas sesji podpowiadam, co zrobić, ale zostawiam Wam swobodę.',
        ],
        sections: [
            {
                title: 'Jak wygląda sesja w Toruniu',
                icon: '📷',
                paragraphs: [
                    'Najpierw wybierasz pakiet i termin. Przed spotkaniem ustalamy, kto będzie na zdjęciach, gdzie się spotykamy i jaki rezultat jest dla Was najważniejszy. Podczas sesji pokazuję, gdzie stanąć i co zrobić w kolejnym ujęciu.',
                    'Przy zdjęciach z dziećmi zostawiam czas na ruch i przerwy. Z dorosłymi zaczynam od prostych ustawień, a później przechodzimy do kolejnych ujęć. Dzięki temu wiadomo, czego spodziewać się na każdym etapie.',
                ],
            },
            {
                title: 'Gdzie fotografuję w Toruniu',
                icon: '📍',
                paragraphs: [
                    'Starówka, okolice Zamku Krzyżackiego i Bulwar Filadelfijski dobrze sprawdzają się przy sesjach par i rodzin. Na spokojniejsze zdjęcia wybieram Park Miejski, Bydgoskie Przedmieście albo miejsce ważne właśnie dla Was.',
                    'Godzinę dopasowuję do światła i charakteru sesji. Jeśli nie macie wybranej lokalizacji, zaproponuję dwie lub trzy konkretne opcje.',
                ],
            },
            {
                title: 'Co otrzymujesz',
                icon: '🖼️',
                paragraphs: [
                    'Każdy pakiet obejmuje selekcję i staranną obróbkę zdjęć oraz prywatną galerię internetową. Pakiety rodzinne zawierają od 35 do 80 gotowych fotografii, a wyższy wariant także album nPhoto.',
                    'Przy ślubach zakres zależy od wybranego pakietu: od ceremonii cywilnej i krótkiej sesji po pełny reportaż od przygotowań do oczepin.',
                ],
            },
        ],
        services: [
            { name: 'Sesja rodzinna w Toruniu', description: 'Rodzina, para, dzieci albo zdjęcia kilku pokoleń — w mieście lub spokojnym plenerze. Aktualne pakiety znajdziesz w rezerwacji.', href: '/sesja-rodzinna?city=Toruń' },
            { name: 'Fotografia ślubna Toruń', description: 'Ceremonia cywilna, kameralny ślub z przyjęciem lub pełny reportaż ślubny. Aktualny zakres i ceny są widoczne w rezerwacji.', href: '/slub?city=Toruń' },
            { name: 'Urodziny i rodzinne przyjęcia', description: 'Reportaż z urodzin, jubileuszu i ważnego rodzinnego spotkania, bez odrywania gości od zabawy.' },
            { name: 'Sesja portretowa i wizerunkowa', description: 'Portrety do pracy, marki osobistej albo po prostu dla siebie — w plenerze lub wybranym wnętrzu.' },
        ],
        faqs: [
            { question: 'Ile kosztuje sesja rodzinna w Toruniu?', answer: 'Cena zależy od czasu fotografowania, liczby gotowych zdjęć i dodatków. Aktualne pakiety, ich pełny zakres oraz wolne terminy sprawdzisz w rezerwacji online.' },
            { question: 'Ile kosztuje fotograf na ślub w Toruniu?', answer: 'Zakres może obejmować krótką ceremonię, kameralne przyjęcie albo pełny reportaż. Aktualne warianty i ceny są zawsze widoczne przed wyborem terminu w rezerwacji online.' },
            { question: 'Gdzie najlepiej zrobić sesję w Toruniu?', answer: 'Najczęściej fotografuję na Starówce, Bulwarze Filadelfijskim, Bydgoskim Przedmieściu i w Parku Miejskim. Miejsce dobieram do pory dnia, wieku dzieci i klimatu, który chcecie uzyskać.' },
            { question: 'Jak prowadzisz sesję?', answer: 'Na początku pokazuję, gdzie stanąć i od jakich ujęć zaczynamy. Później podaję krótkie wskazówki i pilnuję tempa, światła oraz kolejności zdjęć.' },
            { question: 'Jak zarezerwować termin?', answer: 'Wybierz usługę i pakiet, zaznacz dostępny dzień, uzupełnij dane i potwierdź rezerwację bezpieczną zaliczką przez PayU.' },
        ],
        nearbyLinks: [
            { label: 'Fotograf Grudziądz', href: '/fotograf-grudziadz' },
            { label: 'Fotograf Chełmno', href: '/fotograf-chelmno' },
            { label: 'Fotograf Wąbrzeźno', href: '/fotograf-wabrzezno' },
            { label: 'Fotograf Bydgoszcz', href: '/fotograf-bydgoszcz' },
            { label: 'Fotograf Lisewo', href: '/fotograf-lisewo' },
        ],
    },
    grudziadz: {
        slug: 'fotograf-grudziadz',
        city: 'Grudziądz',
        region: 'kujawsko-pomorskie',
        h1: 'Fotograf w Grudziądzu — sesje rodzinne i śluby',
        metaTitle: 'Fotograf Grudziądz – sesje rodzinne i śluby | Ceny',
        metaDescription: 'Sesje rodzinne i fotografia ślubna w Grudziądzu. Zobacz aktualny zakres, wybierz pakiet i sprawdź wolny termin online.',
        keywords: ['fotograf grudziądz', 'fotograf ślubny grudziądz', 'sesja rodzinna grudziądz', 'fotografia portretowa grudziądz', 'zdjęcia plenerowe grudziądz', 'sesja narzeczeńska grudziądz'],
        heroImage: '/assets/portfolio/family/sesja-rodzinna-torun-plener-07.webp',
        lat: 53.4837,
        lng: 18.7536,
        intro: [
            'Jestem Przemek. Do Grudziądza dojeżdżam na sesje rodzinne, śluby i przyjęcia. Przed spotkaniem ustalamy zakres, miejsce oraz godzinę. Cenę i dostępne terminy sprawdzisz przed rezerwacją.',
        ],
        sections: [
            {
                title: 'Najlepsze lokalizacje na sesję w Grudziądzu',
                icon: '📍',
                paragraphs: [
                    'Panorama spichlerzy nad Wisłą to wizytówka Grudziądza i idealne tło do sesji — szczególnie o złotej godzinie. Wschodnia ściana spichlerzy odbija ciepłe światło zachodzącego słońca.',
                    'Góra Zamkowa z widokiem na dolinę Wisły daje szeroki, dramatyczny plan. Park Miejski to spokojne miejsce na sesje rodzinne z dziećmi. Bulwary i tereny rekreacyjne nad Wisłą świetnie nadają się na luźne sesje par.',
                    'Stare Miasto w Grudziądzu to ciekawe tła architektoniczne — kamienice, bramy i zaułki. Lubię też plener za miastem: łąki nadwiślańskie i aleje lipowe.',
                ],
            },
            {
                title: 'Jak pracuję na sesji',
                icon: '📷',
                paragraphs: [
                    'Na początku ustalam kolejność ujęć i pokazuję, gdzie stanąć. Przy zdjęciach rodzinnych zostawiam czas na ruch dzieci, a przy portretach pilnuję ustawienia i światła.',
                    'Jeżeli wybieramy spacer po mieście, wcześniej ustalamy krótką trasę. Nie tracimy czasu na szukanie miejsca już podczas sesji.',
                ],
            },
            {
                title: 'Pakiet i realizacja',
                icon: '🖼️',
                paragraphs: [
                    'Pakiety rodzinne obejmują od 35 do 80 gotowych zdjęć oraz prywatną galerię internetową. W wyższym wariancie dostępny jest album nPhoto.',
                    'Przy ślubie możesz wybrać samą ceremonię, kameralne przyjęcie albo pełny reportaż. Aktualny zakres i cena są widoczne w rezerwacji.',
                ],
            },
        ],
        services: [
            { name: 'Sesja rodzinna w Grudziądzu', description: 'Zdjęcia rodzinne przy spichlerzach, w parku albo w plenerze nad Wisłą.', href: '/sesja-rodzinna?city=Grudziądz' },
            { name: 'Fotografia ślubna Grudziądz', description: 'Ceremonia, kameralne przyjęcie albo pełny reportaż z przygotowaniami i weselem.', href: '/slub?city=Grudziądz' },
            { name: 'Sesja portretowa i biznesowa', description: 'Profesjonalne portrety wizerunkowe i biznesowe w klimatycznych lokalizacjach Grudziądza.' },
            { name: 'Fotografia komunijna Grudziądz', description: 'Pamiątkowe zdjęcia z Pierwszej Komunii — kościół, plener, portret.' },
            { name: 'Zdjęcia z drona', description: 'Ujęcia panoramy spichlerzy i Wisły z lotu ptaka — na ślub, event lub sesję.' },
        ],
        faqs: [
            { question: 'Ile kosztuje sesja zdjęciowa w Grudziądzu?', answer: 'Cena zależy od wybranego rodzaju sesji i zakresu pakietu. Aktualne ceny, zawartość pakietów oraz wolne terminy sprawdzisz w rezerwacji online.' },
            { question: 'Gdzie najlepiej zrobić sesję w Grudziądzu?', answer: 'Najpiękniejsze lokalizacje: panorama spichlerzy nad Wisłą, Góra Zamkowa, Park Miejski, stare miasto i bulwary. Pomagam dobrać miejsce pod charakter sesji.' },
            { question: 'Czy dojeżdżasz do Grudziądza?', answer: 'Tak, regularnie. Baza w Płużnicy — do Grudziądza mam 25 minut. Dojazd w ramach pakietu.' },
            { question: 'Jak się przygotować do sesji?', answer: 'Stonowane, spójne kolory bez dużych logotypów. Wygodne buty na spacer. Szczegóły na stronie „Jak się ubrać".' },
        ],
        nearbyLinks: [
            { label: 'Fotograf Chełmno', href: '/fotograf-chelmno' },
            { label: 'Fotograf Świecie', href: '/fotograf-swiecie' },
            { label: 'Fotograf Toruń', href: '/fotograf-torun' },
            { label: 'Fotograf Wąbrzeźno', href: '/fotograf-wabrzezno' },
        ],
    },
    chelmno: {
        slug: 'fotograf-chelmno',
        city: 'Chełmno',
        region: 'kujawsko-pomorskie',
        h1: 'Fotograf w Chełmnie — sesje rodzinne i śluby',
        metaTitle: 'Fotograf Chełmno – sesje rodzinne i śluby | Ceny',
        metaDescription: 'Sesje rodzinne i fotografia ślubna w Chełmnie. Zobacz aktualny zakres, wybierz pakiet i sprawdź wolny termin online.',
        keywords: ['fotograf chełmno', 'fotograf ślubny chełmno', 'sesja narzeczeńska chełmno', 'sesja rodzinna chełmno', 'miasto zakochanych zdjęcia', 'fotografia chełmno'],
        heroImage: '/assets/portfolio/family/sesja-rodzinna-torun-plener-07.webp',
        lat: 53.3490,
        lng: 18.4311,
        intro: [
            'Jestem Przemek. Do Chełmna dojeżdżam na sesje rodzinne, śluby i zdjęcia par. Przed spotkaniem ustalamy zakres, miejsce oraz godzinę. Rynek, mury miejskie i park dają kilka różnych wariantów bez długich przejazdów.',
        ],
        sections: [
            {
                title: 'Miejsca na sesję zdjęciową w Chełmnie',
                icon: '📍',
                paragraphs: [
                    'Rynek z ratuszem, mury obronne oraz okolice Bramy Grudziądzkiej pozwalają zrobić kilka różnych serii zdjęć podczas jednego spaceru.',
                    'Park nad Wisłą i teren przy Fosa Miejska — spokojne miejsca z naturalnym światłem, idealne na sesje rodzinne. Okolice kościołów (Wniebowzięcia NMP, farny) sprawdzają się na sesje komunijne i ślubne.',
                    'Godzinę spotkania dobieram do światła i liczby osób. Jeżeli nie masz wybranego miejsca, przed sesją podam dwie konkretne propozycje.',
                ],
            },
            {
                title: 'Styl pracy i podejście',
                icon: '📷',
                paragraphs: [
                    'Na początku pokazuję, gdzie stanąć i od jakich ujęć zaczynamy. Później przechodzimy krótką trasę, żeby zmienić tło bez tracenia czasu.',
                    'Przy zdjęciach rodzinnych planuję także pojedyncze portrety i ujęcia kilku pokoleń. Zakres ustalamy jeszcze przed rezerwacją.',
                ],
            },
            {
                title: 'Pakiet i realizacja',
                icon: '🖼️',
                paragraphs: [
                    'Galeria online z minimum 20 zdjęciami po autorskiej obróbce. Odbitki premium w nPhoto. Gotowe do 10 dni roboczych.',
                    'Dojazd do Chełmna w ramach pakietu — mieszkam w okolicy. Albumy i większe zestawy na życzenie, z indywidualnym projektem.',
                ],
            },
        ],
        services: [
            { name: 'Sesja rodzinna w Chełmnie', description: 'Zdjęcia rodziny, dzieci i kilku pokoleń w parku, na rynku albo przy murach miejskich.', href: '/sesja-rodzinna?city=Chełmno' },
            { name: 'Fotografia ślubna Chełmno', description: 'Ceremonia, kameralne przyjęcie albo pełny reportaż z ustalonym zakresem.', href: '/slub?city=Chełmno' },
            { name: 'Sesja pary', description: 'Spacer po rynku i przy murach miejskich z wcześniej ustaloną trasą.' },
            { name: 'Fotografia komunijna', description: 'Pamiątkowe zdjęcia z Pierwszej Komunii Świętej w Chełmnie.' },
        ],
        faqs: [
            { question: 'Ile kosztuje sesja zdjęciowa w Chełmnie?', answer: 'Cena zależy od rodzaju sesji i wybranego zakresu. Aktualne pakiety, ceny i zasady dojazdu sprawdzisz bezpośrednio w rezerwacji online.' },
            { question: 'Dlaczego sesja w Chełmnie to dobry pomysł?', answer: 'Chełmno to oficjalne Miasto Zakochanych z piękną starówką, murami obronnymi i klimatem. Idealne na sesje narzeczeńskie i ślubne.' },
            { question: 'Gdzie najlepiej zrobić sesję w Chełmnie?', answer: 'Rynek z ratuszem, mury obronne (Brama Grudziądzka), park nad Wisłą, Fosa Miejska. Pomagam dobrać lokalizację.' },
            { question: 'Czy dojeżdżasz do Chełmna?', answer: 'Tak, Chełmno jest blisko mojej bazy. Dojazd w ramach pakietu, bez dodatkowych kosztów.' },
        ],
        nearbyLinks: [
            { label: 'Fotograf Grudziądz', href: '/fotograf-grudziadz' },
            { label: 'Fotograf Toruń', href: '/fotograf-torun' },
            { label: 'Fotograf Świecie', href: '/fotograf-swiecie' },
            { label: 'Fotograf Wąbrzeźno', href: '/fotograf-wabrzezno' },
        ],
    },
    wabrzezno: {
        slug: 'fotograf-wabrzezno',
        city: 'Wąbrzeźno',
        region: 'kujawsko-pomorskie',
        h1: 'Fotograf w Wąbrzeźnie — sesje rodzinne i śluby',
        metaTitle: 'Fotograf Wąbrzeźno – sesje rodzinne i śluby | Ceny',
        metaDescription: 'Sesje rodzinne i fotografia ślubna w Wąbrzeźnie. Zobacz aktualny zakres, wybierz pakiet i sprawdź wolny termin online.',
        keywords: ['fotograf wąbrzeźno', 'fotograf wabrzeźno', 'sesja rodzinna wąbrzeźno', 'fotografia ślubna wąbrzeźno', 'sesja narzeczeńska wąbrzeźno', 'zdjęcia wąbrzeźno'],
        heroImage: '/assets/portfolio/family/sesja-rodzinna-torun-plener-07.webp',
        lat: 53.2860,
        lng: 18.9557,
        intro: [
            'Jestem Przemek i mieszkam niedaleko Wąbrzeźna. Fotografuję tu rodziny, śluby oraz przyjęcia. Przed spotkaniem ustalamy zakres, miejsce i godzinę. Cenę oraz dostępne terminy zobaczysz przed rezerwacją.',
        ],
        sections: [
            {
                title: 'Miejsca na sesję w Wąbrzeźnie',
                icon: '📍',
                paragraphs: [
                    'Jezioro Zamkowe i okolice Frydka — klasyczne lokalizacje z naturalnym tłem wodnym. Alejki i trawniki przy wodzie dają miękkie światło o zachodzie.',
                    'Rynek i boczne uliczki — proste tło i równy cień. Okolice zieleni i polnych ścieżek to naturalny plener bez tłumów.',
                    'Krótki wypad na obrzeża — łąki, ścieżki i linie drzew. Wąbrzeźno i okolice mają mnóstwo „ukrytych" plenerów, które idealnie nadają się na sesje brzuszkowe czy rodzinne.',
                ],
            },
            {
                title: 'Styl pracy',
                icon: '📷',
                paragraphs: [
                    'Na początku pokazuję, gdzie stanąć i od jakich ujęć zaczynamy. Przy rodzinach planuję zdjęcia całej grupy, mniejszych zestawień oraz pojedyncze portrety.',
                    'Przy ślubach pracuję według ustalonego wcześniej planu dnia. Wiadomo, od której godziny zaczynam i jaki zakres końcowy otrzymacie.',
                ],
            },
            {
                title: 'Pakiet i realizacja',
                icon: '🖼️',
                paragraphs: [
                    'Po sesji otrzymujesz galerię online z gotowymi zdjęciami po obróbce. Odbitki i album projektuję na życzenie, z akceptacją projektu.',
                    'Cena, czas fotografowania i liczba gotowych zdjęć są widoczne w rezerwacji. Po wyborze pakietu przechodzisz od razu do wolnych terminów.',
                ],
            },
        ],
        services: [
            { name: 'Sesja rodzinna w Wąbrzeźnie', description: 'Zdjęcia rodzinne nad jeziorem, w parku albo na łąkach w okolicy.', href: '/sesja-rodzinna?city=Wąbrzeźno' },
            { name: 'Fotografia ślubna Wąbrzeźno', description: 'Ceremonia, kameralne przyjęcie albo pełny reportaż ślubny.', href: '/slub?city=Wąbrzeźno' },
            { name: 'Sesja portretowa', description: 'Portrety indywidualne i wizerunkowe w kameralnych lokalizacjach.' },
            { name: 'Fotografia komunijna', description: 'Sesje komunijne — kościół, plener i portret.' },
        ],
        faqs: [
            { question: 'Ile kosztuje sesja zdjęciowa w Wąbrzeźnie?', answer: 'Cena zależy od rodzaju sesji i zakresu pakietu. Aktualne pakiety, ceny oraz informacje o dojeździe są dostępne w rezerwacji online.' },
            { question: 'Gdzie najlepiej zrobić sesję w Wąbrzeźnie?', answer: 'Jezioro Zamkowe, Frydek, park miejski, okoliczne łąki i lasy. Znam tu mnóstwo ukrytych lokalizacji.' },
            { question: 'Jak szybko dostanę zdjęcia?', answer: 'Galeria online do 10 dni roboczych od sesji. Odbitki i albumy w dodatkowym terminie, ustalonym indywidualnie.' },
        ],
        nearbyLinks: [
            { label: 'Fotograf Toruń', href: '/fotograf-torun' },
            { label: 'Fotograf Grudziądz', href: '/fotograf-grudziadz' },
            { label: 'Fotograf Chełmno', href: '/fotograf-chelmno' },
            { label: 'Fotograf Lisewo', href: '/fotograf-lisewo' },
            { label: 'Fotograf Płużnica', href: '/fotograf-pluznica' },
        ],
    },
    lisewo: {
        slug: 'fotograf-lisewo',
        city: 'Lisewo',
        region: 'kujawsko-pomorskie',
        h1: 'Fotograf Lisewo — naturalne sesje rodzinne i ślubne',
        metaTitle: 'Fotograf Lisewo ⭐ Śluby plenerowe, sesje rodzinne',
        metaDescription: 'Fotograf Lisewo: naturalne śluby w plenerze oraz spokojne sesje rodzinne i wizerunkowe z dala od miejskiego zgiełku. Sprawdź dostępne terminy.',
        keywords: ['fotograf lisewo', 'sesja rodzinna lisewo', 'fotografia ślubna lisewo', 'zdjęcia lisewo'],
        heroImage: '/assets/portfolio/family/sesja-rodzinna-torun-plener-07.webp',
        lat: 53.3147,
        lng: 18.7553,
        intro: [
            'Jestem Przemek — fotograf w Lisewie. Dojeżdżam błyskawicznie. Lisewo i okolice to świetny wybór na spokojne sesje zdjęciowe z dala od miejskiego zgiełku.',
            'Pracuję reportażowo i w naturalnym świetle. Dojeżdżam też do okolicy: Płużnica, Wąbrzeźno, Toruń czy Grudziądz. Chętnie doradzę miejsce i porę — najczęściej o złotej godzinie.',
        ],
        sections: [
            {
                title: 'Lokalizacje na sesję w Lisewie',
                icon: '📍',
                paragraphs: [
                    'Rynek i boczne uliczki — osłonięte światło i proste tła. Okolice zieleni i polnych ścieżek — naturalny plener bez tłumów.',
                    'Krótki wypad na skraj wsi — łąki i linie drzew świetnie domykają album. W Lisewie dobrze grają beże, zgaszone zielenie i błękity.',
                ],
            },
            {
                title: 'Jak pracuję',
                icon: '📷',
                paragraphs: [
                    'Prowadzę lekko: podpowiadam, ale nie ustawiam co do centymetra. Z dziećmi pracujemy przez zabawę i ruch — szybko łapiemy naturalne emocje.',
                    'Dorośli dostają czas i spokojne wskazówki. Bez presji. Niezależnie czy to chrzest w lokalnym kościele, czy sesja narzeczeńska na łące — jestem do dyspozycji.',
                ],
            },
        ],
        services: [
            { name: 'Sesja rodzinna Lisewo', description: 'Naturalne zdjęcia rodzinne na łąkach, w ogrodzie lub centrum wsi.' },
            { name: 'Fotografia ślubna', description: 'Reportaż ślubny w kościele i okolicznych plenerach.' },
            { name: 'Fotografia komunijna', description: 'Sesje komunijne w naturalnej, spokojnej scenerii.' },
        ],
        faqs: [
            { question: 'Ile kosztuje sesja w Lisewie?', answer: 'Cena zależy od wybranego rodzaju sesji i pakietu. Aktualne ceny, zakres oraz zasady dojazdu sprawdzisz w rezerwacji online.' },
            { question: 'Gdzie robisz sesje w Lisewie?', answer: 'Okolice centrum, polne ścieżki, łąki i lasy w okolicy. Znam tu mnóstwo miejsc.' },
        ],
        nearbyLinks: [
            { label: 'Fotograf Wąbrzeźno', href: '/fotograf-wabrzezno' },
            { label: 'Fotograf Grudziądz', href: '/fotograf-grudziadz' },
            { label: 'Fotograf Chełmno', href: '/fotograf-chelmno' },
            { label: 'Fotograf Płużnica', href: '/fotograf-pluznica' },
            { label: 'Fotograf Toruń', href: '/fotograf-torun' },
        ],
    },
    pluznica: {
        slug: 'fotograf-pluznica',
        city: 'Płużnica',
        region: 'kujawsko-pomorskie',
        h1: 'Fotograf Płużnica — sesje rodzinne i komunijne',
        metaTitle: 'Fotograf Płużnica ⭐ Śluby plenerowe, sesje rodzinne',
        metaDescription: 'Fotograf Płużnica: śluby w plenerze oraz lokalne sesje rodzinne i biznesowe. Naturalne kadry, galeria online i prosta rezerwacja terminu.',
        keywords: ['fotograf płużnica', 'sesja rodzinna płużnica', 'fotografia komunijna płużnica', 'zdjęcia płużnica'],
        heroImage: '/assets/portfolio/family/sesja-rodzinna-torun-plener-07.webp',
        lat: 53.3543,
        lng: 18.8849,
        intro: [
            'Płużnica to moja baza wypadowa. To tutaj mieszkam, tutaj ładuję baterie i stąd ruszam do Was w promieniu 75 km (a czasem dalej!).',
            'Sesje w gminie Płużnica mają ten unikalny, sielski klimat. Pola rzepaku wiosną, złote zboża latem — to naturalne studio fotograficzne tuż za progiem. Jako sąsiad — zapewniam sąsiedzkie podejście.',
        ],
        sections: [
            {
                title: 'Sesja zdjęciowa w Płużnicy i okolicy',
                icon: '📍',
                paragraphs: [
                    'Centrum gminy — spokojne tła i równe światło. Okoliczne łąki i polne drogi — naturalny plener bez tłumów.',
                    'Linie drzew i zagajniki — świetne na zachody słońca. Zapraszam na sesje w Twoim ogrodzie lub w moich ulubionych plenerach w okolicy.',
                ],
            },
        ],
        services: [
            { name: 'Sesja rodzinna Płużnica', description: 'Naturalne zdjęcia rodzinne w plenerze — łąki, pola, ogrody.' },
            { name: 'Fotografia komunijna', description: 'Sesje z Pierwszej Komunii w sielskiej scenerii.' },
            { name: 'Fotografia ślubna', description: 'Reportaż ślubny z dojazdem do kościoła i wesela.' },
        ],
        faqs: [
            { question: 'Ile kosztuje sesja w Płużnicy?', answer: 'Cena zależy od rodzaju sesji i zawartości pakietu. Aktualne warianty, ceny oraz zasady dojazdu sprawdzisz w rezerwacji online.' },
            { question: 'Gdzie robisz sesje w Płużnicy?', answer: 'Polne ścieżki, łąki, ogrody, zagajniki. Mam tu kilkanaście ulubionych lokalizacji.' },
        ],
        nearbyLinks: [
            { label: 'Fotograf Wąbrzeźno', href: '/fotograf-wabrzezno' },
            { label: 'Fotograf Lisewo', href: '/fotograf-lisewo' },
            { label: 'Fotograf Grudziądz', href: '/fotograf-grudziadz' },
            { label: 'Fotograf Toruń', href: '/fotograf-torun' },
        ],
    },
    swiecie: {
        slug: 'fotograf-swiecie',
        city: 'Świecie',
        region: 'kujawsko-pomorskie',
        h1: 'Fotograf w Świeciu — sesje rodzinne i śluby',
        metaTitle: 'Fotograf Świecie – sesje rodzinne i śluby | Ceny',
        metaDescription: 'Sesje rodzinne i fotografia ślubna w Świeciu. Zobacz aktualny zakres, wybierz pakiet i sprawdź wolny termin online.',
        keywords: ['fotograf świecie', 'sesja rodzinna świecie', 'fotografia ślubna świecie', 'zdjęcia świecie', 'fotograf świecie nad wisłą'],
        heroImage: '/assets/portfolio/family/sesja-rodzinna-torun-plener-07.webp',
        lat: 53.4100,
        lng: 18.4408,
        intro: [
            'Jestem Przemek. Do Świecia dojeżdżam na sesje rodzinne, śluby i zdjęcia par. Przed spotkaniem ustalamy zakres, miejsce oraz godzinę. Zamek, okolice Wdy i parki dają kilka różnych wariantów zdjęć.',
        ],
        sections: [
            {
                title: 'Lokalizacje na sesję w Świeciu',
                icon: '📍',
                paragraphs: [
                    'Zamek Krzyżacki w Świeciu — monumentalne tło dla sesji ślubnych i portretowych. Okolice Wdy i Wisły dają naturalny, spokojny plener.',
                    'Parki miejskie i tereny rekreacyjne — idealne na sesje rodzinne z dziećmi. Okolice mostu i nabrzeża — ciekawe kadry o złotej godzinie.',
                ],
            },
        ],
        services: [
            { name: 'Sesja rodzinna Świecie', description: 'Zdjęcia rodziny, dzieci i kilku pokoleń przy zamku, w parku albo nad rzeką.', href: '/sesja-rodzinna?city=Świecie' },
            { name: 'Fotografia ślubna Świecie', description: 'Ceremonia, kameralne przyjęcie albo pełny reportaż ślubny.', href: '/slub?city=Świecie' },
            { name: 'Sesja portretowa', description: 'Portrety wizerunkowe i artystyczne w świeckich plenerach.' },
        ],
        faqs: [
            { question: 'Ile kosztuje sesja zdjęciowa w Świeciu?', answer: 'Cena zależy od rodzaju sesji i wybranego pakietu. Aktualne ceny, zakres oraz zasady dojazdu są dostępne w rezerwacji online.' },
            { question: 'Gdzie robisz sesje w Świeciu?', answer: 'Zamek Krzyżacki, okolice Wdy i Wisły, parki miejskie. Pomagam wybrać lokalizację.' },
        ],
        nearbyLinks: [
            { label: 'Fotograf Chełmno', href: '/fotograf-chelmno' },
            { label: 'Fotograf Grudziądz', href: '/fotograf-grudziadz' },
            { label: 'Fotograf Toruń', href: '/fotograf-torun' },
            { label: 'Fotograf Bydgoszcz', href: '/fotograf-bydgoszcz' },
        ],
    },
    bydgoszcz: {
        slug: 'fotograf-bydgoszcz',
        city: 'Bydgoszcz',
        region: 'kujawsko-pomorskie',
        h1: 'Fotograf Bydgoszcz — sesje rodzinne, ślubne i biznesowe',
        metaTitle: 'Fotograf Bydgoszcz ⭐ Biznes, wizerunek, śluby, miasto',
        metaDescription: 'Fotograf Bydgoszcz: sesje wizerunkowe, biznesowe i rodzinne, śluby plenerowe oraz zdjęcia na Wyspie Młyńskiej i przy kanałach.',
        keywords: ['fotograf bydgoszcz', 'fotograf ślubny bydgoszcz', 'sesja rodzinna bydgoszcz', 'fotografia wizerunkowa bydgoszcz', 'zdjęcia bydgoszcz', 'sesja narzeczeńska bydgoszcz'],
        heroImage: '/assets/portfolio/family/sesja-rodzinna-torun-plener-07.webp',
        lat: 53.1235,
        lng: 18.0084,
        intro: [
            'Choć z Płużnicy mam kawałek, Bydgoszcz odwiedzam z przyjemnością na sesje fotograficzne. Wyspa Młyńska, kanały i nowoczesna architektura Opery dają ogromne pole do popisu.',
            'Realizuję w Bydgoszczy sesje rodzinne, narzeczeńskie, duże reportaże ślubne i sesje wizerunkowe. Miasto tętni życiem, a ja staram się to życie zamknąć w kadrach — dynamicznych, pełnych koloru i emocji.',
        ],
        sections: [
            {
                title: 'Najlepsze lokalizacje na sesję w Bydgoszczy',
                icon: '📍',
                paragraphs: [
                    'Wyspa Młyńska — serce Bydgoszczy i jedno z najbardziej fotogenicznych miejsc. Mostki, woda i zieleń tworzą klimat idealny na sesje par i rodzinne.',
                    'Kanał Bydgoski i wenecja bydgoska — malownicze kamienice nad wodą. Okolice Opery Nova i Filharmonii — nowoczesna architektura dla sesji wizerunkowych i biznesowych.',
                    'Myślęcinek i Park Kazimierza Wielkiego — rozległe tereny zielone na sesje rodzinne z dziećmi. Stary Rynek — klimatyczne tło miejskie.',
                ],
            },
            {
                title: 'Pakiet i realizacja',
                icon: '🖼️',
                paragraphs: [
                    'Po sesji w Bydgoszczy dostajesz galerię online z min. 20 zdjęciami po autorskiej obróbce. Odbitki premium w nPhoto. Gotowe do 10 dni roboczych.',
                    'Dojazd do Bydgoszczy rozliczam w ramach większych pakietów. Albumy i zestawy na życzenie.',
                ],
            },
        ],
        services: [
            { name: 'Sesja rodzinna Bydgoszcz', description: 'Naturalne zdjęcia rodzinne na Wyspie Młyńskiej, w Myślęcinku lub parku.' },
            { name: 'Fotografia ślubna Bydgoszcz', description: 'Reportaż ślubny + plener w klimatycznych lokalizacjach miasta.' },
            { name: 'Sesja wizerunkowa i biznesowa', description: 'Profesjonalne portrety przy Operze, kanałach lub w centrum.' },
            { name: 'Sesja narzeczeńska', description: 'Romantyczne zdjęcia par na Wyspie Młyńskiej i wenecji bydgoskiej.' },
        ],
        faqs: [
            { question: 'Ile kosztuje sesja zdjęciowa w Bydgoszczy?', answer: 'Cena zależy od rodzaju sesji, zakresu i dojazdu. Aktualne pakiety i ceny sprawdzisz w rezerwacji online przed wyborem terminu.' },
            { question: 'Gdzie najlepiej zrobić sesję w Bydgoszczy?', answer: 'Wyspa Młyńska, kanał bydgoski, okolice Opery Nova, Myślęcinek, Stary Rynek. Pomagam dobrać lokalizację.' },
            { question: 'Czy dojeżdżasz do Bydgoszczy?', answer: 'Tak, regularnie. Dojazd wliczony w pakiety ślubne i większe sesje. Dla sesji indywidualnych — mała dopłata.' },
        ],
        nearbyLinks: [
            { label: 'Fotograf Toruń', href: '/fotograf-torun' },
            { label: 'Fotograf Świecie', href: '/fotograf-swiecie' },
            { label: 'Fotograf Grudziądz', href: '/fotograf-grudziadz' },
            { label: 'Fotograf Chełmno', href: '/fotograf-chelmno' },
        ],
    },
};

const DYNAMIC_PRICE_META_CITIES = new Set(['torun', 'grudziadz', 'chelmno', 'wabrzezno', 'swiecie']);

function cityMetaDescription(key: string, data: CityInfo, prices: PublicMinimumPricesInCents) {
    if (!DYNAMIC_PRICE_META_CITIES.has(key) || (!prices.Sesja && !prices['Ślub'])) return data.metaDescription;
    return `Fotograf ${data.city}. Sesje rodzinne: ${publicPriceLabel(prices, 'Sesja')}; fotografia ślubna: ${publicPriceLabel(prices, 'Ślub')}. Zobacz pakiety i terminy online.`;
}

function configuredBookingCta(config: Awaited<ReturnType<typeof loadPhotoFunnelConfig>>, service: 'Sesja' | 'Ślub') {
    const serviceLabel = config.serviceOptions.find(option => option.value === service)?.label || service;
    return `${serviceLabel} — ${config.copy.packageBookingCtaLabel}`;
}

// ─── Helpers ──────────────────────────────────────────────────────

function getCityKey(slug: string): string | null {
    const cityMap: Record<string, string> = {
        'torun': 'torun',
        'grudziadz': 'grudziadz',
        'chelmno': 'chelmno',
        'wabrzezno': 'wabrzezno',
        'lisewo': 'lisewo',
        'pluznica': 'pluznica',
        'swiecie': 'swiecie',
        'bydgoszcz': 'bydgoszcz',
    };
    return cityMap[slug] || null;
}

export function getAllCitySlugs(): string[] {
    return Object.values(CITIES).map(c => c.slug.replace('fotograf-', ''));
}

// ─── Static Params (ISR) ─────────────────────────────────────────
export async function generateStaticParams() {
    return getAllCitySlugs().map(city => ({ city }));
}

// ─── Metadata ────────────────────────────────────────────────────
interface PageProps {
    params: Promise<{ city: string }>;
    sections?: PageSection[];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { city: citySlug } = await params;
    const key = getCityKey(citySlug);
    if (!key) return { title: 'Strona nie znaleziona' };
    const data = CITIES[key];
    const publicMinimumPrices = DYNAMIC_PRICE_META_CITIES.has(key) ? await loadPublicMinimumPrices() : {};
    const metaDescription = cityMetaDescription(key, data, publicMinimumPrices);

    return {
        title: data.metaTitle,
        description: metaDescription,
        keywords: data.keywords,
        alternates: {
            canonical: `https://wlasniewski.pl/${data.slug}`,
        },
        openGraph: {
            title: data.metaTitle,
            description: metaDescription,
            type: 'website',
            locale: 'pl_PL',
            url: `https://wlasniewski.pl/${data.slug}`,
            siteName: 'Przemysław Właśniewski — Fotograf',
            images: [{ url: data.heroImage, width: 1200, height: 630, alt: data.h1 }],
        },
        twitter: {
            card: 'summary_large_image',
            title: data.metaTitle,
            description: metaDescription,
            images: [data.heroImage],
        },
    };
}

function CityManagedMedia({ sections, city }: { sections: PageSection[]; city: string }) {
    return (
        <div className="bg-[#f4f1eb]">
            {sections.map((section) => {
                const data = { ...section, ...(section.data || {}) } as PageSection & Record<string, any>;

                if (section.type === 'hero_parallax' || section.type === 'parallax') {
                    const image = data.image || data.imageSrc;
                    if (!image) return null;

                    return (
                        <ParallaxSection
                            key={section.id}
                            image={image}
                            title={data.title || ''}
                            height="min-h-[56svh] md:min-h-[72vh]"
                            fontFamily="serif"
                            textAnimation={data.textAnimation || 'fade'}
                        />
                    );
                }

                if (section.type === 'gallery') {
                    const images = (data.images || []).filter(Boolean);
                    if (!images.length) return null;

                    return (
                        <section key={section.id} className="px-5 py-14 sm:px-10 md:py-20">
                            <div className="mx-auto max-w-7xl">
                                {data.title && (
                                    <h2 className="mb-9 max-w-3xl font-serif text-3xl font-medium leading-tight tracking-[-0.025em] text-[#25221f] sm:text-4xl">
                                        {data.title}
                                    </h2>
                                )}
                                <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4">
                                    {images.map((image: string, imageIndex: number) => (
                                        <figure
                                            key={`${section.id}-${imageIndex}`}
                                            className={`relative overflow-hidden bg-[#e8e2d9] ${
                                                imageIndex % 5 === 0 ? 'col-span-2 aspect-[16/10] md:col-span-2' : 'aspect-[4/5]'
                                            }`}
                                        >
                                            <Image
                                                src={image}
                                                alt={`Fotografia z sesji w ${city} — kadr ${imageIndex + 1}`}
                                                fill
                                                sizes={imageIndex % 5 === 0 ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 50vw, 33vw'}
                                                className="object-cover transition-transform duration-700 hover:scale-[1.025]"
                                            />
                                        </figure>
                                    ))}
                                </div>
                            </div>
                        </section>
                    );
                }

                if (section.type === 'mini_gallery') {
                    const items = (data.mini_gallery_items || []).filter((item: any) => item?.image);
                    if (!items.length) return null;

                    return (
                        <section key={section.id} className="px-5 py-14 sm:px-10 md:py-20">
                            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
                                {items.map((item: any, imageIndex: number) => (
                                    <figure key={item.id || imageIndex} className="group">
                                        <div className="relative aspect-[4/5] overflow-hidden bg-[#e8e2d9]">
                                            <Image
                                                src={item.image}
                                                alt={item.title || `Sesja fotograficzna w ${city}`}
                                                fill
                                                sizes="(max-width: 768px) 50vw, 25vw"
                                                className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                                            />
                                        </div>
                                        {item.title && <figcaption className="mt-3 font-serif text-lg text-[#35302b]">{item.title}</figcaption>}
                                    </figure>
                                ))}
                            </div>
                        </section>
                    );
                }

                return null;
            })}
        </div>
    );
}

// ─── Page Component ──────────────────────────────────────────────
export default async function CityLandingPage({ params, sections = [] }: PageProps) {
    const { city: citySlug } = await params;
    const key = getCityKey(citySlug);
    if (!key) notFound();
    const data = CITIES[key];
    const [publicPricing, photoFunnelConfig] = await Promise.all([
        loadPublicPricingSnapshot(),
        loadPhotoFunnelConfig(),
    ]);
    const publicMinimumPrices = publicPricing.minimumPrices;

    let cityGalleryImages: CityStoryPhoto[] = [];
    try {
        if (key === 'torun') {
            const prisma = (await import('@/lib/db/prisma')).default;
            const torunFamilySessions = await prisma.portfolioSession.findMany({
                where: {
                    is_published: true,
                    AND: [
                        {
                            OR: [
                                { category: { equals: 'family', mode: 'insensitive' } },
                                { category: { equals: 'rodzina', mode: 'insensitive' } },
                                { category: { equals: 'rodzinna', mode: 'insensitive' } },
                                { category: { equals: 'rodzinne', mode: 'insensitive' } },
                            ],
                        },
                        {
                            OR: [
                                { location: { contains: 'Toruń', mode: 'insensitive' } },
                                { location: { contains: 'Torun', mode: 'insensitive' } },
                                { title: { contains: 'Toruń', mode: 'insensitive' } },
                                { title: { contains: 'Torun', mode: 'insensitive' } },
                                { description: { contains: 'Toruń', mode: 'insensitive' } },
                                { description: { contains: 'Torun', mode: 'insensitive' } },
                            ],
                        },
                    ],
                },
                select: {
                    title: true,
                    cover_image_id: true,
                    media_ids: true,
                },
                orderBy: { session_date: 'desc' },
                take: 1,
            });

            const orderedMediaIds = torunFamilySessions.flatMap(session => {
                let mediaIds: number[] = [];
                try {
                    const parsed = session.media_ids ? JSON.parse(session.media_ids) : [];
                    mediaIds = Array.isArray(parsed)
                        ? parsed.map(Number).filter(Number.isInteger)
                        : [];
                } catch {
                    mediaIds = [];
                }
                return [
                    ...(session.cover_image_id ? [Number(session.cover_image_id)] : []),
                    ...mediaIds,
                ];
            }).filter((id, index, all) => all.indexOf(id) === index);

            if (orderedMediaIds.length > 0) {
                const media = await prisma.mediaLibrary.findMany({
                    where: { id: { in: orderedMediaIds } },
                    select: {
                        id: true,
                        file_path: true,
                        alt_text: true,
                        original_name: true,
                        tags: true,
                    },
                });
                const mediaById = new Map(media.map(item => [Number(item.id), item]));

                cityGalleryImages = orderedMediaIds
                    .flatMap((id, index) => {
                        const item = mediaById.get(id);
                        if (!item?.file_path) return [];
                        return [{
                            src: item.file_path,
                            alt: item.alt_text || `Rodzinna sesja fotograficzna w Toruniu — kadr ${index + 1}`,
                            caption: item.alt_text || 'Rodzinna sesja w miejskiej przestrzeni Torunia',
                        }];
                    })
                    .slice(0, 7);
            }
        } else {
            const portfolioCategories = await getPortfolioCategories();
            const allSessions = portfolioCategories.flatMap(category => category.sessions || []);
            const cityNeedle = String(data.city || '').toLocaleLowerCase('pl-PL');
            const citySlugNeedle = String(data.slug || '').replace('fotograf-', '').toLowerCase();
            const matchingSessions = allSessions.filter(session => {
                const haystack = `${session.title || ''} ${session.slug || ''} ${session.location || ''} ${session.description || ''}`.toLocaleLowerCase('pl-PL');
                return haystack.includes(cityNeedle) || haystack.includes(citySlugNeedle);
            });

            const candidatePhotos: CityStoryPhoto[] = matchingSessions.flatMap(session => {
                const highlighted = Array.isArray(session.highlightedPhotos) ? session.highlightedPhotos : [];
                const sources = [session.coverImage, ...highlighted]
                    .filter((src): src is string => typeof src === 'string' && src.length > 0);
                return sources.map((src, index) => ({
                    src,
                    alt: `${session.title || 'Sesja fotograficzna'} — fotografia Przemysława Właśniewskiego`,
                    caption: index === 0
                        ? (session.title || 'Sesja fotograficzna')
                        : `${session.title || 'Sesja fotograficzna'} — wybrany kadr z galerii`,
                }));
            });

            cityGalleryImages = candidatePhotos
                .filter((photo, index, all) => all.findIndex(candidate => candidate.src === photo.src) === index)
                .slice(0, 7);
        }
    } catch (error) {
        console.error('[CityLandingPage] Portfolio gallery fallback:', error);
    }

    const heroPhoto = cityGalleryImages[0]?.src || data.heroImage;


    // JSON-LD: FAQPage
    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: data.faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    };

    // JSON-LD: the city page describes a service area of the one global business.
    const serviceSchema = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': `https://wlasniewski.pl/${data.slug}#service`,
        name: `Usługi fotograficzne — ${data.city}`,
        serviceType: 'Fotografia rodzinna, ślubna i portretowa',
        description: cityMetaDescription(key, data, publicMinimumPrices),
        image: heroPhoto.startsWith('http') ? heroPhoto : `https://wlasniewski.pl${heroPhoto}`,
        url: `https://wlasniewski.pl/${data.slug}`,
        provider: { '@id': 'https://wlasniewski.pl/#business' },
        areaServed: { '@type': 'City', name: data.city },
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: `Usługi fotograficzne — ${data.city}`,
            itemListElement: data.services.map(s => ({
                '@type': 'Offer',
                itemOffered: {
                    '@type': 'Service',
                    name: s.name,
                    description: s.description,
                    provider: { '@id': 'https://wlasniewski.pl/#business' },
                    areaServed: { '@type': 'City', name: data.city },
                },
            })),
        },
    };

    // JSON-LD: BreadcrumbList
    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Strona główna', item: 'https://wlasniewski.pl' },
            { '@type': 'ListItem', position: 2, name: `Fotograf ${data.city}`, item: `https://wlasniewski.pl/${data.slug}` },
        ],
    };

    const managedMediaSections = sections.filter(section =>
        ['hero_parallax', 'parallax', 'gallery', 'mini_gallery'].includes(section.type)
    );

    return (
        <main className="min-h-screen bg-[#f4f1eb] font-sans text-[#25221f] selection:bg-[#b6a894] selection:text-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

            <section className="border-b border-[#d9d2c8] bg-[#ebe6de]">
                <div className="mx-auto grid min-h-[calc(100svh-8rem)] max-w-[1500px] lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="order-2 flex items-center px-6 py-14 sm:px-10 lg:order-1 lg:px-16 xl:px-24">
                        <div className="max-w-xl">
                            <nav className="mb-8 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#746d65]" aria-label="Breadcrumb">
                                <Link href="/" className="transition hover:text-[#25221f]">Strona główna</Link>
                                <span aria-hidden="true">/</span>
                                <span>Fotograf {data.city}</span>
                            </nav>
                            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.32em] text-[#8d7f6d]">
                                Przemysław Właśniewski · fotografia
                            </p>
                            <h1 className="font-serif text-[2.6rem] font-medium leading-[1.02] tracking-[-0.025em] text-[#201e1b] sm:text-6xl xl:text-7xl">
                                {data.h1}
                            </h1>
                            <div className="mt-8 space-y-5 text-lg leading-relaxed text-[#514b44]">
                                {data.intro.map((paragraph, index) => (
                                    <p key={index}>{paragraph}</p>
                                ))}
                            </div>
                            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                                <Link
                                    href={`/rezerwacja?source=city&city=${encodeURIComponent(data.city)}&service=Sesja`}
                                    data-analytics="photo-cta-booking-city-family-hero"
                                    className="inline-flex items-center justify-center rounded-full bg-[#292622] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#11100f]"
                                >
                                    {configuredBookingCta(photoFunnelConfig, 'Sesja')}
                                </Link>
                                <Link
                                    href={`/rezerwacja?source=city&city=${encodeURIComponent(data.city)}&service=Ślub`}
                                    data-analytics="photo-cta-booking-city-wedding-hero"
                                    className="inline-flex items-center justify-center rounded-full border border-[#a9a095] px-7 py-3.5 text-sm font-semibold text-[#292622] transition hover:border-[#292622]"
                                >
                                    {configuredBookingCta(photoFunnelConfig, 'Ślub')}
                                </Link>
                                {photoFunnelConfig.display.showHeroInquiryCta && photoFunnelConfig.display.cityModuleEnabled && (
                                    <Link
                                        href={`?source=city-hero-inquiry&service=Sesja#szybki-kontakt`}
                                        data-analytics="photo-cta-inquiry-city-hero"
                                        className="inline-flex items-center justify-center rounded-full border border-[#a9a095] px-7 py-3.5 text-center text-sm font-semibold text-[#292622] transition hover:border-[#292622]"
                                    >
                                        {photoFunnelConfig.copy.inquiryCtaLabel}
                                    </Link>
                                )}
                            </div>
                            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-[#cfc7bd] pt-6 text-xs leading-relaxed text-[#6e675f]">
                                <span>Spokojne prowadzenie</span>
                                <span>Prywatna galeria</span>
                                <span>Płatność PayU</span>
                            </div>
                        </div>
                    </div>
                    <div className="relative order-1 min-h-[52svh] overflow-hidden lg:order-2 lg:min-h-full">
                        <Image
                            src={heroPhoto}
                            alt={`Fotografia w ${data.city} — Przemysław Właśniewski`}
                            fill
                            className="object-cover object-center"
                            priority
                            sizes="(max-width: 1024px) 100vw, 55vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5" />
                    </div>
                </div>
            </section>

            <section className="px-6 py-20 sm:px-10 lg:py-28">
                <div className="mx-auto max-w-6xl">
                    <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8d7f6d]">Oferta w {data.city}</p>
                            <h2 className="mt-4 font-serif text-3xl font-medium leading-tight text-[#25221f] md:text-5xl">
                                Wybierz zakres, który pasuje do Waszego dnia
                            </h2>
                            <p className="mt-6 max-w-md leading-relaxed text-[#6c655d]">
                                Cena, czas fotografowania i liczba gotowych zdjęć są widoczne przed rezerwacją. Bez ukrytych etapów i ogólnej wyceny „od”.
                            </p>
                        </div>
                        <div className="grid gap-px overflow-hidden rounded-2xl border border-[#d7d0c6] bg-[#d7d0c6] md:grid-cols-3">
                            {[
                                { title: 'Sesja rodzinna', service: 'Sesja', text: 'Rodzina, para, dzieci albo kilka pokoleń.' },
                                { title: 'Ślub', service: 'Ślub', text: 'Ceremonia cywilna, kościelna lub pełny reportaż.' },
                                { title: 'Przyjęcie', service: 'Urodziny', text: 'Urodziny, rocznica i rodzinne spotkanie.' },
                            ].map((item, index) => (
                                <Link
                                    key={item.title}
                                    href={`/rezerwacja?source=city-funnel&city=${encodeURIComponent(data.city)}&service=${encodeURIComponent(item.service)}${publicPricing.minimumPromotions[item.service] ? `&package_id=${publicPricing.minimumPromotions[item.service].packageId}` : ''}`}
                                    className="group flex min-h-64 flex-col bg-[#faf8f4] p-7 transition hover:bg-white"
                                >
                                    <span className="text-xs tracking-[0.2em] text-[#918577]">0{index + 1}</span>
                                    <h3 className="mt-8 font-serif text-2xl font-medium">{item.title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed text-[#716a62]">{item.text}</p>
                                    <div className="mt-auto flex items-end justify-between gap-3 pt-8">
                                        {publicPricing.minimumPromotions[item.service] ? (
                                            <PromotionPriceBlock promotion={publicPricing.minimumPromotions[item.service]} variant="compact" />
                                        ) : <span className="font-semibold text-[#413c36]">{publicPriceLabel(publicMinimumPrices, item.service)}</span>}
                                        <span className="text-[#8d7f6d] transition group-hover:translate-x-1" aria-hidden="true">→</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {managedMediaSections.length > 0 ? (
                <CityManagedMedia sections={managedMediaSections} city={data.city} />
            ) : (
                <CityPhotoStory images={cityGalleryImages} city={data.city} />
            )}

            <section className="border-y border-[#d9d2c8] bg-[#e9e4dc] px-6 py-20 sm:px-10 lg:py-28">
                <div className="mx-auto max-w-6xl">
                    <div className="grid gap-px overflow-hidden rounded-2xl border border-[#d2cbc1] bg-[#d2cbc1] lg:grid-cols-3">
                        {data.sections.map((section, index) => (
                            <article key={section.title} className="bg-[#f7f4ef] p-8 md:p-10">
                                <span className="text-xs tracking-[0.22em] text-[#948777]">0{index + 1}</span>
                                <h2 className="mt-6 font-serif text-[1.8rem] font-medium leading-tight text-[#26231f]">
                                    {section.title}
                                </h2>
                                <div className="mt-6 space-y-5 leading-relaxed text-[#665f57]">
                                    {section.paragraphs.map((paragraph, paragraphIndex) => (
                                        <p key={paragraphIndex}>{paragraph}</p>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-6 py-20 sm:px-10 lg:py-28">
                <div className="mx-auto max-w-6xl">
                    <div className="mx-auto max-w-3xl text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8d7f6d]">Zakres fotografii</p>
                        <h2 className="mt-4 font-serif text-3xl font-medium md:text-5xl">Fotografuję ludzi, nie schematy</h2>
                        <p className="mt-5 leading-relaxed text-[#6c655d]">Każde spotkanie ma inny rytm. Zakres ustalamy jasno, a sposób pracy dopasowuję do Was i miejsca.</p>
                    </div>
                    <div className="mt-14 grid gap-5 md:grid-cols-2">
                        {data.services.map((service, index) => {
                            const content = (
                                <>
                                <span className="text-xs tracking-[0.2em] text-[#948777]">0{index + 1}</span>
                                <h3 className="mt-5 font-serif text-2xl font-medium">{service.name}</h3>
                                <p className="mt-3 leading-relaxed text-[#6c655d]">{service.description}</p>
                                {service.href && <span className="mt-6 inline-flex text-sm font-semibold text-[#413c36]">Zobacz ofertę <span className="ml-2" aria-hidden="true">→</span></span>}
                                </>
                            );

                            return service.href ? (
                                <Link key={service.name} href={service.href} className="group rounded-2xl border border-[#d8d1c7] bg-[#fbfaf7] p-7 transition hover:-translate-y-0.5 hover:border-[#a99b89] md:p-8">
                                    {content}
                                </Link>
                            ) : (
                                <article key={service.name} className="rounded-2xl border border-[#d8d1c7] bg-[#fbfaf7] p-7 md:p-8">
                                    {content}
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            {photoFunnelConfig.display.cityModuleEnabled && photoFunnelConfig.display.cityPosition === 'before_faq' && (
                <CityLeadSection
                    city={data.city}
                    citySlug={data.slug.replace('fotograf-', '')}
                    initialService="Sesja"
                    source="city-soft-inquiry"
                    funnelConfig={photoFunnelConfig}
                />
            )}

            <section className="border-y border-[#d9d2c8] bg-white/55 px-6 py-20 sm:px-10 lg:py-28">
                <div className="mx-auto max-w-4xl">
                    <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-[#8d7f6d]">Przed rezerwacją</p>
                    <h2 className="mt-4 text-center font-serif text-3xl font-medium md:text-5xl">Pytania, które pojawiają się najczęściej</h2>
                    <div className="mt-12 divide-y divide-[#d7d0c6] border-y border-[#d7d0c6]">
                        {data.faqs.map((faq) => (
                            <details key={faq.question} className="group">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-lg font-medium">
                                    <span>{faq.question}</span>
                                    <span className="text-[#8d7f6d] transition group-open:rotate-45" aria-hidden="true">＋</span>
                                </summary>
                                <p className="max-w-3xl pb-7 leading-relaxed text-[#6c655d]">{faq.answer}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {photoFunnelConfig.display.cityModuleEnabled && photoFunnelConfig.display.cityPosition === 'before_closing' && (
                <CityLeadSection
                    city={data.city}
                    citySlug={data.slug.replace('fotograf-', '')}
                    initialService="Sesja"
                    source="city-soft-inquiry"
                    funnelConfig={photoFunnelConfig}
                />
            )}

            <section className="bg-[#26231f] px-6 py-20 text-[#f7f4ef] sm:px-10 lg:py-28">
                <div className="mx-auto max-w-5xl text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c4b8a8]">Następny krok</p>
                    <h2 className="mx-auto mt-5 max-w-3xl font-serif text-3xl font-medium leading-tight md:text-6xl">
                        Zobaczcie zakres, cenę i wybierzcie termin
                    </h2>
                    <p className="mx-auto mt-6 max-w-2xl leading-relaxed text-[#cfc8bf]">
                        Jeśli przed wyborem chcecie o coś zapytać, zadzwońcie albo napiszcie. Odpowiem konkretnie i pomogę dobrać zakres.
                    </p>
                    <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                        {photoFunnelConfig.display.showClosingInquiryCta && photoFunnelConfig.display.cityModuleEnabled && (
                            <Link
                                href={`?source=city-end-inquiry&service=Sesja#szybki-kontakt`}
                                data-analytics="photo-cta-inquiry-city-closing"
                                className="rounded-full bg-[#eee8de] px-8 py-4 text-sm font-semibold text-[#26231f] transition hover:bg-white"
                            >
                                {photoFunnelConfig.copy.inquiryCtaLabel}
                            </Link>
                        )}
                        <Link
                            href={`/rezerwacja?source=city-end&city=${encodeURIComponent(data.city)}&service=Sesja`}
                            data-analytics="photo-cta-booking-city-family-closing"
                            className="rounded-full border border-white/30 px-8 py-4 text-sm font-semibold text-white transition hover:border-white/70"
                        >
                            {configuredBookingCta(photoFunnelConfig, 'Sesja')}
                        </Link>
                        <Link
                            href={`/rezerwacja?source=city-end&city=${encodeURIComponent(data.city)}&service=Ślub`}
                            data-analytics="photo-cta-booking-city-wedding-closing"
                            className="rounded-full border border-white/30 px-8 py-4 text-sm font-semibold text-white transition hover:border-white/70"
                        >
                            {configuredBookingCta(photoFunnelConfig, 'Ślub')}
                        </Link>
                    </div>
                    <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-[#cfc8bf]">
                        <Link href="/kontakt" className="hover:text-white">Napisz do mnie</Link>
                        <a href="tel:+48530788694" className="hover:text-white">+48 530 788 694</a>
                    </div>
                </div>
            </section>

            <section className="border-t border-[#d9d2c8] px-6 py-14 sm:px-10">
                <div className="mx-auto max-w-5xl">
                    <h2 className="text-center font-serif text-2xl font-medium">Fotografuję również w pobliżu</h2>
                    <div className="mt-7 flex flex-wrap justify-center gap-2">
                        {data.nearbyLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="rounded-full border border-[#cfc7bd] px-5 py-2.5 text-sm text-[#5e574f] transition hover:border-[#5e574f] hover:text-[#25221f]"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
