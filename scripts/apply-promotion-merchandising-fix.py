from pathlib import Path

ROOT = Path.cwd()


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding='utf-8')


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding='utf-8')


def replace_once(path: str, old: str, new: str) -> None:
    content = read(path)
    count = content.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one match, found {count}: {old[:140]!r}')
    write(path, content.replace(old, new, 1))


# 1. Percentage display must use integer arithmetic. 750 -> 600 is exactly 20%,
# not 19% caused by binary floating point combined with Math.floor.
replace_once(
    'src/lib/packagePromotionPricing.ts',
    "return Math.max(0, Math.floor((1 - promotionalPrice / referencePrice) * 100));",
    "return Math.max(0, Math.floor(((referencePrice - promotionalPrice) * 100) / referencePrice));",
)

# 2. Homepage merchandising: a scheduled successor must not remove the currently
# visible promotion. Among simultaneously active featured promotions, the one
# that started most recently wins. A compatibility fallback bridges rows that
# were auto-demoted by the previous scheduler implementation.
path = 'src/lib/packagePromotions.ts'
content = read(path)
old = """export async function loadFeaturedPromotionsByService(
    now = new Date(),
    db: PromotionDb = prisma,
): Promise<Record<string, PublicPackagePromotion>> {
    const rows = await db.$queryRaw<PromotionRow[]>(Prisma.sql`
        ${basePromotionSelect()}
        WHERE pp.\"is_enabled\" = TRUE
          AND pp.\"show_on_home\" = TRUE
          AND pp.\"starts_at\" <= ${now}
          AND (pp.\"ends_at\" IS NULL OR pp.\"ends_at\" > ${now})
          AND p.\"is_active\" = TRUE
          AND st.\"is_active\" = TRUE
        ORDER BY st.\"order\" ASC, p.\"order\" ASC, pp.\"starts_at\" DESC, pp.\"id\" DESC
    `);

    const selectedBySlot = new Map<string, PublicPackagePromotion>();
    for (const row of rows) {
        const slot = homepagePromotionSlot(row.service_name);
        if (!selectedBySlot.has(slot)) selectedBySlot.set(slot, toPublicPackagePromotion(row));
    }

    const result: Record<string, PublicPackagePromotion> = {};
    for (const [slot, promotion] of selectedBySlot) {
        if (slot === 'events') {
            result.Urodziny = promotion;
            result['Przyjęcie'] = promotion;
            result.Przyjecie = promotion;
        } else {
            result[promotion.serviceName] = promotion;
        }
    }
    return result;
}
"""
new = """export type HomepagePromotionCandidate = {
    id: number;
    service_name: string;
    show_on_home: boolean;
    starts_at: Date | string;
};

export function selectHomepagePromotionCandidates<T extends HomepagePromotionCandidate>(
    activeRows: T[],
    scheduledFeaturedRows: T[] = [],
): Map<string, T> {
    const scheduledSlots = new Set(
        scheduledFeaturedRows
            .filter(row => row.show_on_home)
            .map(row => homepagePromotionSlot(row.service_name)),
    );

    const sortedActive = [...activeRows].sort((left, right) => {
        const startDifference = toDate(right.starts_at).getTime() - toDate(left.starts_at).getTime();
        return startDifference || Number(right.id) - Number(left.id);
    });

    const rowsBySlot = new Map<string, T[]>();
    for (const row of sortedActive) {
        const slot = homepagePromotionSlot(row.service_name);
        const rows = rowsBySlot.get(slot) || [];
        rows.push(row);
        rowsBySlot.set(slot, rows);
    }

    const selected = new Map<string, T>();
    for (const [slot, rows] of rowsBySlot) {
        const explicitFeatured = rows.find(row => row.show_on_home);
        if (explicitFeatured) {
            selected.set(slot, explicitFeatured);
            continue;
        }

        // Compatibility for promotions hidden by the old scheduling rule: if a
        // future featured promotion is waiting, keep the current active offer on
        // the homepage until the successor actually starts.
        if (scheduledSlots.has(slot) && rows[0]) selected.set(slot, rows[0]);
    }
    return selected;
}

export async function loadFeaturedPromotionsByService(
    now = new Date(),
    db: PromotionDb = prisma,
): Promise<Record<string, PublicPackagePromotion>> {
    const [activeRows, scheduledFeaturedRows] = await Promise.all([
        db.$queryRaw<PromotionRow[]>(Prisma.sql`
            ${basePromotionSelect()}
            WHERE pp.\"is_enabled\" = TRUE
              AND pp.\"starts_at\" <= ${now}
              AND (pp.\"ends_at\" IS NULL OR pp.\"ends_at\" > ${now})
              AND p.\"is_active\" = TRUE
              AND st.\"is_active\" = TRUE
        `),
        db.$queryRaw<PromotionRow[]>(Prisma.sql`
            ${basePromotionSelect()}
            WHERE pp.\"is_enabled\" = TRUE
              AND pp.\"show_on_home\" = TRUE
              AND pp.\"starts_at\" > ${now}
              AND p.\"is_active\" = TRUE
              AND st.\"is_active\" = TRUE
        `),
    ]);

    const selectedRows = selectHomepagePromotionCandidates(activeRows, scheduledFeaturedRows);
    const result: Record<string, PublicPackagePromotion> = {};
    for (const [slot, row] of selectedRows) {
        const promotion = toPublicPackagePromotion(row as PromotionRow);
        if (slot === 'events') {
            result.Urodziny = promotion;
            result['Przyjęcie'] = promotion;
            result.Przyjecie = promotion;
        } else {
            result[promotion.serviceName] = promotion;
        }
    }
    return result;
}
"""
if content.count(old) != 1:
    raise SystemExit('src/lib/packagePromotions.ts: featured promotion loader block not found exactly once')
