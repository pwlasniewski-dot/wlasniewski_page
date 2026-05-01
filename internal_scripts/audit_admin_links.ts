/**
 * Audyt: sprawdza czy WSZYSTKIE statyczne href="/admin/..." (oraz href="/foto-match/...")
 * uzyte w komponentach panelu prowadza do istniejacej strony page.tsx (lub route.ts dla API).
 *
 * Wykrywa "klikam i 404" zanim klient sie wkurzy.
 *
 * Uruchomienie:  npx tsx internal_scripts/audit_admin_links.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, 'src', 'app');

type Issue = { file: string; href: string; reason: string };
const issues: Issue[] = [];
const okLinks = new Set<string>();

function walk(dir: string, ext: RegExp, out: string[] = []): string[] {
    if (!fs.existsSync(dir)) return out;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, ext, out);
        else if (ext.test(entry.name)) out.push(full);
    }
    return out;
}

/**
 * Czy istnieje route dla danej sciezki URL.
 * Akceptuje: /admin/foto-match/profiles → src/app/admin/foto-match/profiles/page.tsx
 * Tez segmenty dynamiczne: /admin/foto/123 ⇒ src/app/admin/foto/[id]/page.tsx
 */
function routeExists(urlPath: string): boolean {
    // Strip query string
    const clean = urlPath.split('?')[0].split('#')[0];
    const segments = clean.split('/').filter(Boolean);
    let dir = APP_DIR;
    for (const seg of segments) {
        const direct = path.join(dir, seg);
        if (fs.existsSync(direct) && fs.statSync(direct).isDirectory()) {
            dir = direct;
            continue;
        }
        // Sprobuj segment dynamiczny [xxx]
        const children = fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : [];
        const dynamic = children.find((c) => c.isDirectory() && c.name.startsWith('[') && c.name.endsWith(']'));
        if (dynamic) {
            dir = path.join(dir, dynamic.name);
            continue;
        }
        // Sprobuj catch-all [...slug]
        const catchAll = children.find((c) => c.isDirectory() && c.name.startsWith('[...'));
        if (catchAll) return true;
        return false;
    }
    return fs.existsSync(path.join(dir, 'page.tsx'))
        || fs.existsSync(path.join(dir, 'page.jsx'))
        || fs.existsSync(path.join(dir, 'page.ts'))
        || fs.existsSync(path.join(dir, 'page.js'));
}

const files = walk(APP_DIR, /\.(tsx|jsx)$/);
const HREF_RE = /\bhref\s*=\s*["'`]([^"'`]+)["'`]/g;
const HREF_TEMPLATE_RE = /\bhref\s*=\s*\{`([^`${}]+)`\}/g;

const SCOPES = ['/admin/', '/foto-match/', '/strefa-klienta/'];

for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const matches: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = HREF_RE.exec(content)) !== null) matches.push(m[1]);
    while ((m = HREF_TEMPLATE_RE.exec(content)) !== null) matches.push(m[1]);

    for (const href of matches) {
        if (!href.startsWith('/')) continue;
        if (!SCOPES.some((s) => href.startsWith(s) || href === s.slice(0, -1))) continue;
        // Skip jesli href zawiera ${...} (dynamic value) — nie jestesmy w stanie zwalidowac runtime'owo
        if (href.includes('${')) continue;
        if (okLinks.has(href)) continue;

        if (!routeExists(href)) {
            issues.push({
                file: path.relative(ROOT, file),
                href,
                reason: 'Brak page.tsx dla tej sciezki — klikniecie w UI = 404.',
            });
        } else {
            okLinks.add(href);
        }
    }
}

console.log('='.repeat(80));
console.log(`AUDYT LINKOW UI — przeskanowano ${files.length} plikow`);
console.log('='.repeat(80));

if (issues.length === 0) {
    console.log('✓ Wszystkie linki w UI prowadza do istniejacych stron.');
    process.exit(0);
}

const grouped = new Map<string, Issue[]>();
for (const iss of issues) {
    if (!grouped.has(iss.href)) grouped.set(iss.href, []);
    grouped.get(iss.href)!.push(iss);
}

console.log(`\n💣 ZNALEZIONO ${grouped.size} ZEPSUTYCH LINKOW (${issues.length} wystapien):\n`);
for (const [href, list] of grouped) {
    console.log(`  ❌ ${href}`);
    console.log(`     Powod: ${list[0].reason}`);
    console.log(`     Wystepuje w:`);
    for (const it of list) console.log(`       - ${it.file}`);
    console.log('');
}

process.exit(1);
