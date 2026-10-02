import assert from 'node:assert/strict';
import test from 'node:test';
import { dronePackageScopeLines } from '../../src/lib/dronePhotographyScope';
import { bookingSnapshotScopeLines } from '../../src/lib/bookingPackageScope';

test('drone summary does not hide complementary deliverables and delivery', () => {
    assert.deepEqual(dronePackageScopeLines({
        summary: '<p>Prezentacja obiektu</p>',
        features: ['12 opracowanych zdjęć', 'Film 30–45 sekund', '12 opracowanych zdjęć'],
        delivery: 'Materiał do 3 dni roboczych od lotu',
    }), ['Prezentacja obiektu', '12 opracowanych zdjęć', 'Film 30–45 sekund', 'Materiał do 3 dni roboczych od lotu']);
});

test('scope converts markup into inert text without inventing absent drone deliverables', () => {
    assert.deepEqual(dronePackageScopeLines({ summary: '', delivery: '', features: [] }), []);
    assert.deepEqual(dronePackageScopeLines({
        summary: '<script>throw new Error()</script><p>Opis</p>',
        features: ['&lt;img src=x onerror=alert(1)&gt;'], delivery: '',
    }), ['Opis', '<img src=x onerror=alert(1)>']);
});

test('history reads frozen standalone once and appends only stored addon scope', () => {
    const drone = { name: 'Pakiet', scopeLines: ['Zdjęcia z drona', '', 12] };
    assert.deepEqual(bookingSnapshotScopeLines({ service: 'Dron', package: { scopeLines: ['Zdjęcia z drona'] }, drone }), ['Zdjęcia z drona']);
    assert.deepEqual(bookingSnapshotScopeLines({ service: 'Urodziny', package: { scopeLines: ['Reportaż'] }, drone }), ['Reportaż', 'Zdjęcia z drona']);
    assert.deepEqual(bookingSnapshotScopeLines({ service: 'Dron', package: {}, drone: { name: 'Dawny pakiet' } }), []);
});