write(path, content.replace(old, new, 1))

# 3. Saving a future homepage promotion no longer strips the current one of its
# homepage eligibility before the future start time.
path = 'src/app/api/admin/package-promotions/route.ts'
content = read(path)
content = content.replace('    homepagePromotionServiceNames,\n', '', 1)
old = """            if (showOnHome && isEnabled) {
                const homeServiceNames = homepagePromotionServiceNames(pkg.service.name);
                const servicePackageIds = await tx.package.findMany({
                    where: { service: { name: { in: homeServiceNames } } },
                    select: { id: true },
                });
                // Keep non-overlapping scheduled promotions eligible for the same
                // homepage tile. Only a promotion competing in the same time
                // window loses the homepage flag.
                await tx.packagePromotion.updateMany({
                    where: {
                        id: { not: promotion.id },
                        package_id: { in: servicePackageIds.map(item => item.id) },
                        is_enabled: true,
                        show_on_home: true,
                        ...(endsAt ? { starts_at: { lt: endsAt } } : {}),
                        OR: [{ ends_at: null }, { ends_at: { gt: startsAt } }],
                    },
                    data: { show_on_home: false, updated_at: now },
                });
            }

"""
if content.count(old) != 1:
    raise SystemExit('src/app/api/admin/package-promotions/route.ts: eager homepage demotion block not found exactly once')
content = content.replace(old, """            // Multiple package promotions may be eligible for one homepage
            // service tile. The public selector chooses the most recently
            // started active one, so a scheduled successor never creates a gap.

""", 1)
write(path, content)

