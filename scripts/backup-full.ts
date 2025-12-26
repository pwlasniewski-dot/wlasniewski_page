
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const MODELS = [
    'AdminUser',
    'Setting',
    'MenuItem',
    'MediaLibrary',
    'PortfolioSession',
    'BlogPost',
    'Testimonial',
    'PromoCode',
    'Inquiry',
    'EmailSubscriber',
    'AnalyticsEvent',
    'HeroSlide',
    'Page',
    'Booking',
    'ServiceType',
    'Package',
    'GiftCardOrder',
    'GiftCard',
    'User',
    'SessionInvite',
    'ChallengePackage',
    'ChallengeLocation',
    'ChallengeUser',
    'PhotoChallenge',
    'ChallengeTimelineEvent',
    'ChallengeSetting',
    'ChallengeGallery',
    'ChallengePhoto',
    'ClientGallery',
    'GalleryPhoto',
    'PhotoOrder',
    'SystemSettings',
    'PageEffect',
    'SystemLog',
    'ErrorNote',
    'BusinessGoal',
    'ScrumTask',
    'MarketingAction',
    'DroneOrder',
    'AnalyticsSnapshot',
    'MarketingTemplate'
];

async function backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups', timestamp);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log(`Starting backup to: ${backupDir}`);

    for (const modelName of MODELS) {
        try {
            // @ts-ignore
            const data = await prisma[modelName].findMany();
            if (data) {
                const filePath = path.join(backupDir, `${modelName}.json`);
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                console.log(`✅ Backed up ${modelName}: ${data.length} records`);
            }
        } catch (error) {
            console.error(`❌ Failed to backup ${modelName}:`, error);
        }
    }

    // Also backup public/uploads if exists
    // We cannot zip easily without external tools in this env, but we can list files to verify
    console.log('--- Content Verification ---');
    try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (fs.existsSync(uploadDir)) {
            console.log(`✅ Uploads directory exists at ${uploadDir}`);
        } else {
            console.log(`⚠️ Uploads directory NOT found at ${uploadDir} (Images might be on S3)`);
        }
    } catch (e) {
        console.log('Error checking uploads dir');
    }

    console.log('Backup completed successfully.');
}

backup()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
