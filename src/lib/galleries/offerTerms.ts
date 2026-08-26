import { parsePlnAmount } from '../money/pln.ts';

type AcceptedOffer = {
    id: number;
    status: string;
    client_selection: unknown;
    template_data: unknown;
    total_price: number;
    offerNumber?: string | null;
    title?: string | null;
};

function strictPhotoCount(value: unknown): number | null {
    if (typeof value === 'number') return Number.isInteger(value) && value >= 0 ? value : null;
    if (typeof value !== 'string') return null;
    const match = value.trim().match(/^(\d+)(?:\s*(?:zdję(?:ć|cia)?|zdjec(?:ia)?|fotografii|szt\.?))?$/iu);
    if (!match) return null;
    const number = Number(match[1]);
    return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

export function galleryTermsFromAcceptedOffer(offer: AcceptedOffer) {
    if (offer.status !== 'accepted') throw new Error('Galeria może dziedziczyć warunki tylko z zaakceptowanej oferty.');
    const selection = offer.client_selection && typeof offer.client_selection === 'object'
        ? offer.client_selection as Record<string, any>
        : {};
    const template = offer.template_data && typeof offer.template_data === 'object'
        ? offer.template_data as Record<string, any>
        : {};
    const selectedIndex = Number(selection.selectedPackage?.index);
    if (!Number.isInteger(selectedIndex) || selectedIndex < 1) {
        throw new Error('Zaakceptowana oferta nie ma jednego pakietu możliwego do przypisania do galerii indywidualnej.');
    }

    const rows = Array.isArray(template.pricingRows) ? template.pricingRows : [];
    const includedRow = rows.find((row: any) => {
        const label = String(row?.values?.[0] || '').toLowerCase();
        return /(liczba|ilość|ilosc).*(finaln|gotow|obrobion).*(zdję|zdjec)|finaln.*zdję|finaln.*zdjec/.test(label);
    });
    const includedPhotoRaw = includedRow?.values?.[selectedIndex];
    const includedPhotoCount = includedPhotoRaw === undefined || includedPhotoRaw === null || includedPhotoRaw === ''
        ? null
        : strictPhotoCount(includedPhotoRaw);
    if (includedPhotoRaw !== undefined && includedPhotoRaw !== null && includedPhotoRaw !== '' && includedPhotoCount === null) {
        throw new Error('Liczba zdjęć w zaakceptowanym pakiecie ma nieprawidłowy format.');
    }
    const configuredExtraPriceRaw = template.extraPhotoPrice ?? template.pricePerExtraPhoto;
    const configuredExtraPrice = configuredExtraPriceRaw === undefined || configuredExtraPriceRaw === null || configuredExtraPriceRaw === ''
        ? null
        : parsePlnAmount(configuredExtraPriceRaw);
    if (configuredExtraPriceRaw !== undefined && configuredExtraPriceRaw !== null && configuredExtraPriceRaw !== '' && configuredExtraPrice === null) {
        throw new Error('Cena dodatkowego zdjęcia ma nieprawidłowy lub niejednoznaczny format PLN.');
    }

    return {
        includedPhotoCount,
        extraPhotoPriceGrosz: configuredExtraPrice !== null ? configuredExtraPrice * 100 : null,
        snapshot: {
            version: 1,
            offerId: offer.id,
            offerNumber: offer.offerNumber || null,
            offerTitle: offer.title || null,
            acceptedTotal: offer.total_price,
            package: selection.selectedPackage,
            includedPhotoCount,
            extraPhotoPriceGrosz: configuredExtraPrice !== null ? configuredExtraPrice * 100 : null,
            capturedAt: new Date().toISOString(),
        },
    };
}
