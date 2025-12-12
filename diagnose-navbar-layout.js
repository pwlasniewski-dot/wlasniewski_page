const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
  console.log('🔍 DIAGNOZA: Navbar Layout Settings\n');

  // 1. Check if setting exists in database
  console.log('1️⃣ Sprawdzam czy navbar_layout istnieje w bazie...');
  const navbarLayoutSetting = await prisma.setting.findFirst({
    where: { setting_key: 'navbar_layout' }
  });
  
  console.log('   Status:', navbarLayoutSetting ? '✅ ISTNIEJE' : '❌ BRAKUJE');
  if (navbarLayoutSetting) {
    console.log('   Wartość:', navbarLayoutSetting.setting_value);
    console.log('   ID:', navbarLayoutSetting.id);
  }

  // 2. Check first Setting record for column values
  console.log('\n2️⃣ Sprawdzam kolumnę navbar_layout w pierwszym Setting...');
  const firstSetting = await prisma.setting.findFirst({
    orderBy: { id: 'asc' }
  });
  
  if (firstSetting) {
    console.log('   navbar_layout (kolumna):', firstSetting.navbar_layout);
    console.log('   navbar_sticky (kolumna):', firstSetting.navbar_sticky);
    console.log('   navbar_transparent (kolumna):', firstSetting.navbar_transparent);
  }

  // 3. Check API response
  console.log('\n3️⃣ Testuję API endpoint /api/settings...');
  try {
    const response = await fetch('http://localhost:3000/api/settings/public');
    const data = await response.json();
    if (data.success && data.settings) {
      console.log('   navbar_layout z API:', data.settings.navbar_layout);
      console.log('   Wszystkie dostępne:', Object.keys(data.settings).filter(k => k.includes('navbar')));
    } else {
      console.log('   ❌ API ERROR:', data.error);
    }
  } catch (err) {
    console.log('   ⚠️  Nie udało się połączyć z API (serwer dev musi być uruchomiony)');
    console.log('   Błąd:', err.message);
  }

  // 4. All settings
  console.log('\n4️⃣ Wszystkie settings w bazie:');
  const allSettings = await prisma.setting.findMany({
    take: 1,
    orderBy: { id: 'asc' }
  });
  
  if (allSettings.length > 0) {
    const setting = allSettings[0];
    const navbarFields = Object.keys(setting).filter(k => k.includes('navbar'));
    console.log('   Pola navbar w Setting:');
    navbarFields.forEach(field => {
      console.log(`     - ${field}: ${setting[field]}`);
    });
  }

  // 5. Check if navbar_layout is in Settings table schema
  console.log('\n5️⃣ Sprawdzam schemat tabeli Setting...');
  console.log('   (patrz prisma/schema.prisma - model Setting)');
  
  console.log('\n✅ DIAGNOZA ZAKOŃCZONA\n');
  console.log('PODSUMOWANIE:');
  console.log('- Jeśli navbar_layout jest w kolumnie: POWINNO działać');
  console.log('- Jeśli jest tylko w setting_key/setting_value: PROBLEMU!');
  console.log('- Sprawdź czy Navbar.tsx czyta z API');
}

diagnose().catch(console.error).finally(() => process.exit(0));
