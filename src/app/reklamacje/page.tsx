import React from "react";
import Link from "next/link";

export default function ReklamacjePage() {
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

                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-8">Reklamacje</h1>

                <div className="prose prose-invert max-w-none">
                    <section className="mb-8">
                        <h2 className="text-2xl font-display font-semibold text-gold-400 mb-4">1. Zasady składania reklamacji</h2>
                        <p className="text-zinc-300 mb-4">
                            Klienci mają prawo do złożenia reklamacji dotyczącej świadczonych usług fotograficznych.
                            Reklamacja powinna zawierać opis problemu oraz oczekiwania klienta.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-display font-semibold text-gold-400 mb-4">2. Termin składania reklamacji</h2>
                        <p className="text-zinc-300 mb-4">
                            Reklamacje dotyczące jakości usług powinny być zgłaszane w terminie 14 dni od daty odbioru zdjęć
                            lub innych materiałów będących przedmiotem umowy.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-display font-semibold text-gold-400 mb-4">3. Sposób składania reklamacji</h2>
                        <p className="text-zinc-300 mb-4">
                            Reklamacje można składać:
                        </p>
                        <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
                            <li>E-mail: <a href="mailto:przemyslaw@wlasniewski.pl" className="text-gold-400 hover:underline">przemyslaw@wlasniewski.pl</a></li>
                            <li>Telefonicznie: <a href="tel:+48530788694" className="text-gold-400 hover:underline">+48 530 788 694</a></li>
                            <li>Za pośrednictwem formularza kontaktowego na stronie</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-display font-semibold text-gold-400 mb-4">4. Rozpatrzenie reklamacji</h2>
                        <p className="text-zinc-300 mb-4">
                            Reklamacje są rozpatrywane w terminie do 14 dni od dnia jej otrzymania.
                            O sposobie rozpatrzenia reklamacji klient zostanie poinformowany mailowo lub telefonicznie.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-display font-semibold text-gold-400 mb-4">5. Możliwości rozwiązania sporu</h2>
                        <p className="text-zinc-300 mb-4">
                            W przypadku nierozwiązania sporu na drodze polubownej, klient ma prawo do skorzystania
                            z pozasądowych sposobów rozpatrywania reklamacji i dochodzenia roszczeń, zgodnie z obowiązującymi przepisami.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-display font-semibold text-gold-400 mb-4">6. Kontakt</h2>
                        <p className="text-zinc-300 mb-4">
                            W sprawie reklamacji prosimy o kontakt:<br />
                            Email: <a href="mailto:przemyslaw@wlasniewski.pl" className="text-gold-400 hover:underline">przemyslaw@wl asniewski.pl</a><br />
                            Tel: <a href="tel:+48530788694" className="text-gold-400 hover:underline">+48 530 788 694</a>
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