# 4. Promotion component redesign: compact editorial treatment instead of a
# second card nested inside the package card.
write('src/components/promotions/PromotionPriceBlock.tsx', """'use client';

import { useEffect, useRef } from 'react';
import { ArrowRight, Clock3 } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { formatPricePln, type PublicPackagePromotion } from '@/lib/packagePromotionPricing';

type PromotionPriceBlockProps = {
    promotion: PublicPackagePromotion;
    variant: 'home' | 'booking' | 'summary';
    className?: string;
};

function formatEndDate(value: string | null): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('pl-PL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Warsaw',
    }).format(date);
}

export default function PromotionPriceBlock({
    promotion,
    variant,
    className = '',
}: PromotionPriceBlockProps) {
    const endsAt = formatEndDate(promotion.endsAt);
    const savings = Math.max(0, promotion.regularPrice - promotion.price);
    const { trackEvent } = useAnalytics();
    const tracked = useRef(false);

    useEffect(() => {
        if (tracked.current) return;
        tracked.current = true;
        void trackEvent('promotion_view', {
            promotion_id: promotion.id,
            package_id: promotion.packageId,
            service: promotion.serviceName,
            placement: variant,
        });
    }, [promotion.id, promotion.packageId, promotion.serviceName, trackEvent, variant]);

    if (variant === 'home') {
        return (
            <div
                className={`w-full max-w-[19rem] rounded-[1.15rem] border border-[#ead5ab]/45 bg-black/58 px-4 py-3.5 text-left shadow-[0_18px_55px_rgba(0,0,0,.32)] backdrop-blur-md ${className}`}
                data-promotion-id={promotion.id}
                data-package-id={promotion.packageId}
            >
                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#b5523c] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[.18em] text-white">
                        {promotion.label}
                    </span>
                    {promotion.displayDiscountPercent > 0 && (
                        <span className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#f4dfb6]">
                            −{promotion.displayDiscountPercent}%
                        </span>
                    )}
                </div>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[.16em] text-white/72">
                    {promotion.packageName}
                </p>
                <div className="mt-1.5 flex items-end gap-3">
                    <strong className="font-display text-[2.25rem] font-normal leading-none text-white">
                        {formatPricePln(promotion.price)}
                    </strong>
                    <span className="mb-0.5 text-xs text-white/62 line-through decoration-[#e0a48f] decoration-2">
                        {formatPricePln(promotion.regularPrice)}
                    </span>
                    <ArrowRight className="mb-0.5 ml-auto shrink-0 text-[#ead5ab]" size={18} />
                </div>
                <p className="mt-2 text-[11px] leading-4 text-[#eee4d5]">{promotion.legalText}</p>
                {endsAt && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-[#f4dfb6]">
                        <Clock3 size={12} /> Do {endsAt}
                    </p>
                )}
            </div>
        );
    }

    if (variant === 'summary') {
        return (
            <div
                className={`border-l-2 border-[#c66f57] pl-3 text-left ${className}`}
                data-promotion-id={promotion.id}
                data-package-id={promotion.packageId}
            >
                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#a84631] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.14em] text-white">{promotion.label}</span>
                    {promotion.displayDiscountPercent > 0 && <span className="text-[10px] font-bold text-[#e9b3a4]">−{promotion.displayDiscountPercent}%</span>}
                </div>
                <div className="mt-2 flex flex-wrap items-baseline gap-2">
                    <strong className="text-xl font-extrabold text-[#f6d4c9]">{formatPricePln(promotion.price)}</strong>
                    <span className="text-xs text-zinc-500 line-through">{formatPricePln(promotion.regularPrice)}</span>
                </div>
                <p className="mt-1 text-[10px] leading-4 text-zinc-400">{promotion.legalText}</p>
            </div>
        );
    }

    return (
        <div
            className={`text-left ${className}`}
            data-promotion-id={promotion.id}
            data-package-id={promotion.packageId}
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-[#a84631] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[.17em] text-white">
                    {promotion.label}
                </span>
                <span className="text-[11px] font-bold text-[#8a3423]">
                    {savings > 0 ? `Oszczędzasz ${formatPricePln(savings)}` : `−${promotion.displayDiscountPercent}%`}
                </span>
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
                <strong className="text-[2.35rem] font-extrabold leading-none tracking-[-.035em] text-[#8a3423]">
                    {formatPricePln(promotion.price)}
                </strong>
                <span className="pb-0.5 text-sm font-semibold text-[#7b7168] line-through decoration-[#b95b44] decoration-2">
                    {formatPricePln(promotion.regularPrice)}
                </span>
                {promotion.displayDiscountPercent > 0 && (
                    <span className="pb-0.5 text-xs font-extrabold text-[#9d402c]">−{promotion.displayDiscountPercent}%</span>
                )}
            </div>
            <p className="mt-3 border-t border-[#dcb7a8]/65 pt-2.5 text-[11px] leading-4 text-[#5f554c]">
                {promotion.legalText}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold text-[#7b6359]">
                {endsAt && <span className="inline-flex items-center gap-1"><Clock3 size={11} /> Do {endsAt}</span>}
                {!promotion.allowPromoCode && <span>Bez dodatkowego kodu</span>}
            </div>
        </div>
    );
}
""")

