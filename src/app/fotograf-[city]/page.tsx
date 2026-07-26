import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import CityLeadSection from '@/components/CityLeadSection';

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
        h1: 'Fotograf Toruń — naturalne sesje rodzinne i plenerowe',
        metaTitle: 'Fotograf Toruń ⭐ Wizerunek, Biznes, Starówka, Ślub',
        metaDescription: '★ Fotograf Toruń ★ Sesje wizerunkowe i biznesowe od 450 zł, śluby plenerowe, sesje na starówce. Naturalne portrety, galeria online. ☎ 530 788 694',
        keywords: ['fotograf toruń', 'fotografia wizerunkowa toruń', 'fotograf portretowy toruń', 'fotograf toruń starówka', 'profesjonalna fotografia toruń', 'fotograf ślubny toruń', 'fotografia ślubna toruń', 'sesja zdjęciowa toruń', 'fotografia biznesowa toruń', 'sesja narzeczeńska toruń', 'sesja rodzinna toruń', 'plener ślubny toruń', 'zdjęcia biznesowe toruń', 'sesja w mieście toruń', 'fotograf bulwar filadelfijski'],
        heroImage: '/assets/portfolio/family/sesja-rodzinna-torun-plener-07.webp',
        lat: 53.0138,
        lng: 18.5984,
        intro: [
            'Nazywam się Przemek i pracuję jako fotograf w Toruniu. Lubię, gdy zdjęcia są prawdziwe i naturalne. Stawiam na pełną swobodę i często daję Wam możliwość tworzenia własnych pomysłów. Jako fotograf w Toruniu znam miejsca, które pięknie grają z naturalnym światłem i jednocześnie oddają zamierzony efekt na moich zdjęciach.',
            'Pokrótce opiszę, jak przebiega spotkanie. Po pierwszym kontakcie telefonicznym, mailowym bądź przez WhatsApp i podjęciu decyzji o realizacji sesji umawiamy się na kawę. Przedstawiam i nakreślam, jak będzie przebiegało nasze spotkanie. Dzięki temu atmosfera na sesji w Toruniu jest zawsze swobodna.',
        ],
        sections: [
            {
                title: 'Przygotowanie do sesji w Toruniu',
                icon: '🎨',
                paragraphs: [
                    'Przed sesją umawiam się na kawę. Zanim jednak się spotkamy, zachęcam do zapoznania się z moją stroną — tam opisuję, jak najlepiej przygotować się do sesji fotograficznej w Toruniu.',
                    'Ubrania? W Toruniu świetnie sprawdzają się beże, błękity i zgaszone brązy — kolory korespondujące z cegłą i piaskowcem starówki. Proszę unikać dużych logotypów i krzykliwych wzorów.',
                    'Gdy umawiamy sesję zdjęciową w Toruniu, proszę też o dwie rzeczy: wygodne buty i odrobinę luzu. Planujemy małe przerwy, jeżeli sesja trwa dłużej niż godzinę.',
                ],
            },
            {
                title: 'Najlepsze miejsca na sesję zdjęciową w Toruniu',
                icon: '📍',
                paragraphs: [
                    'Nawiązując do realiów z wykonanej sesji w Toruniu z rodziną — nasza sesja rozpoczęła się od kawy w restauracji Manekin. Podczas rozmowy wpadłem na pomysł, by zrobić kilka zdjęć w ogródku.',
                    'Następnie ruszyliśmy na Starówkę Torunia — ceglane mury i charakterystyczne uliczki dodają urok kadrom. Potem krótki spacer pod Zamek Krzyżacki w Toruniu. Ulice Rynek Staromiejski, Ciasna i Świętego Jana stały się tłem wykorzystanym w naszej sesji.',
                    'Na koniec Bulwar Filadelfijski i most w Toruniu — szerokie oraz wąskie kadry nad wodą. Zwykle umawiam się na porę złotej godziny, gdy światło jest najbardziej ciepłe i filmowe. Park Miejski to kolejne świetne miejsce na sesje rodzinne i narzeczeńskie w Toruniu.',
                ],
            },
            {
                title: 'Jak prowadzę sesje fotograficzne',
                icon: '📷',
                paragraphs: [
                    'Działam reportażowo. Nie ustawiam na siłę, ale zależy mi na Waszym uśmiechu — to podstawa sesji rodzinnej w Toruniu. W sesjach portretowych ważne są spojrzenia: głębokie, zanurzone w dal, przenikliwe, delikatne.',
                    'Spaceruję z Wami i podsuwam krótkie pomysły: łapiemy się za ręce, obejmujemy, śpiewamy, patrzymy się na siebie — albo nie. Z dziećmi robię mikrozadania: biegi do latarni, zabawy w ciepłe i zimne mury, liczenie czerwonych drzwi.',
                    'Dorosłym zostawiam spokojne momenty: zatrzymanie się w ciekawym świetle przy murze, kilka kroków wzdłuż ściany, rozmowa. Jeśli jest wiatr — wykorzystujemy go. Każda sesja zdjęciowa w Toruniu to szukanie prawdziwych emocji.',
                ],
            },
            {
                title: 'Co dostajesz po sesji',
                icon: '🖼️',
                paragraphs: [
                    'W wersji miejskiej oddaję minimum 20 zdjęć po autorskiej obróbce, galerię online oraz eleganckie pudełko na zdjęcia. Odbitki wykonuję w nPhoto — profesjonalny papier i powtarzalna jakość.',
                    'Realizacja trwa zwykle do 10 dni roboczych. Jeśli planujecie większy zestaw lub album — doradzę i zaproponuję odpowiedni format. Każdy klient z Torunia i okolic otrzymuje też podgląd wybranych ujęć przed ostateczną selekcją.',
                ],
            },
        ],
        services: [
            { name: 'Sesja rodzinna w Toruniu', description: 'Naturalne zdjęcia rodzinne na starówce, w parku lub dowolnej lokalizacji w Toruniu. Plener lub studio.' },
            { name: 'Fotografia ślubna Toruń', description: 'Kompleksowa obsługa fotograficzna ślubu i wesela. Reportaż + sesja plenerowa.' },
            { name: 'Sesja portretowa i wizerunkowa', description: 'Profesjonalne portrety biznesowe, wizerunkowe i artystyczne w klimatycznych lokalizacjach Torunia.' },
            { name: 'Fotografia komunijna Toruń', description: 'Pamiątkowe zdjęcia z Pierwszej Komunii Świętej — kościół, plener i portret.' },
            { name: 'Sesja narzeczeńska', description: 'Romantyczne zdjęcia par na toruńskiej starówce, bulwarze lub w plenerze.' },
            { name: 'Zdjęcia z drona', description: 'Ujęcia z lotu ptaka na Twój ślub, event lub sesję z widokiem na panoramę Torunia.' },
        ],
        faqs: [
            { question: 'Ile kosztuje sesja zdjęciowa w Toruniu?', answer: 'Ceny sesji zdjęciowych w Toruniu zaczynają się od 400 zł za sesję indywidualną/portretową. Sesje rodzinne i narzeczeńskie od 500 zł. Fotografia ślubna — wycena indywidualna po ustaleniu zakresu. W każdym pakiecie: przygotowanie, prowadzenie, selekcja, obróbka i galeria online.' },
            { question: 'Gdzie najlepiej zrobić sesję zdjęciową w Toruniu?', answer: 'Najpiękniejsze lokalizacje na sesję w Toruniu to: Starówka (Rynek Staromiejski, ul. Ciasna, Zamek Krzyżacki), Bulwar Filadelfijski nad Wisłą, Park Miejski, Bydgoskie Przedmieście, Fort IV i okolice mostu drogowego. Pomagam dobrać miejsce pod styl sesji.' },
            { question: 'Jak się przygotować do sesji fotograficznej?', answer: 'Najlepiej ubrać się w spójne, stonowane kolory (beże, błękity, brązy) bez dużych logotypów. W Toruniu świetnie grają kolory pasujące do cegły. Polecam wygodne buty i luz — resztą kieruję ja. Szczegóły na stronie „Jak się ubrać".' },
            { question: 'Ile trwa sesja zdjęciowa?', answer: 'Standardowa sesja rodzinna lub portretowa trwa 1-1,5 godziny. Sesja narzeczeńska 1-2 godziny. Reportaż ślubny — od przygotowań do pierwszego tańca (8-12 godzin). Zawsze planujemy przerwy, zwłaszcza z dziećmi.' },
            { question: 'Kiedy dostanę gotowe zdjęcia?', answer: 'Galerię online z gotowymi zdjęciami po obróbce wysyłam do 10 dni roboczych od sesji. Przy większych projektach (ślub, album) termin ustalamy indywidualnie. Każdy klient dostaje podgląd wybranych ujęć.' },
            { question: 'Czy dojeżdżasz do Torunia? Ile to kosztuje?', answer: 'Tak, regularnie dojeżdżam do Torunia — w ramach większych pakietów dojazd jest w cenie. Baza wypadowa to okolice Płużnicy/Wąbrzeźna, więc Toruń jest bardzo blisko.' },
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
            addressLocality: data.city,
            addressRegion: data.region,
            addressCountry: 'PL',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: data.lat,
            longitude: data.lng,
        },
        areaServed: { '@type': 'City', name: data.city },
        priceRange: '$$',
        openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            opens: '08:00',
            closes: '20:00',
        },
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
        <main className="min-h-screen bg-zinc-950 text-white">
            {/* Structured Data */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

            {/* Hero */}
            <section className="relative min-h-[60vh] flex items-end overflow-hidden">
                <div className="absolute inset-0">
                    <Image
                        src={data.heroImage}
                        alt={data.h1}
                        fill
                        className="object-cover"
                        priority
                        sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
                </div>
                <div className="relative z-10 container mx-auto px-6 pb-16 pt-32">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm text-zinc-400 mb-6" aria-label="Breadcrumb">
                        <Link href="/" className="hover:text-amber-400 transition-colors">Strona główna</Link>
                        <span>/</span>
                        <span className="text-amber-400">Fotograf {data.city}</span>
                    </nav>
                    <h1 className="text-4xl md:text-6xl font-bold font-display leading-tight max-w-4xl">
                        {data.h1}
                    </h1>
                    <p className="mt-4 text-xl text-zinc-300 max-w-2xl">
                        Profesjonalna fotografia rodzinna, ślubna i portretowa w {data.city === 'Płużnica' ? 'Płużnicy' : data.city === 'Bydgoszcz' ? 'Bydgoszczy' : data.city === 'Lisewo' ? 'Lisewie' : data.city === 'Wąbrzeźno' ? 'Wąbrzeźnie' : data.city === 'Chełmno' ? 'Chełmnie' : data.city === 'Świecie' ? 'Świeciu' : data.city === 'Grudziądz' ? 'Grudziądzu' : `${data.city}u`} i okolicach
                    </p>
                    <div className="flex flex-wrap gap-4 mt-8">
                        <Link href={`/rezerwacja?source=city&city=${encodeURIComponent(data.city)}&service=Sesja`} className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-8 rounded-lg transition-colors text-lg shadow-lg shadow-amber-500/20">
                            Sprawdź pakiety i wolne terminy
                        </Link>
                        <a href="tel:+48530788694" className="border border-amber-400/40 hover:border-amber-400 text-amber-100 font-medium py-3 px-8 rounded-lg transition-colors text-lg inline-flex items-center gap-2">
                            <span>📞</span> 530 788 694
                        </a>
                        <Link href="/portfolio" className="border border-white/30 hover:border-white/60 text-white font-medium py-3 px-8 rounded-lg transition-colors text-lg">
                            Zobacz portfolio
                        </Link>
                    </div>
                </div>
            </section>

            {/* Intro */}
            <section className="py-20 px-6">
                <div className="container mx-auto max-w-4xl">
                    {data.intro.map((p, i) => (
                        <p key={i} className="text-lg text-zinc-300 leading-relaxed mb-6">
                            {p}
                        </p>
                    ))}
                </div>
            </section>

            {/* Content Sections */}
            {data.sections.map((section, idx) => (
                <section key={idx} className={`py-16 px-6 ${idx % 2 === 0 ? 'bg-zinc-900/50' : ''}`}>
                    <div className="container mx-auto max-w-4xl">
                        <h2 className="text-3xl font-bold font-display mb-8 flex items-center gap-3">
                            <span className="text-2xl">{section.icon}</span>
                            {section.title}
                        </h2>
                        {section.paragraphs.map((p, i) => (
                            <p key={i} className="text-lg text-zinc-300 leading-relaxed mb-5">
                                {p}
                            </p>
                        ))}
                    </div>
                </section>
            ))}

            {/* Services */}
            <section className="py-20 px-6 bg-zinc-900/80">
                <div className="container mx-auto max-w-5xl">
                    <h2 className="text-3xl font-bold font-display mb-12 text-center">
                        Usługi fotograficzne — {data.city}
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.services.map((svc, i) => (
                            <div key={i} className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-6 hover:border-amber-500/30 transition-all">
                                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">{svc.name}</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">{svc.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 px-6">
                <div className="container mx-auto max-w-4xl">
                    <h2 className="text-3xl font-bold font-display mb-12 text-center">
                        Najczęściej zadawane pytania — Fotograf {data.city}
                    </h2>
                    <div className="space-y-4">
                        {data.faqs.map((faq, i) => (
                            <details key={i} className="group bg-zinc-900/60 border border-zinc-700/50 rounded-xl overflow-hidden">
                                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-lg font-medium text-white hover:text-amber-400 transition-colors">
                                    <span>{faq.question}</span>
                                    <svg className="w-5 h-5 text-zinc-500 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </summary>
                                <div className="px-6 pb-5 text-zinc-400 leading-relaxed">
                                    {faq.answer}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* Lead Form — najważniejsza sekcja konwersyjna z REALNYM social proof */}
            <CityLeadSection city={data.city} citySlug={data.slug.replace('fotograf-', '')} />

            {/* CTA */}
            <section className="py-20 px-6 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border-t border-white/5">
                <div className="container mx-auto text-center max-w-3xl">
                    <h2 className="text-4xl font-bold font-display mb-6">
                        Gotowy na sesję w <span className="text-amber-400">{data.city === 'Płużnica' ? 'Płużnicy' : data.city === 'Bydgoszcz' ? 'Bydgoszczy' : data.city === 'Lisewo' ? 'Lisewie' : data.city === 'Wąbrzeźno' ? 'Wąbrzeźnie' : data.city === 'Chełmno' ? 'Chełmnie' : data.city === 'Świecie' ? 'Świeciu' : data.city === 'Grudziądz' ? 'Grudziądzu' : `${data.city}u`}</span>?
                    </h2>
                    <p className="text-xl text-zinc-400 mb-10">
                        Napisz do mnie i umówmy się na kameralną sesję pełną naturalnych emocji.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link href={`/rezerwacja?source=city&city=${encodeURIComponent(data.city)}&service=Sesja`} className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 px-10 rounded-xl transition-colors text-lg">
                            Zobacz ceny i wolne terminy
                        </Link>
                        <Link href="/kontakt" className="border border-white/30 hover:border-white/60 text-white font-medium py-4 px-10 rounded-xl transition-colors text-lg">
                            Kontakt
                        </Link>
                    </div>
                    <p className="mt-6 text-zinc-500 text-sm">
                        tel. <a href="tel:+48530788694" className="text-amber-400 hover:underline">+48 530 788 694</a> · 
                        Dostępny 7 dni w tygodniu
                    </p>
                </div>
            </section>

            <Link
                href={`/rezerwacja?source=city-mobile&city=${encodeURIComponent(data.city)}&service=Sesja`}
                className="fixed bottom-4 left-4 right-4 z-40 rounded-xl bg-amber-500 px-5 py-4 text-center font-bold text-black shadow-2xl shadow-black/50 md:hidden"
            >
                Sprawdź cenę i wolny termin
            </Link>

            {/* Nearby Cities Cross-links */}
            <section className="py-16 px-6 border-t border-zinc-800">
                <div className="container mx-auto max-w-4xl">
                    <h2 className="text-2xl font-bold font-display mb-8 text-center">
                        Fotograf w okolicach — dojeżdżam także do:
                    </h2>
                    <div className="flex flex-wrap justify-center gap-3">
                        {data.nearbyLinks.map((link, i) => (
                            <Link
                                key={i}
                                href={link.href}
                                className="bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-amber-500/30 px-5 py-3 rounded-full text-sm font-medium transition-all"
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


