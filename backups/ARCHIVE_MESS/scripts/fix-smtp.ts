import prisma from '@/lib/db/prisma';

async function fixSmtp() {
    console.log('🔧 Fixing SMTP Host Typo...');

    const settings = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });

    if (settings && settings.smtp_host === 'smtp.gmai.com') {
        await prisma.setting.update({
            where: { id: settings.id },
            data: { smtp_host: 'smtp.gmail.com' }
        });
        console.log('✅ FIXED: smtp.gmai.com -> smtp.gmail.com');
    } else {
        console.log('ℹ️ No fix needed or different host found:', settings?.smtp_host);
    }
}

fixSmtp()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
