/**
 * Photo Challenge Short Code utilities
 *
 * Derives a short, human-readable verification code from the full UUID `unique_link`.
 * Format: 6 uppercase alphanumeric characters from the UUID hex (no dashes), e.g. "A3F9C2".
 *
 * Use cases:
 * - Display as "Kod weryfikacyjny" on the success / voucher / invite page
 *   so the inviter can verbally confirm authenticity to the invitee ("OLX-style").
 * - Power short URLs `/z/[code]` that redirect to `/foto-wyzwanie/invite/[uuid]`.
 *
 * Lookup is done with a `startsWith` query on `unique_link` (after stripping dashes).
 * Collision risk is negligible at our scale (16M code-space).
 */

export function deriveShortCode(uniqueLink: string): string {
    const cleaned = uniqueLink.replace(/-/g, '');
    return cleaned.slice(0, 6).toUpperCase();
}

export function normalizeShortCode(input: string): string {
    return input.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toLowerCase();
}
