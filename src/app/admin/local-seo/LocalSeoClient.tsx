'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';

interface Booking {
    id: number;
    client_name: string;
    email: string;
    service: string;
    date: string;
    updated_at: string;
    client_rating: number | null;
    client_review: string | null;
}

interface Citation {
    name: string;
    url: string;
    done: boolean;
}

interface Props {
    initialSettings: Record<string, string>;
    completedBookings: Booking[];
    initialCitations: Citation[];
}

const DEFAULT_CITATIONS: Citation[] = [
    { name: 'Google Business Profile (Mapy)', url: 'https://www.google.com/business/', done: false },
    { name: 'Panorama Firm', url: 'https://panoramafirm.pl/', done: false },
    { name: 'pkt.pl', url: 'https://www.pkt.pl/', done: false },
    { name: 'Aleo.com', url: 'https://aleo.com/pl', done: false },
    { name: 'Yelp Polska', url: 'https://www.yelp.pl/', done: false },
    { name: 'Bing Places for Business', url: 'https://www.bingplaces.com/', done: false },
    { name: 'Apple Maps Business Connect', url: 'https://mapsconnect.apple.com/', done: false },
    { name: 'Foursquare for Business', url: 'https://business.foursquare.com/', done: false },
    { name: 'Oferia.pl', url: 'https://www.oferia.pl/', done: false },
    { name: 'Fixly.pl', url: 'https://fixly.pl/', done: false },
    { name: 'Wedding.pl (jeśli śluby)', url: 'https://www.wedding.pl/', done: false },
    { name: 'Abcslubu.pl', url: 'https://abcslubu.pl/', done: false },
    { name: 'GoldenLine', url: 'https://www.goldenline.pl/', done: false },
    { name: 'Facebook Page (kategoria: Photographer)', url: 'https://www.facebook.com/business/', done: false },
    { name: 'Instagram Business Profile', url: 'https://business.instagram.com/', done: false },
];

const GBP_CHECKLIST = [
    { id: 'profile_claimed', label: 'Profil GBP zweryfikowany (kartka pocztowa lub telefon)' },
    { id: 'primary_category', label: 'Kategoria główna: "Fotograf"' },
    { id: 'secondary_categories', label: 'Kategorie dodatkowe: Fotograf ślubny, Fotograf rodzinny, Fotograf portretowy, Pilot drona' },
    { id: 'business_hours', label: 'Godziny otwarcia ustawione (7 dni)' },
    { id: 'phone_number', label: 'Telefon zgodny ze stroną (+48 530 788 694)' },
    { id: 'website_link', label: 'Link do strony: https://wlasniewski.pl' },
    { id: 'description_long', label: 'Opis firmy 750 znaków z frazą "fotograf Toruń" + okoliczne miasta' },
    { id: 'photos_logo', label: 'Logo + zdjęcie okładkowe' },
    { id: 'photos_min_30', label: 'Min. 30 zdjęć portfolio (rodzinne, ślubne, portretowe)' },
    { id: 'photos_team', label: 'Zdjęcie zespołu / autoportret' },
    { id: 'services_listed', label: 'Lista usług z cenami od/do' },
    { id: 'attributes', label: 'Atrybuty: Online appointments, Onsite services, Identifies as women-owned (jeśli)' },
    { id: 'first_post', label: 'Pierwszy post opublikowany' },
    { id: 'qa_seeded', label: 'Min. 5 pytań Q&A z odpowiedziami (samemu zadać i odpowiedzieć)' },
    { id: 'utm_link', label: 'Link na stronę z UTM: ?utm_source=google&utm_medium=gbp' },
];

