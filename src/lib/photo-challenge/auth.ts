import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import prisma from '@/lib/db/prisma';

// SECURITY: lazy JWT_SECRET load — no module-time throw to keep build's page-data collection alive.
function getSecret(): Uint8Array {
    if (!process.env.JWT_SECRET) {
        throw new Error('[SECURITY] JWT_SECRET env var is required.');
    }
    return new TextEncoder().encode(process.env.JWT_SECRET);
}

export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export async function createUserToken(userId: number, email: string): Promise<string> {
    return new SignJWT({ userId, email, role: 'challenge_user' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(getSecret());
}

export async function verifyUserToken(token: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(token, getSecret());
        const decoded = payload as any;

        if (decoded.role !== 'challenge_user') {
            return null;
        }

        // Verify user exists in DB
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user) return null;

        return user;
    } catch (error) {
        return null;
    }
}
