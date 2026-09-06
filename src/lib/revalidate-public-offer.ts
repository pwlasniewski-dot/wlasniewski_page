import { revalidatePath } from 'next/cache';

/** CMS writes affect home, city/service routes and any PageRenderer section. */
export function revalidatePublicOffer() {
    revalidatePath('/', 'layout');
}
