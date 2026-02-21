const token = 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MiwiZW1haWwiOiJwd2xhc25pZXdza2lAZ21haWwuY29tIiwicm9sZSI6IkFETUlOIiwidHlwZSI6ImFkbWluIiwiaWF0IjoxNzcxNjYyNDAxLCJleHAiOjE3NzIyNjcyMDF9.UGuO2lwSLphQu_2yWtX1SKcBEGrWPyk3G86xCMCHQzk';

async function testApi() {
    try {
        console.log('Calling save-s3 API for contract 1...');
        const res = await fetch('http://localhost:3000/api/admin/contracts/1/save-s3', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        console.log('Response status:', res.status);
        console.log('Response body:', JSON.stringify(data, null, 2));

        console.log('\nCalling save-s3 API for offer 22...');
        const res2 = await fetch('http://localhost:3000/api/admin/offers/22/save-s3', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data2 = await res2.json();
        console.log('Response status:', res2.status);
        console.log('Response body:', JSON.stringify(data2, null, 2));

    } catch (e) {
        console.error(e);
    }
}
testApi();
