"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface ExitPopupProps {
    enabled: boolean;
    title: string;
    content: string;
    ctaText: string;
    ctaLink: string;
}

export default function ExitPopup({ enabled, title, content, ctaText, ctaLink }: ExitPopupProps) {
    const [show, setShow] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (!enabled || dismissed) return;

        const handleMouseLeave = (e: MouseEvent) => {
            // Check if mouse is leaving from the top of the viewport
            if (e.clientY <= 0) {
                setShow(true);
                // Mark as shown in session storage to prevent re-showing
                sessionStorage.setItem("exit_popup_shown", "true");
            }
        };

        // Check if popup was already shown in this session
        const wasShown = sessionStorage.getItem("exit_popup_shown");
        if (wasShown) {
            setDismissed(true);
            return;
        }

        document.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            document.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [enabled, dismissed]);

    if (!enabled || !show || dismissed) return null;

    const handleClose = () => {
        setShow(false);
        setDismissed(true);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={handleClose}
            />

            {/* Popup */}
            <div className="relative max-w-lg w-full mx-4 bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-300">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white transition"
                    aria-label="Zamknij"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>

                <div className="text-center space-y-6">
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
                        {title || "Nie odchodź!"}
                    </h2>
                    <p className="text-lg text-zinc-300 leading-relaxed">
                        {content || "Mamy dla Ciebie specjalną ofertę!"}
                    </p>

                    {ctaLink && (
                        <Link
                            href={ctaLink}
                            onClick={handleClose}
                            className="inline-block w-full rounded-xl bg-white px-8 py-4 text-lg font-bold text-zinc-900 hover:bg-zinc-200 transition"
                        >
                            {ctaText || "Zobacz ofertę"}
                        </Link>
                    )}

                    <button
                        onClick={handleClose}
                        className="text-sm text-zinc-500 hover:text-zinc-400 transition"
                    >
                        Nie, dziękuję
                    </button>
                </div>
            </div>
        </div>
    );
}
