# Product-first own-photo preview — 2026-10-04

Goal: choose a supported Prodigi product in the existing storefront, add a private photo and see its fit without leaving the shop for a disconnected upload page.

Implementation uses the existing catalog, CMS, private upload session and GalleryShoppingPanel. Only validated single-photo Prodigi products expose the personalization action; public JSON projects an eligibility boolean, not supplier configuration. Product choice survives login and refresh. HEIC conversion and signed S3 upload remain unchanged. No browser-only crop is introduced: preview continues to match the backend fitPrintArea contract.

QA setup: existing isolated Neon branch br-autumn-thunder-aey4bqrx; scripts/qa/prodigi-preview-fixture.sql created display-only product 5 (GLOBAL-FAP-11X14, EMA, 3307×4192 recommended pixels) from recorded real sandbox audit. Price 79 PLN is test data, not production pricing. Sandbox products are visible only on isolated QA with ordersEnabled=false/liveQualified=false. Cart/order production release guards remain intact. No production catalog or payment configuration changed.

Earlier user-driven live upload is confirmed in QA: photo3057, 960×640, upload state complete, thumbnail record present. This does not establish HEIC conversion because input format was not observed. The photo is too small for the QA print product and must show a resolution warning.

Preview is schematic and shows the complete image centered in the authoritative print area. It is not a Prodigi photorealistic mockup; frame finish, canvas texture/wrap and exact physical appearance are not represented. There is no documented public mockup endpoint in the consulted Print API reference; official product preview documentation describes the dashboard image editor.

Full browser regression remains pending: cloud browser stopped with native credential protection while choosing a file. Do not describe React mocks as a live browser/S3/PayU end-to-end pass. PayU sandbox is still unconfigured in this QA branch (secure configuration remains blocked by QA checkout guard).

Verification: actual React storefront, upload/purchase return, inline selected-product preview and independent store/login/null-catalog tests pass. Domain tests confirm unsupported families reject, sandbox cannot appear outside isolated QA, and live release gates remain required. Existing visibility and upload HTTP auth/origin/rate/private-header suites pass. Full TypeScript check was attempted once and aborted on heap exhaustion; no global typecheck pass is claimed. Independent reviewer found and confirmed fixes for lost URL product selection and payment-status notice overwrite.
