import type { PhysicsExperiment } from '../types.ts';

export const task03Experiments: PhysicsExperiment[] = [
    {
        "id": "phenomenon-ball",
        "task": 3,
        "moduleId": "world",
        "title": "Zatrzymaj spadającą piłkę",
        "teaser": "Piłka jest ciałem, a jej spadanie jest tym, co się dzieje.",
        "duration": "6 min",
        "difficulty": 1,
        "animation": "falling-ball",
        "materials": [
            "lekka piłka",
            "wolna przestrzeń przy podłodze"
        ],
        "safety": "Nie rzucaj piłki w lampę, okno ani drugą osobę.",
        "goal": "Odróżnić ciało fizyczne od zjawiska fizycznego.",
        "hypothesis": {
            "question": "Co jest zjawiskiem?",
            "options": [
                "piłka",
                "spadanie piłki",
                "guma, z której wykonano piłkę"
            ],
            "correctIndex": 1,
            "explanation": "Zjawisko opisuje zmianę lub przebieg zdarzenia."
        },
        "steps": [
            "Trzymaj piłkę nieruchomo i nazwij obiekt, który widzisz.",
            "Upuść piłkę z niewielkiej wysokości.",
            "Powiedz osobno: co jest ciałem, a co zjawiskiem."
        ],
        "observation": {
            "question": "Wyrażenie „spadająca piłka” w zadaniu oznacza przede wszystkim…",
            "options": [
                "ciało fizyczne będące w ruchu",
                "samą substancję",
                "jednostkę czasu"
            ],
            "correctIndex": 0,
            "explanation": "Rzeczownikiem jest piłka, czyli ciało. „Spadanie piłki” byłoby nazwą zjawiska."
        },
        "explanation": "Ciało może uczestniczyć w zjawisku i nadal pozostaje ciałem. Piłka jest obiektem. Jej ruch, spadanie, odbicie czy odkształcenie są zjawiskami.",
        "takeaway": "Ciało to „co?”, a zjawisko to „co się dzieje?”.",
        "quiz": [
            {
                "question": "Które określenie jest nazwą zjawiska?",
                "options": [
                    "kawałek drutu",
                    "Księżyc",
                    "parowanie wody"
                ],
                "correctIndex": 2,
                "explanation": "Parowanie opisuje proces zmiany wody w parę."
            }
        ]
    },
    {
        "id": "phenomenon-sound",
        "task": 3,
        "moduleId": "world",
        "title": "Linijka, która śpiewa",
        "teaser": "Drgania są widoczne, a dźwięk słychać — lecz nie da się go chwycić.",
        "duration": "7 min",
        "difficulty": 1,
        "animation": "ruler-sound",
        "materials": [
            "plastikowa linijka",
            "stół"
        ],
        "safety": "Nie wyginaj linijki zbyt mocno i trzymaj twarz z dala od jej końca.",
        "goal": "Zobaczyć związek ciała, drgań i dźwięku.",
        "hypothesis": {
            "question": "Co zniknie, gdy zatrzymasz drgającą linijkę dłonią?",
            "options": [
                "stół",
                "dźwięk",
                "materiał linijki"
            ],
            "correctIndex": 1,
            "explanation": "Dźwięk powstaje dzięki drganiom. Po ich zatrzymaniu cichnie."
        },
        "steps": [
            "Połóż część linijki na stole i mocno ją przytrzymaj.",
            "Wystający koniec odegnij lekko i puść.",
            "Po chwili dotknij drgającej linijki, aby ją zatrzymać."
        ],
        "observation": {
            "question": "Który podział jest prawidłowy?",
            "options": [
                "linijka — zjawisko, dźwięk — ciało",
                "linijka — ciało, drganie i dźwięk — zjawiska",
                "wszystko jest substancją"
            ],
            "correctIndex": 1,
            "explanation": "Linijka jest obiektem, a drganie i rozchodzenie się dźwięku są procesami."
        },
        "explanation": "Dźwięk jest zjawiskiem związanym z drganiami i rozchodzeniem się zaburzenia w ośrodku. Linijka jest ciałem fizycznym, które może drgać.",
        "takeaway": "Dźwięk jest zjawiskiem, nie przedmiotem.",
        "quiz": [
            {
                "question": "Co jest ciałem fizycznym?",
                "options": [
                    "dźwięk",
                    "rozchodzenie się ciepła",
                    "linijka"
                ],
                "correctIndex": 2,
                "explanation": "Linijka jest konkretnym obiektem."
            }
        ]
    },
    {
        "id": "phenomenon-condensation",
        "task": 3,
        "moduleId": "world",
        "title": "Woda pojawia się „znikąd”",
        "teaser": "Krople na zimnej szklance nie przeszły przez szkło.",
        "duration": "10 min",
        "difficulty": 1,
        "animation": "condensation",
        "materials": [
            "szklanka",
            "zimna woda",
            "kilka kostek lodu",
            "ręcznik papierowy"
        ],
        "safety": "Wytrzyj rozlaną wodę, aby nikt się nie poślizgnął.",
        "goal": "Zaobserwować skraplanie pary wodnej.",
        "hypothesis": {
            "question": "Skąd pojawią się krople na zewnętrznej stronie szklanki?",
            "options": [
                "Woda przejdzie przez szkło",
                "Para wodna z powietrza się skropli",
                "Szklanka zacznie produkować wodę"
            ],
            "correctIndex": 1,
            "explanation": "Zimna powierzchnia ochładza parę wodną obecną w powietrzu."
        },
        "steps": [
            "Napełnij szklankę zimną wodą i dodaj lód.",
            "Wytrzyj zewnętrzną powierzchnię do sucha.",
            "Odczekaj kilka minut i obserwuj tworzące się krople."
        ],
        "observation": {
            "question": "Jak nazywa się obserwowane zjawisko?",
            "options": [
                "topnienie szkła",
                "skraplanie pary wodnej",
                "elektryzowanie"
            ],
            "correctIndex": 1,
            "explanation": "Para wodna zmienia się w ciekłą wodę."
        },
        "explanation": "Powietrze zawiera niewidoczną parę wodną. Gdy dotyka zimnej szklanki, ochładza się i część pary zmienia stan skupienia na ciekły. To skraplanie.",
        "takeaway": "Skraplanie to przemiana pary w ciecz.",
        "quiz": [
            {
                "question": "Co jest tutaj ciałem fizycznym?",
                "options": [
                    "skraplanie",
                    "szklanka",
                    "parowanie"
                ],
                "correctIndex": 1,
                "explanation": "Szklanka jest konkretnym obiektem."
            }
        ]
    }
];
