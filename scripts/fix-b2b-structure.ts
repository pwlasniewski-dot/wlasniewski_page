
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixB2BStructure() {
    console.log('🔧 Fixing B2B Pages & Menu...');

    // 1. Fix Page Slugs
    try {
        const auditPage = await prisma.page.findFirst({ where: { slug: 'audyty-termowizyjne' } });
        if (auditPage) {
            await prisma.page.update({
                where: { id: auditPage.id },
                data: { slug: 'termowizja', title: 'Termowizja' }
            });
            console.log('✅ Renamed slug: audyty-termowizyjne -> termowizja');
        }

        const monitoringPage = await prisma.page.findFirst({ where: { slug: 'monitoring-inwestycji' } });
        if (monitoringPage) {
            await prisma.page.update({
                where: { id: monitoringPage.id },
                data: { slug: 'monitoring', title: 'Monitoring' }
            });
            console.log('✅ Renamed slug: monitoring-inwestycji -> monitoring');
        }

    } catch (e) {
        console.error('Error updating pages:', e);
    }

    // 2. Fix Menu Urls
    try {
        await prisma.menuItem.updateMany({
            where: { url: '/b2b/audyty-termowizyjne' },
            data: { url: '/b2b/termowizja', title: 'Termowizja' }
        });
        await prisma.menuItem.updateMany({
            where: { url: '/b2b/monitoring-inwestycji' },
            data: { url: '/b2b/monitoring', title: 'Monitoring' }
        });
        console.log('✅ Updated Menu URLs');

    } catch (e) {
        console.error('Error updating menu:', e);
    }
}

fixB2BStructure()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
