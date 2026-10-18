'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ArrowRight,
    Atom,
    BookOpenCheck,
    Check,
    CheckCircle2,
    ChevronRight,
    Clock3,
    FlaskConical,
    Gauge,
    LoaderCircle,
    LockKeyhole,
    Play,
    RefreshCcw,
    Share2,
    Sparkles,
    Target,
    Trophy,
    WifiOff,
    Zap,
} from 'lucide-react';
import ExperimentRunner from './ExperimentRunner';
import FinalTest from './FinalTest';
import {
    physicsExperimentMap,
    physicsExperiments,
    physicsModules,
    type PhysicsExperiment,
} from '@/lib/physics-lab/catalog';
import type { PublicPhysicsLabProfile } from '@/lib/physics-lab/profile';

interface ChildLabProps {
    token: string;
}

interface PhysicsProfileResponse {
    success: boolean;
    profile?: PublicPhysicsLabProfile;
    error?: string;
}

function difficultyLabel(value: PhysicsExperiment['difficulty']) {
    if (value === 1) return 'łatwe';
    if (value === 2) return 'średnie';
    return 'wyzwanie';
}

export default function ChildLab({ token }: ChildLabProps) {
    const [profile, setProfile] = useState<PublicPhysicsLabProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [activeExperiment, setActiveExperiment] = useState<PhysicsExperiment | null>(null);
    const [testOpen, setTestOpen] = useState(false);
    const [notice, setNotice] = useState('');

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setLoadError('');
        try {
            const response = await fetch(`/api/physics-lab/${encodeURIComponent(token)}`, { cache: 'no-store' });
            const data = await response.json() as PhysicsProfileResponse;
            if (!response.ok || !data.success || !data.profile) {
                throw new Error(data.error || 'Nie udało się otworzyć laboratorium.');
            }
            setProfile(data.profile);
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : 'Nie udało się otworzyć laboratorium.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        void loadProfile();
    }, [loadProfile]);

    useEffect(() => {
        if (!notice) return;
        const timeout = window.setTimeout(() => setNotice(''), 3000);
        return () => window.clearTimeout(timeout);
    }, [notice]);

    const enabledExperiments = useMemo(() => {
        if (!profile) return [];
        const enabled = new Set(profile.enabledExperimentIds);
        return physicsExperiments.filter(experiment => enabled.has(experiment.id));
    }, [profile]);

    const completedEnabledIds = useMemo(() => {
        if (!profile) return new Set<string>();
        const enabled = new Set(profile.enabledExperimentIds);
        return new Set(profile.progress.completedExperimentIds.filter(id => enabled.has(id)));
    }, [profile]);

    const completionPercent = enabledExperiments.length
        ? Math.round((completedEnabledIds.size / enabledExperiments.length) * 100)
        : 0;
    const nextExperiment = enabledExperiments.find(experiment => !completedEnabledIds.has(experiment.id)) ?? enabledExperiments[0] ?? null;
    const bestTest = profile?.progress.finalTestAttempts.length
        ? Math.max(...profile.progress.finalTestAttempts.map(attempt => Math.round((attempt.score / attempt.total) * 100)))
        : null;

    async function saveExperiment(experimentId: string, score: number, total: number) {
        const response = await fetch(`/api/physics-lab/${encodeURIComponent(token)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'completeExperiment', experimentId, score, total }),
        });
        const data = await response.json() as PhysicsProfileResponse;
        if (!response.ok || !data.success || !data.profile) {
            throw new Error(data.error || 'Nie udało się zapisać postępu.');
        }
        setProfile(data.profile);
        setNotice('Postęp zapisany. Kolejna misja czeka.');
    }

    async function saveFinalTest(score: number, total: number) {
        const response = await fetch(`/api/physics-lab/${encodeURIComponent(token)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'saveFinalTest', score, total }),
        });
        const data = await response.json() as PhysicsProfileResponse;
        if (!response.ok || !data.success || !data.profile) {
            throw new Error(data.error || 'Nie udało się zapisać wyniku testu.');
        }
        setProfile(data.profile);
        setNotice('Wynik testu zapisany.');
    }

    async function shareLab() {
        const url = window.location.href;
        const title = 'Moje Laboratorium Fizyki';
        const text = profile
            ? `${profile.studentName}: ${completedEnabledIds.size}/${enabledExperiments.length} doświadczeń ukończonych.`
            : 'Moje Laboratorium Fizyki';
        try {
            if (navigator.share) {
                await navigator.share({ title, text, url });
            } else {
                await navigator.clipboard.writeText(url);
                setNotice('Link skopiowany.');
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return;
            setNotice('Nie udało się udostępnić linku.');
        }
    }

    if (loading) {
        return (
            <main className="physics-lab lab-loading-screen">
                <div className="lab-cosmic-grid" aria-hidden="true" />
                <div className="lab-loader-orbit" aria-hidden="true">
                    <Atom />
                    <span />
                    <span />
                    <span />
                </div>
                <h1>Uruchamiam laboratorium…</h1>
                <p>Kalibruję przyrządy i sprawdzam misje.</p>
            </main>
        );
    }

    if (loadError || !profile) {
        return (
            <main className="physics-lab lab-error-screen">
                <div className="lab-cosmic-grid" aria-hidden="true" />
                <div className="lab-error-card">
                    <WifiOff aria-hidden="true" />
                    <span className="lab-section-label">Laboratorium nie wystartowało</span>
                    <h1>{loadError || 'Ten link jest nieaktywny.'}</h1>
                    <p>Sprawdź połączenie albo poproś rodzica o ponowne udostępnienie linku.</p>
                    <button type="button" className="lab-primary-button" onClick={() => void loadProfile()}>
                        <RefreshCcw /> Spróbuj ponownie
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="physics-lab">
            <div className="lab-cosmic-grid" aria-hidden="true" />
            <div className="lab-ambient lab-ambient-one" aria-hidden="true" />
            <div className="lab-ambient lab-ambient-two" aria-hidden="true" />

            <nav className="lab-topbar" aria-label="Laboratorium fizyki">
                <a href="#start" className="lab-brand" aria-label="Laboratorium Fizyki — początek strony">
                    <span><Atom /></span>
                    <strong>LAB<span>Fizyka</span></strong>
                </a>
                <div className="lab-topbar-actions">
                    <button type="button" className="lab-topbar-button" onClick={() => void shareLab()}>
                        <Share2 /> <span>Udostępnij</span>
                    </button>
                    <div className="lab-avatar" aria-label={`Profil: ${profile.studentName}`}>{profile.studentName.slice(0, 1).toUpperCase()}</div>
                </div>
            </nav>

            <section id="start" className="lab-hero">
                <div className="lab-hero-copy">
                    <span className="lab-hero-eyebrow"><Sparkles /> Osobiste laboratorium {profile.studentName}</span>
                    <h1>Fizyki nie trzeba <em>wkuwać</em>.<br />Trzeba ją <span>zobaczyć.</span></h1>
                    <p>Przewiduj, wykonuj doświadczenia, obserwuj wynik i dopiero wtedy poznawaj regułę. Tu każde pojęcie da się sprawdzić własnymi rękami.</p>
                    <div className="lab-hero-actions">
                        {nextExperiment && (
                            <button type="button" className="lab-primary-button lab-primary-button--hero" onClick={() => setActiveExperiment(nextExperiment)}>
                                <Play /> {completedEnabledIds.has(nextExperiment.id) ? 'Powtórz pierwszą misję' : 'Uruchom następną misję'}
                            </button>
                        )}
                        <a href="#misje" className="lab-secondary-button">
                            Zobacz plan <ChevronRight />
                        </a>
                    </div>
                    <div className="lab-hero-proof">
                        <div><CheckCircle2 /><span><strong>{enabledExperiments.length}</strong> aktywnych doświadczeń</span></div>
                        <div><Target /><span>materiał z <strong>zadań 1–20</strong></span></div>
                        <div><Zap /><span>nauka przez działanie</span></div>
                    </div>
                </div>

                <div className="lab-hero-console" aria-label={`Postęp: ${completionPercent}%`}>
                    <div className="lab-console-top">
                        <span>STATUS MISJI</span>
                        <small>{completedEnabledIds.size}/{enabledExperiments.length}</small>
                    </div>
                    <div className="lab-progress-orbit" style={{ '--lab-progress': `${completionPercent * 3.6}deg` } as React.CSSProperties}>
                        <div>
                            <strong>{completionPercent}%</strong>
                            <span>wykonano</span>
                        </div>
                        <i className="particle p-one" /><i className="particle p-two" /><i className="particle p-three" />
                    </div>
                    <div className="lab-console-stats">
                        <div><span>Doświadczenia</span><strong>{completedEnabledIds.size}</strong></div>
                        <div><span>Najlepszy test</span><strong>{bestTest === null ? '—' : `${bestTest}%`}</strong></div>
                    </div>
                    {nextExperiment && (
                        <button type="button" className="lab-next-mission" onClick={() => setActiveExperiment(nextExperiment)}>
                            <span>
                                <small>Następna misja</small>
                                <strong>{nextExperiment.title}</strong>
                            </span>
                            <ArrowRight />
                        </button>
                    )}
                </div>
            </section>

            <section className="lab-method" aria-labelledby="method-title">
                <div className="lab-section-heading">
                    <span className="lab-section-label"><FlaskConical /> Jak pracuje naukowiec</span>
                    <h2 id="method-title">Najpierw sprawdzasz. Potem rozumiesz.</h2>
                </div>
                <div className="lab-method-grid">
                    <article><span>01</span><Target /><h3>Przewiduj</h3><p>Stawiasz własną hipotezę. Może być błędna — ważne, że da się ją sprawdzić.</p></article>
                    <article><span>02</span><FlaskConical /><h3>Wykonaj</h3><p>Animacja prowadzi Cię krok po kroku, a prawdziwy efekt tworzysz samodzielnie.</p></article>
                    <article><span>03</span><BookOpenCheck /><h3>Zrozum</h3><p>Łączysz obserwację z prostym wyjaśnieniem i jednym zdaniem do zapamiętania.</p></article>
                    <article><span>04</span><Trophy /><h3>Sprawdź się</h3><p>Krótki minitest pokazuje, czy potrafisz użyć reguły w nowej sytuacji.</p></article>
                </div>
            </section>

            <section id="misje" className="lab-missions" aria-labelledby="missions-title">
                <div className="lab-section-heading lab-section-heading--row">
                    <div>
                        <span className="lab-section-label"><Atom /> Plan działu</span>
                        <h2 id="missions-title">Twoje aktywne misje</h2>
                    </div>
                    <div className="lab-total-progress">
                        <span>Łączny postęp</span>
                        <strong>{completionPercent}%</strong>
                    </div>
                </div>

                {physicsModules.map(module => {
                    const moduleExperiments = enabledExperiments.filter(experiment => experiment.moduleId === module.id);
                    if (moduleExperiments.length === 0) return null;
                    const moduleDone = moduleExperiments.filter(experiment => completedEnabledIds.has(experiment.id)).length;
                    const modulePercent = Math.round((moduleDone / moduleExperiments.length) * 100);
                    return (
                        <section key={module.id} className={`lab-module lab-module--${module.accent}`} aria-labelledby={`module-${module.id}`}>
                            <header className="lab-module-header">
                                <div className="lab-module-number">{module.eyebrow.replace('Misja ', '')}</div>
                                <div>
                                    <span>{module.tasks}</span>
                                    <h3 id={`module-${module.id}`}>{module.title}</h3>
                                    <p>{module.description}</p>
                                </div>
                                <div className="lab-module-progress">
                                    <strong>{moduleDone}/{moduleExperiments.length}</strong>
                                    <span><i style={{ width: `${modulePercent}%` }} /></span>
                                </div>
                            </header>
                            <div className="lab-experiment-grid">
                                {moduleExperiments.map(experiment => {
                                    const done = completedEnabledIds.has(experiment.id);
                                    const result = profile.progress.quizResults[experiment.id];
                                    return (
                                        <article key={experiment.id} className={`lab-experiment-card ${done ? 'is-complete' : ''}`}>
                                            <div className="lab-card-topline">
                                                <span className="lab-task-chip">Zadanie {experiment.task}</span>
                                                {done ? <span className="lab-complete-chip"><Check /> wykonane</span> : <span className="lab-new-chip">aktywne</span>}
                                            </div>
                                            <div className="lab-card-symbol" aria-hidden="true"><Atom /></div>
                                            <h4>{experiment.title}</h4>
                                            <p>{experiment.teaser}</p>
                                            <div className="lab-card-meta">
                                                <span><Clock3 /> {experiment.duration}</span>
                                                <span><Gauge /> {difficultyLabel(experiment.difficulty)}</span>
                                                {result && <span><Trophy /> {result.score}/{result.total}</span>}
                                            </div>
                                            <button type="button" onClick={() => setActiveExperiment(experiment)}>
                                                {done ? 'Powtórz doświadczenie' : 'Rozpocznij'} <ChevronRight />
                                            </button>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}

                {enabledExperiments.length === 0 && (
                    <div className="lab-empty-state">
                        <LockKeyhole />
                        <h3>Rodzic jeszcze nie uruchomił doświadczeń.</h3>
                        <p>Po włączeniu misji pojawią się tutaj automatycznie.</p>
                    </div>
                )}
            </section>

            <section className={`lab-final-zone ${profile.finalTestEnabled ? 'is-unlocked' : 'is-locked'}`}>
                <div className="lab-final-zone-copy">
                    <span className="lab-section-label">{profile.finalTestEnabled ? <><Trophy /> Test odblokowany</> : <><LockKeyhole /> Test zablokowany</>}</span>
                    <h2>Test końcowy: zadania 1–20</h2>
                    <p>{profile.finalTestEnabled
                        ? 'Dwadzieścia pytań obejmujących cały dział. Po zakończeniu dostaniesz wynik i dokładne wyjaśnienie każdej pomyłki.'
                        : 'Rodzic może uruchomić test, gdy uzna, że czas sprawdzić cały dział.'}</p>
                    {bestTest !== null && <div className="lab-best-score"><Trophy /> Najlepszy wynik: <strong>{bestTest}%</strong></div>}
                </div>
                <button
                    type="button"
                    className="lab-primary-button lab-primary-button--hero"
                    disabled={!profile.finalTestEnabled}
                    onClick={() => setTestOpen(true)}
                >
                    {profile.finalTestEnabled ? <><Target /> Rozpocznij test</> : <><LockKeyhole /> Czeka na rodzica</>}
                </button>
            </section>

            <footer className="lab-footer">
                <div className="lab-brand"><span><Atom /></span><strong>LAB<span>Fizyka</span></strong></div>
                <p>Eksperymentuj bezpiecznie. Doświadczenia z oznaczeniem bezpieczeństwa wykonuj zgodnie z instrukcją.</p>
                <button type="button" onClick={() => void loadProfile()}><RefreshCcw /> Odśwież misje</button>
            </footer>

            {notice && <div className="lab-toast" role="status"><Check /> {notice}</div>}

            {activeExperiment && (
                <ExperimentRunner
                    experiment={activeExperiment}
                    isCompleted={completedEnabledIds.has(activeExperiment.id)}
                    onClose={() => setActiveExperiment(null)}
                    onComplete={saveExperiment}
                />
            )}

            {testOpen && (
                <FinalTest
                    studentName={profile.studentName}
                    attempts={profile.progress.finalTestAttempts}
                    onClose={() => setTestOpen(false)}
                    onSave={saveFinalTest}
                />
            )}
        </main>
    );
}
