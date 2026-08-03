const productionImage = (source: string, width = 1920) =>
    `https://wlasniewski.pl/_next/image?url=${encodeURIComponent(source)}&w=${width}&q=82`;

/**
 * Snapshot of the published homepage content captured on 2026-08-03.
 *
 * This is used only when the CMS/database is unavailable (for example in the
 * local director preview). In production, the editable `home_sections` value
 * from the admin panel always wins.
 */
export const HOMEPAGE_PRODUCTION_FALLBACK_SECTIONS = [
    {
        id: 'production-magazine-intro',
        type: 'magazine_layout',
        label: 'Artystyczne spojrzenie',
        enabled: true,
        backgroundColor: 'white',
        data: {
            title: 'Rodzinne sesje fotograficzne w Toruniu i okolicach',
            subtitle: 'Artystyczne spojrzenie',
            image: productionImage('https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/1766353851265-fotograf-rodzinny-torun-04.webp'),
            secondaryImage: productionImage('https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/1766741104187-złodziejewo-01.10.25-28.webp', 960),
            layout: 'right',
            content: `
                <h2>Szukasz kogoś, kto zrozumie Twój spokój, Twoją energię i utrwali to, co ulotne w sposób artystyczny?</h2>
                <h3>Mój styl: autentyczność i emocje</h3>
                <p>Mój aparat to tylko narzędzie. Podczas spotkania szukam Was — Waszych emocji, tych zupełnie naturalnych. Jestem przeciwnikiem ustawiania wszystkich w rzędzie; robię to tylko wtedy, gdy sytuacja naprawdę tego wymaga. Wolę być obserwatorem, niemal niewidocznym cieniem, który nie rozprasza, ale czujnie czeka na ten jeden moment, w którym emocje sięgają zenitu.</p>
                <h3>Co mogę dla Ciebie zrobić?</h3>
                <p>Moja oferta to cztery główne filary, w których czuję się najlepiej i w których mogę dać Ci najwięcej wartości:</p>
                <ul>
                    <li><strong>Portrety z duszą</strong> — sesje wizerunkowe i artystyczne, które pokazują, kim naprawdę jesteś, a nie tylko jak wyglądasz. To spotkanie z Twoją autentycznością.</li>
                    <li><strong>Reportaż rodzinny i komunijny</strong> — zapisuję Waszą bliskość bez ustawiania wszystkich w rzędzie. Skupiam się na detalach, uściskach i spojrzeniach „pomiędzy”.</li>
                    <li><strong>Reportaż ślubny i uroczystości</strong> — od intymnego „tak” po huczne urodziny i jubileusze. Zatrzymuję energię Waszych najważniejszych dni, dbając o autentyczność każdej sekundy.</li>
                    <li><strong>Sesje lifestyle</strong> — w Waszym domu lub w ulubionym miejscu w Toruniu i okolicach. Tam, gdzie czujecie się wolni, a ja mogę być tylko cichym obserwatorem Waszej codzienności.</li>
                </ul>
                <blockquote><strong>Zasada jest prosta:</strong> ja dostarczam artystyczne spojrzenie, Ty dostarczasz siebie. Razem tworzymy pamiątkę, która z każdym rokiem będzie nabierać większej wartości.</blockquote>
                <p><strong>Stwórzmy coś, co zostanie z Tobą na zawsze.</strong> <a href="/kontakt">Napisz do mnie</a> i opowiedz, jaką historię mamy dzisiaj zapisać.</p>
            `,
        },
    },
    {
        id: 'production-magazine-story',
        type: 'magazine_layout',
        label: 'Historia',
        enabled: true,
        backgroundColor: 'white',
        data: {
            title: 'Sesja rodzinna Toruń, Grudziądz, Chełmno — naturalna fotografia',
            subtitle: 'Historia',
            image: productionImage('https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/1766741106671-złodziejewo-01.10.25-29.webp'),
            secondaryImage: productionImage('https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/1766742314174-img_4346.webp', 960),
            layout: 'left',
            content: `
                <p>Miejsca, w których lubię spędzać czas z moimi klientami, to plener, las, teren nad jeziorem czy stare zapomniane budynki, gdy słońce zaczyna powoli wschodzić lub zachodzić. Wierzę, że najpiękniejsze rzeczy dzieją się wtedy, kiedy czujemy, że jesteśmy obecni, a dana chwila sprawia nam przyjemność.</p>
                <h3>Dlaczego plener?</h3>
                <p>Bo tam oddychasz inaczej. Brak czterech ścian daje wolność, której nie da się wyreżyserować. Lubię, gdy wiatr targa włosy, a naturalne światło rysuje na twarzy dokładnie to, co czujesz w danej chwili. Każda ulica i każda ścieżka to inna opowieść — Wasza, nie moja.</p>
                <h3>Co chcę Ci podarować</h3>
                <ul>
                    <li><strong>Spokój.</strong> Sesja to nie zadanie do wykonania. To spacer, krótka rozmowa, chwila zatrzymania. Chcę, żebyś czuł się swobodnie, bez presji „dobrego wyglądu”.</li>
                    <li><strong>Uważność.</strong> Szukam drobnych gestów, spojrzeń i uśmiechów, które trwają ułamek sekundy. To one budują prawdziwy storytelling, a nie ustawiane pozy.</li>
                    <li><strong>Naturalność.</strong> Moja obróbka jest dyskretna. Chcę podkreślić charakter miejsca i Twoją osobowość, zachowując prawdę o tym, jak wyglądał ten dzień.</li>
                    <li><strong>Pamiątkę, która dojrzewa.</strong> Dobre zdjęcie to takie, na które patrzysz po latach i pamiętasz nie tylko to, jak wyglądałeś, ale przede wszystkim — jak się wtedy czułeś.</li>
                </ul>
                <p><strong>Poznaj historię, w której emocje mają znaczenie — Toruń i okolice.</strong></p>
            `,
        },
    },
    {
        id: 'production-testimonials',
        type: 'testimonials',
        label: 'Opinie',
        enabled: true,
        data: { title: 'Co mówią klienci', subtitle: 'Poznaj opinie' },
    },
    {
        id: 'production-communion',
        type: 'narrative_text',
        label: 'Fotografia komunijna',
        enabled: true,
        backgroundColor: 'white',
        data: {
            title: 'Naturalna fotografia komunijna w Toruniu i okolicach',
            subtitle: 'Spokojny reportaż rodzinnej uroczystości',
            dropCap: true,
            content: `
                <p>Dzień Pierwszej Komunii Świętej to dla wielu rodzin czas pełen emocji, ale też sporego zamieszania. Jako fotograf wierzę, że moją rolą jest wprowadzenie w ten dzień odrobiny spokoju. Zamiast reżyserowanych uśmiechów i stresujących ustawień oferuję Wam uważność i reportażowe podejście, które pozwala uchwycić to, co najważniejsze — bliskość, dumę i radość Waszego dziecka.</p>
                <p>Pracuję głównie na terenie Torunia, Grudziądza oraz w całym województwie kujawsko-pomorskim. Moim celem jest stworzenie pamiątki, która za dziesięć czy dwadzieścia lat przypomni Wam nie tylko to, jak wyglądaliście, ale przede wszystkim atmosferę tamtych chwil.</p>
                <h3>Dlaczego warto postawić na reportaż?</h3>
                <p>Wiem, że dzieci najlepiej czują się wtedy, gdy mogą być po prostu sobą. Dlatego podczas uroczystości i przyjęć komunijnych staram się być niemal niewidoczny. Dzięki temu na zdjęciach udaje mi się zamknąć najbardziej autentyczne momenty: szept z babcią, śmiech z kuzynostwem czy chwilę zadumy w kościelnej ławce.</p>
                <p>Szczególną wagę przykładam do detalu i naturalnego światła. Niezależnie od tego, czy planujecie kameralny obiad w domu, czy większe przyjęcie, dbam o to, by każda fotografia była estetyczna i pełna klasy.</p>
                <h3>Zapraszam do mojego świata</h3>
                <p>Jeśli szukacie fotografa, który z szacunkiem i spokojem podejdzie do Waszej rodzinnej uroczystości, <a href="/portfolio/Komunia">zobaczcie moje portfolio fotograficzne</a>. Będzie mi miło, jeśli to właśnie mnie zaprosicie do uwiecznienia tego ważnego dnia w Waszej rodzinie.</p>
            `,
        },
    },
    {
        id: 'production-stories',
        type: 'stories_grid',
        label: 'Siatka historii',
        enabled: true,
        backgroundColor: 'white',
        data: {
            title: 'Wybierzcie swoją historię',
            subtitle: 'Zobacz reportaże',
            stories_items: [
                { id: 'story-family', title: 'Historia Agi i Kai', image: productionImage('https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/1768170419622-dsc01449-edit.webp', 1200), link: '/sesja-rodzinna', category: 'Reportaż' },
                { id: 'story-communion', title: 'Pierwsza Komunia Święta', image: productionImage('https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/1768156697959-dsc00033.webp', 1200), link: '/nwk', category: 'Reportaż' },
                { id: 'story-torun', title: 'Sesja rodzinna w Toruniu', image: productionImage('https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/1766740519103-hero1.webp', 1200), link: '/fotograf-torun', category: 'Reportaż' },
                { id: 'story-wedding', title: 'Ślubne inspiracje', image: productionImage('https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/1768731277788-dsc07248.webp', 1200), link: '/slub', category: 'Reportaż' },
                { id: 'story-forest', title: 'Zuzanna i Dominika na leśnym runie', image: productionImage('https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/1769355380325-20250322-1-2.webp', 1200), link: '/slub-na-lesnym-rudnie', category: 'Reportaż' },
                { id: 'story-birthday', title: 'Na różne okazje mam swój styl', image: productionImage('https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/1769357527878-ww-26.webp', 1200), link: '/twoje-urodziny', category: 'Reportaż' },
            ],
        },
    },
    {
        id: 'production-parallax',
        type: 'parallax',
        label: 'Parallax',
        enabled: true,
        backgroundColor: 'black',
        data: {
            image: 'https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/1766741064959-złodziejewo-01.10.25-11.webp',
            image_desktop: 'https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/1766741080002-złodziejewo-01.10.25-18.webp',
            image_mobile: 'https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/1766741084767-złodziejewo-01.10.25-20.webp',
            title: 'Cierpliwość, interpretacja, uwiecznienie chwili…',
            height: 'medium',
            floatingImage: true,
            parallaxSpeed: 0.35,
            imageOffset: 8,
            textOpacity: 1,
            textColor: '#FFFFFF',
            textAnimation: 'slide-up',
        },
    },
] as const;

