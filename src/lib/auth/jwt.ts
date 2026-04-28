
// Auth utilities - JWT and bcrypt helpers
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

// SECURITY: JWT_SECRET MUST be set via environment variable. No fallback — refuse to operate without it.
// Lazy validation: check at first USE (not at module load) so Next.js page-data collection at build time
// doesn't crash when an env var happens to be unset on the build machine.
function getSecret(): Uint8Array {
    const s = process.env.JWT_SECRET;
    if (!s || s.length < 32) {
        throw new Error(
            '[SECURITY] JWT_SECRET environment variable is missing or too short (min 32 chars). ' +
            'Set it in your environment (Netlify / .env.local) before starting the server.'
        );
    }
    return new TextEncoder().encode(s);
}

const SALT_ROUNDS = 10;

// Hash password
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// Generate JWT token
export async function generateToken(payload: { id: number; email: string; role?: string; type?: string }): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(getSecret());
}

// Verify JWT token
export async function verifyToken(token: string): Promise<{ id: number; email: string } | null> {
    try {
        const { payload } = await jwtVerify(token, getSecret());
        return payload as unknown as { id: number; email: string };
    } catch (error) {
        console.error('JWT Verification failed:', error);
        return null;
    }
}

// Extract token from Authorization header
export function extractToken(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}
