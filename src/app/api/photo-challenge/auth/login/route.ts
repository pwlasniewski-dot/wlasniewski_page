// API Route: POST /api/photo-challenge/auth/login
// Logowanie użytkownika wyzwania

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyPassword, createUserToken } from '@/lib/photo-challenge/auth';
import type { ChallengeUserLoginRequest, ChallengeAuthResponse } from '@/types/photo-challenge';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const body: ChallengeUserLoginRequest = await request.json();

        // Walidacja
        if (!body.email || !body.password) {
            return NextResponse.json(
                { success: false, error: 'Brakujące wymagane pola' },
                { status: 400 }
            );
        }

        // Znajdź użytkownika
        const user = await prisma.challengeUser.findUnique({
            where: { email: body.email },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Nieprawidłowy email lub hasło' },
                { status: 401 }
            );
        }

        // Sprawdź hasło
        if (!user.password_hash) {
            return NextResponse.json(
                { success: false, error: 'To konto korzysta z logowania społecznościowego' },
                { status: 401 }
            );
        }

        const passwordValid = await verifyPassword(body.password, user.password_hash);

        if (!passwordValid) {
            return NextResponse.json(
                { success: false, error: 'Nieprawidłowy email lub hasło' },
                { status: 401 }
            );
        }

        // Utwórz token
        const token = await createUserToken(user.id, user.email);

        // Aktualizuj last_login
        await prisma.challengeUser.update({
            where: { id: user.id },
            data: { last_login: new Date() },
        });

        const response: ChallengeAuthResponse = {
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name || '',
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error logging in:', error);
        return NextResponse.json(
            { success: false, error: 'Nie udało się zalogować' },
            { status: 500 }
        );
    }
}
