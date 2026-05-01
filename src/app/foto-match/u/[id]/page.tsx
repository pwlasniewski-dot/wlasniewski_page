import { Metadata } from 'next';
import ProfilePublicView from './ProfilePublicView';

export const metadata: Metadata = {
    title: 'Foto-Match · Profil',
    robots: { index: false, follow: false },
};

export default function FotoMatchProfilePage({ params }: { params: { id: string } }) {
    return <ProfilePublicView id={params.id} />;
}
