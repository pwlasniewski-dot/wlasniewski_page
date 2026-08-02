import type { Metadata } from 'next';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    ArrowRight,
    Check,
    ChevronRight,
    Clock3,
    Heart,
    MapPin,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';

const canonical = 'https://wlasniewski.pl/jak-sie-ubrac';
const updatedAt = '2026-08-01';

export const metadata: Metadata = {
    title: 'Jak się ubrać i pozować do sesji zdjęciowej? Poradnik',
    description: 'Kompletny poradnik fotografa: ubiór, kolory do miasta, natury i domu oraz naturalne pozowanie par, rodzin i dzieci. Checklista przed sesją.',
    keywords: [
        'jak się ubrać na sesję zdjęciową',
        'jak pozować do zdjęć',
        'co ubrać na sesję rodzinną',
        'kolory ubrań do sesji zdjęciowej',
        'jak pozować do sesji rodzinnej',
    ],
    alternates: { canonical },
    authors: [{ name: 'Przemysław Właśniewski', url: 'https://wlasniewski.pl/o-mnie' }],
    openGraph: {
        type: 'article',
        locale: 'pl_PL',
        url: canonical,
        title: 'Jak się ubrać i pozować do sesji zdjęciowej?',
        description: 'Praktyczny poradnik fotografa: strój, kolory, pozowanie i gotowe scenariusze na spokojną sesję.',
        publishedTime: '2026-08-01T08:00:00+02:00',
        modifiedTime: '2026-08-01T08:00:00+02:00',
        authors: ['Przemysław Właśniewski'],
        images: [{
            url: '/images/public-guide/hero-family-walk.webp',
            width: 1122,
            height: 1402,
            alt: 'Ilustracyjny przykład skoordynowanych ubrań rodziny na sesję zdjęciową',
        }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Jak się ubrać i pozować do sesji zdjęciowej?',
        description: 'Ubiór, kolory, pozowanie i checklista od fotografa.',
        images: ['/images/public-guide/hero-family-walk.webp'],
    },
};

const faq = [
    ['Czy na sesję trzeba kupować nowe ubrania?', 'Nie. Najlepszy zestaw zwykle da się zbudować z rzeczy, które już dobrze leżą i w których swobodnie się poruszasz. Nowy element ma sens tylko wtedy, gdy naprawdę będziesz go nosić.'],
    ['Czy wszyscy powinni ubrać się tak samo?', 'Nie. Wybierzcie wspólną paletę dwóch lub trzech kolorów i podobny poziom formalności. Dzięki temu wyglądacie spójnie, ale nadal naturalnie.'],
    ['Jakie kolory najlepiej wyglądają na zdjęciach?', 'Najłatwiejsze są spokojne, lekko zgaszone odcienie: beż, oliwka, granat, karmel, brudny róż czy błękit. Ostateczny wybór zależy od miejsca, światła i pory roku.'],
    ['Co zrobić, jeśli nie umiem pozować?', 'Nie musisz umieć. Zacznij od wygodnej pozycji, przenieś ciężar na jedną nogę, rozluźnij dłonie i wykonuj małe ruchy. Podczas sesji prowadzę krok po kroku.'],
    ['Jak przygotować dzieci?', 'Powiedz im, że idziecie na spacer albo wspólną zabawę. Zadbaj o sen, przekąskę, ubranie bez drapiących metek i zapasowy komplet. Nie ćwiczcie wcześniej uśmiechu.'],
    ['Co, jeśli pogoda lub miejsce zmienią się w ostatniej chwili?', 'Przygotuj jedną dodatkową warstwę i wygodne obuwie. Przed sesją potwierdzamy warunki oraz w razie potrzeby wybieramy plan zapasowy.'],
] as const;

const poseGallery = [
    ['piknik-na-trawie.webp', 'Piknik na trawie', 'Usiądźcie blisko, ale nie w równym szeregu. Rozmowa i drobne spojrzenia dają naturalniejszy efekt niż patrzenie cały czas w aparat.'],
    ['smiech-na-lawce.webp', 'Śmiech na ławce', 'Część rodziny może usiąść, a pozostali miękko domknąć kadr z boków. Najważniejsza jest wspólna reakcja.'],
    ['przy-stawie.webp', 'Przy stawie', 'Barierka daje dłoniom proste zadanie. Stańcie lekko po skosie i zostawcie między sobą trochę oddechu.'],
    ['przy-kwiatach.webp', 'Przy kwiatach', 'Jedna osoba może zainteresować się otoczeniem, a reszta spokojnie skupić uwagę na niej.'],
    ['ruch-na-polanie.webp', 'Ruch na polanie', 'Nie zatrzymujcie kroku idealnie w tym samym momencie. Swobodny ruch i reakcja na dziecko budują energię kadru.'],
    ['rozne-wysokosci.webp', 'Różne wysokości', 'Schodki, murek lub krawędź rabaty pomagają ustawić osoby na kilku poziomach i dodać zdjęciu głębi.'],
    ['miedzy-drzewami.webp', 'Między drzewami', 'Nie stójcie wszyscy w jednej linii. Drzewa naturalnie dzielą plan i pomagają stworzyć luźniejszą kompozycję.'],
    ['bliski-uscisk.webp', 'Bliski uścisk', 'Podejdźcie naprawdę blisko i oprzyjcie głowę lub dłoń o kogoś bliskiego. Po przytuleniu zostańcie tak jeszcze chwilę.'],
    ['z-psem.webp', 'Z psem', 'Zejdźcie do poziomu pupila i skupcie się na kontakcie z nim. Nie oczekujcie, że będzie idealnie patrzył w aparat.'],
    ['szeroki-kadr-z-otoczeniem.webp', 'Szeroki kadr z otoczeniem', 'Zostawcie wokół siebie przestrzeń i idźcie spokojnie. Taki kadr pokazuje również klimat miejsca.'],
] as const;

const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': ['Article', 'WebPage'],
            '@id': `${canonical}#article`,
            url: canonical,
            headline: 'Jak się ubrać i pozować do sesji zdjęciowej?',
            description: metadata.description,
            inLanguage: 'pl-PL',
            datePublished: updatedAt,
            dateModified: updatedAt,
            image: 'https://wlasniewski.pl/images/public-guide/hero-family-walk.webp',
            author: { '@id': 'https://wlasniewski.pl/o-mnie#author' },
            publisher: { '@id': 'https://wlasniewski.pl/#photographer' },
            mainEntityOfPage: canonical,
        },
        {
            '@type': 'Person',
            '@id': 'https://wlasniewski.pl/o-mnie#author',
            name: 'Przemysław Właśniewski',
            url: 'https://wlasniewski.pl/o-mnie',
            jobTitle: 'Fotograf',
        },
        {
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Start', item: 'https://wlasniewski.pl/' },
                { '@type': 'ListItem', position: 2, name: 'Jak się ubrać i pozować', item: canonical },
            ],
        },
        {
            '@type': 'FAQPage',
            mainEntity: faq.map(([question, answer]) => ({
                '@type': 'Question',
                name: question,
                acceptedAnswer: { '@type': 'Answer', text: answer },
            })),
        },
    ],
};

