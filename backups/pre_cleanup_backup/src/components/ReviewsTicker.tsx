import React from "react";

/* Pasek opinii */
export default function ReviewsTicker({ items, speedSec = 28 }: { items: string[]; speedSec?: number }) {
    const row = [...items, ...items];
    const Star = () => (
        <svg viewBox="0 0 20 20" aria-hidden className="h-4 w-4 text-amber-400 fill-current">
            <path d="M10 1.5 12.9 7l5.9.9-4.2 4.1 1 5.9L10 15.9 4.4 17.9l1-5.9L1.2 7.9 7.1 7z" />
        </svg>
    );
    return (
        <div
            className="relative overflow-hidden w-screen left-1/2 right-1/2 -mx-[50vw] border-y border-zinc-800
                 bg-gradient-to-b from-zinc-900 to-zinc-950"
            style={{ contain: "paint" } as React.CSSProperties}
        >
            <style>{`
        @keyframes marquee-x { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes sheen { 0%{transform:translateX(-120%)} 100%{transform:translateX(120%)} }
        @media (prefers-reduced-motion: reduce) { .rtk-anim { animation: none !important; } }
      `}</style>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-zinc-950 to-transparent z-10" />
            <div
                className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 rotate-6
                   bg-gradient-to-r from-transparent via-white/10 to-transparent blur-sm rtk-anim"
                style={{ animation: `sheen ${speedSec * 2}s linear infinite` }}
            />
            <div
                className="rtk-anim flex whitespace-nowrap py-5 md:py-6"
                style={{ width: "200%", animation: `marquee-x ${speedSec}s linear infinite` }}
            >
                {row.map((t, i) => (
                    <div
                        key={i}
                        className="group relative mx-3 inline-flex items-center gap-3 rounded-2xl border border-white/10
                       bg-white/5 px-5 py-3 text-sm md:text-base text-zinc-100/90 shadow-sm
                       backdrop-blur transition will-change-transform
                       hover:scale-[1.03] hover:bg-white/[0.08] hover:text-white
                       ring-1 ring-white/[0.06]"
                    >
                        <div className="flex items-center gap-[2px]">
                            <Star /><Star /><Star /><Star /><Star />
                        </div>
                        <span className="opacity-95">{t}</span>
                        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                            <span className="block h-full w-10 -translate-x-10 rotate-6 bg-white/10 blur-[2px]
                               opacity-0 transition group-hover:opacity-100 group-hover:translate-x-[140%]" />
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
