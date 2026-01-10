import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import bcrypt from 'bcryptjs';

// POST: Toggle Block Status, Commission, Reset Password
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    return withAuth(request, async (req) => {
        try {
            const id = parseInt(params.id);
            if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

            const { action, value } = await req.json();

            if (action === 'TOGGLE_STATUS') {
                const user = await prisma.user.update({
                    where: { id },
                    data: { is_active: value } // true/false
                });
                return NextResponse.json({ success: true, is_active: user.is_active });
            }

            if (action === 'RESET_PASSWORD') {
                // Generate random 8-char password
                const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-2);
                const hashedPassword = await bcrypt.hash(newPassword, 10);

                await prisma.user.update({
                    where: { id },
                    data: { password_hash: hashedPassword }
                });

                return NextResponse.json({ success: true, new_password: newPassword });
            }

            if (action === 'UPDATE_COMMISSION') {
                const user = await prisma.user.findUnique({ where: { id }, include: { photographer_profile: true } });
                if (!user || !user.photographer_profile) {
                    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
                }

                const updatedProfile = await prisma.photographerProfile.update({
                    where: { id: user.photographer_profile.id },
                    data: { base_commission: parseInt(value) }
                });

                return NextResponse.json({ success: true, commission: updatedProfile.base_commission });
            }

            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

        } catch (error) {
            console.error('Provider manage error:', error);
            return NextResponse.json({ error: 'Server error' }, { status: 500 });
        }
    });
}
