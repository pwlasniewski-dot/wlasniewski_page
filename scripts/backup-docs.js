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
        const destPath = path.join(backupDir, `${base}_${timestamp}${ext}`);

        fs.copyFileSync(srcPath, destPath);
        console.log(`[BACKUP] Copied ${file} to ${destPath}`);
    } else {
        console.warn(`[BACKUP] Warning: ${file} not found, skipping.`);
    }
});
