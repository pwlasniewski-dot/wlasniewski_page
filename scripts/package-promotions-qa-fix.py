from pathlib import Path

ROOT = Path.cwd()


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding='utf-8')


def write(path: str, content: str) -> None:
    (ROOT / path).write_text(content, encoding='utf-8')


def replace_once(path: str, old: str, new: str) -> None:
    content = read(path)
    if old not in content:
        raise SystemExit(f'Expected block not found in {path}: {old[:120]!r}')
    write(path, content.replace(old, new, 1))


# 1. Shared promotion types and conservative percentage display.
path = 'src/lib/packagePromotionPricing.ts'
replace_once(
    path,
    "export type PromotionReferenceSource = 'AUTO_HISTORY' | 'ADMIN_CONFIRMED';\n",
    "export type PromotionReferenceSource = 'AUTO_HISTORY' | 'ADMIN_CONFIRMED';\n"
    "export type PromotionReferencePeriod = 'THIRTY_DAYS' | 'SINCE_OFFERING';\n",
)
replace_once(
    path,
    "    referenceSource: PromotionReferenceSource;\n    startsAt: string;\n",
    "    referenceSource: PromotionReferenceSource;\n"
    "    referencePeriod: PromotionReferencePeriod;\n"
    "    startsAt: string;\n",
)
replace_once(
    path,
    "    return Math.max(1, Math.round((1 - promotionalPrice / referencePrice) * 100));\n}\n\nexport function isPromotionWindowActive(\n",
    "    // Do not round upward: a public percentage must never overstate the reduction.\n"
    "    return Math.max(1, Math.floor((1 - promotionalPrice / referencePrice) * 100));\n"
    "}\n\n"
    "export function legalReferenceText(\n"
    "    referencePrice: number,\n"
    "    period: PromotionReferencePeriod,\n"
    "): string {\n"
    "    const label = period === 'SINCE_OFFERING'\n"
    "        ? 'Najniższa cena od rozpoczęcia oferowania'\n"
    "        : 'Najniższa cena z 30 dni przed obniżką';\n"
    "    return `${label}: ${formatPricePln(referencePrice)}`;\n"
    "}\n\n"
    "export function isPromotionWindowActive(\n",
)

