/** Shared private-gallery merchandise contract. Amounts are integer grosze. */
export type PrintFormat = { id: string; label: string; widthMm: number; heightMm: number; unitAmount: number; active: boolean; paper: string };
export type ShopProduct = { id: number; title: string; description: string | null; price: number; image_url: string | null; product_type: string | null; minPhotos: number; maxPhotos: number };
export type ShopConfig = { version: 1; enabled: boolean; title: string; introduction: string; buttonLabel: string; formats: PrintFormat[]; productRules: Record<string, {minPhotos: number; maxPhotos: number}>; delivery: {locker: {enabled: boolean; amount: number}; courier: {enabled: boolean; amount: number}} };
export type ShopCatalog = Omit<ShopConfig, 'version' | 'productRules'> & {galleryId: number; products: ShopProduct[]};
export type ShopCrop = {mode: 'fit' | 'fill'; x: number; y: number; zoom: number};
export type ShopLine = {id: string; kind: 'print'; photoId: number; formatId: string; quantity: number; crop: ShopCrop; confirmed: boolean} | {id: string; kind: 'product'; productId: number; photoIds: number[]; coverPhotoId: number; quantity: number};
export type ShopDelivery = {method: 'locker' | 'courier'; recipientName: string; email: string; phone: string; pointCode?: string; address?: {street: string; postalCode: string; city: string}};
export type PricedShopLine = ShopLine & {title: string; unitAmount: number; lineTotal: number; format?: PrintFormat};
export type ShopMetadata = {kind: 'gallery_merchandise'; version: 1; lines: PricedShopLine[]; delivery: ShopDelivery & {amount: number}; fulfillment: {status: 'new' | 'ordered' | 'received' | 'packed' | 'shipped'; trackingNumber: string | null}};
export class ShopValidationError extends Error { constructor(message: string, public status = 400) {super(message); this.name = 'ShopValidationError';} }
function check(ok: unknown, message: string): asserts ok {if (!ok) throw new ShopValidationError(message);}
function integer(value: unknown, min: number, max: number) {return typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;}
export function defaultShopConfig(): ShopConfig {return {version: 1, enabled: false, title: 'Zamów zdjęcia i produkty', introduction: '', buttonLabel: 'Przejdź do zakupu zdjęć', formats: [], productRules: {}, delivery: {locker: {enabled: false, amount: 0}, courier: {enabled: false, amount: 0}}};}
export function validateShopConfig(input: unknown): ShopConfig {
 const c = input as ShopConfig;
 check(c && c.version === 1 && typeof c.enabled === 'boolean', 'Nieprawidłowa konfiguracja sklepu.');
 for (const key of ['title','introduction','buttonLabel'] as const) check(typeof c[key] === 'string' && c[key].length <= 2000, 'Nieprawidłowa treść sklepu.');
 check(c.title.trim() && c.buttonLabel.trim(), 'Uzupełnij tytuł i przycisk.');
 check(Array.isArray(c.formats) && c.formats.length <= 100, 'Nieprawidłowe formaty.');
 const ids = new Set<string>();
 for (const f of c.formats) {check(f && typeof f.id === 'string' && /^[a-zA-Z0-9_-]{1,60}$/.test(f.id) && !ids.has(f.id), 'Format musi mieć unikalny identyfikator.'); ids.add(f.id); check(typeof f.label === 'string' && f.label.trim() && f.label.length <= 160 && typeof f.paper === 'string' && f.paper.length <= 100 && typeof f.active === 'boolean', 'Uzupełnij nazwę formatu i papier.'); check(integer(f.widthMm,1,2000) && integer(f.heightMm,1,2000) && integer(f.unitAmount,1,10000000), 'Nieprawidłowy rozmiar lub cena formatu.');}
 check(c.productRules && typeof c.productRules === 'object' && !Array.isArray(c.productRules), 'Nieprawidłowe reguły produktów.');
 for (const [id, r] of Object.entries(c.productRules)) check(/^\d+$/.test(id) && r && integer(r.minPhotos,1,500) && integer(r.maxPhotos,r.minPhotos,500), 'Nieprawidłowa liczba zdjęć produktu.');
 for (const method of ['locker','courier'] as const) check(c.delivery?.[method] && typeof c.delivery[method].enabled === 'boolean' && integer(c.delivery[method].amount,0,1000000), 'Nieprawidłowa cena dostawy.');
 if(c.enabled) check(c.delivery.locker.enabled || c.delivery.courier.enabled, 'Włącz przynajmniej jedną metodę dostawy.');
 return JSON.parse(JSON.stringify(c));
}
export function readShopConfig(raw: string | null | undefined): ShopConfig {try {return validateShopConfig(JSON.parse(raw || ''));} catch {return defaultShopConfig();}}
export function priceShopCart(catalog: ShopCatalog, input: unknown, deliveryInput: unknown, allowedPhotoIds: number[]) {
 check(catalog.enabled, 'Sklep jest obecnie niedostępny.');
 check(Array.isArray(input) && input.length > 0 && input.length <= 500, 'Koszyk musi zawierać od 1 do 500 pozycji.');
 const allowed = new Set(allowedPhotoIds); const ids = new Set<string>();
 const photo = (id: number) => check(integer(id,1,Number.MAX_SAFE_INTEGER) && allowed.has(id), 'Zdjęcie nie jest dostępne w tej galerii.');
 const lines: PricedShopLine[] = input.map((line: ShopLine) => {
  check(line && typeof line.id === 'string' && line.id.length > 0 && line.id.length <= 128 && !ids.has(line.id), 'Nieprawidłowa pozycja koszyka.'); ids.add(line.id);
  check(integer(line.quantity,1,99), 'Liczba sztuk musi wynosić od 1 do 99.');
  if(line.kind === 'print') {
   photo(line.photoId); const format = catalog.formats.find(f=>f.id===line.formatId && f.active); check(format, 'Wybrany format nie jest dostępny.');
   check(line.confirmed === true, 'Zatwierdź podgląd odbitki.'); const c = line.crop;
   check(c && ['fit','fill'].includes(c.mode) && Number.isFinite(c.x) && c.x >= 0 && c.x <= 100 && Number.isFinite(c.y) && c.y >= 0 && c.y <= 100 && Number.isFinite(c.zoom) && c.zoom >= 1 && c.zoom <= 3, 'Nieprawidłowy kadr.');
   return {id:line.id,kind:'print',photoId:line.photoId,formatId:format.id,quantity:line.quantity,crop:{...c},confirmed:true,title:format.label,unitAmount:format.unitAmount,lineTotal:format.unitAmount*line.quantity,format:{...format}};
  }
  check(line.kind === 'product', 'Nieznany rodzaj pozycji.');
  const product = catalog.products.find(p=>p.id===line.productId); check(product, 'Produkt nie jest dostępny.');
  check(Array.isArray(line.photoIds) && line.photoIds.length >= product.minPhotos && line.photoIds.length <= product.maxPhotos && new Set(line.photoIds).size === line.photoIds.length, 'Sprawdź liczbę zdjęć w produkcie.');
  line.photoIds.forEach(photo); check(line.photoIds.includes(line.coverPhotoId), 'Wybierz zdjęcie na okładkę.');
  return {id:line.id,kind:'product',productId:product.id,photoIds:[...line.photoIds],coverPhotoId:line.coverPhotoId,quantity:line.quantity,title:product.title,unitAmount:product.price,lineTotal:product.price*line.quantity};
 });
 const d = deliveryInput as ShopDelivery;
 check(d && ['locker','courier'].includes(d.method) && catalog.delivery[d.method]?.enabled, 'Wybierz dostępną dostawę.');
 check(typeof d.recipientName === 'string' && d.recipientName.trim().length >= 2 && d.recipientName.length <= 150, 'Uzupełnij odbiorcę.');
 check(typeof d.email === 'string' && d.email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email), 'Uzupełnij poprawny e-mail.');
 check(typeof d.phone === 'string' && /^\+?[\d ()-]{9,20}$/.test(d.phone) && d.phone.replace(/\D/g,'').length >= 9, 'Uzupełnij telefon.');
 if(d.method === 'locker') check(typeof d.pointCode === 'string' && /^[A-Za-z0-9_-]{3,30}$/.test(d.pointCode), 'Uzupełnij kod Paczkomatu.');
 else check(d.address && typeof d.address.street === 'string' && d.address.street.trim().length >= 3 && d.address.street.length <= 200 && /^\d{2}-\d{3}$/.test(d.address.postalCode) && typeof d.address.city === 'string' && d.address.city.trim().length >= 2 && d.address.city.length <= 100, 'Uzupełnij adres dostawy.');
 const delivery = {method:d.method,recipientName:d.recipientName.trim(),email:d.email.trim(),phone:d.phone,...(d.method==='locker'?{pointCode:d.pointCode!.toUpperCase()}:{address:{...d.address!}}),amount:catalog.delivery[d.method].amount};
 const total = lines.reduce((sum,l)=>sum+l.lineTotal,delivery.amount); check(integer(total,1,100000000), 'Nieprawidłowa wartość zamówienia.');
 return {lines,delivery,total};
}
export function readShopMetadata(raw: string | null | undefined): ShopMetadata | null {try {const m=JSON.parse(raw || ''); return m.kind === 'gallery_merchandise' && m.version === 1 && Array.isArray(m.lines) ? m : null;} catch{return null;}}
