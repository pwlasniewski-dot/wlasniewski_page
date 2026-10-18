export type PhysicsAnimationKey =
    | 'foil'
    | 'spoons'
    | 'pencil'
    | 'measure'
    | 'unit-alarm'
    | 'quantity-detector'
    | 'falling-ball'
    | 'ruler-sound'
    | 'condensation'
    | 'ice-race'
    | 'evaporation'
    | 'circuit'
    | 'magnets'
    | 'gravity'
    | 'electrostatic'
    | 'force-units'
    | 'interaction'
    | 'force-vector'
    | 'instruments'
    | 'effects'
    | 'vector-twins'
    | 'balance-rope'
    | 'balance-diagrams'
    | 'resultant'
    | 'brothers'
    | 'zero-resultant'
    | 'graph'
    | 'dynamometer'
    | 'volume'
    | 'force-scale'
    | 'cart-balance';

export interface ChoiceQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

export interface PhysicsExperiment {
    id: string;
    task: number;
    moduleId: string;
    title: string;
    teaser: string;
    duration: string;
    difficulty: 1 | 2 | 3;
    animation: PhysicsAnimationKey;
    materials: string[];
    safety?: string;
    goal: string;
    hypothesis: ChoiceQuestion;
    steps: string[];
    observation: ChoiceQuestion;
    explanation: string;
    takeaway: string;
    quiz: ChoiceQuestion[];
}

export interface PhysicsModule {
    id: string;
    eyebrow: string;
    title: string;
    description: string;
    tasks: string;
    accent: 'cyan' | 'violet' | 'orange' | 'lime';
}

export interface FinalTestQuestion extends ChoiceQuestion {
    id: string;
    task: number;
}
