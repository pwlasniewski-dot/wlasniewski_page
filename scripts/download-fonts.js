const fs = require('fs');
const https = require('https');
const path = require('path');

const fonts = [
    { url: 'https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Regular.ttf', dest: 'Montserrat-Regular.ttf' },
    { url: 'https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-SemiBold.ttf', dest: 'Montserrat-SemiBold.ttf' },
    { url: 'https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Bold.ttf', dest: 'Montserrat-Bold.ttf' },
    { url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/playfairdisplay/PlayfairDisplay-Bold.ttf', dest: 'PlayfairDisplay-Bold.ttf' }
];

const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, response => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', err => {
            fs.unlink(dest, () => reject(err));
        });
    });
};

async function main() {
    for (const font of fonts) {
        const destPath = path.join(__dirname, '../public/fonts', font.dest);
        console.log(`Downloading ${font.dest}...`);
        try {
            await download(font.url, destPath);
            console.log(`Saved to ${destPath}`);
        } catch (e) {
            console.error(`Error downloading ${font.dest}:`, e.message);
        }
    }
}

main();
