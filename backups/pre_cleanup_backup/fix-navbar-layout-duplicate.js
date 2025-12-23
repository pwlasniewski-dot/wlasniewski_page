const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixNavbarLayout() {
  console.log('🔧 NAPRAWA: Przenoszę navbar_layout do kolumny\n');

  // 1. Get the key-value setting
  const kvSetting = await prisma.setting.findFirst({
    where: { setting_key: 'navbar_layout' }
  });

  if (kvSetting) {
    const value = kvSetting.setting_value;
    console.log('Znaleziony setting_key navbar_layout:', value);

    // 2. Update the main Setting record (kolumna)
    const mainSetting = await prisma.setting.findFirst({
      orderBy: { id: 'asc' }
    });

    if (mainSetting) {
      await prisma.setting.update({
        where: { id: mainSetting.id },
        data: { navbar_layout: value }
      });
      console.log('✅ Zaktualizowano kolumnę navbar_layout w Setting #' + mainSetting.id);
      console.log('   Nowa wartość:', value);

      // 3. Delete the key-value entry (duplikat)
      await prisma.setting.delete({
        where: { id: kvSetting.id }
      });
      console.log('✅ Usunięto duplikat setting_key #' + kvSetting.id);
    }
  } else {
    console.log('⚠️ Nie znaleziono navbar_layout w setting_key');
    console.log('Obecna wartość w kolumnie pozostaje niezmieniona');
  }

  // 4. Verify
  const updated = await prisma.setting.findFirst({
    orderBy: { id: 'asc' }
  });
  console.log('\n✅ NAPRAWA ZAKOŃCZONA');
  console.log('Aktualna wartość navbar_layout:', updated.navbar_layout);
}

fixNavbarLayout().catch(console.error).finally(() => process.exit(0));
