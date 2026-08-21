'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ArrowUpRight, Menu, Phone, X } from 'lucide-react';
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
        <header className="fixed inset-x-0 top-0 z-50 border-b border-[#dbe5ed] bg-white/95 text-[#142e49] shadow-[0_8px_32px_rgba(23,52,77,.06)] backdrop-blur-xl">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6">
                <Link href="/" className="group flex items-center gap-3" aria-label="Aero Analiza — strona główna" onClick={() => setOpen(false)}>
                    <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-[14px] bg-[#102c48] text-[11px] font-black tracking-[.12em] text-white shadow-[0_8px_20px_rgba(16,44,72,.2)]">
                        AA
                        <span className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#1f6feb] via-[#8a5cff] to-[#ff5d37]" />
                    </span>
                    <span>
                        <span className="aero-heading block text-[17px] font-semibold tracking-[-.02em] text-[#102c48]">{AERO_SITE.name}</span>
                        <span className="block text-[9px] font-bold uppercase tracking-[0.19em] text-[#6c8093]">termowizja • inspekcje</span>
                    </span>
                </Link>

                <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Główna nawigacja Aero Analiza">
                    {links.map(link => {
                        const active = pathname === link.href || pathname === `/b2b${link.href}`;
                        return (
                            <Link key={link.href} href={link.href} className={`rounded-full px-3 py-2 text-[13px] font-semibold transition-colors ${active ? 'bg-[#e9f2fa] text-[#155994]' : 'text-[#516679] hover:bg-[#f2f6f9] hover:text-[#153754]'}`}>
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="hidden items-center gap-3 lg:flex">
                    <a href={`tel:${AERO_SITE.phoneHref}`} data-analytics="aero-cta-phone" className="inline-flex items-center gap-2 text-[13px] font-bold text-[#31536f] hover:text-[#1f6feb]"><Phone size={15} aria-hidden="true" />{AERO_SITE.phone.replace('+48 ', '')}</a>
                    <Link href={quoteHref} data-analytics="aero-cta-wycena" className="group inline-flex items-center gap-2 rounded-full bg-[#ff5d37] px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_10px_24px_rgba(255,93,55,.22)] transition hover:-translate-y-0.5 hover:bg-[#e94c28]">
                        Zapytaj o wycenę <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                    </Link>
                </div>

                <button type="button" className="rounded-xl border border-[#d8e3eb] bg-[#f6f9fb] p-2 text-[#1c3d59] xl:hidden" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls="aero-mobile-menu" aria-label={open ? 'Zamknij menu' : 'Otwórz menu'}>
                    {open ? <X /> : <Menu />}
                </button>
            </div>

            {open && (
                <nav id="aero-mobile-menu" className="border-t border-[#dbe5ed] bg-white px-4 py-5 shadow-xl xl:hidden" aria-label="Menu mobilne Aero Analiza">
                    <div className="mx-auto flex max-w-7xl flex-col gap-2">
                        {links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-[#31516d] hover:bg-[#eef4f8]">{link.label}</Link>)}
                        <a href={`tel:${AERO_SITE.phoneHref}`} className="mt-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-[#1b5fa7]"><Phone size={17} aria-hidden="true" />{AERO_SITE.phone}</a>
                        <Link href={quoteHref} data-analytics="aero-cta-wycena-mobile" onClick={() => setOpen(false)} className="mt-2 rounded-xl bg-[#ff5d37] px-4 py-3 text-center font-bold text-white">Zapytaj o wycenę</Link>
                    </div>
                </nav>
            )}
        </header>
    );
}
