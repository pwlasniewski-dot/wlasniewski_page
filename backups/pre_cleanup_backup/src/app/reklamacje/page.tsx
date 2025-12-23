import React from "react";
import Link from "next/link";

export default function ReklamacjePage() {
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

                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-8">Reklamacje</h1>

                <div className="prose prose-invert max-w-none prose-lg text-zinc-300">
                    <section className="mb-10">
                        <h2 className="text-2xl font-display font-semibold text-white mb-4">1. Zasady składania reklamacji</h2>
                        <p className="mb-4">
                            Dbam o najwyższą jakość świadczonych usług. Jeśli jednak usługa lub produkt (np. Karta Podarunkowa) nie spełnia Twoich oczekiwań lub jest niezgodny z umową, masz prawo złożyć reklamację.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-display font-semibold text-white mb-4">2. Termin i forma zgłoszenia</h2>
                        <p className="mb-4">
                            Reklamację możesz złożyć w dowolnej formie, najlepiej pisemnie lub drogą mailową. Zalecam zgłoszenie reklamacji niezwłocznie po zauważeniu wady.
                        </p>
                        <p className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                            <strong>Dane do zgłoszeń reklamacyjnych:</strong><br />
                            E-mail: <a href="mailto:pwlasniewski@gmail.com" className="text-gold-400 hover:underline">pwlasniewski@gmail.com</a><br />
                            Telefon: <a href="tel:+48530788694" className="text-gold-400 hover:underline">+48 530 788 694</a>
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-display font-semibold text-white mb-4">3. Co powinno zawierać zgłoszenie?</h2>
                        <ul className="list-disc list-inside space-y-2">
                            <li>Twoje imię i nazwisko.</li>
                            <li>Dane kontaktowe (e-mail, telefon).</li>
                            <li>Opis problemu / wady.</li>
                            <li>Twoje oczekiwania (np. naprawa, ponowne wykonanie usługi, zwrot części kosztów).</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-display font-semibold text-white mb-4">4. Czas rozpatrzenia</h2>
                        <p className="mb-4">
                            Na Twoją reklamację ustosunkuję się w terminie do <strong>14 dni</strong> od dnia jej otrzymania. Odpowiedź otrzymasz tą samą drogą, którą wpłynęło zgłoszenie (zazwyczaj mailem).
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
