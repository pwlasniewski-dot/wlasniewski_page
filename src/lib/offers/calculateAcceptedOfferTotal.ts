import { parsePlnAmount } from '../money/pln.ts';

type OfferItem = { title?: string; price: number; quantity: number; is_optional: boolean };
type OfferSection = { items: OfferItem[] };

type AcceptedOfferInput = {
    category?: string | null;
    template_data: unknown;
    sections: OfferSection[];
    selected_addons: unknown;
    total_price?: number | null;
};

export class OfferSelectionError extends Error {}

function boundedInteger(value: unknown, min: number, max: number): number | null {
    const number = Number(value);
    return Number.isInteger(number) && number >= min && number <= max ? number : null;
}

function safeText(value: unknown, max = 160): string {
    return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function canonicalizeAcceptedOfferSelection(offer: AcceptedOfferInput, rawSelection: unknown) {
    const selection = rawSelection && typeof rawSelection === 'object'
        ? rawSelection as Record<string, any>
        : {};
    const template = offer.template_data && typeof offer.template_data === 'object'
        ? offer.template_data as Record<string, any>
        : {};
    const footerPrices = Array.isArray(template.footerPrices) ? template.footerPrices : [];
    const pricingHeaders = Array.isArray(template.pricingHeaders) ? template.pricingHeaders : [];
    const packageIndexes = footerPrices
        .map((value: unknown, index: number) => ({ index, price: parsePlnAmount(value) ?? 0 }))
        .filter(({ index, price }) => index > 0 && price > 0);
    if (footerPrices.length > 1 && packageIndexes.length === 0) {
        throw new OfferSelectionError('Cennik oferty nie zawiera jednoznacznej dodatniej ceny.');
    }
    const trusted: Record<string, unknown> = {};
    let total = 0;
    const normalizedCategory = (offer.category || '').trim().toLowerCase();
    const isCommunion = normalizedCategory.includes('komuni') || normalizedCategory.includes('communion');

    const splitCounts = selection.splitPackageCounts;
    if (packageIndexes.length && isCommunion) {
        if (!splitCounts || typeof splitCounts !== 'object' || Array.isArray(splitCounts)) {
            throw new OfferSelectionError('Wybierz liczbę dzieci w prawidłowych pakietach.');
        }
        const canonicalCounts: Record<string, number> = {};
        const packagesBreakdown: Array<{ index: number; name: string; price: string; count: number; subtotal: number }> = [];
        for (const [rawIndex, rawCount] of Object.entries(splitCounts)) {
            const index = boundedInteger(rawIndex, 1, footerPrices.length - 1);
            const count = boundedInteger(rawCount, 0, 500);
            if (index === null || count === null) {
                throw new OfferSelectionError('Wykryto nieprawidłowy pakiet lub liczbę uczestników.');
            }
            if (count === 0) continue;
            const unitPrice = parsePlnAmount(footerPrices[index]) ?? 0;
            if (unitPrice <= 0) throw new OfferSelectionError('Wybrany pakiet nie ma prawidłowej ceny.');
            canonicalCounts[String(index)] = count;
            packagesBreakdown.push({
                index,
                name: safeText(pricingHeaders[index]) || `Pakiet ${index}`,
                price: safeText(footerPrices[index]),
                count,
                subtotal: unitPrice * count,
            });
            total += unitPrice * count;
        }
        if (!packagesBreakdown.length) {
            throw new OfferSelectionError('Wybierz co najmniej jeden prawidłowy pakiet.');
        }
        trusted.splitPackageCounts = canonicalCounts;
        trusted.packagesBreakdown = packagesBreakdown;
        trusted.childCount = packagesBreakdown.reduce((sum, item) => sum + item.count, 0);
    } else if (packageIndexes.length) {
        if (splitCounts !== undefined) {
            throw new OfferSelectionError('Ta oferta wymaga wyboru jednego pakietu.');
        }
        const index = boundedInteger(selection.selectedPackage?.index, 1, footerPrices.length - 1);
        if (index === null || !packageIndexes.some(item => item.index === index)) {
            throw new OfferSelectionError('Wybierz prawidłowy pakiet przed akceptacją oferty.');
        }
        const price = parsePlnAmount(footerPrices[index]) ?? 0;
        trusted.selectedPackage = {
            index,
            name: safeText(pricingHeaders[index]) || `Pakiet ${index}`,
            price: safeText(footerPrices[index]),
        };
        total += price;
    }

    const allowedOptional = new Map<number, OfferItem>();
    offer.sections.forEach((section, sectionIndex) => {
        section.items.forEach((item, itemIndex) => {
            if (item.is_optional) allowedOptional.set(sectionIndex * 100 + itemIndex, item);
        });
    });
    const selectedOptional = Array.from(new Set(
        (Array.isArray(selection.selectedOptionalItems) ? selection.selectedOptionalItems : [])
            .map((value: unknown) => Number(value))
            .filter((value: number) => Number.isInteger(value) && allowedOptional.has(value)),
    )).sort((a, b) => a - b);
    trusted.selectedOptionalItems = selectedOptional;

    offer.sections.forEach((section, sectionIndex) => {
        section.items.forEach((item, itemIndex) => {
            const lineTotal = Math.max(0, Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1);
            const globalIndex = sectionIndex * 100 + itemIndex;
            if (!item.is_optional || selectedOptional.includes(globalIndex)) total += lineTotal;
        });
    });

    if (Array.isArray(offer.selected_addons)) {
        for (const addon of offer.selected_addons as Array<Record<string, unknown>>) {
            total += Math.max(0, Number(addon?.final_price) || 0);
        }
    }

    if (selection.groupBreakdown && typeof selection.groupBreakdown === 'object') {
        const adults = boundedInteger(selection.groupBreakdown.adults, 0, 100) ?? 0;
        const children = boundedInteger(selection.groupBreakdown.children, 0, 100) ?? 0;
        trusted.groupBreakdown = { adults, children, total: adults + children };
    }

    if (selection.familyVoucher?.enabled === true) {
        trusted.familyVoucher = {
            enabled: true,
            senderName: safeText(selection.familyVoucher.senderName),
            recipientName: safeText(selection.familyVoucher.recipientName),
            packageName: safeText(selection.familyVoucher.packageName),
            packagePriceLabel: safeText(selection.familyVoucher.packagePriceLabel),
            sessionDate: safeText(selection.familyVoucher.sessionDate, 40),
            sessionTime: safeText(selection.familyVoucher.sessionTime, 40),
            location: safeText(selection.familyVoucher.location),
            hidePrice: selection.familyVoucher.hidePrice === true,
            verificationCode: safeText(selection.familyVoucher.verificationCode, 40),
        };
    }

    const hasStructuredPrice = footerPrices.length > 1
        || offer.sections.some(section => section.items.length > 0)
        || (Array.isArray(offer.selected_addons) && offer.selected_addons.length > 0);
    const roundedTotal = Math.round(
        hasStructuredPrice ? total : Math.max(0, Number(offer.total_price) || 0),
    );
    if (!Number.isFinite(roundedTotal) || roundedTotal <= 0) {
        throw new OfferSelectionError('Nie można potwierdzić ceny oferty.');
    }
    trusted.totalPrice = roundedTotal;
    return { total: roundedTotal, selection: trusted };
}

export function calculateAcceptedOfferTotal(offer: AcceptedOfferInput, selection: unknown): number {
    try {
        return canonicalizeAcceptedOfferSelection(offer, selection).total;
    } catch {
        return 0;
    }
}
