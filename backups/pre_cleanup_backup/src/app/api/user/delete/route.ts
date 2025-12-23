import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken } from '@/lib/auth/jwt';

export async function DELETE(req: Request) {
    try {
        const token = req.headers.get('Authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || !decoded.id) {
            return NextResponse.json({ error: 'Nieprawidłowy token' }, { status: 401 });
        }

        const userId = decoded.id;

        // Check for active challenges where they are invitee
        // Note: Inviter logic currently stores inviter data as strings, so we only track invitee via ID currently.
        const challenges = await prisma.photoChallenge.findMany({
            where: {
                invitee_user_id: userId
            }
        });

        if (challenges.length > 0) {
            // Option 1: Prevent deletion or cascading logic
            // For now, allow deletion, but maybe unlink the user from the challenge?
            // Or if we delete user, the relation might be set to null if optional?
            // Schema: invitee_user ChallengeUser? @relation...
            // It is optional, so it might just set to null or do nothing.
            // Ideally we should probably warn them, but for "Delete Account" usually we just proceed.
        }

        await prisma.challengeUser.delete({
            where: { id: userId }
        });

        return NextResponse.json({ success: true, message: 'Konto zostało usunięte.' });

    } catch (error) {
        console.error('Delete account error:', error);
        return NextResponse.json({ error: 'Wystąpił błąd podczas usuwania konta' }, { status: 500 });
    }
}
