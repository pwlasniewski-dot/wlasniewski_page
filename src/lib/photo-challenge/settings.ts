import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cache settings for 5 minutes
let settingsCache: Record<string, any> | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getChallengeSettings() {
    const now = Date.now();

    if (settingsCache && (now - lastFetchTime < CACHE_TTL)) {
        return settingsCache;
    }

    try {
        const settings = await prisma.challengeSetting.findMany();

        const settingsMap = settings.reduce((acc, curr) => {
            let value: any = curr.setting_value;

            if (curr.setting_type === 'boolean') {
                value = value === 'true';
            } else if (curr.setting_type === 'number') {
                value = Number(value);
            } else if (curr.setting_type === 'json') {
                try {
                    value = JSON.parse(value || '{}');
                } catch (e) {
                    value = {};
                }
            }

            acc[curr.setting_key] = value;
            return acc;
        }, {} as Record<string, any>);

        settingsCache = settingsMap;
        lastFetchTime = now;
        return settingsMap;
    } catch (error) {
        console.error('Error fetching settings:', error);
        return {};
    }
}

export async function getSetting(key: string, defaultValue: any = null) {
    const settings = await getChallengeSettings();
    return settings[key] !== undefined ? settings[key] : defaultValue;
}

export async function updateSetting(key: string, value: any, type: 'text' | 'boolean' | 'number' | 'json' = 'text') {
    let stringValue = String(value);

    if (type === 'json') {
        stringValue = JSON.stringify(value);
    }

    await prisma.challengeSetting.upsert({
        where: { setting_key: key },
        update: {
            setting_value: stringValue,
            setting_type: type,
        },
        create: {
            setting_key: key,
            setting_value: stringValue,
            setting_type: type,
        },
    });

    // Invalidate cache
    settingsCache = null;
}

// Helper functions
export async function isModuleEnabled() {
    return await getSetting('module_enabled', false);
}

export async function calculateDiscount(packagePrice: number, discountPercentage: number) {
    return Math.round(packagePrice * (discountPercentage / 100));
}

export async function getAcceptanceDeadline(hours: number = 24) {
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + hours);
    return deadline;
}
