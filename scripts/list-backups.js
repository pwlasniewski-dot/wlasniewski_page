
const fs = require('fs');
const path = require('path');

const backupDir = path.join(process.cwd(), 'backups');

try {
    const files = fs.readdirSync(backupDir).map(file => {
        const filePath = path.join(backupDir, file);
        return {
            name: file,
            time: fs.statSync(filePath).mtime.getTime(),
            isDirectory: fs.statSync(filePath).isDirectory()
        };
    }).sort((a, b) => b.time - a.time); // Newest first

    console.log('--- RECENT BACKUPS ---');
    files.forEach(f => {
        console.log(`[${new Date(f.time).toISOString()}] ${f.name} ${f.isDirectory ? '(DIR)' : ''}`);

        // If it's a directory (from Zero Loss protocol), list its contents
        if (f.isDirectory) {
            const subFiles = fs.readdirSync(path.join(backupDir, f.name));
            console.log(`    Contents: ${subFiles.join(', ')}`);
        }
    });

} catch (e) {
    console.error(e);
}
