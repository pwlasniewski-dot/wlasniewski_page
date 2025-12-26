import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { v4 as uuidv4 } from 'uuid';
import { createPayUOrder } from '@/lib/payu';
import { sendEmail } from '@/lib/email/sender';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            inviter_name,
            inviter_phone,
            inviter_email,
            invitee_name,
            invitee_email,
            package_id,
            location_id,
            date,
            start_time,
            end_time,
            channel = 'email'
        } = body;

        // Validate required fields
        if (!inviter_name || !inviter_phone || !inviter_email || !invitee_name || !invitee_email || !package_id) {
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
                inviter_contact: inviter_phone,
                inviter_email,
                inviter_contact_type: 'phone',
                invitee_name,
                invitee_contact: invitee_email,
                invitee_contact_type: 'email',
                package_id: parseInt(package_id),
                location_id: location_id ? parseInt(location_id) : null,
                custom_location: body.custom_location || null,
                status: 'pending_payment',
                channel,
                session_date: date ? new Date(date) : null,
                discount_amount: 0,
                discount_percentage: 0,
                acceptance_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                paid_amount: pkg.challenge_price,
                payment_status: 'pending'
            } as any
        });

        // Create a temporary booking to block the calendar
        if (date) {
            await prisma.booking.create({
                data: {
                    service: 'Sesja',
                    package: pkg.name,
                    price: pkg.challenge_price,
                    date: new Date(date),
                    start_time: start_time || null,
                    end_time: end_time || null,
                    client_name: invitee_name,
                    email: invitee_email,
                    phone: inviter_phone, // Use inviter phone for contact
                    notes: `Wyzwanie od: ${inviter_name}. Lokalizacja: ${body.custom_location || 'Wybrana z listy'}. Status: Oczekiwanie na zapłatę.`,
                    challenge_id: challenge.id,
                    status: 'challenge_pending',
                }
            });
        }

        // Create PayU Order
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl';
        const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1';

        const orderRequest = {
            description: `Foto Wyzwanie - ${pkg.name}`,
            currencyCode: 'PLN',
            totalAmount: Math.round(pkg.challenge_price * 100), // Convert to grosze
            extOrderId: `CHALLENGE_${challenge.id}_${Date.now()}`,
            buyer: {
                email: inviter_email,
                firstName: inviter_name.split(' ')[0],
                lastName: inviter_name.split(' ').slice(1).join(' ') || 'N/A',
                language: 'pl',
            },
            products: [
                {
                    name: `Foto Wyzwanie - ${pkg.name}`,
                    unitPrice: Math.round(pkg.challenge_price * 100),
                    quantity: 1,
                }
            ],
            continueUrl: `${baseUrl}/foto-wyzwanie/success?id=${uniqueLink}`
        };

        const payuData = await createPayUOrder(orderRequest, clientIp);
        const paymentUrl = payuData.redirectUri || payuData.links?.find((l: any) => l.rel === 'redirect_uri')?.href;

        if (!paymentUrl) {
            throw new Error('Failed to create PayU payment URL');
        }

        // Update challenge with PayU order ID
        await prisma.photoChallenge.update({
            where: { id: challenge.id },
            data: {
                payment_id: payuData.orderId || payuData.orders?.[0]?.orderId || null,
                payment_method: 'payu'
            }
        });

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
