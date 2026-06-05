import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Zarezerwuj Sesję | Fotograf Toruń — Przemysław Właśniewski',
    description: 'Zarezerwuj sesję fotograficzną online. Wybierz usługę, pakiet i termin. Sesje rodzinne, ślubne i portretowe w Toruniu i okolicach. Płatność bezpieczna przez Stripe.',
    alternates: {
        canonical: 'https://wlasniewski.pl/rezerwacja',
    },
    openGraph: {
        title: 'Zarezerwuj Sesję | Fotograf Toruń',
        description: 'Zarezerwuj sesję fotograficzną online. Wybierz usługę, pakiet i termin. Sesje w Toruniu i okolicach.',
        url: 'https://wlasniewski.pl/rezerwacja',
    },
};

export default function RezerwacjaLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
