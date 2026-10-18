import type { PhysicsExperiment } from '../types.ts';

export const task01Experiments: PhysicsExperiment[] = [
    {
        "id": "body-foil",
        "task": 1,
        "moduleId": "world",
        "title": "Trzy wcielenia aluminium",
        "teaser": "Jedna substancja zmienia kształt, ale nie swoją tożsamość.",
        "duration": "7 min",
        "difficulty": 1,
        "animation": "foil",
        "materials": [
            "3 podobne kawałki folii aluminiowej",
            "stół lub taca"
        ],
        "goal": "Odróżnić substancję od ciała fizycznego.",
        "hypothesis": {
            "question": "Z płaskiej folii robisz kulkę i łódkę. Co zmienia się na pewno?",
            "options": [
                "Substancja",
                "Kształt ciała",
                "Rodzaj aluminium"
            ],
            "correctIndex": 1,
            "explanation": "Materiał pozostaje aluminium, zmienia się tylko kształt konkretnego ciała."
        },
        "steps": [
            "Pierwszy kawałek folii zostaw płaski.",
            "Drugi zwiń w kulkę, a z trzeciego uformuj małą łódkę.",
            "Połóż wszystkie trzy obok siebie i porównaj ich kształt oraz materiał."
        ],
        "observation": {
            "question": "Który opis jest najlepszy?",
            "options": [
                "To trzy różne substancje.",
                "To trzy ciała wykonane z tej samej substancji.",
                "Kulka nie jest już aluminium."
            ],
            "correctIndex": 1,
            "explanation": "Każdy obiekt ma inny kształt, lecz wszystkie są wykonane z aluminium."
        },
        "explanation": "Ciało fizyczne jest konkretnym obiektem, któremu można wskazać kształt i miejsce. Substancja jest materiałem, z którego obiekt wykonano. Aluminium może utworzyć folię, puszkę, przewód albo część samolotu.",
        "takeaway": "Jedna substancja może tworzyć wiele różnych ciał fizycznych.",
        "quiz": [
            {
                "question": "Co jest substancją?",
                "options": [
                    "Aluminiowa kulka",
                    "Aluminium",
                    "Łódka z folii"
                ],
                "correctIndex": 1,
                "explanation": "Aluminium to materiał. Kulka i łódka są konkretnymi ciałami."
            }
        ]
    },
    {
        "id": "body-spoons",
        "task": 1,
        "moduleId": "world",
        "title": "Łyżki o trzech charakterach",
        "teaser": "Ta sama nazwa przedmiotu nie oznacza tej samej substancji.",
        "duration": "6 min",
        "difficulty": 1,
        "animation": "spoons",
        "materials": [
            "łyżka metalowa",
            "łyżka plastikowa",
            "łyżka drewniana lub drewniany patyczek"
        ],
        "goal": "Zobaczyć, że podobne ciała mogą być wykonane z różnych substancji.",
        "hypothesis": {
            "question": "Czy trzy łyżki muszą być wykonane z tej samej substancji?",
            "options": [
                "Tak, bo wszystkie są łyżkami",
                "Nie, nazwa ciała nie określa materiału",
                "Tylko gdy mają taki sam kolor"
            ],
            "correctIndex": 1,
            "explanation": "Funkcja i nazwa przedmiotu nie mówią jeszcze, z czego został wykonany."
        },
        "steps": [
            "Połóż obok siebie łyżki lub podobne przedmioty z trzech materiałów.",
            "Dotknij każdej, obejrzyj powierzchnię i lekko postukaj nią o stół.",
            "Nazwij ciało, a potem substancję, z której je wykonano."
        ],
        "observation": {
            "question": "Jak brzmi prawidłowy opis?",
            "options": [
                "Metal, plastik i drewno to ciała fizyczne.",
                "Łyżki to substancje, a metal jest ciałem.",
                "Łyżki to ciała, a metal, plastik i drewno to substancje."
            ],
            "correctIndex": 2,
            "explanation": "Łyżka jest konkretnym przedmiotem. Metal, plastik i drewno są materiałami."
        },
        "explanation": "Ciała o takim samym przeznaczeniu mogą powstać z różnych substancji. Dlatego w fizyce nie wystarczy nazwać przedmiot; trzeba rozróżnić obiekt od materiału.",
        "takeaway": "Ciało odpowiada na pytanie „co to jest?”, a substancja na pytanie „z czego to jest?”.",
        "quiz": [
            {
                "question": "Szklany kubek jest…",
                "options": [
                    "substancją, a szkło ciałem",
                    "ciałem, a szkło substancją",
                    "wyłącznie zjawiskiem"
                ],
                "correctIndex": 1,
                "explanation": "Kubek jest obiektem, szkło jest materiałem."
            }
        ]
    },
    {
        "id": "body-pencil",
        "task": 1,
        "moduleId": "world",
        "title": "Pułapka ołówka",
        "teaser": "Nazwa brzmi podobnie do „ołów”, ale środek kryje zupełnie co innego.",
        "duration": "5 min",
        "difficulty": 1,
        "animation": "pencil",
        "materials": [
            "zwykły ołówek",
            "kartka papieru",
            "opcjonalnie lupa"
        ],
        "safety": "Nie rozcinaj ołówka nożem. Wystarczy obejrzeć końcówkę i przekrój po zatemperowaniu.",
        "goal": "Nie dać się zwieść podobieństwu nazw.",
        "hypothesis": {
            "question": "Z czego powstaje ciemna kreska zwykłego ołówka?",
            "options": [
                "Z ołowiu",
                "Głównie z grafitu",
                "Z żelaza"
            ],
            "correctIndex": 1,
            "explanation": "Wkład ołówka jest mieszaniną grafitu i glinki, a nie ołowiu."
        },
        "steps": [
            "Narysuj ołówkiem ciemną linię.",
            "Obejrzyj drewno, grafitowy wkład, lakier i ewentualną metalową obrączkę.",
            "Nazwij osobno cały przedmiot oraz materiały, z których się składa."
        ],
        "observation": {
            "question": "Które zdanie jest prawdziwe?",
            "options": [
                "Ołówek jest substancją",
                "Ołów i ołówek oznaczają to samo",
                "Ołówek jest ciałem, a ołów jest substancją"
            ],
            "correctIndex": 2,
            "explanation": "Podobieństwo nazw nie zmienia fizycznej klasyfikacji."
        },
        "explanation": "Ołówek jest konkretnym ciałem fizycznym złożonym z kilku substancji. Ołów jest pierwiastkiem i substancją. To klasyczna szkolna pułapka językowa.",
        "takeaway": "Klasyfikuj po znaczeniu, nie po podobnym brzmieniu słowa.",
        "quiz": [
            {
                "question": "Siłomierz w zadaniu 1 jest…",
                "options": [
                    "ciałem fizycznym",
                    "substancją",
                    "jednostką"
                ],
                "correctIndex": 0,
                "explanation": "Siłomierz to konkretny przyrząd, czyli ciało fizyczne."
            }
        ]
    }
];
