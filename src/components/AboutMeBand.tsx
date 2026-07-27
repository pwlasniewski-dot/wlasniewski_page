"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function AboutMeBand() {
    const [portraitSrc, setPortraitSrc] = useState<string>("");
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings/public');
                const data = await res.json();
                if (data.success && data.settings.about_me_portrait) {
                    setPortraitSrc(data.settings.about_me_portrait);
                }
            } catch (error) {
                console.error('Failed to fetch portrait from settings');
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const onMove = (e: MouseEvent) => {
            const r = el.getBoundingClientRect();
            const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
            const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
            el.style.transform = `rotateX(${(-dy * 6).toFixed(2)}deg) rotateY(${(dx * 8).toFixed(2)}deg)`;
        };
        const onLeave = () => {
            el.style.transform = "rotateX(0deg) rotateY(0deg)";
        };
        el.addEventListener("mousemove", onMove);
        el.addEventListener("mouseleave", onLeave);
        return () => {
            el.removeEventListener("mousemove", onMove);
            el.removeEventListener("mouseleave", onLeave);
        };
    }, []);

    return (
        <section className="mx-auto max-w-6xl px-4 md:px-6 py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                    <h3 className="text-3xl md:text-5xl font-extrabold text-zinc-50 tracking-tight font-display">
                        Cześć! Jestem Przemek.
                    </h3>
                    <p className="mt-5 text-zinc-300 leading-7 md:leading-8 text-lg whitespace-pre-line">
                        Jestem inżynierem informatyki, fotografem i operatorem drona z uprawnieniami NSTS-01 oraz certyfikatem termowizji ITC Level 1.
                        {'\n\n'}
                        Na co dzień pracuję w firmie produkcyjnej w Toruniu, gdzie odpowiadam za procesy logistyczne i systemowe.
                        Po godzinach zajmuję się tym, co daje mi największą satysfakcję — fotografią, filmowaniem z drona i analizą termowizyjną.
                        {'\n\n'}
                        Wykonuję sesje biznesowe, rodzinne, eventowe oraz realizacje z powietrza. Pracuję na systemie Sony A7, gwarantując profesjonalną jakość obrazu.
                        {'\n\n'}
                        Tę stronę zaprojektowałem i zbudowałem sam — z wykorzystaniem narzędzi AI i własnych pomysłów.
                        Łączę technikę, logistykę i sztukę w jednym celu: tworzyć obrazy, które zostają w pamięci.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link
                            href="/rezerwacja"
                            className="rounded-xl bg-gold-500 text-black px-5 py-3 font-semibold hover:bg-gold-400 transition"
                        >
                            Zarezerwuj termin
                        </Link>
                        <Link
                            href="/portfolio"
                            className="rounded-xl border border-zinc-600 px-5 py-3 text-zinc-200 hover:bg-zinc-800 transition"
                        >
                            Zobacz portfolio
                        </Link>
                    </div>
                </div>
                <div className="relative h-72 md:h-[420px]">
                    <div
                        ref={ref}
                        className="absolute inset-0 grid place-items-center rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 shadow-2xl"
                        style={{ perspective: "800px", transformStyle: "preserve-3d" } as any}
                    >
                        <div className="relative w-56 h-56 md:w-72 md:h-72 rounded-full overflow-hidden ring-2 ring-zinc-700 bg-zinc-800">
                            {portraitSrc ? (
                                <img
                                    src={portraitSrc}
                                    alt="Przemek — fotograf"
                                    className="w-full h-full object-cover"
                                    onError={() => setPortraitSrc("")}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                    <span className="text-4xl">📷</span>
                                </div>
                            )}
                            <div className="absolute inset-0 rounded-full ring-1 ring-white/15" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
