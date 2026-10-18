import { task01Experiments } from './catalog/task-01.ts';
import { task02Experiments } from './catalog/task-02.ts';
import { task03Experiments } from './catalog/task-03.ts';
import { task04Experiments } from './catalog/task-04.ts';
import { task05Experiments } from './catalog/task-05.ts';
import { forceExperiments } from './catalog/force.ts';
import { balanceExperiments } from './catalog/balance.ts';
import { measurementExperiments } from './catalog/measurement.ts';

export type {
    ChoiceQuestion,
    FinalTestQuestion,
    PhysicsAnimationKey,
    PhysicsExperiment,
    PhysicsModule,
} from './types.ts';
export { physicsModules } from './catalog/modules.ts';
export { finalTestQuestions } from './catalog/final-test.ts';

export const physicsExperiments = [
    ...task01Experiments,
    ...task02Experiments,
    ...task03Experiments,
    ...task04Experiments,
    ...task05Experiments,
    ...forceExperiments,
    ...balanceExperiments,
    ...measurementExperiments,
];

export const physicsExperimentMap = new Map(physicsExperiments.map(experiment => [experiment.id, experiment]));
export const PHYSICS_EXPERIMENT_IDS = physicsExperiments.map(experiment => experiment.id);
export const PHYSICS_STARTER_IDS = physicsExperiments.filter(experiment => experiment.task <= 5).map(experiment => experiment.id);
export const physicsCatalogVersion = 1;
