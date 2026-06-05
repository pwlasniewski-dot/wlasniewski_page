import prisma from '@/lib/db/prisma';
import Image from 'next/image';
import type { Metadata } from 'next';

export const revalidate = 60; // Revalidate every minute

export const metadata: Metadata = {
    title: 'Historia | Archiwum Sesji Fotograficznych — Fotograf Toruń',
    description: 'Archiwum fotograficzne Przemysława Właśniewskiego — fotografi rodzinne, ślubne i biznesowe z lat pracy w Toruniu i okolicach. Chronologiczna historia sesji.',
    alternates: {
        canonical: 'https://wlasniewski.pl/historia',
    },
};

export default async function HistoryPage() {
    let photos: any[] = [];
    try {
        photos = await prisma.historyPhoto.findMany({
            orderBy: {
                filename: 'asc'
            }
        });
    } catch (e: any) {
        // If table doesn't exist (P2021), return empty array to allow build to pass.
        // This happens when deployment runs before migration.
        if (e.code === 'P2021') {
            console.warn('History table missing, skipping fetch during build.');
            photos = [];
        } else {
            throw e;
        }
    }

    return (
        <div className="min-h-screen pt-32 pb-20 container mx-auto px-4">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-display mb-4">Historia Fotografii — Archiwum Sesji</h1>
                <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
                    Archiwum fotograficzne Przemysława Właśniewskiego — sesje rodzinne, ślubne i biznesowe z Torunia i okolic, ułożone chronologicznie.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {photos.map((photo) => (
                    <div key={photo.id} className="relative aspect-[3/2] group overflow-hidden rounded-lg bg-zinc-900">
                        <Image
                            src={photo.url}
                            alt={photo.filename}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <span className="text-white text-sm font-medium truncate w-full">
                                {photo.filename}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {photos.length === 0 && (
                <div className="text-center py-20 text-zinc-500">
                    Brak zdjęć w historii.
                </div>
            )}
        </div>
    );
}
