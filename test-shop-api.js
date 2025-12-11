const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testShopAPI() {
  try {
    const res = await fetch('http://localhost:3000/api/gift-cards/shop');
    const data = await res.json();
    console.log('API Response:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testShopAPI();
