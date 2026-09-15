import { defaultPickupDelivery, type ShopCatalog, type ShopLine, type ProductShopRule } from './merchandise';

/** Product restrictions describe shipping package sizes, not personal collection. */
export function hasShopDelivery(delivery: ShopCatalog['delivery'], product?: Pick<ProductShopRule, 'deliveryMethods'>): boolean {
    return (delivery.pickup ?? defaultPickupDelivery()).enabled || (product?.deliveryMethods ?? ['locker', 'courier']).some(method => delivery[method].enabled);
}

/** A single shipment must support every product in the basket. Missing products fail closed. */
export function availableShopDelivery(catalog: ShopCatalog, lines: ShopLine[]): ShopCatalog['delivery'] {
    const allowed = (method: 'locker' | 'courier' | 'pickup') => (catalog.delivery[method] ?? defaultPickupDelivery()).enabled && lines.every(line => {
        if (line.kind === 'print') return true;
        const product = catalog.products.find(p => p.id === line.productId);
        return !!product && (method === 'pickup' || !product.deliveryMethods || product.deliveryMethods.includes(method));
    });
    return { locker: { ...catalog.delivery.locker, enabled: allowed('locker') }, courier: { ...catalog.delivery.courier, enabled: allowed('courier') }, pickup: { ...(catalog.delivery.pickup ?? defaultPickupDelivery()), amount: 0, enabled: allowed('pickup') } };
}
