/** Shared private-gallery merchandise contract. Amounts are integer grosze. */
import { validatePublicOffer, type PublicShopOffer } from './public-offer';
import { availableShopDelivery } from './shop-delivery';
export type PrintPriceTier = { minQuantity: number; unitAmount: number };
export type PrintFormat = { id: string; label: string; widthMm: number; heightMm: number; unitAmount: number; active: boolean; paper: string; priceTiers?: PrintPriceTier[] };
export type ProductShopRule = {minPhotos: number; maxPhotos: number; deliveryMethods?: ('locker' | 'courier')[]};
export type ShopProduct = { id: number; title: string; description: string | null; price: number; image_url: string | null; preview_images?: string[]; video_url?: string | null; sample_pages?: string[]; product_type: string | null; minPhotos: number; maxPhotos: number; deliveryMethods?: ('locker' | 'courier')[]; nphoto_product_id?: string | null; nphoto_url?: string | null };
export type ShopConfig = { version: 1; enabled: boolean; title: string; introduction: string; buttonLabel: string; formats: PrintFormat[]; productRules: Record<string, ProductShopRule>; delivery: {locker: {enabled: boolean; amount: number}; courier: {enabled: boolean; amount: number}; pickup?: {enabled: boolean; amount: number; instructions: string}}; publicOffer?: PublicShopOffer };
export type ShopCatalog = Omit<ShopConfig, 'version' | 'productRules' | 'publicOffer'> & {galleryId: number; products: ShopProduct[]};
export type ShopCrop = {mode: 'fit' | 'fill'; x: number; y: number; zoom: number};
export type ShopLine = {id: string; kind: 'print'; photoId: number; formatId: string; quantity: number; crop: ShopCrop; confirmed: boolean} | {id: string; kind: 'product'; productId: number; photoIds: number[]; coverPhotoId: number; quantity: number};
export type ShopDelivery = {method: 'locker' | 'courier' | 'pickup'; recipientName: string; email: string; phone: string; pointCode?: string; instructions?: string; address?: {street: string; postalCode: string; city: string}};
export type PricedShopLine = ShopLine & {title: string; unitAmount: number; lineTotal: number; format?: PrintFormat; product?: {image_url?: string | null; title: string; description: string | null; nphoto_product_id?: string | null; nphoto_url?: string | null}};
export type ShopMetadata = {customerId?: number; kind: 'gallery_merchandise'; version: 1; lines: PricedShopLine[]; delivery: ShopDelivery & {amount: number}; fulfillment: {status: 'new' | 'ordered' | 'received' | 'packed' | 'shipped' | 'collected'; trackingNumber: string | null}};
export class ShopValidationError extends Error { constructor(message: string, public status = 400) {super(message); this.name = 'ShopValidationError';} }
function check(ok: unknown, message: string): asserts ok {if (!ok) throw new ShopValidationError(message);}
function integer(value: unknown, min: number, max: number) {return typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;}
export function defaultPickupDelivery() { return {enabled: true, amount: 0, instructions: 'Odbiór osobisty po wcześniejszym ustaleniu terminu.'}; }
export function defaultShopConfig(): ShopConfig {return {version: 1, enabled: false, title: 'Zamów zdjęcia i produkty', introduction: '', buttonLabel: 'Przejdź do zakupu zdjęć', formats: [], productRules: {}, delivery: {locker: {enabled: false, amount: 0}, courier: {enabled: false, amount: 0}, pickup: defaultPickupDelivery()}};}
export function validateShopConfig(input: unknown): ShopConfig {
 const c = input as ShopConfig;
 check(c && c.version === 1 && typeof c.enabled === 'boolean', 'Nieprawidłowa konfiguracja sklepu.');
 for (const key of ['title','introduction','buttonLabel'] as const) check(typeof c[key] === 'string' && c[key].length <= 2000, 'Nieprawidłowa treść sklepu.');
 check(c.title.trim() && c.buttonLabel.trim(), 'Uzupełnij tytuł i przycisk.');
 check(Array.isArray(c.formats) && c.formats.length <= 100, 'Nieprawidłowe formaty.');
 const ids = new Set<string>();
 for (const f of c.formats) {check(f && typeof f.id === 'string' && /^[a-zA-Z0-9_-]{1,60}$/.test(f.id) && !ids.has(f.id), 'Format musi mieć unikalny identyfikator.'); ids.add(f.id); check(typeof f.label === 'string' && f.label.trim() && f.label.length <= 160 && typeof f.paper === 'string' && f.paper.length <= 100 && typeof f.active === 'boolean', 'Uzupełnij nazwę formatu i papier.'); check(integer(f.widthMm,1,2000) && integer(f.heightMm,1,2000) && integer(f.unitAmount,f.active ? 1 : 0,10000000), 'Nieprawidłowy rozmiar lub cena formatu.');}
 for (const f of c.formats) {
  if (f.priceTiers === undefined) continue;
  check(Array.isArray(f.priceTiers) && f.priceTiers.length <= 10, 'Format może mieć najwyżej 10 progów cenowych.');
  let previousQuantity = 1; let previousAmount = f.unitAmount;
  for (const tier of f.priceTiers) {
   check(tier && integer(tier.minQuantity,previousQuantity+1,49500) && integer(tier.unitAmount,1,previousAmount), 'Progi ilości muszą rosnąć, a ceny za sztukę być dodatnie i nie rosnąć.');
   previousQuantity = tier.minQuantity; previousAmount = tier.unitAmount;
  }
 }
 check(c.productRules && typeof c.productRules === 'object' && !Array.isArray(c.productRules), 'Nieprawidłowe reguły produktów.');
 for (const [id, r] of Object.entries(c.productRules)) {
  check(/^\d+$/.test(id) && r && integer(r.minPhotos,1,500) && integer(r.maxPhotos,r.minPhotos,500), 'Nieprawidłowa liczba zdjęć produktu.');
  if (r.deliveryMethods !== undefined) check(Array.isArray(r.deliveryMethods) && r.deliveryMethods.length >= 1 && r.deliveryMethods.length <= 2 && new Set(r.deliveryMethods).size === r.deliveryMethods.length && r.deliveryMethods.every(method => method === 'locker' || method === 'courier'), 'Wybierz przynajmniej jeden poprawny sposób dostawy produktu.');
 }
 for (const method of ['locker','courier'] as const) check(c.delivery?.[method] && typeof c.delivery[method].enabled === 'boolean' && integer(c.delivery[method].amount,0,1000000), 'Nieprawidłowa cena dostawy.');
 const pickup = c.delivery.pickup ?? defaultPickupDelivery();
 check(typeof pickup.enabled === 'boolean' && pickup.amount === 0 && typeof pickup.instructions === 'string' && pickup.instructions.length <= 2000 && (!pickup.enabled || pickup.instructions.trim().length > 0), 'Odbiór osobisty musi być bezpłatny. Uzupełnij informację o odbiorze (do 2000 znaków).');
 if(c.enabled) check(c.delivery.locker.enabled || c.delivery.courier.enabled || pickup.enabled, 'Włącz przynajmniej jedną metodę dostawy.');
 if (c.publicOffer !== undefined) {try { validatePublicOffer(c.publicOffer); } catch (error) { throw new ShopValidationError(error instanceof Error ? error.message : 'Sprawdź prezentację oferty.'); }}
 return JSON.parse(JSON.stringify({...c, delivery: {...c.delivery, pickup}}));
}
export function readShopConfig(raw: string | null | undefined): ShopConfig {try {return validateShopConfig(JSON.parse(raw || ''));} catch {return defaultShopConfig();}}
/** The same format is priced by its total quantity across all selected photographs. */
export function printUnitAmount(format: PrintFormat | undefined, quantity: number): number {
 if (!format) return 0;
 return (format.priceTiers || []).reduce((amount, tier) => quantity >= tier.minQuantity ? tier.unitAmount : amount, format.unitAmount);
}
export function printQuantities(lines: ShopLine[]): Record<string, number> {
 return lines.reduce<Record<string, number>>((totals, line) => {
  if (line?.kind === 'print' && integer(line.quantity,1,99)) totals[line.formatId] = (totals[line.formatId] || 0) + line.quantity;
  return totals;
 }, Object.create(null));
}
export function priceShopCart(catalog: ShopCatalog, input: unknown, deliveryInput: unknown, allowedPhotoIds: number[]) {
 check(catalog.enabled, 'Sklep jest obecnie niedostępny.');
 check(Array.isArray(input) && input.length > 0 && input.length <= 500, 'Koszyk musi zawierać od 1 do 500 pozycji.');
 const allowed = new Set(allowedPhotoIds); const ids = new Set<string>();
 const quantities = printQuantities(input);
 const photo = (id: number) => check(integer(id,1,Number.MAX_SAFE_INTEGER) && allowed.has(id), 'Zdjęcie nie jest dostępne w tej galerii.');
 const lines: PricedShopLine[] = input.map((line: ShopLine) => {
  check(line && typeof line.id === 'string' && line.id.length > 0 && line.id.length <= 128 && !ids.has(line.id), 'Nieprawidłowa pozycja koszyka.'); ids.add(line.id);
  check(integer(line.quantity,1,99), 'Liczba sztuk musi wynosić od 1 do 99.');
  if(line.kind === 'print') {
   photo(line.photoId); const format = catalog.formats.find(f=>f.id===line.formatId && f.active); check(format, 'Wybrany format nie jest dostępny.');
   check(line.confirmed === true, 'Zatwierdź podgląd odbitki.'); const c = line.crop;
   check(c && c.mode === 'fit' && Number.isFinite(c.x) && c.x >= 0 && c.x <= 100 && Number.isFinite(c.y) && c.y >= 0 && c.y <= 100 && Number.isFinite(c.zoom) && c.zoom >= 1 && c.zoom <= 3, 'Nieprawidłowy kadr.');
   const unitAmount = printUnitAmount(format, quantities[format.id]);
   return {id:line.id,kind:'print',photoId:line.photoId,formatId:format.id,quantity:line.quantity,crop:{...c},confirmed:true,title:format.label,unitAmount,lineTotal:unitAmount*line.quantity,format:JSON.parse(JSON.stringify(format))};
  }
  check(line.kind === 'product', 'Nieznany rodzaj pozycji.');
  const product = catalog.products.find(p=>p.id===line.productId); check(product, 'Produkt nie jest dostępny.');
  check(Array.isArray(line.photoIds) && line.photoIds.length >= product.minPhotos && line.photoIds.length <= product.maxPhotos && new Set(line.photoIds).size === line.photoIds.length, 'Sprawdź liczbę zdjęć w produkcie.');
  line.photoIds.forEach(photo); check(line.photoIds.includes(line.coverPhotoId), 'Wybierz zdjęcie na okładkę.');
  return {id:line.id,kind:'product',productId:product.id,photoIds:[...line.photoIds],coverPhotoId:line.coverPhotoId,quantity:line.quantity,title:product.title,unitAmount:product.price,lineTotal:product.price*line.quantity,product:{image_url:product.image_url,title:product.title,description:product.description,nphoto_product_id:product.nphoto_product_id,nphoto_url:product.nphoto_url}};
 });
 const d = deliveryInput as ShopDelivery;
 check(d && ['locker','courier','pickup'].includes(d.method) && (d.method === 'pickup' ? (catalog.delivery.pickup ?? defaultPickupDelivery()).enabled : catalog.delivery[d.method]?.enabled), 'Wybierz dostępną dostawę.');
 check(availableShopDelivery(catalog, lines)[d.method]?.enabled, 'Wybrana dostawa nie obsługuje wszystkich produktów w koszyku. Zmień sposób dostawy lub skontaktuj się z fotografem.');
 check(typeof d.recipientName === 'string' && d.recipientName.trim().split(/\s+/).length >= 2 && d.recipientName.length <= 150, 'Uzupełnij odbiorcę.');
 check(typeof d.email === 'string' && d.email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email), 'Uzupełnij poprawny e-mail.');
 check(typeof d.phone === 'string' && /^\+?[\d ()-]{9,20}$/.test(d.phone) && /^(?:48)?\d{9}$/.test(d.phone.replace(/\D/g,'')), 'Uzupełnij telefon.');
 if(d.method === 'locker') check(typeof d.pointCode === 'string' && /^[A-Za-z0-9_-]{3,30}$/.test(d.pointCode), 'Uzupełnij kod Paczkomatu.');
 else if(d.method === 'courier') check(d.address && typeof d.address.street === 'string' && d.address.street.trim().length >= 3 && d.address.street.length <= 200 && /^\d{2}-\d{3}$/.test(d.address.postalCode) && typeof d.address.city === 'string' && d.address.city.trim().length >= 2 && d.address.city.length <= 100, 'Uzupełnij adres dostawy.');
 const delivery: ShopDelivery & {amount: number} = {method:d.method,recipientName:d.recipientName.trim(),email:d.email.trim(),phone:d.phone,...(d.method==='locker'?{pointCode:d.pointCode!.toUpperCase()}:d.method === 'courier'?{address:{...d.address!}}:{instructions:(catalog.delivery.pickup ?? defaultPickupDelivery()).instructions}),amount:d.method === 'pickup' ? 0 : catalog.delivery[d.method].amount};
 const total = lines.reduce((sum,l)=>sum+l.lineTotal,delivery.amount); check(integer(total,1,100000000), 'Nieprawidłowa wartość zamówienia.');
 return {lines,delivery,total};
}
export function readShopMetadata(raw: string | null | undefined): ShopMetadata | null {try {const m=JSON.parse(raw || ''); return m.kind === 'gallery_merchandise' && m.version === 1 && Array.isArray(m.lines) ? m : null;} catch{return null;}}

/** Only physical print lines go to the lab; album selections never grant digital access. */
export function merchandisePrintEntries(raw: string | null | undefined): Array<{photo_id: number; format: string; quantity: number}> | null {
 const metadata = readShopMetadata(raw);
 if (!metadata) return null;
 return metadata.lines.flatMap(line => line.kind === 'print' && Number.isSafeInteger(line.photoId) && line.photoId > 0 && Number.isSafeInteger(line.quantity) && line.quantity > 0 && line.format?.label
  ? [{photo_id: line.photoId, quantity: line.quantity, format: [line.format.label, line.format.paper].filter(Boolean).join(' · ')}] : []);
}
