import assert from 'node:assert/strict';
import test from 'node:test';
import { growthSignal, shouldCreateZeroBookingAction, trafficSampleStatus } from '../../src/lib/analytics/sampleStatus.ts';

test('one to nine sessions are neutral small sample and create no zero-booking action', () => {
  assert.equal(trafficSampleStatus(1), 'small_sample');
  assert.equal(trafficSampleStatus(9), 'small_sample');
  assert.equal(shouldCreateZeroBookingAction(1, 0), false);
  assert.equal(shouldCreateZeroBookingAction(9, 0), false);
  assert.equal(shouldCreateZeroBookingAction(10, 0), true);
});

test('growth accepts either independently sufficient positive Analytics or GSC signal', () => {
  assert.equal(growthSignal({ currentSessions: 6, previousSessions: 4, currentImpressions: 0, previousImpressions: 0 }).growing, true);
  assert.equal(growthSignal({ currentSessions: 1, previousSessions: 1, currentImpressions: 15, previousImpressions: 5 }).growing, true);
  assert.equal(growthSignal({ currentSessions: 5, previousSessions: 4, currentImpressions: 10, previousImpressions: 9 }).growing, false);
});
