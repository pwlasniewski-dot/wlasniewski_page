const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedExampleData() {
  try {
    console.log('🌱 Zasilanie przykładowymi danymi...\n');

    // 1. Example Drone Orders
    console.log('📋 Tworzenie przykładowych zleceń dronowych...');
    const droneOrders = await prisma.droneOrder.createMany({
      data: [
        {
          client_name: 'Andrzej Nowak',
          company_name: 'Instalacje Słoneczne Sp. z o.o.',
          email: 'andrzej@solarne.pl',
          phone: '+48 123 456 789',
          service_type: 'fotowoltaika',
          details: 'Chcemy sprawdzić stan naszych paneli słonecznych na dachu budynku administracyjnego. Lokalizacja: Warszawa ul. Marszałkowska 100. Budynek o powierzchni 500m2, zapewnimy dostęp do dachu.',
          status: 'COMPLETED',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        },
        {
          client_name: 'Maria Kowalska',
          company_name: 'Pracownia Dachówki Premium',
          email: 'maria@dachowka.pl',
          phone: '+48 234 567 890',
          service_type: 'inspekcja_dachu',
          details: 'Inspekcja dachu willi piętrowej po uszkodzeniu podczas burzy. Potrzebne zdjęcia termowizyjne i standard. Lokalizacja: Piaseczno, ul. Leśna 25.',
          status: 'IN_PROGRESS',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          client_name: 'Piotr Lewandowski',
          company_name: 'Elektrociepłownia Warszawa',
          email: 'piotr@ec-warszawa.pl',
          phone: '+48 345 678 901',
          service_type: 'ciepłownictwo',
          details: 'Termowizja sieci ciepłowniczej w okolicy Śródmieścia. Poszukujemy wycieków i rozszerzonych połączeń. Obszar: 2km2',
          status: 'NEW',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          client_name: 'Tomasz Zaremba',
          company_name: 'Budpol Konstrukencje Sp. z o.o.',
          email: 'tomasz@budpol.pl',
          phone: '+48 456 789 012',
          service_type: 'nadzor_budowlany',
          details: 'Nadzór budowy nowego kompleksu handlowego w Łomiankach. Potrzebne tygodniowe zdjęcia lotnicze postępów prac. Budowa trwa 18 miesięcy.',
          status: 'NEW',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          client_name: 'Agnieszka Zwolska',
          company_name: 'Geopomiary Polska',
          email: 'agnieszka@geopomiary.pl',
          phone: '+48 567 890 123',
          service_type: 'ortofotomapy',
          details: 'Ortofotomapy wysokiej rozdzielczości dla inwentaryzacji terenu gminy Milanówek. Powierzchnia: 45km2. Wymagana dokładność: 5cm/pixel',
          status: 'COMPLETED',
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      ],
      skipDuplicates: true,
    });
    console.log(`✅ Utworzono ${droneOrders.count} zleceń dronowych\n`);

    // 2. Example Booking Sessions
    console.log('📅 Tworzenie przykładowych rezerwacji...');
    const bookingSessions = await prisma.booking.createMany({
      data: [
        {
          service: 'sesja',
          package: 'Sesja standardowa 2h',
          price: 890,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          start_time: '10:00',
          end_time: '12:00',
          client_name: 'Katarzyna Nowak',
          email: 'katarzyna@email.com',
          phone: '+48 111 222 333',
          venue_city: 'Warszawa',
          venue_place: 'Studio Centrum',
          notes: 'Sesja w studio, oświetlenie naturalne, 30 minut post-processing',
          status: 'confirmed',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          service: 'ślub',
          package: 'Ślub Premium 10h',
          price: 4500,
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          start_time: '08:00',
          end_time: '18:00',
          client_name: 'Adam Kowalski',
          email: 'adam.k@email.com',
          phone: '+48 222 333 444',
          venue_city: 'Warszawa',
          venue_place: 'Kościół pw. Św. Anny',
          notes: 'Ślub z drużbą, album premium, wersja cyfrowa + pendrive',
          status: 'confirmed',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          service: 'przyjęcie',
          package: 'Przyjęcie 12h',
          price: 3500,
          date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          start_time: '12:00',
          end_time: '00:00',
          client_name: 'Łukasz Miłosz',
          email: 'lukasz.m@email.com',
          phone: '+48 333 444 555',
          venue_city: 'Piaseczno',
          venue_place: 'Sali weselne Pałacyk',
          notes: 'Czeka na potwierdzenie daty sali, 120 gości',
          status: 'pending',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      ],
      skipDuplicates: true,
    });
    console.log(`✅ Utworzono ${bookingSessions.count} rezerwacji\n`);

    // 3. Example Gift Card Orders - SKIP (wymaga card_id)
    console.log('🎁 Karty podarunkowe wymagają setup GiftCard - POMINIĘTE\n');

    // 4. Example Photo Challenges - SKIP (wymaga package_id)
    console.log('📸 Foto-wyzwania wymagają setup - POMINIĘTE\n');

    // 5. Example Analytics Events
    console.log('📊 Tworzenie przykładowych zdarzeń analitycznych...');
    const analyticsEvents = await prisma.analyticsEvent.createMany({
      data: [
        // /dron page visits
        {
          event_type: 'page_view',
          page_url: '/dron',
          user_id: 'user_1',
          session_id: 'session_dron_1',
          referrer: 'google',
          metadata: JSON.stringify({ device: 'mobile', source: 'search' }),
          created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        },
        {
          event_type: 'page_view',
          page_url: '/dron',
          user_id: 'user_2',
          session_id: 'session_dron_2',
          referrer: 'direct',
          metadata: JSON.stringify({ device: 'desktop' }),
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          event_type: 'drone_order_submitted',
          page_url: '/api/drone/order',
          user_id: 'user_1',
          session_id: 'session_dron_1',
          metadata: JSON.stringify({ service_type: 'fotowoltaika', company: 'Instalacje Słoneczne' }),
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        // booking flow
        {
          event_type: 'page_view',
          page_url: '/rezerwacja',
          user_id: 'user_3',
          session_id: 'session_booking_1',
          referrer: 'google',
          metadata: JSON.stringify({ device: 'desktop' }),
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          event_type: 'booking_confirmed',
          page_url: '/rezerwacja',
          user_id: 'user_3',
          session_id: 'session_booking_1',
          metadata: JSON.stringify({ service_type: 'sesja', price: 890 }),
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        // portfolio browsing
        {
          event_type: 'page_view',
          page_url: '/portfolio',
          user_id: 'user_4',
          session_id: 'session_portfolio_1',
          referrer: 'google',
          metadata: JSON.stringify({ device: 'mobile' }),
          created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        },
        {
          event_type: 'page_view',
          page_url: '/portfolio/sesje-fotograficzne',
          user_id: 'user_4',
          session_id: 'session_portfolio_1',
          metadata: JSON.stringify({ device: 'mobile' }),
          created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        },
      ],
      skipDuplicates: true,
    });
    console.log(`✅ Utworzono ${analyticsEvents.count} zdarzeń analitycznych\n`);

    // 6. Create BI Snapshots with metrics
    console.log('📈 Tworzenie snapshotów BI...');
    const snapshots = await prisma.analyticsSnapshot.createMany({
      data: [
        {
          snapshot_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          total_revenue: 8890,
          bookings_count: 2,
          conversion_rate: 3.2,
          metadata: JSON.stringify({
            drone_orders: 2,
            gift_cards_sold: 0,
            photo_challenges_created: 0,
            avg_session_duration: 285,
            bounce_rate: 32.5,
          }),
        },
        {
          snapshot_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          total_revenue: 9800,
          bookings_count: 3,
          conversion_rate: 4.1,
          metadata: JSON.stringify({
            drone_orders: 4,
            gift_cards_sold: 2,
            photo_challenges_created: 1,
            avg_session_duration: 312,
            bounce_rate: 28.3,
          }),
        },
      ],
      skipDuplicates: true,
    });
    console.log(`✅ Utworzono ${snapshots.count} snapshot'ów BI\n`);

    // 7. Create Business Goals
    console.log('🎯 Tworzenie celów biznesowych...');
    const goals = await prisma.businessGoal.createMany({
      data: [
        {
          title: 'Zwiększyć rezerwacje do 10 na miesiąc',
          target_amount: 10,
          current_amount: 3,
          category: 'bookings',
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          progress_percentage: 30,
        },
        {
          title: 'Sprzedaż kart podarunkowych - 5000 PLN na miesiąc',
          target_amount: 5000,
          current_amount: 2800,
          category: 'revenue',
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          progress_percentage: 56,
        },
        {
          title: 'Zlecenia dronowe - 8 zleceń na miesiąc',
          target_amount: 8,
          current_amount: 5,
          category: 'drone_orders',
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          progress_percentage: 62.5,
        },
        {
          title: 'Obniżyć bounce rate poniżej 25%',
          target_amount: 25,
          current_amount: 28.3,
          category: 'analytics',
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          progress_percentage: 0,
        },
      ],
      skipDuplicates: true,
    });
    console.log(`✅ Utworzono ${goals.count} celów biznesowych\n`);

    console.log('═══════════════════════════════════════════════════');
    console.log('✨ ZASILANIE PRZYKŁADOWYMI DANYMI UKOŃCZONE!');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('📊 Podsumowanie:');
    console.log(`   • Zlecenia dronowe: ${droneOrders.count}`);
    console.log(`   • Rezerwacje: ${bookingSessions.count}`);
    console.log(`   • Karty podarunkowe: ${giftCardOrders.count}`);
    console.log(`   • Foto-wyzwania: ${photoChallenges.count}`);
    console.log(`   • Zdarzenia analityczne: ${analyticsEvents.count}`);
    console.log(`   • Snapshot'y BI: ${snapshots.count}`);
    console.log(`   • Cele biznesowe: ${goals.count}`);
    console.log('\n🌐 Możesz teraz testować aplikację!');
    console.log('   • /dron → złóż zlecenie dronowe');
    console.log('   • /rezerwacja → zarezerwuj sesję');
    console.log('   • /karta-podarunkowa → kup kartę');
    console.log('   • /foto-wyzwanie → stwórz wyzwanie');
    console.log('   • /admin/drone-orders → zarządzaj zleceniami');
    console.log('   • /admin/analytics → zobacz analytics');

  } catch (error) {
    console.error('❌ Błąd podczas zasilania:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedExampleData();
