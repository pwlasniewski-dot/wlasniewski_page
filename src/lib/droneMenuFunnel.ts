type PublicMenuItem = {
    id: number;
    title: string;
    url: string;
    order?: number;
    children?: PublicMenuItem[];
    [key: string]: unknown;
};

const OFFER_URL = '/fotografia-z-drona';
const BOOKING_URL = '/rezerwacja?service=Dron&source=navbar';

export function withDroneMenuFunnel<T extends PublicMenuItem>(items: T[]): PublicMenuItem[] {
    const offerIndex = items.findIndex(item => item.url === OFFER_URL);
    const offerItem: PublicMenuItem = offerIndex >= 0
        ? { ...items[offerIndex] }
        : { id: -201, title: 'Dron', url: OFFER_URL, order: 55, children: [] };

    const children = Array.isArray(offerItem.children)
        ? offerItem.children.map(item => item.url.startsWith('/rezerwacja/dron')
            ? { ...item, url: item.url.replace('/rezerwacja/dron?', '/rezerwacja?service=Dron&').replace('/rezerwacja/dron', '/rezerwacja?service=Dron') }
            : item)
        : [];
    if (!children.some(item => item.url === OFFER_URL)) {
        children.push({ id: -202, title: 'Oferta i ceny', url: OFFER_URL, order: 0, children: [] });
    }
    if (!children.some(item => item.url.includes('/rezerwacja') && item.url.includes('service=Dron'))) {
        children.push({ id: -203, title: 'Rezerwacja drona', url: BOOKING_URL, order: 1, children: [] });
    }
    offerItem.children = children;

    const result = [...items];
    if (offerIndex >= 0) result[offerIndex] = offerItem as T;
    else result.push(offerItem as T);

    return result.sort((a, b) => (a.order || 0) - (b.order || 0));
}
