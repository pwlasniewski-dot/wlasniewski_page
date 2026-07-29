import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';
import bcrypt from 'bcryptjs';
import { grantNewsletterConsent, withdrawNewsletterConsent } from '@/lib/newsletter';

export async function PUT(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = extractToken(authHeader);

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await req.json();
        const { name, email, phone, currentPassword, newPassword, marketingConsent } = body;
        if (marketingConsent !== undefined && typeof marketingConsent !== 'boolean') {
            return NextResponse.json({ error: 'Nieprawidłowa wartość zgody marketingowej' }, { status: 400 });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (typeof marketingConsent === 'boolean') {
            updateData.marketing_consent_at = marketingConsent ? (user?.marketing_consent_at || new Date()) : null;
        }

        // If email is changing, check if unique
        if (email && email !== user.email) {
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                return NextResponse.json({ error: 'Email jest już zajęty' }, { status: 400 });
            }
            updateData.email = email;
        }

        // If password is changing
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: 'Aktualne hasło jest wymagane do zmiany' }, { status: 400 });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isMatch) {
                return NextResponse.json({ error: 'Aktualne hasło jest nieprawidłowe' }, { status: 400 });
            }

            // Server-side validation for new password
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?\":{}|<>]).{8,}$/;
            if (!passwordRegex.test(newPassword)) {
                return NextResponse.json({ error: 'Nowe hasło nie spełnia wymogów bezpieczeństwa' }, { status: 400 });
            }

            updateData.password_hash = await bcrypt.hash(newPassword, 10);
        }

        const updatedUser = await prisma.$transaction(async (tx) => {
            const updated = await tx.user.update({
                where: { id: user.id },
                data: updateData
            });

            if (updateData.email) {
                console.log(`[User Update] Email changing to ${updateData.email}. Syncing related records...`);

                // Update Offers
                await tx.offer.updateMany({
                    where: { client_id: user.id },
                    data: { client_email: updateData.email }
                });

                // Update Galleries
                await tx.clientGallery.updateMany({
                    where: { client_id: user.id },
                    data: { client_email: updateData.email }
                });
            }

            const finalEmail = updateData.email || user.email;
            const shouldSubscribe = typeof marketingConsent === 'boolean'
                ? marketingConsent
                : Boolean(user.marketing_consent_at);

            if (updateData.email && updateData.email !== user.email) {
                await withdrawNewsletterConsent(tx, { email: user.email });
            }
            if (shouldSubscribe) {
                await grantNewsletterConsent(tx, {
                    email: finalEmail,
                    source: 'account-settings',
                    request: req,
                });
            } else if (typeof marketingConsent === 'boolean') {
                await withdrawNewsletterConsent(tx, { email: finalEmail });
            }

            return updated;
        });

        return NextResponse.json({
            success: true,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                phone: updatedUser.phone,
                marketing_consent_at: updatedUser.marketing_consent_at,
                newsletter_active: marketingConsent === true
            }
        });

    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
