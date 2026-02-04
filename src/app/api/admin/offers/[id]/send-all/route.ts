import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// POST /api/admin/offers/[id]/send-all - Combo: S3 + Drive + Email
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req) => {
        try {
            const params = await context.params;
            const { id } = params;
            const token = req.headers.get('authorization');

            // Call all 3 endpoints
            const [s3Res, driveRes, emailRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/offers/${id}/save-s3`, {
                    method: 'POST',
                    headers: { 'Authorization': token || '' }
                }),
                fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/offers/${id}/save-drive`, {
                    method: 'POST',
                    headers: { 'Authorization': token || '' }
                }),
                fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/offers/${id}/send-email`, {
                    method: 'POST',
                    headers: { 'Authorization': token || '' }
                })
            ]);

            const results = {
                s3: s3Res.ok,
                drive: driveRes.ok,
                email: emailRes.ok
            };

            return NextResponse.json({ success: true, results });
        } catch (error) {
            console.error('Error in send-all:', error);
            return NextResponse.json({ error: 'Failed to complete all actions' }, { status: 500 });
        }
    });
}
