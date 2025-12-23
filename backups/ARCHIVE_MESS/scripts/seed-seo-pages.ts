
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const cityData = [
    {
        slug: 'fotograf-torun',
        title: 'Fotograf Toruń',
        subtitle: 'Naturalne sesje w sercu miasta i plenerze',
        tag: 'fotograf toruń',
        content: [
            "Toruń to dla mnie coś więcej niż tylko gotyk i pierniki. To miasto z duszą, gdzie każda uliczka Starówki kryje idealne tło do sesji narzeczeńskiej czy rodzinnej. Często pracuję na Bydgoskim Przedmieściu, w Parku Miejskim czy nad Wisłą, szukając miękkiego, złotego światła.",
            "Jako fotograf mieszkający niedaleko, znam Toruń od podszewki. Niezależnie czy planujesz kameralny ślub w Ratuszu Staromiejskim, czy luźną sesję rodzinną w plenerze – jestem do Twojej dyspozycji. Stawiam na autentyczność; wolę łapać Wasze prawdziwe uśmiechy niż ustawiać sztywne pozy.",
            "Dojeżdżam do Torunia bez dodatkowych kosztów w ramach większych pakietów. Zabieram ze sobą nie tylko aparat, ale też drona, dzięki któremu możemy spojrzeć na Waszą historię z zupełnie innej perspektywy."
        ],
        metaTitle: 'Fotograf Toruń | Naturalna Fotografia Ślubna i Rodzinna',
        metaDescription: 'Szukasz fotografa w Toruniu? Realizuję naturalne sesje rodzinne, portretowe i reportaże ślubne w Toruniu i okolicach. Zobacz moje portfolio i umów się na sesję.'
    },
    {
        slug: 'fotograf-grudziadz',
        title: 'Fotograf Grudziądz',
        subtitle: 'Spichlerze emocji – sesje nad Wisłą',
        tag: 'fotograf grudziądz',
        content: [
            "Grudziądz ze swoją panoramą spichlerzy to jedno z najbardziej fotogenicznych miejsc w naszym województwie. Uwielbiam realizować tu sesje o zachodzie słońca, gdy ceglane mury nabierają ciepłych barw.",
            "Jestem stąd – to znaczy z regionu (baza w Płużnicy), więc do Grudziądza mam rzut beretem. Często bywam na Górze Zamkowej czy w Parku Miejskim, realizując reportaże z chrztów i urodzin oraz luźne sesje par.",
            "Jeśli szukasz fotografa w Grudziądzu, który nie będzie Cię stresował „pozowaniem”, a raczej pójdzie z Tobą na spacer i przy okazji zrobi świetne zdjęcia – trafiłeś idealnie."
        ],
        metaTitle: 'Fotograf Grudziądz | Sesje nad Wisłą i Reportaże',
        metaDescription: 'Profesjonalny fotograf w Grudziądzu. Sesje rodzinne, brzuszkowe i ślubne z widokiem na spichlerze. Sprawdź ofertę i wolne terminy.'
    },
    {
        slug: 'fotograf-wabrzezno',
        title: 'Fotograf Wąbrzeźno',
        subtitle: 'Lokalne historie nad jeziorami',
        tag: 'fotograf wąbrzeźno',
        content: [
            "Mieszkam tuż obok, więc Wąbrzeźno to mój „domowy” teren. Jezioro Zamkowe i Frydek to klasyki, ale znam też mnóstwo ukrytych miejsc w okolicznych lasach i na polach, które idealnie nadają się na sesje brzuszkowe czy rodzinne.",
            "Działając lokalnie, jestem dostępny nierzadko „od ręki” na krótsze sesje. Fotografia w Wąbrzeźnie nie musi być nudna – pokażę Ci, jak wydobyć piękno z naszych codziennych okolic.",
            "Realizuję tu reportaże ślubne, osiemnastki i sesje komunijne, zawsze z pełnym zaangażowaniem i uśmiechem."
        ],
        metaTitle: 'Fotograf Wąbrzeźno | Sesje Rodzinne i Ślubne',
        metaDescription: 'Twój lokalny fotograf w Wąbrzeźnie. Naturalne zdjęcia nad jeziorem i w plenerze. Fotografia ślubna, rodzinna i okolicznościowa.'
    },
    {
        slug: 'fotograf-chelmno',
        title: 'Fotograf Chełmno',
        subtitle: 'Miasto Zakochanych w kadrze',
        tag: 'fotograf chełmno',
        content: [
            "Chełmno, miasto zakochanych – czy może być lepsze miejsce na sesję narzeczeńską lub ślubną? Urokliwy rynek, parki i panorama Wisły tworzą niesamowity klimat.",
            "Lubię wykorzystywać architekturę Chełmna jako tło do portretów, ale nie dominujące. Najważniejsi jesteście Wy i Wasze uczucia. Staram się łapać te ulotne momenty czułości, które w tym mieście wydają się jeszcze bardziej magiczne.",
            "Jestem u Was w kilkanaście minut, gotowy by uwiecznić Waszą historię."
        ],
        metaTitle: 'Fotograf Chełmno | Sesje Narzeczeńskie i Ślubne',
        metaDescription: 'Fotografia w Mieście Zakochanych. Realizuję romantyczne sesje par i profesjonalne reportaże ślubne w Chełmnie. Zapraszam!'
    },
    {
        slug: 'fotograf-lisewo',
        title: 'Fotograf Lisewo',
        subtitle: 'Blisko, naturalnie, swojsko',
        tag: 'fotograf lisewo',
        content: [
            "Lisewo i okolice to świetny wybór na spokojne sesje zdjęciowe z dala od miejskiego zgiełku. Często fotografuję tu rodziny, które cenią sobie prywatność i naturę.",
            "Dojeżdżam do Lisewa błyskawicznie. Niezależnie czy to chrzest w lokalnym kościele, czy sesja narzeczeńska na łące – jestem do dyspozycji."
        ],
        metaTitle: 'Fotograf Lisewo | Naturalne Sesje i Reportaże',
        metaDescription: 'Szukasz fotografa w Lisewie? Oferuję naturalne sesje rodzinne i reportaże z uroczystości. Dojazd w cenie!'
    },
    {
        slug: 'fotograf-bydgoszcz',
        title: 'Fotograf Bydgoszcz',
        subtitle: 'Wyspa Młyńska i miejski styl',
        tag: 'fotograf bydgoszcz',
        content: [
            "Choć z Płużnicy mam kawałek, Bydgoszcz odwiedzam z przyjemnością. Wyspa Młyńska, kanały i nowoczesna architektura Opery dają ogromne pole do popisu przy sesjach biznesowych i wizerunkowych.",
            "Realizuję w Bydgoszczy także duże reportaże ślubne. Miasto tętni życiem, a ja staram się to życie zamknąć w kadrach – dynamicznych, pełnych koloru i emocji."
        ],
        metaTitle: 'Fotograf Bydgoszcz | Fotografia Biznesowa i Ślubna',
        metaDescription: 'Profesjonalne sesje w Bydgoszczy. Reportaże ślubne i fotografia wizerunkowa. Zobacz moje prace i zarezerwuj termin.'
    }
];

