const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Homepage SEO Content...');

    const homeSections = {
        hero_slider: [
            {
                id: "slide-1",
                title: "Fotografia Ślubna i Rodzinna",
                subtitle: "Naturalne emocje, bez sztucznego pozowania. Płużnica, Toruń, Bydgoszcz.",
                description: "Uwieczniam Wasze najpiękniejsze chwile w autentyczny sposób.",
                buttonText: "Zobacz ofertę ślubną",
                buttonLink: "/oferta/slub",
                image: "/uploads/hero-wedding.jpg", // Placeholder - user needs to pick real one
                enabled: true,
                order: 0,
                textAnimation: "fade"
            },
            {
                id: "slide-2",
                title: "Sesje Biznesowe i Wizerunkowe",
                subtitle: "Profesjonalny wizerunek dla Twojej marki.",
                description: "Zdjęcia, które budują zaufanie. Studio lub plener.",
                buttonText: "Buduj markę",
                buttonLink: "/oferta/biznes",
                image: "/uploads/hero-business.jpg",
                enabled: true,
                order: 1,
                textAnimation: "slide-up"
            },
            {
                id: "slide-3",
                title: "Fotografia z Drona",
                subtitle: "Inna perspektywa Twojej historii.",
                description: "Posiadam uprawnienia NSTS-01. Ujęcia lotnicze na ślubach i dla firm.",
                buttonText: "Sprawdź drona",
                buttonLink: "/oferta/dron",
                image: "/uploads/hero-drone.jpg",
                enabled: true,
                order: 2,
                textAnimation: "zoom-in"
            }
        ],
        sections: [
            {
                id: "about",
                type: "about",
                label: "O mnie - Płużnica",
                enabled: true,
                data: {
                    title: "Cześć, tu Twój sąsiad i fotograf",
                    content: "<p>Mieszkam w <strong>Płużnicy</strong> i to tutaj, pośród lokalnych krajobrazów, rodzą się moje najlepsze pomysły. Fotografia to dla mnie nie tylko praca, to pasja do łapania ulotnych momentów.</p><p>Obsługuję głównie województwo <strong>Kujawsko-Pomorskie</strong> (Toruń, Grudziądz, Wąbrzeźno, Chełmno, Świecie - do 75 km dojeżdżam błyskawicznie), ale dla dobrego kadru pojadę na koniec świata.</p><p>Specjalizuję się w <strong>fotografii ślubnej</strong>, ciepłych <strong>sesjach rodzinnych</strong> oraz profesjonalnych <strong>sesjach wizerunkowych</strong>. Jako inżynier z duszą artysty, łączę techniczną precyzję (np. w fotografii dronem) z wrażliwością na emocje.</p>",
                    image: "/images/about-me.jpg", // Placeholder
                    imageShape: "square",
                    textPosition: "left",
                    cta1Text: "Poznaj mnie lepiej",
                    cta1Link: "/o-mnie",
                    cta2Text: "Skontaktuj się",
                    cta2Link: "/kontakt"
                }
            },
            {
                id: "features",
                type: "features",
                label: "Moje Specjalizacje",
                enabled: true,
                data: {
                    features: [
                        {
                            id: "f-wedding",
                            title: "💍 Fotografia Ślubna",
                            items: ["Reportaż z dnia ślubu", "Sesje narzeczeńskie", "Plener w innym dniu", "Albumy premium"],
                            enabled: true
                        },
                        {
                            id: "f-family",
                            title: "👨‍👩‍👧‍👦 Sesje Rodzinne",
                            items: ["Lifestyle w domu", "Sesje ciążowe", "Pamiątka pokoleniowa", "Bez stresu dla dzieci"],
                            enabled: true
                        },
                        {
                            id: "f-business",
                            title: "👔 Wizerunek i Biznes",
                            items: ["Portrety biznesowe", "Fotografia wnętrz", "Personal branding", "Content do social media"],
                            enabled: true
                        },
                        {
                            id: "f-drone",
                            title: "🚁 Dron i Technika",
                            items: ["Ujęcia z powietrza", "Inspekcje techniczne", "Termowizja", "Uprawnienia NSTS-01"],
                            enabled: true
                        },
                        {
                            id: "f-events",
                            title: "🎉 Eventy i Imprezy",
                            items: ["18-stki i Urodziny", "Chrzty i Komunie", "Imprezy firmowe", "Wieczory panieńskie"],
                            enabled: true
                        },
                        {
                            id: "f-portrait",
                            title: "📸 Portret Kreatywny",
                            items: ["Sesje kobiece", "Portret męski", "Projekty artystyczne", "Dobre światło"],
                            enabled: true
                        }
                    ]
                }
            },
            {
                id: "parallax1",
                type: "parallax",
                label: "Parallax - Emocje",
                enabled: true,
                data: {
                    title: "Emocje, które zostają na zawsze",
                    image: "/uploads/parallax-emotion.jpg", // Placeholder
                    height: "min-h-[60vh] md:min-h-[80vh]",
                    parallaxSpeed: 0.5,
                    textAnimation: "scale",
                    floatingImage: true
                }
            },
            {
                id: "info_band",
                type: "info_band",
                label: "Obszar Działania",
                enabled: true,
                data: {
                    title: "Gdzie pracuję?",
                    content: "Główna baza to **Płużnica**, ale jestem mobilny w całym **Kujawsko-Pomorskim**. Toruń, Bydgoszcz, Grudziądz, Wąbrzeźno, Chełmno, Świecie - to moje codzienne trasy. Dojeżdżam wszędzie tam, gdzie dzieje się Twoja historia.",
                    image: "/uploads/map-region.jpg",
                    position: "right"
                }
            },
            {
                id: "challenge",
                type: "challenge_banner",
                label: "Wyzwanie Fotograficzne",
                enabled: true,
                data: {
                    title: "Podejmij Foto Wyzwanie!",
                    content: "Szukasz pomysłu na sesję? Sprawdź moje pakiety wyzwań - puzzle, zdrapki i niespodzianki.",
                    buttonText: "Chcę wyzwanie",
                    buttonLink: "/wyzwania",
                    effect: "puzzle",
                    photos: [],
                    advanced: {
                        enabled: false,
                        items: [],
                        config: { autoScroll: true, interval: 5, height: "600px" }
                    }
                }
            }
        ]
    };

    const page = await prisma.page.upsert({
        where: { id: 1 },
        update: {
            title: "Paweł Wwaśniewski - Fotograf Kujawsko-Pomorskie",
            meta_title: "Fotograf Płużnica, Toruń, Grudziądz | Śluby, Rodzina, Dron",
            meta_description: "Profesjonalna fotografia ślubna, rodzinna i biznesowa. Działam w Płużnicy, Toruniu, Grudziądzu i całym kujawsko-pomorskim. Sprawdź ofertę sesji i zdjęć z drona.",
            meta_keywords: "fotograf płużnica, fotograf toruń, fotograf grudziądz, fotografia ślubna kujawsko pomorskie, sesje rodzinne wąbrzeźno, zdjęcia z drona, fotograf na wesele, portret biznesowy",
            home_sections: JSON.stringify(homeSections),
            updated_at: new Date()
        },
        create: {
            slug: "home",
            title: "Paweł Wwaśniewski - Fotograf Kujawsko-Pomorskie",
            page_type: "home",
            content: "",
            is_published: true,
            meta_title: "Fotograf Płużnica, Toruń, Grudziądz | Śluby, Rodzina, Dron",
            meta_description: "Profesjonalna fotografia ślubna, rodzinna i biznesowa. Działam w Płużnicy, Toruniu, Grudziądzu i całym kujawsko-pomorskim. Sprawdź ofertę sesji i zdjęć z drona.",
            meta_keywords: "fotograf płużnica, fotograf toruń, fotograf grudziądz, fotografia ślubna kujawsko pomorskie, sesje rodzinne wąbrzeźno, zdjęcia z drona, fotograf na wesele, portret biznesowy",
            home_sections: JSON.stringify(homeSections)
        }
    });

    console.log('✅ Homepage updated:', page.title);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