export const HOMEPAGE_PRODUCTION_FALLBACK_TESTIMONIALS = [
    { id: -1, client_name: 'Agnieszka P', testimonial_text: 'Sympatyczna atmosfera na sesji zdjęciowej, a efekty przeszły nasze oczekiwania. Polecam z całego serduszka, jeśli chcecie mieć wspaniałe i przepiękne wspomnienia.', rating: 5, source: 'Google', photo_size: null, is_featured: true, client_photo: null },
    { id: -2, client_name: 'Rafał Zarzeczny', testimonial_text: 'Super zdjęcia. Polecam z przyjemnością.', rating: 5, source: 'Google', photo_size: null, is_featured: true, client_photo: null },
    { id: -3, client_name: 'Małgorzata Sosnowska', testimonial_text: 'Wielokrotnie Przemek swoim profesjonalnym okiem uwieczniał nasze wydarzenia wiejskie i moje uroczystości rodzinne. Jest profesjonalistą. Zdjęcia przepiękne. Polecam gorąco i jeszcze nie raz na pewno skorzystam.', rating: 5, source: 'Facebook', photo_size: null, is_featured: true, client_photo: null },
    { id: -4, client_name: 'Płużnicka Piątka', testimonial_text: 'Pan Przemek od trzech lat współpracuje z nami przy organizacji biegu, wykonując przecudowne zdjęcia. Polecamy!', rating: 5, source: 'Facebook', photo_size: null, is_featured: true, client_photo: null },
] as const;
