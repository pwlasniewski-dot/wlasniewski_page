
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const settings = await prisma.setting.count();
    const media = await prisma.mediaLibrary.count();
    const admins = await prisma.adminUser.count();
    const pages = await prisma.page.count();
    const subscribers = await prisma.subscriber.count();

    console.log(`Settings: ${settings}`);
    console.log(`Media: ${media}`);
    console.log(`Admins: ${admins}`);
    console.log(`Pages: ${pages}`);
    console.log(`Subscribers: ${subscribers}`);

    // Check S3 config availability (safe check)
    console.log(`S3_BUCKET_DEFINED: ${!!process.env.S3_BUCKET_NAME}`);
}

check()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
