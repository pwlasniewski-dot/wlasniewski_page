import prisma from '@/lib/db/prisma';
import {
    DEFAULT_PHOTO_FUNNEL_CONFIG,
    PHOTO_FUNNEL_SETTING_KEY,
    parsePhotoFunnelConfig,
    type PhotoFunnelConfig,
} from './photo-funnel';

export async function loadPhotoFunnelConfig(): Promise<PhotoFunnelConfig> {
    try {
        const setting = await prisma.setting.findUnique({
            where: { setting_key: PHOTO_FUNNEL_SETTING_KEY },
            select: { setting_value: true },
        });
        return parsePhotoFunnelConfig(setting?.setting_value);
    } catch (error) {
        console.warn('[photo-funnel] CMS configuration unavailable, using safe defaults', error);
        return parsePhotoFunnelConfig(DEFAULT_PHOTO_FUNNEL_CONFIG);
    }
}
