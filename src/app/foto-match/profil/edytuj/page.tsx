import { Metadata } from 'next';
import EditProfileForm from './EditProfileForm';

export const metadata: Metadata = {
    title: 'Foto-Match · Edycja profilu',
    robots: { index: false, follow: false },
};

export default function EditProfilePage() {
    return <EditProfileForm />;
}
