import type { Metadata } from 'next';
import Link from 'next/link';
import {
    ArrowRight,
    Building2,
    Camera,
    Check,
    CloudSun,
    Heart,
    MapPin,
    Play,
    ShieldCheck,
    ThermometerSun,
} from 'lucide-react';
import { getCategory } from '@/lib/portfolio';
import {
    DRONE_PHOTOGRAPHY_AREAS,
    DRONE_PHOTOGRAPHY_PACKAGES,
    droneBookingHref,
    formatDronePrice,
} from '@/lib/dronePhotographyOffer';

export const revalidate = 3600;

export const metadata: Metadata = {
    title: 'Zdjęcia i filmy z drona Toruń | Pakiety od 449 zł',
    description: 'Zdjęcia i filmy z drona w Toruniu i kujawsko-pomorskim: nieruchomości, firmy i śluby. Pakiety od 449 zł. Wybierz zakres i sprawdź termin.',
    keywords: [
        'zdjęcia z drona Toruń',
        'filmowanie dronem Toruń',
        'fotografia nieruchomości dron kujawsko-pomorskie',
        'dron na ślub Toruń',
        'film z drona dla firmy',
    ],
    alternates: { canonical: 'https://wlasniewski.pl/fotografia-z-drona' },
    openGraph: {
        title: 'Zdjęcia i filmy z drona — Toruń i kujawsko-pomorskie',
        description: 'Nieruchomości, firmy i śluby. Jasny zakres, ceny od 449 zł i wstępna rezerwacja online.',
        type: 'website',
        url: 'https://wlasniewski.pl/fotografia-z-drona',
    },
};

const useCases = [
    {
        id: 'nieruchomosc',
        icon: Building2,
        eyebrow: 'Sprzedaż i wynajem',
        title: 'Nieruchomość',
        description: 'Pokaż dom, działkę, obiekt noclegowy i ich otoczenie w jednym czytelnym materiale.',
        href: '#pakiety',
    },
    {
        id: 'firma',
        icon: Camera,
        eyebrow: 'Strona i kampania',
        title: 'Firma',
        description: 'Zdjęcia oraz krótki film do strony, prezentacji inwestycji i mediów społecznościowych.',
        href: '#firma',
    },
    {
        id: 'slub',
        icon: Heart,
        eyebrow: 'Dodatek do reportażu',
        title: 'Ślub',
        description: 'Miejsce ceremonii, sala, plener i bezpiecznie ustawiona grupa widziane z powietrza.',
        href: '#slub',
    },
] as const;

const faq = [
    {
        question: 'Czy każdy termin i miejsce można zarezerwować od razu?',
        answer: 'Nie. Najpierw sprawdzam pogodę, aktualne strefy geograficzne i warunki bezpiecznego wykonania lotu. Rezerwacja z formularza jest wstępna do czasu mojego potwierdzenia.',
    },
    {
        question: 'Co się dzieje, gdy pogoda nie pozwala wystartować?',
        answer: 'Ustalamy bezpłatnie najbliższy możliwy termin. Przy ślubie materiał z drona jest dodatkiem zależnym od pogody i możliwości wykonania lotu w danym miejscu.',
    },
    {
        question: 'Czy zdjęcia i filmy są gotowe do publikacji?',
        answer: 'Tak. Otrzymujesz opracowane pliki w formatach dopasowanych do strony, ogłoszenia albo mediów społecznościowych — zgodnie z wybranym pakietem.',
    },
    {
        question: 'Czy na stronie pokazujesz obrazy wygenerowane przez AI jako realizacje?',
        answer: 'Nie. Portfolio służy do pokazania wykonanych przeze mnie materiałów. Ewentualna wizualizacja koncepcji wygenerowana lub istotnie zmieniona przez AI będzie wyraźnie oznaczona.',
    },
] as const;

