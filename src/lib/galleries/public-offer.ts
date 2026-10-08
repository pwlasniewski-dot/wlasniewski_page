import { readProdigiProduct } from '@/lib/fulfillment/prodigi-catalog';
import { prodigiPreviewModel, type ProdigiPreviewModel } from '@/lib/fulfillment/prodigi-preview-model';
import { hasShopDelivery } from './shop-delivery';
import { defaultPickupDelivery } from './merchandise';
import type { PrintFormat, ShopConfig, ShopProduct } from './merchandise';
import { isProductImageUrl } from './product-media';

/** Presentation only. Product data and amounts always come from the shared shop. */
export type PublicShopOffer = {
    productOpenLabel?: string;
    productPreviewTitle?: string;
    productUploadLabel?: string;
    productGalleryLabel?: string;
    productAddToCartLabel?: string;
    galleryUpsellEnabled?: boolean;
    galleryUpsellTitle?: string;
    galleryUpsellDescription?: string;
    galleryUpsellButtonLabel?: string;
    productReturnLabel?: string;
    galleryPurchaseNotice?: string;
    personalizationSessionEnabled?: boolean;
    personalizationQualityMessage?: string;
    personalizationSessionTitle?: string;
    personalizationSessionDescription?: string;
    personalizationSessionButtonLabel?: string;
    personalizationSessionUrl?: string;
    personalizationEnabled?: boolean;
    personalizationTitle?: string;
    personalizationIntroduction?: string;
    personalizationButtonLabel?: string;
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
    products: (ShopProduct & { personalizationEligible?: boolean; personalizationPreview?: ProdigiPreviewModel })[];
    delivery: ShopConfig['delivery'];
};

