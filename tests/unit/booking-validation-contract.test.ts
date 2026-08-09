import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../../src/app/rezerwacja/page.tsx', import.meta.url), 'utf8');

test('booking submit remains reachable for validation analytics and prevents double submit', () => {
  assert.match(source, /id="booking-flow"[\s\S]*?onSubmit=\{handleSubmit\}[\s\S]*?noValidate/);
  assert.match(source, /type="submit"[\s\S]*?disabled=\{submitting\}/);
  assert.doesNotMatch(source, /disabled=\{!isReadyToSubmit \|\| submitting\}/);
  assert.match(source, /if \(submissionLock\.current\) return;\s*submissionLock\.current = true;\s*setSubmitting\(true\);/);
  assert.match(source, /finally \{[\s\S]*?window\.setTimeout\(\(\) => \{[\s\S]*?submissionLock\.current = false;[\s\S]*?setSubmitting\(false\);[\s\S]*?\}, 750\);[\s\S]*?\}/);
  assert.match(source, /trackEvent\('booking_validation_failed'/);
});
