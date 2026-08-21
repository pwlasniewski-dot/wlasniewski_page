export type GateState = 'pass' | 'block' | 'unknown';
export type CompletenessGate = { key: string; label: string; state: GateState; reason: string };

export type PageSource = {
  host: 'wlasniewski.pl' | 'aeroanaliza.pl' | 'unknown';
  path: string;
  title: string;
  kind: 'cms' | 'blog' | 'portfolio' | 'static';
  published: boolean | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  content?: string | null;
  mediaCount?: number | null;
  hasCta?: boolean | null;
  updatedAt?: Date | null;
  publishedAt?: Date | null;
};

export type PageSignals = {
  analyticsObserved: boolean;
  gscObserved: boolean;
  firstAnalyticsAt?: Date | null;
  firstGscAt?: string | null;
  trendPositive?: boolean;
};

export const STATIC_PAGE_REGISTRY: PageSource[] = [
  { host: 'wlasniewski.pl', path: '/', title: 'Strona główna', kind: 'static', published: true, hasCta: true },
  { host: 'wlasniewski.pl', path: '/rezerwacja', title: 'Rezerwacja', kind: 'static', published: true, hasCta: true },
  { host: 'wlasniewski.pl', path: '/fotografia-z-drona', title: 'Fotografia z drona', kind: 'static', published: true, hasCta: true },
  { host: 'wlasniewski.pl', path: '/rezerwacja/dron', title: 'Rezerwacja fotografii z drona', kind: 'static', published: true, hasCta: true },
  { host: 'wlasniewski.pl', path: '/portfolio', title: 'Portfolio', kind: 'static', published: true, hasCta: true },
  { host: 'wlasniewski.pl', path: '/blog', title: 'Blog', kind: 'static', published: true, hasCta: false },
  { host: 'wlasniewski.pl', path: '/kontakt', title: 'Kontakt', kind: 'static', published: true, hasCta: true },
  { host: 'wlasniewski.pl', path: '/karta-podarunkowa', title: 'Karta podarunkowa', kind: 'static', published: true, hasCta: true },
  { host: 'wlasniewski.pl', path: '/sklep/albumy', title: 'Albumy', kind: 'static', published: true, hasCta: true },
  { host: 'wlasniewski.pl', path: '/jak-sie-ubrac', title: 'Jak się ubrać', kind: 'static', published: true, hasCta: true },
  { host: 'wlasniewski.pl', path: '/fotograf-torun', title: 'Fotograf Toruń', kind: 'static', published: true, hasCta: true },
  { host: 'aeroanaliza.pl', path: '/', title: 'Aero Analiza', kind: 'static', published: true, hasCta: true },
  { host: 'aeroanaliza.pl', path: '/termowizja', title: 'Termowizja dronem', kind: 'static', published: true, hasCta: true },
  { host: 'aeroanaliza.pl', path: '/inspekcja-fotowoltaiki-dronem', title: 'Inspekcja fotowoltaiki dronem', kind: 'static', published: true, hasCta: true },
  { host: 'aeroanaliza.pl', path: '/inspekcja-dachu-dronem', title: 'Inspekcja dachu dronem', kind: 'static', published: true, hasCta: true },
  { host: 'aeroanaliza.pl', path: '/monitoring', title: 'Monitoring inwestycji dronem', kind: 'static', published: true, hasCta: true },
  { host: 'aeroanaliza.pl', path: '/kujawsko-pomorskie', title: 'Usługi dronem — kujawsko-pomorskie', kind: 'static', published: true, hasCta: true },
];

