import GalleryShopAdmin from '@/components/admin/GalleryShopAdmin';

export default function GalleryShopSettingsPage() {
 return <main className="mx-auto w-full max-w-screen-2xl space-y-6 p-4 sm:p-8">
  <header><p className="text-xs uppercase tracking-[.2em] text-amber-200">Sprzedaż w galeriach</p><h1 className="mt-3 text-3xl font-semibold text-white">Jedna oferta dla Twoich klientów</h1><p className="mt-3 max-w-3xl text-zinc-300">Ustaw raz formaty, ceny odbitek, dostawę i produkty nPhoto. Galerie bez własnego cennika korzystają ze wspólnej oferty. Wyjątki możesz ustawić w konkretnej galerii.</p></header>
  <GalleryShopAdmin galleryId="default" />
 </main>;
}
