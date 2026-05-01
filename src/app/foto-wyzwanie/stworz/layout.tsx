import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Stwórz Foto Wyzwanie — wybierz pakiet i osobę | Przemysław Właśniewski',
    description:
        'Wybierz pakiet sesji fotograficznej, wpisz dane osoby, którą chcesz zaprosić, i stwórz Foto Wyzwanie w 3 minuty. Toruń, Bydgoszcz, kujawsko-pomorskie.',
    alternates: { canonical: 'https://wlasniewski.pl/foto-wyzwanie/stworz' },
    robots: {
        index: false, // formularz — nie indeksujemy, Google ma trafiać na /foto-wyzwanie
        follow: true,
    },
};

export default function StworzLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
