import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Stwórz Foto Wyzwanie — formularz | Przemysław Właśniewski',
    description: 'Wypełnij formularz, wybierz pakiet i osobę, opłać sesję — gotowe.',
    robots: { index: false, follow: true },
};

export default function CreateLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
