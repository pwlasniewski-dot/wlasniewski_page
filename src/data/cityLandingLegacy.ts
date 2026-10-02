// Historical city copy retained for recovery. Commercial promises here are not rendered.
export interface CityInfo {
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

export const LEGACY_CITY_CONTENT: Record<string, CityInfo> = {
    torun: {
        slug: 'fotograf-torun',
        city: 'Toruń',
        region: 'kujawsko-pomorskie',
        h1: 'Fotograf w Toruniu — sesje rodzinne i śluby',
        metaTitle: 'Sesje zdjęciowe w Toruniu — oferta i miejsca | Wlasniewski.pl',
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

