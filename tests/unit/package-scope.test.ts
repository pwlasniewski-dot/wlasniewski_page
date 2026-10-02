import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PackageScope from '../../src/components/booking/PackageScope';
import {
    formatPackageDuration,
    packageDescriptionLines,
    packageFeaturesEditorText,
    packageScopeLines,
    parsePackageFeatures,
} from '../../src/lib/packageScope';

test('existing rich description retains the complete scope without contradictory legacy features', () => {
    const scope = {
        description: '<ol><li><span style="color:white">35 opracowanych zdjęć</span></li><li>Pendrive z gotowym materiałem</li><li>Album nPhoto 20&times;20 cm</li></ol>',
        features: '["do 50 zdjęć", "4 godziny", "fotograf + 2 asystentów"]',
    };
    assert.deepEqual(packageScopeLines(scope), [
        '35 opracowanych zdjęć', 'Pendrive z gotowym materiałem', 'Album nPhoto 20×20 cm',
    ]);
    const html = renderToStaticMarkup(React.createElement(PackageScope, scope));
    assert.match(html, /35 opracowanych zdjęć/);
    assert.match(html, /Pendrive z gotowym materiałem/);
    assert.match(html, /Album nPhoto 20×20 cm/);
    assert.doesNotMatch(html, /do 50|4 godziny|asystentów|color:white/);
});

test('fallback handles empty scope, legacy plain text and malformed features without inventing copy', () => {
    assert.deepEqual(parsePackageFeatures('["35 zdjęć", null, {}, "Pendrive"]'), ['35 zdjęć', 'Pendrive']);
    assert.deepEqual(parsePackageFeatures('35 zdjęć\nPendrive'), ['35 zdjęć', 'Pendrive']);
    assert.deepEqual(parsePackageFeatures('["35 zdjęć",'), []);
    assert.deepEqual(parsePackageFeatures('{"count": 35}'), []);
    assert.deepEqual(packageScopeLines({ description: '<p>&nbsp;<br></p>', features: '["Pendrive"]' }), ['Pendrive']);
    for (const features of [null, undefined, '[]', '[broken', '{}']) {
        assert.equal(renderToStaticMarkup(React.createElement(PackageScope, { features })), '');
    }
});

test('offer copy stays inert React text, with entities and readable rich text boundaries', () => {
    const description = 'Reportaż<div>Zdjęcia rodzinne &amp; portrety</div><div>Pendrive</div><script>alert(1)</script><style>body{display:none}</style>';
    assert.deepEqual(packageDescriptionLines(description), ['Reportaż', 'Zdjęcia rodzinne & portrety', 'Pendrive']);
    const html = renderToStaticMarkup(React.createElement(PackageScope, {
        description: '<p>Album &#x32;&#48;&times;20 cm</p><img src=x onerror="alert(1)"><p>&lt;script&gt;tekst&lt;/script&gt;</p>',
    }));
    assert.match(html, /Album 20×20 cm/);
    assert.match(html, /&lt;script&gt;tekst&lt;\/script&gt;/);
    assert.doesNotMatch(html, /<script|<img|onerror|alert\(1\)/);
    assert.deepEqual(packageDescriptionLines('&#1114112; &#xD800;'), ['&#1114112; &#xD800;']);
});

test('admin feature editing preserves the new line needed to enter a second item', () => {
    const typedText = '35 zdjęć\n';
    const stored = JSON.stringify(typedText.split('\n'));
    assert.equal(packageFeaturesEditorText(stored), typedText);
    assert.equal(packageFeaturesEditorText('Pendrive\nAlbum'), 'Pendrive\nAlbum');
    assert.deepEqual(parsePackageFeatures(stored), ['35 zdjęć']);
});

test('offer and booking use the correct Polish duration for whole and fractional hours', () => {
    for (const [hours, label] of [[1, '1 godzina'], [2, '2 godziny'], [5, '5 godzin'], [12, '12 godzin'], [14, '14 godzin'], [22, '22 godziny'], [24, '24 godziny'], [1.5, '1,5 godziny']] as const) {
        assert.equal(formatPackageDuration(hours), label);
    }
});
