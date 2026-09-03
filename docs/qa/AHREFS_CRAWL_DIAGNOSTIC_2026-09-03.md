# Ahrefs crawl diagnostic — 2026-09-03

## Scope

Read-only external test of `wlasniewski.pl` from a GitHub-hosted runner. No production code, database data, bookings, prices, or Netlify configuration were changed.

User agents tested: AhrefsBot, Googlebot, Bingbot, ChatGPT-User and a normal browser user agent. Entry points tested repeatedly: apex HTTP/HTTPS, `www`, `/robots.txt`, `/sitemap.xml`, and `/`.

## Findings

### 1. DNS, TLS and redirects

- Apex and `www` resolved consistently to Netlify addresses `18.208.88.157` and `98.84.224.111` through both Cloudflare DNS and Google DNS.
- TLS certificate was valid for `wlasniewski.pl` and `*.wlasniewski.pl`.
- `http://` and `www` redirected once to canonical `https://wlasniewski.pl/`.

### 2. robots.txt

- AhrefsBot: 8/8 requests returned HTTP 200.
- AhrefsBot TTFB: minimum 0.143 s, median 0.170 s, maximum 0.397 s.
- The file contains `User-agent: *`, `Allow: /`, blocks only private/internal areas, and points to `https://wlasniewski.pl/sitemap.xml`.
- Conclusion: `robots.txt` is currently correct, cached, and not the active failure point.

### 3. Intermittent latency at crawler entry points

- AhrefsBot `/sitemap.xml`: one of eight requests took 19.545 s TTFB; the other requests were mostly 0.254–0.785 s.
- Normal browser `/sitemap.xml`: one request took 20.905 s TTFB.
- Googlebot through `www` `/sitemap.xml`: one request took 17.597 s TTFB.
- A separate short probe reproduced an AhrefsBot homepage response with 18.311 s TTFB and 20.211 s total time; adjacent Googlebot and browser requests completed in roughly 0.2–0.5 s.
- All delayed requests eventually returned HTTP 200. This means the issue is intermittent server/runtime latency, not a permanent block and not specific to AhrefsBot.

### 4. Sitemap content crawl

- Live sitemap contained 44 unique entries.
- 42 entries returned HTTP 200 to AhrefsBot.
- Two entries were malformed because they contained literal spaces in the category segment:
  - `https://wlasniewski.pl/portfolio/Sesja Rodzinna/sesja-rodzinna`
  - `https://wlasniewski.pl/portfolio/Sesja Rodzinna/park-miejski-w-toruniu`
- These two entries are a real sitemap correctness defect, but by themselves do not explain a crawl with zero analyzed URLs because the remaining 42 entries were reachable.

## Technical cause indicated by the repository

- `/robots.txt` is a static public file with a dedicated CDN cache rule.
- `/sitemap.xml` is generated dynamically by Next.js and queries multiple database tables on every uncached regeneration. The live response is `Cache-Control: public,max-age=0,must-revalidate`; there is no dedicated sitemap cache rule in `netlify.toml`.
- The homepage is server-rendered and reads several CMS, testimonial, pricing, promotion, guide, and setting records. Its observed response header is `Cache-Control: private,no-cache,no-store,max-age=0,must-revalidate`.

## Decision

The Ahrefs report with `0 internal URLs` is not a real Health Score collapse. It is consistent with an entry request exceeding the crawler's patience during an intermittent 18–21 second server/runtime pause.

Priority fix:

1. Make the B2C sitemap independent of the live runtime/database path or give it a long-lived CDN cache with stale-while-revalidate.
2. Encode or normalize portfolio category path segments so the sitemap never contains literal spaces.
3. After that, rerun Ahrefs Site Audit. Only then consider homepage cache/runtime optimization as the next, separate task.
