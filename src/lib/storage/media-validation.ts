import { randomUUID } from 'crypto';

export const MAX_DIRECT_UPLOAD_BYTES = 200 * 1024 * 1024;
export const MAX_SERVER_UPLOAD_BYTES = 50 * 1024 * 1024;

const MIME_EXTENSIONS: Record<string, readonly string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'image/avif': ['avif'],
    'image/gif': ['gif'],
    'video/mp4': ['mp4'],
    'video/webm': ['webm'],
    'video/quicktime': ['mov'],
    'application/pdf': ['pdf'],
    'model/gltf-binary': ['glb'],
    'model/gltf+json': ['gltf'],
    'model/obj': ['obj'],
    'model/stl': ['stl'],
    'application/octet-stream': ['fbx'],
};

function extensionOf(fileName: string): string {
    const lastSegment = fileName.split(/[\\/]/).pop() || '';
    const extension = lastSegment.includes('.') ? lastSegment.split('.').pop() : '';
    return (extension || '').toLowerCase();
}

export function isAllowedMedia(fileName: string, mimeType: string): boolean {
    const normalizedMime = mimeType.trim().toLowerCase();
    const allowedExtensions = MIME_EXTENSIONS[normalizedMime];
    return Boolean(allowedExtensions?.includes(extensionOf(fileName)));
}

export function createMediaKey(fileName: string): string {
    const extension = extensionOf(fileName);
    return `${Date.now()}-${randomUUID()}.${extension}`;
}

export function validateMediaKey(key: string): boolean {
    return /^\d{13}-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[a-z0-9]+$/i.test(key);
}

export function normalizeMediaFolder(value: unknown): string | null {
    if (typeof value !== 'string') return 'uploads';
    const folder = value.trim() || 'uploads';
    if (
        folder.length > 80
        || /[\u0000-\u001f\u007f]/.test(folder)
        || folder.includes('..')
        || folder.includes('/')
        || folder.includes('\\')
    ) {
        return null;
    }
    return folder;
}

export function expectedPublicMediaUrl(key: string): string {
    const bucketName = process.env.S3_BUCKET || 'wlasniewski-photo-storage';
    const region = process.env.S3_REGION || 'eu-north-1';
    return `https://${bucketName}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;
}
