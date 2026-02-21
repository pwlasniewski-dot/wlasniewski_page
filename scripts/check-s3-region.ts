import { S3Client, GetBucketLocationCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function checkS3() {
    const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || '').trim();
    const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || '').trim();
    const bucketName = process.env.S3_BUCKET || 'wlasniewski-photo-storage';

    console.log('--- DEBUG S3 ---');
    console.log('Bucket:', bucketName);
    console.log('Access Key ID:', accessKeyId ? `${accessKeyId.substring(0, 5)}...` : 'MISSING');

    const s3 = new S3Client({
        region: 'us-east-1', // Default to us-east-1 to query location
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });

    try {
        const command = new GetBucketLocationCommand({ Bucket: bucketName });
        const data = await s3.send(command);
        console.log('Location Constraint:', data.LocationConstraint || 'us-east-1');
    } catch (err: any) {
        console.error('Error getting bucket location:', err.message);

        // Try another way if it fails
        try {
            console.log('Trying alternative check...');
            const res = await fetch(`https://${bucketName}.s3.amazonaws.com`);
            console.log('Headers from direct hit:', Object.fromEntries(res.headers.entries()));
        } catch (e: any) {
            console.error('Alt check failed:', e.message);
        }
    }
}

checkS3();
