import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('V3 dashboard renders traffic sources, ingest quality and expandable session path', async () => {
  const source = await readFile(new URL('../../src/app/admin/analytics/page.tsx', import.meta.url), 'utf8');
  for (const contract of ['data.trafficSources', 'data.ingest', 'session.path', 'setExpandedSession', 'data-testid="traffic-sources-ingest"', 'data-testid="session-path"']) {
    assert.ok(source.includes(contract), `missing UI contract: ${contract}`);
  }
  assert.ok(source.includes('data-testid="sample-status-note"'));
  assert.ok(source.includes("data.overview.dataStatus === 'sufficient' ? 'text-emerald-400' : 'text-zinc-400'"));
  for (const field of ['page.impact.baseline28.sampleStatus', 'page.impact.baseline28.growthConfidence', 'page.impact.baseline28.note', 'data-testid="page-baseline-status"']) {
    assert.ok(source.includes(field), `missing per-page baseline contract: ${field}`);
  }
});
