import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy for S3 files to avoid CORS issues with model-viewer, video players, etc.
 * Usage: /api/media/proxy?url=https://bucket.s3.region.amazonaws.com/file.glb
 */
export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Only allow proxying from our S3 bucket
    const allowedHosts = [
        'wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com',
        'wlasniewski-photo-storage.s3.amazonaws.com',
    ];
    
    try {
        const parsedUrl = new URL(url);
        if (!allowedHosts.some(h => parsedUrl.hostname === h)) {
            return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
        }
    } catch {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    try {
        const s3Response = await fetch(url);
        
        if (!s3Response.ok) {
            return NextResponse.json(
                { error: `S3 returned ${s3Response.status}` },
                { status: s3Response.status }
            );
        }

        const buffer = await s3Response.arrayBuffer();
        const contentType = s3Response.headers.get('content-type') || 'application/octet-stream';

        // Detect GLB by extension if content-type is generic
        let resolvedType = contentType;
        if (contentType === 'application/octet-stream' || contentType === 'binary/octet-stream') {
            if (url.endsWith('.glb')) resolvedType = 'model/gltf-binary';
            else if (url.endsWith('.gltf')) resolvedType = 'model/gltf+json';
        }

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': resolvedType,
                'Content-Length': buffer.byteLength.toString(),
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
            },
        });
    } catch (error: any) {
        console.error('[MEDIA PROXY] Error:', error.message);
        return NextResponse.json(
            { error: 'Failed to fetch from S3', details: error.message },
            { status: 502 }
        );
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Max-Age': '86400',
        },
    });
}
