import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// Try specific keys first, then standard AWS SDK keys
const accessKeyId = (process.env.MY_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '').trim();
const secretAccessKey = (process.env.MY_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '').trim();

const s3Client = new S3Client({
    region: process.env.S3_REGION || 'eu-north-1',
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});

console.log("[S3 INIT]", {
    hasAccessKey: !!accessKeyId,
    accessKeyType: process.env.MY_AWS_ACCESS_KEY_ID ? 'MY_AWS' : (process.env.AWS_ACCESS_KEY_ID ? 'AWS' : 'NONE'),
    keyLength: accessKeyId.length,
    hasSecret: !!secretAccessKey,
    region: process.env.S3_REGION || 'default(eu-north-1)',
});

export async function uploadToS3(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    const bucketName = process.env.S3_BUCKET || 'wlasniewski-photo-storage';
    const region = process.env.S3_REGION || 'eu-north-1';

    try {
        // Helper to debug environment in logs
        const debugEnv = {
            MY_AWS_KEY: !!process.env.MY_AWS_ACCESS_KEY_ID,
            AWS_KEY: !!process.env.AWS_ACCESS_KEY_ID,
            BUCKET: !!bucketName,
            REGION: region,
        };
        console.log("[UPLOAD_START]", { fileName, fileSize: fileBuffer.length, mimeType, debugEnv });

        if (!bucketName) {
            const msg = "Missing S3_BUCKET environment variable";
            console.error("[S3_UPLOAD] ERROR:", msg);
            throw new Error(msg);
        }
        if (!accessKeyId || !secretAccessKey) {
            const msg = "Missing AWS Credentials. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in environment.";
            console.error("[S3_UPLOAD] ERROR:", msg, { 
                hasKey: !!accessKeyId, 
                hasSecret: !!secretAccessKey,
                checkedVars: ['MY_AWS_ACCESS_KEY_ID', 'AWS_ACCESS_KEY_ID']
            });
            throw new Error(msg);
        }

        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: bucketName,
                Key: fileName,
                Body: fileBuffer,
                ContentType: mimeType,
            },
        });

        console.log(`[S3_UPLOAD] Execution started for ${fileName}...`);
        await upload.done();
        console.log(`[S3_UPLOAD] Execution finished SUCCESSFULLY for ${fileName}`);

        // Return the public URL
        // Format: https://{bucket}.s3.{region}.amazonaws.com/{key}
        return `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
    } catch (error: any) {
        console.error('[S3_UPLOAD] CRITICAL ERROR:', {
            message: error.message,
            code: error.code,
            requestId: error.$metadata?.requestId,
            fileName,
            bucketName,
            region,
        });
        throw new Error(`S3 Upload failed: ${error.message}`);
    }
}

export async function deleteFromS3(fileUrl: string): Promise<void> {
    const bucketName = process.env.S3_BUCKET || 'wlasniewski-photo-storage';
    // const region = process.env.S3_REGION || 'eu-north-1'; 

    try {
        let key = fileUrl;
        if (fileUrl.startsWith('http')) {
            const urlParts = new URL(fileUrl);
            // pathname starts with /, so slice(1)
            key = urlParts.pathname.slice(1);
            key = decodeURIComponent(key);
        }

        console.log(`[S3 DELETE] Attempting to delete key: ${key}`);

        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
        });

        await s3Client.send(command);
        console.log(`[S3 DELETE] Successfully deleted key: ${key}`);

    } catch (error: any) {
        console.error('S3 Delete Error:', error);
        throw new Error(`Failed to delete from S3: ${error.message}`);
    }
}
