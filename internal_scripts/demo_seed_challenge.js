const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const p = new PrismaClient();

(async () => {
  let pkg = await p.challengePackage.findFirst({ where: { is_active: true } });
  if (!pkg) {
    pkg = await p.challengePackage.create({
      data: {
        name: 'Sesja Rodzinna PREMIUM',
        description: 'Pełna sesja rodzinna w plenerze: 90 minut, 30 wybranych zdjęć, retusz, galeria online + USB w eleganckim pudełku.',
        base_price: 120000,
        challenge_price: 79000,
        discount_percentage: 34,
        included_items: '90 min sesji|30 wybranych zdjęć|Retusz artystyczny|Galeria online|USB w pudełku',
        is_active: true,
        display_order: 1,
        accent_color: '#c5a059',
        bg_color: '#1a1a1a',
        gradient_to: '#2a2a2a',
        icon: '👨‍👩‍👧',
        style_variant: 'classic',
      },
    });
    console.log('PACKAGE_CREATED id=' + pkg.id);
  } else {
    console.log('PACKAGE_EXISTS id=' + pkg.id);
  }

  let loc = await p.challengeLocation.findFirst({ where: { is_active: true } });
  if (!loc) {
    loc = await p.challengeLocation.create({
      data: {
        name: 'Wałycz Studio',
        description: 'Profesjonalne studio fotograficzne z parkiem na 2 ha.',
        address: 'Wałycz 12, 87-200 Wąbrzeźno',
        google_maps_url: 'https://maps.google.com/?q=Wa%C5%82ycz+Studio',
        is_active: true,
        display_order: 1,
      },
    });
    console.log('LOCATION_CREATED id=' + loc.id);
  } else {
    console.log('LOCATION_EXISTS id=' + loc.id);
  }

  const link = crypto.randomUUID();
  const ch = await p.photoChallenge.create({
    data: {
      unique_link: link,
      inviter_name: 'Anna Kowalska',
      inviter_contact: '+48 600 100 200',
      inviter_contact_type: 'phone',
      inviter_email: 'anna.kowalska@example.com',
      invitee_name: 'Marek Nowak',
      invitee_contact: 'marek.nowak@example.com',
      invitee_contact_type: 'email',
      package_id: pkg.id,
      location_id: loc.id,
      discount_amount: pkg.base_price - pkg.challenge_price,
      discount_percentage: pkg.discount_percentage,
      status: 'sent',
      paid_amount: pkg.challenge_price,
      payment_status: 'paid',
      payment_method: 'demo',
    },
  });
  console.log('CHALLENGE_CREATED id=' + ch.id);
  console.log('UNIQUE_LINK=' + link);
  await p.$disconnect();
})().catch(async (e) => {
  console.error('ERR', e);
  await p.$disconnect();
  process.exit(1);
});
