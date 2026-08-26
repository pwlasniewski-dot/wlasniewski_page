import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { calculateDraftOfferTotal, hasUnambiguousA4Price } from '../../src/lib/offers/draft-total.ts';
import { canonicalizeAcceptedOfferSelection, OfferSelectionError } from '../../src/lib/offers/calculateAcceptedOfferTotal.ts';
import { formatPlnAmount, parsePlnAmount } from '../../src/lib/money/pln.ts';
import { galleryTermsFromAcceptedOffer } from '../../src/lib/galleries/offerTerms.ts';
import { ContractSignatureError, decodeContractSignature } from '../../src/lib/contracts/signature.ts';
import {
    clientOwnershipWhere,
    contractOwnershipWhere,
    isClientRecordOwner,
    isContractRecordOwner,
    isVerifiedAdminIdentity,
} from '../../src/lib/auth/document-access.ts';
import { safeReturnTo } from '../../src/lib/auth/return-to.ts';
import {
    formatLoginServerTiming,
    isSlowLogin,
    SLOW_LOGIN_THRESHOLD_MS,
} from '../../src/lib/auth/login-observability.ts';
import {
    galleryShareSessionType,
    matchesGalleryShareSession,
} from '../../src/lib/galleries/share-session.ts';
import { runCriticalDeliveryPipeline } from '../../src/lib/crm/delivery.ts';
import { hasExpectedMagicBytes } from '../../src/lib/uploads/magic-bytes.ts';
import { escapeHtml, sanitizeUploadedFilename } from '../../src/lib/security/output.ts';
import { galleryCartFingerprint } from '../../src/lib/galleries/order-idempotency.ts';
import {
    CLIENT_VISIBLE_OFFER_STATUSES,
    isAdminImmutableOfferStatus,
    isClientActionableOfferStatus,
    isClientVisibleOfferStatus,
    isUnsendableOfferStatus,
} from '../../src/lib/offers/status.ts';
import {
    isImmutableContractStatus,
    isClientActionableContractStatus,
    isClientVisibleContractStatus,
} from '../../src/lib/contracts/status.ts';

const source = (path: string) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('A4 draft total always follows the explicitly recommended footer column', () => {
    const template = {
        footerPrices: ['Inwestycja', '1 500 zł', '2 400,00 zł'],
        recommendationColumnIndex: 2,
    };
    assert.equal(calculateDraftOfferTotal(template, [], 0), 2400);
    assert.equal(hasUnambiguousA4Price(template), true);
    assert.equal(hasUnambiguousA4Price({ footerPrices: template.footerPrices }), false);

    const patchRoute = source('src/app/api/admin/offers/[id]/route.ts');
    assert.match(patchRoute, /calculateDraftOfferTotal\(effectiveTemplateData, currentSections, offer\.total_price\)/);
});

