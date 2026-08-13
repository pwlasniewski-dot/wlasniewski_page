import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { preservedFirstPublication } from '../../src/lib/analytics/pagePublicationCore.ts';

test('publish, unpublish and republish preserves the first publication date', () => {
  const first = new Date('2026-01-01T10:00:00Z'); const second = new Date('2026-03-01T10:00:00Z');
  let stored = preservedFirstPublication(null, true, first);
  stored = preservedFirstPublication(stored, false, second);
  stored = preservedFirstPublication(stored, true, second);
  assert.equal(stored?.toISOString(), first.toISOString());
});

test('Page, Blog and Portfolio writes use transaction with publication registry helper', async () => {
  const paths = ['../../src/app/api/pages/route.ts', '../../src/app/api/blog/route.ts', '../../src/app/api/blog/[id]/route.ts', '../../src/app/api/portfolio/route.ts'];
  for (const path of paths) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.ok(source.includes('prisma.$transaction'), `${path} missing transaction`);
    assert.ok(source.includes('preserveFirstPublication'), `${path} missing registry helper`);
  }
  const helper = await readFile(new URL('../../src/lib/analytics/pagePublicationRegistry.ts', import.meta.url), 'utf8');
  assert.ok(helper.includes('LEAST('));
});
