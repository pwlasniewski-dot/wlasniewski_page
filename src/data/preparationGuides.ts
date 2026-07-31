import type { PoseGuideCard, PreparationGuideTip } from '@/types/preparation-guide';

const pose = (
    id: string,
    title: string,
    purpose: string,
    steps: string,
    body: string,
    variant: string,
    mistake: string,
    mobility: string,
    imageAlt: string,
    image?: string,
): PoseGuideCard => ({
    id, title, purpose, steps: steps.split(';').map((item) => item.trim()), body,
    variant, mistake, mobility, imageAlt, image,
});

export const POSE_GUIDE_CARDS: PoseGuideCard[] = [
    pose('P01', 'Miękki skos', 'Swobodny portret solo; każda osoba, pozycja stojąca.', 'Ustaw ciało lekko bokiem; wybierz stabilne podparcie; przenieś ciężar na wygodniejszą stronę; zrób wydech', 'Dłonie mają lekkie zadanie, barki są swobodne, a twarz wraca częściowo do aparatu.', 'Przy ścianie albo w siadzie z lekkim skrętem tułowia.', 'Usztywnienie całej sylwetki → porusz delikatnie palcami i wykonaj spokojny wydech.', 'Bez przenoszenia ciężaru można zmienić tylko kąt tułowia lub aparatu.', 'Osoba ustawiona lekko bokiem do aparatu, z rozluźnionymi barkami i stabilnym podparciem.', '/images/client-guides/poses/p01-miekki-skos.webp'),
    pose('P02', 'Stabilny siad', 'Naturalny portret w domu lub studiu; osoby preferujące siedzenie.', 'Usiądź na wygodnej części siedziska; znajdź stabilne podparcie; zostaw przestrzeń między barkami a uszami; skieruj tułów lekko po skosie', 'Dłonie luźno na udach lub podłokietniku, barki miękkie, wzrok do aparatu albo poza kadr.', 'Pełne oparcie pleców lub pozycja na wózku.', 'Zapadanie się w niewygodnej pozycji → oprzyj się; aparat dopasujemy do Ciebie.', 'Wysokość i rodzaj siedziska dobierasz Ty; transfer nie jest wymagany.', 'Osoba siedzi stabilnie, z podpartym ciałem, dłońmi opartymi swobodnie i tułowiem lekko po skosie.', '/images/client-guides/poses/p02-stabilny-siad.webp'),
    pose('P03', 'Krok i oddech', 'Lekki, dynamiczny portret; solo, para lub rodzina.', 'Wybierz bezpieczny odcinek; rusz wolno; patrz przed siebie lub na bliską osobę; zatrzymaj się dopiero na prośbę fotografa', 'Dłonie poruszają się naturalnie, barki nie są cofane na siłę, a głowa podąża za wzrokiem.', 'Ruch w miejscu, kołysanie tułowia lub sam ruch dłoni.', 'Przyspieszanie i patrzenie pod nogi przez cały czas → zwolnij; wybierzemy równy fragment podłoża.', 'Dowolny bezpieczny sposób przemieszczania; ruch aparatu może zastąpić ruch osoby.', 'Dwie fazy spokojnego kroku do przodu, z naturalnym ruchem dłoni i wzrokiem skierowanym przed siebie.', '/images/client-guides/poses/p03-krok-i-oddech.webp'),
    pose('P04', 'Lekki detal', 'Nadaje dłoniom proste zadanie; portret solo.', 'Wybierz mankiet, kołnierz lub biżuterię; dotknij lekko; rozluźnij pozostałe palce; po chwili puść', 'Nadgarstek pozostaje neutralny, bark po stronie dłoni opuszczony, wzrok na detal albo poza kadr.', 'Poprawienie włosów, okularów lub paska torby.', 'Mocne zaciskanie materiału → zmniejsz siłę do samego kontaktu.', 'Detal można położyć bliżej dłoni lub oprzeć przedramię.', 'Rozluźniona dłoń lekko dotyka mankietu, a palce pozostają miękkie.', '/images/client-guides/poses/p04-lekki-detal.webp'),
    pose('P05', 'Dłoń oparta', 'Spokojna pozycja siedząca; każda osoba.', 'Oprzyj przedramię na udzie lub podłokietniku; pozwól dłoni opaść; rozdziel lekko palce; zmieniaj punkt oparcia między ujęciami', 'Nie naciskaj na palce; bark jest swobodny, a głowa pozostaje w neutralnej pozycji.', 'Obie dłonie osobno na udach albo jedna na drugiej bez ściskania.', 'Dociskanie dłoni do twarzy lub nogi → potraktuj ją jak lekkie podparcie.', 'Poduszka lub blat może podnieść punkt podparcia.', 'Osoba siedząca opiera przedramię na udzie, a rozluźniona dłoń swobodnie opada.', '/images/client-guides/poses/p05-dlon-oparta.webp'),
    pose('P06', 'Dłonie w ruchu', 'Naturalny gest; solo, pary i rodziny.', 'Zacznij z rękami swobodnie; wykonaj wolny krok lub gest; popraw element ubrania; wróć do pozycji wyjściowej', 'Palce są miękkie, barki podążają za ruchem, a wzrok za gestem lub do bliskiej osoby.', 'Przesuwanie dłoni po oparciu, materiale albo kole wózka.', 'Powtarzanie szybkiego gestu → zwolnij ruch do połowy zwykłego tempa.', 'Gest może być minimalny i wykonany tylko w dostępnym zakresie.', 'Trzy etapy wolnego, swobodnego gestu dłoni podczas ruchu.', '/images/client-guides/poses/p06-dlonie-w-ruchu.webp'),
    pose('P07', 'Wydech', 'Zmniejsza widoczne napięcie; każda osoba.', 'Znajdź podparcie; weź zwykły wdech; przy wydechu pozwól barkom opaść; pozostań w wygodnym zakresie', 'Dłonie są rozluźnione, barki bez wymuszonego cofania, głowa neutralnie.', 'Siedząc z podpartymi łokciami.', 'Przesadne opuszczanie barków → wróć do naturalnego poziomu i tylko przestań je unosić.', 'Nie wymaga ruchu kończyn; świadomą pracę oddechem można pominąć.', 'Porównanie napiętych i swobodnie opuszczonych barków podczas wygodnego wydechu.', '/images/client-guides/poses/p07-wydech.webp'),
    pose('P08', 'Jeden bark bliżej', 'Tworzy głębię w portrecie; solo i para.', 'Ustaw tułów po skosie; przesuń jeden bark minimalnie w stronę aparatu; utrzymaj wygodne biodra; wróć twarzą do światła', 'Dłonie przy tułowiu bez ściskania, barki na różnych planach, broda swobodnie.', 'Aparat obchodzi nieruchomą osobę i tworzy skos perspektywą.', 'Unoszenie bliższego barku do ucha → zwiększ skos tułowia, nie wysokość barku.', 'Bez skrętu klienta; ustawienie aparatu zapewnia ten sam efekt.', 'Tułów ustawiony po skosie, z jednym barkiem nieco bliżej aparatu.', '/images/client-guides/poses/p08-jeden-bark-blizej.webp'),
    pose('P09', 'Obrót za spojrzeniem', 'Łączy barki z naturalnym ruchem; portret w ruchu.', 'Spójrz w bok; pozwól barkom lekko podążyć; wróć wzrokiem; zatrzymaj się w wygodnym momencie', 'Ręce podążają za tułowiem, barki obracają się miękko, głowa rozpoczyna albo kończy ruch.', 'Sam ruch wzroku i niewielkie przesunięcie barku.', 'Gwałtowny obrót → wykonaj ruch powoli, bez sięgania do granicy zakresu.', 'Obrót aparatu lub światła zastępuje obrót ciała.', 'Kolejne etapy łagodnego obrotu: najpierw wzrok, potem głowa i barki.', '/images/client-guides/poses/p09-obrot-za-spojrzeniem.webp'),
    pose('P10', 'Wzrok wraca do aparatu', 'Naturalny moment kontaktu; portret solo.', 'Spójrz poza kadr; zrób wydech; powoli wróć wzrokiem do aparatu; nie zatrzymuj mimiki na siłę', 'Dłonie mają podparcie, barki są miękkie, głowa może pozostać lekko bokiem.', 'Wzrok wraca do bliskiej osoby, nie do obiektywu.', 'Szerokie, nieruchome spojrzenie → mrugnij i wróć wzrokiem po wydechu.', 'Pozycja ciała pozostaje bez zmian.', 'Głowa pozostaje lekko bokiem, a wzrok stopniowo wraca w stronę aparatu.', '/images/client-guides/poses/p10-wzrok-wraca-do-aparatu.webp'),
    pose('P11', 'Spojrzenie przez ramię', 'Spokojny portret z głębią; stojąc lub siedząc.', 'Ustaw ciało częściowo bokiem; skieruj wzrok za siebie; obróć głowę tylko w wygodnym zakresie; wróć, jeśli czujesz napięcie', 'Dłonie są swobodne, bliższy bark niski, szyja bez maksymalnego skrętu.', 'Aparat zmienia pozycję, a osoba wykonuje minimalny obrót oczu.', 'Skręt do granicy ruchu → zmniejsz obrót; fotograf podejdzie bardziej z boku.', 'Pełny efekt może powstać przez zmianę ustawienia aparatu.', 'Osoba ustawiona bokiem patrzy łagodnie w stronę aparatu, bez mocnego skręcania szyi.', '/images/client-guides/poses/p11-spojrzenie-przez-ramie.webp'),
    pose('P12', 'Rozmowa i śmiech', 'Autentyczna mimika; para, rodzina, grupy.', 'Zwróć się do bliskiej osoby; powiedz krótkie zdanie lub wspomnij wspólną historię; posłuchaj odpowiedzi; pozwól reakcji wybrzmieć', 'Naturalny gest jest mile widziany; barki zwrócone do rozmówcy, kontakt wzrokowy nie jest obowiązkowy.', 'Wspólne patrzenie w jeden punkt albo słuchanie fotografa.', 'Wymuszony śmiech → zamień zadanie na zwykłą rozmowę lub ciszę.', 'Pełna pozycja siedząca; komunikacja może być niewerbalna.', 'Dwie osoby zwrócone ku sobie podczas swobodnej rozmowy, z naturalną mimiką.', '/images/client-guides/poses/p12-rozmowa-i-smiech.webp'),
    pose('P13', 'Bezpieczna baza', 'Portret dziecka przy opiekunie.', 'Dziecko wybiera odległość; opiekun pozostaje obok; proponujemy spojrzenie lub mały gest; po chwili zmieniamy zadanie', 'Bez chwytania; opiekun rozluźnia barki, twarze mogą patrzeć na siebie.', 'Wspólny siad, wózek lub dziecko obok zamiast na rękach.', 'Ustawianie dziecka rękami → opisz zabawę i pozwól mu wybrać pozycję.', 'Wybór stabilnego, znanego podparcia; brak obowiązkowego transferu.', 'Dziecko pozostaje w wybranej odległości od opiekuna, który daje mu spokojne wsparcie.', '/images/client-guides/poses/p13-bezpieczna-baza.webp'),
    pose('P14', 'Cichy spacer', 'Naturalny ruch dziecka lub rodzeństwa.', 'Wybierz krótki bezpieczny odcinek; idźcie wolno; spróbujcie zrobić najcichsze kroki; zatrzymajcie się przy umówionym punkcie', 'Dłonie wolne lub za zgodą połączone, barki naturalne, wzrok na trasę.', 'Poruszanie się w miejscu, kołysanie lub ruch kół.', 'Wyścig → zmieniamy zadanie na wolne tempo bez zwycięzcy.', 'Trasa i tempo odpowiadają najwolniejszej osobie.', 'Dziecko porusza się spokojnie po krótkiej, bezpiecznej trasie do wyznaczonego punktu.', '/images/client-guides/poses/p14-cichy-spacer.webp'),
    pose('P15', 'Pokaż skarb', 'Angażuje dziecko bez wymuszania mimiki.', 'Dziecko wybiera bezpieczny przedmiot; pokazuje go opiekunowi lub fotografowi; opowiada albo gestem wskazuje detal; odkłada, gdy chce', 'Chwyt jest dopasowany do dziecka, barki bez korekty, wzrok na przedmiot lub osobę.', 'Wskazanie elementu otoczenia bez trzymania przedmiotu.', 'Poprawianie sposobu trzymania → zmień kadr, nie naturalny gest dziecka.', 'Przedmiot w zasięgu; możliwe wskazanie wzrokiem lub komunikacją wspomagającą.', 'Dziecko pokazuje wybrany przedmiot opiekunowi i kieruje na niego uwagę.', '/images/client-guides/poses/p15-pokaz-skarb.webp'),
    pose('P16', 'Rodzinny półokrąg', 'Czytelny portret całej rodziny.', 'Ustawcie się w luźnym łuku; najwyższe osoby nie muszą stać z tyłu; zostawcie widoczne twarze; wybierzcie kontakt lub niewielki odstęp', 'Dłonie mają cel, barki kierują się lekko do środka, wzrok do aparatu albo na bliskich.', 'Półokrąg siedzący lub mieszany.', 'Sztywny równy rząd → przesuńcie co drugą osobę odrobinę w przód lub tył.', 'Najpierw wybieramy miejsce osoby z ograniczoną mobilnością, potem dostawiamy pozostałych.', 'Rodzina ustawiona w luźnym półokręgu, tak aby każda twarz była widoczna.', '/images/client-guides/poses/p16-rodzinny-polokrag.webp'),
    pose('P17', 'Wspólny punkt', 'Pokazuje relację bez patrzenia w obiektyw.', 'Wybierzcie osobę lub detal w centrum uwagi; skierujcie ku niemu wzrok; pozwólcie na rozmowę; potem jedna osoba może spojrzeć do aparatu', 'Dłonie pozostają naturalne, tułowie tworzą otwarty układ, głowy nie nachodzą na siebie w kadrze.', 'Wspólne oglądanie albumu lub elementu otoczenia.', 'Zasłanianie najmniejszej osoby → fotograf zmienia wysokość albo prosi o mały odstęp.', 'Punkt uwagi umieszczamy w dostępnym polu widzenia.', 'Członkowie rodziny kierują uwagę ku wspólnemu punktowi, pozostając w otwartym układzie.', '/images/client-guides/poses/p17-wspolny-punkt.webp'),
    pose('P18', 'Spacer razem', 'Rodzinne ujęcie w ruchu.', 'Ustawcie tempo najwolniejszej osoby; idźcie szerzej niż jednym rzędem; rozmawiajcie; nie zatrzymujcie się przy każdym zdjęciu', 'Kontakt dłoni tylko za zgodą, barki podążają za ruchem, wzrok przed siebie lub na bliskich.', 'Wspólne kołysanie, obrót w miejscu lub ruch aparatu.', 'Ciągnięcie dziecka lub osoby wolniejszej → zwolnijcie i skróćcie trasę.', 'Równy teren, brak cofania; każdy używa własnego sposobu poruszania się.', 'Rodzina porusza się razem spokojnym tempem, w luźnym układzie i bez ciągnięcia kogokolwiek.', '/images/client-guides/poses/p18-spacer-razem.webp'),
    pose('P19', 'Obok, nie na baczność', 'Naturalny portret pary.', 'Stańcie lub usiądźcie obok; ustawcie ciała lekko ku sobie lub równolegle; wybierzcie kontakt albo odstęp; spójrzcie w aparat', 'Dłonie są swobodne, barki nie muszą być równe, głowy pozostają w wygodnej odległości.', 'Jedna osoba odrobinę bliżej aparatu.', 'Sztywna symetria → jedna osoba zmienia kąt tułowia albo punkt podparcia.', 'Pełna wersja siedząca; aparat wyrównuje różne wysokości.', 'Dwie osoby ustawione swobodnie obok siebie, lekko zwrócone ku sobie, z opcjonalnym kontaktem dłoni.', '/images/client-guides/poses/p19-obok-nie-na-bacznosc.webp'),
    pose('P20', 'Punkt kontaktu', 'Subtelnie podkreśla relację.', 'Uzgodnijcie rodzaj dotyku; wybierzcie jeden punkt — dłoń, ramię lub plecy; utrzymajcie lekki kontakt; oddychajcie swobodnie', 'Dłonie bez ściskania, barki w wygodnym ustawieniu, wzrok na siebie lub poza kadr.', 'Bez dotyku, z dłońmi blisko siebie lub wspólnym przedmiotem.', 'Wiele wymuszonych punktów kontaktu → zostawcie jeden albo żaden.', 'Kontakt w miejscu dostępnym i zaakceptowanym przez obie osoby.', 'Para z jednym lekkim, uzgodnionym punktem kontaktu; obok pokazano wariant bez dotyku.', '/images/client-guides/poses/p20-punkt-kontaktu.webp'),
    pose('P21', 'Spacer i rozmowa', 'Swobodne zdjęcia pary w ruchu.', 'Wybierzcie wolne tempo; idźcie obok siebie; rozmawiajcie o czymś zwyczajnym; zmieniajcie wzrok między trasą a sobą', 'Dłonie połączone tylko jeśli wygodne, barki naturalne, głowy bez ciągłego zwrotu.', 'Ruch w miejscu lub rozmowa w siadzie.', 'Stałe patrzenie na siebie podczas chodzenia → patrzcie też na trasę; bezpieczeństwo jest pierwsze.', 'Równe podłoże i tempo wolniejszej osoby; ruch aparatu jako alternatywa.', 'Para idzie obok siebie spokojnym tempem, rozmawiając i spoglądając na trasę.', '/images/client-guides/poses/p21-spacer-i-rozmowa.webp'),
    pose('P22', 'Spokojny skos', 'Klasyczny portret dla każdej osoby wybierającej tę estetykę.', 'Ustaw tułów lekko bokiem; wybierz stabilne podparcie; jednej dłoni daj zadanie; wróć wzrokiem do światła', 'Palce są miękkie, bliższy bark swobodny, głowa bez mocnego przechyłu.', 'Siad z tym samym lekkim skosem.', 'Mocne wyginanie sylwetki → zmniejsz zakres do wygodnej asymetrii.', 'Kąt tworzy aparat, jeśli obrót ciała jest niedostępny.', 'Osoba w stabilnym, lekkim skosie, z jedną dłonią opartą i swobodną linią barków.', '/images/client-guides/poses/p22-spokojny-skos.webp'),
    pose('P23', 'Portret z oparciem', 'Elegancki, komfortowy portret siedzący.', 'Wybierz wygodne siedzisko; oprzyj ciało w potrzebnym zakresie; ustaw dłonie osobno; spójrz w aparat lub w bok', 'Przedramiona podparte, barki swobodne, twarz w kierunku światła.', 'Wózek, ławka, wysokie krzesło lub podparcie stojące.', 'Odrywanie pleców mimo potrzeby podparcia → użyj oparcia; fotograf dopasuje kadr.', 'Bez transferu; pozycja działa na aktualnym siedzisku.', 'Osoba korzysta z wygodnego oparcia, z podpartymi przedramionami i swobodnymi barkami.', '/images/client-guides/poses/p23-portret-z-oparciem.webp'),
    pose('P24', 'Obrót z tkaniną', 'Dynamiczny portret z ruchem ubrania.', 'Sprawdź wolną przestrzeń; chwyć lekko bezpieczny fragment tkaniny; wykonaj mały obrót lub ruch dłoni; zatrzymaj się stabilnie', 'Chwyt jest lekki, bark podąża za ruchem, wzrok w kierunku obrotu.', 'Poruszenie samej tkaniny w siadzie; asystent może poruszyć materiał za zgodą.', 'Szybki obrót lub zaczepianie tkaniny → zmniejsz ruch i sprawdź podłoże.', 'Bez obrotu ciała; ruch dłoni lub materiału daje efekt dynamiki.', 'Osoba wykonuje niewielki, bezpieczny ruch tkaniną przy stabilnym podparciu.', '/images/client-guides/poses/p24-obrot-z-tkanina.webp'),
    pose('P25', 'Luźna kieszeń', 'Swobodny portret stojący.', 'Stań stabilnie pod lekkim kątem; włóż część dłoni do kieszeni bez napinania materiału; drugiej dłoni daj zadanie; zrób wydech', 'Kciuk lub część dłoni może zostać widoczna, barki swobodne, wzrok do aparatu lub poza kadr.', 'Dłoń oparta o bok ubrania, jeśli kieszeń jest niewygodna.', 'Obie dłonie głęboko schowane i uniesione barki → wyjmij jedną dłoń i rozluźnij chwyt.', 'Wersja siedząca lub z ręką opartą.', 'Osoba stoi lekko po skosie, z jedną dłonią luźno przy kieszeni i drugą widoczną.', '/images/client-guides/poses/p25-luzna-kieszen.webp'),
    pose('P26', 'Przedramiona podparte', 'Spokojny portret siedzący.', 'Usiądź stabilnie; oprzyj jedno lub oba przedramiona; pozostaw dłonie luźne; skieruj tułów lekko ku światłu', 'Dłonie nie są splecione mocno, barki bez wypychania, głowa neutralnie.', 'Blat, podłokietnik, własne siedzisko albo pozycja stojąca z oparciem.', 'Zaciskanie splecionych dłoni → rozdziel je lub połóż jedną na podparciu.', 'Korzystamy z aktualnej pozycji i dostępnego podparcia.', 'Osoba siedzi stabilnie z luźno podpartymi przedramionami i rozluźnionymi dłońmi.', '/images/client-guides/poses/p26-przedramiona-podparte.webp'),
    pose('P27', 'Poprawienie marynarki', 'Formalny portret z mikro-ruchem.', 'Dotknij klapy, mankietu lub brzegu ubrania; wykonaj wolny gest; zrób krok albo zostań w miejscu; puść materiał', 'Lekki chwyt, barki podążają za ruchem, wzrok w wybranym kierunku.', 'Poprawienie koszuli, swetra, zegarka lub innego własnego elementu.', 'Ciągłe szarpanie ubrania → jeden spokojny gest i rozluźnienie dłoni.', 'Ruch tylko jednej dostępnej dłoni; możliwość pełnego siadu.', 'Osoba wykonuje spokojny gest poprawienia klapy ubrania, bez zaciskania dłoni.', '/images/client-guides/poses/p27-poprawienie-marynarki.webp'),
    pose('P28', 'Reset napięcia', 'Pomaga wrócić do swobody po dłuższym pozowaniu.', 'Przerwij pozycję; porusz dłońmi w wygodny sposób; zrób zwykły wydech; wróć do stabilnego ustawienia', 'Dłonie odpoczywają, barki wracają naturalnie; mrugnij i rozluźnij szczękę.', 'Krótka przerwa bez ruchu albo zmiana tematu rozmowy.', 'Próba utrzymania uśmiechu → odłóż pozę i zacznij od neutralnej twarzy.', 'Reset może być wyłącznie mentalną przerwą; ruch nie jest wymagany.', 'Trzy etapy resetu: przerwa, spokojny wydech i powrót do wygodnego ustawienia.', '/images/client-guides/poses/p28-reset-napiecia.webp'),
    pose('P29', 'Dłonie dostają zadanie', 'Rozwiązuje napięcie lub przypadkowe chowanie dłoni.', 'Zauważ napięcie bez oceny; wybierz jedno proste zadanie; wykonaj je lekko; zmień zadanie po kilku ujęciach', 'Palce są miękkie, bark po stronie ruchu opuszczony, wzrok może śledzić gest.', 'Pełne podparcie dłoni zamiast gestu.', 'Dokładanie wielu instrukcji → tylko jedno zadanie na raz.', 'Zadanie dopasowane do dostępnego chwytu i zakresu.', 'Trzy proste zadania dla dłoni: lekkie oparcie, dotknięcie ubrania i swobodny gest.', '/images/client-guides/poses/p29-dlonie-dostaja-zadanie.webp'),
    pose('P30', 'Zmieniamy układ, nie osobę', 'Poprawia zasłoniętą twarz, relację lub niewygodny układ grupy.', 'Zatrzymaj grupę; nazwij element kadru, nie osobę; przesuń aparat albo jedną pozycję; sprawdź ponownie komfort', 'Nie dodajemy nowych wymagań bez potrzeby; zachowujemy naturalną relację i wzrok.', 'Zmiana wysokości aparatu, miejsca siedzenia lub kolejności osób.', 'Wiele równoczesnych komend → jedna mała zmiana i ponowna ocena.', 'W pierwszej kolejności porusza się fotograf lub osoby bez ograniczeń.', 'Fotograf zmienia ustawienie aparatu, dzięki czemu twarze grupy są widoczne bez przestawiania osoby wymagającej podparcia.', '/images/client-guides/poses/p30-zmieniamy-uklad-nie-osobe.webp'),
];

