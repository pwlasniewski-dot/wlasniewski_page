
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Drone/Thermal page with SEO content...');

  const dronePageData = {
    title: 'Usługi Dronowe i Termowizja - Kujawsko-Pomorskie',
    slug: 'dron',
    meta_title: 'Termowizja z Drona Kujawsko-Pomorskie | Inspekcje Fotowoltaiki, Budynków | NSTS-01, ITC Level 1',
    meta_description: 'Profesjonalne usługi dronowe w Kujawsko-Pomorskim. Inspekcje termowizyjne budynków, farm fotowoltaicznych i mostów. Uprawnienia NSTS-01, Certyfikat ITC Level 1. Sprawdź oszczędności dzięki termowizji.',
    meta_keywords: 'termowizja z drona, inspekcje dronem toruń, bydgoszcz, kujawsko-pomorskie, ITC Level 1, NSTS-01, badanie szczelności budynków, inspekcja paneli fotowoltaicznych',
    is_published: true,
    page_type: 'regular',
    content: '', // Required field
    sections: JSON.stringify([
      {
        id: 'hero-1',
        type: 'hero',
        tag: 'Ekspercka Termowizja Lotnicza',
        title: 'Zaawansowane Inspekcje z Drona',
        subtitle: 'Profesjonalne badania termowizyjne i wizualne dla przemysłu i budownictwa na terenie Kujawsko-Pomorskiego.',
        buttonText: 'Zamów darmową wycenę',
        buttonLink: '#kontakt'
      },
      {
        id: 'thermal-1',
        type: 'thermal_slider',
        title: 'Zobacz to, czego nie widzi oko',
        subtitle: 'Nasze systemy termowizyjne wykrywają mostki cieplne, uszkodzenia ogniw PV oraz nieszczelności instalacji z precyzją co do centymetra.',
        image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2000',
        thermalImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2000&auto=format&sepia=100', // Mock thermal
        labelLeft: 'Widok Wizualny (RGB)',
        labelRight: 'Mapa Ciepła (Termo)',
        content: '<p>Wykorzystujemy radiometryczne kamery o wysokiej rozdzielczości, które pozwalają na dokładny pomiar temperatury w każdym punkcie obrazu. Idealne rozwiązanie dla audytów energetycznych i przeglądu infrastuktury.</p>'
      },
      {
        id: 'about-me-drone',
        type: 'image_text',
        layout: 'left',
        title: 'Profesjonalizm Potwierdzony Certyfikatami',
        image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=1000',
        content: `
          <h3>O mnie i moim podejściu</h3>
          <p>Nazywam się Patryk Właśniewski i łączę pasję do fotografii z technicznym podejściem do usług dronowych. Działam głównie na terenie województwa <strong>kujawsko-pomorskiego</strong> (Toruń, Bydgoszcz, Włocławek, Inowrocław).</p>
          <ul class="space-y-2">
            <li><strong>Uprawnienia NSTS-01:</strong> Licencjonowany pilot BSP (bezpilotowych statków powietrznych) z prawem wykonywania operacji w zasięgu wzroku w kategorii szczególnej.</li>
            <li><strong>ITC Level 1 (Infrared Training Center):</strong> Międzynarodowy certyfikat operatora termografii, gwarantujący poprawną interpretację obrazu termowizyjnego i rzetelność raportów.</li>
          </ul>
          <p>Dzięki połączeniu tych kompetencji, dostarczam nie tylko zdjęcia, ale przede wszystkim <strong>wartościowe dane techniczne</strong>, które pomagają firmom oszczędzać na ogrzewaniu i zapobiegać awariom fotowoltaiki.</p>
        `
      },
      {
        id: 'services-grid',
        type: 'rich_text',
        content: `
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div class="p-6 bg-zinc-900 rounded-2xl border border-white/5">
              <h4 class="text-gold-500 font-bold mb-3">Inspekcje PV</h4>
              <p class="text-xs">Wykrywanie Hot-Spotów i uszkodzeń diod w instalacjach domowych i na farmach słonecznych.</p>
            </div>
            <div class="p-6 bg-zinc-900 rounded-2xl border border-white/5">
              <h4 class="text-gold-500 font-bold mb-3">Termowizja Budynków</h4>
              <p class="text-xs">Lokalizacja strat ciepła, wilgoci oraz nieszczelności w izolacji dachowej i ściennej.</p>
            </div>
            <div class="p-6 bg-zinc-900 rounded-2xl border border-white/5">
              <h4 class="text-gold-500 font-bold mb-3">Dokumentacja Budowy</h4>
              <p class="text-xs">Regularne naloty monitorujące postęp prac, ortofotomapy i modele 3D terenu.</p>
            </div>
          </div>
        `
      },
      {
        id: 'contact-drone',
        type: 'contact',
        title: 'Gotowy na przegląd techniczny?',
        subtitle: 'Działamy w całym województwie kujawsko-pomorskim. Skontaktuj się, aby otrzymać indywidualną ofertę inspekcji.',
        buttonText: 'Bezpłatna Konsultacja',
        buttonLink: '/kontakt'
      }
    ])
  };

  await prisma.page.upsert({
    where: { slug: 'dron' },
    update: dronePageData,
    create: dronePageData
  });

  console.log('Drone page seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
