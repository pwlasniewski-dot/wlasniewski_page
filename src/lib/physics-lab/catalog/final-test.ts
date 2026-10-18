import type { FinalTestQuestion } from '../types.ts';

export const finalTestQuestions: FinalTestQuestion[] = [
    {
        "id": "t1",
        "task": 1,
        "question": "Który podział jest poprawny?",
        "options": [
            "Substancje: ołówek, siłomierz, stół; ciała: żelazo, ołów",
            "Substancje: żelazo, ołów; ciała: ołówek, siłomierz, stół, szklanka",
            "Wszystkie nazwy oznaczają substancje"
        ],
        "correctIndex": 1,
        "explanation": "Żelazo i ołów są materiałami, a pozostałe nazwy oznaczają konkretne przedmioty."
    },
    {
        "id": "t2",
        "task": 2,
        "question": "Które zbiory zawierają wyłącznie wielkości fizyczne?",
        "options": [
            "A i B",
            "C i D",
            "E i F",
            "tylko B"
        ],
        "correctIndex": 1,
        "explanation": "C: długość, objętość, pole; D: długość, temperatura, masa."
    },
    {
        "id": "t3",
        "task": 3,
        "question": "Który zestaw zawiera kolejno: zjawisko, ciało, zjawisko?",
        "options": [
            "dźwięk, linijka, parowanie wody",
            "Księżyc, dźwięk, drut",
            "linijka, spadająca piłka, Księżyc"
        ],
        "correctIndex": 0,
        "explanation": "Dźwięk i parowanie są zjawiskami, a linijka jest ciałem."
    },
    {
        "id": "t4",
        "task": 4,
        "question": "Które zestawy zawierają tylko zjawiska fizyczne?",
        "options": [
            "A i C",
            "B i E",
            "C i D",
            "tylko D"
        ],
        "correctIndex": 1,
        "explanation": "B i E nie zawierają nazw ciał ani przyrządów."
    },
    {
        "id": "t5",
        "task": 5,
        "question": "Wybierz poprawną kolejność: magnesy się przyciągają; piłka spada; szczotka przyciąga włosy.",
        "options": [
            "wzajemność, grawitacyjne, elektrostatyczne",
            "elektrostatyczne, mechaniczne, magnetyczne",
            "grawitacyjne, magnetyczne, mechaniczne"
        ],
        "correctIndex": 0,
        "explanation": "To odpowiednio wzajemność oddziaływań, grawitacja i elektrostatyka."
    },
    {
        "id": "t6",
        "task": 6,
        "question": "Który zestaw zawiera wyłącznie jednostki siły?",
        "options": [
            "metr, kiloniuton, kilogram",
            "kilogram, niuton, kilometr",
            "niuton, kiloniuton, meganiuton",
            "siłomierz, niuton, kiloniuton"
        ],
        "correctIndex": 2,
        "explanation": "N, kN i MN są jednostkami siły."
    },
    {
        "id": "t7",
        "task": 7,
        "question": "Który opis siły jest pełny?",
        "options": [
            "tylko wartość",
            "wartość i kolor",
            "wartość, kierunek, zwrot i punkt przyłożenia"
        ],
        "correctIndex": 2,
        "explanation": "Siła jest wielkością wektorową opisywaną czterema cechami."
    },
    {
        "id": "t8",
        "task": 8,
        "question": "Wybierz prawidłową kolejność dla: zegarek, linijka, siłomierz, waga.",
        "options": [
            "czas, długość, siła, masa",
            "masa, czas, długość, siła",
            "czas, siła, masa, długość"
        ],
        "correctIndex": 0,
        "explanation": "Każdy przyrząd mierzy wskazaną wielkość."
    },
    {
        "id": "t9",
        "task": 9,
        "question": "Który zestaw zawiera wyłącznie skutki dynamiczne?",
        "options": [
            "rozciągnięcie gumy, złamanie ołówka",
            "odbicie piłki, zatrzymanie roweru, zmiana prędkości",
            "napięcie łuku, rozkruszenie kredy"
        ],
        "correctIndex": 1,
        "explanation": "W każdym przykładzie zmienia się ruch ciała."
    },
    {
        "id": "t10",
        "task": 10,
        "question": "Dwie poziome siły wychodzą z jednego punktu w przeciwne strony. Wspólne są ich…",
        "options": [
            "zwrot i wartość",
            "kierunek i punkt przyłożenia",
            "wartość i zwrot"
        ],
        "correctIndex": 1,
        "explanation": "Leżą na tej samej prostej i mają wspólny początek."
    },
    {
        "id": "t11",
        "task": 11,
        "question": "Dwie siły równoważące się mają…",
        "options": [
            "różne wartości i takie same zwroty",
            "przeciwne zwroty i taką samą wartość",
            "różne wartości i przeciwne zwroty"
        ],
        "correctIndex": 1,
        "explanation": "Równe wartości i przeciwne zwroty dają wypadkową 0 N."
    },
    {
        "id": "t12",
        "task": 12,
        "question": "Która para sił się równoważy?",
        "options": [
            "3 N w górę i 3 N w prawo",
            "4 N w prawo i 4 N w prawo",
            "5 N w lewo i 5 N w prawo",
            "2 N w lewo i 1 N w prawo"
        ],
        "correctIndex": 2,
        "explanation": "Siły mają równe wartości, wspólny kierunek i przeciwne zwroty."
    },
    {
        "id": "t13",
        "task": 13,
        "question": "Na klocek działa 2 N w lewo i 3 N w prawo. Siła wypadkowa wynosi…",
        "options": [
            "5 N w prawo",
            "1 N w prawo",
            "1 N w lewo",
            "0 N"
        ],
        "correctIndex": 1,
        "explanation": "3 N − 2 N = 1 N w stronę większej siły."
    },
    {
        "id": "t14",
        "task": 14,
        "question": "Dwie osoby działają w tę samą stronę siłami 100 N i 150 N. Zastępuje je siła…",
        "options": [
            "50 N w przeciwną stronę",
            "250 N w tę samą stronę",
            "150 N w tę samą stronę"
        ],
        "correctIndex": 1,
        "explanation": "Siły o zgodnych zwrotach dodają się."
    },
    {
        "id": "t15",
        "task": 15,
        "question": "Dla dwóch sił o wypadkowej 0 N prawdziwość zdań: równoważą się; mają takie same zwroty; mają różne wartości i przeciwne zwroty; mają tę samą wartość i przeciwne zwroty — to…",
        "options": [
            "P, F, F, P",
            "P, P, F, F",
            "F, F, P, P"
        ],
        "correctIndex": 0,
        "explanation": "Tylko pierwsze i czwarte zdanie są prawdziwe."
    },
    {
        "id": "t16",
        "task": 16,
        "question": "Wykres rośnie od 0 N dla 0 obciążników do 3 N dla 6 obciążników. Dla 5 obciążników wskazanie wynosi…",
        "options": [
            "1 N",
            "1,5 N",
            "2 N",
            "2,5 N"
        ],
        "correctIndex": 3,
        "explanation": "Jeden obciążnik odpowiada 0,5 N, więc pięć daje 2,5 N."
    },
    {
        "id": "t17",
        "task": 17,
        "question": "Między 40 N i 80 N są cztery równe odstępy. Najmniejsza działka wynosi…",
        "options": [
            "1 N",
            "4 N",
            "5 N",
            "10 N"
        ],
        "correctIndex": 3,
        "explanation": "40 N ÷ 4 = 10 N."
    },
    {
        "id": "t18",
        "task": 18,
        "question": "500 cm³ to inaczej…",
        "options": [
            "0,0005 m³",
            "0,005 m³",
            "5 dm³",
            "0,05 dm³"
        ],
        "correctIndex": 0,
        "explanation": "1 m³ ma 1 000 000 cm³, więc 500 cm³ = 0,0005 m³."
    },
    {
        "id": "t19",
        "task": 19,
        "question": "Skala rysunku to 1 odcinek = 2 N. Wektor ma 4 odcinki. Wynik w kN wynosi…",
        "options": [
            "0,002 kN",
            "0,008 kN",
            "0,08 kN",
            "8 kN"
        ],
        "correctIndex": 1,
        "explanation": "4 × 2 N = 8 N = 0,008 kN."
    },
    {
        "id": "t20",
        "task": 20,
        "question": "Na wózek działają 3 N w lewo i 2 N w lewo. Jaka trzecia siła utrzyma spoczynek?",
        "options": [
            "1 N w prawo",
            "5 N w prawo",
            "5 N w lewo",
            "1 N w lewo"
        ],
        "correctIndex": 1,
        "explanation": "Znane siły dają 5 N w lewo, więc równoważąca ma 5 N w prawo."
    }
];
