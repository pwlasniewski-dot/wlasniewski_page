import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowLeft, CloudSun, MapPin, ShieldCheck } from 'lucide-react';
import DronePhotographyBookingForm from '@/components/DronePhotographyBookingForm';
import { loadDronePhotographyCmsPage } from '@/lib/dronePhotographyCms';

export const metadata: Metadata = {
    title: 'Rezerwacja zdjęć z drona | Właśniewski',
    description: 'Wybierz pakiet zdjęć lub filmu z drona, podaj miejsce i preferowany termin. Potwierdzenie po sprawdzeniu pogody oraz przestrzeni powietrznej.',
    alternates: { canonical: 'https://wlasniewski.pl/rezerwacja/dron' },
    robots: { index: false, follow: true },
};

export default async function DroneBookingPage() {
    const { config } = await loadDronePhotographyCmsPage();
    const activePackages = config.packages.filter(item => item.active !== false);
    const benefits = config.booking.benefits;
    return (
        <main className="min-h-screen bg-[#f3efe8] px-5 py-16 text-[#28221c] sm:px-8 md:py-24">
            <div className="mx-auto max-w-[1180px]">
                <Link href="/fotografia-z-drona" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[#8a7048] hover:text-[#28221c]"><ArrowLeft size={16} /> {config.booking.backToOfferLabel}</Link>
                <div className="mt-9 grid gap-10 lg:grid-cols-[.65fr_1.35fr] lg:items-start">
                    <aside className="lg:sticky lg:top-28">
                        <p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#8a7048]">{config.booking.eyebrow}</p>
                        <h1 className="mt-4 font-display text-5xl font-normal leading-[.92] tracking-[-.04em] md:text-7xl">{config.booking.title}</h1>
                        <p className="mt-6 text-base leading-8 text-[#686057]">{config.booking.description}</p>
                        <div className="mt-8 space-y-4 border-y border-[#c8bbab] py-6 text-sm text-[#514a42]">
                            {benefits.map((benefit, index) => {
                                const Icon = index === 0 ? MapPin : index === 1 ? CloudSun : ShieldCheck;
                                return <div key={`${benefit}-${index}`} className="flex gap-3"><Icon size={18} className="mt-0.5 shrink-0 text-[#8a7048]" /> {benefit}</div>;
                            })}
                        </div>
                    </aside>
                    <section className="border border-[#d5cabd] bg-[#f8f5f0] p-6 shadow-[0_24px_80px_rgba(78,63,43,.08)] sm:p-10">
                        <Suspense fallback={<div className="min-h-[560px] animate-pulse bg-[#ebe4da]" aria-label="Ładowanie formularza" />}>
                            <DronePhotographyBookingForm packages={activePackages} areas={config.areas} copy={config.booking} />
                        </Suspense>
                    </section>
                </div>
            </div>
        </main>
    );
}
