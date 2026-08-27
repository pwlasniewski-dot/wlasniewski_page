import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BookingFunnelIntro from '../../src/components/booking/BookingFunnelIntro';
import {
    DEFAULT_PHOTO_FUNNEL_CONFIG,
    hasForbiddenReviewIncentiveCopy,
    parsePhotoFunnelConfig,
    serializePhotoFunnelConfig,
    validatePhotoFunnelConfig,
} from '../../src/lib/marketing/photo-funnel';

function source(path: string) {
    return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
}

test('admin save -> repeated read -> public customer render preserves approved funnel copy', () => {
    const adminDraft = structuredClone(DEFAULT_PHOTO_FUNNEL_CONFIG);
    adminDraft.bookingCopy.heroTitle = 'Sprawdź termin sesji — test kontraktowy';
    adminDraft.bookingCopy.paymentSplitTemplate = 'Wpłać teraz {percent}% po sprawdzeniu danych.';
    adminDraft.display.galleryReviewEnabled = false;

    const validated = validatePhotoFunnelConfig(adminDraft);
    assert.equal(validated.success, true);
    if (!validated.success) return;

    // Admin API stores the serialized value. Its mandatory post-save reload and
    // the public API both pass the stored value through the same safe parser.
    const storedSettingValue = serializePhotoFunnelConfig(validated.data);
    const repeatedAdminRead = parsePhotoFunnelConfig(storedSettingValue);
    const publicApiRead = parsePhotoFunnelConfig(storedSettingValue);

    assert.equal(repeatedAdminRead.bookingCopy.heroTitle, adminDraft.bookingCopy.heroTitle);
    assert.equal(publicApiRead.display.galleryReviewEnabled, false);

    const html = renderToStaticMarkup(React.createElement(BookingFunnelIntro, {
        config: publicApiRead,
        splitPaymentInfo: { enabled: true, percent: 40 },
    }));
    assert.match(html, /Sprawdź termin sesji — test kontraktowy/);
    assert.match(html, /Wpłać teraz 40% po sprawdzeniu danych/);
});

test('actual admin, public API and customer page use the tested CMS contract', () => {
    const admin = source('src/app/admin/photo-funnel/page.tsx');
    const publicSettings = source('src/app/api/settings/public/route.ts');
    const customerPage = source('src/app/rezerwacja/page.tsx');

    assert.match(admin, /serializePhotoFunnelConfig\(validation\.data\)/);
    assert.match(admin, /await loadConfig\(true\)/);
    assert.match(publicSettings, /photo_funnel_config:\s*parsePhotoFunnelConfig\(photoFunnelConfig\)/);
    assert.match(customerPage, /<BookingFunnelIntro config=\{photoFunnelConfig\}/);
});

test('CMS rejects review incentives while retaining neutral editable copy', () => {
    const unsafe = structuredClone(DEFAULT_PHOTO_FUNNEL_CONFIG);
    unsafe.galleryCopy.reviewDescription = 'Wystaw 5 gwiazdek, a otrzymasz rabat za opinię.';
    const rejected = validatePhotoFunnelConfig(unsafe);
    assert.equal(rejected.success, false);
    if (!rejected.success) assert.match(rejected.errors.join(' '), /opinię w zamian za korzyść/);

    const neutral = structuredClone(DEFAULT_PHOTO_FUNNEL_CONFIG);
    neutral.galleryCopy.reviewDescription = 'Napisz szczerze, co było dobre i co mogę poprawić.';
    assert.equal(validatePhotoFunnelConfig(neutral).success, true);

    for (const incentive of [
        'Napisz opinię i odbierz rabat.',
        'Dodaj opinię, a dostaniesz kod.',
        'Kod rabatowy otrzymasz po dodaniu opinii.',
        'Zostaw ocenę — czeka prezent.',
        'Korzyść nie zależy od opinii. Napisz opinię i odbierz rabat.',
    ]) {
        assert.equal(hasForbiddenReviewIncentiveCopy(incentive), true, incentive);
    }
    assert.equal(hasForbiddenReviewIncentiveCopy('Napisz szczerą opinię — każda ocena jest mile widziana.'), false);
    assert.equal(hasForbiddenReviewIncentiveCopy('Korzyść nie zależy od wystawienia opinii ani od jej oceny.'), false);
});