# 2. Price-history coverage and legal reference period.
path = 'src/lib/packagePromotions.ts'
replace_once(
    path,
    "    calculateReferenceDiscountPercent,\n    formatPricePln,\n    type PublicPackagePromotion,\n",
    "    calculateReferenceDiscountPercent,\n"
    "    legalReferenceText,\n"
    "    type PromotionReferencePeriod,\n"
    "    type PublicPackagePromotion,\n",
)
replace_once(
    path,
    "    type PromotionReferenceSource,\n    type PublicPackagePromotion,\n",
    "    type PromotionReferenceSource,\n"
    "    type PromotionReferencePeriod,\n"
    "    type PublicPackagePromotion,\n",
)
replace_once(
    path,
    "    lowest_price_source: string;\n    label: string;\n",
    "    lowest_price_source: string;\n"
    "    lowest_price_period: string;\n"
    "    label: string;\n",
)
replace_once(
    path,
    "function toDate(value: Date | string): Date {\n    return value instanceof Date ? value : new Date(value);\n}\n\nfunction basePromotionSelect()",
    "function toDate(value: Date | string): Date {\n"
    "    return value instanceof Date ? value : new Date(value);\n"
    "}\n\n"
    "export function regularPriceHistoryCoversLookback(\n"
    "    rows: Array<Pick<PriceHistoryRow, 'valid_from' | 'valid_to'>>,\n"
    "    lookbackStartsAt: Date,\n"
    "): boolean {\n"
    "    return rows.some(row => {\n"
    "        const validFrom = toDate(row.valid_from);\n"
    "        const validTo = row.valid_to ? toDate(row.valid_to) : null;\n"
    "        // A migration baseline is uncertain only before it was recorded.\n"
    "        // Once the whole reference window starts after valid_from, the\n"
    "        // application has continuously observed that price and all changes.\n"
    "        return validFrom <= lookbackStartsAt\n"
    "            && (!validTo || validTo > lookbackStartsAt);\n"
    "    });\n"
    "}\n\n"
    "function basePromotionSelect()",
)
replace_once(
    path,
    "            pp.\"lowest_price_source\",\n            pp.\"label\",\n",
    "            pp.\"lowest_price_source\",\n"
    "            pp.\"lowest_price_period\",\n"
    "            pp.\"label\",\n",
)
replace_once(
    path,
    "    const promotionalPrice = Number(record.promotional_price);\n\n    return {\n",
    "    const promotionalPrice = Number(record.promotional_price);\n"
    "    const referencePeriod: PromotionReferencePeriod = record.lowest_price_period === 'SINCE_OFFERING'\n"
    "        ? 'SINCE_OFFERING'\n"
    "        : 'THIRTY_DAYS';\n\n"
    "    return {\n",
)
replace_once(
    path,
    "        referenceSource: record.lowest_price_source === 'AUTO_HISTORY'\n            ? 'AUTO_HISTORY'\n            : 'ADMIN_CONFIRMED',\n        startsAt: startsAt.toISOString(),\n",
    "        referenceSource: record.lowest_price_source === 'AUTO_HISTORY'\n"
    "            ? 'AUTO_HISTORY'\n"
    "            : 'ADMIN_CONFIRMED',\n"
    "        referencePeriod,\n"
    "        startsAt: startsAt.toISOString(),\n",
)
replace_once(
    path,
    "        legalText: `Najniższa cena z 30 dni przed obniżką: ${formatPricePln(lowestPrice30d)}`,\n",
    "        legalText: legalReferenceText(lowestPrice30d, referencePeriod),\n",
)
replace_once(
    path,
    "    lookbackStartsAt: Date;\n    candidates: Array<{ kind: 'REGULAR' | 'PROMOTION'; price: number }>;\n",
    "    lookbackStartsAt: Date;\n"
    "    referencePeriod: PromotionReferencePeriod;\n"
    "    candidates: Array<{ kind: 'REGULAR' | 'PROMOTION'; price: number }>;\n",
)
replace_once(
    path,
    "    db: PromotionDb = prisma,\n    excludePromotionId?: number,\n): Promise<LowestPriceResolution> {\n    const lookbackStartsAt = new Date(promotionStartsAt.getTime() - 30 * 24 * 60 * 60 * 1000);\n",
    "    db: PromotionDb = prisma,\n"
    "    excludePromotionId?: number,\n"
    "    offeringStartedAt?: Date,\n"
    "): Promise<LowestPriceResolution> {\n"
    "    const thirtyDaysStartsAt = new Date(promotionStartsAt.getTime() - 30 * 24 * 60 * 60 * 1000);\n"
    "    const normalizedOfferingStart = offeringStartedAt && !Number.isNaN(offeringStartedAt.getTime())\n"
    "        ? offeringStartedAt\n"
    "        : null;\n"
    "    const referencePeriod: PromotionReferencePeriod = normalizedOfferingStart\n"
    "        && normalizedOfferingStart > thirtyDaysStartsAt\n"
    "        ? 'SINCE_OFFERING'\n"
    "        : 'THIRTY_DAYS';\n"
    "    const lookbackStartsAt = referencePeriod === 'SINCE_OFFERING'\n"
    "        ? normalizedOfferingStart!\n"
    "        : thirtyDaysStartsAt;\n",
)
replace_once(
    path,
    "    const completeHistory = regularHistory.some(row => {\n        const validFrom = toDate(row.valid_from);\n        const validTo = row.valid_to ? toDate(row.valid_to) : null;\n        return row.verified === true\n            && validFrom <= lookbackStartsAt\n            && (!validTo || validTo > lookbackStartsAt);\n    });\n",
    "    const completeHistory = regularPriceHistoryCoversLookback(regularHistory, lookbackStartsAt);\n",
)
replace_once(
    path,
    "        lookbackStartsAt,\n        candidates,\n",
    "        lookbackStartsAt,\n"
    "        referencePeriod,\n"
    "        candidates,\n",
)

