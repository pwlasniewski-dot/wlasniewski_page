const fs = require('fs');
const https = require('https');
const path = require('path');

const fontsToDownload = [
    { url: 'https://fonts.gstatic.com/s/montserrat/v26/JTUSjIg1_i6t8kCHKm459Wlhyw.ttf', name: 'Montserrat-Regular.ttf' },
    { url: 'https://fonts.gstatic.com/s/montserrat/v26/JTURjIg1_i6t8kCHKm45_bZF3gnD_g.ttf', name: 'Montserrat-SemiBold.ttf' },
    { url: 'https://fonts.gstatic.com/s/montserrat/v26/JTURjIg1_i6t8kCHKm45_dJE3gnD_g.ttf', name: 'Montserrat-Bold.ttf' },
    { url: 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD_W73OPE_E_QzO-K6I3X2gE-wG4wFvI.ttf', name: 'PlayfairDisplay-Bold.ttf' }
];

const fontDir = path.join(process.cwd(), 'public', 'fonts');
if (!fs.existsSync(fontDir)) fs.mkdirSync(fontDir, { recursive: true });

async function download() {
    for (const font of fontsToDownload) {
        const dest = path.join(fontDir, font.name);
        console.log(`Downloading ${font.name}...`);
        await new Promise((resolve, reject) => {
            const file = fs.createWriteStream(dest);
            https.get(font.url, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            }).on('error', (err) => {
                fs.unlink(dest, () => reject(err));
            });
        });
    }
    console.log('All fonts downloaded.');
}

download();
