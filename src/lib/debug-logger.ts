
import fs from 'fs';
import path from 'path';

export function logDebug(message: string) {
    try {
        const logPath = path.join(process.cwd(), 'debug-auth.log');
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
    } catch (e) {
        // ignore
    }
}