# 3. Database migration and Prisma model.
path = 'prisma/migrations/20260901130000_package_promotions/migration.sql'
replace_once(
    path,
    "  \"lowest_price_source\" TEXT NOT NULL,\n  \"lowest_price_confirmed_at\" TIMESTAMP(3) NOT NULL,\n",
    "  \"lowest_price_source\" TEXT NOT NULL,\n"
    "  \"lowest_price_period\" TEXT NOT NULL,\n"
    "  \"lowest_price_confirmed_at\" TIMESTAMP(3) NOT NULL,\n",
)
replace_once(
    path,
    "      AND \"promotional_price\" < \"regular_price_snapshot\"\n      AND \"promotional_price\" < \"lowest_price_30d\"\n",
    "      AND \"lowest_price_30d\" <= \"regular_price_snapshot\"\n"
    "      AND \"promotional_price\" < \"regular_price_snapshot\"\n"
    "      AND \"promotional_price\" < \"lowest_price_30d\"\n",
)
replace_once(
    path,
    "  CONSTRAINT \"package_promotions_reference_source_check\"\n    CHECK (\"lowest_price_source\" IN ('AUTO_HISTORY', 'ADMIN_CONFIRMED')),\n",
    "  CONSTRAINT \"package_promotions_reference_source_check\"\n"
    "    CHECK (\"lowest_price_source\" IN ('AUTO_HISTORY', 'ADMIN_CONFIRMED')),\n"
    "  CONSTRAINT \"package_promotions_reference_period_check\"\n"
    "    CHECK (\"lowest_price_period\" IN ('THIRTY_DAYS', 'SINCE_OFFERING')),\n",
)

path = 'prisma/schema.prisma'
replace_once(
    path,
    "  lowest_price_source       String\n  lowest_price_confirmed_at DateTime\n",
    "  lowest_price_source       String\n"
    "  lowest_price_period       String\n"
    "  lowest_price_confirmed_at DateTime\n",
)

