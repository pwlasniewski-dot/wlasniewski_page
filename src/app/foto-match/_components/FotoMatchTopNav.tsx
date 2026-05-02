'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Heart, MessageCircle, User as UserIcon, Camera } from 'lucide-react';

/**
 * Topbar dla zalogowanych użytkowników Foto-Match.
 * Zastępuje wcześniejszy bottom nav — bardziej profesjonalny wygląd, mniej "social-app vibe".
 */
const ITEMS = [
    { href: '/foto-match/odkryj', label: 'Odkryj', icon: Compass, match: (p: string) => p.startsWith('/foto-match/odkryj') || p.startsWith('/foto-match/u/') },
    { href: '/foto-match/lajki', label: 'Polubienia', icon: Heart, match: (p: string) => p.startsWith('/foto-match/lajki') },
    { href: '/foto-match/wiadomosci', label: 'Wiadomości', icon: MessageCircle, match: (p: string) => p.startsWith('/foto-match/wiadomosci') },
    { href: '/foto-match/profil', label: 'Profil', icon: UserIcon, match: (p: string) => p.startsWith('/foto-match/profil') },
];

export default function FotoMatchTopNav() {
    const pathname = usePathname() || '';
    if (!pathname.startsWith('/foto-match')) return null;
    if (pathname.startsWith('/foto-match/onboarding')) return null;
    if (pathname.startsWith('/foto-match/i/')) return null;
    if (pathname === '/foto-match/zapis-potwierdzony') return null;
    // landing /foto-match też ukrywamy (publiczna strona)
    if (pathname === '/foto-match') return null;

    return (
        <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-zinc-200 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
                <Link href="/foto-match" className="inline-flex items-center gap-2 font-black text-zinc-900">
                    <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow">
                        <Camera className="w-4 h-4 text-white" />
                    </span>
                    Foto-Match
                </Link>
                <ul className="flex items-center gap-1">
                    {ITEMS.map((item) => {
                        const active = item.match(pathname);
                        const Icon = item.icon;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                                        active
                                            ? 'bg-zinc-900 text-white shadow'
                                            : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
}
