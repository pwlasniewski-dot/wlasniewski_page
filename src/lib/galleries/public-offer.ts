import type { PrintFormat, ShopConfig, ShopProduct } from './merchandise';
import { isProductImageUrl } from './product-media';

/** Presentation only. Product data and amounts always come from the shared shop. */
export type PublicShopOffer = {
    enabled: boolean;
    title: string;
    introduction: string;
    buttonLabel: string;
    emptyMessage: string;
    formatIds: string[];
    productIds: number[];
    printImageUrl: string;
    printImageAlt: string;
    layout: 'cards' | 'editorial';
};
export type PublicShopCatalog = {
    offer: PublicShopOffer;
    formats: PrintFormat[];
    products: ShopProduct[];
    delivery: ShopConfig['delivery'];
};

export function defaultPublicOffer(): PublicShopOffer {
    return {
        enabled: false,
        title: 'Twoje fotografie. Pięknie oprawione.',
        introduction: 'Wybierz odbitki lub produkt, a następnie wskaż zdjęcia ze swojej galerii. Wariant przygotujemy zgodnie z opisem oferty; przed płatnością zobaczysz pełną cenę z dostawą.',
        buttonLabel: 'Wybierz zdjęcia',
        emptyMessage: 'Twoje galerie pojawią się tutaj, gdy fotograf je udostępni. Do zamówienia potrzebujesz zdjęć z własnej sesji.',
        formatIds: [], productIds: [], printImageUrl: '', printImageAlt: 'Odbitki fotograficzne', layout: 'cards',
    };
}

export function validatePublicOffer(value: unknown): PublicShopOffer {
    const p = value as PublicShopOffer;
    const check = (ok: unknown, message: string) => { if (!ok) throw new Error(message); };
    check(p && typeof p === 'object' && !Array.isArray(p) && typeof p.enabled === 'boolean', 'Nieprawidłowe ustawienia prezentacji oferty.');
    for (const key of ['title', 'introduction', 'buttonLabel', 'emptyMessage', 'printImageUrl', 'printImageAlt'] as const) {
        check(typeof p[key] === 'string' && p[key].length <= (key === 'buttonLabel' ? 80 : key === 'title' || key === 'printImageAlt' ? 200 : 2000), 'Sprawdź długość i treść prezentacji oferty.');
    }
    check(p.title.trim() && p.buttonLabel.trim() && p.emptyMessage.trim(), 'Uzupełnij tytuł, przycisk i komunikat braku galerii.');
    check(!p.printImageUrl || (isProductImageUrl(p.printImageUrl) && p.printImageAlt.trim()), 'Uzupełnij poprawny adres oraz opis zdjęcia odbitek.');
    check(p.layout === 'cards' || p.layout === 'editorial', 'Wybierz dostępny układ oferty.');
    check(Array.isArray(p.productIds) && p.productIds.length <= 100 && p.productIds.every(id => Number.isSafeInteger(id) && id > 0) && new Set(p.productIds).size === p.productIds.length, 'Wybierz unikalne produkty do prezentacji.');
    check(Array.isArray(p.formatIds) && p.formatIds.length <= 100 && p.formatIds.every(id => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,60}$/.test(id)) && new Set(p.formatIds).size === p.formatIds.length, 'Wybierz unikalne formaty do prezentacji.');
    // Explicit projection: unknown fields must never reach a public endpoint.
    return { enabled: p.enabled, title: p.title, introduction: p.introduction, buttonLabel: p.buttonLabel, emptyMessage: p.emptyMessage,
        formatIds: [...p.formatIds], productIds: [...p.productIds], printImageUrl: p.printImageUrl, printImageAlt: p.printImageAlt, layout: p.layout };
}

/** Caller supplies only shared, active products. Missing/draft selections are omitted. */
export function publicShopCatalog(config: ShopConfig, activeSharedProducts: ShopProduct[]): PublicShopCatalog | null {
    if (!config.enabled || !config.publicOffer?.enabled) return null;
    const offer = validatePublicOffer(config.publicOffer);
    const formats = offer.formatIds.flatMap(id => {
        const format = config.formats.find(f => f.id === id && f.active && f.unitAmount > 0);
        return format ? [{ ...format }] : [];
    });
    const products = offer.productIds.flatMap(id => {
        const product = activeSharedProducts.find(p => p.id === id && p.price > 0 && (!p.deliveryMethods || p.deliveryMethods.some(method => config.delivery[method].enabled)));
        // Do not expose supplier IDs, URLs, timestamps or internal catalogue fields.
        return product ? [{ id: product.id, title: product.title, description: product.description,
            price: product.price, image_url: product.image_url, preview_images: product.preview_images || [],
            product_type: product.product_type, minPhotos: product.minPhotos, maxPhotos: product.maxPhotos,
            ...(product.deliveryMethods ? { deliveryMethods: [...product.deliveryMethods] } : {}) }] : [];
    });
    if (!formats.length && !products.length) return null;
    return { offer: { ...offer, productIds: products.map(p => p.id), formatIds: formats.map(f => f.id) }, formats, products,
        delivery: { locker: { ...config.delivery.locker }, courier: { ...config.delivery.courier } } };
}
