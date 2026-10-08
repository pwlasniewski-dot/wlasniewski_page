# Synthetic HEIC fixtures

These fixtures contain no personal photographs. `portrait.heic` is a 160×240
blue image with a red 80×120 top-left rectangle, encoded locally with Pillow
and pillow-heif at quality 90. `rotated.heic` adds an essential `irot=1`
(counterclockwise 90°) property, its `ipma` association, and adjusts container
sizes and the `iloc` payload offset. The expected display is 240×160 with the
red rectangle at bottom-left. Both fixtures are freely reusable project test data.

The real-decode test executes the installed heic-to CSP decoder in a VM worker
adapter. Sharp substitutes only the browser canvas JPEG encoding. It checks
actual decoded colours and rotated dimensions. It does not simulate Safari,
a real iPhone file picker, mobile memory pressure, S3 CORS, or network uploads.
