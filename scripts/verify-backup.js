const fs = require('fs');

const backupPath = 'backups/data/latest-holy-backup.json';
const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

console.log('📊 BACKUP VERIFICATION REPORT');
console.log('='.repeat(60));
console.log(`Backup file: ${backupPath}`);
console.log(`Backup date: ${new Date().toISOString()}`);
console.log('='.repeat(60));

// Pages
const totalPages = data.page?.length || 0;
const b2cPages = data.page?.filter(p => p.page_type !== 'b2b') || [];
const b2bPages = data.page?.filter(p => p.page_type === 'b2b') || [];

console.log('\n📄 PAGES:');
console.log(`  Total: ${totalPages}`);
console.log(`  - B2C Pages: ${b2cPages.length}`);
console.log(`  - B2B Pages: ${b2bPages.length}`);

console.log('\n  B2C Pages List:');
b2cPages.forEach(p => console.log(`    • ${p.slug} - "${p.title}"`));

console.log('\n  B2B Pages List:');
b2bPages.forEach(p => console.log(`    • ${p.slug} - "${p.title}"`));

// Other tables
console.log('\n📊 OTHER DATA:');
console.log(`  Settings: ${data.setting?.length || 0}`);
console.log(`  Menu Items: ${data.menuItem?.length || 0}`);
console.log(`  Packages: ${data.package?.length || 0}`);
console.log(`  Blog Posts: ${data.blogPost?.length || 0}`);
console.log(`  Users: ${data.user?.length || 0}`);
console.log(`  Gift Cards: ${data.giftCard?.length || 0}`);

console.log('\n✅ Backup verification complete!');
console.log('='.repeat(60));