export const WARDROBE_CHECKLISTS = [
    {
        title: '7 dni przed sesją',
        items: [
            'Potwierdź miejsce, godzinę i charakter sesji.',
            'Wybierz paletę 2–4 współgrających kolorów.',
            'Ułóż pełne zestawy wszystkich osób obok siebie.',
            'Przymierz ubrania w ruchu i w świetle dziennym.',
            'Przygotuj najwyżej jedną kompletną alternatywę.',
        ],
    },
    {
        title: '1 dzień przed sesją',
        items: [
            'Ubrania są czyste, suche i odświeżone.',
            'Zestawy obejmują bieliznę, buty i dodatki.',
            'Kieszenie są opróżnione, a obuwie czyste.',
            'Zapasowy zestaw dla dziecka jest gotowy.',
            'Torba garderobiana stoi przy rzeczach do zabrania.',
        ],
    },
    {
        title: 'W dniu sesji',
        items: [
            'Sprawdź pogodę oraz ustalenia dotyczące miejsca.',
            'Zabierz zestawy, dodatki, obuwie i ubrania zapasowe.',
            'Zrób ostatnią kontrolę kieszeni, metek i zagnieceń.',
            'W plenerze zabierz wygodne obuwie do dojścia.',
            'Zostaw sobie czas, by dotrzeć bez pośpiechu.',
        ],
    },
];

