// TypeScript Type Definitions for Photo Challenge Module

export type ChallengeStatus =
    | 'sent'
    | 'viewed'
    | 'accepted'
    | 'rejected'
    | 'scheduled'
    | 'completed'
    | 'expired';

export type ContactType =
    | 'email'
    | 'phone'
    | 'facebook'
    | 'instagram'
    | 'website';

export type AuthProvider =
    | 'email'
    | 'facebook'
    | 'google';

export type GalleryLayoutStyle =
    | 'masonry'
    | 'circles'
    | 'overlay'
    | 'carousel';

export type SettingType =
    | 'boolean'
    | 'number'
    | 'text'
    | 'json';

// ============================================
// Database Models
// ============================================

export interface ChallengePackage {
    id: number;
    name: string;
    description: string | null;
    base_price: number;
    challenge_price: number;
    discount_percentage: number;
    included_items: string[] | null;
    is_active: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;
}

export interface ChallengeLocation {
    id: number;
    name: string;
    description: string | null;
    address: string | null;
    google_maps_url: string | null;
    image_url: string | null;
    is_active: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;
}

export interface ChallengeUser {
    id: number;
    email: string;
    password_hash: string | null;
    name: string | null;
    phone: string | null;
    auth_provider: AuthProvider;
    auth_provider_id: string | null;
    created_at: string;
    last_login: string | null;
}

export interface PhotoChallenge {
    id: number;
    unique_link: string;

    // Inviter
    inviter_name: string;
    inviter_contact: string;
    inviter_contact_type: ContactType;

    // Invitee
    invitee_name: string;
    invitee_contact: string;
    invitee_contact_type: ContactType;
    invitee_user_id: number | null;

    // Details
    package_id: number;
    location_id: number | null;
    custom_location: string | null;
    custom_location_maps_url: string | null;

    // Discount
    discount_amount: number;
    discount_percentage: number;

    // Status & Dates
    status: ChallengeStatus;
    acceptance_deadline: string | null;
    created_at: string;
    viewed_at: string | null;
    accepted_at: string | null;
    rejected_at: string | null;
    session_date: string | null;
    completed_at: string | null;

    // Preferences
    preferred_dates: string[] | null;

    // Admin
    admin_notes: string | null;

    // Gallery
    gallery_id: number | null;
}

export interface ChallengeTimelineEvent {
    id: number;
    challenge_id: number;
    event_type: string;
    event_description: string | null;
    metadata: Record<string, any> | null;
    created_at: string;
}

export interface ChallengeGallery {
    id: number;
    challenge_id: number;
    title: string;
    description: string | null;
    couple_names: string | null;
    session_type: string | null;
    testimonial_text: string | null;
    is_published: boolean;
    show_in_public_gallery: boolean;
    layout_style: GalleryLayoutStyle;
    created_at: string;
    published_at: string | null;
    updated_at: string;
}

export interface ChallengePhoto {
    id: number;
    gallery_id: number;
    media_id: number;
    is_cover: boolean;
    display_order: number;
    created_at: string;
}

export interface ChallengeSetting {
    id: number;
    setting_key: string;
    setting_value: string | null;
    setting_type: SettingType;
    updated_at: string;
}

// ============================================
// Extended Models with Relations
// ============================================

export interface PhotoChallengeWithDetails extends PhotoChallenge {
    package?: ChallengePackage;
    location?: ChallengeLocation;
    invitee_user?: ChallengeUser;
    gallery?: ChallengeGallery;
    timeline?: ChallengeTimelineEvent[];
}

export interface ChallengeGalleryWithPhotos extends ChallengeGallery {
    photos?: Array<ChallengePhoto & { media?: any }>;
    cover_photo?: ChallengePhoto & { media?: any };
}

// ============================================
// API Request/Response Types
// ============================================

