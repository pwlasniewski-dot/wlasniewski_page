import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key'
);

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
        .sign(JWT_SECRET);
}

export async function verifyUserToken(token: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const decoded = payload as any;

        if (decoded.role !== 'challenge_user') {
            return null;
        }

        // Verify user exists in DB
        const user = await prisma.challengeUser.findUnique({
            where: { id: decoded.userId },
        });

        if (!user) return null;

        return user;
    } catch (error) {
        return null;
    }
}
