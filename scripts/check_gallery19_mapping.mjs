import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const total = await prisma.galleryPhoto.count({ where: { gallery_id: 19 } });
const mapped = await prisma.galleryPhoto.count({ where: { gallery_id: 19, download_source_url: { not: null } } });
console.log(`Galeria 19: ${total} zdjęć, zmapowanych na JPG (download_source_url): ${mapped}`);
console.log(mapped === 0
  ? '=> MASÓWKA PAKUJE WEBP (JPG jeszcze nie zmapowane) — klient dostaje webp!'
  : `=> ${mapped}/${total} idzie jako JPG.`);

// przykładowy rekord
const sample = await prisma.galleryPhoto.findFirst({ where: { gallery_id: 19 }, select: { id: true, file_url: true, download_source_url: true } });
console.log('Przykład:', { id: sample?.id, file_url: sample?.file_url?.slice(-40), download_source_url: sample?.download_source_url ? '...'+sample.download_source_url.slice(-40) : null });

await prisma.$disconnect();
