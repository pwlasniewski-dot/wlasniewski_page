import Link from 'next/link';
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import { AERO_SITE } from '@/lib/aeroanaliza/content';

const serviceLinks = [
    { href: '/termowizja', label: 'Termowizja dronem' },
    { href: '/inspekcja-fotowoltaiki-dronem', label: 'Inspekcja fotowoltaiki' },
    { href: '/inspekcja-dachu-dronem', label: 'Inspekcja dachu' },
    { href: '/monitoring', label: 'Monitoring inwestycji' },
];

export default function AeroFooter() {
    return (
        <footer className="relative overflow-hidden bg-[#0b2339] px-4 py-16 text-[#c2d2df] sm:px-6 md:py-20">
            <div className="absolute -right-48 -top-48 h-96 w-96 rounded-full bg-[#ff5d37]/10 blur-3xl" />
            <div className="relative mx-auto grid max-w-7xl gap-12 md:grid-cols-[1.3fr_.8fr_1fr]">
                <div>
                    <div className="flex items-center gap-3"><span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-[14px] bg-white text-[11px] font-black tracking-[.12em] text-[#0b2339]">AA<span className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#1f6feb] via-[#8a5cff] to-[#ff5d37]" /></span><div><p className="aero-heading text-xl font-semibold text-white">Aero Analiza</p><p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#8eacc4]">termowizja • inspekcje</p></div></div>
                    <p className="mt-6 max-w-lg text-sm leading-7 text-[#abc0d0]">Termowizja, inspekcje i dokumentacja inwestycji dronem DJI Mavic 3 Thermal. Zakres lotu dobierany do decyzji, którą ma podjąć klient.</p>
                    <p className="mt-5 max-w-lg text-xs leading-6 text-[#7794aa]">Materiał z drona nie zastępuje opinii konstruktora, pomiarów elektrycznych ani ekspertyzy branżowej, jeśli są wymagane do postawienia diagnozy.</p>
                </div>
                <div>
                    <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.2em] text-[#91c7f2]">Usługi</p>
                    <ul className="space-y-3 text-sm">
                        {serviceLinks.map(link => <li key={link.href}><Link className="inline-flex items-center gap-1.5 transition hover:text-white" href={link.href}>{link.label}<ArrowUpRight size={13} className="opacity-40" aria-hidden="true" /></Link></li>)}
                    </ul>
                </div>
                <div>
                    <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.2em] text-[#91c7f2]">Kontakt</p>
                    <a data-analytics="aero-cta-email" className="flex items-center gap-3 text-sm text-white transition hover:text-[#ff9b82]" href={`mailto:${AERO_SITE.email}`}><Mail size={16} aria-hidden="true" />{AERO_SITE.email}</a>
                    <a data-analytics="aero-cta-phone" className="mt-3 flex items-center gap-3 text-sm text-white transition hover:text-[#ff9b82]" href={`tel:${AERO_SITE.phoneHref}`}><Phone size={16} aria-hidden="true" />{AERO_SITE.phone}</a>
                    <p className="mt-3 flex items-start gap-3 text-sm text-[#a7bdcd]"><MapPin className="mt-0.5 shrink-0" size={16} aria-hidden="true" />Płużnica, woj. kujawsko-pomorskie</p>
                    <Link href="/kujawsko-pomorskie" className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-bold text-white transition hover:border-[#ff8b6d] hover:text-[#ffb09c]">Sprawdź obszar działania <ArrowUpRight size={15} aria-hidden="true" /></Link>
                    <Link href="/polityka-prywatnosci" className="mt-4 block text-xs text-[#7f9aae] hover:text-white">Polityka prywatności i cookies</Link>
                </div>
            </div>
            <div className="relative mx-auto mt-14 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-7 text-xs text-[#728da2] sm:flex-row sm:items-center sm:justify-between">
                <p>© {new Date().getFullYear()} {AERO_SITE.legalName}</p>
                <p>Serwis nie prowadzi automatycznego podejmowania decyzji o klientach. Treści techniczne podlegają kontroli człowieka.</p>
            </div>
        </footer>
    );
}