export const WARDROBE_FALLBACK_TIPS: PreparationGuideTip[] = [
    { id: 'comfort', title: 'Zacznij od komfortu', content: 'Wybierz rzeczy, które dobrze leżą także w siadzie, ruchu i przy podnoszeniu rąk. Własny styl jest ważniejszy niż sztywna reguła.', image: '/images/client-guides/wardrobe/comfort.webp', imageAlt: 'Osoba w wygodnym zestawie z miękkim swetrem i luźnymi spodniami swobodnie porusza rękami.' },
    { id: 'palette', title: 'Koordynuj, nie kopiuj', content: 'Dla pary lub rodziny wybierz 2–4 współgrające kolory i podobny poziom formalności. Stroje nie muszą być identyczne.', image: '/images/client-guides/wardrobe/palette.webp', imageAlt: 'Rodzina w różnych, lecz skoordynowanych strojach w kolorach kremowym, szałwiowym i ciepłym brązie.' },
    { id: 'patterns', title: 'Wzory z umiarem', content: 'Jeden wyrazisty wzór może być dobrym punktem wyjścia. Bardzo drobne, gęste desenie warto wcześniej sprawdzić na zdjęciu.', image: '/images/client-guides/wardrobe/patterns.webp', imageAlt: 'Trzy osoby w skoordynowanych strojach; jeden wyrazisty wzór uzupełniają spokojne, gładkie ubrania.' },
    { id: 'layers', title: 'Warstwy pomagają', content: 'Sweter, marynarka lub szal pozwalają dopasować strój do temperatury i szybko zmienić charakter zdjęcia.', image: '/images/client-guides/wardrobe/layers.webp', imageAlt: 'Ten sam zestaw pokazany w wariantach z koszulą, kardiganem i szalem.' },
    { id: 'women', title: 'Dla kobiet', content: 'Wybierz fason, w którym swobodnie stoisz, siedzisz i poruszasz rękami. Sukienka, garnitur, spodnie lub dzianina są równie dobre — ważne, żeby strój był Twój i nie wymagał ciągłego poprawiania.', image: '/images/client-guides/wardrobe/women.webp', imageAlt: 'Trzy kobiety w wygodnych stylizacjach: sukience, garniturze oraz dzianinie ze spodniami.' },
    { id: 'men', title: 'Dla mężczyzn', content: 'Dobrze układająca się koszula, sweter, marynarka albo prosty T-shirt mogą wyglądać świetnie. Sprawdź długość rękawów i nogawek oraz to, czy kieszenie nie odkształcają ubrania.', image: '/images/client-guides/wardrobe/men.webp', imageAlt: 'Trzej mężczyźni w dobrze dopasowanych zestawach z koszulą, swetrem i prostym T-shirtem.' },
    { id: 'children', title: 'Dziecko przede wszystkim wygodnie', content: 'Wybierz znane, miękkie ubranie, które nie ogranicza ruchu. Spakuj kompletny zestaw zapasowy.', image: '/images/client-guides/wardrobe/children.webp', imageAlt: 'Dwoje dzieci w miękkich, skoordynowanych ubraniach pozwalających na swobodny ruch.' },
    { id: 'home', title: 'Sesja domowa', content: 'Sprawdzą się miękkie warstwy, bose stopy lub czyste domowe obuwie i kolory współgrające z wnętrzem. Unikaj rzeczy, które szeleszczą albo wymagają ostrożnego siedzenia.', image: '/images/client-guides/wardrobe/home.webp', imageAlt: 'Rodzina w miękkich, neutralnych warstwach dopasowanych kolorystycznie do jasnego domowego wnętrza.' },
    { id: 'outdoor', title: 'Sesja plenerowa', content: 'Dopasuj ubranie do temperatury i podłoża. Zabierz wygodne buty na dojście, dodatkową warstwę oraz ochronę przed chłodem, słońcem lub wilgocią.', image: '/images/client-guides/wardrobe/outdoor.webp', imageAlt: 'Para w praktycznych warstwowych strojach plenerowych w kolorach rdzawym, oliwkowym, kremowym i brązowym.' },
    {
        id: 'city',
        title: 'Sesja w mieście',
        content: 'Wśród betonu i szkła dobrze działają cieplejsze beże, karmel, granat oraz jeden wyraźny akcent, który oddzieli sylwetkę od chłodnego tła. Przy cegle wybierz kolory, które nie zleją się z rudymi tonami — sprawdzą się krem, oliwka, denim i przygaszony błękit. Zieleń miejska lubi naturalne, spokojne barwy, a przy neonach ogranicz liczbę mocnych kolorów w stroju, żeby światła miasta pozostały efektownym tłem, nie konkurencją.',
        image: '/images/client-guides/wardrobe/city.webp',
        imageAlt: 'Trzy miejskie stylizacje dobrane kolorystycznie do czerwonej cegły, szarego betonu oraz szkła i stali.',
    },
    { id: 'season', title: 'Pora roku', content: 'Wiosną i jesienią postaw na warstwy, latem na przewiewne materiały, a zimą na spójne okrycia wierzchnie. Komfort termiczny jest ważniejszy niż wybrana paleta.', image: '/images/client-guides/wardrobe/season.webp', imageAlt: 'Cztery warianty stroju na sesję: wiosenny, letni, jesienny i zimowy.' },
    { id: 'avoid', title: 'Czego lepiej unikać', content: 'Duże logotypy, neonowe akcenty, bardzo drobne kontrastowe wzory i pełne kieszenie mogą odciągać uwagę. Jeśli są częścią Twojego stylu, nie są zakazane — pokaż zestaw wcześniej fotografowi.', image: '/images/client-guides/wardrobe/avoid.webp', imageAlt: 'Porównanie rozpraszającego stroju z neonem, dużym znakiem i pełnymi kieszeniami ze spokojnym neutralnym zestawem.' },
    { id: 'black-white', title: 'Czerń, biel i mocne kolory', content: 'Możesz ich używać. Zamiast łączyć same skrajne kontrasty, dodaj kolor pośredni lub fakturę i sprawdź zestaw w świetle dziennym.', image: '/images/client-guides/wardrobe/black-white.webp', imageAlt: 'Stylizacje pokazujące czerń z kamelowym płaszczem, biel z beżem oraz bordowy akcent z grafitem.' },
    { id: 'fitting', title: 'Przymierz cały zestaw', content: 'Załóż jednocześnie ubranie, buty i dodatki. Usiądź, przejdź kilka kroków i unieś ręce — szybko zauważysz elementy, które krępują ruch lub wymagają poprawiania.', image: '/images/client-guides/wardrobe/fitting.webp', imageAlt: 'Ta sama osoba sprawdza pełny zestaw na stojąco, siedząco i z uniesionymi rękami.' },
    { id: 'packing', title: 'Spakuj pełne zestawy', content: 'Dodatki przypisz do konkretnych ubrań, buty zapakuj osobno, a delikatne elementy przewieź w pokrowcu.', image: '/images/client-guides/wardrobe/packing.webp', imageAlt: 'Dwa kompletne zestawy ubrań z osobno przygotowanymi butami, dodatkami i torbą.' },
];

