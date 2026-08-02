import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';

const supportedCities = [
    'torun',
    'grudziadz',
    'chelmno',
    'wabrzezno',
    'bydgoszcz',
    'swiecie',
    'lisewo',
    'pluznica',
] as const;

const supportedCitySet = new Set<string>(supportedCities);

interface PageProps {
    params: Promise<{ city: string }>;
}

export function generateStaticParams() {
    return supportedCities.map(city => ({ city }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { city } = await params;

    if (!supportedCitySet.has(city)) {
        return { robots: { index: false, follow: false } };
    }

    return {
        alternates: { canonical: `https://wlasniewski.pl/fotograf-${city}` },
        robots: { index: false, follow: true },
    };
}

export default async function LegacyCityPage({ params }: PageProps) {
    const { city } = await params;

    if (!supportedCitySet.has(city)) {
        notFound();
    }

    permanentRedirect(`/fotograf-${city}`);
}
