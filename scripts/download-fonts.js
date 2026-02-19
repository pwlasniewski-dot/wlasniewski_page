const https = require('https');
const fs = require('fs');
const path = require('path');

async function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                download(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded ${path.basename(dest)} (${fs.statSync(dest).size} bytes)`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

// Verified paths for Montserrat
const fonts = [
    { name: 'Montserrat-Regular.ttf', url: 'https://github.com/google/fonts/raw/main/ofl/montserrat/static/Montserrat-Regular.ttf' },
    { name: 'Montserrat-SemiBold.ttf', url: 'https://github.com/google/fonts/raw/main/ofl/montserrat/static/Montserrat-SemiBold.ttf' },
    { name: 'Montserrat-Bold.ttf', url: 'https://github.com/google/fonts/raw/main/ofl/montserrat/static/Montserrat-Bold.ttf' },
    { name: 'PlayfairDisplay-Bold.ttf', url: 'https://github.com/google/fonts/raw/main/ofl/playfairdisplay/static/PlayfairDisplay-Bold.ttf' }
];

async function main() {
    const fontsDir = path.join(__dirname, '..', 'public', 'fonts');
    if (!fs.existsSync(fontsDir)) fs.mkdirSync(fontsDir, { recursive: true });

    for (const font of fonts) {
        try {
            await download(font.url, path.join(fontsDir, font.name));
        } catch (err) {
            console.error(`Error downloading ${font.name}:`, err.message);
        }
    }
}

main();
