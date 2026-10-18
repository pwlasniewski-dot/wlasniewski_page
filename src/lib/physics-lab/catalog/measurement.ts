import type { PhysicsExperiment } from '../types.ts';

export const measurementExperiments: PhysicsExperiment[] = [
    {
        "id": "measurement-graph",
        "task": 16,
        "moduleId": "measurement",
        "title": "Wykres, który liczy obciążniki",
        "teaser": "Każde dwa obciążniki zwiększają wskazanie o 1 N.",
        "duration": "9 min",
        "difficulty": 2,
        "animation": "graph",
        "materials": [
            "kartka w kratkę",
            "linijka",
            "ołówek"
        ],
        "goal": "Odczytywać wartości z wykresu liniowego.",
        "hypothesis": {
            "question": "Skoro 6 obciążników daje 3 N, ile daje 1 obciążnik?",
            "options": [
                "0,5 N",
                "2 N",
                "3 N"
            ],
            "correctIndex": 0,
            "explanation": "3 N ÷ 6 = 0,5 N na jeden obciążnik."
        },
        "steps": [
            "Narysuj osie: liczba obciążników oraz F w niutonach.",
            "Zaznacz punkty (0,0), (2,1), (4,2), (6,3) i połącz linią.",
            "Od liczby 5 poprowadź linię do wykresu, a potem do osi F."
        ],
        "observation": {
            "question": "Co wskazuje siłomierz przy 5 obciążnikach?",
            "options": [
                "1 N",
                "2 N",
                "2,5 N",
                "5 N"
            ],
            "correctIndex": 2,
            "explanation": "5 × 0,5 N = 2,5 N."
        },
        "explanation": "Na wykresie wybierasz wartość na osi poziomej, dochodzisz do linii zależności, a następnie odczytujesz wynik na osi pionowej. Tutaj zależność jest proporcjonalna.",
        "takeaway": "Czytaj wykres ruchem: oś X → linia → oś Y.",
        "quiz": [
            {
                "question": "Ile wskaże ten sam wykres dla 3 obciążników?",
                "options": [
                    "1,5 N",
                    "3 N",
                    "6 N"
                ],
                "correctIndex": 0,
                "explanation": "3 × 0,5 N = 1,5 N."
            }
        ]
    },
    {
        "id": "measurement-dynamometer",
        "task": 17,
        "moduleId": "measurement",
        "title": "Najmniejsza działka siłomierza",
        "teaser": "Dokładność odczytu ukrywa się w odstępie między sąsiednimi kreskami.",
        "duration": "8 min",
        "difficulty": 2,
        "animation": "dynamometer",
        "materials": [
            "rysunek siłomierza z testu",
            "ołówek"
        ],
        "goal": "Wyznaczać wartość najmniejszej działki skali.",
        "hypothesis": {
            "question": "Między 40 N i 80 N są cztery równe odstępy. Ile ma jeden odstęp?",
            "options": [
                "4 N",
                "10 N",
                "40 N"
            ],
            "correctIndex": 1,
            "explanation": "Różnica 40 N podzielona przez 4 odstępy daje 10 N."
        },
        "steps": [
            "Wybierz dwie podpisane wartości na skali, np. 40 N i 80 N.",
            "Oblicz różnicę: 80 N − 40 N = 40 N.",
            "Policz odstępy, nie kreski, i podziel różnicę przez ich liczbę."
        ],
        "observation": {
            "question": "Dokładność siłomierza z zadania wynosi…",
            "options": [
                "1 N",
                "4 N",
                "5 N",
                "10 N"
            ],
            "correctIndex": 3,
            "explanation": "Najmniejsza działka odpowiada 10 N."
        },
        "explanation": "Wartość najmniejszej działki obliczasz, odejmując dwie sąsiednie podpisane wartości i dzieląc wynik przez liczbę równych odstępów między nimi.",
        "takeaway": "Różnica wartości ÷ liczba odstępów = najmniejsza działka.",
        "quiz": [
            {
                "question": "Od 0 do 20 N są cztery równe odstępy. Jedna działka ma…",
                "options": [
                    "4 N",
                    "5 N",
                    "20 N"
                ],
                "correctIndex": 1,
                "explanation": "20 N ÷ 4 = 5 N."
            }
        ]
    },
    {
        "id": "measurement-volume",
        "task": 18,
        "moduleId": "measurement",
        "title": "500 cm³ w różnych przebraniach",
        "teaser": "Pół litra to 500 cm³, 0,5 dm³ i 0,0005 m³.",
        "duration": "10 min",
        "difficulty": 2,
        "animation": "volume",
        "materials": [
            "butelka 500 ml",
            "miarka kuchenna",
            "kartka"
        ],
        "goal": "Przeliczać jednostki objętości.",
        "hypothesis": {
            "question": "Ile centymetrów sześciennych ma 1 ml?",
            "options": [
                "1 cm³",
                "10 cm³",
                "100 cm³"
            ],
            "correctIndex": 0,
            "explanation": "1 mililitr jest równy 1 centymetrowi sześciennemu."
        },
        "steps": [
            "Odczytaj na butelce objętość 500 ml.",
            "Zapisz równość: 500 ml = 500 cm³ = 0,5 dm³.",
            "Aby przejść z cm³ do m³, podziel przez 1 000 000."
        ],
        "observation": {
            "question": "500 cm³ to…",
            "options": [
                "0,0005 m³",
                "0,005 m³",
                "5 dm³",
                "0,05 dm³"
            ],
            "correctIndex": 0,
            "explanation": "500 ÷ 1 000 000 = 0,0005 m³."
        },
        "explanation": "Jednostki objętości są sześcienne, dlatego przelicznik rośnie do trzeciej potęgi. 1 m³ = 1 000 000 cm³, a 1 dm³ = 1000 cm³.",
        "takeaway": "Pamiętaj: 1 ml = 1 cm³, a 1 l = 1 dm³.",
        "quiz": [
            {
                "question": "250 ml to…",
                "options": [
                    "250 cm³",
                    "25 cm³",
                    "2,5 dm³"
                ],
                "correctIndex": 0,
                "explanation": "Mililitr i centymetr sześcienny mają tę samą wartość objętości."
            }
        ]
    },
    {
        "id": "measurement-force-scale",
        "task": 19,
        "moduleId": "measurement",
        "title": "Strzałka na skalę",
        "teaser": "Długość wektora staje się liczbą, gdy znasz skalę rysunku.",
        "duration": "8 min",
        "difficulty": 2,
        "animation": "force-scale",
        "materials": [
            "kartka w kratkę",
            "linijka",
            "ołówek"
        ],
        "goal": "Odczytać wartość siły z graficznej skali i przeliczyć N na kN.",
        "hypothesis": {
            "question": "Jedna działka strzałki oznacza 2 N. Strzałka ma 4 działki. Jaka jest wartość?",
            "options": [
                "2 N",
                "6 N",
                "8 N"
            ],
            "correctIndex": 2,
            "explanation": "4 × 2 N = 8 N."
        },
        "steps": [
            "Narysuj odcinek wzorcowy długości jednej kratki i podpisz 2 N.",
            "Narysuj wektor długości czterech takich odcinków.",
            "Pomnóż liczbę odcinków przez skalę, a następnie podziel N przez 1000, aby otrzymać kN."
        ],
        "observation": {
            "question": "8 N to ile kiloniutonów?",
            "options": [
                "0,008 kN",
                "0,08 kN",
                "8 kN"
            ],
            "correctIndex": 0,
            "explanation": "8 N ÷ 1000 = 0,008 kN."
        },
        "explanation": "Graficzne przedstawienie siły wymaga skali. Najpierw ustalasz, ile wzorcowych odcinków mieści się w strzałce, a potem przeliczasz jednostkę.",
        "takeaway": "Wartość siły = liczba odcinków × wartość jednego odcinka.",
        "quiz": [
            {
                "question": "Skala: 1 cm = 5 N. Wektor ma 3 cm. Jego wartość to…",
                "options": [
                    "8 N",
                    "15 N",
                    "0,6 N"
                ],
                "correctIndex": 1,
                "explanation": "3 × 5 N = 15 N."
            }
        ]
    },
    {
        "id": "measurement-cart-balance",
        "task": 20,
        "moduleId": "measurement",
        "title": "Trzecia siła ratuje wózek",
        "teaser": "Dwie siły ciągną w lewo. Jedna odpowiednio duża strzałka w prawo przywraca spokój.",
        "duration": "8 min",
        "difficulty": 2,
        "animation": "cart-balance",
        "materials": [
            "mały samochodzik",
            "3 kawałki sznurka lub papierowe strzałki",
            "kartka"
        ],
        "safety": "Nie mocuj sznurków do ciężkich mebli ani osób. Użyj lekkiego modelu.",
        "goal": "Dorysować siłę równoważącą kilka sił.",
        "hypothesis": {
            "question": "Na wózek działają 3 N w lewo i 2 N w lewo. Jaka trzecia siła da równowagę?",
            "options": [
                "1 N w prawo",
                "5 N w prawo",
                "5 N w lewo"
            ],
            "correctIndex": 1,
            "explanation": "Dwie lewe siły sumują się do 5 N, więc potrzeba 5 N w prawo."
        },
        "steps": [
            "Narysuj dwie strzałki w lewo: 3 N i 2 N.",
            "Dodaj ich wartości: razem 5 N w lewo.",
            "Narysuj trzecią strzałkę 5 N w prawo, aby wypadkowa wyniosła 0 N."
        ],
        "observation": {
            "question": "Jaki jest zwrot brakującej siły?",
            "options": [
                "w lewo",
                "w prawo",
                "pionowo w górę"
            ],
            "correctIndex": 1,
            "explanation": "Musi być przeciwny do sumy istniejących sił."
        },
        "explanation": "Najpierw obliczasz wypadkową znanych sił. Następnie rysujesz siłę o tej samej wartości, tym samym kierunku i przeciwnym zwrocie.",
        "takeaway": "Siła równoważąca jest przeciwieństwem siły wypadkowej.",
        "quiz": [
            {
                "question": "4 N w prawo i 1 N w prawo równoważy siła…",
                "options": [
                    "3 N w lewo",
                    "5 N w lewo",
                    "5 N w prawo"
                ],
                "correctIndex": 1,
                "explanation": "Znane siły dają 5 N w prawo, więc równoważąca ma 5 N w lewo."
            }
        ]
    }
];
