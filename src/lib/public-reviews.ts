export type ReviewRecord = {
    id: number;
    client_name: string;
    testimonial_text: string;
    rating: number | null;
    source: string | null;
    is_featured?: boolean;
    show_on_booking_page?: boolean;
    display_order?: number;
};

export function selectPublicReviews<T extends ReviewRecord>(reviews: T[], placement: 'general' | 'booking' = 'general'): T[] {
    const ordered = [...reviews].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || b.id - a.id);
    if (placement === 'booking') {
        const booking = ordered.filter(review => review.show_on_booking_page);
        if (booking.length) return booking;
    }
    const featured = ordered.filter(review => review.is_featured);
    return featured.length ? featured : ordered;
}

/** Never present a mixture of Facebook and Google ratings as a Google score. */
export function summarizeGoogleReviews(reviews: ReviewRecord[]) {
    const rated = reviews.filter(review => review.source?.trim().toLowerCase() === 'google'
        && Number.isInteger(review.rating) && review.rating! >= 1 && review.rating! <= 5);
    if (!rated.length) return null;
    return {
        source: 'Google',
        count: rated.length,
        rating: Math.round(rated.reduce((sum, review) => sum + review.rating!, 0) / rated.length * 10) / 10,
    };
}

export function googleReviewSummaryLabel(summary: NonNullable<ReturnType<typeof summarizeGoogleReviews>>) {
    const countLabel = summary.count === 1 ? 'opinia' : summary.count % 10 >= 2 && summary.count % 10 <= 4
        && (summary.count % 100 < 12 || summary.count % 100 > 14) ? 'opinie' : 'opinii';
    return `Google · ${summary.rating.toLocaleString('pl-PL', { minimumFractionDigits: 1 })}/5 · ${summary.count} ${countLabel}`;
}
