
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function walk(dir: string, fileList: string[] = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const stat = fs.statSync(path.join(dir, file));
        if (stat.isDirectory()) {
            fileList = await walk(path.join(dir, file), fileList);
        } else {
            fileList.push(path.join(dir, file));
        }
    }
    return fileList;
}

async function syncRecursive() {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    if (!fs.existsSync(uploadsDir)) {
        console.error('Uploads directory not found!');
        return;
    }

    console.log('Scanning files recursively...');
    const allFiles = await walk(uploadsDir);
    console.log(`Found ${allFiles.length} total files.`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const filePath of allFiles) {
        const relativePath = path.relative(uploadsDir, filePath);
        const fileName = path.basename(filePath);

        // Skip if system file
        if (fileName === '.gitkeep' || fileName === 'thumbs.db' || fileName === '.DS_Store') continue;

        // Determine folder name from parent directory
        const parentDir = path.dirname(relativePath);
        const folderName = parentDir === '.' ? 'Wykryte' : parentDir.replace(/\\/g, '/');

        // Check if exists in DB (by filename OR by full path if possible, but schema usually relies on ID/path)
        // We check by file_name because typically filenames are unique timestamps. 
        // If not unique, we might have issues, but let's assume they are keys.
        const existing = await prisma.mediaLibrary.findFirst({
            where: {
                file_name: fileName
            }
        });

        if (existing) {
            // Optional: Update folder if it was set to 'Wykryte' but we found a better one
            if (existing.folder === 'Wykryte' && folderName !== 'Wykryte') {
                await prisma.mediaLibrary.update({
                    where: { id: existing.id },
                    data: { folder: folderName }
                });
                console.log(`Updated folder for: ${fileName} -> ${folderName}`);
            }
            skippedCount++;
            continue;
        }

        const stats = fs.statSync(filePath);
        const ext = path.extname(fileName).toLowerCase();

        let mimeType = 'application/octet-stream';
        if (['.jpg', '.jpeg'].includes(ext)) mimeType = 'image/jpeg';
        if (['.png'].includes(ext)) mimeType = 'image/png';
        if (['.webp'].includes(ext)) mimeType = 'image/webp';
        if (['.gif'].includes(ext)) mimeType = 'image/gif';
        if (['.mp4'].includes(ext)) mimeType = 'video/mp4';

        // Normalize file_path for DB (ensure forward slashes)
        // The previous script used absolute path? No, `/uploads/${file}`
        // If deep: `/uploads/${relativePath}`
        const dbFilePath = `/uploads/${relativePath.replace(/\\/g, '/')}`;

        await prisma.mediaLibrary.create({
            data: {
                file_name: fileName,
                original_name: fileName,
                file_path: dbFilePath,
                file_size: stats.size,
                mime_type: mimeType,
                folder: folderName,
                alt_text: fileName,
            }
        });

        addedCount++;
        console.log(`Recovered: ${relativePath} (Folder: ${folderName})`);
    }

    console.log('Recursive sync complete.');
    console.log(`Added: ${addedCount}`);
    console.log(`Skipped/Updated: ${skippedCount}`);
}

syncRecursive()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
