from pathlib import Path

ROOT = Path.cwd()


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding='utf-8')


def write(path: str, content: str) -> None:
    (ROOT / path).write_text(content, encoding='utf-8')


def replace_once(path: str, old: str, new: str) -> None:
    content = read(path)
    if old not in content:
        raise SystemExit(f'Expected block not found in {path}: {old[:160]!r}')
    write(path, content.replace(old, new, 1))


# Shared mapping: the homepage has one commercial tile for birthdays and receptions.
path = 'src/lib/packagePromotions.ts'
replace_once(
    path,
    "    calculateReferenceDiscountPercent,\n    formatPricePln,\n",
    "    calculateReferenceDiscountPercent,\n"
    "    formatPricePln,\n"
    "    legalReferenceText,\n",
)
replace_once(
    path,
    "export async function loadFeaturedPromotionsByService(\n",
    "export function homepagePromotionSlot(serviceName: string): string {\n"
    "    const normalized = serviceName.trim().toLocaleLowerCase('pl');\n"
    "    if (['urodziny', 'przyjęcie', 'przyjecie'].includes(normalized)) return 'events';\n"
    "    return normalized;\n"
    "}\n\n"
    "export function homepagePromotionServiceNames(serviceName: string): string[] {\n"
    "    return homepagePromotionSlot(serviceName) === 'events'\n"
    "        ? ['Urodziny', 'Przyjęcie', 'Przyjecie']\n"
    "        : [serviceName];\n"
    "}\n\n"
    "export async function loadFeaturedPromotionsByService(\n",
)
replace_once(
    path,
    "    return rows.reduce<Record<string, PublicPackagePromotion>>((result, row) => {\n        if (!result[row.service_name]) result[row.service_name] = toPublicPackagePromotion(row);\n        return result;\n    }, {});\n}\n",
    "    const selectedBySlot = new Map<string, PublicPackagePromotion>();\n"
    "    for (const row of rows) {\n"
    "        const slot = homepagePromotionSlot(row.service_name);\n"
    "        if (!selectedBySlot.has(slot)) selectedBySlot.set(slot, toPublicPackagePromotion(row));\n"
    "    }\n\n"
    "    const result: Record<string, PublicPackagePromotion> = {};\n"
    "    for (const [slot, promotion] of selectedBySlot) {\n"
    "        if (slot === 'events') {\n"
    "            result.Urodziny = promotion;\n"
    "            result['Przyjęcie'] = promotion;\n"
    "            result.Przyjecie = promotion;\n"
    "        } else {\n"
    "            result[promotion.serviceName] = promotion;\n"
    "        }\n"
    "    }\n"
    "    return result;\n"
    "}\n",
)

# Admin API: historical legal text, reference-period copy and one homepage promotion per grouped tile.
path = 'src/app/api/admin/package-promotions/route.ts'
replace_once(
    path,
    "    formatPricePln,\n    resolveLowestPriceBeforePromotion,\n",
    "    formatPricePln,\n"
    "    homepagePromotionServiceNames,\n"
    "    legalReferenceText,\n"
    "    resolveLowestPriceBeforePromotion,\n",
)
replace_once(
    path,
    "                    legalText: `Najniższa cena z 30 dni przed obniżką: ${formatPricePln(promotion.lowest_price_30d)}`,\n",
    "                    legalText: legalReferenceText(\n"
    "                        promotion.lowest_price_30d,\n"
    "                        promotion.lowest_price_period === 'SINCE_OFFERING' ? 'SINCE_OFFERING' : 'THIRTY_DAYS',\n"
    "                    ),\n",
)
replace_once(
    path,
    "            if (showOnHome && isEnabled) {\n                const servicePackageIds = await tx.package.findMany({\n                    where: { service_id: pkg.service_id },\n                    select: { id: true },\n                });\n",
    "            if (showOnHome && isEnabled) {\n"
    "                const homeServiceNames = homepagePromotionServiceNames(pkg.service.name);\n"
    "                const servicePackageIds = await tx.package.findMany({\n"
    "                    where: { service: { name: { in: homeServiceNames } } },\n"
    "                    select: { id: true },\n"
    "                });\n",
)
replace_once(
    path,
    "                message: 'Brakuje pełnej historii 30 dni. Wpisz rzeczywistą najniższą cenę i potwierdź ją świadomie.',\n",
    "                message: 'Brakuje pełnej historii wymaganego okresu przed obniżką. Wpisz rzeczywistą najniższą cenę i potwierdź ją świadomie.',\n",
)

