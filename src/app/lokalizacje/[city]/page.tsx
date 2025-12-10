"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const cityData: Record<string, { title: string; subtitle: string; tag: string; content: string[] }> = {
    torun: {
        title: "Fotograf Toruń",
        subtitle: "Sesje rodzinne, biznesowe i z drona",
        tag: "fotograf toruń",
        content: [
            "Pracuję w Toruniu i okolicach — realizuję sesje rodzinne, portrety biznesowe oraz reportaże z wydarzeń.",
            "Dbam o komfort na planie, pomagam w stylizacji i doborze miejsc. Na co dzień łączę podejście inżynierskie z wrażliwością fotografa.",
            "Dysponuję dronem (NSTS-01) i termowizją (ITC Level 1) — mogę dołączyć ujęcia z powietrza lub wykonać inspekcję techniczną.",
        ],
    },
    lisewo: {
        title: "Fotograf Lisewo",
        subtitle: "Rodzinnie, naturalnie, po Twojemu",
        tag: "fotograf lisewo",
        content: [
            "Najlepsze zdjęcia powstają w swobodnej atmosferze. Pomagam zaplanować miejsce i stylizację.",
            "Pracuję szybko i sprawnie, aby dzieci nie zdążyły się znudzić, a dorośli czuli komfort.",
        ],
    },
    wabrzezno: {
        title: "Fotograf Wąbrzeźno",
        subtitle: "Sesje rodzinne i eventowe",
        tag: "fotograf wąbrzeźno",
        content: [
            "Realizuję sesje w Wąbrzeźnie i okolicy — zarówno w plenerze, jak i w studio.",
            "Specjalizuję się w naturalnych kadrach rodzinnych i reportażach z wydarzeń lokalnych.",
        ],
    },
    pluznica: {
        title: "Fotograf Płużnica",
        subtitle: "Lokalne sesje z pasją",
        tag: "fotograf płużnica",
        content: [
            "Znam najlepsze miejsca w gminie Płużnica — uwiecznię Twoje najważniejsze chwile.",
            "Od sesji rodzinnych po uroczystości — wszystko z profesjonalnym podejściem.",
        ],
    },
    grudziadz: {
        title: "Fotograf Grudziądz",
        subtitle: "Profesjonalna fotografia w Grudziądzu",
        tag: "fotograf grudziądz",
        content: [
            "Dojeżdżam do Grudziądza na sesje rodzinne, biznesowe i eventowe.",
            "Zdjęcia z charakterem — naturalne, pełne emocji kadry.",
        ],
    },
};

export default function CityPage() {
    const params = useParams();
    const city = params.city as string;
    const data = cityData[city];

    if (!data) {
        return (
            <main className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-zinc-900 mb-4">Miasto nie znalezione</h1>
                    <Link href="/" className="text-amber-500 hover:text-amber-600">
                        ← Powrót na stronę główną
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white">
            <div className="mx-auto max-w-4xl px-4 py-20">
                <div className="mb-12">
                    <Link href="/" className="inline-flex items-center text-zinc-600 hover:text-zinc-900 mb-6 transition-colors">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Powrót na stronę główną
                    </Link>

                    <span className="inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                        {data.tag}
                    </span>

                    <h1 className="text-4xl md:text-6xl font-extrabold text-zinc-900 mb-4 font-display">
                        {data.title}
                    </h1>
                    <p className="text-zinc-600 text-xl">{data.subtitle}</p>
                </div>

                <div className="prose prose-lg max-w-none mb-12">
                    {data.content.map((paragraph, idx) => (
                        <p key={idx} className="text-zinc-700 leading-relaxed text-lg mb-4">
                            {paragraph}
                        </p>
                    ))}
                </div>

                <div className="bg-zinc-50 rounded-2xl p-8 mb-12 border border-zinc-200">
                    <h2 className="text-2xl font-bold text-zinc-900 mb-6">Co oferuję w tym regionie?</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {['Sesje Rodzinne', 'Fotografia Biznesowa', 'Reportaże Ślubne', 'Zdjęcia z Drona'].map(service => (
                            <div key={service} className="flex items-start gap-3">
                                <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <h3 className="font-semibold text-zinc-900">{service}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <Link href="/portfolio" className="bg-white hover:bg-zinc-50 border-2 border-zinc-900 text-zinc-900 font-bold py-4 px-6 rounded-xl transition-colors text-center">
                        Zobacz portfolio
                    </Link>
                    <Link href="/rezerwacja" className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-4 px-6 rounded-xl transition-colors text-center">
                        Zarezerwuj sesję
                    </Link>
                </div>
            </div>
        </main>
    );
}
