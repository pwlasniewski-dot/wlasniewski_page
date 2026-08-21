import type { Metadata } from 'next';
import Link from 'next/link';
import { AERO_SITE } from '@/lib/aeroanaliza/content';

export const metadata: Metadata = {
    title: 'Polityka prywatności i cookies — Aero Analiza',
    description: 'Informacje o przetwarzaniu danych osobowych i analityce w serwisie Aero Analiza.',
    alternates: { canonical: `${AERO_SITE.url}/polityka-prywatnosci` },
    robots: { index: false, follow: true },
    twitter: {
        card: 'summary',
        title: 'Polityka prywatności — Aero Analiza',
        description: 'Zasady przetwarzania danych i analityki w serwisie Aero Analiza.',
    },
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="space-y-3">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <div className="space-y-3 leading-relaxed text-zinc-300">{children}</div>
    </section>
);

export default function AeroPrivacyPage() {
    return (
        <main className="min-h-screen bg-[#07100f] px-4 py-16 text-zinc-200 md:px-6">
            <article className="mx-auto max-w-4xl space-y-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-12">
                <header>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">Aero Analiza</p>
                    <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl">Polityka prywatności i cookies</h1>
                    <p className="mt-4 text-zinc-400">Aktualizacja: 21 sierpnia 2026 r.</p>
                </header>

                <Section title="Administrator danych">
                    <p>Administratorem danych jest {AERO_SITE.legalName}, Płużnica, województwo kujawsko-pomorskie. Kontakt: <a className="text-emerald-300 underline" href={`mailto:${AERO_SITE.email}`}>{AERO_SITE.email}</a> lub <a className="text-emerald-300 underline" href={`tel:${AERO_SITE.phoneHref}`}>{AERO_SITE.phone}</a>.</p>
                </Section>

                <Section title="Zapytania ofertowe">
                    <p>Formularz może obejmować imię i nazwisko, firmę, e-mail, telefon, lokalizację i rodzaj obiektu, wybraną usługę, termin oraz opis potrzeby. Dane są używane do odpowiedzi, oceny wykonalności i przygotowania oferty — jako działania przed zawarciem umowy na żądanie osoby zainteresowanej (art. 6 ust. 1 lit. b RODO).</p>
                    <p>Dane są przechowywane przez okres potrzebny do obsługi zapytania, a następnie — jeżeli jest to konieczne — przez okres ustalenia lub obrony roszczeń. Podanie danych jest dobrowolne, ale pola oznaczone jako wymagane są potrzebne do odpowiedzi.</p>
                </Section>

                <Section title="Analityka i cookies">
                    <p>Pomiar zachowania na stronie i zewnętrzne narzędzia analityczne są uruchamiane dopiero po wyborze „Akceptuję” w ustawieniach cookies. Podstawą jest zgoda (art. 6 ust. 1 lit. a RODO), którą można wycofać przyciskiem „Ustawienia cookies”. Odrzucenie analityki nie blokuje formularza ani kontaktu.</p>
                    <p>Po wyrażeniu zgody mogą być mierzone m.in. odwiedzona podstrona, źródło kampanii i etapy formularza. Do zdarzeń lejka nie są dołączane imię, e-mail, telefon, nazwa firmy ani treść zapytania.</p>
                </Section>

                <Section title="Odbiorcy i prawa">
                    <p>Dane mogą być powierzane dostawcom hostingu, poczty i obsługi technicznej wyłącznie w zakresie potrzebnym do działania serwisu. Dostawcy analityki otrzymują dane tylko po zgodzie użytkownika i zgodnie z ich konfiguracją.</p>
                    <p>Możesz żądać dostępu, sprostowania, usunięcia, ograniczenia przetwarzania lub przeniesienia danych, wnieść sprzeciw albo wycofać zgodę. Przysługuje też skarga do Prezesa Urzędu Ochrony Danych Osobowych.</p>
                </Section>

                <Section title="Automatyzacja i sztuczna inteligencja">
                    <p>Serwis nie podejmuje automatycznych decyzji wywołujących skutki prawne wobec klientów. Zapytania, treści techniczne i możliwość wykonania usługi podlegają ocenie człowieka. Na stronie nie działa chatbot podszywający się pod człowieka ani generator wyników termowizyjnych.</p>
                </Section>

                <Link href="/" className="inline-flex rounded-full border border-emerald-300/30 px-5 py-3 font-semibold text-emerald-300 hover:bg-emerald-300/10">Wróć do Aero Analiza</Link>
            </article>
        </main>
    );
}
