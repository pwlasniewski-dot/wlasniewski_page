
async function testLoginApi() {
    const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'testuser@example.com', password: 'password123' })
    });

    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log('Response:', data);
}

testLoginApi().catch(console.error);
