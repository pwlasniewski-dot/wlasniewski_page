import prisma from '@/lib/db/prisma';
import { Metadata } from 'next';
import InviteClient from './InviteClient';

interface Props {
    params: Promise<{ unique_link: string }>;
}

async function getChallenge(uniqueLink: string) {
    try {
        const challenge = await prisma.photoChallenge.findUnique({
            where: { unique_link: uniqueLink },
            include: {
                package: true,
                location: true,
            },
        });
        return challenge;
    } catch (error) {
        console.error('Error fetching challenge for metadata:', error);
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { unique_link } = await params;
    const challenge = await getChallenge(unique_link);

    if (!challenge) {
        return {
            title: 'Zaproszenie nie odnalezione | Foto Wyzwanie',
        };
    }

    const title = `${challenge.inviter_name} zaprasza Cię na Foto Wyzwanie! 📸`;
    const description = `Hej! ${challenge.inviter_name} rzucił Ci fotograficzne wyzwanie. Czeka na Ciebie sesja: ${challenge.package?.name || 'Wyjątkowa pamiątka'}. Kliknij, aby zobaczyć szczegóły!`;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    // Using a nice placeholder/generic image if none specific. 
    // Ideally, this would be a professional photo from assets.
    const ogImage = `${baseUrl}/assets/placeholder.jpg`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: 'Foto Wyzwanie - Zaproszenie',
                },
            ],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
        },
    };
}

export default async function InvitePage({ params }: Props) {
    const { unique_link } = await params;
    const challenge = await getChallenge(unique_link);

    // Pass as plain object to client component
    const initialData = challenge ? {
        ...challenge,
        package: challenge.package ? {
            package_name: challenge.package.name,
            package_description: challenge.package.description || undefined,
            challenge_price: challenge.package.challenge_price,
        } : undefined,
        location: challenge.location ? {
            location_name: challenge.location.name,
            location_description: challenge.location.description || undefined,
        } : undefined,
    } : null;

    return <InviteClient initialChallenge={initialData as any} uniqueLink={unique_link} />;
}
