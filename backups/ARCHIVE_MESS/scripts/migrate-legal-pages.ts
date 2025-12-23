
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const privacyPolicyContent = `
<div class="prose prose-invert max-w-none">
    <section class="mb-8">
        <h2 class="text-2xl font-display font-semibold text-gold-400 mb-4">1. Administrator danych</h2>
        <p class="text-zinc-300 mb-4">
            Administratorem danych osobowych zbieranych za pośrednictwem strony wlasniewski.pl jest Przemysław Właśniewski,
            prowadzący działalność gospodarczą pod nazwą "Przemysław Właśniewski - Fotograf".
        </p>
        <p class="text-zinc-300 mb-4">
            Kontakt: <a href="mailto:kontakt@wlasniewski.pl" class="text-gold-400 hover:underline">kontakt@wlasniewski.pl</a>,
            tel. <a href="tel:+48530788694" class="text-gold-400 hover:underline">+48 530 788 694</a>
        </p>
    </section>

    <section class="mb-8">
        <h2 class="text-2xl font-display font-semibold text-gold-400 mb-4">2. Zakres zbieranych danych</h2>
        <p class="text-zinc-300 mb-4">
            W ramach działalności strony zbierane są następujące dane osobowe:
        </p>
        <ul class="list-disc list-inside text-zinc-300 mb-4 space-y-2">
            <li>Imię i nazwisko</li>
            <li>Adres e-mail</li>
            <li>Numer telefonu</li>
            <li>Informacje dotyczące rezerwacji (data, rodzaj sesji, lokalizacja)</li>
        </ul>
    </section>

    <section class="mb-8">
        <h2 class="text-2xl font-display font-semibold text-gold-400 mb-4">3. Cel przetwarzania danych</h2>
        <p class="text-zinc-300 mb-4">
            Dane osobowe są przetwarzane w celu:
        </p>
        <ul class="list-disc list-inside text-zinc-300 mb-4 space-y-2">
            <li>Realizacji umów dotyczących usług fotograficznych</li>
            <li>Kontaktu z klientami</li>
            <li>Potwierdzenia rezerwacji</li>
            <li>Wystawienia faktur</li>
            <li>Marketingu bezpośredniego własnych usług (po uzyskaniu zgody)</li>
        </ul>
    </section>

    <section class="mb-8">
        <h2 class="text-2xl font-display font-semibold text-gold-400 mb-4">4. Podstawa prawna</h2>
        <p class="text-zinc-300 mb-4">
            Dane osobowe przetwarzane są na podstawie:
        </p>
        <ul class="list-disc list-inside text-zinc-300 mb-4 space-y-2">
            <li>Zgody osoby, której dane dotyczą (art. 6 ust. 1 lit. a RODO)</li>
            <li>Wykonania umowy (art. 6 ust. 1 lit. b RODO)</li>
            <li>Prawnie uzasadnionego interesu administratora (art. 6 ust. 1 lit. f RODO)</li>
        </ul>
    </section>

    <section class="mb-8">
        <h2 class="text-2xl font-display font-semibold text-gold-400 mb-4">5. Prawa użytkowników</h2>
        <p class="text-zinc-300 mb-4">
            Każda osoba, której dane są przetwarzane, ma prawo do:
        </p>
        <ul class="list-disc list-inside text-zinc-300 mb-4 space-y-2">
            <li>Dostępu do swoich danych</li>
            <li>Sprostowania danych</li>
            <li>Usunięcia danych</li>
            <li>Ograniczenia przetwarzania</li>
            <li>Przenoszenia danych</li>
            <li>Wniesienia sprzeciwu wobec przetwarzania</li>
            <li>Cofnięcia zgody w dowolnym momencie</li>
        </ul>
    </section>

    <section class="mb-8">
        <h2 class="text-2xl font-display font-semibold text-gold-400 mb-4">6. Cookies</h2>
        <p class="text-zinc-300 mb-4">
            Strona wykorzystuje pliki cookies w celu zapewnienia prawidłowego działania oraz analizy statystyk odwiedzin.
            Użytkownik może w dowolnym momencie zmienić ustawienia przeglądarki dotyczące plików cookies.
        </p>
    </section>

    <section class="mb-8">
        <h2 class="text-2xl font-display font-semibold text-gold-400 mb-4">7. Kontakt</h2>
        <p class="text-zinc-300 mb-4">
            W sprawach związanych z przetwarzaniem danych osobowych prosimy o kontakt:<br />
            Email: <a href="mailto:kontakt@wlasniewski.pl" class="text-gold-400 hover:underline">kontakt@wlasniewski.pl</a>
        </p>
    </section>
</div>
`;