# Homepage: keep the tile but route to the promoted service and package.
path = 'src/app/HomeContent.tsx'
replace_once(
    path,
    "interface HomeContentProps {\n",
    "function promotionBookingHref(baseHref: string, promotion: PublicPackagePromotion): string {\n"
    "    const [pathname, rawQuery = ''] = baseHref.split('?');\n"
    "    const query = new URLSearchParams(rawQuery);\n"
    "    query.set('service', promotion.serviceName);\n"
    "    query.set('package_id', String(promotion.packageId));\n"
    "    query.set('promotion_id', String(promotion.id));\n"
    "    return `${pathname}?${query.toString()}`;\n"
    "}\n\n"
    "interface HomeContentProps {\n",
)
replace_once(
    path,
    "                                    href={featuredPromotions[item.service]\n                                        ? `${item.href}${item.href.includes('?') ? '&' : '?'}package_id=${featuredPromotions[item.service].packageId}&promotion_id=${featuredPromotions[item.service].id}`\n                                        : item.href}\n",
    "                                    href={featuredPromotions[item.service]\n"
    "                                        ? promotionBookingHref(item.href, featuredPromotions[item.service])\n"
    "                                        : item.href}\n",
)

# Admin UI: precise period copy both in the package status and preview badge.
path = 'src/app/admin/promocje/page.tsx'
replace_once(
    path,
    "                                                            {pkg.automaticReference.available && pkg.automaticReference.lowestPrice30d\n                                                                ? `System ma pełne 30 dni historii. Automatyczna cena referencyjna: ${formatPln(pkg.automaticReference.lowestPrice30d)}`\n                                                                : 'Brak pełnego 30-dniowego okna — pierwsza promocja wymaga ręcznego potwierdzenia ceny referencyjnej.'}\n",
    "                                                            {pkg.automaticReference.available && pkg.automaticReference.lowestPrice30d\n"
    "                                                                ? `${pkg.automaticReference.referencePeriod === 'SINCE_OFFERING'\n"
    "                                                                    ? 'System ma pełną historię od rozpoczęcia oferowania'\n"
    "                                                                    : 'System ma pełne 30 dni historii'}. Automatyczna cena referencyjna: ${formatPln(pkg.automaticReference.lowestPrice30d)}`\n"
    "                                                                : pkg.automaticReference.referencePeriod === 'SINCE_OFFERING'\n"
    "                                                                    ? 'Brak pełnej historii od rozpoczęcia oferowania — promocja wymaga ręcznego potwierdzenia ceny referencyjnej.'\n"
    "                                                                    : 'Brak pełnego 30-dniowego okna — pierwsza promocja wymaga ręcznego potwierdzenia ceny referencyjnej.'}\n",
)
replace_once(
    path,
    "                                {preview && preview.displayPercent > 0 && <span className=\"text-xs font-extrabold text-[#8a3423]\">−{preview.displayPercent}% względem ceny z 30 dni</span>}\n",
    "                                {preview && preview.displayPercent > 0 && (\n"
    "                                    <span className=\"text-xs font-extrabold text-[#8a3423]\">\n"
    "                                        −{preview.displayPercent}% względem ceny {preview.referencePeriod === 'SINCE_OFFERING' ? 'od rozpoczęcia oferowania' : 'z 30 dni'}\n"
    "                                    </span>\n"
    "                                )}\n",
)

# Existing banners page should not promise a 30-day label for a newly offered package.
replace_once(
    'src/app/admin/banners/page.tsx',
    'Cena, termin i informacja o najniższej cenie z 30 dni trafiają automatycznie na stronę główną, do rezerwacji i checkoutu.',
    'Cena, termin i właściwa informacja o najniższej cenie przed obniżką trafiają automatycznie na stronę główną, do rezerwacji i checkoutu.',
)

# Unit coverage for the grouped homepage slot.
path = 'tests/unit/package-promotions.test.ts'
replace_once(
    path,
    "import { regularPriceHistoryCoversLookback } from '../../src/lib/packagePromotions';\n",
    "import {\n"
    "    homepagePromotionServiceNames,\n"
    "    homepagePromotionSlot,\n"
    "    regularPriceHistoryCoversLookback,\n"
    "} from '../../src/lib/packagePromotions';\n",
)
write(
    path,
    read(path) + "\n"
    "test('birthdays and receptions share one homepage promotion slot', () => {\n"
    "    assert.equal(homepagePromotionSlot('Urodziny'), 'events');\n"
    "    assert.equal(homepagePromotionSlot('Przyjęcie'), 'events');\n"
    "    assert.deepEqual(homepagePromotionServiceNames('Urodziny'), ['Urodziny', 'Przyjęcie', 'Przyjecie']);\n"
    "    assert.deepEqual(homepagePromotionServiceNames('Sesja'), ['Sesja']);\n"
    "});\n",
)

print('Homepage promotion-slot and copy corrections applied.')
