import type { PhysicsExperiment } from '../types.ts';

export const task05Experiments: PhysicsExperiment[] = [
    {
        "id": "interactions-magnets",
        "task": 5,
        "moduleId": "world",
        "title": "Magnesy ruszają jednocześnie",
        "teaser": "Nie ma jednego „aktywnego” magnesu — oba działają na siebie.",
        "duration": "8 min",
        "difficulty": 1,
        "animation": "magnets",
        "materials": [
            "2 magnesy",
            "2 lekkie zakrętki, małe samochodziki albo gładkie kartoniki"
        ],
        "safety": "Małe magnesy trzymaj z dala od młodszych dzieci, kart płatniczych i delikatnej elektroniki.",
        "goal": "Zrozumieć wzajemność oddziaływań.",
        "hypothesis": {
            "question": "Gdy dwa swobodne magnesy się przyciągają, który zacznie się poruszać?",
            "options": [
                "tylko pierwszy",
                "tylko drugi",
                "oba"
            ],
            "correctIndex": 2,
            "explanation": "Każdy magnes działa na drugi i sam doświadcza oddziaływania."
        },
        "steps": [
            "Połóż magnesy na lekkich podstawkach, aby łatwo się przesuwały.",
            "Ustaw przeciwne bieguny naprzeciw siebie i puść jednocześnie.",
            "Odwróć jeden magnes i obserwuj odpychanie."
        ],
        "observation": {
            "question": "Co pokazuje ruch obu magnesów?",
            "options": [
                "wzajemność oddziaływań",
                "taką samą objętość",
                "brak jakiejkolwiek siły"
            ],
            "correctIndex": 0,
            "explanation": "Jeżeli A działa na B, to B także działa na A."
        },
        "explanation": "Oddziaływanie zawsze dotyczy co najmniej dwóch ciał. Magnesy mogą się przyciągać lub odpychać, ale oba uczestniczą w tym samym oddziaływaniu.",
        "takeaway": "Ciała oddziałują na siebie wzajemnie.",
        "quiz": [
            {
                "question": "Dwa magnesy przyciągają się. Świadczy to o…",
                "options": [
                    "wzajemności oddziaływań",
                    "takim samym kształcie",
                    "oddziaływaniu elektrostatycznym"
                ],
                "correctIndex": 0,
                "explanation": "Każdy magnes działa na drugi."
            }
        ]
    },
    {
        "id": "interactions-gravity",
        "task": 5,
        "moduleId": "world",
        "title": "Piłka zawsze wraca",
        "teaser": "Grawitacja działa także wtedy, gdy piłka jeszcze leci do góry.",
        "duration": "6 min",
        "difficulty": 1,
        "animation": "gravity",
        "materials": [
            "lekka piłka",
            "wolna przestrzeń"
        ],
        "safety": "Rzucaj nisko, z dala od lamp, szyb i innych osób.",
        "goal": "Rozpoznać oddziaływanie grawitacyjne.",
        "hypothesis": {
            "question": "Co dzieje się z prędkością piłki lecącej pionowo do góry?",
            "options": [
                "rośnie bez końca",
                "maleje, aż piłka zawraca",
                "pozostaje zawsze taka sama"
            ],
            "correctIndex": 1,
            "explanation": "Grawitacja jest skierowana w dół i hamuje ruch piłki ku górze."
        },
        "steps": [
            "Podrzuć piłkę niezbyt wysoko.",
            "Obserwuj lot w górę, chwilę w najwyższym punkcie i spadanie.",
            "Wskaż kierunek działania grawitacji w każdej części lotu."
        ],
        "observation": {
            "question": "Dlaczego piłka spada?",
            "options": [
                "z powodu oddziaływania grawitacyjnego Ziemi",
                "z powodu magnetyzmu",
                "z powodu elektryzowania"
            ],
            "correctIndex": 0,
            "explanation": "Ziemia przyciąga piłkę grawitacyjnie."
        },
        "explanation": "Ziemia oddziałuje grawitacyjnie na wszystkie ciała mające masę. Siła grawitacji działa w dół przez cały lot piłki, nie dopiero od chwili spadania.",
        "takeaway": "Grawitacja przyciąga ciała w stronę Ziemi.",
        "quiz": [
            {
                "question": "Spadająca z ręki piłka jest skutkiem oddziaływania…",
                "options": [
                    "mechanicznego dłoni po puszczeniu",
                    "grawitacyjnego",
                    "magnetycznego"
                ],
                "correctIndex": 1,
                "explanation": "Po puszczeniu główną przyczyną spadania jest grawitacja."
            }
        ]
    },
    {
        "id": "interactions-electrostatic",
        "task": 5,
        "moduleId": "world",
        "title": "Zakrzywiony strumień wody",
        "teaser": "Naelektryzowany grzebień potrafi przyciągnąć wodę bez dotykania jej.",
        "duration": "8 min",
        "difficulty": 2,
        "animation": "electrostatic",
        "materials": [
            "plastikowy grzebień lub nadmuchany balon",
            "suche włosy lub wełniana tkanina",
            "kran z cienkim strumieniem",
            "ręcznik"
        ],
        "safety": "Wykonuj doświadczenie z dala od gniazdek i urządzeń elektrycznych. Wytrzyj wodę.",
        "goal": "Zaobserwować oddziaływanie elektrostatyczne.",
        "hypothesis": {
            "question": "Co zrobi cienki strumień wody po zbliżeniu potartego grzebienia?",
            "options": [
                "odchyli się w stronę grzebienia",
                "zamieni się w lód",
                "zacznie płynąć do góry bez końca"
            ],
            "correctIndex": 0,
            "explanation": "Naelektryzowany grzebień przyciąga cząsteczki wody."
        },
        "steps": [
            "Ustaw bardzo cienki, równy strumień wody.",
            "Potrzyj grzebień lub balon o suche włosy przez około 15 sekund.",
            "Zbliż go do strumienia bez dotykania wody i obserwuj odchylenie."
        ],
        "observation": {
            "question": "Jakie oddziaływanie odpowiada za efekt?",
            "options": [
                "grawitacyjne",
                "elektrostatyczne",
                "magnetyczne"
            ],
            "correctIndex": 1,
            "explanation": "Potarcie powoduje rozdzielenie ładunków elektrycznych."
        },
        "explanation": "Podczas pocierania część elektronów przemieszcza się między materiałami. Naelektryzowany przedmiot może przyciągać lekkie obiekty, włosy, papierki lub cienki strumień wody.",
        "takeaway": "Elektryzowanie może wywołać przyciąganie bez bezpośredniego dotyku.",
        "quiz": [
            {
                "question": "Szczotka przyciąga włosy po intensywnym czesaniu wskutek oddziaływania…",
                "options": [
                    "elektrostatycznego",
                    "grawitacyjnego",
                    "magnetycznego"
                ],
                "correctIndex": 0,
                "explanation": "Pocieranie elektryzuje włosy i szczotkę."
            }
        ]
    }
];
