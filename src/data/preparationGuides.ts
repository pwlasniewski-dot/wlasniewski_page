import type { PoseGuideCard, PreparationGuideTip } from '@/types/preparation-guide';

const pose = (
    id: string,
    title: string,
    purpose: string,
    steps: string,
    body: string,
    variant: string,
    mobility: string,
    imageAlt: string,
    image?: string,
): PoseGuideCard => ({
    id, title, purpose, steps: steps.split(';').map((item) => item.trim()), body,
    variant, mobility, imageAlt, image,
});

export const POSE_GUIDE_CARDS: PoseGuideCard[] = [
    pose('P01', 'Miękki skos', 'Swobodny portret jednej osoby na stojąco.', 'Stań lekko bokiem do aparatu; oprzyj ciężar na wygodniejszej nodze; opuść barki; spójrz spokojnie w stronę aparatu', 'Nie musisz stać nieruchomo. Mały ruch dłoni lub spokojny wydech od razu dodaje naturalności.', 'Możesz oprzeć się o ścianę albo usiąść i zachować ten sam lekki skos.', 'Jeśli nie chcesz obracać ciała, fotograf ustawi aparat pod odpowiednim kątem.', 'Osoba ustawiona lekko bokiem do aparatu, z rozluźnionymi barkami i stabilnym podparciem.', '/images/client-guides/poses/p01-miekki-skos.webp'),
    pose('P02', 'Stabilny siad', 'Naturalny portret na siedząco w domu lub studiu.', 'Wybierz krzesło lub miejsce, na którym siedzisz wygodnie i pewnie; oprzyj stopy lub nogi; rozluźnij barki; ustaw tułów lekko po skosie', 'Połóż dłonie swobodnie na udach albo podłokietniku. Możesz patrzeć w aparat lub lekko w bok.', 'Możesz oprzeć plecy albo zostać na swoim wózku czy ulubionym krześle.', 'Zostań w miejscu, w którym jest Ci wygodnie. Fotograf dopasuje wysokość aparatu i kadr.', 'Osoba siedzi stabilnie, z podpartym ciałem, dłońmi opartymi swobodnie i tułowiem lekko po skosie.', '/images/client-guides/poses/p02-stabilny-siad.webp'),
    pose('P03', 'Krok i oddech', 'Lekki portret w ruchu dla jednej osoby, pary lub rodziny.', 'Wybierz równy, spokojny odcinek; rusz w swoim tempie; patrz przed siebie lub na bliską osobę; zatrzymaj się na znak fotografa', 'Nie myśl o każdym kroku. Ręce mogą poruszać się naturalnie, a barki pozostać swobodne.', 'Możesz poruszać się w miejscu, lekko kołysać lub wykonać sam gest dłonią.', 'Wybierz taki ruch, przy którym czujesz się pewnie. Podobny efekt może też stworzyć poruszający się fotograf.', 'Dwie fazy spokojnego kroku do przodu, z naturalnym ruchem dłoni i wzrokiem skierowanym przed siebie.', '/images/client-guides/poses/p03-krok-i-oddech.webp'),
    pose('P04', 'Lekki detal', 'Prosty sposób na naturalne ułożenie dłoni.', 'Wybierz mankiet, kołnierz lub biżuterię; dotknij go lekko; rozluźnij palce; po chwili puść', 'Delikatny gest wygląda lepiej niż mocne trzymanie materiału. Wzrok może podążyć za dłonią.', 'Możesz poprawić włosy, okulary albo pasek torby.', 'Jeśli wolisz, oprzyj przedramię i przysuń wybrany detal bliżej dłoni.', 'Rozluźniona dłoń lekko dotyka mankietu, a palce pozostają miękkie.', '/images/client-guides/poses/p04-lekki-detal.webp'),
    pose('P05', 'Dłoń oparta', 'Spokojne ułożenie dłoni podczas zdjęcia na siedząco.', 'Oprzyj przedramię na udzie lub podłokietniku; pozwól dłoni opaść; lekko rozsuń palce; po kilku zdjęciach zmień stronę', 'Dłoń ma tylko odpoczywać. Nie dociskaj jej mocno do twarzy ani nogi.', 'Możesz położyć obie dłonie osobno na udach albo jedną luźno na drugiej.', 'Poduszka, blat lub podłokietnik mogą dać wygodniejsze podparcie.', 'Osoba siedząca opiera przedramię na udzie, a rozluźniona dłoń swobodnie opada.', '/images/client-guides/poses/p05-dlon-oparta.webp'),
    pose('P06', 'Dłonie w ruchu', 'Naturalny gest dla jednej osoby, pary lub rodziny.', 'Zacznij z rękami swobodnie; wykonaj powolny gest; popraw ubranie lub dotknij bliskiej osoby; pozwól dłoniom znów odpocząć', 'Wolny, prosty ruch wygląda naturalnie i nie wymaga zapamiętywania pozy.', 'Możesz przesunąć dłoń po oparciu, materiale albo kole wózka.', 'Wystarczy bardzo mały gest jedną dłonią. Wybierz taki ruch, który jest dla Ciebie wygodny.', 'Trzy etapy wolnego, swobodnego gestu dłoni podczas ruchu.', '/images/client-guides/poses/p06-dlonie-w-ruchu.webp'),
    pose('P07', 'Spokojny wydech', 'Pomaga rozluźnić twarz i barki przed zdjęciem.', 'Znajdź wygodne podparcie; weź zwykły wdech; zrób spokojny wydech; pozwól barkom opaść naturalnie', 'Nie trzeba oddychać głęboko ani pozować. Chodzi tylko o krótką chwilę spokoju.', 'Możesz wykonać to ćwiczenie na siedząco, z podpartymi rękami.', 'Jeśli skupianie się na oddechu Ci nie służy, zrobimy po prostu krótką przerwę.', 'Porównanie napiętych i swobodnie opuszczonych barków podczas wygodnego wydechu.', '/images/client-guides/poses/p07-wydech.webp'),
    pose('P08', 'Jeden bark bliżej', 'Lekki skos, który dodaje portretowi głębi.', 'Ustaw ciało trochę bokiem; przybliż jeden bark do aparatu; zostaw biodra wygodnie; skieruj twarz do światła', 'Bark pozostaje nisko, a dłonie nie muszą niczego mocno trzymać.', 'Możesz zostać nieruchomo, a fotograf sam znajdzie odpowiedni kąt.', 'Nie musisz skręcać tułowia. Ten sam efekt można uzyskać ustawieniem aparatu.', 'Tułów ustawiony po skosie, z jednym barkiem nieco bliżej aparatu.', '/images/client-guides/poses/p08-jeden-bark-blizej.webp'),
    pose('P09', 'Obrót za spojrzeniem', 'Łagodny ruch głowy i barków ożywiający portret.', 'Spójrz w bok; pozwól głowie lekko podążyć za wzrokiem; porusz delikatnie barkami; wróć spojrzeniem do fotografa', 'Rób wszystko powoli i zatrzymaj się tam, gdzie jest wygodnie.', 'Możesz poruszyć tylko oczami i jednym barkiem.', 'Jeśli wolisz pozostać nieruchomo, fotograf zmieni swoje ustawienie.', 'Kolejne etapy łagodnego obrotu: najpierw wzrok, potem głowa i barki.', '/images/client-guides/poses/p09-obrot-za-spojrzeniem.webp'),
    pose('P10', 'Spojrzenie do aparatu', 'Naturalny moment kontaktu z obiektywem.', 'Spójrz na chwilę poza kadr; zrób spokojny wydech; wróć wzrokiem do aparatu; zachowaj naturalną minę', 'Nie zatrzymuj uśmiechu na siłę. Fotograf zrobi zdjęcie podczas płynnego powrotu spojrzenia.', 'Możesz spojrzeć na bliską osobę zamiast w obiektyw.', 'Całe ciało może pozostać nieruchomo. Wystarczy sam ruch oczu.', 'Głowa pozostaje lekko bokiem, a wzrok stopniowo wraca w stronę aparatu.', '/images/client-guides/poses/p10-wzrok-wraca-do-aparatu.webp'),
    pose('P11', 'Spojrzenie przez ramię', 'Spokojny portret z lekkim zwrotem w stronę aparatu.', 'Ustaw się częściowo bokiem; spójrz w stronę fotografa; obróć głowę tylko trochę; zatrzymaj się w wygodnym miejscu', 'Szyja i barki powinny pozostać swobodne. Nie potrzebujesz mocnego skrętu.', 'Fotograf może podejść bardziej z boku, a Ty poruszysz tylko wzrokiem.', 'Wybierz najmniejszy wygodny ruch. Resztę efektu stworzy ustawienie aparatu.', 'Osoba ustawiona bokiem patrzy łagodnie w stronę aparatu, bez mocnego skręcania szyi.', '/images/client-guides/poses/p11-spojrzenie-przez-ramie.webp'),
    pose('P12', 'Rozmowa i śmiech', 'Naturalne emocje na zdjęciu pary, rodziny lub grupy.', 'Zwróćcie się do siebie; powiedzcie coś zwyczajnego; posłuchajcie odpowiedzi; pozwólcie reakcji pojawić się bez pośpiechu', 'Nie musicie patrzeć sobie w oczy ani się śmiać. Spokojna rozmowa także wygląda pięknie.', 'Możecie razem spojrzeć w jeden punkt albo po prostu posłuchać fotografa.', 'Możecie rozmawiać słowami, gestem lub spojrzeniem — tak, jak jest Wam naturalnie.', 'Dwie osoby zwrócone ku sobie podczas swobodnej rozmowy, z naturalną mimiką.', '/images/client-guides/poses/p12-rozmowa-i-smiech.webp'),
    pose('P13', 'Blisko opiekuna', 'Spokojny portret dziecka przy bliskiej osobie.', 'Pozwól dziecku wybrać odległość; zostań blisko; zaproponuj mały gest lub spojrzenie; po chwili zmieńcie zabawę', 'Nie ustawiaj dziecka rękami. Poczucie bezpieczeństwa jest ważniejsze niż idealna pozycja.', 'Możecie usiąść razem albo zostać obok siebie bez brania dziecka na ręce.', 'Wybierzcie znane i wygodne miejsce. Dziecko może zostać dokładnie tam, gdzie czuje się dobrze.', 'Dziecko pozostaje w wybranej odległości od opiekuna, który daje mu spokojne wsparcie.', '/images/client-guides/poses/p13-bezpieczna-baza.webp'),
    pose('P14', 'Cichy spacer', 'Naturalny ruch dziecka lub rodzeństwa.', 'Wybierzcie krótki odcinek; ruszcie powoli; spróbujcie zrobić najcichsze kroki; zatrzymajcie się przy umówionym miejscu', 'To zabawa bez wyścigu. Każde dziecko porusza się we własnym tempie.', 'Możecie kołysać się, poruszać w miejscu albo wprawić w ruch koła wózka.', 'Wybierzcie równą trasę i tempo wygodne dla wszystkich.', 'Dziecko porusza się spokojnie po krótkiej, bezpiecznej trasie do wyznaczonego punktu.', '/images/client-guides/poses/p14-cichy-spacer.webp'),
    pose('P15', 'Pokaż skarb', 'Zabawa, która zajmuje dłonie dziecka i wywołuje naturalną reakcję.', 'Niech dziecko wybierze bezpieczny przedmiot; pokaże go bliskiej osobie; wskaże ulubiony szczegół; odłoży go, kiedy zechce', 'Nie poprawiaj sposobu trzymania. Fotograf dopasuje zdjęcie do naturalnego gestu.', 'Możecie wskazać ciekawy element otoczenia bez brania go do ręki.', 'Przedmiot może leżeć blisko. Dziecko może wskazać go dłonią, spojrzeniem lub w swój ulubiony sposób.', 'Dziecko pokazuje wybrany przedmiot opiekunowi i kieruje na niego uwagę.', '/images/client-guides/poses/p15-pokaz-skarb.webp'),
    pose('P16', 'Rodzinny półokrąg', 'Czytelne zdjęcie całej rodziny bez sztywnego szeregu.', 'Ustawcie się w luźnym łuku; zostawcie widoczne twarze; skierujcie się lekko do środka; wybierzcie dotyk lub niewielki odstęp', 'Nie musicie ustawiać się według wzrostu. Drobne różnice pozycji dodają zdjęciu swobody.', 'Część osób może siedzieć, a część stać.', 'Najpierw wybierzcie wygodne miejsca. Pozostali dopasują się do nich, a fotograf ustawi kadr.', 'Rodzina ustawiona w luźnym półokręgu, tak aby każda twarz była widoczna.', '/images/client-guides/poses/p16-rodzinny-polokrag.webp'),
    pose('P17', 'Wspólny punkt', 'Rodzinne zdjęcie bez patrzenia prosto w obiektyw.', 'Wybierzcie osobę lub przedmiot; spójrzcie w jego stronę; zacznijcie krótką rozmowę; po chwili jedna osoba może spojrzeć do aparatu', 'Pozostańcie w luźnym układzie i zadbajcie, aby nie zasłaniać sobie twarzy.', 'Możecie wspólnie obejrzeć album, zabawkę albo element otoczenia.', 'Wybierzcie punkt, który wszyscy mogą zobaczyć bez niewygodnego obracania głowy.', 'Członkowie rodziny kierują uwagę ku wspólnemu punktowi, pozostając w otwartym układzie.', '/images/client-guides/poses/p17-wspolny-punkt.webp'),
    pose('P18', 'Spacer razem', 'Swobodne rodzinne zdjęcie w ruchu.', 'Ustalcie spokojne tempo; ruszcie obok siebie; rozmawiajcie; patrzcie na drogę lub na bliskich', 'Nikt nie powinien być ciągnięty ani poganiany. Krótki spacer w zupełności wystarczy.', 'Możecie kołysać się, obrócić w miejscu albo pozwolić fotografowi poruszać się wokół Was.', 'Wybierzcie równy teren i sposób poruszania wygodny dla każdej osoby.', 'Rodzina porusza się razem spokojnym tempem, w luźnym układzie i bez ciągnięcia kogokolwiek.', '/images/client-guides/poses/p18-spacer-razem.webp'),
    pose('P19', 'Swobodnie obok siebie', 'Naturalny portret pary bez ustawiania na baczność.', 'Stańcie lub usiądźcie obok; zwróćcie się lekko ku sobie; wybierzcie dotyk lub odstęp; spójrzcie w aparat', 'Barki nie muszą tworzyć równej linii, a głowy mogą pozostać w wygodnej odległości.', 'Jedna osoba może znaleźć się odrobinę bliżej aparatu.', 'Możecie oboje usiąść. Fotograf dopasuje kadr do różnicy wysokości.', 'Dwie osoby ustawione swobodnie obok siebie, lekko zwrócone ku sobie, z opcjonalnym kontaktem dłoni.', '/images/client-guides/poses/p19-obok-nie-na-bacznosc.webp'),
    pose('P20', 'Jeden punkt bliskości', 'Subtelny gest, który pokazuje relację pary.', 'Ustalcie, czy chcecie się dotknąć; wybierzcie dłoń, ramię lub plecy; zachowajcie lekki kontakt; oddychajcie swobodnie', 'Jeden naturalny gest wystarczy. Dotyk zawsze jest wyborem, nie obowiązkiem.', 'Możecie pozostać bez dotyku, trzymać dłonie blisko albo użyć wspólnego przedmiotu.', 'Wybierzcie gest i miejsce, które są wygodne dla Was obojga.', 'Para z jednym lekkim, uzgodnionym punktem kontaktu; obok pokazano wariant bez dotyku.', '/images/client-guides/poses/p20-punkt-kontaktu.webp'),
    pose('P21', 'Spacer i rozmowa', 'Swobodne zdjęcie pary podczas wspólnego ruchu.', 'Wybierzcie wolne tempo; ruszcie obok siebie; rozmawiajcie o czymś zwyczajnym; patrzcie na drogę i na siebie', 'Nie musicie cały czas trzymać się za ręce ani patrzeć sobie w oczy.', 'Możecie poruszać się w miejscu albo rozmawiać na siedząco.', 'Wybierzcie równe miejsce i tempo wygodne dla obojga. Fotograf może poruszać się zamiast Was.', 'Para idzie obok siebie spokojnym tempem, rozmawiając i spoglądając na trasę.', '/images/client-guides/poses/p21-spacer-i-rozmowa.webp'),
    pose('P22', 'Spokojny skos', 'Klasyczny portret z delikatnym ustawieniem bokiem.', 'Ustaw tułów lekko bokiem; znajdź wygodne podparcie; oprzyj jedną dłoń; skieruj wzrok do światła', 'Nie wyginaj sylwetki. Mała różnica między linią barków i bioder w zupełności wystarczy.', 'Możesz usiąść i zachować ten sam lekki skos.', 'Jeśli nie chcesz się obracać, fotograf zmieni pozycję aparatu.', 'Osoba w stabilnym, lekkim skosie, z jedną dłonią opartą i swobodną linią barków.', '/images/client-guides/poses/p22-spokojny-skos.webp'),
    pose('P23', 'Portret z oparciem', 'Elegancki i wygodny portret na siedząco.', 'Wybierz wygodne miejsce; oprzyj plecy tak, jak lubisz; połóż dłonie osobno; spójrz w aparat lub w bok', 'Oparcie nie psuje pozy. Pomaga rozluźnić barki i dłonie.', 'Możesz użyć krzesła, ławki, wózka albo oprzeć się na stojąco.', 'Pozostań na swoim miejscu. Fotograf dopasuje światło, wysokość aparatu i kadr.', 'Osoba korzysta z wygodnego oparcia, z podpartymi przedramionami i swobodnymi barkami.', '/images/client-guides/poses/p23-portret-z-oparciem.webp'),
    pose('P24', 'Ruch tkaniny', 'Lekki ruch ubrania, który dodaje zdjęciu energii.', 'Sprawdź wolną przestrzeń; chwyć lekko brzeg ubrania; porusz dłonią lub obróć się odrobinę; wróć do pewnej pozycji', 'Ruch ma być mały i spokojny. Uważaj, aby materiał o nic nie zaczepił.', 'Możesz poruszyć samą tkaniną na siedząco. Bliska osoba może pomóc, jeśli tego chcesz.', 'Nie musisz obracać ciała. Sam ruch dłoni lub materiału da podobny efekt.', 'Osoba wykonuje niewielki, bezpieczny ruch tkaniną przy stabilnym podparciu.', '/images/client-guides/poses/p24-obrot-z-tkanina.webp'),
    pose('P25', 'Luźna kieszeń', 'Swobodny portret z prostym zadaniem dla dłoni.', 'Ustaw się lekko bokiem; włóż kciuk lub część dłoni do kieszeni; drugą dłoń zostaw widoczną; zrób spokojny wydech', 'Nie chowaj obu dłoni głęboko. Lekki kontakt z kieszenią wygląda naturalniej.', 'Możesz oprzeć dłoń o bok ubrania, pasek albo udo.', 'Możesz wykonać tę pozę na siedząco lub oprzeć rękę w wygodnym miejscu.', 'Osoba stoi lekko po skosie, z jedną dłonią luźno przy kieszeni i drugą widoczną.', '/images/client-guides/poses/p25-luzna-kieszen.webp'),
    pose('P26', 'Przedramiona podparte', 'Spokojny portret z wygodnie ułożonymi rękami.', 'Usiądź wygodnie; oprzyj jedno lub oba przedramiona; rozluźnij dłonie; zwróć się lekko ku światłu', 'Nie splataj mocno palców. Każda dłoń może odpoczywać osobno.', 'Użyj blatu, podłokietnika, własnego siedziska albo oparcia na stojąco.', 'Wybierz podparcie, które masz pod ręką i przy którym czujesz się swobodnie.', 'Osoba siedzi stabilnie z luźno podpartymi przedramionami i rozluźnionymi dłońmi.', '/images/client-guides/poses/p26-przedramiona-podparte.webp'),
    pose('P27', 'Popraw ubranie', 'Prosty gest, który ożywia bardziej elegancki portret.', 'Dotknij klapy, mankietu lub brzegu ubrania; wykonaj jeden powolny gest; spójrz w wybraną stronę; puść materiał', 'Lekki ruch wygląda naturalniej niż ciągłe poprawianie ubrania.', 'Możesz poprawić koszulę, sweter, zegarek lub inny własny element.', 'Wystarczy ruch jedną dłonią. Możesz przy tym stać albo siedzieć.', 'Osoba wykonuje spokojny gest poprawienia klapy ubrania, bez zaciskania dłoni.', '/images/client-guides/poses/p27-poprawienie-marynarki.webp'),
    pose('P28', 'Krótka przerwa', 'Pomaga odzyskać swobodę po kilku zdjęciach.', 'Przestań na chwilę pozować; rozluźnij dłonie; zrób zwykły wydech; wróć do wygodnej pozycji', 'Możesz mrugnąć, rozluźnić szczękę i przestać się uśmiechać. Za moment zaczniemy od nowa.', 'Możesz odpocząć bez ruchu albo porozmawiać chwilę o czymś innym.', 'Jeśli nie chcesz się poruszać, sama chwila przerwy też wystarczy.', 'Trzy etapy resetu: przerwa, spokojny wydech i powrót do wygodnego ustawienia.', '/images/client-guides/poses/p28-reset-napiecia.webp'),
    pose('P29', 'Proste zadanie dla dłoni', 'Pomaga ułożyć dłonie bez zastanawiania się nad pozą.', 'Wybierz jedno zadanie; oprzyj dłoń lub dotknij ubrania; wykonaj gest lekko; po kilku zdjęciach zmień ustawienie', 'Jedno proste zadanie wystarczy. Palce i barki mogą pozostać swobodne.', 'Możesz po prostu oprzeć dłoń zamiast wykonywać gest.', 'Wybierz ruch lub podparcie, które jest dla Ciebie wygodne.', 'Trzy proste zadania dla dłoni: lekkie oparcie, dotknięcie ubrania i swobodny gest.', '/images/client-guides/poses/p29-dlonie-dostaja-zadanie.webp'),
    pose('P30', 'Zmieniamy ustawienie', 'Pomaga pokazać wszystkie twarze i zachować wygodę grupy.', 'Zostańcie na chwilę w miejscu; sprawdźcie, czy wszyscy czują się dobrze; zróbcie jedną małą zmianę; spójrzcie ponownie w stronę aparatu', 'Nie trzeba poprawiać kilku rzeczy naraz. Często wystarczy, że fotograf przesunie się o krok.', 'Możemy zmienić wysokość aparatu, miejsce siedzenia albo kolejność osób.', 'Najpierw zadbamy o wygodę każdej osoby, a potem dopasujemy resztę grupy i kadr.', 'Fotograf zmienia ustawienie aparatu, dzięki czemu twarze grupy są widoczne bez niepotrzebnego przestawiania osób.', '/images/client-guides/poses/p30-zmieniamy-uklad-nie-osobe.webp'),
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
        example_images: [{ src: '/images/client-guides/wardrobe/outdoor.webp', alt: 'Osoby w ciepłych beżach, karmelu i terakocie.', caption: 'Ciepłe kolory dobrze łączą się z naturalnym plenerem i miękkim światłem.' }],
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
        example_images: [{ src: '/images/client-guides/wardrobe/palette.webp', alt: 'Rodzina w strojach w kolorach szałwii, oliwki, piasku i ecru.', caption: 'Różne fasony pozostają spójne dzięki powtarzającym się naturalnym kolorom.' }],
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
        example_images: [{ src: '/images/client-guides/wardrobe/black-white.webp', alt: 'Eleganckie stylizacje łączące granat, stalową szarość i jasne akcenty.', caption: 'Chłodne barwy zyskują głębię dzięki fakturom i łagodnemu jasnemu akcentowi.' }],
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
        example_images: [{ src: '/images/client-guides/wardrobe/women.webp', alt: 'Stylizacje w pudrowym różu, moreli, śliwce i wanilii.', caption: 'Przygaszone ciepłe barwy tworzą delikatny efekt bez mocnych kontrastów.' }],
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
        example_images: [{ src: '/images/client-guides/wardrobe/layers.webp', alt: 'Warstwowe stylizacje w zieleni, kolorze kamienia i lnu.', caption: 'Zgaszona zieleń i neutralne warstwy współgrają z roślinnością i kamiennym tłem.' }],
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
        example_images: [{ src: '/images/client-guides/wardrobe/season.webp', alt: 'Lekkie stylizacje w błękitach, piasku i ciepłym brązie.', caption: 'Błękit i piasek nawiązują do otoczenia, a koniakowy detal ociepla zestaw.' }],
        colors: [
            { name: 'Błękit', hex: '#9FB8C5' },
            { name: 'Morski', hex: '#547782' },
            { name: 'Piasek', hex: '#D9C7A2' },
            { name: 'Konjak', hex: '#9A623C' },
        ],
    },
    {
        id: 'city-light',
        name: 'Miasto: cegła, beton i szkło',
        description: 'Kolory dobrane do cegły, betonu, szkła, stali, zieleni miejskiej i neonów.',
        example_images: [{ src: '/images/client-guides/wardrobe/city.webp', alt: 'Miejskie stylizacje dopasowane do cegły, betonu oraz szkła i stali.', caption: 'Krem i oliwka równoważą cegłę, karmel ociepla beton, a granat porządkuje odbicia szkła i światła neonów.' }],
        colors: [
            { name: 'Krem', hex: '#E9DFCF' },
            { name: 'Oliwka', hex: '#68705A' },
            { name: 'Karmel', hex: '#A66A3F' },
            { name: 'Granat', hex: '#27364B' },
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