export function defaultPublicOffer(): PublicShopOffer {
    return {
        productOpenLabel: 'Zobacz produkt',
        productPreviewTitle: 'Dodaj zdjęcie, żeby zobaczyć swój produkt',
        productUploadLabel: 'Dodaj własne zdjęcie',
        productGalleryLabel: 'Wybierz ze swojej galerii',
        productAddToCartLabel: 'Dodaj do koszyka',
        galleryUpsellEnabled: true,
        galleryUpsellTitle: 'Wybierz więcej zdjęć do swoich produktów',
        galleryUpsellDescription: 'W swojej galerii możesz dokupić dodatkowe ujęcia i wykorzystać je na produktach.',
        galleryUpsellButtonLabel: 'Zobacz zdjęcia w galerii',
        productReturnLabel: 'Wróć do produktu',
        galleryPurchaseNotice: 'Po opłaceniu dodatkowych zdjęć możesz użyć ich na tym produkcie. Zdjęcia cyfrowe i produkty mają osobne płatności.',
        personalizationSessionEnabled: true,
        personalizationQualityMessage: 'To zdjęcie może stracić ostrość w tym rozmiarze. Wybierz większy oryginał albo mniejszy format.',
        personalizationSessionTitle: 'A może nowe zdjęcie, specjalnie na Twoją ścianę?',
        personalizationSessionDescription: 'Umów sesję — przygotujemy fotografie, które wykorzystasz na obrazie, w albumie lub jako prezent.',
        personalizationSessionButtonLabel: 'Sprawdź ofertę sesji',
        personalizationSessionUrl: '/sesja-rodzinna',
        personalizationEnabled: false, personalizationTitle: 'Produkty z Twoim zdjęciem', personalizationIntroduction: 'Dodaj własne zdjęcie i wybierz produkt. Przed płatnością zobaczysz podsumowanie z dostawą.', personalizationButtonLabel: 'Dodaj własne zdjęcie',
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
    check(p.personalizationEnabled === undefined || typeof p.personalizationEnabled === 'boolean', 'Sprawdź ustawienie własnych zdjęć.');
    check(p.galleryUpsellEnabled === undefined || typeof p.galleryUpsellEnabled === 'boolean', 'Sprawdź widoczność propozycji zdjęć z galerii.');
    const productCopyKeys = ['productOpenLabel', 'productPreviewTitle', 'productUploadLabel', 'productGalleryLabel', 'productAddToCartLabel', 'galleryUpsellTitle', 'galleryUpsellDescription', 'galleryUpsellButtonLabel', 'productReturnLabel', 'galleryPurchaseNotice'] as const;
    for (const key of productCopyKeys) check(p[key] === undefined || (typeof p[key] === 'string' && p[key]!.trim().length > 0 && p[key]!.length <= (key === 'galleryUpsellDescription' ? 2000 : 200)), 'Sprawdź treści widoku produktu i galerii.');
    for (const key of ['personalizationTitle', 'personalizationIntroduction', 'personalizationButtonLabel'] as const) check(p[key] === undefined || (typeof p[key] === 'string' && p[key]!.trim().length > 0 && p[key]!.length <= (key === 'personalizationIntroduction' ? 2000 : 200)), 'Sprawdź treści personalizacji.');
    check(p.personalizationSessionEnabled === undefined || typeof p.personalizationSessionEnabled === 'boolean', 'Sprawdź widoczność propozycji sesji.');
    for (const key of ['personalizationQualityMessage', 'personalizationSessionTitle', 'personalizationSessionDescription', 'personalizationSessionButtonLabel'] as const) check(p[key] === undefined || (typeof p[key] === 'string' && p[key]!.trim().length > 0 && p[key]!.length <= (key === 'personalizationSessionDescription' || key === 'personalizationQualityMessage' ? 2000 : 200)), 'Sprawdź treści propozycji sesji.');
    check(p.personalizationSessionUrl === undefined || (typeof p.personalizationSessionUrl === 'string' && p.personalizationSessionUrl.length <= 2000 && /^\/(?!\/)[^\s\\]*$/.test(p.personalizationSessionUrl)), 'Link do sesji musi prowadzić do strony w tym serwisie.');
    // Explicit projection: unknown fields must never reach a public endpoint.
    const defaults = defaultPublicOffer();
    const productCopy = Object.fromEntries(productCopyKeys.map(key => [key, p[key] ?? defaults[key]])) as Pick<PublicShopOffer, typeof productCopyKeys[number]>;
    return { ...productCopy, galleryUpsellEnabled: p.galleryUpsellEnabled ?? defaults.galleryUpsellEnabled, personalizationSessionEnabled: p.personalizationSessionEnabled ?? defaults.personalizationSessionEnabled, personalizationQualityMessage: p.personalizationQualityMessage ?? defaults.personalizationQualityMessage, personalizationSessionTitle: p.personalizationSessionTitle ?? defaults.personalizationSessionTitle, personalizationSessionDescription: p.personalizationSessionDescription ?? defaults.personalizationSessionDescription, personalizationSessionButtonLabel: p.personalizationSessionButtonLabel ?? defaults.personalizationSessionButtonLabel, personalizationSessionUrl: p.personalizationSessionUrl ?? defaults.personalizationSessionUrl, personalizationEnabled: p.personalizationEnabled ?? false, personalizationTitle: p.personalizationTitle ?? defaultPublicOffer().personalizationTitle, personalizationIntroduction: p.personalizationIntroduction ?? defaultPublicOffer().personalizationIntroduction, personalizationButtonLabel: p.personalizationButtonLabel ?? defaultPublicOffer().personalizationButtonLabel, enabled: p.enabled, title: p.title, introduction: p.introduction, buttonLabel: p.buttonLabel, emptyMessage: p.emptyMessage,
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
        const product = activeSharedProducts.find(p => p.id === id && p.price > 0 && hasShopDelivery(config.delivery, p));
        const spec = readProdigiProduct(product?.prodigi);
        const personalizationEligible = !!spec && spec.requiredAssets.length === 1 && spec.requiredAssets[0] === 'default' && product?.minPhotos === 1 && product?.maxPhotos === 1;
        // Do not expose supplier IDs, URLs, timestamps or internal catalogue fields.
        return product ? [{ personalizationEligible, ...(personalizationEligible && spec ? {personalizationPreview: prodigiPreviewModel(spec)} : {}), id: product.id, title: product.title, description: product.description,
            price: product.price, image_url: product.image_url, preview_images: product.preview_images || [], video_url: product.video_url || null, sample_pages: product.sample_pages || [],
            product_type: product.product_type, minPhotos: product.minPhotos, maxPhotos: product.maxPhotos,
            ...(product.deliveryMethods ? { deliveryMethods: [...product.deliveryMethods] } : {}) }] : [];
    });
    if (!formats.length && !products.length) return null;
    return { offer: { ...offer, productIds: products.map(p => p.id), formatIds: formats.map(f => f.id) }, formats, products,
        delivery: { locker: { ...config.delivery.locker }, courier: { ...config.delivery.courier }, pickup: { ...(config.delivery.pickup ?? defaultPickupDelivery()) } } };
}
