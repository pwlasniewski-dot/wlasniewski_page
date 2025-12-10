"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Invite {
    id: number;
    inviter_name: string;
    partner_name: string;
    occasion: string | null;
    message: string | null;
    style: string;
}

export default function InvitePage() {
    const params = useParams();
    const slug = params.slug as string;
    const [invite, setInvite] = useState<Invite | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (slug) {
            fetch(`/api/invites?slug=${slug}`)
                .then((res) => {
                    if (!res.ok) throw new Error("Not found");
                    return res.json();
                })
                .then((data) => setInvite(data))
                .catch(() => setError(true))
                .finally(() => setLoading(false));
        }
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
                Ładowanie...
            </div>
        );
    }

    if (error || !invite) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-4 text-center">
                <h1 className="text-3xl font-bold mb-4">Nie znaleziono zaproszenia</h1>
                <p className="text-zinc-400 mb-8">To zaproszenie nie istnieje lub link jest nieprawidłowy.</p>
                <Link href="/" className="px-6 py-3 bg-white text-zinc-900 rounded-full font-medium">
                    Wróć na stronę główną
                </Link>
            </div>
        );
    }

    const isRomantic = invite.style === "romantic";
    const isFun = invite.style === "fun";

    return (
        <main className={`min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden ${isRomantic ? "bg-rose-950" : isFun ? "bg-indigo-950" : "bg-zinc-950"
            }`}>
            {/* Background Effects */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                {isRomantic && <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500 rounded-full blur-[128px]"></div>}
                {isFun && <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[128px]"></div>}
            </div>

            <div className="relative max-w-lg w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-12 text-center shadow-2xl">
                <div className="mb-8">
                    <span className="inline-block px-4 py-1 rounded-full bg-white/10 text-white/80 text-sm font-medium mb-4">
                        {invite.occasion || "Zaproszenie na sesję"}
                    </span>
                    <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-2">
                        Cześć {invite.partner_name}!
                    </h1>
                </div>

                <div className="space-y-6 text-lg text-white/90 leading-relaxed mb-10">
                    <p>
                        {invite.inviter_name} ma dla Ciebie niespodziankę.
                    </p>
                    {invite.message && (
                        <div className="bg-black/20 rounded-xl p-6 italic">
                            "{invite.message}"
                        </div>
                    )}
                    <p className="font-semibold text-xl">
                        Zaprasza Cię na wspólną sesję zdjęciową! 📸
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <Link
                        href="/rezerwacja"
                        className="w-full bg-white text-zinc-900 rounded-xl py-4 font-bold text-lg hover:bg-zinc-100 transition shadow-lg shadow-white/10"
                    >
                        Umów termin
                    </Link>
                    <Link
                        href="/portfolio"
                        className="w-full bg-white/10 text-white rounded-xl py-4 font-medium hover:bg-white/20 transition"
                    >
                        Zobacz portfolio
                    </Link>
                </div>
            </div>
        </main>
    );
}