# 4. Admin API: calculate the correct legal period and reject impossible references.
path = 'src/app/api/admin/package-promotions/route.ts'
replace_once(
    path,
    "                return await resolveLowestPriceBeforePromotion(pkg.id, now);\n            } catch {\n                return { completeHistory: false, lowestPrice: null };\n",
    "                return await resolveLowestPriceBeforePromotion(pkg.id, now, prisma, undefined, pkg.created_at);\n"
    "            } catch {\n"
    "                return { completeHistory: false, lowestPrice: null, referencePeriod: 'THIRTY_DAYS' as const };\n",
)
replace_once(
    path,
    "                regularPrice: pkg.price,\n                isActive: pkg.is_active && pkg.service.is_active,\n",
    "                regularPrice: pkg.price,\n"
    "                createdAt: pkg.created_at.toISOString(),\n"
    "                isActive: pkg.is_active && pkg.service.is_active,\n",
)
replace_once(
    path,
    "                    lowestPrice30d: historyPreview[index]?.lowestPrice || null,\n                },\n",
    "                    lowestPrice30d: historyPreview[index]?.lowestPrice || null,\n"
    "                    referencePeriod: historyPreview[index]?.referencePeriod || 'THIRTY_DAYS',\n"
    "                },\n",
)
replace_once(
    path,
    "                    referenceSource: promotion.lowest_price_source,\n                    label: promotion.label,\n",
    "                    referenceSource: promotion.lowest_price_source,\n"
    "                    referencePeriod: promotion.lowest_price_period,\n"
    "                    label: promotion.label,\n",
)
replace_once(
    path,
    "                promotionId || undefined,\n            );\n",
    "                promotionId || undefined,\n"
    "                pkg.created_at,\n"
    "            );\n",
)
replace_once(
    path,
    "            if (promotionalPrice >= lowestPrice30d) {\n                throw new Error('NOT_LOWER_THAN_REFERENCE');\n            }\n",
    "            if (lowestPrice30d > pkg.price) {\n"
    "                throw new Error('REFERENCE_ABOVE_REGULAR');\n"
    "            }\n"
    "            if (promotionalPrice >= lowestPrice30d) {\n"
    "                throw new Error('NOT_LOWER_THAN_REFERENCE');\n"
    "            }\n",
)
replace_once(
    path,
    "                lowest_price_source: lowestPriceSource,\n                lowest_price_confirmed_at: now,\n",
    "                lowest_price_source: lowestPriceSource,\n"
    "                lowest_price_period: reference.referencePeriod,\n"
    "                lowest_price_confirmed_at: now,\n",
)
replace_once(
    path,
    "            NOT_LOWER_THAN_REFERENCE: {\n                status: 409,\n                message: 'Cena promocyjna musi być niższa od najniższej ceny z 30 dni przed obniżką.',\n            },\n",
    "            REFERENCE_ABOVE_REGULAR: {\n"
    "                status: 409,\n"
    "                message: 'Najniższa wcześniejsza cena nie może być wyższa od ceny regularnej obowiązującej bezpośrednio przed promocją.',\n"
    "            },\n"
    "            NOT_LOWER_THAN_REFERENCE: {\n"
    "                status: 409,\n"
    "                message: 'Cena promocyjna musi być niższa od właściwej ceny referencyjnej przed obniżką.',\n"
    "            },\n",
)

