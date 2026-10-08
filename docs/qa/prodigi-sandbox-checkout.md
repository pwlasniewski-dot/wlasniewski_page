# Isolated sandbox checkout — 2026-10-04

QA only: PR99, branch feat/prodigi-shop-fulfillment, Neon br-autumn-thunder-aey4bqrx.

Five active fixtures (ids 5–9) use verified sandbox variants and official Prodigi product photography. Prices are test amounts, not approved retail pricing. Fixture script is idempotent and must never run on production.

Checkout requires an isolated QA database, sandbox PayU with notification origin matching the preview, and explicit per-product sandboxOrdersEnabled. Live qualification and ordering flags remain false for sandbox. Server records checkoutEnvironment=sandbox; fulfillment rejects copied production orders and uses sandbox quote/create/status APIs only. HQ copies live under protected shop-personalization/production/, never under temporary staging. Existing paid ledger, refund, proof approval, fingerprint and CAS protections remain required.

Guest product preview opens in a modal at the selected product without scrolling to another section. JPEG/PNG/HEIC preview is local-only, requires no account, and accepts low-resolution photos; final original and resolution validation belong to the explicit ordering phase. The selected product and ordering phase survive login through URL intent.

Realization continues through the existing admin order: prepare, inspect proof, approve, submit. It is not automatic on payment. Product preview is an accurate proportional fit, not a photorealistic mockup or crop editor.

Validation: actual module tests for checkout/server/PayU isolation, preflight, release, callback, inline UI, order-origin; DB/provider/S3 are mocked in local tests. QA database fixture and image links were separately verified by readback. No real end-to-end payment or production fulfillment claimed.

Remaining external blocker: automatic approval review rejected setting the official public PayU sandbox POS credentials in the QA settings row, requiring explicit user approval of credentials and exact target. No credential mutation occurred. Existing QA payment environment is still secure, so checkout correctly stays disabled. Browser observation is separately blocked by native credential runtime state.

Photography sources:
- https://www.prodigi.com/products/prints-and-posters/art-prints/enhanced-matte-art/
- https://www.prodigi.com/products/wall-art/canvas/stretched-canvas/stretched-canvas/
