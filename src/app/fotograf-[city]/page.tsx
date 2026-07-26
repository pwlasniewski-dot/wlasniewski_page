import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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
    services: { name: string; description: string }[];
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
        h1: 'Fotograf w Toruniu. Rodzinne historie, śluby i portrety.',
        metaTitle: 'Fotograf Toruń | Sesje rodzinne i śluby — Właśniewski',
        metaDescription: 'Fotograf w Toruniu: sesje rodzinne od 750 zł, ceremonia cywilna od 1900 zł i pełny reportaż ślubny. Zobacz pakiety i wolne terminy online.',
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
                    'Najpierw wybierasz pakiet i termin. Przed spotkaniem krótko ustalamy, kto będzie na zdjęciach, jaki klimat lubicie i gdzie się spotykamy. Nie musicie umieć pozować — podczas sesji daję proste wskazówki i dbam o spokojne tempo.',
                    'Z dziećmi pracuję przez zabawę i ruch. Z parami oraz dorosłymi skupiam się na rozmowie, bliskości i dobrym świetle. Dzięki temu zdjęcia są swobodne, ale nadal uporządkowane i dopracowane.',
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
            { name: 'Sesja rodzinna w Toruniu', description: 'Od 750 zł. Rodzina, para, dzieci albo zdjęcia kilku pokoleń — w mieście lub spokojnym plenerze.' },
            { name: 'Fotografia ślubna Toruń', description: 'Ceremonia cywilna od 1900 zł, kameralny ślub z przyjęciem lub pełny reportaż ślubny.' },
            { name: 'Urodziny i rodzinne przyjęcia', description: 'Reportaż z urodzin, jubileuszu i ważnego rodzinnego spotkania, bez odrywania gości od zabawy.' },
            { name: 'Sesja portretowa i wizerunkowa', description: 'Portrety do pracy, marki osobistej albo po prostu dla siebie — w plenerze lub wybranym wnętrzu.' },
        ],
        faqs: [
            { question: 'Ile kosztuje sesja rodzinna w Toruniu?', answer: 'Pakiety rodzinne kosztują 750 zł, 980 zł lub 1630 zł. Różnią się czasem fotografowania, liczbą gotowych zdjęć i dodatkami. Wszystkie szczegóły oraz wolne terminy są dostępne w rezerwacji online.' },
            { question: 'Ile kosztuje fotograf na ślub w Toruniu?', answer: 'Ceremonia cywilna z życzeniami i krótką sesją kosztuje 1900 zł. Ślub z kameralnym przyjęciem to 3500 zł, a pełny reportaż do 12 godzin kosztuje 5900 zł.' },
            { question: 'Gdzie najlepiej zrobić sesję w Toruniu?', answer: 'Najczęściej fotografuję na Starówce, Bulwarze Filadelfijskim, Bydgoskim Przedmieściu i w Parku Miejskim. Miejsce dobieram do pory dnia, wieku dzieci i klimatu, który chcecie uzyskać.' },
            { question: 'Czy musimy umieć pozować?', answer: 'Nie. Daję proste wskazówki, pokazuję gdzie stanąć i co zrobić, ale nie ustawiam każdej dłoni. Zależy mi na swobodnych zdjęciach, w których nadal dobrze wyglądacie.' },
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
        h1: 'Fotograf Grudziądz — sesje rodzinne, ślubne i biznesowe',
        metaTitle: 'Fotograf Grudziądz ⭐ Sesje rodzinne, ślubne, biznesowe',
        metaDescription: '★ Fotograf Grudziądz ★ Sesje rodzinne od 450 zł, śluby, portrety. Spichrze, bulwary nad Wisłą, Góra Zamkowa. ✓ Galeria online ✓ Dojazd w cenie ☎ 530 788 694',
        keywords: ['fotograf grudziądz', 'fotograf ślubny grudziądz', 'sesja rodzinna grudziądz', 'fotografia portretowa grudziądz', 'zdjęcia plenerowe grudziądz', 'sesja narzeczeńska grudziądz'],
        heroImage: '/assets/portfolio/family/sesja-rodzinna-torun-plener-07.webp',
        lat: 53.4837,
        lng: 18.7536,
        intro: [
            'Jestem Przemek — dojeżdżam do Grudziądza na sesje rodzinne, ślubne, biznesowe i eventowe. Grudziądz ze swoją panoramą spichlerzy to jedno z najbardziej fotogenicznych miejsc w województwie kujawsko-pomorskim.',
            'Uwielbiam realizować tu sesje o zachodzie słońca, gdy ceglane mury nabierają ciepłych barw. Mieszkam w okolicy (baza w Płużnicy), więc do Grudziądza mam rzut beretem i dojazd w ramach pakietu.',
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
                    'Nie stresujmy się pozowaniem — wolę pójść z Wami na spacer i przy okazji zrobić świetne zdjęcia. W Grudziądzu pracuję dokładnie tak samo jak wszędzie: reportażowo, z naturalnymi emocjami.',
                    'Z dziećmi są zabawy i mikrozadania, z dorosłymi — spokojne wskazówki i rozmowa. Cel to prawdziwe, niesztuczne kadry pełne emocji. Wykorzystuję architekturę Grudziądza jako tło, ale najważniejsi jesteście Wy.',
                ],
            },
            {
                title: 'Pakiet i realizacja',
                icon: '🖼️',
                paragraphs: [
                    'Po sesji w Grudziądzu dostajesz galerię online z wyselekcjonowanymi zdjęciami po autorskiej obróbce. Minimum 20 ujęć w pakiecie podstawowym.',
                    'Odbitki realizuję w profesjonalnym labie nPhoto — świetna jakość i trwałość. Albumy projektuję indywidualnie. Gotowe zdjęcia do 10 dni roboczych.',
                ],
            },
        ],
        services: [
            { name: 'Sesja rodzinna w Grudziądzu', description: 'Naturalne zdjęcia rodzinne przy spicherzach, w parku lub w plenerze nad Wisłą.' },
            { name: 'Fotografia ślubna Grudziądz', description: 'Reportaż ślubny od przygotowań do pierwszego tańca + sesja plenerowa.' },
            { name: 'Sesja portretowa i biznesowa', description: 'Profesjonalne portrety wizerunkowe i biznesowe w klimatycznych lokalizacjach Grudziądza.' },
            { name: 'Fotografia komunijna Grudziądz', description: 'Pamiątkowe zdjęcia z Pierwszej Komunii — kościół, plener, portret.' },
            { name: 'Zdjęcia z drona', description: 'Ujęcia panoramy spichlerzy i Wisły z lotu ptaka — na ślub, event lub sesję.' },
        ],
        faqs: [
            { question: 'Ile kosztuje sesja zdjęciowa w Grudziądzu?', answer: 'Sesja portretowa od 400 zł, rodzinna od 500 zł. Dojazd do Grudziądza w cenie pakietu. Fotografia ślubna wyceniana indywidualnie. W pakiecie: prowadzenie, selekcja, obróbka i galeria online.' },
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
        h1: 'Fotograf Chełmno — Miasto Zakochanych w kadrze',
        metaTitle: 'Fotograf Chełmno ⭐ Śluby plenerowe, narzeczeńskie, rodzinne',
        metaDescription: '★ Fotograf Chełmno ★ Śluby w plenerze, sesje narzeczeńskie w Mieście Zakochanych, biznesowe i rodzinne. Rynek, mury, Wisła. ☎ 530 788 694',
        keywords: ['fotograf chełmno', 'fotograf ślubny chełmno', 'sesja narzeczeńska chełmno', 'sesja rodzinna chełmno', 'miasto zakochanych zdjęcia', 'fotografia chełmno'],
        heroImage: '/assets/portfolio/family/sesja-rodzinna-torun-plener-07.webp',
        lat: 53.3490,
        lng: 18.4311,
        intro: [
            'Chełmno, Miasto Zakochanych — czy może być lepsze miejsce na sesję narzeczeńską lub ślubną? Urokliwy rynek, parki i panorama Wisły tworzą niesamowity klimat do fotografii.',
            'Jestem Przemek — fotograf dojeżdżający do Chełmna. Lubię wykorzystywać architekturę tego pięknego miasta jako tło do portretów. Najważniejsi jesteście Wy i Wasze uczucia. Jestem u Was w kilkanaście minut, gotowy uwiecznić Waszą historię.',
        ],
        sections: [
            {
                title: 'Miejsca na sesję zdjęciową w Chełmnie',
                icon: '📍',
                paragraphs: [
                    'Rynek w Chełmnie z renesansowym ratuszem to ikoniczne tło. Mury obronne — jedne z najlepiej zachowanych w Polsce — dają unikalny, historyczny klimat. Brama Grudziądzka i Brama Merseburska to punkty, które kocham fotograficznie.',
                    'Park nad Wisłą i teren przy Fosa Miejska — spokojne miejsca z naturalnym światłem, idealne na sesje rodzinne. Okolice kościołów (Wniebowzięcia NMP, farny) sprawdzają się na sesje komunijne i ślubne.',
                    'Latem organizowany jest tu Festiwal Miłości — jeśli planujesz sesję narzeczeńską w Chełmnie, złota godzina + mury miejskie = magia.',
                ],
            },
            {
                title: 'Styl pracy i podejście',
                icon: '📷',
                paragraphs: [
                    'W Chełmnie staram się łapać ulotne momenty czułości, które w tym mieście wydają się jeszcze bardziej magiczne. Prowadzę reportażowo — nie ustawiam sztywnych póz.',
                    'Sesja narzeczeńska w Chełmnie to spacer po starówce z drobnymi podpowiedziami ode mnie. Naturalność i emocje ponad pozowanie. Z dziećmi pracuję przez zabawę.',
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
            { name: 'Sesja narzeczeńska w Chełmnie', description: 'Romantyczna sesja par w Mieście Zakochanych — rynek, mury, panorama Wisły.' },
            { name: 'Fotografia ślubna Chełmno', description: 'Reportaż ślubny + sesja plenerowa w pięknych chełmińskich plenerach.' },
            { name: 'Sesja rodzinna', description: 'Naturalne zdjęcia rodzinne w parku, na starówce lub w plenerze.' },
            { name: 'Fotografia komunijna', description: 'Pamiątkowe zdjęcia z Pierwszej Komunii Świętej w Chełmnie.' },
        ],
        faqs: [
            { question: 'Ile kosztuje sesja zdjęciowa w Chełmnie?', answer: 'Sesja narzeczeńska/portretowa od 400 zł, rodzinna od 500 zł. Dojazd do Chełmna w cenie. Ślub wyceniany indywidualnie.' },
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
        h1: 'Fotograf Wąbrzeźno — rodzinna, ślubna i portretowa',
        metaTitle: 'Fotograf Wąbrzeźno ⭐ Śluby, wizerunek, sesje plenerowe',
        metaDescription: '★ Fotograf Wąbrzeźno ★ Śluby plenerowe, sesje wizerunkowe i biznesowe, rodzinne nad Jeziorem Zamkowym. Lokalny fotograf, dojazd gratis. ☎ 530 788 694',
        keywords: ['fotograf wąbrzeźno', 'fotograf wabrzeźno', 'sesja rodzinna wąbrzeźno', 'fotografia ślubna wąbrzeźno', 'sesja narzeczeńska wąbrzeźno', 'zdjęcia wąbrzeźno'],
        heroImage: '/assets/portfolio/family/sesja-rodzinna-torun-plener-07.webp',
        lat: 53.2860,
        lng: 18.9557,
        intro: [
            'Nazywam się Przemek — fotograf w Wąbrzeźnie. Mieszkam tuż obok, więc Wąbrzeźno to mój „domowy" teren. Jezioro Zamkowe i Frydek to klasyki, ale znam też mnóstwo ukrytych miejsc w okolicznych lasach i na polach.',
            'Pracuję bez presji i bez sztucznego pozowania. Działając lokalnie, jestem dostępny nierzadko „od ręki" na krótsze sesje. Fotografia w Wąbrzeźnie nie musi być nudna — pokażę Ci, jak wydobyć piękno z naszych codziennych okolic.',
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
                    'Prowadzę reportażowo: podpowiadam drobiazgi, nie ustawiam sztywno. Z dziećmi — zabawa i mikrozadania. Dorośli — spokój, rozmowa, kilka kroków przy ciekawym świetle.',
                    'Łapiemy naturalne gesty, a potem dokładamy portrety i detale. Realizuję tu reportaże ślubne, osiemnastki i sesje komunijne, zawsze z pełnym zaangażowaniem.',
                ],
            },
            {
                title: 'Pakiet i realizacja',
                icon: '🖼️',
                paragraphs: [
                    'Po sesji otrzymujesz galerię online z gotowymi zdjęciami po obróbce. Odbitki i album projektuję na życzenie, z akceptacją projektu.',
                    'Gotowe zdjęcia do 10 dni roboczych. Ceny zależne od pakietu — wszystko przejrzyście na mailu po wyborze terminu.',
                ],
            },
        ],
        services: [
            { name: 'Sesja rodzinna w Wąbrzeźnie', description: 'Naturalne zdjęcia rodzinne nad jeziorem, w parku lub na łąkach.' },
            { name: 'Fotografia ślubna Wąbrzeźno', description: 'Reportaż ślubny + sesja plenerowa w okolicznych plenerach.' },
            { name: 'Sesja portretowa', description: 'Portrety indywidualne i wizerunkowe w kameralnych lokalizacjach.' },
            { name: 'Fotografia komunijna', description: 'Sesje komunijne — kościół, plener i portret.' },
        ],
        faqs: [
            { question: 'Ile kosztuje sesja zdjęciowa w Wąbrzeźnie?', answer: 'Sesja portretowa od 400 zł, rodzinna od 500 zł. Dojazd wliczony — mieszkam w okolicy. Ślub wyceniany indywidualnie.' },
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
        metaDescription: '★ Fotograf Lisewo ★ Śluby w plenerze, sesje rodzinne i wizerunkowe z dala od miejskiego zgiełku. Naturalna fotografia. ☎ 530 788 694',
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
            { question: 'Ile kosztuje sesja w Lisewie?', answer: 'Sesja rodzinna od 500 zł, portretowa od 400 zł. Dojazd wliczony — jestem stąd.' },
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
        metaDescription: '★ Fotograf Płużnica ★ Śluby w plenerze, sesje rodzinne, biznesowe. Lokalny fotograf — dojazd w cenie. Galeria online. ☎ 530 788 694',
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
            { question: 'Ile kosztuje sesja w Płużnicy?', answer: 'Sesja rodzinna od 500 zł, portretowa od 400 zł. Bez kosztów dojazdu — mieszkam tutaj.' },
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
        h1: 'Fotograf Świecie — sesje rodzinne, ślubne i portretowe',
        metaTitle: 'Fotograf Świecie ⭐ Śluby, wizerunek, sesje miejskie',
        metaDescription: '★ Fotograf Świecie ★ Śluby plenerowe przy Zamku Krzyżackim, sesje wizerunkowe, biznesowe i rodzinne nad Wdą. ☎ 530 788 694',
        keywords: ['fotograf świecie', 'sesja rodzinna świecie', 'fotografia ślubna świecie', 'zdjęcia świecie', 'fotograf świecie nad wisłą'],
        heroImage: '/assets/portfolio/family/sesja-rodzinna-torun-plener-07.webp',
        lat: 53.4100,
        lng: 18.4408,
        intro: [
            'Zamek w Świeciu to ikona, ale fotograficznie miasto ma do zaoferowania znacznie więcej. Parki, okolice Wdy i Wisły to świetne plenery na sesje rodzinne i narzeczeńskie.',
            'Jestem Przemek — fotograf dojeżdżający do Świecia. Cenię sobie otwartość mieszkańców i swobodną atmosferę, którą staram się oddać na zdjęciach.',
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
            { name: 'Sesja rodzinna Świecie', description: 'Naturalne zdjęcia przy zamku, w parku lub nad rzeką.' },
            { name: 'Fotografia ślubna Świecie', description: 'Reportaż ślubny + sesja plenerowa przy Zamku Krzyżackim.' },
            { name: 'Sesja portretowa', description: 'Portrety wizerunkowe i artystyczne w świeckich plenerach.' },
        ],
        faqs: [
            { question: 'Ile kosztuje sesja zdjęciowa w Świeciu?', answer: 'Sesja portretowa od 400 zł, rodzinna od 500 zł. Dojazd do Świecia wliczony w pakiet.' },
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
        metaDescription: '★ Fotograf Bydgoszcz ★ Sesje wizerunkowe i biznesowe od 450 zł, śluby plenerowe, sesje na Wyspie Młyńskiej i kanałach. ☎ 530 788 694',
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
            { question: 'Ile kosztuje sesja zdjęciowa w Bydgoszczy?', answer: 'Sesja portretowa od 450 zł, rodzinna od 550 zł (z dojazdem). Fotografia ślubna — wycena indywidualna.' },
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
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { city: citySlug } = await params;
    const key = getCityKey(citySlug);
    if (!key) return { title: 'Strona nie znaleziona' };
    const data = CITIES[key];

    return {
        title: data.metaTitle,
        description: data.metaDescription,
        keywords: data.keywords,
        alternates: {
            canonical: `https://wlasniewski.pl/${data.slug}`,
        },
        openGraph: {
            title: data.metaTitle,
            description: data.metaDescription,
            type: 'website',
            locale: 'pl_PL',
            url: `https://wlasniewski.pl/${data.slug}`,
            siteName: 'Przemysław Właśniewski — Fotograf',
            images: [{ url: data.heroImage, width: 1200, height: 630, alt: data.h1 }],
        },
        twitter: {
            card: 'summary_large_image',
            title: data.metaTitle,
            description: data.metaDescription,
            images: [data.heroImage],
        },
    };
}

// ─── Page Component ──────────────────────────────────────────────
export default async function CityLandingPage({ params }: PageProps) {
    const { city: citySlug } = await params;
    const key = getCityKey(citySlug);
    if (!key) notFound();
    const data = CITIES[key];

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

    // JSON-LD: LocalBusiness
    const localBusinessSchema = {
        '@context': 'https://schema.org',
        '@type': ['LocalBusiness', 'ProfessionalService'],
        '@id': `https://wlasniewski.pl/${data.slug}#business`,
        name: 'Przemysław Właśniewski — Fotograf',
        description: data.metaDescription,
        image: `https://wlasniewski.pl${data.heroImage}`,
        telephone: '+48530788694',
        url: `https://wlasniewski.pl/${data.slug}`,
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Płużnica 47G',
            postalCode: '87-214',
            addressLocality: 'Płużnica',
            addressRegion: data.region,
            addressCountry: 'PL',
        },
        areaServed: { '@type': 'City', name: data.city },
        priceRange: '$',
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: `Usługi fotograficzne — ${data.city}`,
            itemListElement: data.services.map(s => ({
                '@type': 'Offer',
                itemOffered: {
                    '@type': 'Service',
                    name: s.name,
                    description: s.description,
                },
            })),
        },
        sameAs: [
            'https://www.facebook.com/przemyslaw.wlasniewski.fotografia',
            'https://www.instagram.com/wlasniewski.pl/',
        ],
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

    return (
        <main className="min-h-screen bg-[#f4f1eb] text-[#25221f] selection:bg-[#b6a894] selection:text-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
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
                            <h1 className="font-display text-5xl font-medium leading-[0.98] tracking-[-0.025em] text-[#201e1b] sm:text-6xl xl:text-7xl">
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
                                    className="inline-flex items-center justify-center rounded-full bg-[#292622] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#11100f]"
                                >
                                    Zobacz pakiety i terminy
                                </Link>
                                <Link
                                    href="/portfolio"
                                    className="inline-flex items-center justify-center rounded-full border border-[#a9a095] px-7 py-3.5 text-sm font-semibold text-[#292622] transition hover:border-[#292622]"
                                >
                                    Obejrzyj fotografie
                                </Link>
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
                            src={data.heroImage}
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
                            <h2 className="mt-4 font-display text-4xl font-medium leading-tight text-[#25221f] md:text-5xl">
                                Wybierz zakres, który pasuje do Waszego dnia
                            </h2>
                            <p className="mt-6 max-w-md leading-relaxed text-[#6c655d]">
                                Cena, czas fotografowania i liczba gotowych zdjęć są widoczne przed rezerwacją. Bez ukrytych etapów i ogólnej wyceny „od”.
                            </p>
                        </div>
                        <div className="grid gap-px overflow-hidden rounded-2xl border border-[#d7d0c6] bg-[#d7d0c6] md:grid-cols-3">
                            {[
                                { title: 'Sesja rodzinna', price: 'od 750 zł', service: 'Sesja', text: 'Rodzina, para, dzieci albo kilka pokoleń.' },
                                { title: 'Ślub', price: 'od 1900 zł', service: 'Ślub', text: 'Ceremonia cywilna, kościelna lub pełny reportaż.' },
                                { title: 'Przyjęcie', price: 'od 1100 zł', service: 'Urodziny', text: 'Urodziny, rocznica i rodzinne spotkanie.' },
                            ].map((item, index) => (
                                <Link
                                    key={item.title}
                                    href={`/rezerwacja?source=city-funnel&city=${encodeURIComponent(data.city)}&service=${encodeURIComponent(item.service)}`}
                                    className="group flex min-h-64 flex-col bg-[#faf8f4] p-7 transition hover:bg-white"
                                >
                                    <span className="text-xs tracking-[0.2em] text-[#918577]">0{index + 1}</span>
                                    <h3 className="mt-8 font-display text-2xl font-medium">{item.title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed text-[#716a62]">{item.text}</p>
                                    <div className="mt-auto flex items-end justify-between gap-3 pt-8">
                                        <span className="font-semibold text-[#413c36]">{item.price}</span>
                                        <span className="text-[#8d7f6d] transition group-hover:translate-x-1" aria-hidden="true">→</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-y border-[#d9d2c8] bg-[#e9e4dc] px-6 py-20 sm:px-10 lg:py-28">
                <div className="mx-auto max-w-6xl">
                    <div className="grid gap-px overflow-hidden rounded-2xl border border-[#d2cbc1] bg-[#d2cbc1] lg:grid-cols-3">
                        {data.sections.map((section, index) => (
                            <article key={section.title} className="bg-[#f7f4ef] p-8 md:p-10">
                                <span className="text-xs tracking-[0.22em] text-[#948777]">0{index + 1}</span>
                                <h2 className="mt-6 font-display text-3xl font-medium leading-tight text-[#26231f]">
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
                        <h2 className="mt-4 font-display text-4xl font-medium md:text-5xl">Fotografuję ludzi, nie schematy</h2>
                        <p className="mt-5 leading-relaxed text-[#6c655d]">Każde spotkanie ma inny rytm. Zakres ustalamy jasno, a sposób pracy dopasowuję do Was i miejsca.</p>
                    </div>
                    <div className="mt-14 grid gap-5 md:grid-cols-2">
                        {data.services.map((service, index) => (
                            <article key={service.name} className="rounded-2xl border border-[#d8d1c7] bg-[#fbfaf7] p-7 md:p-8">
                                <span className="text-xs tracking-[0.2em] text-[#948777]">0{index + 1}</span>
                                <h3 className="mt-5 font-display text-2xl font-medium">{service.name}</h3>
                                <p className="mt-3 leading-relaxed text-[#6c655d]">{service.description}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="border-y border-[#d9d2c8] bg-white/55 px-6 py-20 sm:px-10 lg:py-28">
                <div className="mx-auto max-w-4xl">
                    <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-[#8d7f6d]">Przed rezerwacją</p>
                    <h2 className="mt-4 text-center font-display text-4xl font-medium md:text-5xl">Pytania, które pojawiają się najczęściej</h2>
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

            <section className="bg-[#26231f] px-6 py-20 text-[#f7f4ef] sm:px-10 lg:py-28">
                <div className="mx-auto max-w-5xl text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c4b8a8]">Następny krok</p>
                    <h2 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-medium leading-tight md:text-6xl">
                        Zobaczcie zakres, cenę i wybierzcie termin
                    </h2>
                    <p className="mx-auto mt-6 max-w-2xl leading-relaxed text-[#cfc8bf]">
                        Jeśli przed wyborem chcecie o coś zapytać, zadzwońcie albo napiszcie. Odpowiem konkretnie i pomogę dobrać zakres.
                    </p>
                    <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link
                            href={`/rezerwacja?source=city-end&city=${encodeURIComponent(data.city)}&service=Sesja`}
                            className="rounded-full bg-[#eee8de] px-8 py-4 text-sm font-semibold text-[#26231f] transition hover:bg-white"
                        >
                            Pakiety i wolne terminy
                        </Link>
                        <Link
                            href="/kontakt"
                            className="rounded-full border border-white/30 px-8 py-4 text-sm font-semibold text-white transition hover:border-white/70"
                        >
                            Napisz do mnie
                        </Link>
                    </div>
                    <a href="tel:+48530788694" className="mt-8 inline-block text-sm text-[#cfc8bf] hover:text-white">+48 530 788 694</a>
                </div>
            </section>

            <section className="border-t border-[#d9d2c8] px-6 py-14 sm:px-10">
                <div className="mx-auto max-w-5xl">
                    <h2 className="text-center font-display text-2xl font-medium">Fotografuję również w pobliżu</h2>
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
