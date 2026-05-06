import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// Create DB stubs so [slug]/generateMetadata finds them
// The actual rendered page will come from CityLandingPage (fotograf-[city]/page.tsx)
const cities = [
  {
    slug: 'fotograf-grudziadz',
    title: 'Fotograf Grudziądz',
    meta_title: 'Fotograf Grudziądz — Sesje Rodzinne, Ślubne i Biznesowe | Przemysław Właśniewski',
    meta_description: 'Fotograf Grudziądz — naturalne sesje rodzinne, ślubne i biznesowe. Spichrze, bulwary nad Wisłą, Góra Zamkowa. Galeria online, odbitki premium. Umów się!',
    meta_keywords: 'fotograf grudziądz, fotograf ślubny grudziądz, sesja rodzinna grudziądz, fotografia portretowa grudziądz, zdjęcia plenerowe grudziądz',
  },
  {
    slug: 'fotograf-chelmno',
    title: 'Fotograf Chełmno',
    meta_title: 'Fotograf Chełmno — Miasto Zakochanych w kadrze | Przemysław Właśniewski',
    meta_description: 'Fotograf Chełmno — sesje w Mieście Zakochanych. Fotografia ślubna, narzeczeńska i rodzinna. Rynek, mury obronne, panorama Wisły. Zarezerwuj termin!',
    meta_keywords: 'fotograf chełmno, fotograf ślubny chełmno, sesja narzeczeńska chełmno, sesja rodzinna chełmno, miasto zakochanych zdjęcia',
  },
  {
    slug: 'fotograf-wabrzezno',
    title: 'Fotograf Wąbrzeźno',
    meta_title: 'Fotograf Wąbrzeźno — Sesje Rodzinne i Ślubne | Przemysław Właśniewski',
    meta_description: 'Fotograf Wąbrzeźno — naturalne sesje rodzinne, ślubne i komunijne nad jeziorami. Lokalnie, bez dopłaty za dojazd. Zarezerwuj termin!',
    meta_keywords: 'fotograf wąbrzeźno, sesja rodzinna wąbrzeźno, fotograf ślubny wąbrzeźno, zdjęcia wąbrzeźno',
  },
  {
    slug: 'fotograf-bydgoszcz',
    title: 'Fotograf Bydgoszcz',
    meta_title: 'Fotograf Bydgoszcz — Sesje Rodzinne, Ślubne i Biznesowe | Przemysław Właśniewski',
    meta_description: 'Fotograf Bydgoszcz — profesjonalne sesje rodzinne, ślubne i wizerunkowe. Wyspa Młyńska, kanały, plener. Naturalny styl bez sztucznego pozowania.',
    meta_keywords: 'fotograf bydgoszcz, fotograf ślubny bydgoszcz, sesja rodzinna bydgoszcz, fotografia biznesowa bydgoszcz',
  },
  {
    slug: 'fotograf-swiecie',
    title: 'Fotograf Świecie',
    meta_title: 'Fotograf Świecie — Sesje Rodzinne i Ślubne | Przemysław Właśniewski',
    meta_description: 'Fotograf Świecie — naturalne sesje rodzinne i ślubne. Zamek, Wisła, plener. Dojazd bez dopłaty w pakiecie.',
    meta_keywords: 'fotograf świecie, sesja rodzinna świecie, fotograf ślubny świecie',
  },
  {
    slug: 'fotograf-lisewo',
    title: 'Fotograf Lisewo',
    meta_title: 'Fotograf Lisewo — Blisko, Naturalnie, Swojsko | Przemysław Właśniewski',
    meta_description: 'Fotograf Lisewo i okolice — naturalne sesje rodzinne i portretowe. Lokalne plener, wiejski klimat. Dojazd gratis.',
    meta_keywords: 'fotograf lisewo, sesja rodzinna lisewo, fotograf kujawsko-pomorskie',
  },
  {
    slug: 'fotograf-pluznica',
    title: 'Fotograf Płużnica',
    meta_title: 'Fotograf Płużnica — Sesje Rodzinne i Komunijne | Przemysław Właśniewski',
    meta_description: 'Fotograf z Płużnicy — Przemysław Właśniewski. Sesje rodzinne, komunijne i plenerowe w gminie Płużnica i okolicach. Tu wszystko się zaczęło.',
    meta_keywords: 'fotograf płużnica, sesja rodzinna płużnica, fotograf gmina płużnica',
  },
];

for (const city of cities) {
  const existing = await p.page.findFirst({ where: { slug: city.slug } });
  if (existing) {
    await p.page.update({
      where: { id: existing.id },
      data: {
        title: city.title,
        meta_title: city.meta_title,
        meta_description: city.meta_description,
        meta_keywords: city.meta_keywords,
        is_published: true,
        content: '',
        sections: '[]',
      },
    });
    console.log('UPDATED:', city.slug);
  } else {
    await p.page.create({
      data: {
        slug: city.slug,
        title: city.title,
        meta_title: city.meta_title,
        meta_description: city.meta_description,
        meta_keywords: city.meta_keywords,
        is_published: true,
        content: '',
        sections: '[]',
      },
    });
    console.log('CREATED:', city.slug);
  }
}

await p.$disconnect();
