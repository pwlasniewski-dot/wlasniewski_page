/** Verified against nPhoto's product pages on 2026-09-13.
 * These are editable offer starters, never supplier prices or automatic supplier orders.
 * Product mockups are provided by nPhoto for photographers at the source below.
 */
export const NPHOTO_MEDIA_SOURCE = 'https://nphoto.com/pl/strefa-klienta/zdjecia-do-pobrania';
export const nphotoStarters = [
 { key:'harmonijka', title:'Harmonijka nPhoto 8×8 cm', category:'accordion',
  description:'Mały, rozkładany album w aksamitnej oprawie V6. Wariant oferty: 8×8 cm, 12 stron, 12 wybranych zdjęć. Pierwsze zdjęcie rozpoczyna projekt. Projekt przygotowuje fotograf.',
  source:'https://nphoto.com/pl/harmonijka', minPhotos:12, maxPhotos:12,
  image:'https://nphoto.com/sites/default/files/styles/max_1920_1080/public/2023-06/HARMONIJKA%20V6.jpg?itok=AtolNYO_' },
 { key:'fotoalbum-pro', title:'Fotoalbum PRO nPhoto 20×20 cm', category:'album',
  description:'Fotoalbum otwierany na płasko, ze sztywnymi rozkładówkami. Wariant oferty: 20×20 cm, 10 rozkładówek, papier Fuji Silk, aksamitna oprawa V11. Wybierz 20 zdjęć do projektu przygotowywanego przez fotografa.',
  source:'https://nphoto.com/pl/fotoalbumy/fotoalbum-pro', minPhotos:20, maxPhotos:20,
  image:'https://nphoto.com/sites/default/files/styles/max_1920_1080/public/2023-06/FOTOALBUM%20PRO%20V11.jpg?itok=Kdm_g_2R' },
 { key:'kalendarz-basic', title:'Fotokalendarz Basic nPhoto A4+ · 2027', category:'calendar',
  description:'Kalendarz ścienny na 2027 rok. Wariant oferty: A4+ pion, 22,5×32 cm, papier półmatowy, metalowa sprężyna. Wybierz 13 zdjęć: pierwsze na okładkę i po jednym na każdy miesiąc. Zawiera dodatkową kartę techniczną. Zdjęcie przedstawia przykładową realizację.',
  source:'https://nphoto.com/pl/fotokalendarze/fotokalendarz-basic', minPhotos:13, maxPhotos:13,
  image:'https://nphoto.com/sites/default/files/styles/max_1920_1080/public/2024-10/PL_Photo%20Calendar%20Basic.jpeg?itok=rYbQbSyd' },
 { key:'odbitki', title:'Odbitki nPhoto · Fuji Silk', category:'prints',
  description:'Odbitki na papierze fotograficznym Fuji Silk. Formaty 10×15, 13×18 i 15×21 cm dodają się do wspólnego cennika. Zdjęcie prezentacyjne pokazuje również opakowanie, które nie jest częścią oferty odbitek.',
  source:'https://nphoto.com/pl/odbitki-i-wydruki/odbitki', minPhotos:1, maxPhotos:1,
  image:'https://nphoto.com/sites/default/files/styles/max_1920_1080/public/2023-06/ODBITKI%20%2B%20OPAKOWANIE%20NA%20ODBITKI%20V8.jpg?itok=cvdTQvy2' },
] as const;
export const nphotoPrintSizes = [
 {id:'nphoto-10x15-silk',label:'10×15 cm',widthMm:101,heightMm:152,paper:'Fuji Silk'},
 {id:'nphoto-13x18-silk',label:'13×18 cm',widthMm:127,heightMm:178,paper:'Fuji Silk'},
 {id:'nphoto-15x21-silk',label:'15×21 cm',widthMm:152,heightMm:210,paper:'Fuji Silk'},
];
