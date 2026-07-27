import prisma from '@/lib/db/prisma';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';
export type LogModule = 'AUTH' | 'PAYMENT' | 'EMAIL' | 'SYSTEM' | 'CHALLENGE' | 'BOOKING' | 'CONTACT' | 'MEDIA_UPLOAD' | 'GIFT_CARD' | 'CHECKOUT' | 'BASKET' | 'FOTO_MATCH_VOUCHER' | 'FOTO_MATCH' | 'HISTORY' | 'LOCAL_SEO';

export async function logSystem(
    level: LogLevel,
    module: LogModule,
    message: string,
    metadata?: any
) {
    try {
        // Console log for immediate feedback in server logs
        const metaStr = metadata ? JSON.stringify(metadata) : '';
        console.log(`[${new Date().toISOString()}] [${module}] [${level}] ${message} ${metaStr}`);

        // Save to DB
        await prisma.systemLog.create({
            data: {
                level,
                module,
                message,
                metadata: metadata ? JSON.stringify(metadata) : null
            }
        });
    } catch (error) {
        // Fallback if DB fails
        console.error('Failed to write system log:', error);
    }
}