test('one canonical PLN parser keeps draft, UI, acceptance and PDF totals consistent', () => {
    const variants: Array<string | number> = [
        '1.350 zł',
        '1 350 zł',
        '1350,00 zł',
        '1.350,00 zł',
        1350,
    ];
    for (const price of variants) {
        assert.equal(parsePlnAmount(price), 1350, String(price));
        const template = {
            footerPrices: ['Inwestycja', price],
            pricingHeaders: ['Zakres', 'Pakiet'],
            recommendationColumnIndex: 1,
        };
        assert.equal(calculateDraftOfferTotal(template, [], 0), 1350);
        assert.equal(canonicalizeAcceptedOfferSelection({
            category: 'rodzinna',
            template_data: template,
            sections: [],
            selected_addons: [],
            total_price: 1350,
        }, { selectedPackage: { index: 1 } }).total, 1350);
        assert.equal(parsePlnAmount(formatPlnAmount(price)), 1350);
    }
    for (const invalid of ['1.2.34 zł', '12.34 zł', '1,350', 'abc', '-1350 zł']) {
        assert.equal(parsePlnAmount(invalid), null, invalid);
        assert.throws(() => canonicalizeAcceptedOfferSelection({
            category: 'rodzinna',
            template_data: {
                footerPrices: ['Inwestycja', invalid],
                pricingHeaders: ['Zakres', 'Pakiet'],
                recommendationColumnIndex: 1,
            },
            sections: [],
            selected_addons: [],
            total_price: 999,
        }, { selectedPackage: { index: 1 } }), OfferSelectionError);
    }
    assert.equal(parsePlnAmount(0), 0);
    assert.throws(() => canonicalizeAcceptedOfferSelection({
        category: 'rodzinna',
        template_data: { footerPrices: ['Inwestycja', 0], pricingHeaders: ['Zakres', 'Pakiet'] },
        sections: [],
        selected_addons: [],
        total_price: 999,
    }, { selectedPackage: { index: 1 } }), OfferSelectionError);

    const ui = source('src/app/strefa-klienta/oferty/[id]/page.tsx');
    const pdf = source('src/lib/services/OfferDocument.tsx');
    for (const consumer of [ui, pdf]) {
        assert.match(consumer, /parsePlnAmount/);
        assert.doesNotMatch(consumer, /priceStr\.replace\(\/\[\^0-9\]/);
    }
});

test('terminal offer UI restores the snapshot and cannot recalculate or mutate it locally', () => {
    const ui = source('src/app/strefa-klienta/oferty/[id]/page.tsx');
    const addonUi = source('src/components/client/ClientOfferAddonCheckbox.tsx');
    assert.match(ui, /setSelectedOptionalItems\(new Set\(/);
    assert.match(ui, /if \(!isOfferMutable\) return Math\.max\(0, Number\(offer\.total_price\) \|\| 0\)/);
    assert.match(ui, /if \(\['accept', 'reject', 'negotiate'\]\.includes\(action\) && !isOfferMutable\) return/);
    assert.match(ui, /disabled=\{!isOfferMutable\}/);
    assert.match(addonUi, /const isLocked = !isClientActionableOfferStatus\(offerStatus\)/);
});

test('offer add-ons revalidate the client, enforce statuses and CAS against acceptance', () => {
    const addons = source('src/app/api/client/offer-addons/route.ts');
    const accept = source('src/app/api/client/portal/offers/[id]/route.ts');
    assert.match(addons, /revalidateActiveClient\(decoded\)/);
    assert.match(addons, /if \(!isClientVisibleOfferStatus\(offer\.status\)\)/);
    assert.match(addons, /if \(!isClientActionableOfferStatus\(offer\.status\)\)/);
    assert.equal((addons.match(/prisma\.offer\.updateMany\(/g) || []).length, 2);
    assert.match(addons, /client_id: client\.id,[\s\S]*status: \{ in: CLIENT_ACTIONABLE_OFFER_STATUS_VALUES \},[\s\S]*updated_at: offer\.updated_at/);
    assert.doesNotMatch(addons, /catch \{\}/);
    assert.match(addons, /OFFER_ADDON_REMOVE_AUDIT_FAILED/);
    assert.match(accept, /client_id: client\.id,[\s\S]*updated_at: offer\.updated_at,[\s\S]*status: \{ in: CLIENT_ACTIONABLE_OFFER_STATUS_VALUES \}/);
});

test('critical delivery stops immediately and cannot report success after a required failure', async () => {
    const order: string[] = [];
    const result = await runCriticalDeliveryPipeline({
        validate: async () => { order.push('validate'); return { ok: true }; },
        storePdf: async () => { order.push('s3'); return { ok: false, error: 'S3 failed' }; },
        sendEmail: async () => { order.push('email'); return { ok: true }; },
    });
    assert.deepEqual(order, ['validate', 's3']);
    assert.equal(result.success, false);
    assert.equal(result.failedStep, 's3');

    const sendAll = source('src/app/api/admin/offers/[id]/send-all/route.ts');
    assert.doesNotMatch(sendAll, /Promise\.all|save-s3|save-drive|Drive/);
    assert.match(sendAll, /total_price <= 0/);
});

test('client/admin numeric id collision never grants administrator access', () => {
    const payload = { id: 7, email: 'client@example.com', type: 'client', role: 'CLIENT' };
    const collidingAdmin = { id: 7, email: 'owner@example.com', role: 'ADMIN' };
    assert.equal(isVerifiedAdminIdentity(payload, collidingAdmin), false);
    assert.equal(isVerifiedAdminIdentity(
        { id: 7, email: 'owner@example.com', type: 'admin', role: 'ADMIN' },
        collidingAdmin,
    ), true);
});

test('returnTo accepts only known local client destinations', () => {
    assert.equal(safeReturnTo('/strefa-klienta/oferty/17'), '/strefa-klienta/oferty/17');
    assert.equal(safeReturnTo('/strefa-klienta/umowy/21?tab=pdf'), '/strefa-klienta/umowy/21?tab=pdf');
    assert.equal(safeReturnTo('https://evil.example'), '/konto');
    assert.equal(safeReturnTo('//evil.example/konto'), '/konto');
    assert.equal(safeReturnTo('/admin/clients'), '/konto');
});

test('client sessions cannot be issued to admin, deleted or inactive accounts', () => {
    const login = source('src/lib/auth/client-login.ts');
    const reset = source('src/app/api/auth/reset-password/route.ts');
    assert.match(login, /!user\.is_active/);
    assert.match(login, /user\.role !== 'CLIENT'/);
    assert.match(login, /user\.deleted_at/);
    assert.match(reset, /is_active: true/);
    assert.match(reset, /deleted_at: null/);
    assert.match(reset, /role: 'CLIENT'/);
    assert.match(reset, /cookies\.set\('client_token'/);
});

test('draft visibility, immutable documents and gallery delivery are enforced in routes', () => {
    const userMe = source('src/app/api/user/me/route.ts');
    const offerList = source('src/app/api/client/portal/offers/route.ts');
    const contractList = source('src/app/api/client/portal/contracts/route.ts');
    const contractAdmin = source('src/app/api/admin/contracts/[id]/route.ts');
    const offerAdmin = source('src/app/api/admin/offers/[id]/route.ts');
    const galleryCreate = source('src/app/api/admin/galleries/create/route.ts');
    const gallerySend = source('src/app/api/admin/galleries/[id]/send-access-email/route.ts');

    assert.match(userMe, /CLIENT_VISIBLE_OFFER_STATUS_VALUES/);
    assert.match(offerList, /CLIENT_VISIBLE_OFFER_STATUS_VALUES/);
    assert.match(contractList, /status: \{ in: CLIENT_VISIBLE_CONTRACT_STATUS_VALUES \}/);
    assert.match(contractAdmin, /isImmutableContractStatus/);
    assert.match(offerAdmin, /isAdminImmutableOfferStatus/);
    assert.match(galleryCreate, /client_id: matchedClient\?\.id \|\| null/);
    assert.match(gallerySend, /bcc: OWNER_EMAIL/);
    assert.match(gallerySend, /action: 'gallery_access_sent'/);
});

test('offer lifecycle exposes only deliberately delivered or terminal snapshots', () => {
    assert.deepEqual([...CLIENT_VISIBLE_OFFER_STATUSES], [
        'sent', 'open', 'accepted', 'rejected', 'expired', 'unlock_requested',
    ]);
    for (const hidden of ['draft', 'ready', 'pending', 'template', 'superseded', '']) {
        assert.equal(isClientVisibleOfferStatus(hidden), false, `${hidden} must stay hidden`);
    }
    for (const actionable of ['sent', 'open']) {
        assert.equal(isClientActionableOfferStatus(actionable), true);
    }
    assert.equal(isClientActionableOfferStatus('pending'), false);
    assert.equal(isAdminImmutableOfferStatus('sent'), true);
    assert.equal(isAdminImmutableOfferStatus('accepted'), true);
    assert.equal(isUnsendableOfferStatus('accepted'), true);
    assert.equal(isUnsendableOfferStatus('rejected'), true);
    assert.equal(isUnsendableOfferStatus('expired'), true);
    assert.equal(isUnsendableOfferStatus('template'), true);
    assert.equal(isAdminImmutableOfferStatus('superseded'), true);
    assert.equal(isUnsendableOfferStatus('superseded'), true);

    const create = source('src/app/api/admin/offers/route.ts');
    const upload = source('src/app/api/admin/offers/upload-standalone/route.ts');
    const send = source('src/app/api/admin/offers/[id]/send-email/route.ts');
    const client = source('src/app/api/client/portal/offers/[id]/route.ts');
    assert.match(create, /status: 'draft'/);
    assert.doesNotMatch(create, /status: .*'ready'/);
    assert.match(upload, /status: 'draft'/);
    assert.match(send, /isUnsendableOfferStatus/);
    assert.match(client, /Nieznana akcja oferty/);
    assert.ok(client.indexOf('Nieznana akcja oferty') < client.lastIndexOf('await logClientActivityStrict('));
    assert.match(client, /status: \{ in: CLIENT_ACTIONABLE_OFFER_STATUS_VALUES \}/);
});

test('contract signing persists signed state only after PDF and S3 succeed', () => {
    const sign = source('src/app/api/client/portal/contracts/[id]/sign/route.ts');
    const upload = source('src/app/api/client/portal/contracts/[id]/upload-signed/route.ts');
    const generateIndex = sign.indexOf('await generateContractPDF(');
    const s3Index = sign.indexOf('await uploadToS3(', generateIndex);
    const atomicIndex = sign.indexOf('await tx.contract.updateMany(', s3Index);
    const logIndex = sign.indexOf('await tx.crmActivity.create(', atomicIndex);
    assert.ok(generateIndex >= 0 && s3Index > generateIndex && atomicIndex > s3Index && logIndex > atomicIndex);
    assert.match(sign, /status: \{ in: CLIENT_ACTIONABLE_CONTRACT_STATUS_VALUES \}/);
    assert.match(sign, /signed_pdf_url: signedPdfUrl/);
    assert.match(upload, /isClientActionableContractStatus\(contract\.status\)/);
    assert.match(upload, /status: \{ in: CLIENT_ACTIONABLE_CONTRACT_STATUS_VALUES \}/);
    const uploadCas = upload.indexOf('await tx.contract.updateMany(');
    const uploadAudit = upload.indexOf('await tx.crmActivity.create(', uploadCas);
    assert.ok(uploadCas >= 0 && uploadAudit > uploadCas);
});

test('online contract signature is validated, embedded in the final PDF and hashed atomically', () => {
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl9sAAAAASUVORK5CYII=';
    const decoded = decodeContractSignature(png);
    assert.equal(decoded.width, 1);
    assert.equal(decoded.height, 1);
    assert.equal(decoded.sha256.length, 64);
    assert.throws(() => decodeContractSignature('data:image/jpeg;base64,AAAA'), ContractSignatureError);
    assert.throws(() => decodeContractSignature('data:image/png;base64,AAAA'), ContractSignatureError);

    const sign = source('src/app/api/client/portal/contracts/[id]/sign/route.ts');
    const pdf = source('src/lib/services/generateContractPDF.ts');
    assert.match(sign, /_signaturePng: signature\.buffer/);
    assert.match(sign, /_signatureHash: signature\.sha256/);
    assert.match(sign, /prisma\.\$transaction\(async tx/);
    assert.match(sign, /await tx\.crmActivity\.create/);
    assert.match(sign, /signature_hash: signature\.sha256/);
    assert.match(pdf, /doc\.image\(contract\._signaturePng/);
    assert.match(pdf, /SHA-256 podpisu/);
});

test('gallery delivery authenticates individual clients and includes group credentials', () => {
    const gallery = source('src/app/api/admin/galleries/[id]/send-access-email/route.ts');
    const template = source('src/lib/email-templates.ts');
    assert.match(gallery, /Galeria indywidualna wymaga przypisanego konta klienta/);
    assert.match(gallery, /Nie można wysłać dostępu do wygasłej galerii/);
    assert.match(gallery, /const returnTo = '\/konto'/);
    assert.match(gallery, /buildPasswordSetupUrl\(token, returnTo\)/);
    assert.match(gallery, /buildLoginUrl\(returnTo\)/);
    assert.match(gallery, /groupPassword: isGroupMode \? gallery\.group_password/);
    assert.match(template, /data\.primaryUrl \|\| data\.galleryUrl/);
    assert.match(template, /data\.groupPassword/);
    assert.match(template, /Bezpośredni adres galerii/);
});

test('document delivery uses password setup CTA whenever account activation is still required', () => {
    const offer = source('src/app/api/admin/offers/[id]/send-email/route.ts');
    const contract = source('src/app/api/admin/contracts/[id]/send-email/route.ts');
    const welcome = source('src/app/api/admin/clients/[id]/send-welcome-email/route.ts');
    for (const route of [offer, contract]) {
        assert.match(route, /!client\.last_login \|\| client\.password_reset_required/);
        assert.match(route, /buildPasswordSetupUrl\(token, returnTo\)/);
        assert.match(route, /buildLoginUrl\(returnTo\)/);
    }
    assert.match(welcome, /ensurePasswordSetupToken\(client\)/);
    assert.match(welcome, /buildPasswordSetupUrl\(resetToken, '\/konto'\)/);
});

test('document PDF auth never accepts JWT query strings and alternate login enforces account state', () => {
    const offerPdf = source('src/app/api/offers/[id]/pdf/route.ts');
    const contractPdf = source('src/app/api/contracts/[id]/pdf/route.ts');
    const adminClients = source('src/app/admin/clients/[id]/page.tsx');
    const adminContract = source('src/app/admin/umowy/[id]/page.tsx');
    const account = source('src/app/konto/page.tsx');
    const alternateLogin = source('src/app/api/client/auth/login/route.ts');
    const sharedLogin = source('src/lib/auth/client-login.ts');
    for (const route of [offerPdf, contractPdf]) {
        assert.doesNotMatch(route, /searchParams\.get\(['"]token['"]\)/);
    }
    for (const ui of [adminClients, adminContract, account]) {
        assert.doesNotMatch(ui, /\/pdf\?token=/);
    }
    assert.match(offerPdf, /!isAdmin && !isClientVisibleOfferStatus\(offer\.status\)/);
    assert.match(alternateLogin, /handleClientLogin\(request, 'client-legacy'\)/);
    assert.match(sharedLogin, /deleted_at: true/);
    assert.match(sharedLogin, /password_reset_required: true/);
    assert.match(sharedLogin, /user\.deleted_at/);
    assert.match(sharedLogin, /user\.password_reset_required/);
});

test('all CRM documents use private S3 objects and authenticated download redirects', () => {
    const uploadRoutes = [
        'src/app/api/admin/offers/upload-standalone/route.ts',
        'src/app/api/admin/offers/[id]/upload-pdf/route.ts',
        'src/app/api/admin/offers/[id]/save-s3/route.ts',
        'src/app/api/admin/offers/[id]/send-email/route.ts',
        'src/app/api/client/portal/offers/[id]/route.ts',
        'src/app/api/admin/contracts/upload-standalone/route.ts',
        'src/app/api/admin/contracts/[id]/upload-pdf/route.ts',
        'src/app/api/admin/contracts/[id]/save-s3/route.ts',
        'src/app/api/admin/contracts/[id]/send-email/route.ts',
        'src/app/api/client/portal/contracts/[id]/sign/route.ts',
        'src/app/api/client/portal/contracts/[id]/upload-signed/route.ts',
    ];
    for (const path of uploadRoutes) {
        const route = source(path);
        const calls = route.match(/uploadToS3\([^;]+;/gs) || [];
        assert.ok(calls.length > 0, `${path}: expected an S3 upload`);
        for (const call of calls) assert.match(call, /access: 'private'/, `${path}: upload must be private`);
    }

    const s3 = source('src/lib/storage/s3.ts');
    assert.match(s3, /options\.access === 'private'\) return fileName/);
    for (const path of ['src/app/api/offers/[id]/pdf/route.ts', 'src/app/api/contracts/[id]/pdf/route.ts']) {
        const route = source(path);
        assert.match(route, /getPrivateS3DownloadUrl/);
        assert.doesNotMatch(route, /NextResponse\.redirect\((offer|contract)\.(pdf_url|signed_pdf_url)/);
    }
    for (const path of [
        'src/app/api/admin/offers/[id]/send-email/route.ts',
        'src/app/api/admin/contracts/[id]/send-email/route.ts',
    ]) {
        const route = source(path);
        assert.match(route, /getPrivateS3Object/);
        assert.doesNotMatch(route, /attachments\.push\(\{[^}]*path:/s);
    }
});

test('admin document mutation routes preserve sent and final snapshots', () => {
    for (const path of [
        'src/app/api/admin/offers/[id]/save-s3/route.ts',
        'src/app/api/admin/offers/[id]/upload-pdf/route.ts',
        'src/app/api/admin/offers/[id]/save-drive/route.ts',
    ]) {
        assert.match(source(path), /isAdminImmutableOfferStatus/);
    }
    const drive = source('src/app/api/admin/offers/[id]/save-drive/route.ts');
    assert.match(drive, /status: 501/);
    assert.doesNotMatch(drive, /prisma\.offer\.update/);

    for (const path of [
        'src/app/api/admin/contracts/[id]/save-s3/route.ts',
        'src/app/api/admin/contracts/[id]/upload-pdf/route.ts',
        'src/app/api/admin/contracts/[id]/route.ts',
        'src/app/api/admin/contracts/route.ts',
    ]) {
        assert.match(source(path), /isImmutableContractStatus/);
    }
    const offerAdmin = source('src/app/api/admin/offers/[id]/route.ts');
    assert.match(offerAdmin, /const attachedContract = await tx\.contract\.findUnique/);
    assert.doesNotMatch(offerAdmin, /prisma\.contract\.deleteMany/);
});

test('accepted and signed CAS flows use unique keys and clean losing uploads', () => {
    const accept = source('src/app/api/client/portal/offers/[id]/route.ts');
    const sign = source('src/app/api/client/portal/contracts/[id]/sign/route.ts');
    const upload = source('src/app/api/client/portal/contracts/[id]/upload-signed/route.ts');

    assert.match(accept, /Boolean\(offer\.template_data\) \|\| offer\.sections\.length > 0/);
    assert.match(accept, /randomUUID\(\)/);
    assert.match(accept, /pdf_url: acceptedPdfKey/);
    assert.match(accept, /deleteFromS3\(uploadedAcceptedPdf\)/);
    assert.ok(accept.indexOf('await generateOfferPDF(') < accept.indexOf('await tx.offer.updateMany('));

    for (const route of [sign, upload]) {
        assert.match(route, /randomUUID\(\)/);
        assert.match(route, /deleteFromS3/);
        assert.match(route, /status: \{ in: CLIENT_ACTIONABLE_CONTRACT_STATUS_VALUES \}/);
    }
});

test('client session routes revalidate the active User record and magic login issues a client JWT', () => {
    const helper = source('src/lib/auth/active-client.ts');
    assert.match(helper, /user\.role !== 'CLIENT' \|\| !user\.is_active \|\| user\.deleted_at/);
    assert.match(helper, /user\.password_reset_required/);
    assert.match(helper, /user\.email\.trim\(\)\.toLowerCase\(\) !== identity\.email\.trim\(\)\.toLowerCase\(\)/);

    for (const path of [
        'src/app/api/user/me/route.ts',
        'src/app/api/client/portal/offers/route.ts',
        'src/app/api/client/portal/offers/[id]/route.ts',
        'src/app/api/client/portal/contracts/route.ts',
        'src/app/api/client/portal/contracts/[id]/route.ts',
        'src/app/api/client/portal/contracts/[id]/sign/route.ts',
        'src/app/api/client/portal/contracts/[id]/upload-signed/route.ts',
    ]) {
        assert.match(source(path), /revalidateActiveClient/);
    }

    const magic = source('src/app/api/photo-challenge/magic-login/route.ts');
    assert.match(magic, /user\.role !== 'CLIENT'/);
    assert.match(magic, /!user\.is_active/);
    assert.match(magic, /user\.deleted_at/);
    assert.match(magic, /user\.password_reset_required/);
    assert.match(magic, /role: 'CLIENT', type: 'client'/);
    assert.match(magic, /cookies\.set\('client_token'/);
});

test('standalone offer upload requires and persists a positive PLN price from the admin UI', () => {
    const route = source('src/app/api/admin/offers/upload-standalone/route.ts');
    const ui = source('src/app/admin/clients/[id]/page.tsx');
    assert.match(route, /parsePlnAmount\(formData\.get\('total_price'\)\)/);
    assert.match(route, /totalPrice <= 0/);
    assert.match(route, /total_price: totalPrice/);
    assert.match(ui, /standaloneOfferPrice/);
    assert.match(ui, /formData\.append\('total_price', standaloneOfferPrice\)/);
    assert.match(ui, /parsePlnAmount\(standaloneOfferPrice\)/);
    assert.match(ui, /Cena samodzielnej oferty w PLN/);
});

test('offer and contract delivery attach PDF before changing status', () => {
    for (const path of [
        'src/app/api/admin/offers/[id]/send-email/route.ts',
        'src/app/api/admin/contracts/[id]/send-email/route.ts',
    ]) {
        const route = source(path);
        const generate = route.indexOf(path.includes('/offers/') ? 'generateOfferPDF(' : 'generateContractPDF(');
        const mail = route.indexOf('await sendEmail(');
        const status = route.lastIndexOf("data: { status: 'sent'");
        assert.ok(generate >= 0 && mail > generate, `${path}: PDF must be generated before email`);
        assert.ok(status > mail, `${path}: sent status must be written after email`);
        assert.match(route, /bcc: OWNER_EMAIL/);
        assert.match(route, /attachments/);
    }
});

test('family voucher never accepts query JWT and revalidates admin or active owner without id collision', () => {
    const voucher = source('src/app/api/client/portal/offers/[id]/family-voucher/route.ts');
    const offerUi = source('src/app/strefa-klienta/oferty/[id]/page.tsx');
    assert.doesNotMatch(voucher, /searchParams\.get\(['"]token['"]\)/);
    assert.match(voucher, /isVerifiedAdminIdentity\(identity, admin\)/);
    assert.match(voucher, /revalidateActiveClient\(identity\)/);
    assert.match(voucher, /!isAdmin && !isOwner/);
    assert.doesNotMatch(offerUi, /\.\.\.\(token \? \{ token \}/);
});

test('individual gallery owner access revalidates active CLIENT state and rejects legacy owner cookies', () => {
    const galleryList = source('src/app/api/galleries/client/route.ts');
    const individualAccess = source('src/lib/galleries/individual-access.ts');
    assert.match(galleryList, /revalidateActiveClient\(decoded\)/);
    assert.match(individualAccess, /revalidateActiveClient\(decoded\)/);
    assert.match(individualAccess, /isVerifiedAdminIdentity\(decoded, admin\)/);
    assert.match(source('src/lib/galleries/share-session.ts'), /gallery-share:v1:/);
    assert.match(individualAccess, /galleryShareSessionType\(gallery\.id, configuredPassword\)/);
    assert.match(individualAccess, /gallerySession && configuredPassword/);
    assert.match(source('src/lib/galleries/share-session.ts'), /timingSafeEqual/);
    assert.match(individualAccess, /access\.reason !== 'share-password'/);
    assert.doesNotMatch(individualAccess, /decoded\?\.role === 'ADMIN' \|\| decoded\?\.role === 'PHOTOGRAPHER'/);
    const open = source('src/app/api/galleries/[accessCode]/route.ts');
    assert.ok(open.indexOf('authorizeIndividualGallery(request, gallery)') < open.indexOf('prisma.galleryPhoto.findMany'));
    assert.match(open, /GALLERY_OPEN_FAILED/);
    assert.match(open, /correlationId: operation\.correlationId/);
    assert.match(galleryList, /expires_at: \{ gte: new Date\(\) \}/);
});

test('gallery share-session fingerprint rotates with password and never contains the password', () => {
    const secret = 'x'.repeat(32);
    const first = galleryShareSessionType(17, 'pierwsze-haslo', secret);
    const same = galleryShareSessionType(17, 'pierwsze-haslo', secret);
    const rotated = galleryShareSessionType(17, 'drugie-haslo', secret);
    assert.equal(first, same);
    assert.notEqual(first, rotated);
    assert.equal(first.includes('pierwsze-haslo'), false);
    assert.equal(matchesGalleryShareSession(first, same), true);
    assert.equal(matchesGalleryShareSession(first, rotated), false);
    assert.equal(matchesGalleryShareSession(undefined, same), false);
});

test('login timing uses the 1500 ms threshold and emits valid Server-Timing metrics', () => {
    assert.equal(SLOW_LOGIN_THRESHOLD_MS, 1500);
    assert.equal(isSlowLogin(1499.9), false);
    assert.equal(isSlowLogin(1500), true);
    assert.equal(formatLoginServerTiming({
        parseMs: 1.24,
        dbMs: 20.05,
        bcryptMs: 900.99,
        auditMs: 33.34,
        totalMs: 955.62,
    }), 'parse;dur=1.2, db;dur=20.1, bcrypt;dur=901.0, audit;dur=33.3, total;dur=955.6');
    assert.equal(formatLoginServerTiming({
        parseMs: 1.24,
        dbMs: 20.05,
        bcryptMs: 900.99,
        auditMs: 33.34,
        totalMs: 955.62,
    }, { nodeEnv: 'production', debug: false }), 'total;dur=955.6');
    assert.match(formatLoginServerTiming({
        parseMs: 1,
        dbMs: 2,
        bcryptMs: 3,
        auditMs: 4,
        totalMs: 10,
    }, { nodeEnv: 'production', debug: true }), /bcrypt;dur=3\.0/);
});

test('both client login endpoints use one measured transactional core with correlated incidents', () => {
    const primary = source('src/app/api/auth/login/route.ts');
    const alternate = source('src/app/api/client/auth/login/route.ts');
    const core = source('src/lib/auth/client-login.ts');
    const timing = source('src/lib/auth/login-observability.ts');
    const incidents = source('src/lib/admin-incidents.ts');

    assert.match(primary, /handleClientLogin\(req, 'primary'\)/);
    assert.match(alternate, /handleClientLogin\(request, 'client-legacy'\)/);
    assert.match(timing, /performance\.now\(\)/);
    for (const stage of ['parse', 'db', 'bcrypt', 'audit']) {
        assert.match(core, new RegExp(`measureLoginStage\\(timing, '${stage}'`));
    }
    assert.match(core, /prisma\.\$transaction\(\[/);
    assert.match(core, /last_failed_login: failedAt/);
    assert.match(core, /last_login: loggedInAt/);
    assert.match(core, /prisma\.systemLog\.create/);
    assert.match(core, /prisma\.crmActivity\.create/);
    assert.match(core, /Server-Timing/);
    assert.match(core, /X-Correlation-ID/);
    assert.match(core, /DUMMY_PASSWORD_HASH/);
    for (const reason of ['RATE_LIMIT', 'DB_ERROR', 'SERVER_ERROR', 'INACTIVE', 'DELETED', 'RESET_REQUIRED', 'SLOW_LOGIN']) {
        assert.match(core, new RegExp(`['"]${reason}['"]`));
    }
    assert.doesNotMatch(core, /logSystem|logCrmActivity/);
    assert.match(incidents, /sendIndependentAdminAlert\(input, persistenceError\)/);
    assert.match(incidents, /throw persistenceError/);
    assert.match(incidents, /recordAdminIncidentSafely/);
    assert.match(incidents, /console\.error\('\[ADMIN_INCIDENT\] Persistence failed'/);
});

test('client ownership gives populated foreign keys precedence over stale emails', () => {
    const owner = { id: 109, email: 'owner@example.com' };
    const staleEmailAccount = { id: 777, email: 'stale@example.com' };
    const mismatched = { client_id: 109, client_email: 'stale@example.com' };
    assert.equal(isClientRecordOwner(mismatched, owner), true);
    assert.equal(isClientRecordOwner(mismatched, staleEmailAccount), false);
    assert.equal(isClientRecordOwner({ client_id: null, client_email: 'stale@example.com' }, staleEmailAccount), true);
    assert.deepEqual(clientOwnershipWhere(staleEmailAccount), [
        { client_id: 777 },
        { client_id: null, client_email: 'stale@example.com' },
    ]);

    const contract = { client_id: 109, offer: { client_id: null, client_email: 'stale@example.com' } };
    assert.equal(isContractRecordOwner(contract, staleEmailAccount), false);
    assert.equal(isContractRecordOwner({ client_id: null, offer: mismatched }, staleEmailAccount), false);
    assert.match(JSON.stringify(contractOwnershipWhere(staleEmailAccount)), /"client_id":null/);

    const routed = [
        'src/app/api/user/me/route.ts',
        'src/app/api/client/portal/offers/route.ts',
        'src/app/api/client/portal/offers/[id]/route.ts',
        'src/app/api/offers/[id]/pdf/route.ts',
        'src/app/api/client/portal/offers/[id]/family-voucher/route.ts',
        'src/app/api/client/portal/contracts/route.ts',
        'src/app/api/client/portal/contracts/[id]/route.ts',
        'src/app/api/contracts/[id]/pdf/route.ts',
        'src/app/api/galleries/client/route.ts',
        'src/lib/galleries/individual-access.ts',
    ];
    for (const path of routed) assert.match(source(path), /(clientOwnershipWhere|contractOwnershipWhere|isClientRecordOwner|isContractRecordOwner)/, path);
});

test('only delivered offers and sent contracts accept client mutations', () => {
    assert.equal(isClientActionableOfferStatus('sent'), true);
    assert.equal(isClientActionableOfferStatus('open'), true);
    for (const status of ['pending', 'draft', 'accepted', 'rejected', 'expired']) {
        assert.equal(isClientActionableOfferStatus(status), false);
    }
    assert.equal(isClientVisibleContractStatus('sent'), true);
    assert.equal(isClientVisibleContractStatus('signed'), true);
    assert.equal(isClientActionableContractStatus('sent'), true);
    for (const status of ['draft', 'pending', 'signed']) assert.equal(isClientActionableContractStatus(status), false);

    const offerAction = source('src/app/api/client/portal/offers/[id]/route.ts');
    assert.match(offerAction, /action !== 'request_unlock' && offer\.valid_until && offer\.valid_until < new Date\(\)/);
    for (const route of [
        source('src/app/api/client/portal/contracts/[id]/sign/route.ts'),
        source('src/app/api/client/portal/contracts/[id]/upload-signed/route.ts'),
    ]) {
        assert.match(route, /status: \{ in: CLIENT_ACTIONABLE_CONTRACT_STATUS_VALUES \}/);
        assert.doesNotMatch(route, /status: \{ not: 'signed' \}/);
        assert.match(route, /updated_at: contract\.updated_at/);
    }
    for (const route of [
        source('src/app/api/client/portal/offers/route.ts'),
        source('src/app/api/client/portal/offers/[id]/route.ts'),
    ]) {
        assert.match(route, /isClientVisibleContractStatus\(offer\.contract\.status\)/);
        assert.doesNotMatch(route, /\['draft', 'DRAFT'\]\.includes\(offer\.contract\.status\)/);
    }
});

test('client note and album-interest routes use active-client ownership, status guards and strict audit', () => {
    const offerNote = source('src/app/api/user/offers/[id]/note/route.ts');
    const contractNote = source('src/app/api/user/contracts/[id]/note/route.ts');
    const interest = source('src/app/api/client/album-interest/route.ts');
    for (const route of [offerNote, contractNote, interest]) {
        assert.match(route, /revalidateActiveClient\(decoded\)/);
        assert.match(route, /correlationId/);
        assert.match(route, /recordAdminIncidentSafely/);
    }
    assert.match(offerNote, /logClientActivityStrict/);
    assert.match(contractNote, /logClientActivityStrict/);
    assert.match(offerNote, /status: \{ in: CLIENT_ACTIONABLE_OFFER_STATUS_VALUES \}/);
    assert.match(contractNote, /status: \{ in: CLIENT_ACTIONABLE_CONTRACT_STATUS_VALUES \}/);
    assert.match(interest, /stillActionableBeforeNotification/);
});

test('admin offer create/update and client summary share the canonical PLN parser', () => {
    const create = source('src/app/api/admin/offers/route.ts');
    const update = source('src/app/api/admin/offers/[id]/route.ts');
    const clientAdmin = source('src/app/admin/clients/[id]/page.tsx');
    const offerAdmin = source('src/app/admin/offers/[id]/page.tsx');
    for (const route of [create, update, clientAdmin]) assert.match(route, /parsePlnAmount/);
    assert.doesNotMatch(create, /price: Number\(item\.price\)/);
    assert.doesNotMatch(update, /parseInt\(client_selection\.totalPrice\)/);
    assert.doesNotMatch(clientAdmin, /parsePriceFromText/);
    assert.doesNotMatch(offerAdmin, /Akceptuj ofertę za klienta|handleAcceptForClient/);
});

test('accepted offer gallery terms parse PLN separately from strict photo counts', () => {
    for (const price of ['1.350 zł', '1 350 zł', '1350,00 zł', '1.350,00 zł', 1350]) {
        const terms = galleryTermsFromAcceptedOffer({
            id: 75,
            status: 'accepted',
            client_selection: { selectedPackage: { index: 1 } },
            template_data: {
                extraPhotoPrice: price,
                pricingRows: [{ values: ['Liczba finalnych zdjęć', '30 zdjęć'] }],
            },
            total_price: 5000,
        });
        assert.equal(terms.includedPhotoCount, 30);
        assert.equal(terms.extraPhotoPriceGrosz, 135000);
    }
    for (const invalid of ['12.34 zł', '1,350', 'abc', '-5 zł']) {
        assert.throws(() => galleryTermsFromAcceptedOffer({
            id: 75,
            status: 'accepted',
            client_selection: { selectedPackage: { index: 1 } },
            template_data: { extraPhotoPrice: invalid, pricingRows: [] },
            total_price: 5000,
        }));
    }
    assert.throws(() => galleryTermsFromAcceptedOffer({
        id: 75,
        status: 'accepted',
        client_selection: { selectedPackage: { index: 1 } },
        template_data: { extraPhotoPrice: 20, pricingRows: [{ values: ['Liczba finalnych zdjęć', '30.5'] }] },
        total_price: 5000,
    }));
});

test('AdminIncident migration, indexed schema, API actions and Polish panel are present', () => {
    const schema = source('prisma/schema.prisma');
    const migration = source('prisma/migrations/20260823120000_add_admin_incidents/migration.sql');
    const api = source('src/app/api/admin/incidents/route.ts');
    const panel = source('src/app/admin/incidents/page.tsx');
    const sidebar = source('src/components/admin/Sidebar.tsx');

    assert.match(schema, /model AdminIncident/);
    assert.match(schema, /enum AdminIncidentSeverity/);
    assert.match(schema, /enum AdminIncidentStatus/);
    assert.match(schema, /@@index\(\[status, severity, occurred_at\]\)/);
    assert.match(migration, /CREATE TABLE "admin_incidents"/);
    assert.match(api, /export async function GET/);
    assert.match(api, /export async function PATCH/);
    assert.match(api, /action !== 'acknowledge' && action !== 'resolve'/);
    assert.match(panel, /Centrum incydentów/);
    assert.match(panel, /Przyjmij/);
    assert.match(panel, /Rozwiąż/);
    assert.match(panel, /Szczegóły techniczne/);
    assert.match(panel, /acknowledged_at/);
    assert.match(panel, /resolved_at/);
    assert.match(panel, /60_000/);
    assert.match(sidebar, /href: '\/admin\/incidents'/);
});

test('communication failures create correlated P1 admin incidents without changing business outcomes', () => {
    const expectedRoutes = [
        ['src/app/api/admin/clients/[id]/send-welcome-email/route.ts', 'WELCOME_EMAIL_DELIVERY_FAILED'],
        ['src/app/api/admin/offers/[id]/send-email/route.ts', 'OFFER_EMAIL_DELIVERY_FAILED'],
        ['src/app/api/admin/contracts/[id]/send-email/route.ts', 'CONTRACT_EMAIL_DELIVERY_FAILED'],
        ['src/app/api/admin/galleries/[id]/send-access-email/route.ts', 'GALLERY_ACCESS_EMAIL_DELIVERY_FAILED'],
        ['src/app/api/client/portal/offers/[id]/route.ts', 'OFFER_ACCEPT_ADMIN_NOTIFICATION_FAILED'],
        ['src/app/api/client/portal/offers/[id]/route.ts', 'OFFER_REJECT_ADMIN_NOTIFICATION_FAILED'],
        ['src/app/api/client/portal/offers/[id]/route.ts', 'OFFER_NEGOTIATE_ADMIN_NOTIFICATION_FAILED'],
        ['src/app/api/client/portal/contracts/[id]/sign/route.ts', 'CONTRACT_SIGN_ADMIN_NOTIFICATION_FAILED'],
        ['src/app/api/client/portal/contracts/[id]/upload-signed/route.ts', 'CONTRACT_UPLOAD_ADMIN_NOTIFICATION_FAILED'],
    ] as const;
    for (const [path, reason] of expectedRoutes) {
        const route = source(path);
        assert.match(route, /recordAdminIncidentSafely/);
        assert.match(route, new RegExp(`'${reason}'`));
        assert.match(route, /severity: 'P1'/);
        assert.match(route, /correlationId/);
    }
});

test('client portal loads contracts once with offer projection and has matching lookup indexes', () => {
    const me = source('src/app/api/user/me/route.ts');
    const schema = source('prisma/schema.prisma');
    const migration = source('prisma/migrations/20260823123000_add_client_portal_lookup_indexes/migration.sql');
    assert.equal((me.match(/prisma\.contract\.findMany\(/g) || []).length, 1);
    assert.match(me, /OR: contractOwnershipWhere\(userResult\)/);
    assert.doesNotMatch(me, /offer_id: \{ in: offerIds \}/);
    assert.match(me, /offer: \{\s*select: \{ title: true, total_price: true, offerNumber: true \}/s);
    assert.doesNotMatch(me, /prisma\.offer\.findUnique/);
    assert.doesNotMatch(me, /\.catch\(\(\) => \[\]\)/);
    assert.match(me, /reasonCode: 'PORTAL_LOAD_FAILED'/);
    for (const index of [
        '@@index([client_id, status, created_at])',
        '@@index([client_email, status, created_at])',
        '@@index([client_id, is_active, created_at])',
        '@@index([client_email, is_active, created_at])',
    ]) assert.ok(schema.includes(index), index);
    assert.equal((migration.match(/CREATE INDEX/g) || []).length, 5);
});

test('password reset consumes the active client token with an atomic CAS before session issuance', () => {
    const reset = source('src/app/api/auth/reset-password/route.ts');
    const cas = reset.indexOf('await prisma.user.updateMany(');
    const read = reset.indexOf('await prisma.user.findUnique(', cas);
    const session = reset.indexOf('await generateToken(', read);
    assert.ok(cas >= 0 && read > cas && session > read);
    assert.match(reset, /id: user\.id,\s*reset_token: token,\s*reset_token_expires: \{ gt: now \},\s*is_active: true,\s*deleted_at: null,\s*role: 'CLIENT'/s);
    assert.match(reset, /changed\.count !== 1/);
    assert.match(reset, /prisma\.\$transaction\(\[/);
});

test('signed-contract upload refuses an undefined admin recipient before notification send', () => {
    const upload = source('src/app/api/client/portal/contracts/[id]/upload-signed/route.ts');
    const adminEmail = upload.indexOf('const adminEmail = await getAdminEmail();');
    const guard = upload.indexOf("if (!adminEmail) throw new Error('Brak adresu administratora');", adminEmail);
    const send = upload.indexOf('await sendEmail({', guard);
    assert.ok(adminEmail >= 0 && guard > adminEmail && send > guard);
});

test('account action center uses one light initial request, lazy tabs and preserves challenge access', () => {
    const summary = source('src/app/api/user/action-summary/route.ts');
    const account = source('src/app/konto/page.tsx');
    assert.match(summary, /photos: \{ some: \{\} \}/);
    assert.match(summary, /prisma\.photoChallenge\.findFirst/);
    assert.match(summary, /prisma\.photoChallenge\.count/);
    assert.match(summary, /kind: 'challenge'/);
    assert.match(account, /fetch\('\/api\/user\/action-summary'/);
    assert.match(account, /120000/);
    assert.match(account, /moduleKey === 'sessions'/);
    assert.match(account, /Kod sprawy:/);
    assert.doesNotMatch(account, /Promise\.all\(\[\s*fetch\('\/api\/user\/me'/);
    assert.doesNotMatch(account, /30000/);
    assert.doesNotMatch(account, /Warsztaty — zawsze widoczna jako bajer/);
    const challenges = source('src/app/api/photo-challenge/client/challenges/route.ts');
    assert.match(challenges, /revalidateActiveClient\(identity\)/);
    assert.match(challenges, /invitee_user_id: null, invitee_contact: client\.email/);
    assert.match(challenges, /recordAdminIncidentSafely/);
});

test('daily CRM digest extends the single report with backlog, SLA movement and login p95', () => {
    const builder = source('src/lib/crm/daily-report.ts');
    const report = source('netlify/functions/daily-analytics-report.ts');
    assert.match(builder, /percentile95/);
    assert.match(builder, /severity: 'P0', status: 'OPEN'/);
    assert.match(builder, /severity: 'P1', status: 'OPEN'/);
    assert.match(builder, /acknowledged_at: \{ gte: start, lt: end \}/);
    assert.match(builder, /resolved_at: \{ gte: start, lt: end \}/);
    assert.match(builder, /OFFER_ZERO_PRICE_PREVENTED/);
    assert.match(report, /buildCrmDailySnapshot\(dayStart, todayStart\)/);
    assert.match(report, /\$\{crmHtml\}/);
    assert.equal((report.match(/await sendEmail\(/g) || []).length, 1);
    assert.match(report, /DAILY_REPORT_DELIVERY_FAILED/);
    const panel = source('src/app/admin/incidents/page.tsx');
    assert.match(panel, /\/api\/admin\/reports\/crm-daily/);
    assert.match(panel, /CRM — ostatnie 24 godziny/);
    assert.match(panel, /Login p95:/);
});

test('password links are reused with CAS and invalid links keep their deep-link recovery path', () => {
    const helper = source('src/lib/auth/password-setup-token.ts');
    const forgot = source('src/app/api/auth/forgot-password/route.ts');
    const setup = source('src/app/logowanie/ustaw-haslo/page.tsx');
    assert.match(helper, /user\.reset_token_expires > now/);
    assert.match(helper, /prisma\.user\.updateMany/);
    assert.match(helper, /reset_token: user\.reset_token/);
    assert.match(helper, /reset_token_expires: user\.reset_token_expires/);
    assert.match(forgot, /ensurePasswordSetupToken\(user/);
    assert.match(forgot, /safeReturnTo\(returnTo\)/);
    assert.match(setup, /Zaloguj się/);
    assert.match(setup, /Wyślij nowy link/);
    assert.match(setup, /encodeURIComponent\(returnTo\)/);
});

test('offer send is claimed before SMTP and outbox dual-write cannot double-deliver', () => {
    const send = source('src/app/api/admin/offers/[id]/send-email/route.ts');
    const outbox = source('src/lib/messaging/outbox.ts');
    assert.ok(send.indexOf("data: { status: 'sending' }") < send.indexOf('await sendEmail('));
    assert.match(send, /currentStatus === 'sent' \|\| currentStatus === 'open'/);
    assert.match(send, /OFFER_DELIVERED_STATE_PERSIST_FAILED/);
    assert.match(send, /deliveryCompleted: true/);
    assert.match(outbox, /MESSAGE_OUTBOX_DUAL_WRITE === 'true'/);
    assert.match(outbox, /status: \{ in: \['PENDING', 'FAILED'\] \}/);
    assert.match(outbox, /data: \{ status: 'SENDING'/);
    assert.match(outbox, /error\.code === 'P2002'/);
});

test('admin incident fallback shares the local alert limiter and logout clears the HttpOnly cookie', () => {
    const incidents = source('src/lib/admin-incidents.ts');
    const logout = source('src/app/api/auth/logout/route.ts');
    const auth = source('src/context/AuthContext.tsx');
    assert.ok((incidents.match(/reserveLocalAlert\(input/g) || []).length >= 2);
    assert.match(incidents, /ADMIN_NOTIFICATION_EMAIL/);
    assert.ok(incidents.indexOf('process.env.ADMIN_EMAIL') < incidents.indexOf('process.env.ADMIN_NOTIFICATION_EMAIL'));
    assert.ok(incidents.indexOf('process.env.ADMIN_NOTIFICATION_EMAIL') < incidents.indexOf('await getAdminEmail()'));
    assert.ok(incidents.indexOf('await getAdminEmail()') < incidents.indexOf('process.env.SMTP_FROM'));
    assert.match(logout, /cookies\.set\('client_token', ''/);
    assert.match(logout, /maxAge: 0/);
    assert.match(logout, /path: '\/'/);
    assert.match(auth, /fetch\('\/api\/auth\/logout', \{ method: 'POST'/);
    assert.match(auth, /finally \{[\s\S]*clearSession\(\)/);
});

test('Stage 4 upload validation checks magic bytes and escapes untrusted email fields', () => {
    assert.equal(hasExpectedMagicBytes(Buffer.from('%PDF-1.7\n'), 'application/pdf'), true);
    assert.equal(hasExpectedMagicBytes(Buffer.from('<html>fake</html>'), 'application/pdf'), false);
    assert.equal(hasExpectedMagicBytes(Buffer.from([0xff, 0xd8, 0xff, 0x00]), 'image/jpeg'), true);
    assert.equal(hasExpectedMagicBytes(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 'image/png'), true);
    assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    assert.equal(sanitizeUploadedFilename('../skan\u0000.pdf'), '.._skan.pdf');

    for (const path of [
        'src/app/api/admin/offers/[id]/upload-pdf/route.ts',
        'src/app/api/admin/contracts/[id]/upload-pdf/route.ts',
        'src/app/api/client/portal/contracts/[id]/upload-signed/route.ts',
    ]) {
        const route = source(path);
        assert.match(route, /assertExpectedMagicBytes/);
        assert.match(route, /randomUUID\(\)/);
    }
    const signedUpload = source('src/app/api/client/portal/contracts/[id]/upload-signed/route.ts');
    assert.doesNotMatch(signedUpload, /image\/webp/);
    assert.match(signedUpload, /sanitizeUploadedFilename/);
    assert.match(signedUpload, /escapeHtml\(safeOriginalName\)/);
    assert.match(signedUpload, /tx\.crmActivity\.create/);
});

test('Stage 4 admin document writes use status and updated_at CAS with transactional offer sections', () => {
    const offer = source('src/app/api/admin/offers/[id]/route.ts');
    assert.match(offer, /prisma\.\$transaction\(async \(tx\)/);
    assert.match(offer, /where: \{ id: offerId, status: offer\.status, updated_at: offer\.updated_at \}/);
    assert.ok(offer.indexOf('tx.offer.updateMany') < offer.indexOf('tx.offerSection.deleteMany'));
    assert.doesNotMatch(offer, /\.catch\(\(\) => \[\]\)/);
    assert.match(offer, /ADMIN_OFFER_PROFILE_LOAD_FAILED/);

    const contract = source('src/app/api/admin/contracts/[id]/route.ts');
    assert.match(contract, /status: existing\.status, updated_at: existing\.updated_at/);
    const upsert = source('src/app/api/admin/contracts/route.ts');
    assert.doesNotMatch(upsert, /prisma\.contract\.upsert/);
    assert.match(upsert, /updated_at: existingContract\.updated_at/);

    for (const path of [
        'src/app/api/admin/offers/[id]/upload-pdf/route.ts',
        'src/app/api/admin/contracts/[id]/upload-pdf/route.ts',
        'src/app/api/admin/offers/[id]/save-s3/route.ts',
    ]) {
        const route = source(path);
        assert.match(route, /updated_at:/);
        assert.match(route, /deleteFromS3/);
        assert.match(route, /updated\.count !== 1/);
    }
    const clientProfile = source('src/app/api/admin/clients/[id]/route.ts');
    assert.doesNotMatch(clientProfile, /\.catch\(\(\) => \[\]\)/);
    assert.match(clientProfile, /ADMIN_CLIENT_PROFILE_LOAD_FAILED/);
});

test('Stage 4 gallery checkout is authorized, idempotent and persists PayU init failure', () => {
    const create = source('src/app/api/galleries/[accessCode]/order/route.ts');
    const status = source('src/app/api/galleries/[accessCode]/order/[orderId]/route.ts');
    const ui = source('src/app/galeria/[accessCode]/page.tsx');
    const schema = source('prisma/schema.prisma');
    const migration = source('prisma/migrations/20260823150000_add_photo_order_idempotency/migration.sql');
    assert.match(create, /authorizeIndividualGallery\(request, gallery\)/);
    assert.match(status, /authorizeIndividualGallery\(request, gallery\)/);
    assert.match(create, /idempotency-key/);
    assert.match(create, /error\?\.code !== 'P2002'/);
    assert.match(create, /data: \{ payment_status: 'failed_init' \}/);
    assert.match(ui, /'Idempotency-Key': idempotencyKey/);
    assert.match(schema, /idempotency_key String\?\s+@unique/);
    assert.match(migration, /CREATE UNIQUE INDEX "photo_orders_idempotency_key_key"/);
});

test('Stage 4 internal send-all cannot leak cookies or follow an external redirect', () => {
    const route = source('src/app/api/admin/offers/[id]/send-all/route.ts');
    assert.match(route, /new URL\([^;]+request\.url\)/);
    assert.match(route, /target\.origin !== request\.nextUrl\.origin/);
    assert.match(route, /authorization\.startsWith\('Bearer '\)/);
    assert.match(route, /redirect: 'error'/);
    assert.match(route, /controller\.abort\(\)/);
    assert.doesNotMatch(route, /Cookie:/);
    assert.doesNotMatch(route, /NEXT_PUBLIC_(BASE_URL|APP_URL)/);
});

test('Stage 4 client decision is strict, negotiation is bounded and expired UI has no actions', () => {
    const decision = source('src/app/api/client/portal/offers/[id]/route.ts');
    const ui = source('src/app/strefa-klienta/oferty/[id]/page.tsx');
    assert.match(decision, /negotiationMessage\.length > 2000/);
    assert.match(decision, /escapeHtml\(negotiationMessage\)/);
    assert.match(decision, /await logClientActivityStrict/);
    assert.match(decision, /updated_at: offer\.updated_at/);
    assert.match(ui, /isOfferMutable = isClientActionableOfferStatus\(offer\?\.status\) && !isOfferExpired/);
    assert.match(ui, /Termin ważności tej oferty minął/);
    assert.match(ui, /maxLength=\{2000\}/);
});

test('Stage 4 send routes expose the same correlation identifier in response headers', () => {
    const offerSend = source('src/app/api/admin/offers/[id]/send-email/route.ts');
    const contractSend = source('src/app/api/admin/contracts/[id]/send-email/route.ts');
    assert.match(offerSend, /req\.headers\.get\('x-correlation-id'\) \|\| randomUUID\(\)/);
    assert.match(contractSend, /req\.headers\.get\('x-correlation-id'\) \|\| randomUUID\(\)/);
    assert.match(offerSend, /jsonWithCorrelation/);
    assert.match(contractSend, /jsonWithCorrelation/);
});

test('Stage 5 offer decisions commit state and strict audit atomically with idempotent retries', () => {
    const route = source('src/app/api/client/portal/offers/[id]/route.ts');
    const patchScope = route.slice(route.indexOf('export async function PATCH'));
    const getScope = route.slice(route.indexOf('export async function GET'), route.indexOf('export async function PATCH'));
    assert.doesNotMatch(getScope, /let decisionCommitted|let committedOfferSnapshot/);
    assert.match(patchScope, /const startedAt = performance\.now\(\);\s*let decisionCommitted = false;\s*let committedOfferSnapshot:/);
    assert.ok(patchScope.indexOf('let decisionCommitted = false;') < patchScope.indexOf('try {'));
    assert.ok((route.match(/prisma\.\$transaction\(async \(tx\)/g) || []).length >= 3);
    assert.ok((route.match(/await tx\.crmActivity\.create\(/g) || []).length >= 3);
    assert.match(route, /action === 'accept' && currentStatus === 'accepted'/);
    assert.match(route, /action === 'reject' && currentStatus === 'rejected'/);
    assert.match(route, /sender: 'client', message: negotiationMessage/);
    assert.match(route, /decisionCommitted: true/);
    assert.match(route, /status: 202/);
    assert.match(route, /idempotent: true/);
    const acceptUpdate = route.indexOf('await tx.offer.updateMany(');
    const acceptAudit = route.indexOf('await tx.crmActivity.create(', acceptUpdate);
    assert.ok(acceptUpdate >= 0 && acceptAudit > acceptUpdate);
});

test('Stage 5 sending snapshots and transactional deletes are immutable', () => {
    assert.equal(isAdminImmutableOfferStatus('sending'), true);
    assert.equal(isUnsendableOfferStatus('sending'), true);
    assert.equal(isImmutableContractStatus('sending'), true);
    const offer = source('src/app/api/admin/offers/[id]/route.ts');
    const contract = source('src/app/api/admin/contracts/[id]/route.ts');
    assert.match(offer, /const deletion = await prisma\.\$transaction\(async \(tx\)/);
    assert.match(offer, /tx\.offer\.deleteMany/);
    assert.match(offer, /tx\.negotiation\.deleteMany/);
    assert.match(contract, /const deleted = await prisma\.\$transaction\(async \(tx\)/);
    assert.match(contract, /tx\.contract\.deleteMany/);
});

test('Stage 5 contract delivery has claim, private immutable PDF, outbox and partial-success reconciliation', () => {
    const send = source('src/app/api/admin/contracts/[id]/send-email/route.ts');
    const save = source('src/app/api/admin/contracts/[id]/save-s3/route.ts');
    const outbox = source('src/lib/messaging/outbox.ts');
    const claim = send.indexOf("data: { status: 'sending' }");
    const upload = send.indexOf('await uploadToS3(', claim);
    const smtp = send.indexOf('await sendEmail(', upload);
    assert.ok(claim >= 0 && upload > claim && smtp > upload);
    assert.match(send, /_wyslana_\$\{randomUUID\(\)\}\.pdf/);
    assert.match(send, /access: 'private'/);
    assert.match(send, /stageEmailOutbox/);
    assert.match(send, /completeEmailOutbox/);
    assert.match(send, /failEmailOutbox/);
    assert.match(send, /captureContractVersion/);
    assert.match(send, /CONTRACT_DELIVERED_STATE_PERSIST_FAILED/);
    assert.match(send, /deliveryCompleted: true/);
    assert.match(send, /data: \{[\s\S]*status: 'draft'/);
    assert.match(outbox, /export async function captureContractVersion/);
    assert.match(save, /randomUUID\(\)/);
    assert.match(save, /status: contract\.status, updated_at: contract\.updated_at/);
    assert.match(save, /deleteFromS3/);
});

test('Stage 5 gallery checkout binds idempotency to a cart fingerprint and never reports an unready payment as success', () => {
    const first = galleryCartFingerprint({ galleryId: 7, photoIds: [3, 1], productIds: [9] });
    const reordered = galleryCartFingerprint({ galleryId: 7, photoIds: [1, 3], productIds: [9] });
    const changed = galleryCartFingerprint({ galleryId: 7, photoIds: [1], productIds: [9] });
    assert.equal(first, reordered);
    assert.notEqual(first, changed);
    const route = source('src/app/api/galleries/[accessCode]/order/route.ts');
    const ui = source('src/app/galeria/[accessCode]/page.tsx');
    const schema = source('prisma/schema.prisma');
    assert.match(route, /existingOrder\.checkout_fingerprint !== checkoutFingerprint/);
    assert.match(route, /payment_status === 'pending' && order\.payment_url/);
    assert.match(route, /payment_status === 'failed_init'/);
    assert.match(route, /success: false/);
    assert.match(route, /payment_status: 'initializing'/);
    assert.match(route, /payment_status: 'pending'/);
    assert.match(ui, /checkoutIdempotencyKey\.current = null/);
    assert.match(schema, /checkout_fingerprint String\?/);
});

test('Stage 5 admin client list fails visibly and records a correlated incident', () => {
    const route = source('src/app/api/admin/clients/route.ts');
    assert.doesNotMatch(route, /\.catch\(\(\) => \[\]\)/);
    assert.match(route, /ADMIN_CLIENT_LIST_LOAD_FAILED/);
    assert.match(route, /jsonWithCorrelation/);
    assert.match(route, /correlation_id: correlationId/);
});

test('superseded offers stay auditable, immutable and invisible to clients', () => {
    const schema = source('prisma/schema.prisma');
    const migration = source('prisma/migrations/20260824100000_add_offer_supersession/migration.sql');
    const route = source('src/app/api/admin/offers/[id]/supersede/route.ts');
    const adminUi = source('src/app/admin/offers/[id]/page.tsx');
    const builder = source('src/components/admin/OfferBuilder.tsx');

    assert.match(schema, /superseded_by_offer_id\s+Int\?/);
    assert.match(schema, /@relation\("OfferSupersession"/);
    assert.match(migration, /FOREIGN KEY \("superseded_by_offer_id"\)[\s\S]*ON DELETE SET NULL/);
    assert.match(route, /requireAdminAuth/);
    assert.match(route, /prisma\.\$transaction\(async tx/);
    assert.match(route, /tx\.offer\.updateMany/);
    assert.match(route, /status: source\.status,[\s\S]*updated_at: expectedUpdatedAt/);
    assert.match(route, /status: 'superseded'/);
    assert.match(route, /action: 'offer_superseded'/);
    assert.doesNotMatch(route, /\.delete/);
    assert.match(adminUi, /Klient nie widzi tej oferty/);
    assert.match(builder, /Oferta zastąpiona jest tylko do odczytu/);
    assert.match(builder, /klient jej nie widzi/);
});