const complaintsContent = `
<div class="prose prose-invert max-w-none">
    <section class="mb-8">
        <h2 class="text-2xl font-display font-semibold text-gold-400 mb-4">1. Zasady składania reklamacji</h2>
        <p class="text-zinc-300 mb-4">
            Klienci mają prawo do złożenia reklamacji dotyczącej świadczonych usług fotograficznych.
            Reklamacja powinna zawierać opis problemu oraz oczekiwania klienta.
        </p>
    </section>

    <section class="mb-8">
        <h2 class="text-2xl font-display font-semibold text-gold-400 mb-4">2. Termin składania reklamacji</h2>
        <p class="text-zinc-300 mb-4">
            Reklamacje dotyczące jakości usług powinny być zgłaszane w terminie 14 dni od daty odbioru zdjęć
            lub innych materiałów będących przedmiotem umowy.
        </p>
    </section>

    <section class="mb-8">
        <h2 class="text-2xl font-display font-semibold text-gold-400 mb-4">3. Sposób składania reklamacji</h2>
        <p class="text-zinc-300 mb-4">
            Reklamacje można składać:
        </p>
        <ul class="list-disc list-inside text-zinc-300 mb-4 space-y-2">
            <li>E-mail: <a href="mailto:kontakt@wlasniewski.pl" class="text-gold-400 hover:underline">kontakt@wlasniewski.pl</a></li>
            <li>Telefonicznie: <a href="tel:+48530788694" class="text-gold-400 hover:underline">+48 530 788 694</a></li>
            <li>Za pośrednictwem formularza kontaktowego na stronie</li>
        </ul>
    </section>

    <section class="mb-8">
        <h2 class="text-2xl font-display font-semibold text-gold-400 mb-4">4. Rozpatrzenie reklamacji</h2>
        <p class="text-zinc-300 mb-4">
            Reklamacje są rozpatrywane w terminie do 14 dni od dnia jej otrzymania.
            O sposobie rozpatrzenia reklamacji klient zostanie poinformowany mailowo lub telefonicznie.
        </p>
    </section>

    <section class="mb-8">
        <h2 class="text-2xl font-display font-semibold text-gold-400 mb-4">5. Możliwości rozwiązania sporu</h2>
        <p class="text-zinc-300 mb-4">
            W przypadku nierozwiązania sporu na drodze polubownej, klient ma prawo do skorzystania
            z pozasądowych sposobów rozpatrywania reklamacji i dochodzenia roszczeń, zgodnie z obowiązującymi przepisami.
        </p>
    </section>

    <section class="mb-8">
        <h2 class="text-2xl font-display font-semibold text-gold-400 mb-4">6. Kontakt</h2>
        <p class="text-zinc-300 mb-4">
            W sprawie reklamacji prosimy o kontakt:<br />
            Email: <a href="mailto:kontakt@wlasniewski.pl" class="text-gold-400 hover:underline">kontakt@wlasniewski.pl</a><br />
            Tel: <a href="tel:+48530788694" class="text-gold-400 hover:underline">+48 530 788 694</a>
        </p>
    </section>
</div>
`;

async function main() {
    console.log('Starting migration of legal pages...');

    // 1. Privacy Policy
    const privacyPage = await prisma.page.upsert({
        where: { slug: 'polityka-prywatnosci' },
        update: {}, // Don't overwrite if exists, or maybe we should? For now, safety first.
        create: {
            title: 'Polityka Prywatności',
            slug: 'polityka-prywatnosci',
            content: privacyPolicyContent,
            is_published: true,
            page_type: 'regular',
            meta_title: 'Polityka Prywatności | Przemysław Właśniewski',
            meta_description: 'Polityka prywatności i zasady przetwarzania danych osobowych.',
        },
    });
    console.log(`Privacy Policy page handled: ${privacyPage.slug}`);

    // If it existed but content was empty, update it
    if (!privacyPage.content) {
        await prisma.page.update({
            where: { id: privacyPage.id },
            data: { content: privacyPolicyContent },
        });
        console.log('Updated empty content for Privacy Policy');
    }

    // 2. Complaints (Reklamacje)
    const complaintsPage = await prisma.page.upsert({
        where: { slug: 'reklamacje' },
        update: {},
        create: {
            title: 'Reklamacje',
            slug: 'reklamacje',
            content: complaintsContent,
            is_published: true,
            page_type: 'regular',
            meta_title: 'Reklamacje | Przemysław Właśniewski',
            meta_description: 'Zasady składania i rozpatrywania reklamacji.',
        },
    });
    console.log(`Complaints page handled: ${complaintsPage.slug}`);

    if (!complaintsPage.content) {
        await prisma.page.update({
            where: { id: complaintsPage.id },
            data: { content: complaintsContent },
        });
        console.log('Updated empty content for Complaints');
    }

    console.log('Migration completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
