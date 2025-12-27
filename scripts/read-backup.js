
const fs = require('fs');
const path = require('path');

async function main() {
    const backupDir = path.join('backups', '2025-12-26_17-03-51.346Z_backup'); // Adjust name if needed
    // In previous 'list-backups.js' output, it was: "[2025-12-26T17:03:51.346Z] documentation (DIR)"
    // Wait, "documentation" directory?
    // Let's re-read the previous output carefully.

    // Step 4128 output:
    // [2025-12-26T17:03:51.346Z] documentation (DIR)
    //    Contents: ARCHITECTURE_2025-12-24_10-30-53-7...
    // [2025-12-21T07:57:25.020Z] backup-2025-12-21T07-

    // It seems "documentation" is the name of the directory created at that time?
    // Or maybe I misread.
    // Let's just list the root 'backups' dir again but print EXACT names.

    const root = 'backups';
    const entries = fs.readdirSync(root);
    console.log('--- REENTRIES ---');
    entries.forEach(e => console.log(`'${e}'`));

    // If we find a likely backup dir, try to read Page.json
    const likelyDir = entries.find(e => e.includes('2025-12-26') && e.includes('backup'));
    if (likelyDir) {
        console.log(`Checking ${likelyDir}...`);
        const pagePath = path.join(root, likelyDir, 'Page.json');
        if (fs.existsSync(pagePath)) {
            const content = fs.readFileSync(pagePath, 'utf8');
            const pages = JSON.parse(content);
            const aboutPage = pages.find(p => p.slug === 'o-mnie');
            if (aboutPage) {
                console.log('FOUND PAGE o-mnie in backup!');
                console.log('Sections:', aboutPage.sections);
                console.log('Content:', aboutPage.content);
                console.log('Legacy fields:', {
                    about_photo: aboutPage.about_photo,
                    about_text_side: aboutPage.about_text_side
                });
            } else {
                console.log('Page o-mnie NOT FOUND in backup.');
            }
        } else {
            console.log('Page.json not found in ' + likelyDir);
            // check if it's in a subdirectory?
            const sub = fs.readdirSync(path.join(root, likelyDir));
            console.log('Subcontents:', sub);
        }
    }
}

main().catch(console.error);
