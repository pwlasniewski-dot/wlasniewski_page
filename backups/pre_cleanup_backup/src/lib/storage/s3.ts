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
        };
        console.log("[UPLOAD_START]", { fileName, fileSize: fileBuffer.length, mimeType, debugEnv });

        if (!bucketName) throw new Error("Missing S3_BUCKET environment variable");
        if (!accessKeyId || !secretAccessKey) throw new Error("Missing AWS Credentials (checked MY_AWS_... and AWS_...)");

        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: bucketName,
                Key: fileName,
                Body: fileBuffer,
                ContentType: mimeType,
                // ACL: 'public-read', // Removed because bucket blocks ACLs (Bucket Owner Enforced)
                // Not needed if bucket policy allows public read, or if using CloudFront. 
                // However, for simple setups, standard private upload + bucket policy is best. 
                // Let's assume bucket policy handles public access for now as per "skalibruj politykę IAM" instruction.
            },
        });

        await upload.done();

        // Return the public URL
        // Format: https://{bucket}.s3.{region}.amazonaws.com/{key}
        return `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
    } catch (error: any) {
        console.error('S3 Upload Error:', error);
        throw new Error(`Failed to upload to S3: ${error.message}`);
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
