import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

// Manual env parsing
const envPath = path.resolve(process.cwd(), '.env.local');
let env = {};

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            let value = match[2].trim();
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            env[match[1].trim()] = value;
        }
    });
}

async function verifyS3() {
    console.log('Testing S3 Connection...');
    const bucket = env.S3_BUCKET || process.env.S3_BUCKET;
    const region = env.S3_REGION || process.env.S3_REGION;
    const accessKeyId = env.MY_AWS_ACCESS_KEY_ID || process.env.MY_AWS_ACCESS_KEY_ID;
    const secretAccessKey = env.MY_AWS_SECRET_ACCESS_KEY || process.env.MY_AWS_SECRET_ACCESS_KEY;

    console.log('Bucket:', bucket);
    console.log('Region:', region);

    if (!accessKeyId || !secretAccessKey) {
        console.error('ERROR: Missing AWS Credentials');
        return;
    }

    const client = new S3Client({
        region: region,
        credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
        },
    });

    const key = `test-connection-${Date.now()}.txt`;
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: 'Connection verification successful!',
        ContentType: 'text/plain',
    });

    try {
        await client.send(command);
        console.log('SUCCESS: File uploaded to S3.');
        console.log(`URL: https://${bucket}.s3.${region}.amazonaws.com/${key}`);
    } catch (error) {
        console.error('FAILURE: S3 Upload Error:', error);
    }
}

verifyS3();
