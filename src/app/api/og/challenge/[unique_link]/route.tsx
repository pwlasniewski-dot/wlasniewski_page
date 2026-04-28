import { ImageResponse } from 'next/og';
import prisma from '@/lib/db/prisma';

export const runtime = 'nodejs';

interface Props {
    params: Promise<{ unique_link: string }>;
}

/**
 * Dynamic Open Graph image for `/foto-wyzwanie/invite/[unique_link]`.
 *
 * Renders a 1200x630 PNG with:
 *  - Wałycz Studio branding (trust signal: "this is a real local business")
 *  - Inviter name + invitee name (personalization)
 *  - Package name + price (clear offer)
 *
 * This image is what FB / Messenger / WhatsApp / iMessage will fetch and show
 * as a rich preview when the invite link is shared. It is the SINGLE biggest
 * driver of "this looks legit, I'll click" perception.
 */
export async function GET(_req: Request, { params }: Props) {
    const { unique_link } = await params;

    let inviterName = 'Ktoś bliski';
    let inviteeName = 'Ciebie';
    let packageName = 'Sesja Foto Wyzwanie';
    let packagePrice = 0;

    try {
        const challenge = await prisma.photoChallenge.findUnique({
            where: { unique_link },
            include: { package: true },
        });
        if (challenge) {
            inviterName = challenge.inviter_name || inviterName;
            inviteeName = challenge.invitee_name || inviteeName;
            packageName = challenge.package?.name || packageName;
            packagePrice = challenge.package?.challenge_price ?? 0;
        }
    } catch (e) {
        // Fall through to defaults — never block the OG render.
    }

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1410 50%, #2a1a0a 100%)',
                    color: 'white',
                    padding: '60px 80px',
                    position: 'relative',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* Top brand strip */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: '48px',
                    }}
                >
                    <div
                        style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '999px',
                            background: 'linear-gradient(135deg, #d4af37, #b8860b)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '28px',
                        }}
                    >
                        📸
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '22px', fontWeight: 700, color: '#d4af37' }}>
                            Wałycz Studio
                        </span>
                        <span style={{ fontSize: '14px', color: '#a1a1aa' }}>
                            wlasniewski.pl · Fotografia 12 lat
                        </span>
                    </div>
                </div>

                {/* Headline */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        justifyContent: 'center',
                    }}
                >
                    <span
                        style={{
                            fontSize: '28px',
                            color: '#a1a1aa',
                            marginBottom: '12px',
                        }}
                    >
                        🎁 Zaproszenie na sesję
                    </span>
                    <span
                        style={{
                            fontSize: '64px',
                            fontWeight: 800,
                            lineHeight: 1.1,
                            background: 'linear-gradient(90deg, #fbbf24, #f472b6)',
                            backgroundClip: 'text',
                            color: 'transparent',
                            marginBottom: '20px',
                        }}
                    >
                        {inviterName} zaprasza Cię!
                    </span>
                    <span style={{ fontSize: '32px', color: '#e4e4e7', display: 'flex' }}>
                        {packageName}
                        {packagePrice > 0 && (
                            <span style={{ marginLeft: '16px', color: '#10b981', fontWeight: 700 }}>
                                · już opłacone
                            </span>
                        )}
                    </span>
                </div>

                {/* Bottom trust strip */}
                <div
                    style={{
                        display: 'flex',
                        gap: '24px',
                        alignItems: 'center',
                        borderTop: '1px solid #3f3f46',
                        paddingTop: '24px',
                        fontSize: '20px',
                        color: '#d4d4d8',
                    }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        ⭐⭐⭐⭐⭐ Opinie Google
                    </span>
                    <span>·</span>
                    <span>Bezpieczne · RODO · Szybka odpowiedź</span>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
