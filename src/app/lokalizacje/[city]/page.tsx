"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const cityData: Record<string, { title: string; subtitle: string; tag: string; content: string[] }> = {
    torun: {
        title: "Fotograf Toruń",
        subtitle: "Naturalne sesje w sercu miasta i plenerze",
        tag: "fotograf toruń",
        content: [
            "Toruń to dla mnie coś więcej niż tylko gotyk i pierniki. To miasto z duszą, gdzie każda uliczka Starówki kryje idealne tło do sesji narzeczeńskiej czy rodzinnej. Często pracuję na Bydgoskim Przedmieściu, w Parku Miejskim czy nad Wisłą, szukając miękkiego, złotego światła.",
            "Jako fotograf mieszkający niedaleko, znam Toruń od podszewki. Niezależnie czy planujesz kameralny ślub w Ratuszu Staromiejskim, czy luźną sesję rodzinną w plenerze – jestem do Twojej dyspozycji. Stawiam na autentyczność; wolę łapać Wasze prawdziwe uśmiechy niż ustawiać sztywne pozy.",
            "Dojeżdżam do Torunia bez dodatkowych kosztów w ramach większych pakietów. Zabieram ze sobą nie tylko aparat, ale też drona, dzięki któremu możemy spojrzeć na Waszą historię z zupełnie innej perspektywy.",
        ],
    },
    grudziadz: {
        title: "Fotograf Grudziądz",
        subtitle: "Spichlerze emocji – sesje nad Wisłą",
        tag: "fotograf grudziądz",
        content: [
            "Grudziądz ze swoją panoramą spichlerzy to jedno z najbardziej fotogenicznych miejsc w naszym województwie. Uwielbiam realizować tu sesje o zachodzie słońca, gdy ceglane mury nabierają ciepłych barw.",
            "Jestem stąd – to znaczy z regionu (baza w Płużnicy), więc do Grudziądza mam rzut beretem. Często bywam na Górze Zamkowej czy w Parku Miejskim, realizując reportaże z chrztów i urodzin oraz luźne sesje par.",
            "Jeśli szukasz fotografa w Grudziądzu, który nie będzie Cię stresował „pozowaniem”, a raczej pójdzie z Tobą na spacer i przy okazji zrobi świetne zdjęcia – trafiłeś idealnie.",
        ],
    },
    wabrzezno: {
        title: "Fotograf Wąbrzeźno",
        subtitle: "Lokalne historie nad jeziorami",
        tag: "fotograf wąbrzeźno",
        content: [
            "Mieszkam tuż obok, więc Wąbrzeźno to mój „domowy” teren. Jezioro Zamkowe i Frydek to klasyki, ale znam też mnóstwo ukrytych miejsc w okolicznych lasach i na polach, które idealnie nadają się na sesje brzuszkowe czy rodzinne.",
            "Działając lokalnie, jestem dostępny nierzadko „od ręki” na krótsze sesje. Fotografia w Wąbrzeźnie nie musi być nudna – pokażę Ci, jak wydobyć piękno z naszych codziennych okolic.",
            "Realizuję tu reportaże ślubne, osiemnastki i sesje komunijne, zawsze z pełnym zaangażowaniem i uśmiechem.",
        ],
    },
    pluznica: {
        title: "Fotograf Płużnica",
        subtitle: "Tu wszystko się zaczęło",
        tag: "fotograf płużnica",
        content: [
            "Płużnica to moja baza wypadowa. To tutaj mieszkam, tutaj ładuję baterie i stąd ruszam do Was w promieniu 75 km (a czasem dalej!).",
            "Sesje w gminie Płużnica mają ten unikalny, sielski klimat. Pola rzepaku wiosną, złote zboża latem – to naturalne studio fotograficzne tuż za progiem. Jeśli jesteś sąsiadem, wiesz, że możesz liczyć na sąsiedzkie podejście.",
            "Zapraszam na sesje w Twoim ogrodzie lub w moich ulubionych plenerach w okolicy.",
        ],
    },
    lisewo: {
        title: "Fotograf Lisewo",
        subtitle: "Blisko, naturalnie, swojsko",
        tag: "fotograf lisewo",
        content: [
            "Lisewo i okolice to świetny wybór na spokojne sesje zdjęciowe z dala od miejskiego zgiełku. Często fotografuję tu rodziny, które cenią sobie prywatność i naturę.",
            "Dojeżdżam do Lisewa błyskawicznie. Niezależnie czy to chrzest w lokalnym kościele, czy sesja narzeczeńska na łące – jestem do dyspozycji.",
        ],
    },
    chelmno: {
        title: "Fotograf Chełmno",
        subtitle: "Miasto Zakochanych w kadrze",
        tag: "fotograf chełmno",
        content: [
            "Chełmno, miasto zakochanych – czy może być lepsze miejsce na sesję narzeczeńską lub ślubną? Urokliwy rynek, parki i panorama Wisły tworzą niesamowity klimat.",
            "Lubię wykorzystywać architekturę Chełmna jako tło do portretów, ale nie dominujące. Najważniejsi jesteście Wy i Wasze uczucia. Staram się łapać te ulotne momenty czułości, które w tym mieście wydają się jeszcze bardziej magiczne.",
            "Jestem u Was w kilkanaście minut, gotowy by uwiecznić Waszą historię.",
        ],
    },
    swiecie: {
        title: "Fotograf Świecie",
        subtitle: "Zamek, natura i Wasze emocje",
        tag: "fotograf świecie",
        content: [
            "Zamek w Świeciu to ikona, ale fotograficznie miasto ma do zaoferowania znacznie więcej. Parki, okolice Wdy i Wisły to świetne plenery.",
            "Często bywam w Świeciu na reportażach okolicznościowych. Cenię sobie otwartość mieszkańców i swobodną atmosferę, którą staram się oddać na zdjęciach.",
            "Jeśli szukasz fotografa, który połączy reportażowy styl z artystycznym spojrzeniem, zapraszam do kontaktu.",
        ],
    },
    bydgoszcz: {
        title: "Fotograf Bydgoszcz",
        subtitle: "Wyspa Młyńska i miejski styl",
        tag: "fotograf bydgoszcz",
        content: [
            "Choć z Płużnicy mam kawałek, Bydgoszcz odwiedzam z przyjemnością. Wyspa Młyńska, kanały i nowoczesna architektura Opery dają ogromne pole do popisu przy sesjach biznesowych i wizerunkowych.",
            "Realizuję w Bydgoszczy także duże reportaże ślubne. Miasto tętni życiem, a ja staram się to życie zamknąć w kadrach – dynamicznych, pełnych koloru i emocji.",
        ],
    }
};

