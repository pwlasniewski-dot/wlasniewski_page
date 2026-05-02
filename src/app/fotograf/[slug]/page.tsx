import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/db/prisma';
import { Star, MapPin, Camera, Calendar, Heart, Trophy, Mail } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getProfile(slug: string) {
    return prisma.photographerProfile.findFirst({
        where: { slug, is_active: true },
        include: { user: { select: { id: true, name: true, email: true, city: true } } },
    });
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;
    const p = await getProfile(slug);
    if (!p) return { title: 'Fotograf — Właśniewski' };
    const name = p.display_name || p.user?.name || 'Fotograf';
    return {
        title: `${name} — Fotograf | Właśniewski`,
        description: p.bio?.slice(0, 160) || `${name} — fotograf w katalogu Właśniewski Foto.`,
        openGraph: {
            title: `${name} — Fotograf`,
            description: p.bio?.slice(0, 160) || '',
            images: p.avatar_url ? [p.avatar_url] : undefined,
        },
    };
}

export default async function PublicPhotographerPage(
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const profile = await getProfile(slug);
    if (!profile) notFound();

    const name = profile.display_name || profile.user?.name || 'Fotograf';
    const specialties = profile.specialties?.split(',').map(s => s.trim()).filter(Boolean) || [];

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-rose-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Hero */}
                <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 sm:p-8 mb-6">
                    <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-amber-100 shadow-lg flex-shrink-0">
                            {profile.avatar_url ? (
                                <Image src={profile.avatar_url} alt={name} fill className="object-cover" sizes="128px" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center text-white text-4xl font-bold">
                                    {name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900">{name}</h1>
                            <div className="flex flex-wrap gap-3 justify-center sm:justify-start mt-2 text-sm text-zinc-600">
                                {profile.user?.city && (
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin className="w-4 h-4 text-rose-500" /> {profile.user.city}
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1">
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {profile.rating.toFixed(1)}
                                </span>
                                {profile.experience_years && (
                                    <span className="inline-flex items-center gap-1">
                                        <Camera className="w-4 h-4 text-zinc-500" /> {profile.experience_years} lat doświadczenia
                                    </span>
                                )}
                            </div>
                            {specialties.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-3 justify-center sm:justify-start">
                                    {specialties.map(s => (
                                        <span key={s} className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">{s}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {profile.bio && (
                        <div className="mt-6 pt-6 border-t border-zinc-100">
                            <p className="text-zinc-700 leading-relaxed whitespace-pre-line">{profile.bio}</p>
                        </div>
                    )}
                </div>

                {/* Action cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {profile.available_for_bookings && profile.user && (
                        <Link
                            href={`/rezerwacja?photographer=${profile.user.id}`}
                            className="group bg-white rounded-2xl border border-zinc-200 p-5 hover:border-rose-400 hover:shadow-md transition shadow-sm"
                        >
                            <Calendar className="w-8 h-8 text-rose-500 mb-2" />
                            <h3 className="font-bold text-zinc-900">Zarezerwuj sesję</h3>
                            <p className="text-sm text-zinc-500 mt-1">Wybierz pakiet i termin</p>
                        </Link>
                    )}
                    {profile.available_for_foto_match && profile.user && (
                        <Link
                            href={`/foto-match?photographer=${profile.user.id}`}
                            className="group bg-white rounded-2xl border border-zinc-200 p-5 hover:border-rose-400 hover:shadow-md transition shadow-sm"
                        >
                            <Heart className="w-8 h-8 text-rose-500 mb-2" />
                            <h3 className="font-bold text-zinc-900">Foto-match</h3>
                            <p className="text-sm text-zinc-500 mt-1">Wspólna sesja na 4 ręce</p>
                        </Link>
                    )}
                    {profile.available_for_challenges && profile.user && (
                        <Link
                            href={`/foto-wyzwania?photographer=${profile.user.id}`}
                            className="group bg-white rounded-2xl border border-zinc-200 p-5 hover:border-amber-400 hover:shadow-md transition shadow-sm"
                        >
                            <Trophy className="w-8 h-8 text-amber-500 mb-2" />
                            <h3 className="font-bold text-zinc-900">Foto-wyzwania</h3>
                            <p className="text-sm text-zinc-500 mt-1">Dołącz do wyzwania</p>
                        </Link>
                    )}
                </div>

                {/* Contact */}
                {profile.user?.email && (
                    <div className="mt-6 bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
                        <h3 className="font-bold text-zinc-900 mb-2 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-amber-600" /> Kontakt
                        </h3>
                        <a href={`mailto:${profile.user.email}`} className="text-rose-600 hover:underline">{profile.user.email}</a>
                    </div>
                )}
            </div>
        </div>
    );
}