export default function LocalSeoClient({ initialSettings, completedBookings, initialCitations }: Props) {
    const [settings, setSettings] = useState(initialSettings);
    const [citations, setCitations] = useState<Citation[]>(
        initialCitations.length > 0 ? initialCitations : DEFAULT_CITATIONS
    );
    const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
        try {
            return JSON.parse(initialSettings.gbp_checklist || '{}');
        } catch {
            return {};
        }
    });
    const [pending, startTransition] = useTransition();
    const [sendingReview, setSendingReview] = useState<number | null>(null);

    const placeId = settings.google_place_id || '';
    const directReviewLink = settings.gbp_review_link || '';
    const reviewLink = directReviewLink || (placeId
        ? `https://search.google.com/local/writereview?placeid=${placeId}`
        : '');

    const saveSetting = async (key: string, value: string) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        const res = await fetch('/api/admin/local-seo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ key, value }),
        });
        if (res.ok) {
            setSettings(prev => ({ ...prev, [key]: value }));
            toast.success('Zapisano');
        } else {
            toast.error('Błąd zapisu');
        }
    };

    const toggleChecklist = (id: string) => {
        const updated = { ...checklist, [id]: !checklist[id] };
        setChecklist(updated);
        saveSetting('gbp_checklist', JSON.stringify(updated));
    };

    const toggleCitation = (idx: number) => {
        const updated = citations.map((c, i) => (i === idx ? { ...c, done: !c.done } : c));
        setCitations(updated);
        saveSetting('gbp_citations_status', JSON.stringify(updated));
    };

    const sendReviewRequest = async (bookingId: number) => {
        if (!reviewLink) {
            toast.error('Najpierw wklej link do recenzji Google (sekcja 1)');
            return;
        }
        setSendingReview(bookingId);
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
            const res = await fetch('/api/admin/local-seo/send-review-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ bookingId }),
            });
            const json = await res.json();
            if (res.ok) {
                toast.success(`Wysłano prośbę do ${json.email}`);
            } else {
                toast.error(json.message || 'Błąd');
            }
        } catch (e) {
            toast.error('Błąd wysyłki');
        } finally {
            setSendingReview(null);
        }
    };

    const checklistDone = Object.values(checklist).filter(Boolean).length;
    const citationsDone = citations.filter(c => c.done).length;
    const reviewsSent = completedBookings.filter(b => b.client_rating).length;

    return (
        <div className="p-6 bg-zinc-950 min-h-screen text-white">
            <div className="max-w-6xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold">Local SEO &amp; Google Maps</h1>
                    <p className="text-zinc-400 mt-2">
                        Wszystko czego potrzebujesz, żeby pojawić się w Google Maps dla zapytań typu &quot;fotograf Toruń&quot;, &quot;fotograf Grudziądz&quot;.
                        Bez agencji. Sam zarządzasz.
                    </p>
                </header>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
                        <div className="text-xs uppercase tracking-widest text-zinc-500">GBP Checklist</div>
                        <div className="text-3xl font-bold mt-2">
                            {checklistDone}<span className="text-zinc-500 text-xl">/{GBP_CHECKLIST.length}</span>
                        </div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
                        <div className="text-xs uppercase tracking-widest text-zinc-500">Cytowania</div>
                        <div className="text-3xl font-bold mt-2">
                            {citationsDone}<span className="text-zinc-500 text-xl">/{citations.length}</span>
                        </div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
                        <div className="text-xs uppercase tracking-widest text-zinc-500">Recenzje od klientów</div>
                        <div className="text-3xl font-bold mt-2">{reviewsSent}</div>
                    </div>
                </div>

                {/* Step 1: Google Review Link */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-3">1. Link do recenzji Google</h2>
                    <p className="text-sm text-zinc-400 mb-4">
                        W GBP kliknij <strong className="text-white">„Poproś o opinię"</strong> → skopiuj link z pola <em>„Link opinii"</em>.
                        Ten link będzie wysyłany automatycznie klientom po sesji.
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="https://g.page/r/CfCcE7G30MsVEBM/review"
                            defaultValue={directReviewLink}
                            id="reviewLinkInput"
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm font-mono"
                        />
                        <button
                            onClick={() => {
                                const v = (document.getElementById('reviewLinkInput') as HTMLInputElement).value.trim();
                                saveSetting('gbp_review_link', v);
                            }}
                            className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded font-semibold text-sm"
                        >
                            Zapisz
                        </button>
                    </div>
                    {reviewLink && (
                        <div className="mt-4 p-3 bg-zinc-800/50 border border-amber-500/30 rounded text-sm flex items-center justify-between gap-3">
                            <a href={reviewLink} target="_blank" rel="noopener noreferrer" className="text-amber-400 break-all hover:underline text-xs">
                                {reviewLink}
                            </a>
                            <button
                                onClick={() => { navigator.clipboard.writeText(reviewLink); toast.success('Skopiowano'); }}
                                className="text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded shrink-0"
                            >
                                Kopiuj
                            </button>
                        </div>
                    )}
                </section>

                {/* Step 2: GBP Checklist */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-3">2. Checklist profilu Google Business</h2>
                    <p className="text-sm text-zinc-400 mb-4">
                        Każdy zaznaczony punkt = realnie wyższa pozycja w Mapach. Robisz raz, działa wiecznie.
                    </p>
                    <div className="space-y-2">
                        {GBP_CHECKLIST.map(item => (
                            <label
                                key={item.id}
                                className="flex items-start gap-3 p-3 bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-800 rounded cursor-pointer transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={!!checklist[item.id]}
                                    onChange={() => toggleChecklist(item.id)}
                                    className="mt-1 w-4 h-4 accent-amber-500"
                                />
                                <span className={`text-sm ${checklist[item.id] ? 'text-zinc-500 line-through' : 'text-white'}`}>
                                    {item.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </section>

                {/* Step 3: Citations */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-3">3. Lokalne cytowania (NAP)</h2>
                    <p className="text-sm text-zinc-400 mb-4">
                        Dodaj firmę do tych katalogów. <strong>Zawsze identyczne</strong>: Nazwa, Adres, Telefon, www. Inaczej Google myli sygnały.
                    </p>
                    <div className="space-y-2">
                        {citations.map((c, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-3 p-3 bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-800 rounded transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={c.done}
                                    onChange={() => toggleCitation(idx)}
                                    className="w-4 h-4 accent-amber-500"
                                />
                                <span className={`text-sm flex-1 ${c.done ? 'text-zinc-500 line-through' : 'text-white'}`}>
                                    {c.name}
                                </span>
                                <a
                                    href={c.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-amber-400 hover:underline"
                                >
                                    Otwórz →
                                </a>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Step 4: Review Requests */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-3">4. Prośby o recenzje Google</h2>
                    <p className="text-sm text-zinc-400 mb-4">
                        Klienci po sesji (status &quot;completed&quot;). Wyślij prośbę o opinię — to najszybsza dźwignia w Google Maps.
                        Każdy oznaczony jako completed dostaje też auto-mail po zmianie statusu.
                    </p>
                    {completedBookings.length === 0 ? (
                        <p className="text-zinc-500 text-sm italic">Brak zakończonych rezerwacji. Oznacz booking jako &quot;completed&quot; w panelu rezerwacji.</p>
                    ) : (
                        <div className="space-y-2">
                            {completedBookings.map(b => (
                                <div key={b.id} className="flex items-center gap-3 p-3 bg-zinc-800/40 border border-zinc-800 rounded">
                                    <div className="flex-1">
                                        <div className="font-semibold text-sm">{b.client_name}</div>
                                        <div className="text-xs text-zinc-500">
                                            {b.service} · {new Date(b.date).toLocaleDateString('pl-PL')} · {b.email}
                                        </div>
                                    </div>
                                    {b.client_rating ? (
                                        <span className="text-xs text-green-400">★ {b.client_rating}/5</span>
                                    ) : (
                                        <button
                                            onClick={() => sendReviewRequest(b.id)}
                                            disabled={sendingReview === b.id || !reviewLink}
                                            className="bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black px-3 py-1.5 rounded text-xs font-semibold"
                                        >
                                            {sendingReview === b.id ? 'Wysyłanie...' : 'Wyślij prośbę'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Step 5: NAP Audit */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-3">5. Audyt NAP (Name-Address-Phone)</h2>
                    <p className="text-sm text-zinc-400 mb-4">
                        Te dane MUSZĄ być identyczne wszędzie: w stopce strony, w GBP, na fakturach, we wszystkich katalogach.
                    </p>
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3 text-sm">
                            <div className="text-zinc-500">Nazwa firmy:</div>
                            <div className="col-span-2 font-mono text-amber-400">Przemysław Właśniewski — Fotograf</div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                            <div className="text-zinc-500">Telefon:</div>
                            <div className="col-span-2 font-mono text-amber-400">+48 530 788 694</div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                            <div className="text-zinc-500">Adres:</div>
                            <div className="col-span-2 font-mono text-amber-400">Płużnica, woj. kujawsko-pomorskie</div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                            <div className="text-zinc-500">Email:</div>
                            <div className="col-span-2 font-mono text-amber-400">pwlasniewski@gmail.com</div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                            <div className="text-zinc-500">NIP:</div>
                            <div className="col-span-2 font-mono text-amber-400">8781430365</div>
                        </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-950/30 border border-blue-500/30 rounded text-xs text-blue-300">
                        <strong>Wskazówka:</strong> Skopiuj te dane i wklej je IDENTYCZNIE w każdym katalogu. Nawet różnica w &quot;ul.&quot; vs &quot;Ul.&quot; może zaszkodzić.
                    </div>
                </section>

                {/* Step 6: Posts */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-3">6. Posty na Google Business</h2>
                    <p className="text-sm text-zinc-400 mb-4">
                        Publikuj <strong>1-2 posty tygodniowo</strong>. Google premiuje aktywne profile. Poniżej szablony — kopiuj i wklejaj na GBP.
                    </p>
                    <div className="space-y-3">
                        {[
                            { title: 'Nowa sesja w Toruniu', body: 'W tym tygodniu fotografowałem rodzinę nad Wisłą. Złota godzina, naturalne emocje, zero pozowania. Tak wyglądają moje sesje rodzinne w Toruniu. Szukasz takiego klimatu? Pisz w wiadomości.' },
                            { title: 'Wolne terminy weekendowe', body: 'Mam jeszcze 2 wolne weekendy w czerwcu na sesje rodzinne i narzeczeńskie. Toruń, Grudziądz, Chełmno — dojeżdżam. Cena od 500 zł, galeria online + odbitki nPhoto w pakiecie.' },
                            { title: 'Komunie 2026 — ostatnie miejsca', body: 'Sezon komunijny 2026 — zostały 3 terminy w maju. Sesja w kościele + plener + portret. Naturalnie, bez sztywnego pozowania. Toruń i okolice.' },
                            { title: 'Sesja narzeczeńska — Chełmno', body: 'Miasto Zakochanych. Sesja narzeczeńska na rynku, przy murach miejskich, o zachodzie. Polecam każdej parze, która chce klimatycznych zdjęć przedweselnych.' },
                            { title: 'Drone wedding video', body: 'Ujęcia drona z dzisiejszego wesela w Grudziądzu. Panorama spichlerzy + para młoda na bulwarze. Każdy mój pakiet ślubny ma drone w cenie.' },
                        ].map((post, i) => (
                            <details key={i} className="bg-zinc-800/40 border border-zinc-800 rounded">
                                <summary className="cursor-pointer px-4 py-3 text-sm font-semibold hover:bg-zinc-800 transition-colors">
                                    📝 {post.title}
                                </summary>
                                <div className="px-4 py-3 border-t border-zinc-800">
                                    <p className="text-sm text-zinc-300 mb-2">{post.body}</p>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(post.body);
                                            toast.success('Skopiowano');
                                        }}
                                        className="text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded"
                                    >
                                        Kopiuj
                                    </button>
                                </div>
                            </details>
                        ))}
                    </div>
                </section>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-5 text-sm text-amber-200">
                    <strong>Co dalej?</strong> Jeśli zaznaczysz wszystko z Checklist (1-2h pracy) + dodasz 5-10 cytowań + zbierzesz pierwsze 5 recenzji
                    od byłych klientów — w 4-8 tygodni jesteś w top 3 Google Maps na &quot;fotograf Toruń&quot; w okolicy. Bez agencji, bez płacenia.
                </div>
            </div>
        </div>
    );
}
