import type { PhysicsExperiment } from '../types.ts';

export const task02Experiments: PhysicsExperiment[] = [
    {
        "id": "quantity-station",
        "task": 2,
        "moduleId": "world",
        "title": "Domowe centrum pomiarowe",
        "teaser": "Trzy stanowiska zamieniają „duże” i „ciężkie” w prawdziwe wyniki.",
        "duration": "10 min",
        "difficulty": 1,
        "animation": "measure",
        "materials": [
            "linijka lub miarka",
            "waga kuchenna",
            "miarka kuchenna lub termometr",
            "dowolny przedmiot"
        ],
        "goal": "Rozpoznać wielkość fizyczną po tym, że można ją zmierzyć.",
        "hypothesis": {
            "question": "Co musi zawierać pełny wynik pomiaru?",
            "options": [
                "Samą liczbę",
                "Liczbę i jednostkę",
                "Tylko nazwę przyrządu"
            ],
            "correctIndex": 1,
            "explanation": "Bez jednostki nie wiadomo, co liczba oznacza."
        },
        "steps": [
            "Zmierz długość stołu lub zeszytu i zapisz wynik z jednostką.",
            "Zważ jabłko, kubek albo inny mały przedmiot.",
            "Odmierz wodę w miarce albo zmierz temperaturę w pomieszczeniu."
        ],
        "observation": {
            "question": "Który zestaw zawiera wyłącznie wielkości fizyczne?",
            "options": [
                "długość, masa, objętość",
                "stół, jabłko, woda",
                "linijka, waga, termometr"
            ],
            "correctIndex": 0,
            "explanation": "Wielkości są mierzalnymi cechami. Pozostałe odpowiedzi zawierają ciała albo przyrządy."
        },
        "explanation": "Wielkość fizyczna jest cechą, którą można porównać z jednostką i wyrazić liczbą. Długość, masa, czas, temperatura, objętość, pole i siła są wielkościami fizycznymi.",
        "takeaway": "Da się zmierzyć i zapisać liczbą z jednostką? To najpewniej wielkość fizyczna.",
        "quiz": [
            {
                "question": "Który zapis jest pełnym wynikiem?",
                "options": [
                    "Długość: 120",
                    "Długość: 120 cm",
                    "Długość: duża"
                ],
                "correctIndex": 1,
                "explanation": "120 cm zawiera liczbę i jednostkę."
            }
        ]
    },
    {
        "id": "quantity-unit-alarm",
        "task": 2,
        "moduleId": "world",
        "title": "Alarm brakującej jednostki",
        "teaser": "„Rakieta ma długość 50” brzmi dokładnie, ale nadal nic nie mówi.",
        "duration": "6 min",
        "difficulty": 1,
        "animation": "unit-alarm",
        "materials": [
            "kartka",
            "długopis",
            "stoper w telefonie"
        ],
        "goal": "Zrozumieć, dlaczego sama liczba nie jest wynikiem pomiaru.",
        "hypothesis": {
            "question": "Czy zdanie „film trwa 90” jest wystarczające?",
            "options": [
                "Tak",
                "Nie, brakuje jednostki",
                "Tak, jeżeli film jest długi"
            ],
            "correctIndex": 1,
            "explanation": "90 sekund, minut i godzin to zupełnie inne czasy."
        },
        "steps": [
            "Rodzic podaje wyniki bez jednostek: stół 150, plecak 4, woda 20, film 90.",
            "Dziecko mówi „ALARM” i dobiera sensowną jednostkę.",
            "Zamieńcie role i spróbujcie celowo podać zabawnie błędną jednostkę."
        ],
        "observation": {
            "question": "Który zapis najlepiej opisuje masę plecaka?",
            "options": [
                "4",
                "4 kg",
                "4°C"
            ],
            "correctIndex": 1,
            "explanation": "Kilogram jest jednostką masy."
        },
        "explanation": "Jednostka ustala skalę wyniku. Liczba 4 bez jednostki nie pozwala stwierdzić, czy chodzi o kilogramy, metry, sekundy czy niutony.",
        "takeaway": "Liczba bez jednostki to niedokończony wynik.",
        "quiz": [
            {
                "question": "Temperaturę pokoju można zapisać jako…",
                "options": [
                    "21°C",
                    "21 kg",
                    "21 m"
                ],
                "correctIndex": 0,
                "explanation": "Stopień Celsjusza jest używaną w życiu codziennym jednostką temperatury."
            }
        ]
    },
    {
        "id": "quantity-detector",
        "task": 2,
        "moduleId": "world",
        "title": "Wykrywacz fałszywych wielkości",
        "teaser": "Deszcz można obserwować, ale to ilość opadu jest wielkością.",
        "duration": "7 min",
        "difficulty": 1,
        "animation": "quantity-detector",
        "materials": [
            "10 karteczek",
            "długopis",
            "dwa pojemniki lub dwa miejsca na stole"
        ],
        "goal": "Oddzielić wielkości fizyczne od ciał i zjawisk.",
        "hypothesis": {
            "question": "Które słowo samo jest wielkością fizyczną?",
            "options": [
                "wiatr",
                "prędkość wiatru",
                "chmura"
            ],
            "correctIndex": 1,
            "explanation": "Wiatr jest zjawiskiem, a jego prędkość można zmierzyć."
        },
        "steps": [
            "Napisz na karteczkach: masa, mgła, długość, deszcz, temperatura, chmura, objętość, ciśnienie, wiatr, pole.",
            "Podziel je na „mierzalna cecha” oraz „ciało lub zjawisko”.",
            "Dla każdego zjawiska wymyśl wielkość, którą można w nim zmierzyć."
        ],
        "observation": {
            "question": "Co można mierzyć podczas deszczu?",
            "options": [
                "Deszcz jako nazwę",
                "Ilość opadu i czas trwania",
                "Chmurę jako słowo"
            ],
            "correctIndex": 1,
            "explanation": "Wielkością jest mierzalna cecha zjawiska, nie sama nazwa zjawiska."
        },
        "explanation": "Nie każde słowo związane z fizyką oznacza wielkość fizyczną. Deszcz, mgła czy wiatr są zjawiskami. Ilość opadu, widzialność, prędkość wiatru i ciśnienie są wielkościami.",
        "takeaway": "Wielkość fizyczna jest mierzalną cechą ciała albo zjawiska.",
        "quiz": [
            {
                "question": "Który zestaw zawiera tylko wielkości fizyczne?",
                "options": [
                    "długość, temperatura, masa",
                    "deszcz, temperatura, chmura",
                    "linijka, masa, termometr"
                ],
                "correctIndex": 0,
                "explanation": "Każdy składnik pierwszego zestawu można zmierzyć i podać z jednostką."
            }
        ]
    }
];
