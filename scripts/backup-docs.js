const fs = require('fs');
const path = require('path');

const docsToBackup = [
    'ARCHITECTURE.md',
    'FUNCTIONAL_SPECIFICATION.md',
    'PROJECT_HISTORIA.md'
];

const backupDir = path.join(__dirname, '..', 'backups', 'documentation');

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('Z')[0];

docsToBackup.forEach(file => {
    const srcPath = path.join(__dirname, '..', file);
    if (fs.existsSync(srcPath)) {
        const ext = path.extname(file);
        const base = path.basename(file, ext);

        // Find the latest backup for this file
        const backups = fs.readdirSync(backupDir)
            .filter(f => f.startsWith(base) && f.endsWith(ext))
            .sort((a, b) => b.localeCompare(a)); // Sort descending to get latest first

        const latestBackup = backups[0];
        const srcContent = fs.readFileSync(srcPath);

        if (latestBackup) {
            const latestBackupPath = path.join(backupDir, latestBackup);
            const latestContent = fs.readFileSync(latestBackupPath);

            if (srcContent.equals(latestContent)) {
                console.log(`[BACKUP] Skipping ${file} - content identical to latest backup (${latestBackup}).`);
                return;
            }
        }

        const destPath = path.join(backupDir, `${base}_${timestamp}${ext}`);
        fs.writeFileSync(destPath, srcContent);
        console.log(`[BACKUP] Created new backup for ${file}: ${destPath}`);
    } else {
        console.warn(`[BACKUP] Warning: ${file} not found, skipping.`);
    }
});
