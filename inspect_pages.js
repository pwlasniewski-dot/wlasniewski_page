


const fs = require('fs');

async function check() {
    try {
        const res = await fetch('http://localhost:3000/api/pages');
        const data = await res.json();
        fs.writeFileSync('debug_pages.json', JSON.stringify(data, null, 2));
        console.log('Saved to debug_pages.json');
    } catch (e) {
        console.error(e);
    }
}

check();
