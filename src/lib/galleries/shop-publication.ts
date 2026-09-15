import type {ShopConfig} from './merchandise';
import {isProductImageUrl} from './product-media';
type PublicationProduct={archived_at?:Date|string|null;id:number;price:number;is_active:boolean;description?:string|null;image_url?:string|null};
export function productsReadyToPublish(config:ShopConfig,products:PublicationProduct[]) {
 return products.filter(product=>!product.archived_at && config.publicOffer?.productIds.includes(product.id) &&
  Number.isSafeInteger(product.price) && product.price>0 && product.description?.trim() && isProductImageUrl(product.image_url) &&
  (config.productRules[String(product.id)]?.deliveryMethods || ['locker','courier'] as const).some(method=>config.delivery[method].enabled));
}
export function visibleOfferCount(config:ShopConfig,products:PublicationProduct[]) {
 if (!config.enabled || !config.publicOffer?.enabled) return 0;
 return products.filter(product=>!product.archived_at && config.publicOffer!.productIds.includes(product.id) && product.is_active && product.price>0 &&
  (config.productRules[String(product.id)]?.deliveryMethods || ['locker','courier'] as const).some(method=>config.delivery[method].enabled)).length +
  config.formats.filter(format=>config.publicOffer!.formatIds.includes(format.id) && format.active && format.unitAmount>0).length;
}