# 5. Admin UI: period-aware copy and a conservative public percentage.
path = 'src/app/admin/promocje/page.tsx'
replace_once(
    path,
    "    referenceSource: 'AUTO_HISTORY' | 'ADMIN_CONFIRMED';\n    label: string;\n",
    "    referenceSource: 'AUTO_HISTORY' | 'ADMIN_CONFIRMED';\n"
    "    referencePeriod: 'THIRTY_DAYS' | 'SINCE_OFFERING';\n"
    "    label: string;\n",
)
replace_once(
    path,
    "    regularPrice: number;\n    isActive: boolean;\n    automaticReference: { available: boolean; lowestPrice30d: number | null };\n",
    "    regularPrice: number;\n"
    "    createdAt: string;\n"
    "    isActive: boolean;\n"
    "    automaticReference: {\n"
    "        available: boolean;\n"
    "        lowestPrice30d: number | null;\n"
    "        referencePeriod: 'THIRTY_DAYS' | 'SINCE_OFFERING';\n"
    "    };\n",
)
replace_once(
    path,
    "function statusClass(status: PromotionStatus) {\n    if (status === 'ACTIVE') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';\n    if (status === 'SCHEDULED') return 'border-sky-500/40 bg-sky-500/10 text-sky-300';\n    if (status === 'ENDED') return 'border-zinc-700 bg-zinc-800 text-zinc-400';\n    return 'border-amber-500/40 bg-amber-500/10 text-amber-300';\n}\n",
    "function statusClass(status: PromotionStatus) {\n"
    "    if (status === 'ACTIVE') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';\n"
    "    if (status === 'SCHEDULED') return 'border-sky-500/40 bg-sky-500/10 text-sky-300';\n"
    "    if (status === 'ENDED') return 'border-zinc-700 bg-zinc-800 text-zinc-400';\n"
    "    return 'border-amber-500/40 bg-amber-500/10 text-amber-300';\n"
    "}\n\n"
    "function referencePeriodFor(packageCreatedAt: string, promotionStartsAt: string) {\n"
    "    const createdAt = new Date(packageCreatedAt);\n"
    "    const startsAt = new Date(promotionStartsAt);\n"
    "    if (Number.isNaN(createdAt.getTime()) || Number.isNaN(startsAt.getTime())) return 'THIRTY_DAYS' as const;\n"
    "    return startsAt.getTime() - createdAt.getTime() < 30 * 24 * 60 * 60 * 1000\n"
    "        ? 'SINCE_OFFERING' as const\n"
    "        : 'THIRTY_DAYS' as const;\n"
    "}\n\n"
    "function legalReferenceLabel(period: 'THIRTY_DAYS' | 'SINCE_OFFERING') {\n"
    "    return period === 'SINCE_OFFERING'\n"
    "        ? 'Najniższa cena od rozpoczęcia oferowania'\n"
    "        : 'Najniższa cena z 30 dni przed obniżką';\n"
    "}\n",
)
replace_once(
    path,
    "    const preview = useMemo(() => {\n        if (!editor || !editedPackage) return null;\n",
    "    const editorReferencePeriod = editor && editedPackage\n"
    "        ? referencePeriodFor(editedPackage.createdAt, editor.startsAt)\n"
    "        : 'THIRTY_DAYS' as const;\n\n"
    "    const preview = useMemo(() => {\n"
    "        if (!editor || !editedPackage) return null;\n",
)
replace_once(
    path,
    "        if (price >= legalReference) return null;\n        const displayPercent = Math.max(1, Math.round((1 - price / legalReference) * 100));\n        return { price, legalReference, displayPercent };\n    }, [editor, editedPackage]);\n",
    "        if (legalReference > editedPackage.regularPrice || price >= legalReference) return null;\n"
    "        const displayPercent = Math.max(1, Math.floor((1 - price / legalReference) * 100));\n"
    "        return { price, legalReference, displayPercent, referencePeriod: editorReferencePeriod };\n"
    "    }, [editor, editedPackage, editorReferencePeriod]);\n",
)
replace_once(
    path,
    "                                <span className=\"mb-2 block text-sm font-semibold text-zinc-300\">Najniższa cena z 30 dni przed obniżką (zł)</span>\n",
    "                                <span className=\"mb-2 block text-sm font-semibold text-zinc-300\">{legalReferenceLabel(editorReferencePeriod)} (zł)</span>\n",
)
replace_once(
    path,
    "                                        : 'Wpisz faktyczną najniższą cenę obowiązującą przed promocją.'}\n",
    "                                        : editorReferencePeriod === 'SINCE_OFFERING'\n"
    "                                            ? 'Wpisz faktyczną najniższą cenę od dnia rozpoczęcia oferowania tego pakietu.'\n"
    "                                            : 'Wpisz faktyczną najniższą cenę z 30 dni przed promocją.'}\n",
)
replace_once(
    path,
    "                                    Potwierdzam, że wpisana wartość jest rzeczywistą najniższą ceną tego pakietu z 30 dni przed rozpoczęciem obniżki.\n",
    "                                    Potwierdzam, że wpisana wartość jest rzeczywistą wartością: {legalReferenceLabel(editorReferencePeriod).toLocaleLowerCase('pl')} tego pakietu.\n",
)
replace_once(
    path,
    "                                    <p className=\"mt-2 text-xs\">Najniższa cena z 30 dni przed obniżką: {formatPln(preview.legalReference)}</p>\n",
    "                                    <p className=\"mt-2 text-xs\">{legalReferenceLabel(preview.referencePeriod)}: {formatPln(preview.legalReference)}</p>\n",
)

