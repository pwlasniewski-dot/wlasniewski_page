const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedCompleteData() {
  try {
    console.log('\n========================================');
    console.log('  ZASILANIE BAZY DANYCH - DANE TESTOWE  ');
    console.log('========================================\n');

    // 1. Drone Orders
    console.log('[1/10] Drony zlecenia...');
    const droneOrders = await prisma.droneOrder.createMany({
      data: [
        {
          client_name: 'Andrzej Nowak',
          company_name: 'Instalacje Słoneczne Sp. z o.o.',
          email: 'andrzej@solarne.pl',
          phone: '+48 123 456 789',
          service_type: 'fotowoltaika',
          details: 'Kontrola paneli słonecznych na dachu budynku administracyjnego w Warszawie.',
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
          details: 'Inspekcja dachu willi po uszkodzeniu podczas burzy.',
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
          details: 'Termowizja sieci ciepłowniczej w Śródmieściu Warszawy.',
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
          details: 'Nadzór budowy kompleksu handlowego - tygodniowe zdjęcia lotnicze.',
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
          details: 'Ortofotomapy wysokiej rozdzielczości dla gminy Milanówek - 45km2.',
          status: 'COMPLETED',
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      ],
      skipDuplicates: true,
    });
    console.log(`    ✅ ${droneOrders.count} zleceń dronowych\n`);

    // 2. Rezerwacje
    console.log('[2/10] Rezerwacje sesji fotograficznych...');
    const bookings = await prisma.booking.createMany({
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
          status: 'pending',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      ],
      skipDuplicates: true,
    });
    console.log(`    ✅ ${bookings.count} rezerwacji\n`);

    // 3. Inquiries (zapytania z formularza)
    console.log('[3/10] Zapytania z formularza kontaktowego...');
    const inquiries = await prisma.inquiry.createMany({
      data: [
        {
          name: 'Paweł Dąbrowski',
          email: 'pawel@example.com',
          phone: '+48 888 999 000',
          message: 'Zapytanie o sesję paparazziego dla mojego zespołu firmowego. Interesuje mnie sesja corporate.',
          session_type: 'sesja',
          preferred_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          status: 'new',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          name: 'Joanna Wszelak',
          email: 'joanna@example.com',
          phone: '+48 777 888 999',
          message: 'Ślub zaplanowany na maj 2026 - czy będzie dostępny fotograf? Szukamy kogoś do pełnego dokumentowania.',
          session_type: 'ślub',
          preferred_date: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000),
          status: 'new',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      ],
      skipDuplicates: true,
    });
    console.log(`    ✅ ${inquiries.count} zapytań\n`);

    // 4. Analytics Events
    console.log('[4/10] Zdarzenia analityczne...');
    const analyticsEvents = await prisma.analyticsEvent.createMany({
      data: [
        // /dron visits
        { event_type: 'page_view', page_url: '/dron', user_id: 'user_1', session_id: 'sess_dron_1', referrer: 'google', created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
        { event_type: 'page_view', page_url: '/dron', user_id: 'user_2', session_id: 'sess_dron_2', referrer: 'direct', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        { event_type: 'page_view', page_url: '/dron', user_id: 'user_3', session_id: 'sess_dron_3', referrer: 'facebook', created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
        // /rezerwacja visits & bookings
        { event_type: 'page_view', page_url: '/rezerwacja', user_id: 'user_3', session_id: 'sess_book_1', referrer: 'google', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { event_type: 'page_view', page_url: '/rezerwacja', user_id: 'user_4', session_id: 'sess_book_2', referrer: 'direct', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { event_type: 'page_view', page_url: '/rezerwacja', user_id: 'user_5', session_id: 'sess_book_3', referrer: 'instagram', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        // /portfolio browsing
        { event_type: 'page_view', page_url: '/portfolio', user_id: 'user_6', session_id: 'sess_port_1', referrer: 'google', created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
        { event_type: 'page_view', page_url: '/portfolio/sesje-fotograficzne', user_id: 'user_6', session_id: 'sess_port_1', metadata: JSON.stringify({ scroll_depth: '80%' }), created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
        // home page
        { event_type: 'page_view', page_url: '/', user_id: 'user_7', session_id: 'sess_home_1', referrer: 'google', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { event_type: 'page_view', page_url: '/', user_id: 'user_8', session_id: 'sess_home_2', referrer: 'instagram', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      ],
      skipDuplicates: true,
    });
    console.log(`    ✅ ${analyticsEvents.count} zdarzeń analitycznych\n`);

    // 5. Analytics Snapshots
    console.log('[5/10] Snapshoty BI (Business Intelligence)...');
    const snapshots = await prisma.analyticsSnapshot.createMany({
      data: [
        {
          snapshot_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          total_revenue: 8390,
          bookings_count: 2,
          conversion_rate: 2.8,
          metadata: JSON.stringify({
            drone_orders: 2,
            page_views: 145,
            bounce_rate: 35.2,
            avg_session: 240,
          }),
        },
        {
          snapshot_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          total_revenue: 9890,
          bookings_count: 3,
          conversion_rate: 3.8,
          metadata: JSON.stringify({
            drone_orders: 4,
            page_views: 312,
            bounce_rate: 28.5,
            avg_session: 312,
          }),
        },
      ],
      skipDuplicates: true,
    });
    console.log(`    ✅ ${snapshots.count} snapshotów BI\n`);

    // 6. Business Goals
    console.log('[6/10] Cele biznesowe...');
    const goals = await prisma.businessGoal.createMany({
      data: [
        {
          title: 'Zwiększyć rezerwacje do 10 na miesiąc',
          target_amount: 10,
          current_amount: 3,
          category: 'bookings',
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Przychód z dronów - 20 000 PLN na miesiąc',
          target_amount: 20000,
          current_amount: 15000,
          category: 'drone_orders',
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Wzrost page views do 1000 na miesiąc',
          target_amount: 1000,
          current_amount: 457,
          category: 'analytics',
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      ],
      skipDuplicates: true,
    });
    console.log(`    ✅ ${goals.count} celów biznesowych\n`);

    // 7. Promo Codes
    console.log('[7/10] Kody promocyjne...');
    const promoCodes = await prisma.promoCode.createMany({
      data: [
        {
          code: 'NEWCLIENT20',
          discount_type: 'percentage',
          discount_value: 20,
          max_usage: 50,
          usage_count: 5,
          is_active: true,
          valid_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        {
          code: 'REFERRAL100',
          discount_type: 'fixed',
          discount_value: 100,
          max_usage: 100,
          usage_count: 12,
          is_active: true,
          valid_from: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          valid_until: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        },
      ],
      skipDuplicates: true,
    });
    console.log(`    ✅ ${promoCodes.count} kodów promocyjnych\n`);

    // 8. Email Subscribers
    console.log('[8/10] Subskrybenci newsletter...');
    const subscribers = await prisma.emailSubscriber.createMany({
      data: [
        {
          email: 'subscriber1@example.com',
          source: 'website_footer',
          is_active: true,
          subscribed_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        },
        {
          email: 'subscriber2@example.com',
          source: 'contact_form',
          is_active: true,
          subscribed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        {
          email: 'subscriber3@example.com',
          source: 'popup',
          is_active: true,
          subscribed_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        },
        {
          email: 'subscriber4@example.com',
          source: 'manual',
          is_active: true,
          subscribed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      ],
      skipDuplicates: true,
    });
    console.log(`    ✅ ${subscribers.count} subskrybentów\n`);

    // 9. Testimonials
    console.log('[9/10] Opinie klientów...');
    const testimonials = await prisma.testimonial.createMany({
      data: [
        {
          client_name: 'Michał Lewandowski',
          testimonial_text: 'Fenomenalna sesja! Fotograf bardzo profesjonalny, czujny na szczegóły. Każde zdjęcie to arcydzieło.',
          rating: 5,
          source: 'website',
          is_featured: true,
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        },
        {
          client_name: 'Katarzyna Nowak',
          testimonial_text: 'Najlepsza decyzja - zdjęcia produktów są spektakularne, sprzedaż wzrosła o 40%!',
          rating: 5,
          source: 'booking_page',
          is_featured: true,
          created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        },
        {
          client_name: 'Robert Kowalski',
          testimonial_text: 'Profesjonalizm na najwyższym poziomie. Polecam każdemu!',
          rating: 5,
          source: 'website',
          is_featured: false,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      ],
      skipDuplicates: true,
    });
    console.log(`    ✅ ${testimonials.count} opinii klientów\n`);

    // 10. Marketing Actions
    console.log('[10/10] Akcje marketingowe...');
    const marketingActions = await prisma.marketingAction.createMany({
      data: [
        {
          client_name: 'Kampania Instagram #fotografia',
          action_type: 'social_media',
          notes: 'Hashtag campaign - 500 reach, 25 likes, 3 new inquiries',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        {
          client_name: 'Newsletter - Nowa usługa dronów',
          action_type: 'email_marketing',
          notes: 'Announcement drona services - 35% open rate, 2 drone orders',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          client_name: 'Google Ads - Sesje fotograficzne',
          action_type: 'paid_ads',
          notes: 'Campaign for photo sessions - 1200 impressions, 45 clicks, 8% CTR',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      ],
      skipDuplicates: true,
    });
    console.log(`    ✅ ${marketingActions.count} akcji marketingowych\n`);

    // Summary
    console.log('========================================');
    console.log('  ZASILANIE UKOŃCZONE POMYŚLNIE');
    console.log('========================================\n');
    console.log('PODSUMOWANIE DANYCH:\n');
    console.log(`  Zlecenia dronowe:        ${droneOrders.count}`);
    console.log(`  Rezerwacje sesji:        ${bookings.count}`);
    console.log(`  Zapytania kontaktowe:    ${inquiries.count}`);
    console.log(`  Zdarzenia analityczne:   ${analyticsEvents.count}`);
    console.log(`  Snapshoty BI:            ${snapshots.count}`);
    console.log(`  Cele biznesowe:          ${goals.count}`);
    console.log(`  Kody promocyjne:         ${promoCodes.count}`);
    console.log(`  Subskrybenci:            ${subscribers.count}`);
    console.log(`  Opinie klientów:         ${testimonials.count}`);
    console.log(`  Akcje marketingowe:      ${marketingActions.count}`);
    console.log('\n📊 ANALYTICS & INSIGHTS DOSTĘPNE W:');
    console.log('   → /admin/analytics (dashboard)');
    console.log('   → /api/admin/bi/snapshots (BI metrics)');
    console.log('   → /api/admin/bi/goals (business goals)');
    console.log('\n🔗 TESTUJ APLIKACJĘ:');
    console.log('   → /dron (złóż zlecenie dronowe)');
    console.log('   → /rezerwacja (zarezerwuj sesję)');
    console.log('   → /admin/drone-orders (zarządzaj zleceniami)');
    console.log('   → /admin (dashboard administratora)');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ BŁĄD ZASILANIA:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedCompleteData();
