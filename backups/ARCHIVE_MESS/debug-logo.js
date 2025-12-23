const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const setting = await prisma.setting.findFirst({
        orderBy: { id: 'asc' }
    });
    
    console.log('=== Logo Settings in Database ===');
    console.log('logo_url:', setting.logo_url);
    console.log('logo_dark_url:', setting.logo_dark_url);
    console.log('logo_size:', setting.logo_size);
    console.log('\n=== All non-null columns ===');
    const keys = Object.keys(setting).filter(k => setting[k] !== null && k !== 'id' && k !== 'setting_key' && k !== 'setting_value' && k !== 'updated_at');
    console.log(keys.join(', '));
    
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