// Create Challenge
export interface CreateChallengeRequest {
    inviter_name: string;
    inviter_contact: string;
    inviter_contact_type: ContactType;
    invitee_name: string;
    invitee_contact: string;
    invitee_contact_type: ContactType;
    package_id: number;
    location_id?: number;
    custom_location?: string;
    custom_location_maps_url?: string;
}

export interface CreateChallengeResponse {
    success: boolean;
    challenge_id: number;
    unique_link: string;
    shareable_url: string;
    acceptance_deadline: string;
}

// Accept/Reject Challenge
export interface AcceptChallengeRequest {
    preferred_dates: string[];
}

export interface AcceptChallengeResponse {
    success: boolean;
    message: string;
    challenge: PhotoChallengeWithDetails;
}

// Challenge Stats
export interface ChallengeStats {
    total_challenges: number;
    accepted_this_month: number;
    completed_sessions: number;
    active_challenges: number;
    remaining_monthly_slots?: number;
}

// Settings
export interface ChallengeSettingsMap {
    // Modules
    module_enabled: boolean;
    fomo_countdown_enabled: boolean;
    social_proof_enabled: boolean;
    monthly_limit_enabled: boolean;
    public_gallery_enabled: boolean;

    // FOMO
    fomo_countdown_hours: number;

    // Limits
    monthly_challenge_limit: number;

    // Content
    landing_headline: string;
    landing_subtitle: string;
    cta_button_text: string;
    fomo_message: string;
    social_proof_message: string;

    // Visual
    gold_accent_intensity: number;
    enable_carousels: boolean;
    enable_circular_grids: boolean;
    enable_overlapping_images: boolean;
    enable_parallax: boolean;
}

// Auth
export interface ChallengeUserRegisterRequest {
    email: string;
    password: string;
    name: string;
    phone?: string;
}

export interface ChallengeUserLoginRequest {
    email: string;
    password: string;
}

export interface ChallengeAuthResponse {
    success: boolean;
    token: string;
    user: {
        id: number;
        email: string;
        name: string | null;
    };
}

// Admin - List Challenges
export interface ListChallengesQuery {
    status?: ChallengeStatus;
    package_id?: number;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export interface ListChallengesResponse {
    challenges: PhotoChallengeWithDetails[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

// Admin - Update Challenge
export interface UpdateChallengeRequest {
    status?: ChallengeStatus;
    session_date?: string;
    admin_notes?: string;
    preferred_dates?: string[];
}

// Gallery
export interface PublicGalleryItem {
    id: number;
    title: string;
    couple_names: string | null;
    session_type: string | null;
    testimonial_text: string | null;
    cover_photo_url: string | null;
    photo_count: number;
    layout_style: GalleryLayoutStyle;
}

// Package/Location CRUD
export interface CreatePackageRequest {
    name: string;
    description?: string;
    base_price: number;
    challenge_price: number;
    discount_percentage: number;
    included_items?: string[];
    display_order?: number;
}

export interface UpdatePackageRequest extends Partial<CreatePackageRequest> {
    is_active?: boolean;
}

export interface CreateLocationRequest {
    name: string;
    description?: string;
    address?: string;
    google_maps_url?: string;
    image_url?: string;
    display_order?: number;
}

export interface UpdateLocationRequest extends Partial<CreateLocationRequest> {
    is_active?: boolean;
}

// ============================================
// Client-side State Types
// ============================================

export interface ChallengeCreatorState {
    step: 1 | 2 | 3;
    selectedPackage: ChallengePackage | null;
    selectedLocation: ChallengeLocation | null;
    customLocation: string;
    customLocationMapsUrl: string;
    inviterName: string;
    inviterContact: string;
    inviterContactType: ContactType;
    inviteeName: string;
    inviteeContact: string;
    inviteeContactType: ContactType;
}

export interface ChallengeAcceptanceState {
    challenge: PhotoChallengeWithDetails | null;
    isAuthenticated: boolean;
    showLoginModal: boolean;
    preferredDates: string[];
}
