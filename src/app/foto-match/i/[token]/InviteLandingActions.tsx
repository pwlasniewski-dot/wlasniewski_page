'use client';

import { useEffect, useState } from 'react';
import { Facebook, MessageCircle, Send, Mail, Copy, Check, Share2, Instagram } from 'lucide-react';

interface Props {
    shareUrl: string;
    referrerName: string;
    token: string;
}

/**
 * Sekcja share na landingu zaproszenia.
 * Każdy klik bumpuje share_count w API + otwiera natywny share intent FB/IG/WhatsApp/Messenger/X/TG/Email.
 * Instagram nie ma direct share intent → ig://camera deep link + fallback "skopiuj link".
 */
export default function InviteLandingActions({ shareUrl, referrerName, token }: Props) {
    const [copied, setCopied] = useState(false);

    // Mount: rejestruj wejście (bumpuje click_count + ustawia cookie fm_ref_token,
    // żeby /api/auth/register podlinkował referral po stworzeniu konta).
    useEffect(() => {
        fetch(`/api/foto-match/referrals/public/${token}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ event: 'click' }),
        }).catch(() => {/* silent */});
    }, [token]);

    const text = `${referrerName} zaprosił mnie do Foto-Match — programu, który łączy ludzi do wspólnych sesji zdjęciowych. Sprawdź:`;
    const encUrl = encodeURIComponent(shareUrl);
    const encText = encodeURIComponent(text);

    async function track(event: 'share' | 'click') {
        try {
            await fetch(`/api/foto-match/referrals/public/${token}`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ event }),
            });
        } catch {
            // ignore — tracking nie blokuje share
        }
    }

    function open(url: string) {
        track('share');
        window.open(url, '_blank', 'noopener,noreferrer,width=640,height=720');
    }

    async function copyLink() {
        await track('share');
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            window.prompt('Skopiuj link:', shareUrl);
        }
    }

    async function nativeShare() {
        await track('share');
        if (typeof navigator !== 'undefined' && (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }).share) {
            try {
                await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
                    title: 'Foto-Match',
                    text,
                    url: shareUrl,
                });
            } catch {
                // user anulował
            }
        } else {
            copyLink();
        }
    }

    function instagramShare() {
        track('share');
        // Instagram: brak prawdziwego share intent dla web — kopiujemy link i podpowiadamy by wkleić w Stories.
        copyLink();
        alert('Link skopiowany! Wklej go w Instagram Stories lub w bio.');
    }

    return (
        <div className="mt-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8">
            <p className="text-center text-sm uppercase tracking-wider text-white/85 font-bold mb-2">
                Lubisz pomysł? Podziel się
            </p>
            <p className="text-center text-white/90 mb-6">
                Każde udostępnienie pomaga nam dotrzeć do nowych modeli i modelek.
            </p>

            {/* Główny CTA — natywny share (działa w mobilkach) */}
            <button
                type="button"
                onClick={nativeShare}
                className="w-full bg-gradient-to-r from-amber-300 to-pink-400 text-zinc-900 font-black text-lg py-4 rounded-2xl shadow-xl hover:scale-[1.02] transition flex items-center justify-center gap-2 mb-5"
            >
                <Share2 className="w-5 h-5" />
                Udostępnij teraz
            </button>

            {/* Grid social */}
            <div className="grid grid-cols-4 gap-3">
                <ShareButton
                    label="Facebook"
                    icon={<Facebook className="w-6 h-6" />}
                    color="bg-[#1877F2] hover:bg-[#0d65d9]"
                    onClick={() =>
                        open(`https://www.facebook.com/sharer/sharer.php?u=${encUrl}&quote=${encText}`)
                    }
                />
                <ShareButton
                    label="Messenger"
                    icon={<MessageCircle className="w-6 h-6" />}
                    color="bg-gradient-to-br from-[#0084ff] to-[#a033ff] hover:opacity-90"
                    onClick={() =>
                        open(`https://www.facebook.com/dialog/send?link=${encUrl}&app_id=140586622674265&redirect_uri=${encUrl}`)
                    }
                />
                <ShareButton
                    label="WhatsApp"
                    icon={<MessageCircle className="w-6 h-6" />}
                    color="bg-[#25D366] hover:bg-[#1ebe57]"
                    onClick={() => open(`https://wa.me/?text=${encText}%20${encUrl}`)}
                />
                <ShareButton
                    label="Instagram"
                    icon={<Instagram className="w-6 h-6" />}
                    color="bg-gradient-to-br from-[#feda75] via-[#fa7e1e] via-[#d62976] via-[#962fbf] to-[#4f5bd5] hover:opacity-90"
                    onClick={instagramShare}
                />
                <ShareButton
                    label="Telegram"
                    icon={<Send className="w-6 h-6" />}
                    color="bg-[#0088cc] hover:bg-[#006fa6]"
                    onClick={() => open(`https://t.me/share/url?url=${encUrl}&text=${encText}`)}
                />
                <ShareButton
                    label="X / Twitter"
                    icon={<span className="text-xl font-black">𝕏</span>}
                    color="bg-black hover:bg-zinc-800"
                    onClick={() => open(`https://twitter.com/intent/tweet?url=${encUrl}&text=${encText}`)}
                />
                <ShareButton
                    label="Email"
                    icon={<Mail className="w-6 h-6" />}
                    color="bg-zinc-700 hover:bg-zinc-600"
                    onClick={() => {
                        track('share');
                        window.location.href = `mailto:?subject=${encodeURIComponent('Foto-Match — zaproszenie')}&body=${encText}%20${encUrl}`;
                    }}
                />
                <ShareButton
                    label={copied ? 'Skopiowano' : 'Kopiuj link'}
                    icon={copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                    color={copied ? 'bg-emerald-600' : 'bg-white/15 hover:bg-white/25'}
                    onClick={copyLink}
                />
            </div>
        </div>
    );
}

function ShareButton({
    label,
    icon,
    color,
    onClick,
}: {
    label: string;
    icon: React.ReactNode;
    color: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`${color} text-white rounded-xl py-3 flex flex-col items-center justify-center gap-1 transition shadow-lg`}
            aria-label={label}
        >
            {icon}
            <span className="text-[10px] font-semibold leading-none mt-1">{label}</span>
        </button>
    );
}
