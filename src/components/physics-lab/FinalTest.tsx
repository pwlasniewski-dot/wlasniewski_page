'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
    ArrowRight,
    Check,
    ChevronLeft,
    ChevronRight,
    Circle,
    ClipboardCheck,
    Flag,
    LoaderCircle,
    RotateCcw,
    Sparkles,
    Target,
    Trophy,
    X,
} from 'lucide-react';
import { finalTestQuestions } from '@/lib/physics-lab/catalog';
import type { FinalTestAttempt } from '@/lib/physics-lab/profile';

interface FinalTestProps {
    studentName: string;
    attempts: FinalTestAttempt[];
    onClose: () => void;
    onSave: (score: number, total: number) => Promise<void>;
}

type TestPhase = 'intro' | 'test' | 'result';

export default function FinalTest({ studentName, attempts, onClose, onSave }: FinalTestProps) {
    const [phase, setPhase] = useState<TestPhase>('intro');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Array<number | null>>(() => finalTestQuestions.map(() => null));
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);

    const score = useMemo(
        () => answers.reduce<number>((sum, answer, index) => sum + (answer === finalTestQuestions[index].correctIndex ? 1 : 0), 0),
        [answers],
    );
    const answeredCount = answers.filter(answer => answer !== null).length;
    const percentage = Math.round((score / finalTestQuestions.length) * 100);
    const bestPrevious = attempts.length
        ? Math.max(...attempts.map(attempt => Math.round((attempt.score / attempt.total) * 100)))
        : null;

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeButtonRef.current?.focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !saving) onClose();
            if (phase === 'test' && event.key === 'ArrowRight' && currentIndex < finalTestQuestions.length - 1) {
                setCurrentIndex(index => index + 1);
            }
            if (phase === 'test' && event.key === 'ArrowLeft' && currentIndex > 0) {
                setCurrentIndex(index => index - 1);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [currentIndex, onClose, phase, saving]);

    function answerCurrent(index: number) {
        setAnswers(current => current.map((answer, questionIndex) => questionIndex === currentIndex ? index : answer));
    }

    function goNext() {
        if (currentIndex < finalTestQuestions.length - 1) setCurrentIndex(index => index + 1);
    }

    async function submit() {
        const firstMissing = answers.findIndex(answer => answer === null);
        if (firstMissing >= 0) {
            setCurrentIndex(firstMissing);
            setError(`Zostało ${finalTestQuestions.length - answeredCount} pytań bez odpowiedzi.`);
            return;
        }
        setError('');
        setPhase('result');
        setSaving(true);
        try {
            await onSave(score, finalTestQuestions.length);
            setSaved(true);
            const particleCount = percentage >= 80 ? 150 : percentage >= 60 ? 90 : 55;
            confetti({ particleCount, spread: 90, origin: { y: 0.68 } });
            if (percentage >= 90) {
                window.setTimeout(() => confetti({ particleCount: 85, spread: 125, origin: { x: 0.25, y: 0.7 } }), 250);
                window.setTimeout(() => confetti({ particleCount: 85, spread: 125, origin: { x: 0.75, y: 0.7 } }), 420);
            }
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Nie udało się zapisać wyniku.');
        } finally {
            setSaving(false);
        }
    }

    function restart() {
        setAnswers(finalTestQuestions.map(() => null));
        setCurrentIndex(0);
        setPhase('test');
        setSaving(false);
        setSaved(false);
        setError('');
    }

    const current = finalTestQuestions[currentIndex];

    return (
        <div className="lab-modal-backdrop" role="presentation">
            <section className="lab-final-test" role="dialog" aria-modal="true" aria-labelledby="final-test-title">
                <header className="lab-final-header">
                    <div>
                        <span className="lab-kicker">Test końcowy · cały dział</span>
                        <h2 id="final-test-title">Pierwsze spotkanie z fizyką</h2>
                    </div>
                    <button ref={closeButtonRef} type="button" className="lab-icon-button" onClick={onClose} aria-label="Zamknij test" disabled={saving}>
                        <X />
                    </button>
                </header>

                {phase === 'intro' && (
                    <div className="lab-test-intro">
                        <div className="lab-test-orb" aria-hidden="true"><ClipboardCheck /></div>
                        <span className="lab-section-label"><Target /> Sprawdzenie zrozumienia</span>
                        <h3>{studentName}, czas połączyć wszystkie misje.</h3>
                        <p>20 pytań — po jednym do każdego zadania z działu. Odpowiedzi zobaczysz dopiero po zakończeniu, więc test pokaże prawdziwy poziom przygotowania.</p>
                        <div className="lab-test-facts">
                            <div><strong>20</strong><span>pytań</span></div>
                            <div><strong>~15</strong><span>minut</span></div>
                            <div><strong>1</strong><span>pytanie na ekranie</span></div>
                        </div>
                        {bestPrevious !== null && (
                            <div className="lab-previous-best"><Trophy /> Najlepszy wcześniejszy wynik: <strong>{bestPrevious}%</strong></div>
                        )}
                        <button type="button" className="lab-primary-button lab-primary-button--hero" onClick={() => setPhase('test')}>
                            Rozpocznij test <ArrowRight />
                        </button>
                    </div>
                )}

                {phase === 'test' && (
                    <div className="lab-test-workspace">
                        <aside className="lab-question-map" aria-label="Mapa pytań">
                            <div className="lab-question-map-header">
                                <span>Postęp</span>
                                <strong>{answeredCount}/{finalTestQuestions.length}</strong>
                            </div>
                            <div className="lab-test-progress"><span style={{ width: `${(answeredCount / finalTestQuestions.length) * 100}%` }} /></div>
                            <div className="lab-question-grid">
                                {finalTestQuestions.map((question, index) => (
                                    <button
                                        key={question.id}
                                        type="button"
                                        className={`${index === currentIndex ? 'is-current' : ''} ${answers[index] !== null ? 'is-answered' : ''}`}
                                        onClick={() => {
                                            setCurrentIndex(index);
                                            setError('');
                                        }}
                                        aria-label={`Pytanie ${index + 1}${answers[index] !== null ? ', odpowiedź zaznaczona' : ''}`}
                                        aria-current={index === currentIndex ? 'step' : undefined}
                                    >
                                        {answers[index] !== null ? <Check /> : index + 1}
                                    </button>
                                ))}
                            </div>
                            <p>Możesz wracać do pytań przed oddaniem testu.</p>
                        </aside>

                        <main className="lab-test-question">
                            <div className="lab-test-question-topline">
                                <span>Zadanie {current.task}</span>
                                <span>Pytanie {currentIndex + 1} z {finalTestQuestions.length}</span>
                            </div>
                            <h3>{current.question}</h3>
                            <div className="lab-test-options" role="radiogroup" aria-label={current.question}>
                                {current.options.map((option, index) => {
                                    const selected = answers[currentIndex] === index;
                                    return (
                                        <button
                                            key={option}
                                            type="button"
                                            role="radio"
                                            aria-checked={selected}
                                            className={selected ? 'is-selected' : ''}
                                            onClick={() => {
                                                answerCurrent(index);
                                                setError('');
                                            }}
                                        >
                                            <span>{String.fromCharCode(65 + index)}</span>
                                            <strong>{option}</strong>
                                        </button>
                                    );
                                })}
                            </div>
                            {error && <div className="lab-test-error" role="alert">{error}</div>}
                            <div className="lab-test-navigation">
                                <button type="button" className="lab-secondary-button" disabled={currentIndex === 0} onClick={() => setCurrentIndex(index => index - 1)}>
                                    <ChevronLeft /> Poprzednie
                                </button>
                                {currentIndex < finalTestQuestions.length - 1 ? (
                                    <button type="button" className="lab-primary-button" onClick={goNext}>
                                        Następne <ChevronRight />
                                    </button>
                                ) : (
                                    <button type="button" className="lab-primary-button" onClick={() => void submit()}>
                                        Oddaj test <Flag />
                                    </button>
                                )}
                            </div>
                        </main>
                    </div>
                )}

                {phase === 'result' && (
                    <div className="lab-test-result">
                        <div className={`lab-score-ring ${percentage >= 80 ? 'is-great' : percentage >= 60 ? 'is-good' : 'is-training'}`}>
                            <strong>{percentage}%</strong>
                            <span>{score}/{finalTestQuestions.length}</span>
                        </div>
                        <span className="lab-section-label"><Sparkles /> Wynik testu</span>
                        <h3>
                            {percentage >= 90
                                ? 'Fizyka pod kontrolą.'
                                : percentage >= 75
                                    ? 'Bardzo solidne przygotowanie.'
                                    : percentage >= 60
                                        ? 'Podstawa jest dobra — dopracuj kilka punktów.'
                                        : 'Wiadomo już dokładnie, co warto powtórzyć.'}
                        </h3>
                        {saving && <div className="lab-save-status"><LoaderCircle className="is-spinning" /> Zapisuję wynik…</div>}
                        {saved && <div className="lab-save-status is-saved"><Check /> Wynik zapisany.</div>}
                        {error && (
                            <div className="lab-save-status is-error" role="alert">
                                <span>{error}</span>
                                <button type="button" onClick={() => void submit()}>Zapisz ponownie</button>
                            </div>
                        )}

                        <div className="lab-answer-review">
                            <div className="lab-answer-review-heading">
                                <h4>Sprawdź odpowiedzi</h4>
                                <span>{finalTestQuestions.length - score} do powtórzenia</span>
                            </div>
                            {finalTestQuestions.map((question, index) => {
                                const selected = answers[index];
                                const correct = selected === question.correctIndex;
                                return (
                                    <details key={question.id} className={correct ? 'is-correct' : 'is-wrong'} open={!correct}>
                                        <summary>
                                            <span>{correct ? <Check /> : <X />}</span>
                                            <strong>Zadanie {question.task}</strong>
                                            <small>{correct ? 'poprawnie' : 'do powtórzenia'}</small>
                                        </summary>
                                        <div>
                                            <p>{question.question}</p>
                                            <p><b>Twoja odpowiedź:</b> {selected === null ? 'brak' : question.options[selected]}</p>
                                            {!correct && <p><b>Poprawna odpowiedź:</b> {question.options[question.correctIndex]}</p>}
                                            <p className="lab-answer-explanation">{question.explanation}</p>
                                        </div>
                                    </details>
                                );
                            })}
                        </div>

                        <div className="lab-result-actions">
                            <button type="button" className="lab-secondary-button" onClick={restart} disabled={saving}>
                                <RotateCcw /> Rozwiąż ponownie
                            </button>
                            <button type="button" className="lab-primary-button" onClick={onClose} disabled={saving}>
                                Wróć do laboratorium <ChevronRight />
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
