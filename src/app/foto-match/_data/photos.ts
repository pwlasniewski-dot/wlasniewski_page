/**
 * Galeria stylu dla landingu Foto-Match.
 *
 * UWAGA ETYKA: Zdjęcia pochodzą z autorskiego portfolio Przemysława Właśniewskiego
 * (folder "Rodzina" — plenery, sylwetki, atmosferyczne ujęcia). Pokazujemy je jako
 * PRZYKŁADY JAKOŚCI FOTOGRAFII, NIE jako referencje uczestników Foto-Match.
 * Jasny disclaimer pod galerią obowiązkowy.
 */

export interface GalleryPhoto {
    src: string;
    alt: string;
    caption?: string;
}

const S3 = 'https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com';

export const HERO_BG = `${S3}/1766740544961-sesja-rodzinna-torun-bulwar-filadelfijski-zlotagodzina-2025-07.webp`;

export const STYLE_GALLERY: GalleryPhoto[] = [
    {
        src: `${S3}/1766740544961-sesja-rodzinna-torun-bulwar-filadelfijski-zlotagodzina-2025-07.webp`,
        alt: 'Sesja w plenerze podczas złotej godziny — Bulwar Filadelfijski w Toruniu',
        caption: 'Złota godzina · Toruń',
    },
    {
        src: `${S3}/1766740534311-sesja-rodzinna-torun-bulwar-filadelfijski-kadr-szeroki-2025-06.webp`,
        alt: 'Szeroki kadr nad Wisłą — Bulwar Filadelfijski',
        caption: 'Bulwar Filadelfijski',
    },
    {
        src: `${S3}/1766740577844-sesja-rodzinna-torun-zamek-krzyzacki-przytulenie-2025-03.webp`,
        alt: 'Bliskość i przytulenie podczas sesji przy Zamku Krzyżackim',
        caption: 'Zamek Krzyżacki · Toruń',
    },
    {
        src: `${S3}/1766740555027-sesja-rodzinna-torun-starowka-fograf-torun-2025-09.webp`,
        alt: 'Sesja na toruńskiej starówce — naturalny portret w mieście',
        caption: 'Starówka · Toruń',
    },
    {
        src: `${S3}/1766740549606-sesja-rodzinna-torun-most-stary-sylwetki-2025-08.webp`,
        alt: 'Sylwetki na Moście Starym o zmierzchu',
        caption: 'Most Stary · zmierzch',
    },
    {
        src: `${S3}/1766740565349-sesja-rodzinna-torun-uliczki-spacer-noc-2025-10.webp`,
        alt: 'Spacer nocnymi uliczkami starówki — atmosferyczne ujęcie miejskie',
        caption: 'Uliczki nocą',
    },
    {
        src: `${S3}/1766740560848-sesja-rodzinna-torun-starowka-spacer-2025-01.webp`,
        alt: 'Spacer po starówce — naturalna sesja w ruchu',
        caption: 'Spacer · Starówka',
    },
    {
        src: `${S3}/1766740539694-sesja-rodzinna-torun-bulwar-filadelfijski-kadr-szeroki-2025-08.webp`,
        alt: 'Sesja nad Wisłą — szeroki kadr i przestrzeń',
        caption: 'Nad Wisłą',
    },
];
