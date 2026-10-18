'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
    Beaker,
    Brain,
    Check,
    ChevronLeft,
    ChevronRight,
    Circle,
    Eye,
    Lightbulb,
    ListChecks,
    LoaderCircle,
    RotateCcw,
    ShieldCheck,
    Sparkles,
    Trophy,
    X,
} from 'lucide-react';
import PhysicsAnimation from './PhysicsAnimation';
import type { ChoiceQuestion, PhysicsExperiment } from '@/lib/physics-lab/catalog';

interface ExperimentRunnerProps {
    experiment: PhysicsExperiment;
    isCompleted: boolean;
    onClose: () => void;
    onComplete: (experimentId: string, score: number, total: number) => Promise<void>;
}

type Stage = 'hypothesis' | 'prepare' | 'experiment' | 'observation' | 'understand' | 'quiz' | 'result';

const stageOrder: Stage[] = ['hypothesis', 'prepare', 'experiment', 'observation', 'understand', 'quiz', 'result'];

const stageLabels: Record<Stage, string> = {
    hypothesis: 'Przewiduj',
    prepare: 'Przygotuj',
    experiment: 'Wykonaj',
    observation: 'Obserwuj',
    understand: 'Zrozum',
    quiz: 'Sprawdź się',
    result: 'Gotowe',
};

function ChoiceBlock({
    eyebrow,
    question,
    selected,
    revealed,
    onSelect,
}: {
    eyebrow: string;
    question: ChoiceQuestion;
    selected: number | null;
    revealed: boolean;
    onSelect: (index: number) => void;
}) {
    return (
        <div className="lab-choice-block">
            <div className="lab-choice-eyebrow"><Lightbulb aria-hidden="true" /> {eyebrow}</div>
            <h3>{question.question}</h3>
            <div className="lab-choice-list" role="radiogroup" aria-label={question.question}>
                {question.options.map((option, index) => {
                    const isSelected = selected === index;
                    const isCorrect = revealed && index === question.correctIndex;
                    const isWrong = revealed && isSelected && index !== question.correctIndex;
                    return (
                        <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            disabled={revealed}
                            onClick={() => onSelect(index)}
                            className={`lab-choice ${isSelected ? 'is-selected' : ''} ${isCorrect ? 'is-correct' : ''} ${isWrong ? 'is-wrong' : ''}`}
                        >
                            <span className="lab-choice-marker" aria-hidden="true">
                                {isCorrect ? <Check /> : <Circle />}
                            </span>
                            <span>{option}</span>
                        </button>
                    );
                })}
            </div>
            {revealed && (
                <div className={`lab-feedback ${selected === question.correctIndex ? 'is-correct' : 'is-learning'}`} role="status">
                    <strong>{selected === question.correctIndex ? 'Dobra obserwacja.' : 'To nic — właśnie po to robimy doświadczenie.'}</strong>
                    <p>{question.explanation}</p>
                </div>
            )}
        </div>
    );
}

