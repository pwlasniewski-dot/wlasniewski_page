import test from 'node:test';
import assert from 'node:assert/strict';
import {
    PHYSICS_EXPERIMENT_IDS,
    PHYSICS_STARTER_IDS,
    finalTestQuestions,
    physicsExperiments,
    physicsModules,
} from '../../src/lib/physics-lab/catalog.ts';

test('physics catalog has unique experiment identifiers', () => {
    assert.equal(new Set(PHYSICS_EXPERIMENT_IDS).size, PHYSICS_EXPERIMENT_IDS.length);
    assert.equal(PHYSICS_EXPERIMENT_IDS.length, physicsExperiments.length);
});

test('every worksheet task from 1 to 20 is represented', () => {
    const covered = new Set(physicsExperiments.map(experiment => experiment.task));
    for (let task = 1; task <= 20; task += 1) assert.ok(covered.has(task), `missing task ${task}`);
});

test('tasks 1 to 5 offer at least three hands-on experiments each', () => {
    for (let task = 1; task <= 5; task += 1) {
        const count = physicsExperiments.filter(experiment => experiment.task === task).length;
        assert.ok(count >= 3, `task ${task} has only ${count} experiments`);
    }
    assert.equal(PHYSICS_STARTER_IDS.length, 15);
});

test('all experiments point to a known module and contain complete learning flow', () => {
    const modules = new Set(physicsModules.map(module => module.id));
    physicsExperiments.forEach(experiment => {
        assert.ok(modules.has(experiment.moduleId), `${experiment.id} has unknown module`);
        assert.ok(experiment.materials.length > 0, `${experiment.id} has no materials`);
        assert.ok(experiment.steps.length > 0, `${experiment.id} has no steps`);
        assert.ok(experiment.quiz.length > 0, `${experiment.id} has no quiz`);
        assert.ok(experiment.takeaway.length > 8, `${experiment.id} has no takeaway`);
        [experiment.hypothesis, experiment.observation, ...experiment.quiz].forEach(question => {
            assert.ok(question.options.length >= 2);
            assert.ok(question.correctIndex >= 0 && question.correctIndex < question.options.length);
        });
    });
});

test('final test contains one valid question for every task', () => {
    assert.equal(finalTestQuestions.length, 20);
    assert.deepEqual(finalTestQuestions.map(question => question.task), Array.from({ length: 20 }, (_, index) => index + 1));
    assert.equal(new Set(finalTestQuestions.map(question => question.id)).size, 20);
    finalTestQuestions.forEach(question => {
        assert.ok(question.correctIndex >= 0 && question.correctIndex < question.options.length);
        assert.ok(question.explanation.length > 5);
    });
});
