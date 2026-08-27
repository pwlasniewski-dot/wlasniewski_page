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
  for (const field of ['data?.searchQueries', 'data.querySummary.multiplePagesSignals', 'totalRows: number', 'truncated: boolean', 'queryReportIncomplete', "queryReport: 'connected' | 'partial' | 'error'", 'row.multiplePagesSignal', 'row.competingPages', 'data-testid="gsc-query-page-report"']) {
    assert.ok(source.includes(field), `missing GSC query/page contract: ${field}`);
  }
  for (const field of ['data.aero.funnel', 'data.sources.aeroSales.canonicalInquiries', 'data-testid="aero-sales-funnel"']) {
    assert.ok(source.includes(field), `missing separate Aero sales contract: ${field}`);
  }
  for (const field of ['data.photo.entryFunnel', 'data.photo.branches.inquiry', 'data.photo.branches.booking', 'data.sources.photoSales.canonicalInquiries', 'data.sources.finance.successfulBookings', 'data.overview.bookingAttempts', 'data.overview.successfulBookings', 'data-testid="photo-sales-funnel"', 'page.impact.canonicalInquiries', 'page.impact.canonicalBookings']) {
    assert.ok(source.includes(field), `missing photography sales contract: ${field}`);
  }
  assert.ok(source.includes('Rekord pending jest próbą, nie skutecznym zleceniem.'));
  assert.ok(source.includes('Skuteczne zlecenia (wybrany okres)'));
  assert.ok(source.includes('Cel bieżącego miesiąca: 4'));
  assert.ok(source.includes('data.overview.currentMonthSuccessfulBookings'));
});
