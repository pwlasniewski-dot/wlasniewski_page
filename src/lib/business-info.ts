/**
 * Single source of truth for the photographer's business contact details.
 * Update values here — they propagate to voucher PDF, invite/success pages,
 * email signatures, ICS calendar files, etc.
 */
export const BUSINESS_INFO = {
    name: 'Przemysław Właśniewski',
    nameAscii: 'Przemyslaw Wlasniewski', // for PDF (pdfkit Helvetica has no PL diacritics)
    tagline: 'Fotograf — sesje plenerowe',
    phone: '+48 530 788 694',
    phoneRaw: '+48530788694',
    email: 'pwlasniewski@gmail.com',
    nip: '8781430365',
    region: 'Płużnica, woj. kujawsko-pomorskie',
    regionAscii: 'Pluznica, woj. kujawsko-pomorskie',
    locationNote: 'Sesje wyłącznie w plenerze — miejsce ustalamy indywidualnie z fotografem.',
    locationNoteAscii: 'Sesje wylacznie w plenerze - miejsce ustalamy indywidualnie z fotografem.',
    siteName: 'wlasniewski.pl',
    siteUrl: 'https://wlasniewski.pl',
} as const;

export type BusinessInfo = typeof BUSINESS_INFO;
