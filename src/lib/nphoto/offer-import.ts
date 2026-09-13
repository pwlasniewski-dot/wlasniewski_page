/** Public-page observations, never a complete supplier configurator or supplier price list. */
export type NphotoOfferDraft = {
  sourceUrl: string;
  title: string;
  description: string;
  images: Array<{ url: string; alt: string }>;
  specifications: Array<{ label: string; value: string }>;
  warnings: string[];
  fetchedAt: string;
};

export type NphotoDraftInput = {
  draft: NphotoOfferDraft;
  price: number;
  pageCount: number | null;
  pageUnit: 'pages' | 'spreads';
  format: string;
  minPhotos: number;
  maxPhotos: number;
  mediaConfirmed: true;
};

/** Shared by the admin preview and persisted customer-facing offer. */
export function nphotoOfferDescription(input: Pick<NphotoDraftInput, 'draft' | 'format' | 'pageCount' | 'pageUnit' | 'minPhotos' | 'maxPhotos'>): string {
  const details = [
    input.format.trim() ? `Format: ${input.format.trim()}.` : '',
    input.pageCount !== null ? input.pageUnit === 'spreads'
      ? `Liczba rozkładówek: ${input.pageCount} (${input.pageCount * 2} stron).`
      : `Liczba stron: ${input.pageCount}.` : '',
  ].filter(Boolean).join(' ');
  // Photo limits are rendered from productRules, not copied into editable prose:
  // changing a rule must never leave an obsolete limit in the product description.
  return [input.draft.description.trim(), details].filter(Boolean).join('\n\n');
}
