const http = require('http');

// Create a simple test that posts to the API
function testPostAPI() {
    const body = JSON.stringify({
        logo_url: 'https://test-from-http.example.com/logo.png',
        logo_dark_url: 'https://test.example.com/logo-dark.png',
        logo_size: 250,
        navbar_layout: 'logo_center_menu_split'
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/settings',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': body.length,
            'Authorization': 'Bearer test-token'
        }
    };

    console.log('📤 Sending POST request to http://localhost:3000/api/settings');
    console.log('📦 Body:', body);

    const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('\n✅ Response status:', res.statusCode);
            try {
                const parsed = JSON.parse(data);
                console.log('✅ Response body:', JSON.stringify(parsed, null, 2));
            } catch (e) {
                console.log('📝 Response:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Error:', error.message);
    });

    req.write(body);
    req.end();
}

setTimeout(testPostAPI, 500);
