import Link from 'next/link';
import { AERO_SITE } from '@/lib/aeroanaliza/content';

const serviceLinks = [
    { href: '/termowizja', label: 'Termowizja dronem' },
    { href: '/inspekcja-fotowoltaiki-dronem', label: 'Inspekcja fotowoltaiki' },
    { href: '/inspekcja-dachu-dronem', label: 'Inspekcja dachu' },
    { href: '/monitoring', label: 'Monitoring inwestycji' },
];

export default function AeroFooter() {
    return (
        <footer className="border-t border-white/10 bg-[#050b0a] px-4 py-14 text-zinc-300">
            <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
                <div>
                    <p className="text-xl font-bold text-white">Aero Analiza</p>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">Termowizja, inspekcje i dokumentacja inwestycji dronem DJI Mavic 3 Thermal. Zakres lotu dobierany do decyzji, którą ma podjąć klient.</p>
                    <p className="mt-5 text-xs leading-relaxed text-zinc-500">Materiał z drona nie zastępuje opinii konstruktora, pomiarów elektrycznych ani ekspertyzy branżowej, jeśli są wymagane do postawienia diagnozy.</p>
                </div>
                <div>
                    <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Usługi</p>
                    <ul className="space-y-3 text-sm">
                        {serviceLinks.map(link => <li key={link.href}><Link className="hover:text-white" href={link.href}>{link.label}</Link></li>)}
                    </ul>
                </div>
                <div>
                    <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Kontakt</p>
                    <a data-analytics="aero-cta-email" className="block text-sm text-white hover:text-emerald-200" href={`mailto:${AERO_SITE.email}`}>{AERO_SITE.email}</a>
                    <a data-analytics="aero-cta-phone" className="mt-2 block text-sm text-white hover:text-emerald-200" href={`tel:${AERO_SITE.phoneHref}`}>{AERO_SITE.phone}</a>
                    <p className="mt-3 text-sm text-zinc-400">Płużnica, woj. kujawsko-pomorskie</p>
                    <Link href="/kujawsko-pomorskie" className="mt-5 inline-block text-sm text-emerald-300 hover:text-emerald-200">Sprawdź obszar działania →</Link>
                    <Link href="/polityka-prywatnosci" className="mt-3 block text-sm text-zinc-400 hover:text-white">Polityka prywatności i cookies</Link>
                </div>
            </div>
            <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                <p>© {new Date().getFullYear()} {AERO_SITE.legalName}</p>
                <p>Serwis nie prowadzi automatycznego podejmowania decyzji o klientach. Treści techniczne podlegają kontroli człowieka.</p>
            </div>
        </footer>
    );
}