# 6. Remove duplicate booking promotion_view tracking.
path = 'src/app/rezerwacja/page.tsx'
replace_once(path, "    const viewedPromotionIds = useRef<Set<number>>(new Set());\n", "")
replace_once(
    path,
    "    useEffect(() => {\n        activePackages.forEach(pkg => {\n            if (!pkg.promotion || viewedPromotionIds.current.has(pkg.promotion.id)) return;\n            viewedPromotionIds.current.add(pkg.promotion.id);\n            void trackEvent('promotion_view', {\n                promotion_id: pkg.promotion.id,\n                package_id: pkg.id,\n                service: service?.name,\n                placement: 'booking',\n            });\n        });\n    }, [activePackages, service?.name, trackEvent]);\n\n",
    "",
)

# 7. Fix the existing category delete URL regression.
replace_once(
    'src/app/admin/rezerwacja/page.tsx',
    "`${`${getApiUrl('service-types')}?view=admin`}?id=${serviceId}`",
    "`${getApiUrl('service-types')}?view=admin&id=${serviceId}`",
)

# 8. Fail safely when a promotion seen by the client expires or cannot be verified.
path = 'src/app/api/basket/checkout/route.ts'
replace_once(
    path,
    "                    regularPackagePrice = selectedPackage.price;\n                    try {\n                        packagePromotion = await loadActivePromotionForPackage(selectedPackage.id);\n                    } catch (promotionError) {\n                        console.warn('[checkout] Package promotions unavailable; using regular package price.', promotionError);\n                        packagePromotion = null;\n                    }\n                    basePrice = packagePromotion?.price ?? regularPackagePrice;\n",
    "                    regularPackagePrice = selectedPackage.price;\n"
    "                    const expectedPromotionId = Number(md.package_promotion?.id);\n"
    "                    const clientExpectedPromotion = Number.isInteger(expectedPromotionId) && expectedPromotionId > 0;\n"
    "                    try {\n"
    "                        packagePromotion = await loadActivePromotionForPackage(selectedPackage.id);\n"
    "                    } catch (promotionError) {\n"
    "                        console.warn('[checkout] Package promotion verification failed.', promotionError);\n"
    "                        if (clientExpectedPromotion) {\n"
    "                            return NextResponse.json({\n"
    "                                ok: false,\n"
    "                                message: 'Nie udało się teraz potwierdzić ceny promocyjnej. Odśwież rezerwację i spróbuj ponownie — nie pobierzemy wyższej kwoty bez potwierdzenia.',\n"
    "                            }, { status: 503 });\n"
    "                        }\n"
    "                        packagePromotion = null;\n"
    "                    }\n"
    "                    if (clientExpectedPromotion && packagePromotion?.id !== expectedPromotionId) {\n"
    "                        return NextResponse.json({\n"
    "                            ok: false,\n"
    "                            message: 'Promocja w koszyku zakończyła się albo została zmieniona. Odśwież rezerwację, aby zobaczyć aktualną cenę.',\n"
    "                        }, { status: 409 });\n"
    "                    }\n"
    "                    basePrice = packagePromotion?.price ?? regularPackagePrice;\n",
)

