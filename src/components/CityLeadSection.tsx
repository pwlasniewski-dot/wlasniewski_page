import { getCityProof } from '@/lib/city-proof';
import CityLeadForm from './CityLeadForm';
import Link from 'next/link';

interface CityLeadSectionProps {
    city: string;
    citySlug: string;
}

/**
 * Sekcja konwersyjna z REALNYM social proof z bazy.
 * Bez wymyślonych liczb, bez fałszywych "odpowiedź w 2h".
 */
export default async function CityLeadSection({ city, citySlug }: CityLeadSectionProps) {
    const proof = await getCityProof(city);
    const cityLocative: Record<string, string> = {
        'Toruń': 'Toruniu',
        'Grudziądz': 'Grudziądzu',
        'Chełmno': 'Chełmnie',
        'Płużnica': 'Płużnicy',
        'Wąbrzeźno': 'Wąbrzeźnie',
        'Bydgoszcz': 'Bydgoszczy',
        'Świecie': 'Świeciu',
        'Lisewo': 'Lisewie',
    };
    const cityIn = cityLocative[city] || city;

    // Buduj wiarygodne, ale prawdziwe stwierdzenia
    const trustBadges: Array<{ icon: string; text: string; highlight?: boolean }> = [];

    if (proof.sessionsCount > 0) {
        trustBadges.push({
            icon: '📸',
            text: `${proof.sessionsCount} ${proof.sessionsCount === 1 ? 'sesja' : proof.sessionsCount < 5 ? 'sesje' : 'sesji'} w portfolio z ${city}`,
            highlight: true,
        });
    }

    if (proof.lastSessionDaysAgo !== null) {
        let timeText: string;
        if (proof.lastSessionDaysAgo === 0) timeText = 'dziś';
        else if (proof.lastSessionDaysAgo === 1) timeText = 'wczoraj';
        else if (proof.lastSessionDaysAgo < 7) timeText = `${proof.lastSessionDaysAgo} dni temu`;
        else if (proof.lastSessionDaysAgo < 30) timeText = `${Math.floor(proof.lastSessionDaysAgo / 7)} tyg. temu`;
        else if (proof.lastSessionDaysAgo < 365) timeText = `${Math.floor(proof.lastSessionDaysAgo / 30)} mies. temu`;
        else timeText = `${Math.floor(proof.lastSessionDaysAgo / 365)} lata temu`;

        if (proof.lastSessionDaysAgo < 90) {
            trustBadges.push({ icon: '🕐', text: `Ostatnia sesja: ${timeText}`, highlight: proof.lastSessionDaysAgo < 30 });
        }
    }

    if (proof.averageRating !== null && proof.reviewsTotal >= 3) {
        trustBadges.push({
            icon: '⭐',
            text: `${proof.averageRating}/5 z ${proof.reviewsTotal} opinii`,
            highlight: true,
        });
    }

    if (proof.upcomingFreeWeekends !== null && proof.upcomingFreeWeekends <= 4 && proof.upcomingFreeWeekends > 0) {
        trustBadges.push({
            icon: '📅',
            text: `Najbliższe 8 tygodni: ${proof.upcomingFreeWeekends} ${proof.upcomingFreeWeekends === 1 ? 'wolny weekend' : 'wolne weekendy'}`,
            highlight: true,
        });
    }

    return (
        <section className="py-16 px-6 bg-gradient-to-br from-amber-500/5 via-zinc-950 to-zinc-950 border-y border-amber-500/20" id="szybki-kontakt">
            <div className="container mx-auto max-w-5xl">
                {/* Nagłówek z REALNYMI badges */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                        Sprawdź wolne terminy w <span className="text-amber-400">{cityIn}</span>
                    </h2>
                    <p className="text-zinc-400 text-lg mb-6">
                        Zostaw kontakt — odezwę się z propozycją terminu i wyceną.
                    </p>

                    {trustBadges.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
                            {trustBadges.map((badge, i) => (
                                <span
                                    key={i}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${
                                        badge.highlight
                                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                                            : 'bg-zinc-800/60 border-zinc-700/50 text-zinc-300'
                                    }`}
                                >
                                    <span>{badge.icon}</span>
                                    <span>{badge.text}</span>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid lg:grid-cols-5 gap-8 items-start">
                    {/* Form (3/5) */}
                    <div className="lg:col-span-3">
                        <CityLeadForm city={city} citySlug={citySlug} />
                    </div>

                    {/* REALNE opinie (2/5) */}
                    <aside className="lg:col-span-2 space-y-4 lg:pt-2">
                        {proof.testimonials.length > 0 ? (
                            <>
                                <h3 className="text-sm uppercase tracking-wider text-zinc-500 font-semibold mb-3">
                                    Co mówią klienci
                                </h3>
                                {proof.testimonials.slice(0, 2).map((t, i) => (
                                    <blockquote
                                        key={i}
                                        className="bg-zinc-900/60 border-l-4 border-amber-500/60 rounded-r-lg p-4 text-sm"
                                    >
                                        {t.rating && (
                                            <div className="flex gap-0.5 mb-2 text-amber-400">
                                                {Array.from({ length: t.rating }).map((_, idx) => (
                                                    <span key={idx}>★</span>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-zinc-300 leading-relaxed italic line-clamp-5">
                                            „{t.text}"
                                        </p>
                                        <footer className="mt-3 text-xs text-zinc-500 font-medium">
                                            — {t.name}
                                            {t.source && <span className="text-amber-400/80 ml-1">· {t.source}</span>}
                                        </footer>
                                    </blockquote>
                                ))}

                                <a
                                    href={proof.googleReviewsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-center text-sm text-amber-400 hover:text-amber-300 transition-colors py-2"
                                >
                                    Zobacz opinie w Google →
                                </a>
                            </>
                        ) : (
                            <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-6 text-center">
                                <p className="text-zinc-400 text-sm mb-4">
                                    Sprawdź {proof.sessionsCount > 0 ? `${proof.sessionsCount} ` : ''}realizacji w portfolio
                                </p>
                                <Link
                                    href="/portfolio"
                                    className="inline-block text-amber-400 hover:text-amber-300 font-medium text-sm"
                                >
                                    Zobacz portfolio →
                                </Link>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </section>
    );
}
