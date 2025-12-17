import prisma from '@/lib/db/prisma';

async function updatePayUNotifyUrl() {
    console.log('🔧 Setting PayU Notify URL...');

    // We update ALL settings records to be safe, though usually there's only one relevant one
    // Or finding the first one is enough.
    const settings = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });

    if (settings) {
        // Use production URL as requested by user's message "https://wlasniewski.pl/api/payu/notify"
        // And ensuring we fallback to ENV if needed in code, but here we set DB.
        const targetUrl = 'https://wlasniewski.pl/api/payu/notify';

        await prisma.setting.update({
            where: { id: settings.id },
            data: { payu_notify_url: targetUrl }
        });
        console.log(`✅ FIXED: payu_notify_url set to ${targetUrl}`);
    } else {
        console.log('❌ No settings record found to update.');
    }
}

updatePayUNotifyUrl()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
