import type { Metadata } from 'next';
import ChildLab from '@/components/physics-lab/ChildLab';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Moje Laboratorium Fizyki',
    description: 'Osobiste misje, doświadczenia i testy z fizyki.',
    robots: { index: false, follow: false, nocache: true },
};

export default async function PhysicsLabProfilePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    return <ChildLab token={token} />;
}
