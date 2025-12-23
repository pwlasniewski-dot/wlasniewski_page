// Types for Client Gallery System

export interface ClientGallery {
    id: number;
    booking_id: number;
    client_email: string;
    client_name: string;
    access_code: string;
    expires_at: string | null;
    standard_count: number;
    price_per_premium: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface GalleryPhoto {
    id: number;
    gallery_id: number;
    file_url: string;
    thumbnail_url: string | null;
    file_size: number;
    width: number | null;
    height: number | null;
    is_standard: boolean;
    order_index: number;
    created_at: string;
}

export interface PhotoOrder {
    id: number;
    gallery_id: number;
    photo_ids: string; // JSON array
    photo_count: number;
    total_amount: number; // in cents
    payment_status: 'pending' | 'paid' | 'failed' | 'cancelled';
    payment_id: string | null;
    payment_url: string | null;
    paid_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface SystemSettings {
    id: number;
    key: string;
    value: string; // JSON
    description: string | null;
    updated_at: string;
}

// Extended types with relations
export interface ClientGalleryWithPhotos extends ClientGallery {
    photos: GalleryPhoto[];
    standard_photos: GalleryPhoto[];
    premium_photos: GalleryPhoto[];
}

export interface ClientGalleryWithStats extends ClientGallery {
    total_photos: number;
    standard_photos_count: number;
    premium_photos_count: number;
    total_revenue: number; // from premium sales
}

export interface PhotoOrderWithPhotos extends PhotoOrder {
    photos: GalleryPhoto[];
}

// Request/Response types
export interface CreateGalleryRequest {
    booking_id: number;
    client_email: string;
    client_name: string;
    standard_count: number;
    expires_at?: string;
}

export interface UploadPhotosRequest {
    gallery_id: number;
    photos: File[];
    is_standard: boolean;
}

export interface UpdatePhotoRequest {
    is_standard?: boolean;
    order_index?: number;
}

export interface CreateOrderRequest {
    photo_ids: number[];
}

export interface CreateOrderResponse {
    success: boolean;
    order_id: number;
    payment_url: string;
    total_amount: number;
}

// Gallery access
export interface GalleryAccessRequest {
    email: string;
    access_code: string;
}

export interface GalleryAccessResponse {
    success: boolean;
    gallery?: ClientGalleryWithPhotos;
    error?: string;
}
