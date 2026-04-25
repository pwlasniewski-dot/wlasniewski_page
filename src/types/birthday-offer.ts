// Birthday offer types
export interface BirthdayPackage {
  id: string;
  name: string;
  price: number;
  duration: string;
  photos: number;
  prints: number;
  video?: string;
  features: string[];
  highlighted?: boolean;
}

export interface BirthdayOffer {
  id: string;
  clientId: number;
  clientName: string;
  eventDate: string;
  travelDistance: number;
  packages: BirthdayPackage[];
  images: string[];
  notes: string;
  totalPrice: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  acceptedAt?: Date;
  expiresAt: Date;
}

export interface CreateOfferPayload {
  clientId: number;
  clientName: string;
  eventDate: string;
  travelDistance: number;
  packages: BirthdayPackage[];
  images: string[];
  notes: string;
}

export interface OfferStatus {
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
  viewedAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}