export default function ExperimentRunner({ experiment, isCompleted, onClose, onComplete }: ExperimentRunnerProps) {
    const [stage, setStage] = useState<Stage>('hypothesis');
    const [hypothesisAnswer, setHypothesisAnswer] = useState<number | null>(null);
    const [hypothesisRevealed, setHypothesisRevealed] = useState(false);
    const [checkedMaterials, setCheckedMaterials] = useState<Set<number>>(new Set());
    const [stepIndex, setStepIndex] = useState(0);
    const [observationAnswer, setObservationAnswer] = useState<number | null>(null);
    const [observationRevealed, setObservationRevealed] = useState(false);
    const [quizIndex, setQuizIndex] = useState(0);
    const [quizAnswers, setQuizAnswers] = useState<Array<number | null>>(() => experiment.quiz.map(() => null));
    const [quizRevealed, setQuizRevealed] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saved, setSaved] = useState(false);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);

    const stageIndex = stageOrder.indexOf(stage);
    const quizScore = useMemo(
        () => quizAnswers.reduce<number>((score, answer, index) => score + (answer === experiment.quiz[index]?.correctIndex ? 1 : 0), 0),
        [experiment.quiz, quizAnswers],
    );
    const allMaterialsReady = checkedMaterials.size === experiment.materials.length;

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeButtonRef.current?.focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !saving) onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [onClose, saving]);

    function goTo(next: Stage) {
        setStage(next);
        const container = document.querySelector('.lab-runner-scroll');
        container?.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function toggleMaterial(index: number) {
        setCheckedMaterials(current => {
            const next = new Set(current);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    }

    async function finishExperiment() {
        if (saved || saving) {
            goTo('result');
            return;
        }
        setSaving(true);
        setSaveError('');
        goTo('result');
        try {
            await onComplete(experiment.id, quizScore, experiment.quiz.length);
            setSaved(true);
            const origin = { y: 0.72 };
            confetti({ particleCount: 90, spread: 72, origin });
            window.setTimeout(() => confetti({ particleCount: 55, spread: 100, origin }), 220);
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : 'Nie udało się zapisać wyniku.');
        } finally {
            setSaving(false);
        }
    }

    function restart() {
        setStage('hypothesis');
        setHypothesisAnswer(null);
        setHypothesisRevealed(false);
        setCheckedMaterials(new Set());
        setStepIndex(0);
        setObservationAnswer(null);
        setObservationRevealed(false);
        setQuizIndex(0);
        setQuizAnswers(experiment.quiz.map(() => null));
        setQuizRevealed(false);
        setSaveError('');
        setSaved(false);
    }

    function setQuizAnswer(index: number) {
        setQuizAnswers(current => current.map((answer, currentIndex) => currentIndex === quizIndex ? index : answer));
    }

    function advanceQuiz() {
        if (quizIndex < experiment.quiz.length - 1) {
            setQuizIndex(index => index + 1);
            setQuizRevealed(false);
        } else {
            void finishExperiment();
        }
    }

    return (
        <div className="lab-modal-backdrop" role="presentation">
            <section
                className="lab-runner"
                role="dialog"
                aria-modal="true"
                aria-labelledby="experiment-title"
            >
                <header className="lab-runner-header">
                    <div className="lab-runner-heading">
                        <span className="lab-kicker">Zadanie {experiment.task} · {experiment.duration}</span>
                        <h2 id="experiment-title">{experiment.title}</h2>
                    </div>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        className="lab-icon-button"
                        onClick={onClose}
                        aria-label="Zamknij doświadczenie"
                    >
                        <X />
                    </button>
                </header>

                <div className="lab-stage-nav" aria-label="Etapy doświadczenia">
                    {stageOrder.map((item, index) => (
                        <div
                            key={item}
                            className={`lab-stage-dot ${index < stageIndex ? 'is-done' : ''} ${index === stageIndex ? 'is-active' : ''}`}
                            aria-current={index === stageIndex ? 'step' : undefined}
                        >
                            <span>{index < stageIndex ? <Check /> : index + 1}</span>
                            <small>{stageLabels[item]}</small>
                        </div>
                    ))}
                </div>

                <div className="lab-runner-scroll">
                    {stage === 'hypothesis' && (
                        <div className="lab-stage-layout">
                            <div className="lab-stage-copy">
                                <span className="lab-section-label"><Sparkles /> Najpierw pomyśl</span>
                                <h3>Nie szukaj odpowiedzi. Postaw własną hipotezę.</h3>
                                <p className="lab-lead">W fizyce dobra hipoteza nie musi być trafiona. Ma być Twoja i ma dać się sprawdzić.</p>
                                <div className="lab-goal-card">
                                    <strong>Cel misji</strong>
                                    <p>{experiment.goal}</p>
                                </div>
                                <ChoiceBlock
                                    eyebrow="Twoje przewidywanie"
                                    question={experiment.hypothesis}
                                    selected={hypothesisAnswer}
                                    revealed={hypothesisRevealed}
                                    onSelect={setHypothesisAnswer}
                                />
                            </div>
                            <div className="lab-stage-visual">
                                <PhysicsAnimation kind={experiment.animation} />
                                <p className="lab-visual-caption">Animacja pokazuje ideę. Wynik sprawdź własnymi rękami.</p>
                            </div>
                        </div>
                    )}

                    {stage === 'prepare' && (
                        <div className="lab-stage-layout lab-stage-layout--prepare">
                            <div className="lab-stage-copy">
                                <span className="lab-section-label"><Beaker /> Stanowisko badawcze</span>
                                <h3>Zbierz wszystko, zanim zaczniesz.</h3>
                                <p className="lab-lead">Kliknij każdy przedmiot, który masz już przygotowany.</p>
                                <div className="lab-material-list">
                                    {experiment.materials.map((material, index) => {
                                        const checked = checkedMaterials.has(index);
                                        return (
                                            <button
                                                key={material}
                                                type="button"
                                                className={`lab-material ${checked ? 'is-checked' : ''}`}
                                                onClick={() => toggleMaterial(index)}
                                            >
                                                <span>{checked ? <Check /> : <Circle />}</span>
                                                {material}
                                            </button>
                                        );
                                    })}
                                </div>
                                {experiment.safety && (
                                    <div className="lab-safety-card">
                                        <ShieldCheck aria-hidden="true" />
                                        <div>
                                            <strong>Bezpieczny eksperyment</strong>
                                            <p>{experiment.safety}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="lab-stage-visual">
                                <div className="lab-ready-orbit" aria-hidden="true">
                                    <Beaker />
                                    <span className="orbit orbit-one" />
                                    <span className="orbit orbit-two" />
                                    <span className="orbit orbit-three" />
                                </div>
                                <p className="lab-ready-count">{checkedMaterials.size}/{experiment.materials.length}</p>
                                <p className="lab-visual-caption">{allMaterialsReady ? 'Stanowisko gotowe. Możesz zaczynać.' : 'Przygotuj wszystkie elementy z listy.'}</p>
                            </div>
                        </div>
                    )}

                    {stage === 'experiment' && (
                        <div className="lab-experiment-stage">
                            <div className="lab-animation-shell">
                                <PhysicsAnimation kind={experiment.animation} step={stepIndex} />
                                <div className="lab-step-counter">Krok {stepIndex + 1} z {experiment.steps.length}</div>
                            </div>
                            <div className="lab-step-panel">
                                <span className="lab-section-label"><ListChecks /> Wykonaj dokładnie</span>
                                <div className="lab-big-step-number">{String(stepIndex + 1).padStart(2, '0')}</div>
                                <h3>{experiment.steps[stepIndex]}</h3>
                                <div className="lab-step-track" aria-label="Postęp wykonywania instrukcji">
                                    {experiment.steps.map((_, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            aria-label={`Przejdź do kroku ${index + 1}`}
                                            aria-current={index === stepIndex ? 'step' : undefined}
                                            className={index <= stepIndex ? 'is-active' : ''}
                                            onClick={() => setStepIndex(index)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {stage === 'observation' && (
                        <div className="lab-stage-layout">
                            <div className="lab-stage-copy">
                                <span className="lab-section-label"><Eye /> Zatrzymaj się i popatrz</span>
                                <h3>Co faktycznie się wydarzyło?</h3>
                                <p className="lab-lead">Nie odpowiadaj z pamięci. Oprzyj się na tym, co właśnie zobaczyłeś.</p>
                                <ChoiceBlock
                                    eyebrow="Twoja obserwacja"
                                    question={experiment.observation}
                                    selected={observationAnswer}
                                    revealed={observationRevealed}
                                    onSelect={setObservationAnswer}
                                />
                            </div>
                            <div className="lab-stage-visual">
                                <PhysicsAnimation kind={experiment.animation} compact />
                                <div className="lab-observation-pulse"><Eye /></div>
                            </div>
                        </div>
                    )}

                    {stage === 'understand' && (
                        <div className="lab-understand-stage">
                            <div className="lab-understand-visual">
                                <PhysicsAnimation kind={experiment.animation} />
                            </div>
                            <div className="lab-understand-copy">
                                <span className="lab-section-label"><Brain /> Teraz składamy fakty</span>
                                <h3>Dlaczego to zadziałało?</h3>
                                <p>{experiment.explanation}</p>
                                <div className="lab-takeaway-card">
                                    <span>Zapamiętaj jedno zdanie</span>
                                    <strong>{experiment.takeaway}</strong>
                                </div>
                            </div>
                        </div>
                    )}

                    {stage === 'quiz' && (
                        <div className="lab-quiz-stage">
                            <div className="lab-quiz-topline">
                                <span className="lab-section-label"><Brain /> Minitest</span>
                                <span>Pytanie {quizIndex + 1}/{experiment.quiz.length}</span>
                            </div>
                            <div className="lab-quiz-meter"><span style={{ width: `${((quizIndex + (quizRevealed ? 1 : 0)) / experiment.quiz.length) * 100}%` }} /></div>
                            <ChoiceBlock
                                eyebrow="Sprawdź, czy rozumiesz"
                                question={experiment.quiz[quizIndex]}
                                selected={quizAnswers[quizIndex]}
                                revealed={quizRevealed}
                                onSelect={setQuizAnswer}
                            />
                            {quizRevealed && (
                                <button type="button" className="lab-primary-button lab-primary-button--wide" onClick={advanceQuiz}>
                                    {quizIndex < experiment.quiz.length - 1 ? <>Następne pytanie <ChevronRight /></> : <>Zakończ misję <Trophy /></>}
                                </button>
                            )}
                        </div>
                    )}

                    {stage === 'result' && (
                        <div className="lab-result-stage">
                            <div className="lab-result-badge"><Trophy /></div>
                            <span className="lab-section-label"><Sparkles /> Misja zakończona</span>
                            <h3>{quizScore === experiment.quiz.length ? 'Pełne trafienie!' : 'Doświadczenie wykonane i zrozumiane.'}</h3>
                            <p className="lab-result-score"><strong>{quizScore}</strong><span>/ {experiment.quiz.length}</span></p>
                            <p>{experiment.takeaway}</p>
                            {saving && <div className="lab-save-status"><LoaderCircle className="is-spinning" /> Zapisuję postęp…</div>}
                            {saved && <div className="lab-save-status is-saved"><Check /> Wynik zapisany w profilu.</div>}
                            {saveError && (
                                <div className="lab-save-status is-error" role="alert">
                                    <span>{saveError}</span>
                                    <button type="button" onClick={() => void finishExperiment()}>Spróbuj zapisać ponownie</button>
                                </div>
                            )}
                            <div className="lab-result-actions">
                                <button type="button" className="lab-secondary-button" onClick={restart} disabled={saving}>
                                    <RotateCcw /> Powtórz doświadczenie
                                </button>
                                <button type="button" className="lab-primary-button" onClick={onClose} disabled={saving}>
                                    Wróć do laboratorium <ChevronRight />
                                </button>
                            </div>
                            {isCompleted && <small>To doświadczenie było już ukończone. Najnowszy wynik zastąpi poprzedni minitest.</small>}
                        </div>
                    )}
                </div>

                {stage !== 'result' && stage !== 'quiz' && (
                    <footer className="lab-runner-footer">
                        <button
                            type="button"
                            className="lab-text-button"
                            onClick={() => {
                                const previous = stageOrder[Math.max(0, stageIndex - 1)];
                                if (previous) goTo(previous);
                            }}
                            disabled={stageIndex === 0}
                        >
                            <ChevronLeft /> Wstecz
                        </button>

                        {stage === 'hypothesis' && !hypothesisRevealed && (
                            <button
                                type="button"
                                className="lab-primary-button"
                                disabled={hypothesisAnswer === null}
                                onClick={() => setHypothesisRevealed(true)}
                            >
                                Sprawdź przewidywanie <Sparkles />
                            </button>
                        )}
                        {stage === 'hypothesis' && hypothesisRevealed && (
                            <button type="button" className="lab-primary-button" onClick={() => goTo('prepare')}>
                                Przygotuj stanowisko <ChevronRight />
                            </button>
                        )}
                        {stage === 'prepare' && (
                            <button type="button" className="lab-primary-button" disabled={!allMaterialsReady} onClick={() => goTo('experiment')}>
                                Zaczynam doświadczenie <ChevronRight />
                            </button>
                        )}
                        {stage === 'experiment' && stepIndex < experiment.steps.length - 1 && (
                            <button type="button" className="lab-primary-button" onClick={() => setStepIndex(index => index + 1)}>
                                Następny krok <ChevronRight />
                            </button>
                        )}
                        {stage === 'experiment' && stepIndex === experiment.steps.length - 1 && (
                            <button type="button" className="lab-primary-button" onClick={() => goTo('observation')}>
                                Mam wynik <Eye />
                            </button>
                        )}
                        {stage === 'observation' && !observationRevealed && (
                            <button type="button" className="lab-primary-button" disabled={observationAnswer === null} onClick={() => setObservationRevealed(true)}>
                                Sprawdź obserwację <Eye />
                            </button>
                        )}
                        {stage === 'observation' && observationRevealed && (
                            <button type="button" className="lab-primary-button" onClick={() => goTo('understand')}>
                                Wyjaśnij mi to <Brain />
                            </button>
                        )}
                        {stage === 'understand' && (
                            <button type="button" className="lab-primary-button" onClick={() => goTo('quiz')}>
                                Uruchom minitest <ChevronRight />
                            </button>
                        )}
                    </footer>
                )}

                {stage === 'quiz' && !quizRevealed && (
                    <footer className="lab-runner-footer lab-runner-footer--quiz">
                        <button type="button" className="lab-text-button" onClick={() => goTo('understand')}>
                            <ChevronLeft /> Wróć do wyjaśnienia
                        </button>
                        <button
                            type="button"
                            className="lab-primary-button"
                            disabled={quizAnswers[quizIndex] === null}
                            onClick={() => setQuizRevealed(true)}
                        >
                            Sprawdź odpowiedź <Check />
                        </button>
                    </footer>
                )}
            </section>
        </div>
    );
}
