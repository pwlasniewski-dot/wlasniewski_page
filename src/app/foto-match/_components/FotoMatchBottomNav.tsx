'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Heart, MessageCircle, User as UserIcon, Sparkles } from 'lucide-react';

/**
 * Sticky bottom nav dla zalogowanych użytkowników Foto-Match.
 * Zapewnia że user nigdy nie jest "zagubiony" — zawsze może wrócić do innej sekcji.
 */
const ITEMS = [
    { href: '/foto-match', label: 'Start', icon: Sparkles, match: (p: string) => p === '/foto-match' },
    { href: '/foto-match/odkryj', label: 'Odkryj', icon: Compass, match: (p: string) => p.startsWith('/foto-match/odkryj') || p.startsWith('/foto-match/u/') },
    { href: '/foto-match/odkryj?tab=matches', label: 'Matche', icon: Heart, match: (p: string) => p.includes('matches') },
    { href: '/foto-match/profil', label: 'Profil', icon: UserIcon, match: (p: string) => p.startsWith('/foto-match/profil') },
];

export default function FotoMatchBottomNav() {
    const pathname = usePathname() || '';
    // Pokaż tylko na trasach foto-match (poza onboarding)
    if (!pathname.startsWith('/foto-match')) return null;
    if (pathname.startsWith('/foto-match/onboarding')) return null;
    if (pathname.startsWith('/foto-match/i/')) return null; // zaproszenie
    if (pathname === '/foto-match/zapis-potwierdzony') return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80 pb-[env(safe-area-inset-bottom)]">
            <ul className="max-w-2xl mx-auto grid grid-cols-4">
                {ITEMS.map((item) => {
                    const active = item.match(pathname);
                    const Icon = item.icon;
                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={`flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-semibold transition ${active ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${active ? 'fill-amber-500/10' : ''}`} />
                                {item.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
