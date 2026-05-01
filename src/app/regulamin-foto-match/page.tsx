import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Heart, AlertTriangle, MessageSquare, Camera, Lock, FileText, Phone } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Regulamin Foto-Match | Przemysław Właśniewski',
    description: 'Zasady programu Foto-Match: weryfikacja, bezpieczeństwo, model release, RODO i polityka spotkań.',
};

export default function RegulaminFotoMatchPage() {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <Link href="/foto-match" className="text-amber-400 text-sm hover:underline">← Foto-Match</Link>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mt-4 mb-2">Regulamin Foto-Match</h1>
                <p className="text-sm text-zinc-400 mb-10">Wersja 1.0 · obowiązuje od 1 maja 2026.</p>

                <Section icon={<Heart className="w-6 h-6 text-rose-400" />} title="Czym jest Foto-Match">
                    <p>Foto-Match to program łączący dwie pełnoletnie osoby (model + model) na wspólną sesję zdjęciową w atelier Przemysława Właśniewskiego w Toruniu.</p>
                    <p>Nie jest to portal randkowy. Celem jest <strong>twórcza sesja zdjęciowa</strong> — nie umawianie się na randki.</p>
                </Section>

                <Section icon={<ShieldCheck className="w-6 h-6 text-amber-400" />} title="Kto może dołączyć">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Osoby <strong>pełnoletnie (18+)</strong>. Wymagamy oświadczenia + weryfikujemy wiek na zdjęciach.</li>
                        <li>Osoby z aktywnym kontem klienta na wlasniewski.pl.</li>
                        <li>Osoby z <strong>zweryfikowanym numerem telefonu</strong> (kod SMS) — nie pokazujemy numeru innym, służy tylko do potwierdzenia tożsamości.</li>
                    </ul>
                </Section>

                <Section icon={<Camera className="w-6 h-6 text-amber-400" />} title="Weryfikacja profilu">
                    <p>Każdy profil sprawdza administrator. Patrzymy na:</p>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li>czy selfie zgadza się ze zdjęciami profilowymi (czy to ta sama osoba),</li>
                        <li>czy zdjęcia są zgodne z zasadami (brak nagości, broni, narkotyków, agresji),</li>
                        <li>czy opis i bio są zgodne z prawdą.</li>
                    </ul>
                    <p className="text-sm text-zinc-400 mt-3">
                        <strong>Nie zbieramy skanów dowodów osobistych</strong> — opieramy się o weryfikację telefonem i selfie (RODO data minimization).
                    </p>
                </Section>

                <Section icon={<MessageSquare className="w-6 h-6 text-emerald-400" />} title="Match + wiadomości">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Wysyłasz „like". Druga osoba też cię polubi → match → możecie pisać.</li>
                        <li>Maks. 2000 znaków na wiadomość. Limit 30 wiadomości / minutę.</li>
                        <li>Możesz w każdej chwili kogoś <strong>zablokować</strong> lub <strong>zgłosić</strong> (przycisk na profilu).</li>
                        <li>Po 3 zgłoszeniach (kategoria PENDING) profil jest <strong>automatycznie zawieszany</strong> do czasu sprawdzenia.</li>
                    </ul>
                </Section>

                <Section icon={<AlertTriangle className="w-6 h-6 text-rose-400" />} title="Czego NIE wolno">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Tworzyć fałszywych profili / podszywać się pod kogoś innego.</li>
                        <li>Wysyłać treści wulgarnych, seksualnych, gróźb, mowy nienawiści.</li>
                        <li>Spamować, sprzedawać usługi, reklamować zewnętrzne strony.</li>
                        <li>Wynosić rozmów / zdjęć poza platformę bez zgody drugiej osoby.</li>
                        <li>Kontaktować się prywatnie z osobami, które cię zablokowały.</li>
                    </ul>
                    <p className="text-sm mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-200">
                        Złamanie zasad = <strong>SUSPEND lub DELETE</strong> profilu, brak refundacji opłat. Najpoważniejsze sprawy zgłaszamy na policję.
                    </p>
                </Section>

                <Section icon={<Camera className="w-6 h-6 text-amber-400" />} title="Sesja zdjęciowa (Model Release)">
                    <p>Po match-u możecie umówić sesję. Przed sesją <strong>oboje musicie podpisać Model Release</strong> w aplikacji (zgoda na publikację, portfolio, marketing — każde osobno).</p>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li>Bez zgody obu osób fotograf <strong>nie publikuje</strong> zdjęć z sesji.</li>
                        <li>Możesz wycofać zgodę w dowolnym momencie w panelu klienta — zdjęcia zostaną zdjęte z portfolio w ciągu 7 dni.</li>
                    </ul>
                </Section>

                <Section icon={<FileText className="w-6 h-6 text-amber-400" />} title="Płatność i refundacje">
                    <p>Sesja jest płatna z góry przez PayU. Polityka anulowania:</p>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li><strong>≥ 7 dni</strong> przed sesją: zwrot 100%.</li>
                        <li><strong>3-6 dni</strong> przed sesją: zwrot 50%.</li>
                        <li><strong>&lt; 3 dni</strong>: brak zwrotu (chyba że losowy wypadek — admin decyduje indywidualnie).</li>
                    </ul>
                    <p className="text-sm text-zinc-400 mt-3">Anulowanie odbywa się przez panel klienta lub maila do admina.</p>
                </Section>

                <Section icon={<Lock className="w-6 h-6 text-amber-400" />} title="Twoje dane (RODO)">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Możesz w dowolnej chwili <strong>pobrać wszystkie swoje dane</strong> (JSON) — panel klienta → eksport RODO.</li>
                        <li>Możesz <strong>usunąć konto</strong> → panel klienta → usuń konto. Email anonimizujemy, profil oznaczamy jako DELETED.</li>
                        <li>Po 30 dniach od usunięcia twardo czyścimy dane (cron).</li>
                        <li>Numer telefonu, IP weryfikacji, czas akceptacji regulaminu — przechowujemy tylko do celów dowodowych zgody.</li>
                    </ul>
                </Section>

                <Section icon={<Phone className="w-6 h-6 text-amber-400" />} title="Kontakt + zgłoszenia">
                    <p>Email: <a href="mailto:kontakt@wlasniewski.pl" className="text-amber-400 underline">kontakt@wlasniewski.pl</a></p>
                    <p className="mt-2">Wszystkie zgłoszenia naruszeń odpowiadamy w ciągu 48h roboczych.</p>
                </Section>

                <div className="mt-12 p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm">
                    <p className="font-semibold text-amber-300 mb-2">Krótko mówiąc:</p>
                    <p>Bądź sobą. Bądź miły. Szanuj zgodę drugiej osoby. Nie publikuj nic bez pytania. Jak coś nie gra — zgłoś przez aplikację, nie pisz hejtu w komentarzach FB.</p>
                </div>

                <p className="text-xs text-zinc-600 mt-8 text-center">
                    Patrz też: <Link href="/polityka-prywatnosci" className="underline">polityka prywatności</Link> · <Link href="/regulamin" className="underline">regulamin ogólny serwisu</Link>
                </p>
            </div>
        </div>
    );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <section className="mb-8 p-5 rounded-xl bg-zinc-900 border border-zinc-800">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-3">{icon} {title}</h2>
            <div className="text-zinc-300 space-y-2 leading-relaxed">{children}</div>
        </section>
    );
}
