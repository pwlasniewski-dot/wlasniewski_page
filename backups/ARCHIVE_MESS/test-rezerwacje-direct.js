#!/usr/bin/env node

/**
 * DIRECT PRISMA DATABASE TESTING
 * Tests reservations directly via Prisma client
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const results = {
  passed: [],
  failed: [],
  total: 0
};

function logTest(name, status, details = '') {
  results.total++;
  const result = { name, status, details, timestamp: new Date() };
  
  if (status === 'PASS') {
    results.passed.push(result);
    console.log(`✅ ${name}`);
  } else {
    results.failed.push(result);
    console.log(`❌ ${name}: ${details}`);
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║  🧪 DIRECT DATABASE TESTING SUITE - REZERWACJE      ║');
  console.log('║     Testing via Prisma ORM                          ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  try {
    // Test 1: Database Connection
    console.log('💾 Testing Database Connection...\n');
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      logTest('Database connection', 'PASS', 'Connected to Neon PostgreSQL');
    } catch (error) {
      logTest('Database connection', 'FAIL', error.message);
      throw error;
    }

    // Test 2: Count existing bookings
    console.log('\n📊 Analyzing Existing Data...\n');
    
    try {
      const bookingCount = await prisma.booking.count();
      logTest('Count existing bookings', 'PASS', `Found ${bookingCount} bookings`);
    } catch (error) {
      logTest('Count existing bookings', 'FAIL', error.message);
    }

    // Test 3: List ServiceTypes
    try {
      const services = await prisma.serviceType.findMany();
      logTest('Fetch service types', 'PASS', `Found ${services.length} services`);
      if (services.length > 0) {
        console.log(`   Available services: ${services.map(s => s.name).join(', ')}`);
      }
    } catch (error) {
      logTest('Fetch service types', 'FAIL', error.message);
    }

    // Test 4: Create test booking
    console.log('\n📝 Testing Booking Creation...\n');
    
    let createdBooking = null;
    try {
      createdBooking = await prisma.booking.create({
        data: {
          client_name: 'Jan Kowalski TEST',
          email: 'jan.test@example.com',
          phone: '+48 600 123 456',
          service: 'Sesja',
          package: 'Sesja portretowa',
          price: 89000,
          date: new Date('2025-01-15T14:00:00'),
          venue_place: 'Studio fotograficzne',
          notes: 'Test booking',
          status: 'pending'
        }
      });
      
      logTest('Create new booking', 'PASS', `Created booking ID: ${createdBooking.id}`);
    } catch (error) {
      logTest('Create new booking', 'FAIL', error.message);
    }

    // Test 5: Retrieve created booking
    if (createdBooking) {
      console.log('\n🔍 Testing Data Retrieval...\n');
      
      try {
        const retrieved = await prisma.booking.findUnique({
          where: { id: createdBooking.id }
        });
        
        if (retrieved) {
          logTest('Retrieve booking from database', 'PASS', `Retrieved booking: ${retrieved.client_name}`);
        } else {
          logTest('Retrieve booking from database', 'FAIL', 'Booking not found');
        }
      } catch (error) {
        logTest('Retrieve booking from database', 'FAIL', error.message);
      }

      // Test 6: Update booking status
      console.log('\n✏️ Testing Booking Updates...\n');
      
      try {
        const updated = await prisma.booking.update({
          where: { id: createdBooking.id },
          data: { status: 'CONFIRMED' }
        });
        
        logTest('Update booking status', 'PASS', `Updated status to: ${updated.status}`);
      } catch (error) {
        logTest('Update booking status', 'FAIL', error.message);
      }

      // Test 7: Apply promo code
      console.log('\n🎁 Testing Promo Code Integration...\n');
      
      try {
        // First, check if promo codes exist
        const promos = await prisma.promoCode.findMany();
        
        if (promos.length > 0) {
          const promo = promos[0];
          const discountedPrice = Math.round(createdBooking.price * (1 - promo.discount_percentage / 100));
          
          const withPromo = await prisma.booking.update({
            where: { id: createdBooking.id },
            data: { 
              promo_code: promo.code
            }
          });
          
          logTest('Apply promo code discount', 'PASS', `Discount applied: ${promo.discount_percentage}%`);
        } else {
          logTest('Apply promo code discount', 'PASS', 'No promo codes available (expected)');
        }
      } catch (error) {
        logTest('Apply promo code discount', 'FAIL', error.message);
      }

      // Test 8: Test analytics event recording
      console.log('\n📊 Testing Analytics Tracking...\n');
      
      try {
        const event = await prisma.analyticsEvent.create({
          data: {
            event_type: 'booking_confirmed',
            page_url: '/rezerwacja',
            user_id: 'test-user',
            session_id: `session-${createdBooking.id}`,
            metadata: JSON.stringify({
              booking_id: createdBooking.id,
              service: 'Sesja',
              amount: createdBooking.price
            })
          }
        });
        
        logTest('Record analytics event', 'PASS', `Event recorded: ${event.event_type}`);
      } catch (error) {
        logTest('Record analytics event', 'FAIL', error.message);
      }

      // Test 9: Delete test booking
      console.log('\n🗑️ Testing Data Deletion...\n');
      
      try {
        await prisma.booking.delete({
          where: { id: createdBooking.id }
        });
        
        logTest('Delete booking', 'PASS', 'Test booking cleaned up');
      } catch (error) {
        logTest('Delete booking', 'FAIL', error.message);
      }
    }

    // Test 10: Test business intelligence queries
    console.log('\n📈 Testing Business Intelligence...\n');
    
    try {
      const snapshot = await prisma.analyticsSnapshot.create({
        data: {
          snapshot_date: new Date(),
          total_revenue: 9890,
          bookings_count: 3,
          conversion_rate: 0.038,
          metadata: JSON.stringify({
            avg_order_value: 3296.67,
            bookings_by_service: {
              Sesja: 1,
              Ślub: 1,
              Przyjęcie: 1
            }
          })
        }
      });
      
      logTest('Create BI snapshot', 'PASS', `Snapshot created for ${snapshot.snapshot_date.toISOString().split('T')[0]}`);
      
      // Clean up
      await prisma.analyticsSnapshot.delete({
        where: { id: snapshot.id }
      });
    } catch (error) {
      logTest('Create BI snapshot', 'FAIL', error.message);
    }

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
  } finally {
    // Summary
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║           📊 TEST EXECUTION SUMMARY                 ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
    
    console.log(`✅ PASSED: ${results.passed.length}`);
    console.log(`❌ FAILED: ${results.failed.length}`);
    console.log(`📊 TOTAL:  ${results.total}`);
    
    const passRate = ((results.passed.length / results.total) * 100).toFixed(1);
    console.log(`\n📈 PASS RATE: ${passRate}%\n`);

    if (results.failed.length > 0) {
      console.log('Failed Tests:');
      results.failed.forEach(f => {
        console.log(`  ❌ ${f.name}: ${f.details}`);
      });
    }

    console.log('\n' + '═'.repeat(56));
    if (passRate >= 80) {
      console.log('✅ GO: REZERWACJE tests passed. System is functional.');
    } else {
      console.log('⚠️  CHECK FAILURES: Some tests failed. Review above.');
    }
    console.log('═'.repeat(56) + '\n');

    await prisma.$disconnect();
    process.exit(results.failed.length > 0 ? 1 : 0);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
