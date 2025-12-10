import React from "react";
import Link from "next/link";

export default function PolitykaPrywatnosciPage() {
    return (
        <main className="min-h-screen bg-zinc-950 text-white selection:bg-gold-400 selection:text-black">
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

                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-8">Polityka Prywatności</h1>

                <div className="prose prose-invert max-w-none">
                    <section className="mb-8">
                        <h2 className="text-2xl font-display font-semibold text-gold-400 mb-4">1. Administrator danych</h2>
                        <p className="text-zinc-300 mb-4">
                            Administratorem danych osobowych zbieranych za pośrednictwem strony wlasniewski.pl jest Przemysław Właśniewski,
                            prowadzący działalność gospodarczą pod nazwą "Przemysław Właśniewski - Fotograf".
                        </p>
                        <p className="text-zinc-300 mb-4">
                            Kontakt: <a href="mailto:przemyslaw@wlasniewski.pl" className="text-gold-400 hover:underline">przemyslaw@wlasniewski.pl</a>,
                            tel. <a href="tel:+48530788694" className="text-gold-400 hover:underline">+48 530 788 694</a>
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-display font-semibold text-gold-400 mb-4">2. Zakres zbieranych danych</h2>
                        <p className="text-zinc-300 mb-4">
                            W ramach działalności strony zbierane są następujące dane osobowe:
                        </p>
                        <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
                            <li>Imię i nazwisko</li>
                            <li>Adres e-mail</li>
                            <li>Numer telefonu</li>
                            <li>Informacje dotyczące rezerwacji (data, rodzaj sesji, lokalizacja)</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-display font-semibold text-gold-400 mb-4">3. Cel przetwarzania danych</h2>
                        <p className="text-zinc-300 mb-4">
                            Dane osobowe są przetwarzane w celu:
                        </p>
                        <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
                            <li>Realizacji umów dotyczących usług fotograficznych</li>
                            <li>Kontaktu z klientami</li>
                            <li>Potwierdzenia rezerwacji</li>
                            <li>Wystawienia faktur</li>
                            <li>Marketingu bezpośredniego własnych usług (po uzyskaniu zgody)</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-display font-semibold text-gold-400 mb-4">4. Podstawa prawna</h2>
                        <p className="text-zinc-300 mb-4">
                            Dane osobowe przetwarzane są na podstawie:
                        </p>
                        <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
                            <li>Zgody osoby, której dane dotyczą (art. 6 ust. 1 lit. a RODO)</li>
                            <li>Wykonania umowy (art. 6 ust. 1 lit. b RODO)</li>
                            <li>Prawnie uzasadnionego interesu administratora (art. 6 ust. 1 lit. f RODO)</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-display font-semibold text-gold-400 mb-4">5. Prawa użytkowników</h2>
                        <p className="text-zinc-300 mb-4">
                            Każda osoba, której dane są przetwarzane, ma prawo do:
                        </p>
                        <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
                            <li>Dostępu do swoich danych</li>
                            <li>Sprostowania danych</li>
                            <li>Usunięcia danych</li>
                            <li>Ograniczenia przetwarzania</li>
                            <li>Przenoszenia danych</li>
                            <li>Wniesienia sprzeciwu wobec przetwarzania</li>
                            <li>Cofnięcia zgody w dowolnym momencie</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-display font-semibold text-gold-400 mb-4">6. Cookies</h2>
                        <p className="text-zinc-300 mb-4">
                            Strona wykorzystuje pliki cookies w celu zapewnienia prawidłowego działania oraz analizy statystyk odwiedzin.
                            Użytkownik może w dowolnym momencie zmienić ustawienia przeglądarki dotyczące plików cookies.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-display font-semibold text-gold-400 mb-4">7. Kontakt</h2>
                        <p className="text-zinc-300 mb-4">
                            W sprawach związanych z przetwarzaniem danych osobowych prosimy o kontakt:<br />
                            Email: <a href="mailto:przemyslaw@wlasniewski.pl" className="text-gold-400 hover:underline">przemyslaw@wlasniewski.pl</a>
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
