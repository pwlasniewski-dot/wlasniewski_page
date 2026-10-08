# iPhone photo upload

`/sklep/personalizacja` accepts JPEG, PNG, HEIC and HEIF. File contents determine
the format, including files with an empty MIME type or an iPhone-provided JPEG
whose name still ends in HEIC. The original HEIF stays on the device; a lazily
loaded, locally bundled `heic-to/csp` decoder worker creates JPEG at quality 95.
HEIF spatial extents are checked before decoding. Input and output must fit the
20 MB limit; decoded images must satisfy the existing 100 px / 60 MP limits.
No conversion service receives the photo. The existing private upload ticket,
SHA-256, server normalization, ownership and quota checks remain in force.

Conversion lasting over 90 seconds shows a refresh instruction and prevents a
second HEIF conversion in that page session. The decoder library cannot terminate
its shared worker via its public API; refresh releases it. JPEG/PNG remain usable.

## Availability

The administrator already controls personalization under the shared public shop
offer settings (`personalizationEnabled`). The shop must also be enabled.
`SHOP_UPLOADS_PRIVATE_STORAGE_CONFIRMED=true` is a separate deployment gate;
it must only be set after verifying real bucket privacy and browser PUT CORS.
This change does not enable either gate and does not enable live supplier orders.
A failed catalog read displays its error instead of a misleading disabled message.

## Verification

`npm run test:prodigi-personalization` covers actual HEIC decoding (including
HEIF irot pixel orientation), JPEG/PNG normalization, file validation, quotas,
owner isolation, private upload completion and CMS/UI order-flow regression tests.
The decoder fixture test uses a VM worker adapter; it is not a physical iPhone
or deployed Netlify/S3 integration test. Verify the latter on Deploy Preview
with private storage configured before enabling the public feature.
