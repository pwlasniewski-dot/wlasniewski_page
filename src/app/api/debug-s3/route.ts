import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const myKey = process.env.MY_AWS_ACCESS_KEY_ID;
    const awsKey = process.env.AWS_ACCESS_KEY_ID;
    const secret = process.env.MY_AWS_SECRET_ACCESS_KEY;
    const region = process.env.S3_REGION;
    const bucket = process.env.S3_BUCKET;

    return NextResponse.json({
        debug_timestamp: new Date().toISOString(),
        env_check: {
            has_MY_AWS_ACCESS_KEY_ID: !!myKey,
            has_AWS_ACCESS_KEY_ID: !!awsKey,
            has_SECRET: !!secret,
            REGION: region || 'MISSING',
            BUCKET: bucket || 'MISSING'
        },
        node_env: process.env.NODE_ENV
    });
}
