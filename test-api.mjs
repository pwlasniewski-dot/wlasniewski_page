const fetch = require('node-fetch');

async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/pages?slug=');
        const data = await res.json();
        console.log('Response status:', res.status);
        console.log('Response data:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

test();