function Figure({ src, alt, caption, priority = false }: { src: string; alt: string; caption: string; priority?: boolean }) {
    return (
        <figure className="overflow-hidden rounded-[2rem] border border-stone-200 bg-[#f7f2e9] shadow-[0_24px_70px_rgba(40,30,20,0.08)]">
            <div className="relative aspect-[4/5]">
                <Image src={src} alt={alt} fill priority={priority} sizes="(max-width: 768px) 100vw, 42vw" className="object-contain" />
            </div>
            <figcaption className="border-t border-stone-200 bg-white px-5 py-4 text-sm leading-6 text-stone-600">{caption}</figcaption>
        </figure>
    );
}

function SectionHeading({ eyebrow, title, intro, dark = false }: { eyebrow: string; title: string; intro: string; dark?: boolean }) {
    return (
        <div className="max-w-3xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-amber-700">{eyebrow}</p>
            <h2 className={`font-playfair text-3xl font-semibold leading-tight md:text-5xl ${dark ? 'text-white' : 'text-stone-950'}`}>{title}</h2>
            <p className={`mt-5 text-lg leading-8 ${dark ? 'text-stone-300' : 'text-stone-600'}`}>{intro}</p>
        </div>
    );
}

export default function JakSieUbracPage() {
    return (
        <main className="bg-[#fbfaf7] text-stone-900">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <section className="relative overflow-hidden border-b border-stone-200 px-5 pb-16 pt-32 md:px-8 md:pb-24 md:pt-44">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(196,148,56,0.16),transparent_32%)]" aria-hidden="true" />
                <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.15fr_.85fr]">
                    <div>
                        <nav aria-label="Okruszki" className="mb-7 flex items-center gap-2 text-sm text-stone-500">
                            <Link href="/" className="underline-offset-4 hover:underline">Start</Link><ChevronRight size={14} aria-hidden="true" />
                            <span aria-current="page">Poradnik przed sesją</span>
                        </nav>
                        <p className="mb-5 text-xs font-bold uppercase tracking-[0.28em] text-amber-700">Poradnik fotografa · 12 minut czytania</p>
                        <h1 className="font-playfair text-4xl font-semibold leading-[1.08] text-stone-950 sm:text-6xl lg:text-7xl">
                            Jak się ubrać i&nbsp;pozować do sesji zdjęciowej?
                        </h1>
                        <p className="mt-7 max-w-2xl text-lg leading-8 text-stone-600 md:text-xl">
                            Bez sztywnego dress code’u i uczenia się póz. Dobierz strój do miejsca, przygotuj rodzinę i poznaj proste ruchy, dzięki którym na zdjęciach będziesz wyglądać jak Ty — tylko spokojniej.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link href="/rezerwacja" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-stone-950 px-7 py-3 font-semibold text-white transition hover:bg-amber-700">
                                Umów sesję <ArrowRight size={18} aria-hidden="true" />
                            </Link>
                            <a href="#odpowiedz" className="inline-flex min-h-12 items-center justify-center rounded-full border border-stone-300 bg-white px-7 py-3 font-semibold transition hover:border-stone-900">
                                Odpowiedź w 60 sekund
                            </a>
                        </div>
                        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-500">
                            <span className="inline-flex items-center gap-2"><Clock3 size={16} /> Aktualizacja: 1 sierpnia 2026</span>
                            <Link href="/o-mnie" className="underline-offset-4 hover:underline">Autor: Przemysław Właśniewski</Link>
                        </div>
                    </div>
                    <Figure src="/images/public-guide/hero-family-walk.webp" alt="Ilustracyjny przykład rodziny w skoordynowanych pastelowych ubraniach" caption="Ilustracja: ubrania nie są identyczne, ale łączy je spokojna paleta błękitu, beżu, pudrowego różu i szałwii." priority />
                </div>
            </section>

            <section id="odpowiedz" className="scroll-mt-28 px-5 py-16 md:px-8">
                <div className="mx-auto max-w-5xl rounded-[2rem] bg-stone-950 p-7 text-white md:p-12">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400">Odpowiedź w 60 sekund</p>
                    <h2 className="mt-3 font-playfair text-3xl font-semibold md:text-4xl">Co założyć i jak stanąć?</h2>
                    <div className="mt-7 grid gap-4 md:grid-cols-2">
                        {[
                            'Wybierz 2–3 współgrające kolory zamiast identycznych ubrań.',
                            'Postaw na dobre dopasowanie, miękkie warstwy i niewielkie wzory.',
                            'Dopasuj odcienie do tła: miasta, zieleni, wnętrza i pory roku.',
                            'Stań lekko bokiem, oprzyj ciężar na jednej nodze i rozluźnij dłonie.',
                            'W parze lub rodzinie szukajcie kontaktu i ruchu, nie równego szeregu.',
                            'Zabierz zapas dla dziecka, wodę, chusteczki i wygodne buty.',
                        ].map(item => <p key={item} className="flex gap-3 leading-7 text-stone-200"><Check className="mt-1 shrink-0 text-amber-400" size={18} />{item}</p>)}
                    </div>
                </div>
            </section>

            <article>
                <section className="px-5 py-16 md:px-8 md:py-24">
                    <div className="mx-auto max-w-7xl">
                        <SectionHeading eyebrow="01 · Ubiór" title="Zacznij od wygody, dopiero potem buduj styl" intro="Aparat szybko pokazuje, kiedy marynarka ciągnie, koszula się roluje albo buty zmieniają sposób chodzenia. Dobry strój pozwala usiąść, przytulić dziecko i zrobić kilka kroków bez ciągłego poprawiania." />
                        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-center">
                            <Figure src="/images/public-guide/coordinated-family-pastels.webp" alt="Ilustracyjny przykład spójnych pastelowych stylizacji całej rodziny" caption="Ilustracja: każda osoba ma inny zestaw, a wspólne jasne odcienie tworzą spokojną całość." />
                            <div className="grid gap-5 sm:grid-cols-2">
                                {[
                                    ['Najpierw baza', 'Gładka koszula, sukienka, spodnie lub dzianina w spokojnym kolorze dają najwięcej możliwości.'],
                                    ['Potem warstwa', 'Kardigan, marynarka, kamizelka lub szal dodają głębi i można je zdjąć w trakcie zdjęć.'],
                                    ['Wzór jako akcent', 'Jeden większy, spokojny wzór działa lepiej niż kilka drobnych deseni konkurujących ze sobą.'],
                                    ['Bez wielkich napisów', 'Logo i kontrastowe nadruki zabierają uwagę twarzom. Mały, dyskretny znak zwykle nie przeszkadza.'],
                                    ['Dobre proporcje', 'Zadbaj o długość rękawów i nogawek oraz o to, by kieszenie nie odstawały.'],
                                    ['Twoje ubranie', 'Nie przebieraj się za kogoś innego. Elegancję można zbudować także z prostego T-shirtu i dobrze skrojonych spodni.'],
                                ].map(([title, text]) => (
                                    <div key={title} className="rounded-3xl border border-stone-200 bg-white p-6">
                                        <h3 className="font-semibold text-stone-950">{title}</h3><p className="mt-2 leading-7 text-stone-600">{text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-[#f1ece3] px-5 py-16 md:px-8 md:py-24">
                    <div className="mx-auto max-w-7xl">
                        <SectionHeading eyebrow="02 · Kolory i otoczenie" title="Nie wybieraj palety w oderwaniu od miejsca" intro="Ten sam beż zachowa się inaczej przy ceglanej kamienicy, w zielonym parku i w jasnym salonie. Najpierw wybierz lokalizację, potem dwa kolory bazowe i jeden mały akcent." />
                        <div className="mt-12 grid gap-8 md:grid-cols-3">
                            {[
                                ['/images/client-guides/wardrobe/city.webp', 'Miasto', 'Krem, grafit, granat, karmel i bordo dobrze współpracują z kamieniem, szkłem i cegłą. Przy kolorowym muralu uprość ubrania.'],
                                ['/images/client-guides/wardrobe/outdoor.webp', 'Natura', 'Oliwka, piaskowy beż, rdza, błękit i przygaszony róż łączą się z zielenią, trawą i wodą bez efektu kamuflażu.'],
                                ['/images/client-guides/wardrobe/home.webp', 'Dom', 'Powtórz 1–2 odcienie z wnętrza, ale nie zlewaj się z kanapą. Miękkie faktury i jasne warstwy budują spokojny, bliski klimat.'],
                            ].map(([src, title, text]) => (
                                <div key={title} className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
                                    <div className="relative aspect-square"><Image src={src} alt={`Stylizacja dopasowana do sesji: ${title.toLowerCase()}`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-contain bg-[#f7f2e9]" /></div>
                                    <div className="p-6"><h3 className="font-playfair text-2xl font-semibold">{title}</h3><p className="mt-3 leading-7 text-stone-600">{text}</p></div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 rounded-3xl border border-amber-800/20 bg-amber-50 p-6 leading-7 text-stone-700">
                            <strong className="text-stone-950">Prosta zasada:</strong> zrób telefonem zdjęcie miejsca albo poproś fotografa o przykładowy kadr. Połóż obok siebie ubrania całej grupy i sprawdź, czy żaden element nie krzyczy bardziej niż twarze.
                        </div>
                    </div>
                </section>

                <section className="px-5 py-16 md:px-8 md:py-24">
                    <div className="mx-auto max-w-7xl">
                        <SectionHeading eyebrow="03 · Ludzie" title="Rodzina ma wyglądać spójnie, nie identycznie" intro="Wspólny kolor może pojawić się raz w swetrze, raz w drobnym wzorze, a raz tylko w dodatku. Dzięki temu zdjęcie ma rytm, ale każdy zachowuje swój styl." />
                        <div className="mt-12 grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
                            <Figure src="/images/public-guide/family-seated-close.webp" alt="Ilustracyjny przykład rodziny siedzącej blisko siebie w wygodnych ubraniach" caption="Ilustracja: siad i bliskość pozwalają dziecku oprzeć się o rodziców, a ubrania nie ograniczają ruchu." />
                            <div className="space-y-5">
                                {[
                                    ['Rodzina', 'Zacznij od stroju osoby, której najtrudniej coś dobrać. Pozostałym przypisz kolory z tej samej palety. Rozłóż wszystko obok siebie — łatwiej zauważyć nadmiar wzorów.'],
                                    ['Para', 'Nie musicie mieć tego samego koloru. Połączcie podobny poziom formalności i powtórzcie jeden odcień w mniejszym elemencie.'],
                                    ['Dzieci', 'Miękka tkanina, brak drapiących metek i zapasowy zestaw są ważniejsze niż idealny krój. Ulubiony drobiazg może pomóc na początku sesji.'],
                                    ['Kobiety i mężczyźni', 'Wybierzcie fasony, które dobrze układają się także w siadzie. Jeśli jakaś część ciała budzi niepokój, powiedz o tym przed sesją — dobierzemy światło i ustawienie bez ukrywania Ciebie.'],
                                ].map(([title, text], index) => (
                                    <div key={title} className="flex gap-5 rounded-3xl border border-stone-200 bg-white p-6 md:p-7">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 font-semibold text-amber-800">{index + 1}</span>
                                        <div><h3 className="text-xl font-semibold">{title}</h3><p className="mt-2 leading-7 text-stone-600">{text}</p></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-stone-950 px-5 py-16 text-white md:px-8 md:py-24">
                    <div className="mx-auto max-w-7xl">
                        <SectionHeading dark eyebrow="04 · Pozowanie" title="Naturalna poza zaczyna się od małego ruchu" intro="Nie zamrażaj ciała na komendę. Ustaw stabilną bazę, zostaw przestrzeń między barkami a uszami i daj dłoniom proste zadanie. Resztę zrobi rozmowa, oddech i drobne zmiany." />
                        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                ['/images/public-guide/hero-family-walk.webp', 'Stanie', 'Ustaw stopy lekko po skosie, przenieś ciężar na dalszą nogę i odsuń łokcie od tułowia o kilka centymetrów.'],
                                ['/images/public-guide/family-seated-neutral.webp', 'Siedzenie', 'Usiądź wygodnie, oprzyj jedną stopę nieco bliżej i skieruj twarz do światła. Bliskość osób porządkuje kadr.'],
                                ['/images/client-guides/poses/p05-dlon-oparta.webp', 'Dłonie', 'Oprzyj dłoń lekko o udo, kieszeń, ubranie albo ramię bliskiej osoby. Palce pozostaw miękkie.'],
                                ['/images/client-guides/poses/p08-jeden-bark-blizej.webp', 'Barki i głowa', 'Jeden bark skieruj odrobinę bliżej aparatu, brodę wysuń minimalnie do przodu i opuść. Bez przesadnego przechylenia.'],
                                ['/images/public-guide/family-playful-lift.webp', 'Pary i rodziny', 'Idźcie wolno, spójrzcie na siebie albo pobawcie się z dzieckiem. Kontakt i wspólne zadanie wyglądają naturalniej niż równy szereg.'],
                            ].map(([src, title, text]) => (
                                <div key={title} className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06]">
                                        <div className="relative aspect-[4/5] bg-black/20"><Image src={src} alt={`Ilustracyjny przykład naturalnego pozowania: ${title.toLowerCase()}`} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-contain" /></div>
                                    <div className="p-6"><h3 className="font-playfair text-2xl font-semibold">{title}</h3><p className="mt-3 leading-7 text-stone-300">{text}</p></div>
                                </div>
                            ))}
                            <div className="flex flex-col justify-center rounded-[2rem] border border-amber-400/30 bg-amber-400/10 p-7">
                                <ShieldCheck className="text-amber-400" size={32} />
                                <h3 className="mt-5 font-playfair text-2xl font-semibold">Dostępność i komfort</h3>
                                <p className="mt-3 leading-7 text-stone-300">Każde ustawienie dopasowujemy do Twojego zakresu ruchu, sposobu poruszania i energii. Możesz siedzieć, oprzeć się, zrobić przerwę albo zrezygnować z gestu. Dobra poza nie wymaga bólu ani udawania.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="pozy-rodzinne" className="scroll-mt-28 bg-[#f3eee5] px-5 py-16 md:px-8 md:py-24">
                    <div className="mx-auto max-w-7xl">
                        <SectionHeading eyebrow="05 · Inspiracje" title="10 naturalnych ustawień dla rodziny" intro="Nie uczcie się ich na pamięć. Potraktujcie te karty jak prostą podpowiedź: wybierzcie wygodne miejsce, dajcie dłoniom zajęcie i skupcie się na sobie. Podczas sesji to fotograf dopasuje ustawienie do Waszej rodziny." />
                        <p className="mt-5 max-w-3xl text-sm leading-6 text-stone-500">Ilustracje poglądowe pokazują kierunek ustawienia i kolorystykę. Nie są obietnicą identycznego kadru ani zastępstwem dla indywidualnego prowadzenia podczas sesji.</p>
                        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {poseGallery.slice(0, 6).map(([file, title, description]) => (
                                <figure key={file} className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
                                    <div className="relative aspect-[4/5] bg-[#f7f2e9]">
                                        <Image src={`/images/public-guide/pose-cards/${file}`} alt={`Ilustracyjna karta pozy rodzinnej: ${title.toLowerCase()}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-contain" />
                                    </div>
                                    <figcaption className="border-t border-stone-200 p-6">
                                        <h3 className="font-playfair text-2xl font-semibold text-stone-950">{title}</h3>
                                        <p className="mt-3 leading-7 text-stone-600">{description}</p>
                                    </figcaption>
                                </figure>
                            ))}
                        </div>
                        <details className="group mt-8 text-center" name="pose-gallery">
                            <summary className="inline-flex min-h-12 cursor-pointer list-none items-center justify-center rounded-full border border-stone-300 bg-white px-7 py-3 font-semibold text-stone-900 marker:content-none hover:border-stone-900">
                                <span className="group-open:hidden">Pokaż 4 kolejne inspiracje</span>
                                <span className="hidden group-open:inline">Ukryj dodatkowe inspiracje</span>
                            </summary>
                            <div className="mt-8 grid gap-6 text-left sm:grid-cols-2 lg:grid-cols-3">
                                {poseGallery.slice(6).map(([file, title, description]) => (
                                    <figure key={file} className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
                                        <div className="relative aspect-[4/5] bg-[#f7f2e9]">
                                            <Image src={`/images/public-guide/pose-cards/${file}`} alt={`Ilustracyjna karta pozy rodzinnej: ${title.toLowerCase()}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-contain" />
                                        </div>
                                        <figcaption className="border-t border-stone-200 p-6">
                                            <h3 className="font-playfair text-2xl font-semibold text-stone-950">{title}</h3>
                                            <p className="mt-3 leading-7 text-stone-600">{description}</p>
                                        </figcaption>
                                    </figure>
                                ))}
                            </div>
                        </details>
                    </div>
                </section>

                <section className="px-5 py-16 md:px-8 md:py-24">
                    <div className="mx-auto max-w-7xl">
                        <SectionHeading eyebrow="06 · Gotowe plany" title="Trzy scenariusze, które możesz skopiować" intro="Potraktuj je jak punkt startowy. Każdy zestaw można uprościć, ocieplić albo dopasować do pogody." />
                        <div className="mt-12 grid gap-6 lg:grid-cols-3">
                            {[
                                ['Miejski spacer we dwoje', 'Kremowa góra + granat lub grafit + karmelowy akcent', ['Spotkanie przy spokojnej ulicy', '5 minut portretów przy ścianie', 'Spacer i rozmowa', 'Zdjęcia w kawiarni lub bramie']],
                                ['Rodzina w zieleni', 'Beż + oliwka + przygaszony błękit', ['Krótki spacer na oswojenie miejsca', 'Zabawa z dziećmi na kocu', 'Wspólny ruch i przytulenie', 'Spokojny portret na koniec']],
                                ['Domowa opowieść', 'Jasne neutralne odcienie + miękkie faktury', ['Rozmowa przy oknie', 'Wspólne przygotowanie napoju', 'Zabawa na podłodze lub kanapie', 'Ciche portrety w ulubionym miejscu']],
                            ].map(([title, palette, steps], index) => (
                                <div key={title as string} className="rounded-[2rem] border border-stone-200 bg-white p-7 shadow-sm">
                                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Scenariusz 0{index + 1}</span>
                                    <h3 className="mt-3 font-playfair text-2xl font-semibold">{title as string}</h3>
                                    <p className="mt-3 rounded-2xl bg-stone-100 p-4 text-sm leading-6 text-stone-600"><strong>Paleta:</strong> {palette as string}</p>
                                    <ol className="mt-5 space-y-3">{(steps as string[]).map((step, i) => <li key={step} className="flex gap-3 leading-6 text-stone-600"><span className="font-semibold text-amber-700">{i + 1}.</span>{step}</li>)}</ol>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-[#f1ece3] px-5 py-16 md:px-8 md:py-24">
                    <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
                        <div>
                            <SectionHeading eyebrow="07 · Dzień przed" title="Checklista przed sesją" intro="Nie pakuj wszystkiego. Kilka sprawdzonych rzeczy daje więcej spokoju niż walizka pełna alternatyw." />
                            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                                {['Kompletny strój przymierzony w ruchu', 'Wyczyszczone buty i usunięte metki', 'Jedna dodatkowa warstwa', 'Zapasowe ubranie dla dziecka', 'Woda, mała przekąska i chusteczki', 'Puste kieszenie i zdjęte gumki z nadgarstków', 'Telefon z zapisanym adresem', 'Informacja dla fotografa o ważnych potrzebach'].map(item => (
                                    <li key={item} className="flex gap-3 rounded-2xl bg-white p-4 leading-6"><Check className="mt-0.5 shrink-0 text-amber-700" size={19} />{item}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-[2rem] bg-white p-7 md:p-10">
                            <Heart className="text-amber-700" size={32} />
                            <h3 className="mt-5 font-playfair text-3xl font-semibold">Najważniejsze: nie musisz być „fotogeniczna” ani „fotogeniczny”</h3>
                            <p className="mt-5 text-lg leading-8 text-stone-600">Fotograf odpowiada za światło, kadr i prowadzenie. Ty możesz przyjść z emocjami, zmęczeniem, dzieckiem w zmiennym humorze i bez doświadczenia przed aparatem. To jest normalny materiał na prawdziwe zdjęcia.</p>
                            <Link href="/rezerwacja" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-stone-950 px-6 py-3 font-semibold text-white hover:bg-amber-700">Sprawdź dostępne sesje <ArrowRight size={18} /></Link>
                        </div>
                    </div>
                </section>

                <section className="px-5 py-16 md:px-8 md:py-24">
                    <div className="mx-auto max-w-4xl">
                        <SectionHeading eyebrow="08 · FAQ" title="Najczęstsze pytania przed sesją" intro="Krótko i konkretnie — tak, żeby przygotowania nie stały się kolejnym projektem do zarządzania." />
                        <div className="mt-10 divide-y divide-stone-200 border-y border-stone-200">
                            {faq.map(([question, answer]) => (
                                <details key={question} className="group py-5">
                                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-5 text-lg font-semibold marker:content-none">
                                        {question}<span className="text-2xl font-light transition group-open:rotate-45" aria-hidden="true">+</span>
                                    </summary>
                                    <p className="max-w-3xl pb-2 pr-8 leading-7 text-stone-600">{answer}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="px-5 pb-10 md:px-8">
                    <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 rounded-[2rem] border border-stone-200 bg-white p-7 md:flex-row md:items-center md:p-10">
                        <Image src="/assets/me.jpg" alt="Przemysław Właśniewski, fotograf i autor poradnika" width={112} height={112} className="h-28 w-28 rounded-full object-cover" />
                        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">O autorze</p><h2 className="mt-2 font-playfair text-2xl font-semibold">Przemysław Właśniewski</h2><p className="mt-2 leading-7 text-stone-600">Fotograf rodzinny, portretowy i ślubny. W poradniku zebrałem wskazówki, które realnie ułatwiają klientom przygotowanie i pozwalają szybciej poczuć się swobodnie przed aparatem.</p><Link href="/o-mnie" className="mt-3 inline-flex items-center gap-1 font-semibold text-amber-800 underline-offset-4 hover:underline">Poznaj mnie <ArrowRight size={16} /></Link></div>
                    </div>
                </section>
            </article>

            <section className="px-5 py-16 md:px-8 md:py-24">
                <div className="mx-auto grid max-w-6xl items-center gap-10 overflow-hidden rounded-[2.5rem] bg-amber-700 p-8 text-white md:p-12 lg:grid-cols-[1fr_.7fr]">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-100">Pełny poradnik · w przygotowaniu</p>
                        <h2 className="mt-4 font-playfair text-3xl font-semibold md:text-5xl">Chcesz mieć wszystkie przykłady pod ręką?</h2>
                        <p className="mt-5 max-w-2xl text-lg leading-8 text-amber-50">Rozbudowana wersja będzie zawierać więcej zestawów, palet, schematów pozowania i checklistę do zapisania. Nie podajemy ceny ani terminu, dopóki produkt nie będzie gotowy.</p>
                        <Link href="/sklep/poradnik-jak-sie-ubrac-i-pozowac" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-7 py-3 font-semibold text-stone-950 hover:bg-amber-50">Zobacz zapowiedź poradnika <ArrowRight size={18} /></Link>
                    </div>
                    <div className="rounded-3xl border border-white/20 bg-white/10 p-7">
                        <Sparkles size={30} className="text-amber-100" />
                        <ul className="mt-5 space-y-3 text-amber-50">{['Pełne zestawy ubrań dla różnych sesji', 'Więcej schematów póz i prostych ruchów', 'Palety dobrane do otoczenia i pory roku', 'Checklisty do użycia przed wyjściem'].map(item => <li key={item} className="flex gap-3"><Check size={18} className="mt-1 shrink-0" />{item}</li>)}</ul>
                    </div>
                </div>
            </section>

            <section className="border-t border-stone-200 px-5 py-16 text-center md:px-8 md:py-24">
                <MapPin className="mx-auto text-amber-700" size={30} />
                <h2 className="mx-auto mt-5 max-w-3xl font-playfair text-3xl font-semibold md:text-5xl">Poradnik przeczytany. Teraz zaplanujmy sesję po Twojemu.</h2>
                <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-stone-600">Sesje w Toruniu, Grudziądzu i okolicach — w mieście, naturze lub u Ciebie w domu.</p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link href="/rezerwacja" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-stone-950 px-7 py-3 font-semibold text-white hover:bg-amber-700">Zarezerwuj sesję <ArrowRight size={18} /></Link>
                    <Link href="/kontakt" className="inline-flex min-h-12 items-center justify-center rounded-full border border-stone-300 bg-white px-7 py-3 font-semibold hover:border-stone-900">Zadaj pytanie</Link>
                </div>
            </section>
        </main>
    );
}
