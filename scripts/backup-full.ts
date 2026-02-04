
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups', `backup-${timestamp}`);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log(`Starting backup to ${backupDir}...`);

    const models = [
        'adminUser', 'setting', 'historyPhoto', 'menuItem', 'mediaLibrary',
        'portfolioSession', 'blogPost', 'testimonial', 'promoCode', 'inquiry',
        'emailSubscriber', 'analyticsEvent', 'heroSlide', 'page', 'booking',
        'serviceType', 'package', 'giftCardOrder', 'giftCard', 'user',
        'photographerProfile', 'basket', 'basketItem', 'sessionInvite',
        'challengePackage', 'challengeLocation', 'challengeUser', 'photoChallenge',
        'challengeTimelineEvent', 'challengeSetting', 'challengeGallery',
        'challengePhoto', 'clientGallery', 'galleryPhoto', 'photoOrder',
        'systemSettings', 'pageEffect', 'systemLog', 'errorNote',
        'businessGoal', 'scrumTask', 'marketingAction', 'droneOrder',
        'analyticsSnapshot', 'marketingTemplate', 'newsletter_campaigns',
        'payouts', 'provider_availability', 'subscribers',
        'client', 'clientOffer', 'clientContract',
        'offer', 'offerSection', 'offerItem', 'contract', 'negotiation'
    ];

    for (const model of models) {
        try {
            // @ts-ignore
            const data = await prisma[model].findMany();
            fs.writeFileSync(
                path.join(backupDir, `${model}.json`),
                JSON.stringify(data, null, 2)
            );
            console.log(`✓ Backed up ${model} (${data.length} records)`);
        } catch (e) {
            console.error(`✗ Failed to backup ${model}:`, e);
        }
    }

    console.log('Backup completed successfully.');
}

backup()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
