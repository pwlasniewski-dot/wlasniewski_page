
const fs = require('fs');
const path = require('path');

function listDir(dir, level = 0) {
    if (level > 3) return; // Prevent excessive recursion
    try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                console.log('DIR: ' + fullPath);
                listDir(fullPath, level + 1);
            } else {
                if (file === 'page.tsx') {
                    console.log('FILE: ' + fullPath);
                }
            }
        });
    } catch (e) {
        // ignore access errors
    }
}

listDir(path.join(process.cwd(), 'src', 'app'));
