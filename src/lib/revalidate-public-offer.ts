import { revalidatePath, revalidateTag } from 'next/cache';

/** CMS writes affect home, city/service routes and any PageRenderer section. */
export function revalidatePublicOffer() {
    revalidateTag('public-offer');
    revalidatePath('/', 'layout');
}