# 5. Booking cards: widen the sales flow, integrate the promotion into the card,
# and use Polish price formatting without forced .00.
path = 'src/app/rezerwacja/page.tsx'
content = read(path)
content = content.replace(
    "import type { PublicPackagePromotion } from '@/lib/packagePromotionPricing';",
    "import { formatPricePln, type PublicPackagePromotion } from '@/lib/packagePromotionPricing';",
    1,
)
content = content.replace('className="max-w-4xl mx-auto pt-8"', 'className="max-w-6xl mx-auto pt-8"', 1)
content = content.replace(
    'className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"',
    'className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3"',
    1,
)
old = """                                            className={`p-5 rounded-2xl border transition-all text-left flex flex-col h-full ${chosenPackage?.id === pkg.id
                                                ? \"border-[#8d7f6d] bg-[#8d7f6d]/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]\"
                                                : \"border-[#ddd6cc] bg-white/75 hover:border-[#d2cabf] hover:bg-[#f1ede7]\"
                                                }`}
"""
new = """                                            aria-pressed={chosenPackage?.id === pkg.id}
                                            className={`relative flex h-full flex-col overflow-hidden rounded-[22px] border p-5 text-left transition-all duration-200 md:p-6 ${chosenPackage?.id === pkg.id
                                                ? pkg.promotion
                                                    ? \"border-[#a84631] bg-[linear-gradient(145deg,#fffdfb_0%,#fff5ef_58%,#f5e4db_100%)] shadow-[0_18px_45px_rgba(138,52,35,.16)] ring-2 ring-[#a84631]/15\"
                                                    : \"border-[#8d7f6d] bg-[#8d7f6d]/10 shadow-[0_14px_35px_rgba(89,78,66,.12)] ring-2 ring-[#8d7f6d]/10\"
                                                : pkg.promotion
                                                    ? \"border-[#d9aa97] bg-[linear-gradient(145deg,#fffefd_0%,#fff8f3_62%,#f8ebe4_100%)] shadow-[0_12px_32px_rgba(138,52,35,.08)] hover:-translate-y-0.5 hover:border-[#bd6a53] hover:shadow-[0_18px_40px_rgba(138,52,35,.13)]\"
                                                    : \"border-[#ddd6cc] bg-white/80 hover:-translate-y-0.5 hover:border-[#bfb3a5] hover:bg-white hover:shadow-[0_14px_34px_rgba(74,61,49,.08)]\"
                                                }`}
"""
if content.count(old) != 1:
    raise SystemExit('src/app/rezerwacja/page.tsx: package card class block not found')
content = content.replace(old, new, 1)
content = content.replace('className="min-h-[5.5rem] flex flex-col"', 'className="min-h-[5rem] flex flex-col"', 1)
content = content.replace(
    'className="inline-flex text-sm bg-[#8d7f6d]/10 px-2 py-0.5 rounded border border-[#b7aa99]/50 text-[#766958] font-extrabold"',
    'className="inline-flex w-fit rounded-full border border-[#b7aa99]/55 bg-[#8d7f6d]/10 px-2.5 py-1 text-xs font-extrabold text-[#766958]"',
    1,
)
content = content.replace(
    "{pkg.pricePrefix && `${pkg.pricePrefix} `}{(pkg.price / 100).toFixed(2)} zł",
    "{pkg.pricePrefix && `${pkg.pricePrefix} `}{formatPricePln(pkg.price)}",
    1,
)
content = content.replace(
    'className="text-[13px] text-[#6b645c] mt-2 prose prose-sm prose-p:my-0 prose-ul:my-2 prose-li:my-1 opacity-90"',
    'className="mt-auto border-t border-[#ddd6cc]/80 pt-4 text-[13px] leading-6 text-[#6b645c] prose prose-sm prose-p:my-0 prose-ul:my-2 prose-li:my-1 opacity-95"',
    1,
)
write(path, content)

# 6. Admin UX: start immediately by default and explain the one-card-per-service
# selection without the misleading "finish current" wording.
path = 'src/app/admin/promocje/page.tsx'
content = read(path)
content = content.replace('startsAt: toLocalInput(null, 5),', 'startsAt: toLocalInput(null),', 1)
content = content.replace(
    "const displayPercent = Math.max(1, Math.floor((1 - price / legalReference) * 100));",
    "const displayPercent = Math.max(1, Math.floor(((legalReference - price) * 100) / legalReference));",
    1,
)
old = """                                                    <button
                                                        type=\"button\"
                                                        onClick={() => openNew(pkg)}
                                                        disabled={!pkg.isActive || Boolean(current)}
                                                        className=\"rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400\"
                                                    >
                                                        {current ? 'Najpierw zakończ bieżącą' : 'Ustaw promocję'}
                                                    </button>
"""
new = """                                                    <div className=\"flex max-w-[15rem] flex-col items-start gap-2 sm:items-end\">
                                                        <button
                                                            type=\"button\"
                                                            onClick={() => openNew(pkg)}
                                                            disabled={!pkg.isActive || Boolean(current)}
                                                            className=\"rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300\"
                                                        >
                                                            {current
                                                                ? current.status === 'ACTIVE'
                                                                    ? 'Promocja aktywna'
                                                                    : 'Promocja zaplanowana'
                                                                : 'Ustaw promocję'}
                                                        </button>
                                                        {current && (
                                                            <p className=\"text-left text-[11px] leading-4 text-zinc-500 sm:text-right\">
                                                                {current.status === 'ACTIVE'
                                                                    ? 'Zakończ ją ikoną zasilania, aby ustawić kolejny okres dla tego pakietu.'
                                                                    : `Uruchomi się automatycznie ${new Date(current.startsAt).toLocaleString('pl-PL')}.`}
                                                            </p>
                                                        )}
                                                    </div>
"""
if content.count(old) != 1:
    raise SystemExit('src/app/admin/promocje/page.tsx: current-promotion button block not found')