export const WARDROBE_FALLBACK_PALETTES = [
    {
        id: 'warm-earth',
        name: 'Ciepła ziemia',
        description: 'Spokojne, ciepłe kolory do wnętrz i plenerów.',
        colors: [
            { name: 'Krem', hex: '#F3E8D5' },
            { name: 'Karmel', hex: '#B7794B' },
            { name: 'Terakota', hex: '#A9563F' },
            { name: 'Czekolada', hex: '#4E352F' },
        ],
    },
    {
        id: 'calm-nature',
        name: 'Spokojna natura',
        description: 'Zgaszone zielenie i neutralne beże.',
        colors: [
            { name: 'Szałwia', hex: '#A8B29A' },
            { name: 'Oliwka', hex: '#74785A' },
            { name: 'Piasek', hex: '#D8C7A6' },
            { name: 'Ecru', hex: '#F2EBDD' },
        ],
    },
    {
        id: 'cool-elegance',
        name: 'Chłodna elegancja',
        description: 'Granaty i szarości z łagodnym jasnym akcentem.',
        colors: [
            { name: 'Granat', hex: '#26354A' },
            { name: 'Stal', hex: '#718096' },
            { name: 'Gołębi', hex: '#B6C0CA' },
            { name: 'Perła', hex: '#ECE9E3' },
        ],
    },
    {
        id: 'muted-sunset',
        name: 'Przygaszony zachód',
        description: 'Ciepła, delikatna paleta bez jaskrawych kontrastów.',
        colors: [
            { name: 'Pudrowy róż', hex: '#D8AAA4' },
            { name: 'Morela', hex: '#D69A73' },
            { name: 'Śliwka', hex: '#765365' },
            { name: 'Wanilia', hex: '#F2DFBC' },
        ],
    },
    {
        id: 'forest-stone',
        name: 'Las i kamień',
        description: 'Głębsze odcienie do zielonych i miejskich plenerów.',
        colors: [
            { name: 'Las', hex: '#344C3D' },
            { name: 'Mech', hex: '#68745B' },
            { name: 'Kamień', hex: '#9A9388' },
            { name: 'Len', hex: '#D7CCBA' },
        ],
    },
    {
        id: 'by-water',
        name: 'Nad wodą',
        description: 'Miękkie błękity, piasek i ciepły brąz.',
        colors: [
            { name: 'Błękit', hex: '#9FB8C5' },
            { name: 'Morski', hex: '#547782' },
            { name: 'Piasek', hex: '#D9C7A2' },
            { name: 'Konjak', hex: '#9A623C' },
        ],
    },
];

