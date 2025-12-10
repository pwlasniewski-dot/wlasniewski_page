// Utility functions for Photo Challenge module

import { randomUUID } from 'crypto';

/**
 * Generuje unikalny link dla wyzwania
 * Format: uuid-v4
 */
export function generateUniqueLink(): string {
    return randomUUID();
}

/**
 * Tworzy pełny URL do akceptacji wyzwania
 */
export function generateShareableUrl(uniqueLink: string, baseUrl?: string): string {
    const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return `${base}/foto-wyzwanie/akceptuj/${uniqueLink}`;
}

/**
 * Generuje tekst do udostępnienia na social media
 */
export function generateShareText(inviterName: string, packageName: string): string {
    return `${inviterName} rzuca Ci foto-wyzwanie! 📸✨\n\nChce zaprosić Cię na wspólną sesję zdjęciową (${packageName}) z mega rabatem!\n\nPrzyjmij wyzwanie i stwórzmy razem coś wyjątkowego! 🎉`;
}

/**
 * Generuje WhatsApp share link
 */
export function generateWhatsAppLink(shareUrl: string, shareText: string): string {
    const encodedText = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    return `https://wa.me/?text=${encodedText}`;
}

/**
 * Generuje Facebook Messenger share link
 */
export function generateMessengerLink(shareUrl: string): string {
    return `https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=${process.env.NEXT_PUBLIC_FB_APP_ID || ''}`;
}
