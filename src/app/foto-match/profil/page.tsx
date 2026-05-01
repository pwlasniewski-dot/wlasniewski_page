/**
 * Foto-Match: strona profilu zalogowanego klienta.
 * Pokazuje status weryfikacji, zdjęcia, dane, link do edycji.
 */
import type { Metadata } from 'next';
import ProfileView from './ProfileView';

export const metadata: Metadata = {
    title: 'Mój profil Foto-Match',
    robots: { index: false, follow: false },
};

export default function ProfilPage() {
    return (
        <main className="min-h-screen bg-zinc-950 text-white">
            <ProfileView />
        </main>
    );
}
