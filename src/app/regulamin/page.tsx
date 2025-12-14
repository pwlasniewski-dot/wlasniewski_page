import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-black text-white pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center text-zinc-500 hover:text-gold-400 mb-8 transition-colors group font-sans text-sm tracking-widest uppercase"
                >
                    <svg className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    Powrót
                </Link>

                <h1 className="text-4xl md:text-5xl font-display font-bold text-gold-400 mb-8">
                    Regulamin Świadczenia Usług
                </h1>

                <div className="prose prose-invert prose-lg max-w-none space-y-8 text-zinc-300">
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">I. Informacje o Sprzedawcy</h2>
                        <p>
                            Właścicielem serwisu internetowego działającego pod adresem <strong>wlasniewski.pl</strong> jest:
                        </p>
                        <p className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                            <strong>FOTO-DRON Przemysław Właśniewski</strong><br />
                            Adres: <span className="text-gold-400">Płużnica 47g, 87-214 Płużnica</span><br />
                            NIP: <span className="text-gold-400">8781430365</span><br />
                            REGON: <span className="text-gold-400">871237704</span><br />
                            <br />
                            <strong>Kontakt:</strong><br />
                            E-mail: <a href="mailto:pwlasniewski@gmail.com" className="text-gold-400 hover:underline">pwlasniewski@gmail.com</a><br />
                            Telefon: <a href="tel:+48530788694" className="text-gold-400 hover:underline">+48 530 788 694</a>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">II. Rodzaje i zakres usług</h2>
                        <p>
                            Sprzedawca oferuje za pośrednictwem serwisu:
                        </p>
                        <ul className="list-disc list-inside space-y-2">
                            <li>Usługi fotograficzne (sesje zdjęciowe, reportaże).</li>
                            <li>Sprzedaż produktów cyfrowych w postaci Kart Podarunkowych (voucherów).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">III. Płatności i realizacja zamówień</h2>
                        <ol className="list-decimal list-inside space-y-4">
                            <li>
                                <strong>Metody płatności:</strong> Klient może dokonać płatności za pomocą:
                                <ul className="list-disc list-inside ml-6 mt-2 text-zinc-400">
                                    <li>Systemu płatności online PayU (karty płatnicze, szybkie przelewy).</li>
                                    <li>Przelewu tradycyjnego na konto bankowe.</li>
                                </ul>
                            </li>
                            <li>
                                <strong>Czas realizacji zamówienia:</strong>
                                <ul className="list-disc list-inside ml-6 mt-2 text-zinc-400">
                                    <li>Karty Podarunkowe (produkty cyfrowe): wysyłane są automatycznie na adres e-mail podany w zamówieniu niezwłocznie po zaksięgowaniu płatności (zazwyczaj w ciągu kilku minut do 24h).</li>
                                    <li>Usługi fotograficzne: termin realizacji (oddania gotowych zdjęć) określany jest indywidualnie w umowie lub ofercie, standardowo wynosi od 14 do 30 dni roboczych od dnia wykonania sesji.</li>
                                </ul>
                            </li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">IV. Odstąpienie od umowy i zwroty</h2>
                        <p>
                            1. Klient będący konsumentem ma prawo odstąpić od umowy zawartej na odległość w terminie <strong>14 dni</strong> bez podania przyczyny.
                        </p>
                        <p>
                            2. Aby skorzystać z prawa odstąpienia od umowy, Klient musi poinformować Sprzedawcę o swojej decyzji w drodze jednoznacznego oświadczenia (np. pismo wysłane pocztą elektroniczną na adres {process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'kontakt@wlasniewski.pl'}).
                        </p>
                        <p>
                            3. <strong>Zwrot środków:</strong> W przypadku odstąpienia od umowy Sprzedawca zwraca Klientowi wszystkie otrzymane od niego płatności niezwłocznie, a w każdym przypadku nie później niż 14 dni od dnia, w którym Sprzedawca został poinformowany o decyzji Klienta. Zwrot płatności dokonywany jest przy użyciu takich samych sposobów płatności, jakie zostały użyte przez Klienta w pierwotnej transakcji.
                        </p>
                        <p>
                            4. <strong>Wyjątki od prawa odstąpienia:</strong> Prawo do odstąpienia od umowy nie przysługuje Konsumentowi w odniesieniu do umów:<br />
                            a) o świadczenie usług, za które konsument jest zobowiązany do zapłaty ceny, jeżeli przedsiębiorca wykonał w pełni usługę za wyraźną i uprzednią zgodą konsumenta, który został poinformowany przed rozpoczęciem świadczenia, że po spełnieniu świadczenia przez przedsiębiorcę utraci prawo odstąpienia od umowy.<br />
                            b) o dostarczanie treści cyfrowych niedostarczanych na nośniku materialnym (np. Karta Podarunkowa wysłana mailem), za które konsument jest zobowiązany do zapłaty ceny, jeżeli przedsiębiorca rozpoczął świadczenie za wyraźną i uprzednią zgodą konsumenta.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">V. Reklamacje</h2>
                        <p>
                            1. Sprzedawca zobowiązany jest do dostarczenia rzeczy (oraz treści cyfrowych) wolnych od wad.
                        </p>
                        <p>
                            2. W przypadku stwierdzenia wadliwości usługi lub produktu, Klient ma prawo złożyć reklamację.
                        </p>
                        <p>
                            3. Reklamacje należy składać drogą elektroniczną na adres e-mail: <strong>{process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'kontakt@wlasniewski.pl'}</strong> lub pisemnie na adres siedziby firmy.
                        </p>
                        <p>
                            4. Zgłoszenie reklamacyjne powinno zawierać dane Klienta, opis wady oraz żądanie Klienta.
                        </p>
                        <p>
                            5. Sprzedawca ustosunkuje się do reklamacji Klienta niezwłocznie, nie później niż w terminie <strong>14 dni</strong> od dnia jej otrzymania. Odpowiedź na reklamację zostanie przesłana na podany przez Klienta adres e-mail bądź adres korespondencyjny.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">VI. Wymagania techniczne</h2>
                        <p>
                            Do korzystania z serwisu, w tym do zakupu i realizacji Kart Podarunkowych, niezbędne są:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-zinc-400">
                            <li>Urządzenie końcowe z dostępem do sieci Internet.</li>
                            <li>Aktualna wersja przeglądarki internetowej.</li>
                            <li>Aktywne konto poczty elektronicznej (e-mail).</li>
                            <li>Oprogramowanie umożliwiające odczyt plików w formacie PDF (dla Kart Podarunkowych).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">VII. Ochrona danych osobowych</h2>
                        <p>
                            Administratorem danych osobowych jest Sprzedawca. Szczegółowe informacje dotyczące przetwarzania danych osobowych znajdują się w zakładce <Link href="/polityka-prywatnosci" className="text-gold-400 hover:underline">Polityka Prywatności</Link>.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
