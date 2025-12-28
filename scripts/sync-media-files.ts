
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function syncMediaFiles() {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    if (!fs.existsSync(uploadsDir)) {
        console.error('Uploads directory not found!');
        return;
    }

    const files = fs.readdirSync(uploadsDir);
    console.log(`Found ${files.length} files in uploads directory.`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
        if (file === '.gitkeep') continue;

        // Check if exists in DB
        const existing = await prisma.mediaLibrary.findFirst({
            where: {
                file_name: file
            }
        });

        if (existing) {
            skippedCount++;
            continue;
        }

        // Get file stats
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        const ext = path.extname(file).toLowerCase();

        // Determine mime type
        let mimeType = 'application/octet-stream';
        if (['.jpg', '.jpeg'].includes(ext)) mimeType = 'image/jpeg';
        if (['.png'].includes(ext)) mimeType = 'image/png';
        if (['.webp'].includes(ext)) mimeType = 'image/webp';
        if (['.gif'].includes(ext)) mimeType = 'image/gif';
        if (['.mp4'].includes(ext)) mimeType = 'video/mp4';

        // Add to DB
        await prisma.mediaLibrary.create({
            data: {
                file_name: file,
                original_name: file,
                file_path: `/uploads/${file}`,
                file_size: stats.size,
                mime_type: mimeType,
                folder: 'Wykryte', // Special folder for recovered files
                alt_text: file,
            }
        });

        addedCount++;
        console.log(`Recovered: ${file}`);
    }

    console.log('Sync complete.');
    console.log(`Added: ${addedCount}`);
    console.log(`Skipped: ${skippedCount}`);
}

syncMediaFiles()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
