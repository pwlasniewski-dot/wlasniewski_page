import { parse } from 'node-html-parser';
import { ShopValidationError } from '@/lib/galleries/merchandise';
import type { NphotoDraftInput, NphotoOfferDraft } from './offer-import';

const PAGE_LIMIT = 2 * 1024 * 1024;
const REQUEST_LIMIT = 64 * 1024;
const HOSTS = new Set(['nphoto.com', 'www.nphoto.com']);
const NON_PRODUCT = /^(?:sklep|shop|konto|moje-konto|user|users|login|logowanie|account|cart|koszyk|checkout|api|admin|search|szukaj|strefa-klienta|aktualnosci|blog|kontakt|faq|cennik|oferta|regulamin|polityka-prywatnosci|materialy-na-oprawy|galeria-materialow|linia|typ-okladki|typy-fotografii)$/;
const CATEGORIES = new Set(['fotoalbumy', 'fotoksiazki', 'fotoksiążki', 'fotokalendarze', 'odbitki-i-wydruki', 'opakowania', 'wall-decor', 'nosniki-danych']);
const BASE_WARNINGS = [
  'To odczyt publicznej strony, nie pełna lista wariantów, zależności ani cen nPhoto. Parametry wymagają sprawdzenia przed publikacją.',
  'Zdjęcia producenta mogą pokazywać różne oprawy i dodatki. Wybierz tylko materiały, do których masz prawo, zgodne ze sprzedawanym wariantem.',
  'Cena, liczba stron i zakres zdjęć są ustalane przez fotografa. Import nie składa zamówienia w nPhoto.',
];

export function validateNphotoProductUrl(input: unknown): URL {
  if (typeof input !== 'string' || input.length > 500 || /[\s\\%]/.test(input)) {
    throw new ShopValidationError('Wklej bezpośredni publiczny adres produktu nPhoto, bez parametrów.');
  }
  let url: URL;
  try { url = new URL(input); } catch { throw new ShopValidationError('Nieprawidłowy adres produktu.'); }
  const parts = url.pathname.replace(/\/$/, '').split('/').filter(Boolean);
  if (url.protocol !== 'https:' || !HOSTS.has(url.hostname) || url.port || url.username || url.password || url.search || url.hash
      || parts[0] !== 'pl' || parts.length < 2 || parts.length > 4
      || parts.some(p => !/^[a-z0-9-]+$/.test(p) || NON_PRODUCT.test(p))
      || (parts.length === 2 && CATEGORIES.has(parts[1]))) {
    throw new ShopValidationError('Obsługujemy wyłącznie publiczne strony konkretnych produktów https://nphoto.com/pl/ — bez logowania i parametrów.');
  }
  url.hostname = 'nphoto.com';
  url.pathname = url.pathname.replace(/\/$/, '');
  return url;
}

