
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

const prisma = new PrismaClient();

async function downloadMedia() {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    console.log('--- Rozpoczynam pobieranie mediów z S3 na locala ---');

    // Check connection first
    try {
        await prisma.$connect();
        console.log('✅ Połączono z bazą danych.');
    } catch (e: any) {
        console.error('❌ Błąd połączenia z bazą danych. Upewnij się, że .env jest poprawny.');
        console.error(e.message);
        return;
    }

    const media = await prisma.mediaLibrary.findMany({
        where: {
            file_path: {
                startsWith: 'http'
            }
        }
    });

    console.log(`Znaleziono ${media.length} plików do pobrania.`);

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    for (const item of media) {
        const url = item.file_path;
        const filename = item.file_name;
        const localPath = path.join(uploadsDir, filename);

        if (fs.existsSync(localPath)) {
            // console.log(`[POMINIĘTO] Plik już istnieje: ${filename}`);
            skippedCount++;
            continue;
        }

        try {
            console.log(`[POBIERANIE] ${filename} z ${url}...`);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            if (!response.body) throw new Error('Empty response body');

            const writer = fs.createWriteStream(localPath);
            // @ts-ignore - ReadableStream to Readable conversion
            const body = Readable.fromWeb(response.body as any);
            await finished(body.pipe(writer));

            successCount++;
            console.log(`[OK] Pobrano: ${filename}`);
        } catch (error: any) {
            console.error(`[BŁĄD] Nie udało się pobrać ${filename}: ${error.message}`);
            failCount++;
        }
    }

    console.log('\n--- Podsumowanie ---');
    console.log(`Sukces: ${successCount}`);
    console.log(`Pominięto: ${skippedCount}`);
    console.log(`Błędy: ${failCount}`);
}

downloadMedia()
    .catch(e => {
        console.error('Krytyczny błąd skryptu:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
