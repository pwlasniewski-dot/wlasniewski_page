import { ShopValidationError } from './merchandise';
import { isProductImageUrl, isProductVideoUrl, readProductImages } from './product-media';

/** Shared validation for the product editor and both authenticated save routes. */
export function validateProductEdit(value: unknown) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ShopValidationError('Nieprawidłowe dane produktu.');
    const { title, description, image_url, preview_images, video_url, sample_pages, price, is_active } = value as Record<string, unknown>;
    if (typeof title !== 'string' || !title.trim() || title.length > 200 || typeof price !== 'number' || !Number.isSafeInteger(price) || price < (is_active ? 1 : 0) || price > 100000000 || typeof is_active !== 'boolean' || (description != null && (typeof description !== 'string' || description.length > 5000)) || (image_url != null && typeof image_url !== 'string')) throw new ShopValidationError('Sprawdź nazwę, cenę, opis i widoczność produktu.');
    if (image_url && !isProductImageUrl(image_url)) throw new ShopValidationError('Nieprawidłowy adres zdjęcia.');
    if (preview_images !== undefined && (!Array.isArray(preview_images) || preview_images.length > 12 || !preview_images.every(isProductImageUrl))) throw new ShopValidationError('Dodaj maksymalnie 12 poprawnych adresów zdjęć podglądu.');
    if (video_url != null && video_url !== '' && !isProductVideoUrl(video_url)) throw new ShopValidationError('Film musi mieć poprawny adres HTTPS pliku MP4.');
    if (sample_pages !== undefined && (!Array.isArray(sample_pages) || sample_pages.length > 12 || !sample_pages.every(isProductImageUrl))) throw new ShopValidationError('Dodaj maksymalnie 12 zdjęć przykładowych rozkładówek.');
    return {
        title: title.trim(), description: (description || null) as string | null,
        image_url: (image_url || null) as string | null,
        ...(preview_images === undefined ? {} : { preview_images: readProductImages(preview_images) }),
        ...(video_url === undefined ? {} : { video_url: (video_url || null) as string | null }),
        ...(sample_pages === undefined ? {} : { sample_pages: readProductImages(sample_pages) }),
        price, is_active,
    };
}

/** Null and absent legacy media represent the same empty presentation. */
export function productEditSnapshot(value: unknown) {
    const raw = value as Record<string, unknown>;
    return {
        title: raw?.title, description: raw?.description || null, image_url: raw?.image_url || null,
        preview_images: readProductImages(raw?.preview_images), video_url: raw?.video_url || null,
        sample_pages: readProductImages(raw?.sample_pages), price: raw?.price, is_active: raw?.is_active,
    };
}
