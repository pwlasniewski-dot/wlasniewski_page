/** Append media to the editor draft only; publishing uses the existing save flow. */
export function appendProductImages(current: string[] | undefined, selection: string | string[]): string[] {
  const selected = Array.isArray(selection) ? selection : [selection];
  if (!selected.length) return [...(current || [])];
  for (const value of selected) {
    let url: URL;
    try { url = new URL(value); } catch { throw new Error('Wybierz zdjęcia JPG, PNG, WebP, AVIF lub GIF.'); }
    if (url.protocol !== 'https:' || url.username || url.password || !/\.(?:jpe?g|png|webp|avif|gif)$/i.test(url.pathname)) {
      throw new Error('Wybierz zdjęcia JPG, PNG, WebP, AVIF lub GIF. Pliki PSD, ZIP, PDF i filmy nie są zdjęciami podglądu.');
    }
  }
  const merged = [...new Set([...(current || []), ...selected])];
  if (merged.length > 12) throw new Error(`Możesz dodać maksymalnie 12 zdjęć w tej sekcji. Po dodaniu byłoby ${merged.length}. Usuń część ujęć lub wybierz mniej plików.`);
  return merged;
}