export default async function DronePhotographyPage() {
    const standardPackages = DRONE_PHOTOGRAPHY_PACKAGES.filter(item => item.slug !== 'slub-dodatek');
    const weddingPackage = DRONE_PHOTOGRAPHY_PACKAGES.find(item => item.slug === 'slub-dodatek')!;

    let portfolioPhotos: Array<{ src: string; title: string }> = [];
    try {
        const droneCategory = await getCategory('drone');
        portfolioPhotos = (droneCategory?.sessions || []).flatMap(session => {
            const candidates = [session.coverImage, ...(session.highlightedPhotos || [])].filter(Boolean) as string[];
            return candidates.map(src => ({ src, title: session.title }));
        }).slice(0, 6);
    } catch (error) {
        console.warn('[drone-photography] Portfolio unavailable', error);
    }

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Zdjęcia i filmy z drona',
        description: metadata.description,
        url: 'https://wlasniewski.pl/fotografia-z-drona',
        serviceType: 'Fotografia i filmowanie z drona',
        provider: {
            '@type': 'LocalBusiness',
            name: 'Przemysław Właśniewski — Fotograf',
            url: 'https://wlasniewski.pl',
            telephone: '+48530788694',
            address: {
                '@type': 'PostalAddress',
                addressRegion: 'kujawsko-pomorskie',
                addressCountry: 'PL',
            },
        },
        areaServed: DRONE_PHOTOGRAPHY_AREAS.map(name => ({ '@type': 'City', name })),
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Pakiety fotografii z drona',
            itemListElement: DRONE_PHOTOGRAPHY_PACKAGES.map(item => ({
                '@type': 'Offer',
                name: item.name,
                price: item.price,
                priceCurrency: 'PLN',
                url: `https://wlasniewski.pl${droneBookingHref(item.slug, 'seo-schema')}`,
            })),
        },
    };

    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map(item => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
    };

    return (
        <main className="min-h-screen bg-[#f3efe8] text-[#28221c] selection:bg-[#c9ad74] selection:text-[#28221c]">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

            <section className="relative overflow-hidden border-b border-[#bcae9a] bg-[#211d19] px-5 pb-16 pt-20 text-white sm:px-8 md:pb-24 md:pt-28">
                <div aria-hidden="true" className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_12%_18%,rgba(212,183,124,.32),transparent_28%),radial-gradient(circle_at_85%_78%,rgba(255,255,255,.08),transparent_25%)]" />
                <div aria-hidden="true" className="absolute -right-40 top-16 h-[520px] w-[520px] rounded-full border border-white/10" />
                <div aria-hidden="true" className="absolute -right-20 top-32 h-[390px] w-[390px] rounded-full border border-[#d4b77c]/20" />
                <div className="relative mx-auto max-w-[1380px]">
                    <div className="grid gap-10 lg:grid-cols-[1.1fr_.55fr] lg:items-end">
                        <div>
                            <p className="mb-5 text-[10px] font-bold uppercase tracking-[.34em] text-[#d4b77c] sm:text-xs">Fotografia z powietrza · kujawsko-pomorskie</p>
                            <h1 className="max-w-5xl font-display text-[clamp(3.6rem,8vw,8.5rem)] font-normal leading-[.82] tracking-[-.055em]">
                                Zdjęcia i filmy<br /><em className="font-light text-[#d4b77c]">z drona</em>
                            </h1>
                            <p className="mt-8 max-w-2xl text-base leading-8 text-white/70 md:text-lg">
                                Dla sprzedaży nieruchomości, promocji firmy i jako dodatek do reportażu ślubnego. Wybierasz konkretny zakres, a przed potwierdzeniem terminu sprawdzam pogodę i możliwość wykonania lotu.
                            </p>
                        </div>
                        <div className="border-l border-white/20 pl-6 lg:pb-3">
                            <div className="text-xs font-bold uppercase tracking-[.24em] text-white/50">Pakiety od</div>
                            <div className="mt-2 font-display text-7xl text-[#f4dfb6]">449 zł</div>
                            <Link href="#pakiety" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#d4b77c] px-7 py-3.5 text-xs font-bold uppercase tracking-[.14em] text-[#211d19] transition hover:bg-white">
                                Wybierz zastosowanie <ArrowRight size={17} />
                            </Link>
                        </div>
                    </div>

                    <div className="mt-14 grid gap-px overflow-hidden border border-white/15 bg-white/15 md:grid-cols-3">
                        {useCases.map(item => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.id} href={item.href} className="group bg-[#28231f]/95 p-7 transition hover:bg-[#332c26] md:p-8">
                                    <div className="flex items-start justify-between gap-4">
                                        <Icon className="text-[#d4b77c]" size={28} strokeWidth={1.5} />
                                        <ArrowRight className="text-white/40 transition group-hover:translate-x-1 group-hover:text-[#d4b77c]" size={20} />
                                    </div>
                                    <p className="mt-8 text-[10px] font-bold uppercase tracking-[.24em] text-[#d4b77c]">{item.eyebrow}</p>
                                    <h2 className="mt-2 font-display text-4xl font-normal">{item.title}</h2>
                                    <p className="mt-3 text-sm leading-6 text-white/60">{item.description}</p>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-[10px] font-bold uppercase tracking-[.14em] text-white/55">
                        <span className="flex items-center gap-2"><MapPin size={15} className="text-[#d4b77c]" /> Toruń i region</span>
                        <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-[#d4b77c]" /> Sprawdzenie strefy przed lotem</span>
                        <span className="flex items-center gap-2"><CloudSun size={15} className="text-[#d4b77c]" /> Bezpłatna zmiana terminu przez pogodę</span>
                    </div>
                </div>
            </section>

            <section id="pakiety" className="scroll-mt-24 px-5 py-20 sm:px-8 md:py-28">
                <div className="mx-auto max-w-[1280px]">
                    <div className="grid items-end gap-8 lg:grid-cols-[1fr_.7fr]">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#94733d]">Zakres i cena</p>
                            <h2 className="mt-4 max-w-4xl font-display text-5xl font-normal leading-[.92] tracking-[-.04em] md:text-7xl">Wybierz materiał, którego naprawdę potrzebujesz</h2>
                        </div>
                        <p className="border-l border-[#bcae9a] pl-6 text-sm leading-7 text-[#686057] md:text-base">
                            Cena obejmuje główny obszar działania: {DRONE_PHOTOGRAPHY_AREAS.join(', ')}. Dalszy dojazd i niestandardowe zgody wyceniam przed ostatecznym potwierdzeniem.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-5 lg:grid-cols-3">
                        {standardPackages.map(item => (
                            <article id={item.audience === 'firma' ? 'firma' : undefined} key={item.slug} className={`relative flex min-h-[520px] scroll-mt-24 flex-col border p-7 sm:p-9 ${item.featured ? 'border-[#94733d] bg-[#fffaf1] shadow-[0_24px_70px_rgba(78,63,43,.12)]' : 'border-[#cfc2b1] bg-[#f8f5f0]'}`}>
                                {item.featured && <span className="absolute right-5 top-5 bg-[#94733d] px-3 py-1 text-[9px] font-bold uppercase tracking-[.16em] text-white">Najczęściej wybierany</span>}
                                <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#94733d]">{item.shortName}</p>
                                <h3 className="mt-5 font-display text-4xl font-normal leading-none">{item.name}</h3>
                                <p className="mt-5 min-h-20 text-sm leading-7 text-[#686057]">{item.summary}</p>
                                <div className="my-7 border-y border-[#d8cdbd] py-5 font-display text-5xl">{formatDronePrice(item)}</div>
                                <ul className="space-y-3 text-sm leading-6 text-[#514a42]">
                                    {item.features.map(feature => <li key={feature} className="flex gap-3"><Check size={17} className="mt-1 shrink-0 text-[#94733d]" /> {feature}</li>)}
                                </ul>
                                <p className="mt-6 text-xs leading-5 text-[#81776c]">{item.delivery}</p>
                                <Link href={droneBookingHref(item.slug, 'drone-offer-package')} className="mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#28221c] px-6 py-3 text-xs font-bold uppercase tracking-[.14em] text-white transition hover:bg-[#94733d]">
                                    Sprawdź termin <ArrowRight size={16} />
                                </Link>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section id="slub" className="scroll-mt-24 border-y border-[#40382f] bg-[#211d19] px-5 py-20 text-white sm:px-8 md:py-28">
                <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#d4b77c]">Dodatek do fotografii ślubnej</p>
                        <h2 className="mt-5 font-display text-5xl font-normal leading-[.92] tracking-[-.04em] md:text-7xl">Miejsce ślubu pokazane z góry</h2>
                        <p className="mt-7 max-w-xl text-base leading-8 text-white/65">
                            Ujęcia z drona dokładam do reportażu ślubnego wtedy, gdy miejsce, pogoda i przepisy pozwalają wykonać lot bezpiecznie. Nie obiecuję startu za wszelką cenę — najważniejsze są ludzie i przebieg uroczystości.
                        </p>
                        <Link href="/slub" className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[#d4b77c] hover:text-white">
                            Zobacz pełną ofertę ślubną <ArrowRight size={16} />
                        </Link>
                    </div>
                    <article className="border border-white/15 bg-white/[.04] p-7 sm:p-10">
                        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#d4b77c]">{weddingPackage.shortName}</p>
                                <h3 className="mt-4 font-display text-4xl">{weddingPackage.name}</h3>
                            </div>
                            <div className="font-display text-5xl text-[#f4dfb6]">{formatDronePrice(weddingPackage)}</div>
                        </div>
                        <ul className="mt-8 grid gap-3 text-sm leading-6 text-white/70 sm:grid-cols-2">
                            {weddingPackage.features.map(feature => <li key={feature} className="flex gap-3"><Check size={17} className="mt-1 shrink-0 text-[#d4b77c]" /> {feature}</li>)}
                        </ul>
                        <Link href={droneBookingHref(weddingPackage.slug, 'drone-offer-wedding')} className="mt-9 inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-full bg-[#d4b77c] px-6 py-3 text-xs font-bold uppercase tracking-[.14em] text-[#211d19] transition hover:bg-white sm:w-auto">
                            Dodaj dron do reportażu <ArrowRight size={16} />
                        </Link>
                    </article>
                </div>
            </section>

            {portfolioPhotos.length > 0 && (
                <section className="px-5 py-20 sm:px-8 md:py-28" aria-labelledby="drone-portfolio-heading">
                    <div className="mx-auto max-w-[1280px]">
                        <p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#94733d]">Wykonane realizacje</p>
                        <h2 id="drone-portfolio-heading" className="mt-4 font-display text-5xl font-normal md:text-7xl">Zobacz efekt, nie obietnicę</h2>
                        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {portfolioPhotos.map((photo, index) => (
                                <figure key={`${photo.src}-${index}`} className="relative aspect-[4/3] overflow-hidden bg-[#28221c]">
                                    <img src={photo.src} alt={`${photo.title} — zdjęcie wykonane z drona`} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-700 hover:scale-[1.025]" />
                                </figure>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <section className="border-y border-[#d8cdbd] bg-[#ebe4da] px-5 py-20 sm:px-8 md:py-28">
                <div className="mx-auto max-w-[1200px]">
                    <div className="grid gap-px overflow-hidden border border-[#c8bbab] bg-[#c8bbab] lg:grid-cols-2">
                        <article className="bg-[#f8f5f0] p-8 sm:p-12">
                            <Camera size={34} strokeWidth={1.4} className="text-[#94733d]" />
                            <p className="mt-9 text-[10px] font-bold uppercase tracking-[.26em] text-[#94733d]">DJI Air 2S</p>
                            <h2 className="mt-3 font-display text-4xl font-normal">Fotografia i film</h2>
                            <p className="mt-5 text-sm leading-7 text-[#686057]">To podstawowy sprzęt do materiałów dla nieruchomości, firm i reportaży ślubnych. Klient zamawia efekt i zakres — model drona dobieram do warunków realizacji.</p>
                        </article>
                        <article className="bg-[#28221c] p-8 text-white sm:p-12">
                            <ThermometerSun size={34} strokeWidth={1.4} className="text-[#d4b77c]" />
                            <p className="mt-9 text-[10px] font-bold uppercase tracking-[.26em] text-[#d4b77c]">DJI Mavic 3 Thermal</p>
                            <h2 className="mt-3 font-display text-4xl font-normal">Termowizja i inspekcje</h2>
                            <p className="mt-5 text-sm leading-7 text-white/65">Badania termiczne, inspekcje techniczne i dokumentacja dla firm są prowadzone jako oddzielna usługa specjalistyczna na Aeroanaliza.</p>
                            <a href="https://aeroanaliza.pl/dron" className="mt-7 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-[#d4b77c] hover:text-white">Przejdź do Aeroanaliza <ArrowRight size={16} /></a>
                        </article>
                    </div>
                </div>
            </section>

            <section className="px-5 py-20 sm:px-8 md:py-28">
                <div className="mx-auto max-w-[1100px]">
                    <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#94733d]">Przed rezerwacją</p>
                            <h2 className="mt-4 font-display text-5xl font-normal leading-[.95]">Co warto wiedzieć</h2>
                            <p className="mt-6 text-sm leading-7 text-[#686057]">Konkretnie, bez obietnic, których nie da się dotrzymać przy każdej pogodzie i w każdym miejscu.</p>
                        </div>
                        <div className="divide-y divide-[#c8bbab] border-y border-[#c8bbab]">
                            {faq.map(item => (
                                <details key={item.question} className="group py-6">
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-semibold"><span>{item.question}</span><span className="text-[#94733d] transition group-open:rotate-45">+</span></summary>
                                    <p className="mt-4 max-w-3xl text-sm leading-7 text-[#686057]">{item.answer}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-[#211d19] px-5 py-24 text-center text-white sm:px-8 md:py-32">
                <div className="mx-auto max-w-3xl">
                    <Play className="mx-auto text-[#d4b77c]" size={36} strokeWidth={1.4} />
                    <h2 className="mt-7 font-display text-5xl font-normal leading-[.92] tracking-[-.04em] md:text-7xl">Masz miejsce lub wydarzenie do pokazania?</h2>
                    <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/65">Wybierz najbliższy zakres. W formularzu podasz miasto, preferowany termin i najważniejsze zadanie materiału.</p>
                    <Link href={droneBookingHref('nieruchomosc-foto', 'drone-offer-bottom')} className="mt-9 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#d4b77c] px-8 py-3 text-xs font-bold uppercase tracking-[.15em] text-[#211d19] transition hover:bg-white">
                        Rozpocznij rezerwację <ArrowRight size={17} />
                    </Link>
                </div>
            </section>
        </main>
    );
}
