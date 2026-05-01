import { Metadata } from 'next';
import DiscoverClient from './DiscoverClient';

export const metadata: Metadata = {
    title: 'Odkryj — Foto-Match',
    robots: { index: false, follow: false },
};

export default function DiscoverPage() {
    return <DiscoverClient />;
}
