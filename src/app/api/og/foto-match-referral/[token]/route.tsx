/**
 * Foto-Match — dynamic Open Graph image dla linku polecającego.
 * Renderuje 1200x630 PNG z brandingiem, bonusem i imieniem polecającego.
 * To jest co Facebook / Instagram / Messenger / WhatsApp / iMessage zaciągną
 * jako rich preview — KLUCZOWE dla CTR.
 */
import { ImageResponse } from 'next/og';
import prisma from '@/lib/db/prisma';

export const runtime = 'nodejs';

interface Ctx {
    params: Promise<{ token: string }>;
}

function formatBonus(s: {
    type: string;
    amount_grosze: number;
    percent: number;
}): string {
    if (s.type === 'PERCENT') return `-${s.percent}%`;
    if (s.type === 'BOTH') return `${(s.amount_grosze / 100).toFixed(0)} zł + ${s.percent}%`;
    return `${(s.amount_grosze / 100).toFixed(0)} zł`;
}

export async function GET(_req: Request, { params }: Ctx) {
    const { token } = await params;

    let referrerName = 'Ktoś bliski';
    let city = '';
    let bonusText = 'Rabat na sesję';
    let bonusEnabled = false;

    try {
        const ref = await prisma.fotoMatchReferral.findUnique({
            where: { invite_token: token },
            include: { referrer: { select: { display_name: true, city: true } } },
        });
        if (ref) {
            referrerName = ref.referrer.display_name;
            city = ref.referrer.city || '';
        }
        const s = await prisma.fotoMatchMatchSettings.findFirst({ orderBy: { id: 'asc' } });
        if (s?.referral_bonus_enabled) {
            bonusEnabled = true;
            bonusText = formatBonus({
                type: s.referral_bonus_type,
                amount_grosze: s.referral_bonus_amount_grosze,
                percent: s.referral_bonus_percent,
            });
        }
    } catch {
        // ignore — render z domyślnymi
    }

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background:
                        'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%)',
                    color: 'white',
                    padding: '60px 80px',
                    fontFamily: 'sans-serif',
                    position: 'relative',
                }}
            >
                {/* Decorative blobs */}
                <div
                    style={{
                        position: 'absolute',
                        top: -120,
                        right: -120,
                        width: 360,
                        height: 360,
                        borderRadius: 9999,
                        background: 'rgba(251, 191, 36, 0.35)',
                        filter: 'blur(2px)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: -160,
                        left: -100,
                        width: 420,
                        height: 420,
                        borderRadius: 9999,
                        background: 'rgba(236, 72, 153, 0.45)',
                        filter: 'blur(2px)',
                    }}
                />

                {/* Brand strip */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, zIndex: 1 }}>
                    <div
                        style={{
                            width: 56, height: 56, borderRadius: 999,
                            background: 'linear-gradient(135deg, #fbbf24, #f472b6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 28,
                        }}
                    >📸</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>Foto-Match</span>
                        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>wlasniewski.pl</span>
                    </div>
                </div>

                {/* Hero */}
                <div
                    style={{
                        display: 'flex', flexDirection: 'column',
                        flex: 1, justifyContent: 'center', zIndex: 1,
                    }}
                >
                    <span style={{ fontSize: 30, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>
                        💌 {referrerName}{city ? ` z ${city}` : ''} zaprasza Cię
                    </span>
                    <span
                        style={{
                            fontSize: 78, fontWeight: 900, lineHeight: 1.05,
                            color: '#fff',
                            marginBottom: 16,
                            textShadow: '0 4px 40px rgba(0,0,0,0.25)',
                        }}
                    >
                        Znajdź parę do sesji zdjęciowej
                    </span>
                    <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.95)', maxWidth: 900 }}>
                        Poznaj osoby z Twojej okolicy, które chcą wspólnie pozować przed obiektywem.
                    </span>
                </div>

                {/* Bonus pill */}
                {bonusEnabled && (
                    <div
                        style={{
                            display: 'flex', alignItems: 'center', gap: 16,
                            padding: '20px 32px',
                            background: 'rgba(255,255,255,0.95)',
                            borderRadius: 999,
                            alignSelf: 'flex-start',
                            zIndex: 1,
                            boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                        }}
                    >
                        <span style={{ fontSize: 36 }}>🎁</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 16, color: '#6b7280', fontWeight: 600 }}>BONUS POWITALNY</span>
                            <span style={{ fontSize: 32, fontWeight: 900, color: '#111' }}>
                                {bonusText} na pierwszą sesję
                            </span>
                        </div>
                    </div>
                )}
            </div>
        ),
        { width: 1200, height: 630 }
    );
}
