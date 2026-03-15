/**
 * One-time script to set CORS on S3 bucket for model-viewer (.glb)
 * Run: npx tsx scripts/setup-s3-cors.ts
 */
import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
dotenv.config();

const s3 = new S3Client({
    region: process.env.S3_REGION || 'eu-north-1',
    credentials: {
        accessKeyId: (process.env.MY_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '').trim(),
        secretAccessKey: (process.env.MY_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '').trim(),
    },
});

const bucket = process.env.S3_BUCKET || 'wlasniewski-photo-storage';

async function main() {
    console.log(`Setting CORS on bucket: ${bucket}`);
    
    await s3.send(new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: {
            CORSRules: [
                {
                    AllowedOrigins: ['*'],
                    AllowedMethods: ['GET', 'PUT', 'POST', 'HEAD'],
                    AllowedHeaders: ['*'],
                    ExposeHeaders: ['ETag', 'Content-Length', 'Content-Type'],
                    MaxAgeSeconds: 86400,
                },
            ],
        },
    }));
    
    console.log('✅ CORS configured successfully!');
    console.log('Allowed: GET/PUT/POST/HEAD from any origin');
}

main().catch(e => { console.error('❌ Failed:', e.message); process.exit(1); });
