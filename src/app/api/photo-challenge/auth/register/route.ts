// API Route: POST /api/photo-challenge/auth/register
// Rejestracja nowego użytkownika wyzwania

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword, createUserToken } from '@/lib/photo-challenge/auth';
import type { ChallengeUserRegisterRequest, ChallengeAuthResponse } from '@/types/photo-challenge';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const body: ChallengeUserRegisterRequest = await request.json();

        // Walidacja
        if (!body.email || !body.password || !body.name) {
            return NextResponse.json(
                { success: false, error: 'Brakujące wymagane pola' },
                { status: 400 }
            );
        }

        // Sprawdź czy email już istnieje
        const existingUser = await prisma.challengeUser.findUnique({
            where: { email: body.email },
        });

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Ten adres email jest już zarejestrowany' },
                { status: 400 }
            );
        }

        // Hash hasła
        const passwordHash = await hashPassword(body.password);

        // Utwórz użytkownika
        const user = await prisma.challengeUser.create({
            data: {
                email: body.email,
                password_hash: passwordHash,
                name: body.name,
                phone: body.phone || null,
                auth_provider: 'email',
                last_login: new Date(),
            },
        });

        // Utwórz token
        const token = await createUserToken(user.id, user.email);

        const response: ChallengeAuthResponse = {
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name || '',
            },
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        console.error('Error registering user:', error);
        return NextResponse.json(
            { success: false, error: 'Nie udało się zarejestrować użytkownika' },
            { status: 500 }
        );
    }
}
