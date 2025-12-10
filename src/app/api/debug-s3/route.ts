import { NextResponse } from 'next/server';

export async function GET() {
    const myKey = process.env.MY_AWS_ACCESS_KEY_ID;
    const awsKey = process.env.AWS_ACCESS_KEY_ID;
    const secret = process.env.MY_AWS_SECRET_ACCESS_KEY;
    const region = process.env.S3_REGION;
    const bucket = process.env.S3_BUCKET;

    return NextResponse.json({
        debug_timestamp: new Date().toISOString(),
        env_check: {
            has_MY_AWS_ACCESS_KEY_ID: !!myKey,
            MY_AWS_ACCESS_KEY_Length: myKey?.length || 0,
            MY_AWS_ACCESS_KEY_Start: myKey ? myKey.substring(0, 5) + '...' : 'NONE',

            has_AWS_ACCESS_KEY_ID: !!awsKey,
            AWS_ACCESS_KEY_Start: awsKey ? awsKey.substring(0, 5) + '...' : 'NONE',

            has_SECRET: !!secret,
            SECRET_Length: secret?.length || 0,

            REGION: region || 'MISSING',
            BUCKET: bucket || 'MISSING'
        },
        node_env: process.env.NODE_ENV
    });
}
