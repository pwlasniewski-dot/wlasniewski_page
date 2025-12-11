import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            inviter_name,
            invitee_name,
            invitee_email,
            package_id,
            location_id,
            channel = 'email'
        } = body;

        // Validate required fields
        if (!inviter_name || !invitee_name || !invitee_email || !package_id) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get package details (for price)
        const pkg = await prisma.challengePackage.findUnique({
            where: { id: parseInt(package_id) }
        });

        if (!pkg) {
            return NextResponse.json(
                { success: false, error: 'Package not found' },
                { status: 404 }
            );
        }

        // Create PhotoChallenge record
        const uniqueLink = uuidv4();
        const challenge = await prisma.photoChallenge.create({
            data: {
                unique_link: uniqueLink,
                inviter_name,
                inviter_contact: '', // Will be set from session/auth later
                inviter_contact_type: 'email',
                invitee_name,
                invitee_contact: invitee_email,
                invitee_contact_type: 'email',
                package_id: parseInt(package_id),
                location_id: location_id ? parseInt(location_id) : null,
                status: 'pending_payment', // Not sent yet, waiting for payment
                channel,
                discount_amount: 0, // Default: no discount
                discount_percentage: 0,
                acceptance_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            }
        });

        // Create P24 payment URL
        // For now, we'll return a mock payment URL
        // In production, integrate with Przelewy24 API
        const paymentUrl = `/api/photo-challenge/payment/${challenge.id}?amount=${pkg.challenge_price}`;

        return NextResponse.json({
            success: true,
            challenge_id: challenge.id,
            unique_link: uniqueLink,
            paymentUrl
        });
    } catch (error) {
        console.error('Error creating challenge:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
