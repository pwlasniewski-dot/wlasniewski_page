/**
 * COLD-START SIMULATION (read-only)
 * Pytanie: czy z {repo + backup DB + S3 bucket} da się odtworzyć projekt
 * na nowym GitHubie i nowej domenie?
 *
 * Sprawdza 6 warstw:
 *   1. Repo — czy w repo jest wszystko co potrzebne (package.json, prisma, next.config, netlify.toml, scripts)
 *   2. ENV — które zmienne są ABSOLUTNIE wymagane vs opcjonalne, czy któreś trzymają sekrety unikalne dla obecnej domeny
 *   3. DB — czy backup ma wszystkie 61 modeli i czy migracje Prisma są spójne
 *   4. S3 — czy bucket można zreplikować (lub wskazać nowy) bez zmian w kodzie poza ENV
 *   5. Integracje zewnętrzne — PayU, SMTP, Stripe, Auth0, GA, Meta itp. → które trzeba przerejestrować
 *   6. Hardcoded — czy w kodzie nie siedzi zaszyta domena/URL/identyfikator klienta
 *
 * Wynik: lista TODO do wykonania ręcznie + ocena RYZYKA (LOW/MED/HIGH).
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

type Finding = { layer: string; severity: 'OK' | 'INFO' | 'WARN' | 'BLOCKER'; msg: string };
const findings: Finding[] = [];
const add = (layer: string, severity: Finding['severity'], msg: string) =>
    findings.push({ layer, severity, msg });

// ========== 1. REPO ==========
function checkRepo() {
    const required = [
        'package.json',
        'next.config.mjs',
        'tsconfig.json',
        'prisma/schema.prisma',
        'tailwind.config.ts',
        'postcss.config.js',
        'netlify.toml',
        'src/app/layout.tsx',
        'scripts/robust-backup.ts',
    ];
    for (const f of required) {
        const ok = fs.existsSync(path.join(ROOT, f));
        add('REPO', ok ? 'OK' : 'BLOCKER', `${ok ? '✓' : '✗'} ${f}`);
    }

    // package.json scripts
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
        const must = ['dev', 'build', 'start'];
        for (const s of must) {
            add('REPO', pkg.scripts?.[s] ? 'OK' : 'BLOCKER', `script "${s}" ${pkg.scripts?.[s] ? '✓' : '✗'}`);
        }
        add('REPO', 'INFO', `next: ${pkg.dependencies?.next}, prisma: ${pkg.dependencies?.['@prisma/client']}`);
    } catch (e: any) {
        add('REPO', 'BLOCKER', `package.json unreadable: ${e.message}`);
    }

    // .env.example?
    const envExamplePresent =
        fs.existsSync(path.join(ROOT, '.env.example')) || fs.existsSync(path.join(ROOT, '.env.template'));
    add('REPO', envExamplePresent ? 'OK' : 'WARN', envExamplePresent ? '.env.example present' : 'NO .env.example — env list nieudokumentowane');
}

// ========== 2. ENV ==========
function checkEnv() {
    // Skanuj kod pod process.env.* — zbierz wszystkie unikalne klucze
    const used = new Set<string>();
    const re = /process\.env\.([A-Z][A-Z0-9_]+)/g;
    function walk(dir: string) {
        for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
            if (ent.name === 'node_modules' || ent.name === '.next' || ent.name === '.git' || ent.name === 'backups') continue;
            const full = path.join(dir, ent.name);
            if (ent.isDirectory()) walk(full);
            else if (/\.(ts|tsx|js|mjs)$/.test(ent.name)) {
                try {
                    const c = fs.readFileSync(full, 'utf8');
                    let m;
                    while ((m = re.exec(c))) used.add(m[1]);
                } catch {}
            }
        }
    }
    walk(path.join(ROOT, 'src'));
    walk(path.join(ROOT, 'scripts'));
    walk(path.join(ROOT, 'prisma'));

    add('ENV', 'INFO', `${used.size} unikalnych ENV var używanych w kodzie`);

    // Kategorie krytyczne
    const critical = {
        DB: ['DATABASE_URL', 'DIRECT_URL'],
        AUTH: ['JWT_SECRET', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'],
        S3: ['S3_BUCKET', 'AWS_REGION', 'MY_AWS_REGION', 'AWS_ACCESS_KEY_ID', 'MY_AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'MY_AWS_SECRET_ACCESS_KEY'],
        PAYU: ['PAYU_POS_ID', 'PAYU_CLIENT_ID', 'PAYU_CLIENT_SECRET', 'PAYU_MD5_KEY', 'PAYU_SANDBOX', 'PAYU_NOTIFY_URL'],
        SMTP: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 'EMAIL_FROM'],
        URL: ['NEXT_PUBLIC_SITE_URL', 'SITE_URL', 'BASE_URL', 'NEXT_PUBLIC_BASE_URL'],
    };
    for (const [cat, keys] of Object.entries(critical)) {
        const present = keys.filter((k) => used.has(k));
        if (present.length) add('ENV', 'INFO', `${cat}: używane ${present.join(', ')}`);
    }

    // wypisz pełną listę ENV
    const sorted = [...used].sort();
    add('ENV', 'INFO', `LISTA: ${sorted.join(' ')}`);

    // .env present locally?
    const envPath = path.join(ROOT, '.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const defined = new Set(
            content
                .split(/\r?\n/)
                .filter((l) => /^[A-Z]/.test(l) && l.includes('='))
                .map((l) => l.split('=')[0].trim())
        );
        const missing = [...used].filter((k) => !defined.has(k));
        add('ENV', missing.length === 0 ? 'OK' : 'WARN', `lokalny .env: ${defined.size} zdefiniowanych, ${missing.length} brakujących z używanych w kodzie`);
        if (missing.length) add('ENV', 'INFO', `BRAKUJE w .env: ${missing.slice(0, 30).join(', ')}${missing.length > 30 ? '…' : ''}`);
    } else {
        add('ENV', 'WARN', 'brak lokalnego .env');
    }
}

// ========== 3. DB ==========
function checkDb() {
    const schemaPath = path.join(ROOT, 'prisma', 'schema.prisma');
    if (!fs.existsSync(schemaPath)) {
        add('DB', 'BLOCKER', 'brak prisma/schema.prisma');
        return;
    }
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const modelMatches = schema.match(/^model\s+\w+/gm) || [];
    add('DB', 'OK', `prisma/schema.prisma: ${modelMatches.length} modeli`);

    // czy mamy folder prisma/migrations?
    const mig = path.join(ROOT, 'prisma', 'migrations');
    if (fs.existsSync(mig)) {
        const dirs = fs.readdirSync(mig).filter((n) => fs.statSync(path.join(mig, n)).isDirectory());
        add('DB', 'OK', `prisma/migrations: ${dirs.length} migracji`);
    } else {
        add('DB', 'WARN', 'brak prisma/migrations — schemat odtwarzalny tylko przez `prisma db push` (utrata historii)');
    }

    // znajdź najświeższy backup
    const backupsDir = path.join(ROOT, 'backups');
    if (!fs.existsSync(backupsDir)) {
        add('DB', 'BLOCKER', 'brak folderu backups/');
        return;
    }
    const prodBackups = fs
        .readdirSync(backupsDir)
        .filter((n) => n.startsWith('PROD-FULL-'))
        .sort()
        .reverse();
    if (!prodBackups.length) {
        add('DB', 'BLOCKER', 'brak żadnego PROD-FULL-* backupu');
        return;
    }
    const latest = prodBackups[0];
    const manifestPath = path.join(backupsDir, latest, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
        add('DB', 'WARN', `${latest}: brak manifest.json`);
        return;
    }
    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    add('DB', 'OK', `najświeższy backup: ${latest}`);
    add('DB', 'OK', `   modele: ${m.modelsBackedUp}/${m.modelsRequested}, rekordy: ${m.totalRecords}, failures: ${m.failures?.length || 0}`);
    if (m.modelsBackedUp !== modelMatches.length)
        add('DB', 'WARN', `niezgodność: schemat ma ${modelMatches.length} modeli a backup ${m.modelsBackedUp}`);

    // czy istnieje skrypt restore?
    const restoreScript = ['scripts/restore-from-backup.ts', 'scripts/restore.ts', 'scripts/restore-prod-backup.ts'].find(
        (p) => fs.existsSync(path.join(ROOT, p))
    );
    add('DB', restoreScript ? 'OK' : 'BLOCKER', restoreScript ? `restore script: ${restoreScript}` : 'brak skryptu restore — backup jest, ale brak narzędzia do odtworzenia');
}

// ========== 4. S3 ==========
function checkS3() {
    add('S3', 'INFO', 'bucket name (S3_BUCKET) jest w ENV — zmiana = nowy bucket, plus migracja istniejących obiektów (aws s3 sync)');
    // czy w kodzie jest bucket hardcoded?
    let hits = 0;
    function walk(dir: string) {
        for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
            if (ent.name === 'node_modules' || ent.name === '.next' || ent.name === '.git' || ent.name === 'backups') continue;
            const full = path.join(dir, ent.name);
            if (ent.isDirectory()) walk(full);
            else if (/\.(ts|tsx|js|mjs)$/.test(ent.name)) {
                try {
                    const c = fs.readFileSync(full, 'utf8');
                    if (c.includes('wlasniewski-photo-storage')) hits++;
                } catch {}
            }
        }
    }
    walk(path.join(ROOT, 'src'));
    walk(path.join(ROOT, 'scripts'));
    add('S3', hits === 0 ? 'OK' : 'WARN', `'wlasniewski-photo-storage' hardcoded w ${hits} plikach (ideał = tylko fallback w 1 helperze)`);
}

// ========== 5. INTEGRACJE ZEWNĘTRZNE ==========
function checkExternal() {
    const external = [
        { name: 'PayU', needed: 'nowe credentiale POS+klient (sandbox + produkcja), nowy NOTIFY_URL=https://NOWA-DOMENA/api/payu/notify', risk: 'HIGH' },
        { name: 'SMTP (poczta)', needed: 'nowe DNS: SPF/DKIM/DMARC dla nowej domeny + skonfigurować provider (Resend/SES/Postmark)', risk: 'HIGH' },
        { name: 'DNS / domena', needed: 'A/AAAA na Netlify, MX dla maila, TXT dla weryfikacji', risk: 'MED' },
        { name: 'Netlify', needed: 'nowy site, podpiąć repo, ustawić wszystkie ENV, custom domain', risk: 'LOW' },
        { name: 'GitHub', needed: 'nowy repo, push origin, ewentualnie GitHub Actions secrets', risk: 'LOW' },
        { name: 'Neon (Postgres)', needed: 'nowa baza lub branch, wykonać `prisma migrate deploy` + restore z backupu', risk: 'LOW' },
        { name: 'GA4 / Meta Pixel', needed: 'nowe property/pixel ID jeżeli zmienia się brand', risk: 'LOW' },
    ];
    for (const e of external) add('EXT', 'INFO', `${e.name} [${e.risk}]: ${e.needed}`);
}

// ========== 6. HARDCODED ==========
function checkHardcoded() {
    const patterns = [
        { name: 'wlasniewski.pl', re: /wlasniewski\.pl/g },
        { name: 'wlasniewski.com', re: /wlasniewski\.com/g },
        { name: 'localhost:3000 (poza dev)', re: /localhost:3000/g },
    ];
    const counts: Record<string, number> = {};
    function walk(dir: string) {
        for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
            if (ent.name === 'node_modules' || ent.name === '.next' || ent.name === '.git' || ent.name === 'backups') continue;
            const full = path.join(dir, ent.name);
            if (ent.isDirectory()) walk(full);
            else if (/\.(ts|tsx|js|mjs|json|md)$/.test(ent.name)) {
                try {
                    const c = fs.readFileSync(full, 'utf8');
                    for (const p of patterns) {
                        const m = c.match(p.re);
                        if (m) counts[p.name] = (counts[p.name] || 0) + m.length;
                    }
                } catch {}
            }
        }
    }
    walk(path.join(ROOT, 'src'));
    for (const [k, v] of Object.entries(counts))
        add('HARDCODE', v > 5 ? 'WARN' : 'INFO', `'${k}' x${v} w src/ — przy nowej domenie do podmiany`);
    if (Object.keys(counts).length === 0) add('HARDCODE', 'OK', 'brak zaszytych domen w src/');
}

// ========== RUN ==========
function main() {
    console.log('\n🧪 COLD-START SIMULATION (czy postawimy projekt od zera na nowym GitHub + nowa domena?)\n');
    checkRepo();
    checkEnv();
    checkDb();
    checkS3();
    checkExternal();
    checkHardcoded();

    console.log('\n========== RAPORT ==========\n');
    const groups = ['REPO', 'ENV', 'DB', 'S3', 'EXT', 'HARDCODE'];
    for (const g of groups) {
        console.log(`--- ${g} ---`);
        for (const f of findings.filter((x) => x.layer === g)) {
            const icon = f.severity === 'OK' ? '✓' : f.severity === 'INFO' ? 'ℹ' : f.severity === 'WARN' ? '⚠' : '🛑';
            console.log(`  ${icon} ${f.msg}`);
        }
        console.log('');
    }

    const blockers = findings.filter((f) => f.severity === 'BLOCKER').length;
    const warns = findings.filter((f) => f.severity === 'WARN').length;
    console.log(`\n🎯 WERDYKT: ${blockers} BLOCKER, ${warns} WARN`);
    if (blockers === 0) console.log('   ZIELONO — przy posiadaniu repo + backup + S3 + listy ENV/integracji DA SIĘ postawić od zera.');
    else console.log('   CZERWONO — są BLOCKERY do uzupełnienia w repo zanim cold-start będzie pewny.');
}

main();
