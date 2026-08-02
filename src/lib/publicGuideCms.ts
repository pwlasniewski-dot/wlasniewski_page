import { z } from 'zod';
import { isAllowedPublicMediaUrl } from '@/lib/publicMediaUrl';

export const PUBLIC_GUIDE_PAGE_SLUG = 'jak-sie-ubrac';

const text = (max: number) => z.string().trim().min(1).max(max);
const imageSchema = z.object({
    src: z.string().trim().max(2048).refine(isAllowedPublicMediaUrl, 'Wybierz obraz z biblioteki Media'),
    alt: text(300),
    caption: text(1000),
});

const cardSchema = z.object({
    title: text(160),
    description: text(1200),
    image: imageSchema,
});

export const publicGuideCmsSchema = z.object({
    version: z.literal(1),
    hero: imageSchema,
    wardrobe: imageSchema,
    people: imageSchema,
    environments: z.array(cardSchema).length(3),
    posing: z.array(cardSchema).length(5),
    poseGallery: z.array(cardSchema).length(10),
});

export type PublicGuideImage = z.infer<typeof imageSchema>;
export type PublicGuideCmsData = z.infer<typeof publicGuideCmsSchema>;

const poseImage = (file: string, title: string, caption: string): PublicGuideImage => ({
    src: `/images/public-guide/pose-cards/${file}`,
    alt: `Rodzina podczas sesji zdjęciowej — ${title.toLowerCase()}`,
    caption,
});

export function defaultPublicGuideCmsData(): PublicGuideCmsData {
    return {
        version: 1,
        hero: poseImage('szeroki-kadr-z-otoczeniem.webp', 'szeroki kadr w parku', 'Rodzina w jasnych, skoordynowanych ubraniach dopasowanych do zieleni i architektury parku.'),
        wardrobe: poseImage('piknik-na-trawie.webp', 'piknik na trawie', 'Różne fasony łączy jedna spokojna paleta: biel, beż i delikatny błękit.'),
        people: poseImage('bliski-uscisk.webp', 'bliski uścisk', 'Spójne, ale nieidentyczne ubrania pozwalają skupić uwagę na twarzach i relacji.'),
        environments: [
            { title: 'Miasto', description: 'Krem, grafit, granat, karmel i bordo dobrze współpracują z kamieniem, szkłem i cegłą. Przy kolorowym muralu uprość ubrania.', image: poseImage('szeroki-kadr-z-otoczeniem.webp', 'stylizacja miejska', 'Jasne neutralne ubrania pozostają czytelne na tle miejskiej architektury.') },
            { title: 'Natura', description: 'Oliwka, piaskowy beż, rdza, błękit i przygaszony róż łączą się z zielenią, trawą i wodą bez efektu kamuflażu.', image: poseImage('przy-kwiatach.webp', 'stylizacja w naturze', 'Biel, beż i błękit uspokajają bogate, zielone i kwiatowe tło.') },
            { title: 'Dom i spokojne wnętrze', description: 'Powtórz 1–2 odcienie z wnętrza, ale nie zlewaj się z kanapą. Miękkie faktury i jasne warstwy budują bliski klimat.', image: poseImage('smiech-na-lawce.webp', 'spokojna stylizacja rodzinna', 'Naturalne tkaniny i jasne warstwy dobrze pracują w spokojnym, bliskim kadrze.') },
        ],
        posing: [
            { title: 'Stanie i spacer', description: 'Stań lekko po skosie albo rusz powoli. Drobny ruch wygląda swobodniej niż zatrzymanie w idealnej linii.', image: poseImage('szeroki-kadr-z-otoczeniem.webp', 'stanie i spacer', 'Spokojny spacer daje naturalną pracę dłoni i ciała.') },
            { title: 'Siedzenie', description: 'Usiądź wygodnie i zostaw między osobami niewielkie różnice wysokości. Bliskość porządkuje kadr.', image: poseImage('piknik-na-trawie.webp', 'siedzenie', 'Siedzenie na kocu pozwala rodzinie naturalnie zwrócić się ku sobie.') },
            { title: 'Dłonie', description: 'Oprzyj dłoń lekko o kolano, ubranie albo ramię bliskiej osoby. Palce zostaw miękkie.', image: poseImage('smiech-na-lawce.webp', 'naturalne dłonie', 'Kontakt z bliską osobą daje dłoniom naturalne miejsce.') },
            { title: 'Barki i głowa', description: 'Ustaw jeden bark nieco bliżej aparatu i kieruj spojrzenie na bliską osobę zamiast cały czas w obiektyw.', image: poseImage('przy-stawie.webp', 'barki i głowa', 'Lekkie skręty sylwetki i spojrzenia między osobami tworzą swobodny kadr.') },
            { title: 'Pary i rodziny', description: 'Idźcie, rozmawiajcie albo zajmijcie się dzieckiem. Wspólne zadanie wygląda naturalniej niż równy szereg.', image: poseImage('ruch-na-polanie.webp', 'rodzina w ruchu', 'Ruch i reakcja na dziecko budują energię zdjęcia.') },
        ],
        poseGallery: [
            ['piknik-na-trawie.webp', 'Piknik na trawie', 'Usiądźcie blisko, ale nie w równym szeregu. Rozmowa i drobne spojrzenia dają naturalniejszy efekt niż patrzenie cały czas w aparat.'],
            ['smiech-na-lawce.webp', 'Śmiech na ławce', 'Część rodziny może usiąść, a pozostali miękko domknąć kadr z boków. Najważniejsza jest wspólna reakcja.'],
            ['przy-stawie.webp', 'Przy stawie', 'Barierka daje dłoniom proste zadanie. Stańcie lekko po skosie i zostawcie między sobą trochę oddechu.'],
            ['przy-kwiatach.webp', 'Przy kwiatach', 'Jedna osoba może zainteresować się otoczeniem, a reszta spokojnie skupić uwagę na niej.'],
            ['ruch-na-polanie.webp', 'Ruch na polanie', 'Nie zatrzymujcie kroku idealnie w tym samym momencie. Swobodny ruch i reakcja na dziecko budują energię kadru.'],
            ['rozne-wysokosci.webp', 'Różne wysokości', 'Schodki, murek lub krawędź rabaty pomagają ustawić osoby na kilku poziomach i dodać zdjęciu głębi.'],
            ['miedzy-drzewami.webp', 'Między drzewami', 'Nie stójcie wszyscy w jednej linii. Drzewa naturalnie dzielą plan i pomagają stworzyć luźniejszą kompozycję.'],
            ['bliski-uscisk.webp', 'Bliski uścisk', 'Podejdźcie naprawdę blisko i oprzyjcie głowę lub dłoń o kogoś bliskiego. Po przytuleniu zostańcie tak jeszcze chwilę.'],
            ['z-psem.webp', 'Z psem', 'Zejdźcie do poziomu pupila i skupcie się na kontakcie z nim. Nie oczekujcie, że będzie idealnie patrzył w aparat.'],
            ['szeroki-kadr-z-otoczeniem.webp', 'Szeroki kadr z otoczeniem', 'Zostawcie wokół siebie przestrzeń i idźcie spokojnie. Taki kadr pokazuje również klimat miejsca.'],
        ].map(([file, title, description]) => ({ title, description, image: poseImage(file, title, description) })),
    };
}

export function parsePublicGuideCmsData(value: unknown): PublicGuideCmsData | null {
    let candidate = value;
    if (typeof candidate === 'string') {
        try { candidate = JSON.parse(candidate); } catch { return null; }
    }
    const parsed = publicGuideCmsSchema.safeParse(candidate);
    return parsed.success ? parsed.data : null;
}