export function plainNphotoText(value: unknown, max: number, preserveParagraphs = false): string {
  if (typeof value !== 'string') return '';
  const root = parse(value.slice(0, max * 5), { comment: false });
  root.querySelectorAll('script, style, noscript, iframe, object, embed, template').forEach(n => n.remove());
  if (preserveParagraphs) {
    root.querySelectorAll('br').forEach(n => n.replaceWith('\n'));
    root.querySelectorAll('p,div,li').forEach(n => n.insertAdjacentHTML('afterend','\n\n'));
    return root.text.replace(/[<>]/g,'').replace(/\r\n?/g,'\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g,' ')
      .replace(/[^\S\n]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim().slice(0,max);
  }
  return root.text.replace(/[<>]/g, '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function safeNphotoImage(input: unknown, base: string): string | null {
  if (typeof input !== 'string' || input.length > 2000 || /[\u0000-\u001f\\]/.test(input)) return null;
  try {
    const url = new URL(input, base);
    if (url.protocol !== 'https:' || !HOSTS.has(url.hostname) || url.port || url.username || url.password || url.hash
        || !url.pathname.startsWith('/sites/default/files/') || !/\.(?:jpe?g|png|webp|avif)$/i.test(url.pathname)
        || /%2f|%5c|%00/i.test(url.pathname) || [...url.searchParams.keys()].some(key => key !== 'itok')) return null;
    return url.href;
  } catch { return null; }
}

/** Plain DOM extraction only. No scripts, styles, embeds or executable markup is retained. */
export function parseNphotoOffer(html: string, source: string, now = new Date()): NphotoOfferDraft {
  const sourceUrl = validateNphotoProductUrl(source).href;
  if (Buffer.byteLength(html, 'utf8') > PAGE_LIMIT) throw new ShopValidationError('Strona produktu jest zbyt duża do bezpiecznego importu.', 422);
  const root = parse(html, { comment: false });
  root.querySelectorAll('script,style,noscript,iframe,object,embed,template,nav,header,footer,aside').forEach(n => n.remove());
  const main = root.querySelector('article.node--type-product') || root.querySelector('[itemtype="https://schema.org/Product"]') || root.querySelector('[itemtype="http://schema.org/Product"]');
  if (!main) throw new ShopValidationError('Nie rozpoznano strony konkretnego produktu. Strona kategorii, logowanie lub zmieniony układ wymaga ręcznego sprawdzenia.', 422);
  const title = plainNphotoText(main.querySelector('h1')?.text || root.querySelector('h1')?.text, 160);
  if (!title || /access denied|captcha|zaloguj|logowanie|just a moment/i.test(title)) throw new ShopValidationError('Strona produktu nie jest publicznie dostępna do importu.', 422);
  const intro = main.querySelector('.product__info--body .field__item') || main.querySelector('.field--name-body .field__item') || main.querySelector('[itemprop="description"]');
  const description = plainNphotoText(intro?.innerHTML || root.querySelector('meta[property="og:description"]')?.getAttribute('content') || root.querySelector('meta[name="description"]')?.getAttribute('content'), 1400, true);
  const images: NphotoOfferDraft['images'] = [];
  const seen = new Set<string>();
  const addImage = (raw: unknown, alt: unknown) => {
    const url = safeNphotoImage(raw, sourceUrl);
    const label = plainNphotoText(alt, 180);
    if (!url || /(?:logo|partner|promocj|rabat|oferta świąteczna|black.friday|newsletter)/i.test(label)) return;
    // Different Drupal image styles can point to the same original file.
    const key = new URL(url).pathname.replace(/\/styles\/[^/]+\/public\//, '/');
    if (!seen.has(key) && images.length < 12) { seen.add(key); images.push({url, alt: label || title}); }
  };
  // Intentionally narrow: hero/product-gallery only, never navigation or related-product tiles.
  main.querySelectorAll('.product__info--image img, .product-gallery img, [itemprop="image"], a[data-colorbox-gallery] img').forEach(img => {
    const anchor = img.closest('a[data-colorbox-gallery]');
    if (anchor && !/gallery-galeria/.test(anchor.getAttribute('data-colorbox-gallery') || '')) return;
    if (img.closest('.field--name-field-dodaj-produkt, .related-products, .product-related')) return;
    addImage(anchor?.getAttribute('href') || img.getAttribute('data-src') || img.getAttribute('src'), img.getAttribute('alt'));
  });
  if (!images.length) addImage(root.querySelector('meta[property="og:image"]')?.getAttribute('content'), title);

  const specifications: NphotoOfferDraft['specifications'] = [];
  const addSpec = (label: string, raw: string) => {
    const value = plainNphotoText(raw, 600);
    if (value && specifications.length < 12 && !specifications.some(s => s.label === label && s.value === value)) specifications.push({label, value});
  };
  const collect = (selector: string, label: string) => {
    const values = main.querySelectorAll(selector).map(n => plainNphotoText(n.text, 120)).filter(Boolean);
    if (values.length) addSpec(label, [...new Set(values)].join(' · '));
  };
  collect('.field--name-field-formaty-produktow .field--name-title, .field--name-field-formaty-produktow .field--name-field-title', 'Formaty wymienione przez producenta');
  // Drupal product format illustrations carry the visible dimensional labels in alt.
  if (!specifications.length) {
    const formats = main.querySelectorAll('.field--name-field-formaty-produktow img').map(n => n.getAttribute('alt') || '').filter(v => /\d/.test(v));
    if (formats.length) addSpec('Formaty wymienione przez producenta', [...new Set(formats)].join(' · '));
  }
  collect('.field--name-field-komponenty-lini-i-wzorow .field--name-field-titless', 'Linie wymienione przez producenta');
  main.querySelectorAll('.product-specifications tr, .product-specs tr, [itemprop="additionalProperty"]').forEach(row => {
    const cells = row.querySelectorAll('th,td');
    const label = plainNphotoText(cells[0]?.text || row.querySelector('[itemprop="name"]')?.text, 100);
    const value = cells[1]?.text || row.querySelector('[itemprop="value"]')?.text;
    if (label && value && !/cena|price|koszt/i.test(label)) addSpec(label, value);
  });
  return {sourceUrl, title, description, images, specifications, warnings: [
    ...BASE_WARNINGS,
    ...(!description ? ['Nie znaleziono opisu. Uzupełnij własny opis przed publikacją.'] : []),
    ...(!images.length ? ['Nie znaleziono pewnych zdjęć produktu. Dodaj własne materiały w edycji oferty.'] : []),
    ...(!specifications.length ? ['Nie udało się jednoznacznie odczytać parametrów. Nie zostały dopowiedziane.'] : []),
  ], fetchedAt: now.toISOString()};
}

/** One overall 8-second deadline, bounded decoded body and manual allowlisted redirects. */
export async function fetchNphotoOffer(input: unknown, fetcher: typeof fetch = fetch): Promise<NphotoOfferDraft> {
  let url = validateNphotoProductUrl(input);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    for (let redirects = 0; redirects <= 2; redirects++) {
      const response = await fetcher(url.href, { redirect: 'manual', signal: controller.signal, cache: 'no-store', credentials: 'omit', headers: { Accept: 'text/html', 'User-Agent': 'Wlasniewski-Product-Preview/1.0' } });
      if ([301,302,303,307,308].includes(response.status)) {
        await response.body?.cancel();
        if (redirects === 2) throw new ShopValidationError('Zbyt wiele przekierowań strony produktu.', 422);
        const location = response.headers.get('location');
        if (!location) throw new ShopValidationError('Nieprawidłowe przekierowanie produktu.', 422);
        url = validateNphotoProductUrl(new URL(location, url).href);
        continue;
      }
      if (!response.ok) { await response.body?.cancel(); throw new ShopValidationError('nPhoto nie udostępniło strony do odczytu. Nie omijamy logowania ani blokad dostępu.', 422); }
      if (!/^text\/html(?:;|$)/i.test(response.headers.get('content-type') || '')) { await response.body?.cancel(); throw new ShopValidationError('Adres nie prowadzi do strony HTML produktu.', 422); }
      if (Number(response.headers.get('content-length') || 0) > PAGE_LIMIT) { await response.body?.cancel(); throw new ShopValidationError('Strona produktu przekracza limit 2 MB.', 422); }
      if (!response.body) throw new ShopValidationError('Strona produktu jest pusta.', 422);
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const {done,value} = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > PAGE_LIMIT) { await reader.cancel(); throw new ShopValidationError('Strona produktu przekracza limit 2 MB.', 422); }
          chunks.push(value);
        }
      } finally { reader.releaseLock(); }
      return parseNphotoOffer(Buffer.concat(chunks).toString('utf8'), url.href);
    }
    throw new ShopValidationError('Nie udało się odczytać strony produktu.', 422);
  } catch (error) {
    if (error instanceof ShopValidationError) throw error;
    throw new ShopValidationError(controller.signal.aborted ? 'nPhoto nie odpowiedziało w ciągu 8 sekund. Spróbuj później.' : 'Nie udało się pobrać publicznej strony nPhoto. Spróbuj później.', 502);
  } finally { clearTimeout(timer); }
}

