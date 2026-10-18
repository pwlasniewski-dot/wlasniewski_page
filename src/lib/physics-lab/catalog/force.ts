import type { PhysicsExperiment } from '../types.ts';

export const forceExperiments: PhysicsExperiment[] = [
    {
        "id": "force-units",
        "task": 6,
        "moduleId": "force",
        "title": "Schody niutonów",
        "teaser": "N, kN i MN mierzą tę samą wielkość — zmienia się jedynie skala.",
        "duration": "8 min",
        "difficulty": 1,
        "animation": "force-units",
        "materials": [
            "3 kartki",
            "pisak",
            "opcjonalnie mała torba z zakupami"
        ],
        "goal": "Rozpoznać jednostki siły i ich przedrostki.",
        "hypothesis": {
            "question": "Który zestaw zawiera wyłącznie jednostki siły?",
            "options": [
                "metr, kilogram, niuton",
                "niuton, kiloniuton, meganiuton",
                "siłomierz, niuton, kilometr"
            ],
            "correctIndex": 1,
            "explanation": "N, kN i MN są jednostkami siły."
        },
        "steps": [
            "Napisz na kartkach N, kN i MN i ułóż je jak trzy stopnie.",
            "Zapamiętaj: kilo oznacza 1000, mega oznacza 1 000 000.",
            "Przyporządkuj przykłady: mały nacisk dłoni, siła silnika, ogromna siła konstrukcyjna."
        ],
        "observation": {
            "question": "Ile niutonów ma 1 kN?",
            "options": [
                "10 N",
                "100 N",
                "1000 N"
            ],
            "correctIndex": 2,
            "explanation": "Przedrostek kilo oznacza tysiąc."
        },
        "explanation": "Podstawową jednostką siły w układzie SI jest niuton, oznaczany N. Dla dużych wartości używa się kiloniutonów i meganiutonów.",
        "takeaway": "Siłę podajemy w niutonach: N, kN albo MN.",
        "quiz": [
            {
                "question": "Które słowo nie jest jednostką siły?",
                "options": [
                    "kiloniuton",
                    "meganiuton",
                    "kilogram"
                ],
                "correctIndex": 2,
                "explanation": "Kilogram jest jednostką masy."
            }
        ]
    },
    {
        "id": "force-interaction",
        "task": 7,
        "moduleId": "force",
        "title": "Siła ujawnia oddziaływanie",
        "teaser": "Samochodzik zmienia ruch dopiero wtedy, gdy coś na niego działa.",
        "duration": "7 min",
        "difficulty": 1,
        "animation": "interaction",
        "materials": [
            "mały samochodzik lub lekka rolka",
            "gumka recepturka",
            "gładki stół"
        ],
        "goal": "Zrozumieć siłę jako miarę wzajemnego oddziaływania ciał.",
        "hypothesis": {
            "question": "Co może zrobić siła działająca na samochodzik?",
            "options": [
                "zmienić jego ruch lub kształt",
                "usunąć jego masę",
                "zmienić jednostkę czasu"
            ],
            "correctIndex": 0,
            "explanation": "Siła może wywołać skutek dynamiczny lub statyczny."
        },
        "steps": [
            "Postaw samochodzik nieruchomo i obserwuj go bez dotykania.",
            "Popchnij go palcem, a potem pociągnij gumką z inną siłą.",
            "Porównaj zmianę ruchu po słabym i mocniejszym oddziaływaniu."
        ],
        "observation": {
            "question": "Siła jest miarą…",
            "options": [
                "tylko magnetyzmu",
                "tylko elektryczności",
                "wzajemnego oddziaływania ciał"
            ],
            "correctIndex": 2,
            "explanation": "Siła opisuje różne rodzaje oddziaływań między ciałami."
        },
        "explanation": "Siła nie jest przedmiotem. Jest wielkością opisującą oddziaływanie. Jej skutkiem może być zmiana prędkości, kierunku ruchu, zatrzymanie albo odkształcenie.",
        "takeaway": "Gdy ciało zmienia ruch lub kształt, szukaj oddziaływania i siły.",
        "quiz": [
            {
                "question": "Siła jest miarą…",
                "options": [
                    "wzajemnego oddziaływania ciał",
                    "wyłącznie oddziaływania magnetycznego",
                    "objętości ciała"
                ],
                "correctIndex": 0,
                "explanation": "To ogólna miara oddziaływania, niezależnie od jego rodzaju."
            }
        ]
    },
    {
        "id": "force-vector",
        "task": 7,
        "moduleId": "force",
        "title": "Cztery cechy jednej strzałki",
        "teaser": "Wartość to za mało — siła ma też kierunek, zwrot i punkt przyłożenia.",
        "duration": "9 min",
        "difficulty": 2,
        "animation": "force-vector",
        "materials": [
            "pudełko po butach",
            "sznurek",
            "4 karteczki: wartość, kierunek, zwrot, punkt"
        ],
        "goal": "Nauczyć się pełnego opisu siły jako wektora.",
        "hypothesis": {
            "question": "Czy dwie siły po 5 N zawsze działają tak samo?",
            "options": [
                "tak",
                "nie, mogą mieć inny kierunek, zwrot lub punkt przyłożenia",
                "tylko gdy ciało jest ciężkie"
            ],
            "correctIndex": 1,
            "explanation": "Ta sama wartość nie określa całego wektora siły."
        },
        "steps": [
            "Pociągnij pudełko sznurkiem w prawo, a potem w lewo.",
            "Pociągnij je poziomo, a potem lekko do góry.",
            "Przełóż sznurek na drugi koniec pudełka i zauważ zmianę punktu przyłożenia."
        ],
        "observation": {
            "question": "Pełny opis siły obejmuje…",
            "options": [
                "tylko wartość",
                "wartość i kolor",
                "wartość, kierunek, zwrot i punkt przyłożenia"
            ],
            "correctIndex": 2,
            "explanation": "To cztery podstawowe cechy wektora siły."
        },
        "explanation": "Na rysunku siłę przedstawia się strzałką. Jej długość odpowiada wartości, linia działania pokazuje kierunek, grot pokazuje zwrot, a początek wskazuje punkt przyłożenia.",
        "takeaway": "Siła to strzałka z wartością, kierunkiem, zwrotem i początkiem.",
        "quiz": [
            {
                "question": "Co pokazuje grot wektora siły?",
                "options": [
                    "zwrot",
                    "masę",
                    "jednostkę czasu"
                ],
                "correctIndex": 0,
                "explanation": "Grot wskazuje, w którą stronę działa siła."
            }
        ]
    },
    {
        "id": "force-instruments",
        "task": 8,
        "moduleId": "force",
        "title": "Detektywi przyrządów",
        "teaser": "Zegarek, linijka, siłomierz i waga mają po jednej głównej misji.",
        "duration": "7 min",
        "difficulty": 1,
        "animation": "instruments",
        "materials": [
            "zegarek lub stoper",
            "linijka",
            "waga",
            "opcjonalnie siłomierz"
        ],
        "goal": "Dopasować przyrząd do mierzonej wielkości.",
        "hypothesis": {
            "question": "Który przyrząd mierzy siłę?",
            "options": [
                "waga",
                "siłomierz",
                "zegarek"
            ],
            "correctIndex": 1,
            "explanation": "Siłomierz ma skalę w niutonach."
        },
        "steps": [
            "Ułóż przyrządy lub ich rysunki obok siebie.",
            "Do każdego dopasuj wielkość: czas, długość, masa, siła.",
            "Podaj przykładowy wynik wraz z jednostką."
        ],
        "observation": {
            "question": "Które przyporządkowanie jest poprawne?",
            "options": [
                "zegarek–czas, linijka–długość, siłomierz–siła, waga–masa",
                "zegarek–masa, linijka–czas, waga–siła",
                "wszystkie mierzą długość"
            ],
            "correctIndex": 0,
            "explanation": "Każdy przyrząd jest wyskalowany dla określonej wielkości."
        },
        "explanation": "Przyrząd pomiarowy porównuje mierzoną wielkość z odpowiednią jednostką. Waga szkolna mierzy masę, a siłomierz siłę — tych pojęć nie wolno zamieniać.",
        "takeaway": "Najpierw nazwij wielkość, potem wybierz przyrząd i jednostkę.",
        "quiz": [
            {
                "question": "Linijka mierzy…",
                "options": [
                    "długość",
                    "masę",
                    "siłę"
                ],
                "correctIndex": 0,
                "explanation": "Podziałka linijki jest opisana jednostkami długości."
            }
        ]
    },
    {
        "id": "force-effects",
        "task": 9,
        "moduleId": "force",
        "title": "Arena skutków siły",
        "teaser": "Czasem ciało zmienia kształt, a czasem prędkość — to dwa różne skutki.",
        "duration": "10 min",
        "difficulty": 1,
        "animation": "effects",
        "materials": [
            "gumka recepturka",
            "gąbka lub plastelina",
            "piłka",
            "mały samochodzik"
        ],
        "safety": "Nie strzelaj gumką. Zamiast łamać ołówek lub kruszyć kredę użyj gąbki albo plasteliny.",
        "goal": "Odróżnić statyczny i dynamiczny skutek oddziaływania.",
        "hypothesis": {
            "question": "Rozciągnięcie gumki jest skutkiem…",
            "options": [
                "statycznym, bo zmienia się kształt",
                "dynamicznym, bo zawsze rośnie prędkość",
                "brakiem oddziaływania"
            ],
            "correctIndex": 0,
            "explanation": "Odkształcenie jest skutkiem statycznym."
        },
        "steps": [
            "Delikatnie rozciągnij gumkę i ściśnij gąbkę lub plastelinę.",
            "Odbij piłkę i zatrzymaj poruszający się samochodzik dłonią.",
            "Podziel obserwacje na zmianę kształtu oraz zmianę ruchu."
        ],
        "observation": {
            "question": "Który przykład jest skutkiem dynamicznym?",
            "options": [
                "rozciągnięcie gumy",
                "odkształcenie plasteliny",
                "zatrzymanie roweru"
            ],
            "correctIndex": 2,
            "explanation": "Zatrzymanie oznacza zmianę prędkości."
        },
        "explanation": "Skutek statyczny oznacza zmianę kształtu ciała. Skutek dynamiczny oznacza zmianę prędkości lub kierunku ruchu — także rozpoczęcie ruchu i zatrzymanie.",
        "takeaway": "Zmiana kształtu = statyczny; zmiana ruchu = dynamiczny.",
        "quiz": [
            {
                "question": "Odbicie piłki siatkowej jest skutkiem…",
                "options": [
                    "dynamicznym",
                    "wyłącznie statycznym",
                    "żadnym"
                ],
                "correctIndex": 0,
                "explanation": "Zmienia się kierunek i prędkość piłki."
            }
        ]
    },
    {
        "id": "force-vector-twins",
        "task": 10,
        "moduleId": "force",
        "title": "Bliźniacze strzałki",
        "teaser": "Dwie siły mogą mieć wspólny kierunek i punkt, ale przeciwne zwroty.",
        "duration": "7 min",
        "difficulty": 2,
        "animation": "vector-twins",
        "materials": [
            "kartka w kratkę",
            "ołówek",
            "linijka",
            "dwa kolorowe pisaki"
        ],
        "goal": "Porównywać cechy wektorów na rysunku.",
        "hypothesis": {
            "question": "Dwie poziome strzałki wychodzą z jednego punktu, jedna w lewo, druga w prawo. Co mają wspólne?",
            "options": [
                "zwrot",
                "kierunek i punkt przyłożenia",
                "zawsze wartość"
            ],
            "correctIndex": 1,
            "explanation": "Leżą na tej samej prostej i zaczynają się w tym samym punkcie, ale mają przeciwne zwroty."
        },
        "steps": [
            "Zaznacz punkt na kartce.",
            "Narysuj z niego poziomą strzałkę w lewo i drugą w prawo.",
            "Porównaj długość, kierunek, zwrot i punkt przyłożenia."
        ],
        "observation": {
            "question": "Wektorom z rysunku zadania 10 wspólne są…",
            "options": [
                "kierunek i punkt przyłożenia",
                "zwrot i wartość",
                "tylko zwrot"
            ],
            "correctIndex": 0,
            "explanation": "Strzałki mają ten sam kierunek poziomy i wspólny początek."
        },
        "explanation": "W fizyce „kierunek” oznacza prostą działania: poziomą, pionową lub ukośną. „Zwrot” mówi, w którą stronę tej prostej skierowany jest grot.",
        "takeaway": "Kierunek to linia, zwrot to strona tej linii.",
        "quiz": [
            {
                "question": "Strzałki poziome skierowane w lewo i w prawo mają…",
                "options": [
                    "ten sam kierunek i przeciwne zwroty",
                    "różne kierunki i ten sam zwrot",
                    "zawsze taką samą wartość"
                ],
                "correctIndex": 0,
                "explanation": "Obie leżą poziomo, lecz groty wskazują przeciwne strony."
            }
        ]
    }
];
