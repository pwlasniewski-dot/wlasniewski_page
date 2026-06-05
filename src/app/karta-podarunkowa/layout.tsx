import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Karta Podarunkowa na Sesję | Fotograf Toruń — Przemysław Właśniewski',
    description: 'Karta podarunkowa na sesję fotograficzną — idealny prezent dla bliskich. Sesje rodzinne, portretowe i komunijne w Toruniu i okolicach. Realizacja online od 100 zł.',
    alternates: {
        canonical: 'https://wlasniewski.pl/karta-podarunkowa',
    },
    openGraph: {
        title: 'Karta Podarunkowa na Sesję Fotograficzną | Fotograf Toruń',
        description: 'Karta podarunkowa na sesję fotograficzną — idealny prezent. Zrealizuj online. Od 100 zł.',
        url: 'https://wlasniewski.pl/karta-podarunkowa',
    },
};

export default function KartaPodarunkowaLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
