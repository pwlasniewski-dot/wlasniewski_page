import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db/prisma';
import { getSiteUrl } from '@/lib/site-url';
import InviteLandingActions from './InviteLandingActions';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ token: string }>;
}

async function loadInvite(token: string) {
    const ref = await prisma.fotoMatchReferral.findUnique({
        where: { invite_token: token },
        include: {
            referrer: {
                select: {
                    display_name: true,
                    city: true,
                    photos: {
                        where: { ai_status: 'APPROVED' },
                        orderBy: { position: 'asc' },
                        take: 1,
                        select: { url: true },
                    },
                },
            },
        },
    });
    if (!ref) return null;

    const settings = await prisma.fotoMatchMatchSettings.findFirst({ orderBy: { id: 'asc' } });
    return {
        referrerName: ref.referrer.display_name,
        city: ref.referrer.city,
        avatar: ref.referrer.photos[0]?.url || null,
        bonus: {
            enabled: settings?.referral_bonus_enabled ?? false,
            amount_grosze: settings?.referral_bonus_amount_grosze ?? 0,
            percent: settings?.referral_bonus_percent ?? 0,
            type: settings?.referral_bonus_type ?? 'AMOUNT',
        },
    };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { token } = await params;
    const data = await loadInvite(token);
    const site = getSiteUrl();
    const ogUrl = `${site}/api/og/foto-match-referral/${token}`;
    const url = `${site}/foto-match/i/${token}`;

    const title = data
        ? `${data.referrerName} zaprasza Cię do Foto-Match`
        : 'Foto-Match — znajdź parę do sesji zdjęciowej';
    const description = data?.bonus.enabled
        ? `Dołącz przez zaproszenie i odbierz bonus na pierwszą sesję. ${data.referrerName}${data.city ? ` z ${data.city}` : ''} już jest w środku.`
        : 'Poznaj osoby z Twojej okolicy, które chcą wspólnie pozować przed obiektywem.';

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            siteName: 'Foto-Match · wlasniewski.pl',
            type: 'website',
            locale: 'pl_PL',
            images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogUrl],
        },
    };
}

function bonusLabel(b: { type: string; amount_grosze: number; percent: number }) {
    if (b.type === 'PERCENT') return `-${b.percent}%`;
    if (b.type === 'BOTH') return `${(b.amount_grosze / 100).toFixed(0)} zł + ${b.percent}%`;
    return `${(b.amount_grosze / 100).toFixed(0)} zł`;
}

export default async function InviteLandingPage({ params }: PageProps) {
    const { token } = await params;
    const data = await loadInvite(token);
    if (!data) notFound();

    const initials = data.referrerName.slice(0, 2).toUpperCase();
    const site = getSiteUrl();
    const shareUrl = `${site}/foto-match/i/${token}`;

    return (
        <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 text-white">
            {/* Decoracyjne blob */}
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-amber-400/30 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -left-32 w-[500px] h-[500px] rounded-full bg-pink-500/40 blur-3xl pointer-events-none" />

            <div className="relative max-w-3xl mx-auto px-6 pt-12 pb-20">
                {/* Brand */}
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 to-pink-400 flex items-center justify-center text-2xl shadow-lg">
                        📸
                    </div>
                    <div>
                        <p className="text-lg font-extrabold leading-none">Foto-Match</p>
                        <p className="text-xs text-white/80">wlasniewski.pl</p>
                    </div>
                </div>

                {/* Hero card */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 md:p-10 shadow-2xl">
                    <div className="flex items-center gap-4 mb-6">
                        {data.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={data.avatar}
                                alt={data.referrerName}
                                className="w-16 h-16 rounded-full object-cover ring-4 ring-white/40"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 to-pink-400 flex items-center justify-center text-xl font-black text-white ring-4 ring-white/40">
                                {initials}
                            </div>
                        )}
                        <div>
                            <p className="text-sm uppercase tracking-wide text-white/80 font-semibold">
                                💌 Zaproszenie od
                            </p>
                            <p className="text-2xl font-extrabold">
                                {data.referrerName}
                                {data.city && <span className="text-white/85 font-medium"> · {data.city}</span>}
                            </p>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
                        Znajdź parę do sesji zdjęciowej.
                    </h1>
                    <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed">
                        Foto-Match łączy ludzi, którzy chcą wspólnie stanąć przed obiektywem —
                        w plenerze, w studio, w Twoim mieście.
                    </p>

                    {data.bonus.enabled && (
                        <div className="bg-white text-zinc-900 rounded-2xl p-5 mb-8 flex items-center gap-4 shadow-xl">
                            <div className="text-4xl">🎁</div>
                            <div>
                                <p className="text-xs uppercase font-bold text-zinc-500">Bonus powitalny</p>
                                <p className="text-2xl font-black">
                                    {bonusLabel(data.bonus)} <span className="font-semibold text-zinc-700">na pierwszą sesję</span>
                                </p>
                            </div>
                        </div>
                    )}

                    <Link
                        href={`/foto-match/onboarding?ref=${token}`}
                        className="block w-full text-center bg-white text-purple-700 font-black text-lg py-4 rounded-2xl hover:bg-amber-300 hover:text-zinc-900 transition shadow-xl"
                    >
                        Dołączam — załóż profil za darmo
                    </Link>

                    <p className="text-center text-xs text-white/70 mt-4">
                        Profile weryfikowane ręcznie · Bezpieczne · Anonimowe do momentu dopasowania
                    </p>
                </div>

                {/* Share dla osoby zaproszonej (też niech udostępnia!) */}
                <InviteLandingActions shareUrl={shareUrl} referrerName={data.referrerName} token={token} />

                {/* Footer */}
                <div className="mt-10 text-center text-xs text-white/70">
                    <Link href="/foto-match" className="underline hover:text-white">
                        O programie Foto-Match
                    </Link>
                    {' · '}
                    <Link href="/regulamin" className="underline hover:text-white">
                        Regulamin
                    </Link>
                </div>
            </div>
        </main>
    );
}
