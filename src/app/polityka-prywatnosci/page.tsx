import React from "react";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import PageRenderer from "@/components/PageRenderer";
import { Metadata } from "next";

export const revalidate = 3600; // Cache for 1 hour

export async function generateMetadata(): Promise<Metadata> {
    const page = await prisma.page.findUnique({
        where: { slug: 'polityka-prywatnosci' },
        select: {
            meta_title: true,
            meta_description: true
        }
    });

    return {
        title: page?.meta_title || 'Polityka Prywatności | Przemysław Właśniewski',
        description: page?.meta_description || 'Polityka prywatności i ochrony danych osobowych serwisu wlasniewski.pl.',
        alternates: { canonical: 'https://wlasniewski.pl/polityka-prywatnosci' },
        robots: { index: false, follow: true },
    };
}

export default async function PolitykaPrywatnosciPage() {
    const page = await prisma.page.findUnique({
        where: { slug: 'polityka-prywatnosci' },
        select: {
            sections: true
        }
    });

    // Parse sections
    let sections = [];
    if (page?.sections) {
        try {
            sections = JSON.parse(page.sections);
        } catch (e) {
            console.error('Failed to parse privacy policy sections', e);
        }
    }

    /* 
       SYNC INTEGRITY (Zero Flower)
       Jeśli w panelu admina nie dodano sekcji (np. nowa instalacja), 
       wyświetlamy standardową treść prawną zapisaną w kodzie.
    */
    const hasSections = sections && sections.length > 0;

    return (
        <main className="min-h-screen bg-black text-white selection:bg-gold-400 selection:text-black">
            <div className="mx-auto max-w-4xl px-4 py-16 pt-32">
                <Link
                    href="/"
                    className="inline-flex items-center text-zinc-500 hover:text-gold-400 mb-8 transition-colors group font-sans text-sm tracking-widest uppercase"
                >
                    <svg className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    Powrót
                </Link>

                {hasSections ? (
                    <PageRenderer sections={sections} />
                ) : (
                    <>
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-8">Polityka Prywatności</h1>

                        <div className="prose prose-invert max-w-none prose-lg text-zinc-300">
                            <section className="mb-10">
                                <h2 className="text-2xl font-display font-semibold text-white mb-4">1. Administrator danych</h2>
                                <p className="mb-4">
                                    Administratorem danych osobowych zbieranych za pośrednictwem strony <strong>wlasniewski.pl</strong> jest:
                                </p>
                                <p className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                                    <strong>FOTO-DRON Przemysław Właśniewski</strong><br />
                                    Adres: <span className="text-gold-400">Płużnica 47g, 87-214 Płużnica</span><br />
                                    NIP: <span className="text-gold-400">8781430365</span><br />
                                    <br />
                                    <strong>Kontakt:</strong><br />
                                    E-mail: <a href="mailto:pwlasniewski@gmail.com" className="text-gold-400 hover:underline">pwlasniewski@gmail.com</a><br />
                                    Telefon: <a href="tel:+48530788694" className="text-gold-400 hover:underline">+48 530 788 694</a>
                                </p>
                            </section>

                            <section className="mb-10">
                                <h2 className="text-2xl font-display font-semibold text-white mb-4">2. Zakres zbieranych danych</h2>
                                <p className="mb-4">
                                    W ramach działalności strony zbierane są następujące dane osobowe:
                                </p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li>Imię i nazwisko</li>
                                    <li>Adres e-mail</li>
                                    <li>Numer telefonu</li>
                                    <li>Dane adresowe (w przypadku potrzeby wystawienia faktury)</li>
                                    <li>Informacje dotyczące rezerwacji (data, rodzaj sesji, lokalizacja)</li>
                                </ul>
                            </section>

                            <section className="mb-10">
                                <h2 className="text-2xl font-display font-semibold text-white mb-4">3. Cel przetwarzania danych</h2>
                                <p className="mb-4">
                                    Dane osobowe są przetwarzane w celu:
                                </p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li>Realizacji umów dotyczących usług fotograficznych oraz sprzedaży produktów cyfrowych (Kart Podarunkowych).</li>
                                    <li>Obsługi płatności elektronicznych.</li>
                                    <li>Kontaktu z klientami.</li>
                                    <li>Realizacji obowiązków prawnych (wystawianie faktur, księgowość).</li>
                                </ul>
                            </section>

                            <section className="mb-10">
                                <h2 className="text-2xl font-display font-semibold text-white mb-4">4. Podstawa prawna</h2>
                                <p className="mb-4">
                                    Dane osobowe przetwarzane są na podstawie rozporządzenia RODO:
                                </p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li>Art. 6 ust. 1 lit. b RODO – wykonanie umowy.</li>
                                    <li>Art. 6 ust. 1 lit. c RODO – obowiązek prawny (np. podatkowy).</li>
                                    <li>Art. 6 ust. 1 lit. f RODO – prawnie uzasadniony interes administratora (np. dochodzenie roszczeń).</li>
                                </ul>
                            </section>

                            <section className="mb-10">
                                <h2 className="text-2xl font-display font-semibold text-white mb-4">5. Odbiorcy danych</h2>
                                <p className="mb-4">
                                    Dane osobowe mogą być przekazywane podmiotom przetwarzającym je na nasze zlecenie (np. biuro księgowe, dostawca hostingu) oraz podmiotom uprawnionym na podstawie przepisów prawa.
                                </p>
                                <div className="bg-zinc-900 border-l-4 border-gold-400 p-4 my-6">
                                    <p className="font-semibold text-white mb-2">Płatności PayU:</p>
                                    <p>
                                        W przypadku wyboru płatności za pośrednictwem systemu PayU, Twoje dane osobowe niezbędne do realizacji płatności są przekazywane spółce <strong>PayU S.A.</strong> z siedzibą w Poznaniu (60-166), przy ul. Grunwaldzkiej 186, wpisanej do rejestru przedsiębiorców prowadzonego przez Sąd Rejonowy Poznań – Nowe Miasto i Wilda w Poznaniu, Wydział VIII Gospodarczy Krajowego Rejestru Sądowego pod numerem <strong>KRS 0000274399</strong>, NIP: 779-23-08-495.
                                    </p>
                                </div>
                            </section>

                            <section className="mb-10">
                                <h2 className="text-2xl font-display font-semibold text-white mb-4">6. Prawa użytkowników</h2>
                                <p className="mb-4">
                                    Przysługuje Ci prawo do:
                                </p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li>Dostępu do swoich danych oraz otrzymania ich kopii.</li>
                                    <li>Sprostowania (poprawiania) swoich danych.</li>
                                    <li>Usunięcia danych.</li>
                                    <li>Ograniczenia przetwarzania danych.</li>
                                    <li>Wniesienia sprzeciwu wobec przetwarzania danych.</li>
                                    <li>Przenoszenia danych.</li>
                                    <li>Wniesienia skargi do organu nadzorczego (Prezesa Urzędu Ochrony Danych Osobowych).</li>
                                </ul>
                            </section>
                        </div>
                    </>
                )}

                <section className="mt-12 rounded-2xl border border-gold-400/25 bg-zinc-900 p-6 text-zinc-300 md:p-8">
                    <h2 className="mb-4 font-display text-2xl font-semibold text-white">
                        Newsletter i komunikacja marketingowa
                    </h2>
                    <p className="mb-4">
                        Newsletter wysyłamy wyłącznie po zaznaczeniu oddzielnej, dobrowolnej zgody.
                        Brak zgody nie ogranicza możliwości wysłania zapytania, rezerwacji ani zakupu.
                    </p>
                    <ul className="mb-4 list-disc space-y-2 pl-6">
                        <li>Zakres danych: adres e-mail oraz techniczny dowód udzielenia zgody.</li>
                        <li>Cel: inspiracje fotograficzne, informacje o ofertach i wolnych terminach.</li>
                        <li>Podstawa: zgoda — art. 6 ust. 1 lit. a RODO.</li>
                        <li>Okres: do chwili wycofania zgody, a dowód jej historii zgodnie z terminami obrony roszczeń.</li>
                    </ul>
                    <p>
                        Zgodę można wycofać w ustawieniach konta lub przez odnośnik „Wypisz mnie”
                        w wiadomości. Wycofanie zgody nie wpływa na zgodność wcześniejszego przetwarzania
                        ani na wiadomości transakcyjne dotyczące zamówień, rezerwacji i umów.
                    </p>
                </section>
            </div>
        </main>
    );
}
