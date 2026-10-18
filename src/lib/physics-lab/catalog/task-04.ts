import type { PhysicsExperiment } from '../types.ts';

export const task04Experiments: PhysicsExperiment[] = [
    {
        "id": "phenomena-ice",
        "task": 4,
        "moduleId": "world",
        "title": "Wyścig kostek lodu",
        "teaser": "„Zimny” metal zwykle topi lód szybciej niż cieplejsze w dotyku drewno.",
        "duration": "12 min",
        "difficulty": 2,
        "animation": "ice-race",
        "materials": [
            "2 podobne kostki lodu",
            "metalowa taca lub patelnia",
            "drewniana deska",
            "ręcznik"
        ],
        "safety": "Użyj zimnej, nie rozgrzanej patelni. Po doświadczeniu wytrzyj wodę.",
        "goal": "Zaobserwować topnienie i przepływ ciepła.",
        "hypothesis": {
            "question": "Na czym kostka zwykle stopi się szybciej?",
            "options": [
                "na metalu",
                "na drewnie",
                "zawsze dokładnie tak samo"
            ],
            "correctIndex": 0,
            "explanation": "Metal znacznie sprawniej przewodzi energię cieplną z otoczenia do lodu."
        },
        "steps": [
            "Połóż metal i drewno obok siebie w tym samym pokoju.",
            "Na każdej powierzchni połóż podobną kostkę lodu w tej samej chwili.",
            "Obserwuj przez kilka minut ilość powstałej wody i rozmiar kostek."
        ],
        "observation": {
            "question": "Jakie dwa zjawiska obserwujesz?",
            "options": [
                "topnienie i przepływ ciepła",
                "tylko ruch obrotowy",
                "skraplanie metalu"
            ],
            "correctIndex": 0,
            "explanation": "Lód topnieje dzięki energii przekazywanej z otoczenia."
        },
        "explanation": "Metal może wydawać się zimniejszy, bo szybciej odbiera energię z dłoni. Z tego samego powodu szybciej przekazuje energię do lodu. Topnienie i przepływ ciepła są zjawiskami fizycznymi.",
        "takeaway": "Odczucie „zimna” nie zawsze mówi, który przedmiot ma niższą temperaturę.",
        "quiz": [
            {
                "question": "Co w tym doświadczeniu jest ciałem, a nie zjawiskiem?",
                "options": [
                    "topnienie",
                    "przepływ ciepła",
                    "kostka lodu"
                ],
                "correctIndex": 2,
                "explanation": "Kostka lodu jest konkretnym obiektem."
            }
        ]
    },
    {
        "id": "phenomena-evaporation",
        "task": 4,
        "moduleId": "world",
        "title": "Która dłoń wyschnie szybciej?",
        "teaser": "Ruch powietrza przyspiesza parowanie i daje odczucie chłodu.",
        "duration": "5 min",
        "difficulty": 1,
        "animation": "evaporation",
        "materials": [
            "odrobina wody",
            "ręcznik"
        ],
        "goal": "Zaobserwować parowanie i wpływ ruchu powietrza.",
        "hypothesis": {
            "question": "Która mokra dłoń wyschnie szybciej?",
            "options": [
                "ta, na którą dmuchasz",
                "nieruchoma",
                "obie zawsze identycznie"
            ],
            "correctIndex": 0,
            "explanation": "Ruch powietrza usuwa wilgotną warstwę znad skóry i ułatwia parowanie."
        },
        "steps": [
            "Zwilż obie dłonie podobną ilością wody.",
            "Jedną trzymaj nieruchomo, na drugą delikatnie dmuchaj lub poruszaj nią.",
            "Porównaj szybkość wysychania i odczucie temperatury."
        ],
        "observation": {
            "question": "Dlaczego poruszana dłoń wydaje się chłodniejsza?",
            "options": [
                "Woda podczas parowania pobiera energię",
                "Dłoń zmienia się w lód",
                "Powietrze zwiększa masę dłoni"
            ],
            "correctIndex": 0,
            "explanation": "Parowanie wymaga energii, którą woda pobiera między innymi ze skóry."
        },
        "explanation": "Parowanie jest przemianą cieczy w gaz zachodzącą z powierzchni cieczy. Ruch powietrza może je przyspieszyć. Dlatego pot i wiatr pomagają chłodzić ciało.",
        "takeaway": "Parowanie to zjawisko, które może chłodzić.",
        "quiz": [
            {
                "question": "Który zestaw zawiera tylko zjawiska?",
                "options": [
                    "deszcz, parowanie, topnienie",
                    "lód, parowanie, termometr",
                    "Słońce, topnienie, klocek"
                ],
                "correctIndex": 0,
                "explanation": "Każdy element pierwszego zestawu opisuje zdarzenie lub proces."
            }
        ]
    },
    {
        "id": "phenomena-circuit",
        "task": 4,
        "moduleId": "world",
        "title": "Latarka i zamknięty obwód",
        "teaser": "Jedna mała przerwa sprawia, że prąd przestaje płynąć.",
        "duration": "6 min",
        "difficulty": 1,
        "animation": "circuit",
        "materials": [
            "zwykła latarka na baterie"
        ],
        "safety": "Używaj wyłącznie urządzenia na baterie. Nie rozbieraj gniazdek ani sprzętu podłączonego do sieci.",
        "goal": "Rozpoznać przepływ prądu jako zjawisko fizyczne.",
        "hypothesis": {
            "question": "Co stanie się po przerwaniu połączenia baterii w latarce?",
            "options": [
                "latarka zgaśnie",
                "będzie świecić jaśniej",
                "bateria zniknie"
            ],
            "correctIndex": 0,
            "explanation": "Prąd płynie, gdy obwód jest zamknięty."
        },
        "steps": [
            "Włącz latarkę i zobacz świecącą diodę lub żarówkę.",
            "Wyłącz ją przełącznikiem albo lekko odkręć zakrętkę zgodnie z konstrukcją latarki.",
            "Ponownie zamknij obwód i obserwuj powrót światła."
        ],
        "observation": {
            "question": "Co jest zjawiskiem?",
            "options": [
                "latarka",
                "bateria",
                "przepływ prądu"
            ],
            "correctIndex": 2,
            "explanation": "Latarka i bateria są ciałami, a przepływ prądu jest zjawiskiem."
        },
        "explanation": "W zamkniętym obwodzie ładunki elektryczne mogą się przemieszczać. Przepływ prądu jest zjawiskiem fizycznym, natomiast przewody, bateria i latarka są ciałami.",
        "takeaway": "Prąd płynie tylko przez zamkniętą drogę.",
        "quiz": [
            {
                "question": "Który zestaw zawiera wyłącznie zjawiska fizyczne?",
                "options": [
                    "przepływ prądu, parowanie, grawitacja",
                    "klocek, siłomierz, termometr",
                    "Słońce, lód, skraplanie"
                ],
                "correctIndex": 0,
                "explanation": "Pierwszy zestaw nie zawiera ciał fizycznych."
            }
        ]
    }
];
