// Kompletny audyt: sesje, kwoty, umowy, oferty
// Znajdzie WSZYSTKIE anomalie zamiast czekać aż user je zgłosi

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const prisma = new PrismaClient();

interface AnomalyReport {
  type: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  entity: string;
  id: number;
  problem: string;
  current_value?: any;
  expected_value?: any;
}

async function main() {
  console.log('🔍 Rozpoczynam pełny audyt bazy danych...\n');
  const anomalies: AnomalyReport[] = [];

  // 1. AUDYT UŻYTKOWNIKÓW Z BOOKINGAMI
  console.log('📊 1. Audyt użytkowników z sesjami...');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      offers: {
        select: {
          id: true,
          total_price: true,
          status: true,
          title: true,
        },
      },
    },
  });

  for (const user of users) {
    // Sprawdź oferty z kwotami > 10 000 PLN (podejrzane - normalne sesje to 300-3000 PLN)
    for (const offer of user.offers) {
      if (offer.total_price > 10000) {
        anomalies.push({
          type: 'SUSPICIOUSLY_HIGH_OFFER',
          severity: 'CRITICAL',
          entity: 'Offer',
          id: offer.id,
          problem: `Bardzo wysoka kwota oferty: ${offer.total_price} PLN dla ${user.name} (${user.email}) - "${offer.title}"`,
          current_value: offer.total_price,
        });
      }
    }
  }

  console.log(`   Sprawdzono ${users.length} użytkowników`);

  // 2. AUDYT OFERT (główne źródło przychodów)
  console.log('📊 2. Audyt ofert...');
  const allOffers = await prisma.offer.findMany({
    select: {
      id: true,
      offerNumber: true,
      title: true,
      status: true,
      total_price: true,
      client_id: true,
      client_email: true,
      session_date: true,
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  for (const offer of allOffers) {
    // Kwoty > 5000 PLN (podejrzane dla standardowych sesji)
    if (offer.total_price > 5000) {
      anomalies.push({
        type: 'SUSPICIOUSLY_HIGH_OFFER_PRICE',
        severity: 'CRITICAL',
        entity: 'Offer',
        id: offer.id,
        problem: `Bardzo wysoka kwota: ${offer.total_price} PLN w ofercie "${offer.title}" (${offer.offerNumber}) dla ${offer.user?.name || offer.client_email}`,
        current_value: offer.total_price,
      });
    }

    // Oferty potwierdzone (accepted) bez kwoty
    if (offer.status === 'accepted' && offer.total_price === 0) {
      anomalies.push({
        type: 'ACCEPTED_OFFER_ZERO_PRICE',
        severity: 'WARNING',
        entity: 'Offer',
        id: offer.id,
        problem: `Zaakceptowana oferta "${offer.title}" ma cenę 0 PLN`,
      });
    }
  }

  console.log(`   Sprawdzono ${allOffers.length} ofert`);

  // 3. AUDYT PAKIETÓW
  console.log('📊 3. Audyt pakietów/cenników...');
  const packages = await prisma.package.findMany({
    select: {
      id: true,
      name: true,
      price: true,
      is_active: true,
    },
  });

  for (const pkg of packages) {
    // Kwoty > 3000 dla pojedynczego pakietu
    if (pkg.price > 3000) {
      anomalies.push({
        type: 'HIGH_PACKAGE_PRICE',
        severity: 'INFO',
        entity: 'Package',
        id: pkg.id,
        problem: `Wysoka cena pakietu "${pkg.name}": ${pkg.price} PLN`,
        current_value: pkg.price,
      });
    }

    // Cena = 0 przy aktywnym
    if (pkg.is_active && pkg.price === 0) {
      anomalies.push({
        type: 'ZERO_PRICE_ACTIVE_PACKAGE',
        severity: 'WARNING',
        entity: 'Package',
        id: pkg.id,
        problem: `Aktywny pakiet "${pkg.name}" ma cenę 0 PLN`,
      });
    }
  }

  console.log(`   Sprawdzono ${packages.length} pakietów`);

  // 4. AUDYT GIFT CARDS
  console.log('📊 4. Audyt kart podarunkowych...');
  const giftCards = await prisma.giftCard.findMany({
    select: {
      id: true,
      code: true,
      amount: true,
      value: true,
      status: true,
    },
  });

  for (const card of giftCards) {
    // value > amount (pozostała wartość większa niż początkowa - niemożliwe)
    if (card.value && card.amount && card.value > card.amount) {
      anomalies.push({
        type: 'GIFT_CARD_VALUE_TOO_HIGH',
        severity: 'CRITICAL',
        entity: 'GiftCard',
        id: card.id,
        problem: `Pozostała wartość (${card.value}) > początkowa wartość (${card.amount})`,
        current_value: card.value,
        expected_value: card.amount,
      });
    }

    // Aktywna z value = 0
    if (card.status === 'active' && (!card.value || card.value <= 0)) {
      anomalies.push({
        type: 'ACTIVE_EMPTY_GIFT_CARD',
        severity: 'WARNING',
        entity: 'GiftCard',
        id: card.id,
        problem: `Aktywna karta "${card.code}" ma wartość = ${card.value || 0}`,
      });
    }
  }

  console.log(`   Sprawdzono ${giftCards.length} kart podarunkowych`);

  // 5. PODSUMOWANIE
  console.log('\n' + '='.repeat(80));
  console.log('📋 RAPORT ANOMALII');
  console.log('='.repeat(80) + '\n');

  const critical = anomalies.filter(a => a.severity === 'CRITICAL');
  const warnings = anomalies.filter(a => a.severity === 'WARNING');
  const info = anomalies.filter(a => a.severity === 'INFO');

  console.log(`🔴 CRITICAL: ${critical.length}`);
  console.log(`🟡 WARNING: ${warnings.length}`);
  console.log(`🔵 INFO: ${info.length}`);
  console.log(`📊 TOTAL: ${anomalies.length}\n`);

  if (critical.length > 0) {
    console.log('🔴 CRITICAL ISSUES:\n');
    critical.forEach((a, i) => {
      console.log(`${i + 1}. [${a.entity} #${a.id}] ${a.problem}`);
      if (a.current_value !== undefined) console.log(`   Current: ${a.current_value}`);
      if (a.expected_value !== undefined) console.log(`   Expected: ${a.expected_value}`);
      console.log('');
    });
  }

  if (warnings.length > 0) {
    console.log('🟡 WARNINGS:\n');
    warnings.forEach((a, i) => {
      console.log(`${i + 1}. [${a.entity} #${a.id}] ${a.problem}`);
      if (a.current_value !== undefined) console.log(`   Current: ${a.current_value}`);
      if (a.expected_value !== undefined) console.log(`   Expected: ${a.expected_value}`);
      console.log('');
    });
  }

  // Zapisz raport do pliku
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const reportPath = path.join(process.cwd(), 'backups', `audit-report-${timestamp}.json`);
  
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: anomalies.length,
      critical: critical.length,
      warnings: warnings.length,
      info: info.length,
    },
    anomalies,
  }, null, 2));

  console.log(`\n💾 Raport zapisany: ${reportPath}\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