export default function CityPage() {
    const params = useParams();
    const city = params.city as string;
    const data = cityData[city];

    if (!data) {
        return (
            <main className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-zinc-900 mb-4">Miasto nie znalezione</h1>
                    <Link href="/" className="text-amber-500 hover:text-amber-600">
                        ← Powrót na stronę główną
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white">
            <div className="mx-auto max-w-4xl px-4 py-20">
                <div className="mb-12">
                    <Link href="/" className="inline-flex items-center text-zinc-600 hover:text-zinc-900 mb-6 transition-colors">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Powrót na stronę główną
                    </Link>

                    <span className="inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                        {data.tag}
                    </span>

                    <h1 className="text-4xl md:text-6xl font-extrabold text-zinc-900 mb-4 font-display">
                        {data.title}
                    </h1>
                    <p className="text-zinc-600 text-xl">{data.subtitle}</p>
                </div>

                <div className="prose prose-lg max-w-none mb-12">
                    {data.content.map((paragraph, idx) => (
                        <p key={idx} className="text-zinc-700 leading-relaxed text-lg mb-4">
                            {paragraph}
                        </p>
                    ))}
                </div>

                <div className="bg-zinc-50 rounded-2xl p-8 mb-12 border border-zinc-200">
                    <h2 className="text-2xl font-bold text-zinc-900 mb-6">Co oferuję w tym regionie?</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {['Sesje Rodzinne', 'Fotografia Biznesowa', 'Reportaże Ślubne', 'Zdjęcia z Drona'].map(service => (
                            <div key={service} className="flex items-start gap-3">
                                <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <h3 className="font-semibold text-zinc-900">{service}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <Link href="/portfolio" className="bg-white hover:bg-zinc-50 border-2 border-zinc-900 text-zinc-900 font-bold py-4 px-6 rounded-xl transition-colors text-center">
                        Zobacz portfolio
                    </Link>
                    <Link href="/rezerwacja" className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-4 px-6 rounded-xl transition-colors text-center">
                        Zarezerwuj sesję
                    </Link>
                </div>
            </div>
        </main>
    );
}
