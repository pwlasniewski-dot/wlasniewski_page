import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { requireAuth } from '@/lib/auth/middleware';

const MAX_IMAGE_SIZE = 25 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
};

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ challenge_id: string }> }
) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const { challenge_id } = await params;
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const caption = (formData.get('caption') as string) || '';

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
        }

        // Validate image file
        const extension = IMAGE_EXTENSIONS[file.type];
        if (!extension) {
            return NextResponse.json({ success: false, error: 'Invalid file type' }, { status: 400 });
        }
        if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
            return NextResponse.json({ success: false, error: 'File is empty or exceeds 25 MB' }, { status: 400 });
        }

        // Get or create gallery
        let gallery = await prisma.challengeGallery.findFirst({
            where: { challenge_id: parseInt(challenge_id) }
        });

        if (!gallery) {
            gallery = await prisma.challengeGallery.create({
                data: {
                    challenge_id: parseInt(challenge_id),
                    title: 'Galeria',
                    is_published: false
                }
            });
        }

        // Save file to public/uploads/galleries
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'galleries', challenge_id);
        
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        const bytes = await file.arrayBuffer();
        const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
        const filepath = join(uploadsDir, filename);
        const publicUrl = `/uploads/galleries/${challenge_id}/${filename}`;

        await writeFile(filepath, Buffer.from(bytes));

        // Create media library record
        const media = await prisma.mediaLibrary.create({
            data: {
                file_name: filename,
                original_name: file.name,
                file_path: filepath,
                file_size: BigInt(Buffer.from(bytes).length),
                mime_type: file.type,
                folder: 'challenge-galleries',
                category: 'photo-challenge',
                alt_text: caption || file.name
            }
        });

        // Create photo record
        const photo = await prisma.challengePhoto.create({
            data: {
                gallery_id: gallery.id,
                media_id: media.id,
                caption
            }
        });

        return NextResponse.json({
            success: true,
            photo: {
                id: photo.id,
                url: publicUrl,
                caption: photo.caption
            }
        });
    } catch (error) {
        console.error('Photo upload error:', error);
        return NextResponse.json(
            { success: false, error: 'Upload failed' },
            { status: 500 }
        );
    }
}
