import type { PhysicsExperiment } from '../types.ts';

export const balanceExperiments: PhysicsExperiment[] = [
    {
        "id": "balance-rope",
        "task": 11,
        "moduleId": "balance",
        "title": "Ręcznik w idealnym spokoju",
        "teaser": "Dwie osoby ciągną, a środek się nie porusza. To nie brak sił — to równowaga.",
        "duration": "8 min",
        "difficulty": 1,
        "animation": "balance-rope",
        "materials": [
            "ręcznik lub miękka lina",
            "kawałek taśmy do zaznaczenia środka"
        ],
        "safety": "Ciągnijcie łagodnie, bez szarpania. Nie owijaj liny wokół dłoni ani szyi.",
        "goal": "Zrozumieć warunki równoważenia się dwóch sił.",
        "hypothesis": {
            "question": "Co musi być prawdą, aby środek ręcznika pozostał nieruchomy?",
            "options": [
                "siły mają takie same zwroty",
                "siły mają równe wartości i przeciwne zwroty",
                "jedna siła jest większa"
            ],
            "correctIndex": 1,
            "explanation": "Dwie siły równoważą się, gdy działają wzdłuż tej samej prostej, mają równe wartości i przeciwne zwroty."
        },
        "steps": [
            "Zaznacz środek ręcznika taśmą.",
            "Dwie osoby chwytają końce i ciągną spokojnie w przeciwne strony.",
            "Najpierw utrzymajcie środek w miejscu, potem jedna osoba lekko zwiększa siłę."
        ],
        "observation": {
            "question": "Co dzieje się, gdy jedna siła staje się większa?",
            "options": [
                "środek rusza w stronę większej siły",
                "siły nadal się równoważą",
                "ręcznik traci masę"
            ],
            "correctIndex": 0,
            "explanation": "Pojawia się niezerowa siła wypadkowa."
        },
        "explanation": "Spoczynek nie oznacza, że nie działają żadne siły. Mogą działać dwie siły, które wzajemnie znoszą swoje skutki. Ich wypadkowa wynosi wtedy 0 N.",
        "takeaway": "Równe wartości i przeciwne zwroty dają równowagę.",
        "quiz": [
            {
                "question": "Dwie siły równoważące się mają…",
                "options": [
                    "przeciwne zwroty i taką samą wartość",
                    "ten sam zwrot i różne wartości",
                    "różne kierunki bez znaczenia"
                ],
                "correctIndex": 0,
                "explanation": "To podstawowy warunek równowagi dwóch sił działających wzdłuż jednej prostej."
            }
        ]
    },
    {
        "id": "balance-diagrams",
        "task": 12,
        "moduleId": "balance",
        "title": "Łowca równowagi",
        "teaser": "Spośród kilku rysunków tylko jeden ma dwie identyczne strzałki w przeciwne strony.",
        "duration": "6 min",
        "difficulty": 2,
        "animation": "balance-diagrams",
        "materials": [
            "kartka",
            "linijka",
            "ołówek"
        ],
        "goal": "Rozpoznawać siły równoważące się na diagramie.",
        "hypothesis": {
            "question": "Która para może się równoważyć?",
            "options": [
                "3 N w górę i 3 N w prawo",
                "4 N w prawo i 4 N w prawo",
                "5 N w lewo i 5 N w prawo"
            ],
            "correctIndex": 2,
            "explanation": "Siły mają równe wartości, ten sam kierunek i przeciwne zwroty."
        },
        "steps": [
            "Narysuj trzy pary strzałek odpowiadające podanym opcjom.",
            "Sprawdź po kolei wartość, kierunek i zwrot każdej pary.",
            "Zakreśl parę, której suma wektorowa wynosi 0 N."
        ],
        "observation": {
            "question": "Który rysunek z zadania 12 przedstawia równowagę?",
            "options": [
                "A",
                "B",
                "C",
                "D"
            ],
            "correctIndex": 2,
            "explanation": "Na rysunku C są siły 5 N o przeciwnych zwrotach."
        },
        "explanation": "Wartość nie wystarcza. Siły równoważące muszą działać wzdłuż tej samej prostej, mieć równe wartości i przeciwne zwroty.",
        "takeaway": "Sprawdź trzy rzeczy: wspólny kierunek, równe długości, przeciwne groty.",
        "quiz": [
            {
                "question": "Czy 2 N w lewo i 3 N w prawo się równoważą?",
                "options": [
                    "tak",
                    "nie",
                    "tylko na ciężkim ciele"
                ],
                "correctIndex": 1,
                "explanation": "Wartości nie są równe, więc wypadkowa nie wynosi 0 N."
            }
        ]
    },
    {
        "id": "resultant-block",
        "task": 13,
        "moduleId": "balance",
        "title": "Pojedynek 2 N kontra 3 N",
        "teaser": "Przy przeciwnych zwrotach odejmujemy wartości, a wygrywa większa siła.",
        "duration": "8 min",
        "difficulty": 2,
        "animation": "resultant",
        "materials": [
            "kartka w kratkę",
            "linijka",
            "dwa pisaki"
        ],
        "goal": "Obliczać siłę wypadkową dwóch sił o przeciwnych zwrotach.",
        "hypothesis": {
            "question": "Na klocek działa 2 N w lewo i 3 N w prawo. W którą stronę jest wypadkowa?",
            "options": [
                "w lewo",
                "w prawo",
                "wynosi 0 N"
            ],
            "correctIndex": 1,
            "explanation": "Większa jest siła skierowana w prawo."
        },
        "steps": [
            "Narysuj z jednego punktu strzałkę długości 2 kratek w lewo.",
            "Narysuj strzałkę długości 3 kratek w prawo.",
            "Odejmij mniejszą wartość od większej i zachowaj zwrot większej siły."
        ],
        "observation": {
            "question": "Jaka jest siła wypadkowa?",
            "options": [
                "5 N w prawo",
                "1 N w prawo",
                "1 N w lewo"
            ],
            "correctIndex": 1,
            "explanation": "3 N − 2 N = 1 N, zwrot w prawo."
        },
        "explanation": "Dla sił działających wzdłuż jednej prostej i mających przeciwne zwroty odejmujemy ich wartości. Zwrot wypadkowej jest taki jak zwrot większej siły.",
        "takeaway": "Przeciwne zwroty: odejmij i wybierz stronę większej siły.",
        "quiz": [
            {
                "question": "7 N w lewo i 4 N w prawo dają…",
                "options": [
                    "11 N w lewo",
                    "3 N w lewo",
                    "3 N w prawo"
                ],
                "correctIndex": 1,
                "explanation": "7 − 4 = 3 N, a większa siła działa w lewo."
            }
        ]
    },
    {
        "id": "resultant-brothers",
        "task": 14,
        "moduleId": "balance",
        "title": "Dwaj bracia kontra jedno biurko",
        "teaser": "Gdy siły działają w tę samą stronę, ich wartości się dodają.",
        "duration": "7 min",
        "difficulty": 1,
        "animation": "brothers",
        "materials": [
            "dwa sznurki lub dwie strzałki z papieru",
            "pudełko zamiast ciężkiego biurka"
        ],
        "safety": "Nie przesuwajcie ciężkiego mebla. Zróbcie model z lekkim pudełkiem.",
        "goal": "Obliczać wypadkową sił o zgodnych zwrotach.",
        "hypothesis": {
            "question": "Bracia pchają w tę samą stronę siłami 100 N i 150 N. Jaka jest wypadkowa?",
            "options": [
                "50 N",
                "250 N",
                "150 N"
            ],
            "correctIndex": 1,
            "explanation": "Zgodne zwroty oznaczają dodawanie wartości."
        },
        "steps": [
            "Ustaw przy pudełku dwie papierowe strzałki skierowane w tę samą stronę.",
            "Podpisz je 100 N i 150 N.",
            "Zastąp je jedną strzałką odpowiadającą sumie."
        ],
        "observation": {
            "question": "Jaką siłą musiałby działać ojciec, aby uzyskać ten sam skutek?",
            "options": [
                "250 N w tę samą stronę",
                "50 N w przeciwną stronę",
                "0 N"
            ],
            "correctIndex": 0,
            "explanation": "100 N + 150 N = 250 N."
        },
        "explanation": "Siły wzdłuż jednej prostej o tych samych zwrotach dodają się. Jedna siła zastępująca ich wspólny skutek jest siłą wypadkową.",
        "takeaway": "Ten sam zwrot: dodawaj wartości.",
        "quiz": [
            {
                "question": "2 N w prawo i 5 N w prawo dają…",
                "options": [
                    "3 N w prawo",
                    "7 N w prawo",
                    "7 N w lewo"
                ],
                "correctIndex": 1,
                "explanation": "Wartości sił o zgodnych zwrotach sumują się."
            }
        ]
    },
    {
        "id": "resultant-zero",
        "task": 15,
        "moduleId": "balance",
        "title": "Detektor zera",
        "teaser": "Wypadkowa 0 N oznacza równowagę, nie brak działania.",
        "duration": "7 min",
        "difficulty": 2,
        "animation": "zero-resultant",
        "materials": [
            "4 karteczki P/F",
            "kartka",
            "długopis"
        ],
        "goal": "Ocenić prawdziwość zdań o zerowej sile wypadkowej.",
        "hypothesis": {
            "question": "Jeżeli wypadkowa dwóch sił wynosi 0 N, to siły…",
            "options": [
                "mają takie same zwroty",
                "równoważą się",
                "muszą mieć różne wartości"
            ],
            "correctIndex": 1,
            "explanation": "Wypadkowa 0 N jest definicją równowagi sił."
        },
        "steps": [
            "Napisz cztery zdania z zadania 15 na osobnych kartkach.",
            "Do każdego przyłóż kartę P albo F.",
            "Dla zdań fałszywych narysuj kontrprzykład za pomocą strzałek."
        ],
        "observation": {
            "question": "Który układ odpowiedzi jest poprawny?",
            "options": [
                "P, F, F, P",
                "P, P, F, F",
                "F, P, P, F"
            ],
            "correctIndex": 0,
            "explanation": "Siły równoważą się; nie mają tych samych zwrotów; nie mają różnych wartości; mają równe wartości i przeciwne zwroty."
        },
        "explanation": "Dwie siły wzdłuż tej samej prostej dają 0 N tylko wtedy, gdy są równe co do wartości i mają przeciwne zwroty.",
        "takeaway": "Wypadkowa 0 N: równe wartości, przeciwne zwroty.",
        "quiz": [
            {
                "question": "Czy dwie siły po 6 N skierowane przeciwnie mogą dać 0 N?",
                "options": [
                    "tak",
                    "nie",
                    "tylko gdy jedna jest większa"
                ],
                "correctIndex": 0,
                "explanation": "Równe wartości i przeciwne zwroty równoważą się."
            }
        ]
    }
];
