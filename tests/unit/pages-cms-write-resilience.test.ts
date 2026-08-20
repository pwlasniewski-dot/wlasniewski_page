import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../../src/app/api/pages/route.ts', import.meta.url), 'utf8');

test('CMS page write is committed before optional analytics publication registry update', () => {
    const transactionEnd = source.indexOf('await preservePagePublicationBestEffort(page)');
    const pageCreate = source.indexOf('return tx.page.create');
    assert.ok(pageCreate >= 0);
    assert.ok(transactionEnd > pageCreate);
    assert.match(source, /async function preservePagePublicationBestEffort/);
    assert.match(source, /try\s*\{[\s\S]*preserveFirstPublication/);
    assert.match(source, /catch \(error\)[\s\S]*Page saved, but publication registry update failed/);
});

test('drone CMS payload is still validated before any page write', () => {
    const validation = source.indexOf("validateDronePhotographyConfig(sections)");
    const pageWrite = Math.min(
        ...[source.indexOf('return tx.page.update'), source.indexOf('return tx.page.create')].filter(index => index >= 0),
    );
    assert.ok(validation >= 0);
    assert.ok(validation < pageWrite);
});
