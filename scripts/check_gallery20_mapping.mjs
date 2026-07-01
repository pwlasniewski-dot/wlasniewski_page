import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const total = await prisma.galleryPhoto.count({ where: { gallery_id: 20 } });
const mapped = await prisma.galleryPhoto.count({ where: { gallery_id: 20, download_source_url: { not: null } } });
console.log(`Galeria 20: ${total} zdjęć, zmapowanych na JPG: ${mapped}`);
const setting = await prisma.setting.findUnique({ where: { setting_key: 'jpg_mapping_20' } });
console.log('Manifest jpg_mapping_20 istnieje:', !!setting);
await prisma.$disconnect();