async function seedSeoPages() {
    console.log('🌱 Seeding SEO Pages...');

    for (const city of cityData) {
        const sections = [
            {
                id: `hero-${city.slug}`,
                type: 'hero',
                enabled: true,
                data: {
                    title: city.title,
                    subtitle: city.subtitle,
                    tag: city.tag,
                    backgroundImage: '',
                    height: 'min-h-[60vh]'
                }
            },
            {
                id: `content-${city.slug}`,
                type: 'content',
                enabled: true,
                data: {
                    title: 'O mojej pracy w tym miejscu',
                    content: city.content.map(p => `<p>${p}</p>`).join('\n')
                }
            },
            {
                id: `cta-${city.slug}`,
                type: 'contact',
                enabled: true,
                data: {
                    title: 'Zarezerwuj swoją sesję',
                    subtitle: 'Skontaktuj się ze mną, aby omówić szczegóły Twojej wymarzonej sesji.',
                    buttonText: 'Przejdź do rezerwacji',
                    buttonLink: '/rezerwacja'
                }
            }
        ];

        try {
            await prisma.page.upsert({
                where: { slug: city.slug },
                update: {
                    title: city.title,
                    meta_title: city.metaTitle,
                    meta_description: city.metaDescription,
                    is_published: true,
                    sections: JSON.stringify(sections),
                    content: city.content.join('\n\n')
                },
                create: {
                    slug: city.slug,
                    title: city.title,
                    meta_title: city.metaTitle,
                    meta_description: city.metaDescription,
                    is_published: true,
                    sections: JSON.stringify(sections),
                    content: city.content.join('\n\n')
                }
            });
            console.log(`✅ Seeded: ${city.slug}`);
        } catch (error: any) {
            console.error(`❌ Error seeding ${city.slug}:`, error.message);
        }
    }

    console.log('✨ SEO Pages Seeding Complete!');
}

seedSeoPages()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
