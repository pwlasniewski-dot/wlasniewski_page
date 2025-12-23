const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Guide Page (Jak się ubrać)...');

    const contentCards = [
        {
            id: "card-wedding",
            icon: "heart", // Will be mapped to emoji in frontend
            title: "Na Sesję Narzeczeńską",
            description: "Postawcie na spójność, ale nie identyczność. Zwiewna sukienka dla Niej, lniana koszula dla Niego. Unikajcie dużych napisów i jaskrawych neonów.",
            enabled: true
        },
        {
            id: "card-family",
            icon: "home",
            title: "Sesja Rodzinna",
            description: "Wygoda to podstawa, zwłaszcza dla dzieci. Kolory ziemi (beże, brązy, zielenie) świetnie wyglądają w plenerze. Dżins zawsze się sprawdza.",
            enabled: true
        },
        {
            id: "card-business",
            icon: "briefcase",
            title: "Sesja Wizerunkowa",
            description: "Business Casual zazwyczaj wygrywa. Dobrze skrojona marynarka, gładka koszula. Unikaj drobnych wzorków (kratka, pepitka), które mogą 'migać' na ekranie.",
            enabled: true
        }
    ];

    const colorPalettes = [
        {
            id: "palette-earth",
            title: "Kolory Ziemi",
            description: "Idealne do sesji plenerowych w lesie czy na łące.",
            colors: [
                { name: "Beż", hex: "#D4B996" },
                { name: "Oliwka", hex: "#556B2F" },
                { name: "Brąz", hex: "#8B4513" },
                { name: "Kremowy", hex: "#FFFDD0" },
                { name: "Szary", hex: "#808080" }
            ],
            tips: "Te kolory pięknie współgrają z naturą i nie odwracają uwagi od twarzy."
        },
        {
            id: "palette-classic",
            title: "Klasyczna Elegancja",
            description: "Do sesji biznesowych i miejskich.",
            colors: [
                { name: "Granat", hex: "#000080" },
                { name: "Biel", hex: "#FFFFFF" },
                { name: "Czarny", hex: "#000000" },
                { name: "Szary", hex: "#A9A9A9" },
                { name: "Błękit", hex: "#ADD8E6" }
            ],
            tips: "Klasyka zawsze się obroni. Pamiętaj, że czerń może czasem przytłaczać, warto ją przełamać."
        }
    ];

    const page = await prisma.page.upsert({
        where: { slug: "jak-sie-ubrac" },
        update: {
            title: "Jak się ubrać na sesję zdjęciową? Poradnik",
            content: `
        <h2>Dlaczego strój jest tak ważny?</h2>
        <p>Jako fotograf często powtarzam: to Wy jesteście najważniejsi, nie ubrania. Jednak <strong>odpowiedni strój potrafi zdziałać cuda</strong>. Buduje pewność siebie, podkreśla Wasz charakter i sprawia, że zdjęcia stają się spójną, piękną historią.</p>
        
        <h3>Złota zasada: Komfort</h3>
        <p>Niezależnie od tego, czy robimy sesję ślubną w Toruniu, rodzinną w Wąbrzeźnie czy biznesową w Grudziądzu – <strong>musicie czuć się swobodnie</strong>. Jeśli coś was gniecie, drapie lub jest za ciasne, będzie to widać na zdjęciach. Uśmiech znika, pojawia się napięcie. Wybierzcie ubrania, w których czujecie się sobą.</p>

        <h3>Sesje Rodzinne – Spójność bez "Mundurków"</h3>
        <p>Kiedyś modne były białe koszulki i dżinsy dla całej rodziny. Dziś odchodzimy od tego na rzecz <strong>spójnej palety barw</strong>. Nie musicie wyglądać jak klony! Wystarczy, że 2-3 kolory będą się powtarzać w Waszych stylizacjach. Mama w beżowej sukience, Tata w brązowych spodniach, Syn w kremowej koszulce – to brzmi jak plan!</p>
        
        <h3>Unikajcie tego jak ognia!</h3>
        <ul>
            <li><strong>Wielkich logotypów</strong> – nie jesteśmy słupami reklamowymi (chyba że to sesja dla konkretnej marki).</li>
            <li><strong>Jaskrawych neonów</strong> – odwracają uwagę od twarzy i mogą rzucać dziwne zafarby na skórę.</li>
            <li><strong>Zbyt drobnych wzorków</strong> – w przypadku sesji biznesowych (tzw. efekt mory).</li>
        </ul>

        <p>Pamiętajcie, to tylko wskazówki. Najważniejsze jest Wasze samopoczucie. Jeśli macie ulubioną czerwoną sukienkę, w której czujecie się jak milion dolarów – bierzcie ją! Pewność siebie jest zawsze fotogeniczna.</p>
      `,
            meta_title: "Jak się ubrać na sesję? Poradnik Fotografa | Kujawsko-Pomorskie",
            meta_description: "Nie wiesz co ubrać na sesję ślubną, rodzinną czy biznesową? Sprawdź moje sprawdzone porady. Kolory, fasony i triki, dzięki którym wyjdziesz na zdjęciach świetnie.",
            meta_keywords: "jak się ubrać na sesję, stylizacja do sesji, porady fotografa, sesja rodzinna ubiór, sesja biznesowa strój, sesja narzeczeńska stylizacje",
            content_cards: JSON.stringify(contentCards),
            content_images: JSON.stringify(colorPalettes),
            page_type: "guide",
            is_published: true,
            updated_at: new Date()
        },
        create: {
            slug: "jak-sie-ubrac",
            title: "Jak się ubrać na sesję zdjęciową? Poradnik",
            content: `
        <h2>Dlaczego strój jest tak ważny?</h2>
        <p>Jako fotograf często powtarzam: to Wy jesteście najważniejsi, nie ubrania. Jednak <strong>odpowiedni strój potrafi zdziałać cuda</strong>. Buduje pewność siebie, podkreśla Wasz charakter i sprawia, że zdjęcia stają się spójną, piękną historią.</p>
        
        <h3>Złota zasada: Komfort</h3>
        <p>Niezależnie od tego, czy robimy sesję ślubną w Toruniu, rodzinną w Wąbrzeźnie czy biznesową w Grudziądzu – <strong>musicie czuć się swobodnie</strong>. Jeśli coś was gniecie, drapie lub jest za ciasne, będzie to widać na zdjęciach. Uśmiech znika, pojawia się napięcie. Wybierzcie ubrania, w których czujecie się sobą.</p>

        <h3>Sesje Rodzinne – Spójność bez "Mundurków"</h3>
        <p>Kiedyś modne były białe koszulki i dżinsy dla całej rodziny. Dziś odchodzimy od tego na rzecz <strong>spójnej palety barw</strong>. Nie musicie wyglądać jak klony! Wystarczy, że 2-3 kolory będą się powtarzać w Waszych stylizacjach. Mama w beżowej sukience, Tata w brązowych spodniach, Syn w kremowej koszulce – to brzmi jak plan!</p>
        
        <h3>Unikajcie tego jak ognia!</h3>
        <ul>
            <li><strong>Wielkich logotypów</strong> – nie jesteśmy słupami reklamowymi (chyba że to sesja dla konkretnej marki).</li>
            <li><strong>Jaskrawych neonów</strong> – odwracają uwagę od twarzy i mogą rzucać dziwne zafarby na skórę.</li>
            <li><strong>Zbyt drobnych wzorków</strong> – w przypadku sesji biznesowych (tzw. efekt mory).</li>
        </ul>

        <p>Pamiętajcie, to tylko wskazówki. Najważniejsze jest Wasze samopoczucie. Jeśli macie ulubioną czerwoną sukienkę, w której czujecie się jak milion dolarów – bierzcie ją! Pewność siebie jest zawsze fotogeniczna.</p>
      `,
            meta_title: "Jak się ubrać na sesję? Poradnik Fotografa | Kujawsko-Pomorskie",
            meta_description: "Nie wiesz co ubrać na sesję ślubną, rodzinną czy biznesową? Sprawdź moje sprawdzone porady. Kolory, fasony i triki, dzięki którym wyjdziesz na zdjęciach świetnie.",
            meta_keywords: "jak się ubrać na sesję, stylizacja do sesji, porady fotografa, sesja rodzinna ubiór, sesja biznesowa strój, sesja narzeczeńska stylizacje",
            content_cards: JSON.stringify(contentCards),
            content_images: JSON.stringify(colorPalettes),
            page_type: "guide",
            is_published: true
        }
    });

    console.log('✅ Guide page updated:', page.title);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