# 9. Clear legal labelling and show the precise end time.
path = 'src/components/promotions/PromotionPriceBlock.tsx'
replace_once(
    path,
    "        year: 'numeric',\n        timeZone: 'Europe/Warsaw',\n",
    "        year: 'numeric',\n"
    "        hour: '2-digit',\n"
    "        minute: '2-digit',\n"
    "        timeZone: 'Europe/Warsaw',\n",
)
replace_once(
    path,
    "    const endsAt = formatEndDate(promotion.endsAt);\n    const { trackEvent } = useAnalytics();\n",
    "    const endsAt = formatEndDate(promotion.endsAt);\n"
    "    const referenceWindowLabel = promotion.referencePeriod === 'SINCE_OFFERING'\n"
    "        ? 'od rozpoczęcia oferowania'\n"
    "        : 'z 30 dni';\n"
    "    const { trackEvent } = useAnalytics();\n",
)
replace_once(
    path,
    "                    <span className=\"text-sm text-white/55 line-through decoration-[#d9a081] decoration-2\">\n                        {formatPricePln(promotion.regularPrice)}\n                    </span>\n",
    "                    <span className=\"text-[11px] text-white/60\">Cena regularna <span className=\"line-through decoration-[#d9a081] decoration-2\">{formatPricePln(promotion.regularPrice)}</span></span>\n",
)
replace_once(
    path,
    "                    <span className=\"text-xs font-semibold text-zinc-500 line-through\">{formatPricePln(promotion.regularPrice)}</span>\n",
    "                    <span className=\"text-xs font-semibold text-zinc-500\">Cena regularna <span className=\"line-through\">{formatPricePln(promotion.regularPrice)}</span></span>\n",
)
replace_once(
    path,
    "                    −{promotion.displayDiscountPercent}% względem ceny z 30 dni\n",
    "                    −{promotion.displayDiscountPercent}% względem ceny {referenceWindowLabel}\n",
)
replace_once(
    path,
    "                <span className=\"text-base font-semibold text-[#7b7168] line-through decoration-[#b95b44] decoration-2\">\n                    {formatPricePln(promotion.regularPrice)}\n                </span>\n",
    "                <span className=\"text-sm font-semibold text-[#7b7168]\">Cena regularna <span className=\"line-through decoration-[#b95b44] decoration-2\">{formatPricePln(promotion.regularPrice)}</span></span>\n",
)

# 10. Tests and documentation.
path = 'tests/unit/package-promotions.test.ts'
replace_once(
    path,
    "    isPromotionWindowActive,\n    promotionAllowsAdditionalDiscount,\n",
    "    isPromotionWindowActive,\n"
    "    legalReferenceText,\n"
    "    promotionAllowsAdditionalDiscount,\n",
)
replace_once(
    path,
    "} from '../../src/lib/packagePromotionPricing';\n",
    "} from '../../src/lib/packagePromotionPricing';\n"
    "import { regularPriceHistoryCoversLookback } from '../../src/lib/packagePromotions';\n",
)
replace_once(path, "    assert.equal(calculateReferenceDiscountPercent(60_000, 50_000), 17);\n", "    assert.equal(calculateReferenceDiscountPercent(60_000, 50_000), 16);\n")
write(
    path,
    read(path) + "\n"
    "test('public legal copy distinguishes a package offered for less than 30 days', () => {\n"
    "    assert.equal(\n"
    "        legalReferenceText(75_000, 'THIRTY_DAYS'),\n"
    "        'Najniższa cena z 30 dni przed obniżką: 750 zł',\n"
    "    );\n"
    "    assert.equal(\n"
    "        legalReferenceText(75_000, 'SINCE_OFFERING'),\n"
    "        'Najniższa cena od rozpoczęcia oferowania: 750 zł',\n"
    "    );\n"
    "});\n\n"
    "test('migration baseline becomes sufficient after the complete observed window', () => {\n"
    "    const lookback = new Date('2026-10-01T12:00:00.000Z');\n"
    "    assert.equal(regularPriceHistoryCoversLookback([{\n"
    "        valid_from: new Date('2026-09-01T12:00:00.000Z'),\n"
    "        valid_to: null,\n"
    "    }], lookback), true);\n"
    "    assert.equal(regularPriceHistoryCoversLookback([{\n"
    "        valid_from: new Date('2026-09-15T12:00:00.000Z'),\n"
    "        valid_to: null,\n"
    "    }], lookback), false);\n"
    "});\n",
)

path = 'docs/PACKAGE_PROMOTIONS.md'
replace_once(
    path,
    "- tekst: `Najniższa cena z 30 dni przed obniżką: …`,\n",
    "- tekst: `Najniższa cena z 30 dni przed obniżką: …`, a dla pakietu oferowanego krócej niż 30 dni: `Najniższa cena od rozpoczęcia oferowania: …`,\n",
)

print('Package promotion QA corrections applied.')
