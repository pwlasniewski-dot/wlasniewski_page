'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, BookOpen, Camera, CalendarDays } from 'lucide-react';

const EDU_MATERIALS = [
    {
        title: 'Trójkąt ekspozycji',
        body: `Zdjęcie wychodzi DOBRZE naświetlone, gdy światło, czas i czułość są w równowadze.

**Trzy parametry:**
- **Przysłona (f/...)** — jak szeroko otwarte oko aparatu. Mała liczba (f/2.8) = duże oko, dużo światła, rozmyte tło. Duża liczba (f/16) = małe oko, mało światła, ostro od bliska do daleka.
- **Czas (1/125 s)** — jak długo aparat patrzy. Krótko (1/1000) = zatrzymujesz ruch. Długo (1/30) = ruch się rozmywa.
- **ISO (100, 400, 1600)** — czułość matrycy. Niskie ISO = czyste zdjęcie. Wysokie ISO = jaśniej w mroku, ale "ziarno".

> Reguła: gdy zwiększasz jeden, zmniejsz drugi, żeby zdjęcie nie było za jasne ani za ciemne.`,
    },
    {
        title: 'Tryb manualny (M) — krok po kroku',
        body: `1. Ustaw **ISO** najniższe, jakie się da (100 w słońcu, 800-1600 w cieniu).
2. Ustaw **przysłonę** zależnie od efektu: portret z rozmytym tłem → f/2.8-f/4. Pejzaż ostry wszędzie → f/8-f/11.
3. Patrz na **wskaźnik ekspozycji** w wizjerze (skala "-2 ... 0 ... +2"). 
4. Kręć **czasem**, żeby strzałka stała na 0.
5. Pstryk! Sprawdź zdjęcie. Za ciemne → wydłuż czas. Za jasne → skróć czas.`,
    },
    {
        title: 'Kompozycja: zasada trójpodziału',
        body: `Wyobraź sobie kratkę 3x3 na zdjęciu. **Najważniejsze rzeczy** (oko portretowanej osoby, horyzont) wstaw na **liniach** lub w **punktach przecięcia** — nie na środku. Zdjęcie od razu wygląda lepiej.`,
    },
];

interface Participant { id: number; login: string; display_name: string | null; avatar: string | null; }
interface Meta { id: number; slug: string; title: string; }

export default function WorkshopPanelPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const router = useRouter();
    const [me, setMe] = useState<Participant | null>(null);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [tab, setTab] = useState<'plan' | 'edu' | 'photos'>('plan');

    useEffect(() => {
        const tk = localStorage.getItem('workshop_token');
        const p = localStorage.getItem('workshop_participant');
        const m = localStorage.getItem('workshop_meta');
        if (!tk || !p || !m) { router.replace(`/warsztaty/${slug}/login`); return; }
        setMe(JSON.parse(p));
        setMeta(JSON.parse(m));
    }, [slug, router]);

    function logout() {
        localStorage.removeItem('workshop_token');
        localStorage.removeItem('workshop_participant');
        localStorage.removeItem('workshop_meta');
        router.replace(`/warsztaty/${slug}/login`);
    }

    if (!me || !meta) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-rose-50">
            <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center gap-3">
                <span className="text-3xl">{me.avatar}</span>
                <div className="flex-1">
                    <div className="font-bold text-zinc-900">{me.display_name || me.login}</div>
                    <div className="text-xs text-zinc-500">{meta.title}</div>
                </div>
                <button onClick={logout} className="text-zinc-500 hover:text-rose-600 p-2"><LogOut size={18} /></button>
            </header>

            <nav className="bg-white border-b border-zinc-200 px-4 flex gap-1 overflow-x-auto">
                {([
                    ['plan', 'Plan dnia', CalendarDays],
                    ['edu', 'Materiały', BookOpen],
                    ['photos', 'Moje zdjęcia', Camera],
                ] as const).map(([key, label, Icon]) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${tab === key ? 'border-rose-500 text-rose-600' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
                    >
                        <Icon size={16} /> {label}
                    </button>
                ))}
            </nav>

            <main className="max-w-3xl mx-auto p-4">
                {tab === 'plan' && (
                    <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                        <h2 className="font-bold text-zinc-900 mb-3">Plan warsztatów</h2>
                        <p className="text-zinc-600 text-sm">Plan zajęć poznasz od prowadzącego — w razie pytań pytaj. Pamiętaj: na każdy dzień bierz aparat, naładowane baterie i pustą kartę pamięci.</p>
                    </div>
                )}
                {tab === 'edu' && (
                    <div className="space-y-4">
                        {EDU_MATERIALS.map((m, i) => (
                            <article key={i} className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                                <h3 className="font-bold text-zinc-900 mb-2">{m.title}</h3>
                                <pre className="whitespace-pre-wrap text-sm text-zinc-700 leading-relaxed font-sans">{m.body}</pre>
                            </article>
                        ))}
                    </div>
                )}
                {tab === 'photos' && (
                    <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm text-center text-zinc-500">
                        <Camera className="mx-auto mb-2" />
                        <p>Wkrótce: tu będziesz mógł/mogła wgrać swoje zdjęcia z warsztatów i zobaczyć opinię prowadzącego.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
