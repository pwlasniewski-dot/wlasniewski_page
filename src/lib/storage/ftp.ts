import { Client } from 'basic-ftp';
import { Readable } from 'stream';

export async function uploadToFtp(fileBuffer: Buffer, fileName: string): Promise<string> {
    const client = new Client();

    // Konfiguracja z zmiennych środowiskowych
    const config = {
        host: process.env.FTP_HOST,
        user: process.env.FTP_USER,
        password: process.env.FTP_PASSWORD,
        // Opcjonalnie: secure: true jeśli serwer obsługuje FTPS
        secure: process.env.FTP_SECURE === 'true',
    };

    if (!config.host || !config.user || !config.password) {
        throw new Error('Brak konfiguracji FTP (FTP_HOST, FTP_USER, FTP_PASSWORD)');
    }

    try {
        await client.access(config);

        // Katalog na serwerze, np. /public_html/uploads
        // Domyślnie używamy /public_html/uploads jeśli nie podano inaczej
        const uploadDir = process.env.FTP_UPLOAD_DIR || '/public_html/uploads';

        // Upewnij się, że katalog istnieje i wejdź do niego
        await client.ensureDir(uploadDir);

        // Przesyłanie pliku
        const source = Readable.from(fileBuffer);
        await client.uploadFrom(source, fileName);

        // Budowanie publicznego URL
        // Np. https://wlasniewski.pl/uploads
        const publicBaseUrl = process.env.FTP_PUBLIC_URL || 'https://wlasniewski.pl/uploads';

        // Zwracamy pełny URL do pliku
        return `${publicBaseUrl}/${fileName}`;

    } catch (err: any) {
        console.error('Błąd przesyłania FTP:', err);
        throw new Error(`Nie udało się wysłać pliku na serwer FTP: ${err.message}`);
    } finally {
        // Zawsze zamykaj połączenie
        client.close();
    }
}
