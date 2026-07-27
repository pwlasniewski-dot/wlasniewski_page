import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const bucket = process.env.S3_BUCKET;
    const region = process.env.S3_REGION;
    const accessKey = process.env.AWS_ACCESS_KEY_ID;
    const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
    const myAccessKey = process.env.MY_AWS_ACCESS_KEY_ID;

    return NextResponse.json({
        S3_BUCKET: bucket || 'MISSING',
        S3_REGION: region || 'MISSING',
        AWS_ACCESS_KEY_ID: accessKey ? 'PRESENT' : 'MISSING',
        AWS_SECRET_ACCESS_KEY: secretKey ? 'PRESENT' : 'MISSING',
        MY_AWS_ACCESS_KEY_ID: myAccessKey ? 'PRESENT' : 'MISSING',
        ENV_LOADED: !!process.env.DATABASE_URL
    });
}
