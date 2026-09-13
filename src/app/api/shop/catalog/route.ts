import { NextResponse } from 'next/server';
import { loadGalleryShop } from '@/lib/galleries/merchandise-server';
import { publicShopCatalog } from '@/lib/galleries/public-offer';

export const dynamic = 'force-dynamic';
export async function GET() {
    try {
        // Shared catalogue only: no private gallery IDs, photos, client records or orders.
        const { config, catalog } = await loadGalleryShop(null);
        return NextResponse.json({ success: true, catalog: publicShopCatalog(config, catalog.products) }, { headers: { 'Cache-Control': 'no-store' } });
    } catch {
        return NextResponse.json({ success: false, error: 'Nie udało się wczytać oferty. Spróbuj ponownie.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
}
