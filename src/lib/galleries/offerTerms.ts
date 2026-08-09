type AcceptedOffer = {
    id: number;
    status: string;
    client_selection: unknown;
    template_data: unknown;
    total_price: number;
    offerNumber?: string | null;
    title?: string | null;
};

function numericValue(value: unknown): number | null {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const match = String(value).replace(/\s/g, '').match(/\d+(?:[.,]\d+)?/);
    if (!match) return null;
    const number = Number(match[0].replace(',', '.'));
    return Number.isFinite(number) ? number : null;
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
    const includedPhotoCount = numericValue(includedRow?.values?.[selectedIndex]);
    const configuredExtraPrice = numericValue(template.extraPhotoPrice ?? template.pricePerExtraPhoto);

    return {
        includedPhotoCount: includedPhotoCount !== null ? Math.round(includedPhotoCount) : null,
        extraPhotoPriceGrosz: configuredExtraPrice !== null ? Math.round(configuredExtraPrice * 100) : null,
        snapshot: {
            version: 1,
            offerId: offer.id,
            offerNumber: offer.offerNumber || null,
            offerTitle: offer.title || null,
            acceptedTotal: offer.total_price,
            package: selection.selectedPackage,
            includedPhotoCount: includedPhotoCount !== null ? Math.round(includedPhotoCount) : null,
            extraPhotoPriceGrosz: configuredExtraPrice !== null ? Math.round(configuredExtraPrice * 100) : null,
            capturedAt: new Date().toISOString(),
        },
    };
}