content = content.replace(old, new, 1)
content = content.replace(
    "<span>{promotion.showOnHome ? 'Kafelek strony głównej' : 'Tylko rezerwacja'}</span>",
    "<span>{promotion.showOnHome ? 'Może być wyróżniona na stronie głównej' : 'Tylko rezerwacja'}</span>",
    1,
)
old = """                            <label className=\"flex items-center gap-3 rounded-xl border border-zinc-700 p-4 text-sm\">
                                <input type=\"checkbox\" checked={editor.showOnHome} onChange={event => setEditor({ ...editor, showOnHome: event.target.checked })} className=\"h-4 w-4\" />
                                Pokaż na kafelku strony głównej
                            </label>
"""
new = """                            <label className=\"flex items-start gap-3 rounded-xl border border-zinc-700 p-4 text-sm\">
                                <input type=\"checkbox\" checked={editor.showOnHome} onChange={event => setEditor({ ...editor, showOnHome: event.target.checked })} className=\"mt-1 h-4 w-4\" />
                                <span>
                                    <strong className=\"block text-zinc-200\">Wyróżnij na stronie głównej</strong>
                                    <span className=\"mt-1 block text-xs leading-5 text-zinc-500\">
                                        Zaplanowana promocja nie ukryje obecnej przed startem. Gdy kilka promocji tej usługi jest aktywnych, kafelek pokaże tę rozpoczętą najpóźniej.
                                    </span>
                                </span>
                            </label>
"""
if content.count(old) != 1:
    raise SystemExit('src/app/admin/promocje/page.tsx: homepage checkbox block not found')
content = content.replace(old, new, 1)
write(path, content)

# 7. Unit coverage for exact percentages and deterministic homepage handover.
path = 'tests/unit/package-promotions.test.ts'
content = read(path)
content = content.replace(
    "    regularPriceHistoryCoversLookback,\n",
    "    regularPriceHistoryCoversLookback,\n    selectHomepagePromotionCandidates,\n",
    1,
)
content = content.replace(
    "    assert.equal(calculateReferenceDiscountPercent(75_000, 50_000), 33);\n",
    "    assert.equal(calculateReferenceDiscountPercent(75_000, 50_000), 33);\n    assert.equal(calculateReferenceDiscountPercent(75_000, 60_000), 20);\n",
    1,
)
content += """

test('scheduled homepage successor does not blank the current active promotion', () => {
    const current = {
        id: 11,
        service_name: 'Sesja',
        show_on_home: false,
        starts_at: new Date('2026-09-01T10:00:00.000Z'),
    };
    const scheduled = {
        id: 12,
        service_name: 'Sesja',
        show_on_home: true,
        starts_at: new Date('2026-09-02T10:00:00.000Z'),
    };
    const selected = selectHomepagePromotionCandidates([current], [scheduled]);
    assert.equal(selected.get('sesja')?.id, 11);
});

test('latest-started active featured promotion wins the one homepage service tile', () => {
    const older = {
        id: 21,
        service_name: 'Sesja',
        show_on_home: true,
        starts_at: new Date('2026-09-01T08:00:00.000Z'),
    };
    const newer = {
        id: 22,
        service_name: 'Sesja',
        show_on_home: true,
        starts_at: new Date('2026-09-01T12:00:00.000Z'),
    };
    const selected = selectHomepagePromotionCandidates([older, newer]);
    assert.equal(selected.get('sesja')?.id, 22);
});

test('an intentionally hidden promotion stays off homepage without a scheduled handover', () => {
    const hidden = {
        id: 31,
        service_name: 'Sesja',
        show_on_home: false,
        starts_at: new Date('2026-09-01T08:00:00.000Z'),
    };
    assert.equal(selectHomepagePromotionCandidates([hidden]).size, 0);
});
"""
write(path, content)

print('Promotion merchandising logic and card design patch applied.')
