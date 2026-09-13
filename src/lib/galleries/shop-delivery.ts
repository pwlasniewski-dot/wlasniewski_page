import type { ShopCatalog, ShopLine } from './merchandise';

/** A single shipment must support every product in the basket. Missing products fail closed. */
export function availableShopDelivery(catalog: ShopCatalog, lines: ShopLine[]): ShopCatalog['delivery'] {
    const allowed = (method: 'locker' | 'courier') => catalog.delivery[method].enabled && lines.every(line => {
        if (line.kind === 'print') return true;
        const product = catalog.products.find(p => p.id === line.productId);
        return !!product && (!product.deliveryMethods || product.deliveryMethods.includes(method));
    });
    return { locker: { ...catalog.delivery.locker, enabled: allowed('locker') }, courier: { ...catalog.delivery.courier, enabled: allowed('courier') } };
}
