import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import type { PortfolioSession } from '@/lib/portfolio';

// Explicit destinations also work for visitors arriving directly from Google.
// Do not use browser history: it may lead outside the portfolio or the site.
export function PortfolioBackLinks({ category }: { category?: string }) {
    const linkClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/30 bg-black/70 px-5 py-3 text-sm text-white transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white';

    return (
        <nav aria-label="Nawigacja portfolio" className="flex flex-wrap justify-center gap-3">
            <Link href="/portfolio#wybrane-historie" className={linkClass}>
                <ArrowLeft size={16} aria-hidden="true" />
                Wróć do portfolio
            </Link>
            {category && (
                <Link href={`/portfolio/${encodeURIComponent(category)}#sesje`} className={linkClass}>
                    Sesje: {category}
                </Link>
            )}
        </nav>
    );
}

export function PortfolioCategoryNavigation({ sessions }: { sessions: PortfolioSession[] }) {
    return (
        <div className="mx-auto max-w-6xl px-5 pb-10 pt-28 text-white md:px-8">
            <PortfolioBackLinks />
            <nav id="sesje" aria-label="Sesje w kategorii" className="mt-8 scroll-mt-28">
                <p className="mb-4 text-sm font-medium">Wszystkie sesje</p>
                <ul className="grid gap-3 sm:grid-cols-2">
                    {sessions.map(session => (
                        <li key={session.id}>
                            <Link
                                href={`/portfolio/${encodeURIComponent(session.category)}/${encodeURIComponent(session.slug)}`}
                                className="flex min-h-16 items-center gap-4 rounded-lg border border-white/25 p-3 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                            >
                                {session.coverImage && (
                                    <Image src={session.coverImage} alt="" width={96} height={64} sizes="96px" className="h-16 w-24 shrink-0 rounded object-cover" />
                                )}
                                <span className="min-w-0 break-words text-base">{session.title}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
}
