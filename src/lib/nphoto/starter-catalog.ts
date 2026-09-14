/** Verified against nPhoto's product pages on 2026-09-13.
 * These are editable offer starters, never supplier prices or automatic supplier orders.
 * Media references are previews, not a blanket license to republish supplier photos.
 * Imported media require explicit rights confirmation; otherwise drafts have no images.
 * Every new offer stays inactive.
 */
export const NPHOTO_MEDIA_SOURCE = 'https://nphoto.com/pl/strefa-klienta/zdjecia-do-pobrania';
export type NphotoStarter = {
 key:string; title:string; category:string; description:string; source:string;
 minPhotos:number; maxPhotos:number; image:string; previewImages?:readonly string[]; videoUrl?:string;
 printFormatIds?:readonly string[]; deliveryMethods?:Array<'locker'|'courier'>;
};
export const nphotoLaunchKeys = ['odbitki-15x21','harmonijka','fotoalbum-pro','lite-album','fotoobraz'] as const;
export const nphotoStarters:readonly NphotoStarter[] = [
 { key:'harmonijka', title:'Harmonijka nPhoto 8×8 cm', category:'accordion',
  description:'Mały, rozkładany album w aksamitnej oprawie V6. Wariant oferty: 8×8 cm, 12 stron. Pierwsze wybrane zdjęcie rozpoczyna projekt. Projekt przygotowuje fotograf.',
  videoUrl:'https://info.nphoto.com/hubfs/Patryk/Video%20Produktowe%20strefa%20klienta/harmonijka.mp4',
  source:'https://nphoto.com/pl/harmonijka', minPhotos:12, maxPhotos:12,
  image:'https://nphoto.com/sites/default/files/styles/max_1920_1080/public/2023-06/HARMONIJKA%20V6.jpg?itok=AtolNYO_' },
 { key:'fotoalbum-pro', title:'Fotoalbum PRO nPhoto 20×20 cm', category:'album',
  description:'Fotoalbum otwierany na płasko, ze sztywnymi rozkładówkami. Wariant oferty: 20×20 cm, 10 rozkładówek, papier Fuji Silk, aksamitna oprawa V11. Wybierz zdjęcia do projektu przygotowywanego przez fotografa.',
  videoUrl:'https://info.nphoto.com/hubfs/nPhoto%20Videos/albumy.mp4',
  source:'https://nphoto.com/pl/fotoalbumy/fotoalbum-pro', minPhotos:20, maxPhotos:20,
  image:'https://nphoto.com/sites/default/files/styles/max_1920_1080/public/2023-06/FOTOALBUM%20PRO%20V11.jpg?itok=Kdm_g_2R' },
 { key:'lite-album', title:'Lite Album nPhoto 20×20 cm', category:'album',
  description:'Lekki album otwierany na płasko. Wariant startowy oferty: 20×20 cm, 8 rozkładówek (16 stron), papier Fuji Lustre, szara tkanina A30. Projekt przygotowuje fotograf z wybranych zdjęć. Zdjęcie prezentuje przykładowe realizacje; zawartość albumu zostanie przygotowana z Twoich fotografii.',
  source:'https://nphoto.com/pl/fotoalbumy/lite-album', minPhotos:16, maxPhotos:16,
  image:'https://nphoto.com/sites/default/files/styles/galeria_thumb_w830/public/2021-02/Lite%20Album%20Classic_1.jpg?itok=LbU7nPBm',
  previewImages:['https://nphoto.com/sites/default/files/styles/galeria_thumb_w830/public/2021-02/Lite%20Album%20Classic_1.jpg?itok=LbU7nPBm','https://nphoto.com/sites/default/files/styles/galeria_thumb_w830/public/2021-02/Lite%20Albumy%20rozkladowka.jpg?itok=OygozR5c'] },
 { key:'fotoobraz', title:'Fotoobraz nPhoto Wall Decor 40×60 cm', category:'wall-decor',
  description:'Twoje zdjęcie na płótnie canvas naciągniętym na sosnową ramę. Wariant startowy oferty: 40×60 cm, rama o grubości 2 cm, zadrukowane krawędzie. Fotograf przygotuje wybrany kadr do druku. Zdjęcia prezentują przykładowe fotoobrazy, nie gotowy projekt z Twojej galerii.',
  source:'https://nphoto.com/pl/wall-decor/fotoobraz', minPhotos:1, maxPhotos:1, deliveryMethods:['courier'],
  image:'https://nphoto.com/sites/default/files/2019-04/fotoobraz-obraz-naciagany-na-rame-canvas-dla-fotografa-nphoto.jpg',
  previewImages:['https://nphoto.com/sites/default/files/2019-04/fotoobraz-obraz-naciagany-na-rame-canvas-dla-fotografa-nphoto.jpg','https://nphoto.com/sites/default/files/2019-04/obraz-canvas-z-gruba-i-cienka-rama-drukowany-nphoto.jpg'] },
 { key:'kalendarz-basic', title:'Fotokalendarz Basic nPhoto A4+ · 2027', category:'calendar',
  description:'Kalendarz ścienny na 2027 rok. Wariant oferty: A4+ pion, 22,5×32 cm, papier półmatowy, metalowa sprężyna. Pierwsze wybrane zdjęcie trafia na okładkę; kolejne służą do przygotowania miesięcznych kart. Zawiera dodatkową kartę techniczną. Zdjęcie przedstawia przykładową realizację.',
  source:'https://nphoto.com/pl/fotokalendarze/fotokalendarz-basic', minPhotos:13, maxPhotos:13,
  image:'https://nphoto.com/sites/default/files/styles/max_1920_1080/public/2024-10/PL_Photo%20Calendar%20Basic.jpeg?itok=rYbQbSyd' },
 { key:'odbitki', title:'Odbitki nPhoto · Fuji Silk', category:'prints',
  description:'Odbitki na papierze fotograficznym Fuji Silk. Formaty 10×15, 13×18 i 15×21 cm dodają się do wspólnego cennika. Zdjęcie prezentacyjne pokazuje również opakowanie, które nie jest częścią oferty odbitek.',
  source:'https://nphoto.com/pl/odbitki-i-wydruki/odbitki', minPhotos:1, maxPhotos:1, printFormatIds:['nphoto-10x15-silk','nphoto-13x18-silk','nphoto-15x21-silk'],
  image:'https://nphoto.com/sites/default/files/styles/max_1920_1080/public/2023-06/ODBITKI%20%2B%20OPAKOWANIE%20NA%20ODBITKI%20V8.jpg?itok=cvdTQvy2' },
 { key:'odbitki-15x21', title:'Odbitki nPhoto 15×21 cm · Fuji Silk', category:'prints',
  description:'Odbitki na papierze Fuji Silk. Format handlowy 15×21 cm, rzeczywisty rozmiar 152×210 mm. Dla każdego zdjęcia wybierzesz osobną liczbę odbitek. Zdjęcie prezentacyjne pokazuje również opakowanie, które nie jest częścią oferty. Dodaje jeden format do wspólnego cennika, nie osobny album.',
  source:'https://nphoto.com/pl/odbitki-i-wydruki/odbitki', minPhotos:1, maxPhotos:1, printFormatIds:['nphoto-15x21-silk'],
  image:'https://nphoto.com/sites/default/files/styles/max_1920_1080/public/2023-06/ODBITKI%20%2B%20OPAKOWANIE%20NA%20ODBITKI%20V8.jpg?itok=cvdTQvy2' },
];
export const nphotoPrintSizes = [
 {id:'nphoto-10x15-silk',label:'10×15 cm',widthMm:101,heightMm:152,paper:'Fuji Silk'},
 {id:'nphoto-13x18-silk',label:'13×18 cm',widthMm:127,heightMm:178,paper:'Fuji Silk'},
 {id:'nphoto-15x21-silk',label:'15×21 cm',widthMm:152,heightMm:210,paper:'Fuji Silk'},
];
