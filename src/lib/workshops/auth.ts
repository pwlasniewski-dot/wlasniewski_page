/**
 * Pomocnicze funkcje dla systemu warsztatów (uczestnicy bez maila — RODO).
 */
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const SALT_ROUNDS = 8; // PIN jest krótki — niższy koszt jest OK i szybciej dla bulk-create

function getSecret(): Uint8Array {
    const s = process.env.JWT_SECRET;
    if (!s || s.length < 32) throw new Error('[SECURITY] JWT_SECRET missing.');
    return new TextEncoder().encode(s);
}

/** Generuje 6-cyfrowy PIN bez wiodących zer (ułatwia odczyt z karty). */
export function generatePin(length: number = 6): string {
    let pin = '';
    pin += String(Math.floor(Math.random() * 9) + 1); // pierwsza cyfra 1-9
    for (let i = 1; i < length; i++) pin += String(Math.floor(Math.random() * 10));
    return pin;
}

export async function hashPin(pin: string): Promise<string> {
    return bcrypt.hash(pin, SALT_ROUNDS);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
    return bcrypt.compare(pin, hash);
}

/** Zestaw emoji-awatarów dla nastolatków (workshop participants 13–18). */
export const KIDS_AVATARS = [
    '📸', '🎞️', '🎬', '🎥', '🖤', '🤍', '⚡', '🔥',
    '🌙', '☀️', '⭐', '✨', '🌈', '🎧', '🎸', '🎹',
    '🛹', '🏀', '⚽', '🎮', '🕹️', '🎯', '🚀', '🛰️',
    '🌊', '🏔️', '🌋', '🌵', '🍕', '🍔', '🧋', '☕',
];

export function pickRandomAvatar(seed?: number): string {
    if (typeof seed === 'number') return KIDS_AVATARS[seed % KIDS_AVATARS.length];
    return KIDS_AVATARS[Math.floor(Math.random() * KIDS_AVATARS.length)];
}

/** Slug-safe login: "Wieldzadz01". */
export function buildLogin(workshopSlug: string, index: number): string {
    const capitalizedSlug = workshopSlug.charAt(0).toUpperCase() + workshopSlug.slice(1);
    return `${capitalizedSlug}${String(index).padStart(2, '0')}`;
}

/** Tworzy JWT dla uczestnika warsztatu. Krótki czas życia (ważne tylko w trakcie warsztatu). */
export async function generateParticipantToken(payload: {
    pid: number;
    wid: number;
    login: string;
}, ttl: string = '14d'): Promise<string> {
    return new SignJWT({ ...payload, type: 'workshop_participant' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(ttl)
        .sign(getSecret());
}

export async function verifyParticipantToken(token: string): Promise<{
    pid: number;
    wid: number;
    login: string;
    type: string;
} | null> {
    try {
        const { payload } = await jwtVerify(token, getSecret());
        if ((payload as any).type !== 'workshop_participant') return null;
        return payload as any;
    } catch {
        return null;
    }
}
