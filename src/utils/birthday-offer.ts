import { BirthdayOffer, BirthdayPackage, CreateOfferPayload } from '@/types/birthday-offer';

/**
 * Calculate total offer price including travel costs
 */
export function calculateOfferTotal(
  packages: BirthdayPackage[],
  selectedPackageId: string,
  travelDistance: number
): number {
  const selectedPackage = packages.find(p => p.id === selectedPackageId);
  if (!selectedPackage) return 0;

  const travelCost = Math.max(0, (travelDistance - 10) * 1.5);
  return selectedPackage.price + travelCost;
}

/**
 * Calculate all travel costs
 */
export function calculateTravelCost(travelDistance: number): number {
  return Math.max(0, (travelDistance - 10) * 1.5);
}

/**
 * Format currency for display
 */
export function formatPrice(price: number): string {
  return `${price.toFixed(2)} zł`;
}

/**
 * Check if offer is expired
 */
export function isOfferExpired(expiresAt: Date | string): boolean {
  const expireDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return new Date() > expireDate;
}

/**
 * Calculate days until expiration
 */
export function getDaysUntilExpiration(expiresAt: Date | string): number {
  const expireDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  const now = new Date();
  const diffTime = expireDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format offer status for display
 */
export function formatOfferStatus(status: string): string {
  const statusMap: Record<string, string> = {
    draft: 'Szkic',
    sent: 'Wysłana',
    viewed: 'Przejrzana',
    accepted: 'Zaakceptowana',
    rejected: 'Odrzucona',
  };
  return statusMap[status] || status;
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    draft: 'gray',
    sent: 'blue',
    viewed: 'yellow',
    accepted: 'green',
    rejected: 'red',
  };
  return colorMap[status] || 'gray';
}

/**
 * Validate offer data
 */
export function validateOfferData(data: CreateOfferPayload): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.clientId) errors.push('ID klienta jest wymagany');
  if (!data.clientName) errors.push('Nazwa klienta jest wymagana');
  if (!data.eventDate) errors.push('Data imprezy jest wymagana');
  if (data.packages.length === 0) errors.push('Należy wybrać przynajmniej jeden pakiet');
  if (data.travelDistance < 0) errors.push('Dystans nie może być ujemny');

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate offer filename
 */
export function generateOfferFilename(clientName: string, eventDate: string): string {
  const date = new Date(eventDate).toLocaleDateString('pl-PL').replace(/\./g, '-');
  return `Oferta_${clientName.replace(/\s+/g, '_')}_${date}.pdf`;
}

/**
 * Get birthday offer API endpoints
 */
export const offerAPI = {
  create: '/api/admin/offers/birthday/create',
  get: (id: string) => `/api/admin/offers/birthday/${id}`,
  list: '/api/admin/offers/birthday/list',
  update: (id: string) => `/api/admin/offers/birthday/${id}`,
  delete: (id: string) => `/api/admin/offers/birthday/${id}`,
  send: (id: string) => `/api/admin/offers/birthday/${id}/send`,
  download: (id: string) => `/api/admin/offers/birthday/${id}/download`,
  preview: (id: string) => `/oferta/${id}`,
};

/**
 * Format offer for email
 */
export function formatOfferForEmail(offer: BirthdayOffer): string {
  return `
Drogi Kliencie,

Przesyłamy Ci naszą ofertę fotograficzną na koniec wzruszających chwil z Twojej imprezy urodzinowej.

Klient: ${offer.clientName}
Data imprezy: ${new Date(offer.eventDate).toLocaleDateString('pl-PL')}

Wybrane pakiety:
${offer.packages.map(p => `- ${p.name}: ${p.price} zł`).join('\n')}

Ważność oferty: 30 dni od daty przekazania
Link do oferty: ${offerAPI.preview(offer.id)}

W razie pytań jesteśmy do Twojej dyspozycji.

Pozdrawiamy,
Przemysław Właśniewski
Fotograf
`;
}
