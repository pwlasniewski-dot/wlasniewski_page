
import https from 'https';

const url = 'https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/health-check';

console.log(`Testing Node.js HTTP request to: ${url}`);

const req = https.request(url, { method: 'GET' }, (res) => {
    console.log(`Response Status: ${res.statusCode}`);
    console.log('Headers:', res.headers);

    let data = 0;
    res.on('data', (chunk) => {
        data += chunk.length;
    });

    res.on('end', () => {
        console.log(`Download complete: ${data} bytes`);
        process.exit(0);
    });
});

req.on('error', (e) => {
    console.error('Request Error:', e);
    process.exit(1);
});

req.end();
