'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AERO_SITE } from '@/lib/aeroanaliza/content';

const links = [
    { href: '/termowizja', label: 'Termowizja' },
    { href: '/inspekcja-fotowoltaiki-dronem', label: 'Fotowoltaika' },
    { href: '/inspekcja-dachu-dronem', label: 'Dachy' },
    { href: '/monitoring', label: 'Monitoring' },
    { href: '/kujawsko-pomorskie', label: 'Obszar działania' },
];

export default function AeroHeader() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const quoteHref = pathname.endsWith('/polityka-prywatnosci') ? '/#wycena' : '#wycena';

    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#07100f]/95 text-white backdrop-blur-xl">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
                <Link href="/" className="group flex items-center gap-3" aria-label="Aero Analiza — strona główna" onClick={() => setOpen(false)}>
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-300/30 bg-emerald-300/10 font-mono text-xs font-bold tracking-widest text-emerald-300">AA</span>
                    <span>
                        <span className="block text-base font-bold tracking-tight">{AERO_SITE.name}</span>
                        <span className="block text-[10px] uppercase tracking-[0.22em] text-zinc-400">termowizja • inspekcje</span>
                    </span>
                </Link>

                <nav className="hidden items-center gap-1 lg:flex" aria-label="Główna nawigacja Aero Analiza">
                    {links.map(link => {
                        const active = pathname === link.href || pathname === `/b2b${link.href}`;
                        return (
                            <Link key={link.href} href={link.href} className={`rounded-full px-3 py-2 text-sm transition-colors ${active ? 'bg-white/10 text-emerald-300' : 'text-zinc-300 hover:bg-white/5 hover:text-white'}`}>
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="hidden items-center gap-3 lg:flex">
                    <a href={`tel:${AERO_SITE.phoneHref}`} data-analytics="aero-cta-phone" className="text-sm text-zinc-300 hover:text-white">{AERO_SITE.phone.replace('+48 ', '')}</a>
                    <Link href={quoteHref} data-analytics="aero-cta-wycena" className="rounded-full bg-emerald-300 px-5 py-2.5 text-sm font-bold text-[#07100f] transition hover:bg-emerald-200">
                        Zapytaj o wycenę
                    </Link>
                </div>

                <button type="button" className="rounded-lg p-2 text-zinc-200 lg:hidden" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls="aero-mobile-menu" aria-label={open ? 'Zamknij menu' : 'Otwórz menu'}>
                    {open ? <X /> : <Menu />}
                </button>
            </div>

            {open && (
                <nav id="aero-mobile-menu" className="border-t border-white/10 bg-[#07100f] px-4 py-5 lg:hidden" aria-label="Menu mobilne Aero Analiza">
                    <div className="mx-auto flex max-w-7xl flex-col gap-2">
                        {links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-zinc-200 hover:bg-white/5">{link.label}</Link>)}
                        <Link href={quoteHref} data-analytics="aero-cta-wycena-mobile" onClick={() => setOpen(false)} className="mt-2 rounded-xl bg-emerald-300 px-4 py-3 text-center font-bold text-[#07100f]">Zapytaj o wycenę</Link>
                    </div>
                </nav>
            )}
        </header>
    );
}
