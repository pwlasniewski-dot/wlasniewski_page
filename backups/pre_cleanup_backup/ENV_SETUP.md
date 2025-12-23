# Environment setup (local & Netlify)

The project now uses **Neon Postgres** as the primary database. Netlify injects the connection string as `DATABASE_URL`/`NETLIFY_DATABASE_URL`, so you no longer need any of the old CyberFolks MySQL values.

## Local development: create `.env.local`

In `fotograf1/.env.local` set:

```env
# Neon Postgres connection (e.g. copy from Netlify > Site settings > Environment variables)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require"

# JWT secret (generate at least 32 chars)
JWT_SECRET="generate_a_random_32_char_string"

# Public site URL for Next.js metadata
NEXT_PUBLIC_BASE_URL="https://wlasniewski.pl"

# Optional CMS endpoint (leave empty to fall back to static data during build)
STRAPI_API_URL=""
```

You can generate a secure secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Production (Netlify)

Netlify provides `DATABASE_URL`/`NETLIFY_DATABASE_URL` pointing at Neon. Ensure the following variables exist in the Netlify dashboard:

- `DATABASE_URL` (from Neon, usually created automatically by Netlify)
- `JWT_SECRET` (production secret)
- `NEXT_PUBLIC_BASE_URL` (e.g. `https://wlasniewski.pl`)
- `STRAPI_API_URL` (optional; leave unset to use static fallbacks)

## Querying Neon on Netlify

Use Netlify’s Neon client so connections reuse the platform-provided URL automatically:

```ts
import { neon } from '@netlify/neon';

const sql = neon(); // uses NETLIFY_DATABASE_URL / DATABASE_URL
const [post] = await sql`SELECT * FROM posts WHERE id = ${postId}`;
```

If the database is temporarily unavailable during a build, ensure any Prisma or SQL usage is wrapped in try/catch so the build can fall back gracefully (see `src/app/sitemap.ts`).
