# Guest product checkout — 2026-10-04

The selected JPEG/PNG/converted HEIC File is retained in memory and transferred once to the existing upload pipeline after the explicit order action. No customer account or login is required. Going back keeps the mounted cart and uploaded photo; low-resolution preview remains available while a final original is checked before upload. Payment return restores the session without a File.

Anonymous ownership uses a random 256-bit HttpOnly/SameSite=Lax capability cookie (Secure in production), with only its hash stored and a seven-day expiry. No User row is created. SHOP_UPLOAD_GUEST galleries have null client_id and are authorized by exact guest-to-gallery marker, never by matching email or another null owner. Upload quotas, private S3, checksums, server normalization and replay guards remain. Session issuance has a durable advisory-locked five-per-hour limiter keyed by IP hash, plus the existing process limiter. Guest checkout requires trusted origin and bounded JSON.

Checkout snapshots carry guestOwnerId. They cannot be claimed by an account merely sharing the delivery email. PayU returns to the same product/modal. Confirmed payment generates a separately signed, 90-day read-only link to that one order, independent of the seven-day upload cookie. Receipt pages prohibit indexing, caching, referrer transmission, framing, scripts and external resource loads. They never grant photo, gallery, upload or account access.

Canvas appearance uses SKU physical dimensions and explicit variant edge/wrap data. Known black 38 mm sides are shown proportionally in an angled view. Fine Art is a flat sheet without an invented frame. Original supplier photos remain accessible for comparison. This remains a dimensional simulation, not a supplier-rendered photorealistic mockup; no crop editing is claimed.

QA permits explicit sandbox products in the test cart even while PayU setup is unavailable. Final payment remains disabled and the server continues to refuse non-sandbox PayU. Production release gates are unchanged. PayU credential mutation still awaits explicit user approval from the prior automatic-review rejection.

Validation uses real modules with mocked provider/DB/S3 boundaries: guest mint/expiry/CSRF/IDOR/quota and concurrent issuance, upload ownership and normalization, retained-file UX/no login/no duplicate upload, payment return, metadata linkage, physical model and read-only receipt security. No physical iPhone or real payment E2E claim.

Retention limitation before production release: session expiry does not delete final image objects or inactive guest records; automated cleanup of abandoned guest assets remains to be scheduled with a paid-order exclusion. Existing staging lifecycle remains separate.