export const WARDROBE_FALLBACK_FAQS = [
    { id: 'faq-1', question: 'Czy wszyscy muszą mieć takie same ubrania?', answer: 'Nie. Lepiej wybrać wspólną paletę i podobny poziom formalności, a każdej osobie zostawić własny fason i charakter.' },
    { id: 'faq-2', question: 'Czy mogę ubrać się na czarno?', answer: 'Tak. Czerń dobrze wygląda z fakturą i jaśniejszym lub cieplejszym elementem, który łagodzi kontrast.' },
    { id: 'faq-3', question: 'Czy biel jest dozwolona?', answer: 'Tak. Złamana biel, krem i ecru są łagodniejsze, ale czysta biel też może działać po sprawdzeniu jej z resztą zestawu.' },
    { id: 'faq-4', question: 'Czy wzory zawsze są złe?', answer: 'Nie. Jeden większy lub spokojny wzór może budować cały zestaw. Ostrożność warto zachować przy bardzo drobnych, kontrastowych deseniach.' },
    { id: 'faq-5', question: 'Ile zestawów zabrać?', answer: 'Najczęściej wystarczy jeden główny i najwyżej jeden kompletny zapasowy, wcześniej uzgodniony z fotografem.' },
    { id: 'faq-6', question: 'Co ubrać dziecku?', answer: 'Znane, miękkie ubranie, które nie ogranicza ruchu. Zabierz pełny zestaw zapasowy i nie wprowadzaj nowych, niewygodnych elementów tylko na zdjęcia.' },
    { id: 'faq-7', question: 'Co jeśli ktoś nie lubi proponowanej palety?', answer: 'Palety są inspiracją, nie obowiązkiem. Najważniejsze są komfort, własny styl i spójność całej grupy.' },
    { id: 'faq-8', question: 'Czy buty będą widoczne?', answer: 'Często tak, dlatego warto dopasować je do zestawu i oczyścić. W plenerze można dojść w wygodnym obuwiu i zmienić je na miejscu.' },
    { id: 'faq-9', question: 'Czy dodatki pomagają?', answer: 'Tak, jeśli nie wymagają ciągłego poprawiania. Szal, biżuteria, marynarka lub kapelusz mogą dać dłoniom naturalne zadanie.' },
    { id: 'faq-10', question: 'Co zrobić przy złej pogodzie?', answer: 'Zabierz warstwę ochronną i wygodne obuwie. Fotograf potwierdzi, czy zmieniamy godzinę, miejsce albo plan sesji.' },
    { id: 'faq-11', question: 'Czy mogę przesłać zdjęcie zestawów?', answer: 'Tak. Jedno zdjęcie wszystkich kompletnych zestawów ułożonych obok siebie ułatwia szybką ocenę kolorów i formalności.' },
    { id: 'faq-12', question: 'Co jeśli niczego nie zdążę kupić?', answer: 'Nie musisz kupować nowych rzeczy. Najpierw sprawdź to, co już masz — dobrze dopasowany, wygodny zestaw zwykle działa lepiej niż ubranie kupione w pośpiechu.' },
];
