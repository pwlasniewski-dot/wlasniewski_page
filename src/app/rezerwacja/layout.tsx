import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Rezerwacja Fotografii | Przemysław Właśniewski',
    description: 'Sprawdź zakres reportażu, wybierz pakiet i wolny termin. Sesje rodzinne, uroczystości i fotografia ślubna w Toruniu, Grudziądzu i regionie. Bezpieczna płatność online przez PayU.',
    alternates: {
        canonical: 'https://wlasniewski.pl/rezerwacja',
    },
    openGraph: {
        title: 'Rezerwacja fotografii | Właśniewski',
        description: 'Wybierz usługę, zakres fotografowania i dogodny termin. Jasne pakiety oraz bezpieczna płatność przez PayU.',
        url: 'https://wlasniewski.pl/rezerwacja',
    },
};

export default function RezerwacjaLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