export async function readNphotoRequestBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get('content-length') || 0) > REQUEST_LIMIT || !request.body) throw new ShopValidationError('Nieprawidłowe lub zbyt duże dane importu.');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > REQUEST_LIMIT) { await reader.cancel(); throw new ShopValidationError('Dane importu przekraczają limit.'); }
      chunks.push(value);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new ShopValidationError('Nieprawidłowe dane importu.'); }
  } finally { reader.releaseLock(); }
}

export function validateNphotoDraftInput(input: unknown): NphotoDraftInput {
  const value = input as NphotoDraftInput;
  const integer = (n: unknown, min: number, max: number) => typeof n === 'number' && Number.isSafeInteger(n) && n >= min && n <= max;
  if (!value || value.mediaConfirmed !== true) throw new ShopValidationError('Potwierdź prawa do wybranych zdjęć i opisów przed zapisaniem oferty.');
  if (!integer(value.price,0,10000000) || !integer(value.minPhotos,1,500) || !integer(value.maxPhotos,value.minPhotos,500)
      || (value.pageCount !== null && !integer(value.pageCount,1,500)) || !['pages','spreads'].includes(value.pageUnit)
      || typeof value.format !== 'string' || value.format.length > 120) throw new ShopValidationError('Sprawdź cenę, format, liczbę stron i zakres zdjęć.');
  const d = value.draft;
  if (!d || typeof d.title !== 'string' || d.title.length > 160 || typeof d.description !== 'string' || d.description.length > 4500
      || !Array.isArray(d.images) || d.images.length > 12 || !Array.isArray(d.specifications) || d.specifications.length > 12) throw new ShopValidationError('Nieprawidłowy podgląd oferty.');
  const sourceUrl = validateNphotoProductUrl(d.sourceUrl).href;
  const title = plainNphotoText(d.title,160);
  if (!title) throw new ShopValidationError('Uzupełnij nazwę produktu.');
  const images = d.images.map(image => {
    const url = safeNphotoImage(image?.url, sourceUrl);
    if (!url) throw new ShopValidationError('Wybrany materiał nie jest bezpiecznym zdjęciem z nPhoto.');
    return {url, alt: plainNphotoText(image.alt,180) || title};
  });
  const specifications = d.specifications.map(spec => ({label:plainNphotoText(spec?.label,100),value:plainNphotoText(spec?.value,600)})).filter(spec => spec.label && spec.value);
  const fetchedAt = typeof d.fetchedAt === 'string' && Number.isFinite(Date.parse(d.fetchedAt)) ? new Date(d.fetchedAt).toISOString() : new Date().toISOString();
  return {draft: {sourceUrl, title, description:plainNphotoText(d.description,4500,true),images,specifications,warnings:[...BASE_WARNINGS],fetchedAt}, price:value.price,pageCount:value.pageCount,pageUnit:value.pageUnit,format:plainNphotoText(value.format,120),minPhotos:value.minPhotos,maxPhotos:value.maxPhotos,mediaConfirmed:true};
}
