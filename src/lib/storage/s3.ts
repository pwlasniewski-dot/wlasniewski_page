import { S3Client, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Readable } from 'stream';

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

export async function uploadToS3(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    options: { access?: 'public' | 'private' } = {},
): Promise<string> {
    const bucketName = process.env.S3_BUCKET || 'wlasniewski-photo-storage';
    const region = process.env.S3_REGION || 'eu-north-1';

    try {
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
                ...(options.access === 'private' ? {} : { ACL: 'public-read' as const }),
            },
        });

        console.log(`[S3_UPLOAD] Execution started for ${fileName}...`);
        await upload.done();
        console.log(`[S3_UPLOAD] Execution finished SUCCESSFULLY for ${fileName}`);

        // Private documents are persisted as opaque object keys. Callers must
        // authenticate and mint a short-lived download URL; a stable S3 URL is
        // never returned for private content.
        if (options.access === 'private') return fileName;

        // Public media keeps the legacy URL contract.
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

export function ownedS3Key(value: string): string {
    const bucketName = process.env.S3_BUCKET || 'wlasniewski-photo-storage';
    const region = process.env.S3_REGION || 'eu-north-1';
    if (!value.startsWith('http')) return value.replace(/^\//, '');
    const url = new URL(value);
    const expectedHost = `${bucketName}.s3.${region}.amazonaws.com`;
    if (url.protocol !== 'https:' || url.hostname !== expectedHost || url.username || url.password || url.port) {
        throw new Error('Gallery source is outside the configured private S3 bucket');
    }
    return decodeURIComponent(url.pathname.replace(/^\//, ''));
}

export async function getPrivateS3Object(value: string) {
    const bucketName = process.env.S3_BUCKET || 'wlasniewski-photo-storage';
    const key = ownedS3Key(value);
    const result = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
    if (!result.Body) throw new Error('S3 object has no body');
    return {
        body: result.Body,
        contentType: (result.ContentType || '').toLowerCase(),
        contentLength: result.ContentLength || null,
        key,
    };
}

/**
 * Strumieniowy upload na S3 (dla dużych plików budowanych w locie, np. ZIP galerii).
 * Nie trzyma całości w pamięci — czyta ze strumienia i wysyła multipartem.
 * Zwraca krótko ważny podpisany URL prywatnego obiektu.
 */
export async function uploadStreamToS3(
    stream: Readable,
    fileName: string,
    mimeType: string,
    contentDisposition?: string,
): Promise<string> {
    const bucketName = process.env.S3_BUCKET || 'wlasniewski-photo-storage';

    if (!accessKeyId || !secretAccessKey) {
        throw new Error('Missing AWS Credentials. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in environment.');
    }

    const upload = new Upload({
        client: s3Client,
        params: {
            Bucket: bucketName,
            Key: fileName,
            Body: stream,
            ContentType: mimeType,
            ...(contentDisposition ? { ContentDisposition: contentDisposition } : {}),
        },
        // Trzymaj pamięć w ryzach: 5MB części, max 4 równolegle
        partSize: 5 * 1024 * 1024,
        queueSize: 4,
    });

    await upload.done();

    return getSignedUrl(
        s3Client,
        new GetObjectCommand({ Bucket: bucketName, Key: fileName }),
        { expiresIn: 15 * 60 },
    );
}

/** Upload a private stream and return its stable object key (never a public URL). */
export async function uploadPrivateStreamToS3(
    stream: Readable,
    fileName: string,
    mimeType: string,
    contentDisposition?: string,
): Promise<string> {
    const bucketName = process.env.S3_BUCKET || 'wlasniewski-photo-storage';
    if (!accessKeyId || !secretAccessKey) {
        throw new Error('Missing AWS credentials');
    }
    const upload = new Upload({
        client: s3Client,
        params: {
            Bucket: bucketName,
            Key: fileName,
            Body: stream,
            ContentType: mimeType,
            ...(contentDisposition ? { ContentDisposition: contentDisposition } : {}),
        },
        partSize: 5 * 1024 * 1024,
        queueSize: 2,
        leavePartsOnError: false,
    });
    await upload.done();
    return fileName;
}

export async function getPrivateS3DownloadUrl(fileName: string, expiresIn = 15 * 60): Promise<string> {
    const bucketName = process.env.S3_BUCKET || 'wlasniewski-photo-storage';
    return getSignedUrl(
        s3Client,
        new GetObjectCommand({ Bucket: bucketName, Key: ownedS3Key(fileName) }),
        { expiresIn },
    );
}

export async function putPrivateJson(fileName: string, value: unknown): Promise<void> {
    const bucketName = process.env.S3_BUCKET || 'wlasniewski-photo-storage';
    await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: ownedS3Key(fileName),
        Body: JSON.stringify(value),
        ContentType: 'application/json',
        CacheControl: 'no-store',
    }));
}

/** S3 conditional create is the distributed, cross-instance worker lock. */
export async function createPrivateJsonIfAbsent(fileName: string, value: unknown): Promise<boolean> {
    const bucketName = process.env.S3_BUCKET || 'wlasniewski-photo-storage';
    try {
        await s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: ownedS3Key(fileName),
            Body: JSON.stringify(value),
            ContentType: 'application/json',
            CacheControl: 'no-store',
            IfNoneMatch: '*',
        }));
        return true;
    } catch (error: any) {
        const status = error?.$metadata?.httpStatusCode;
        if (status === 409 || status === 412 || error?.name === 'PreconditionFailed') return false;
        throw error;
    }
}

export async function getPrivateJson<T>(fileName: string): Promise<T | null> {
    try {
        const object = await getPrivateS3Object(fileName);
        const text = await object.body.transformToString('utf-8');
        return JSON.parse(text) as T;
    } catch (error: any) {
        const status = error?.$metadata?.httpStatusCode;
        if (status === 404 || error?.name === 'NoSuchKey') return null;
        throw error;
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
