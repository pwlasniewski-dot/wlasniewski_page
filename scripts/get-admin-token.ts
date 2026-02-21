async function getToken() {
    try {
        const res = await fetch('http://localhost:3000/api/auth/admin-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'pwlasniewski@gmail.com',
                password: 'Wlasniewski123!'
            })
        });
        const data = await res.json();
        if (data.token) {
            console.log(data.token);
        } else {
            // Try with 123456 as requested by user later
            const res2 = await fetch('http://localhost:3000/api/auth/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'pwlasniewski@gmail.com',
                    password: '123456'
                })
            });
            const data2 = await res2.json();
            console.log(data2.token || 'FAILED');
        }
    } catch (e) {
        console.error(e);
    }
}
getToken();
