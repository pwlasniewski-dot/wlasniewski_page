import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/db/prisma';
import { Star, MapPin, Camera } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Fotografowie — Właśniewski',
    description: 'Poznaj naszych fotografów. Wybierz osobę pasującą do Twojej sesji.',
    alternates: { canonical: 'https://wlasniewski.pl/fotografowie' },
    robots: { index: true, follow: true },
};

export const dynamic = 'force-dynamic';

export default async function PhotographersDirectoryPage() {
    const profiles = await prisma.photographerProfile.findMany({
        where: { is_active: true, slug: { not: null } },
        include: { user: { select: { id: true, name: true, city: true } } },
        orderBy: { rating: 'desc' },
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-rose-50">
            <div className="max-w-6xl mx-auto px-4 py-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900">Nasi fotografowie</h1>
                    <p className="text-zinc-600 mt-3">Każdy ma swój styl. Wybierz osobę, z którą chcesz pracować.</p>
                </div>

                {profiles.length === 0 ? (
                    <div className="text-center text-zinc-500 py-20">Wkrótce dodamy fotografów.</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {profiles.map(p => {
                            const name = p.display_name || p.user?.name || 'Fotograf';
                            return (
                                <Link
                                    key={p.id}
                                    href={`/fotograf/${p.slug}`}
                                    className="group bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-lg hover:border-rose-300 transition overflow-hidden"
                                >
                                    <div className="relative aspect-[4/3] bg-gradient-to-br from-amber-100 to-rose-100">
                                        {p.avatar_url ? (
                                            <Image src={p.avatar_url} alt={name} fill className="object-cover group-hover:scale-105 transition" sizes="(max-width: 640px) 100vw, 33vw" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-white">
                                                {name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-zinc-900 text-lg">{name}</h3>
                                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-zinc-600">
                                            {p.user?.city && (
                                                <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-rose-500" /> {p.user.city}</span>
                                            )}
                                            <span className="inline-flex items-center gap-1"><Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {p.rating.toFixed(1)}</span>
                                            {p.experience_years && (
                                                <span className="inline-flex items-center gap-1"><Camera className="w-3 h-3" /> {p.experience_years}l</span>
                                            )}
                                        </div>
                                        {p.bio && <p className="text-sm text-zinc-600 mt-2 line-clamp-2">{p.bio}</p>}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