function plainText(value: string | null | undefined) {
  return (value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function evaluatePageCompleteness(page: PageSource, signals: PageSignals) {
  const wordCount = plainText(page.content).split(/\s+/).filter(Boolean).length;
  const gates: CompletenessGate[] = [
    { key: 'published', label: 'Publikacja', state: page.published === true ? 'pass' : page.published === false ? 'block' : 'unknown', reason: page.published === true ? 'Strona opublikowana' : page.published === false ? 'Strona jest szkicem' : 'Brak źródła statusu publikacji' },
    { key: 'meta', label: 'Meta SEO', state: page.metaTitle === undefined && page.metaDescription === undefined ? 'unknown' : page.metaTitle && page.metaDescription ? 'pass' : 'block', reason: page.metaTitle === undefined ? 'Meta zarządzane w kodzie — brak audytu runtime' : !page.metaTitle ? 'Brak meta title' : !page.metaDescription ? 'Brak meta description' : 'Meta title i description uzupełnione' },
    { key: 'content', label: 'Treść', state: page.content === undefined ? 'unknown' : wordCount >= 120 ? 'pass' : 'block', reason: page.content === undefined ? 'Treść zarządzana w kodzie — brak audytu runtime' : `Treść ma ${wordCount} słów; minimum jakościowe: 120` },
    { key: 'media', label: 'Media', state: page.mediaCount == null ? 'unknown' : page.mediaCount > 0 ? 'pass' : 'block', reason: page.mediaCount == null ? 'Brak jednoznacznego źródła mediów' : page.mediaCount > 0 ? `${page.mediaCount} elementów multimedialnych` : 'Brak przypisanych mediów' },
    { key: 'cta', label: 'CTA', state: page.hasCta == null ? 'unknown' : page.hasCta ? 'pass' : 'block', reason: page.hasCta == null ? 'CTA nie jest strukturalnie oznaczone' : page.hasCta ? 'CTA wykryte' : 'Brak CTA prowadzącego dalej' },
    { key: 'analytics', label: 'Analityka', state: signals.analyticsObserved ? 'pass' : 'block', reason: signals.analyticsObserved ? 'Strona ma zdarzenia V2 w analizowanym okresie' : 'Brak zdarzeń V2 w analizowanym okresie' },
    { key: 'gsc', label: 'Google', state: signals.gscObserved ? 'pass' : 'block', reason: signals.gscObserved ? 'Strona ma dane GSC w analizowanym okresie' : 'Brak danych GSC w analizowanym okresie' },
  ];
  const technicalGates = gates.filter(gate => !['analytics', 'gsc'].includes(gate.key));
  const known = technicalGates.filter(gate => gate.state !== 'unknown');
  const passed = known.filter(gate => gate.state === 'pass').length;
  const completeness = known.length ? Math.round((passed / known.length) * 100) : 0;
  const blockers = technicalGates.filter(gate => gate.state === 'block').map(gate => gate.reason);
  const dataBlockers = gates.filter(gate => ['analytics', 'gsc'].includes(gate.key) && gate.state === 'block').map(gate => gate.reason);
  const stage = page.published === false ? 'draft'
    : !signals.analyticsObserved && !signals.gscObserved ? 'published_unseen'
      : signals.gscObserved && !signals.analyticsObserved ? 'visible_no_visit'
        : signals.analyticsObserved && !signals.gscObserved ? 'visited_not_visible'
          : completeness < 80 ? 'needs_work' : signals.trendPositive ? 'growing' : 'established';
  const candidates = [
    signals.firstAnalyticsAt ? { at: signals.firstAnalyticsAt.toISOString(), source: 'analytics' as const } : null,
    signals.firstGscAt ? { at: `${signals.firstGscAt}T00:00:00.000Z`, source: 'gsc' as const } : null,
  ].filter(Boolean) as Array<{ at: string; source: 'analytics' | 'gsc' }>;
  candidates.sort((a, b) => a.at.localeCompare(b.at));
  return {
    completeness, gates, blockers, dataBlockers, stage,
    firstSeenAt: candidates[0]?.at || null,
    firstSeenSource: candidates[0]?.source || null,
    firstSeenNote: 'Najstarsza obserwacja w dostępnych Analytics V2 lub maksymalnie 16-miesięcznej historii GSC; nie data publikacji.',
  };
}

export function portfolioPath(category: string, slug: string) {
  return `/portfolio/${encodeURIComponent(category)}/${encodeURIComponent(slug)}`;
}

export type DirectorAction = { priority: number; kind: string; title: string; evidence: string; recommendation: string };

export function prioritizeDirectorActions(actions: DirectorAction[]) {
  return [...actions]
    .sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title))
    .slice(0, 3);
}
