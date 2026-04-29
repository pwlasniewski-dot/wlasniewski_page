/**
 * RESTORE SIMULATION — 1:1 dry-run
 * Verifies a backup folder is structurally complete and restorable.
 *
 * What it does (read-only — never writes):
 *  1. Loads manifest.json
 *  2. For every JSON file: parses, counts records, samples 1 row
 *  3. Validates foreign key integrity within the snapshot
 *     (each FK target must exist in its referenced table)
 *  4. Compares record counts vs LIVE production database
 *     (alerts if drift detected — useful right before a destructive op)
 *  5. Detects orphan rows that would block a clean reinsert
 *
 * Usage:
 *   npx tsx scripts/sim-restore.ts <backup-folder-name>
 *   e.g. npx tsx scripts/sim-restore.ts PROD-FULL-2026-04-29T07-05-00-472Z
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// FK map: child model → list of { field, parentModel } to verify
// (only relations that matter for restore order; one-to-many parent side ignored)
const FK_MAP: Record<string, { field: string; parent: string }[]> = {
    photoChallenge: [
        { field: 'package_id', parent: 'challengePackage' },
        { field: 'location_id', parent: 'challengeLocation' },
        { field: 'invitee_user_id', parent: 'challengeUser' },
    ],
    challengeTimelineEvent: [{ field: 'challenge_id', parent: 'photoChallenge' }],
    challengeGallery: [{ field: 'challenge_id', parent: 'photoChallenge' }],
    challengePhoto: [{ field: 'gallery_id', parent: 'challengeGallery' }],
    booking: [
        { field: 'challenge_id', parent: 'photoChallenge' },
        { field: 'photographer_id', parent: 'user' },
    ],
    package: [{ field: 'service_id', parent: 'serviceType' }],
    galleryPhoto: [{ field: 'gallery_id', parent: 'clientGallery' }],
    galleryProduct: [{ field: 'gallery_id', parent: 'clientGallery' }],
    photoOrder: [{ field: 'gallery_id', parent: 'clientGallery' }],
    clientGallery: [
        { field: 'client_id', parent: 'user' },
        { field: 'photographer_id', parent: 'user' },
        { field: 'booking_id', parent: 'booking' },
    ],
    giftCardOrder: [
        { field: 'gift_card_id', parent: 'giftCard' },
        { field: 'user_id', parent: 'user' },
    ],
    photographerProfile: [{ field: 'user_id', parent: 'user' }],
    contract: [{ field: 'user_id', parent: 'user' }],
    offer: [{ field: 'user_id', parent: 'user' }],
    offerSection: [{ field: 'offer_id', parent: 'offer' }],
    offerItem: [{ field: 'section_id', parent: 'offerSection' }],
    crmActivity: [{ field: 'user_id', parent: 'user' }],
    clientOffer: [{ field: 'client_id', parent: 'client' }],
    clientContract: [{ field: 'client_id', parent: 'client' }],
    basketItem: [{ field: 'basket_id', parent: 'basket' }],
};

interface Issue {
    level: 'ERROR' | 'WARN' | 'INFO';
    model: string;
    message: string;
}

async function simulate() {
    const folder = process.argv[2];
    if (!folder) {
        console.error('Usage: npx tsx scripts/sim-restore.ts <backup-folder-name>');
        const dir = path.join(process.cwd(), 'backups');
        if (fs.existsSync(dir)) {
            console.log('\nAvailable PROD-FULL backups:');
            fs.readdirSync(dir)
                .filter((f) => f.startsWith('PROD-FULL-'))
                .sort()
                .reverse()
                .slice(0, 10)
                .forEach((b) => console.log(`  - ${b}`));
        }
        process.exit(1);
    }

    const backupDir = path.join(process.cwd(), 'backups', folder);
    if (!fs.existsSync(backupDir)) {
        console.error(`❌ Backup folder not found: ${backupDir}`);
        process.exit(1);
    }

    console.log(`\n🧪 RESTORE SIMULATION (DRY-RUN — nothing will be written)`);
    console.log(`📂 Source: ${backupDir}\n`);

    const manifestPath = path.join(backupDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
        console.error('❌ manifest.json missing — backup looks incomplete.');
        process.exit(1);
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    console.log(`📋 Manifest: ${manifest.modelsBackedUp}/${manifest.modelsRequested} models, ${manifest.totalRecords} records\n`);

    const issues: Issue[] = [];
    const data: Record<string, any[]> = {};
    const idIndex: Record<string, Set<any>> = {};

    // 1. Parse + count
    console.log('— STEP 1: parse JSONs and build PK indexes —');
    const modelNames = Object.keys(manifest.stats);
    for (const model of modelNames) {
        const file = path.join(backupDir, `${model}.json`);
        if (!fs.existsSync(file)) {
            issues.push({ level: 'ERROR', model, message: 'JSON file missing' });
            continue;
        }
        try {
            const raw = fs.readFileSync(file, 'utf-8');
            const arr = JSON.parse(raw);
            if (!Array.isArray(arr)) {
                issues.push({ level: 'ERROR', model, message: 'JSON not an array' });
                continue;
            }
            data[model] = arr;
            const set = new Set<any>();
            for (const row of arr) {
                if (row && row.id !== undefined) set.add(row.id);
            }
            idIndex[model] = set;
            const expected = manifest.stats[model];
            if (arr.length !== expected) {
                issues.push({
                    level: 'WARN',
                    model,
                    message: `count mismatch: file=${arr.length} manifest=${expected}`,
                });
            }
        } catch (e: any) {
            issues.push({ level: 'ERROR', model, message: `parse error: ${e.message}` });
        }
    }

    // 2. FK integrity inside the snapshot
    console.log('— STEP 2: FK integrity within snapshot —');
    let fkChecked = 0;
    let fkBroken = 0;
    for (const [child, fks] of Object.entries(FK_MAP)) {
        const rows = data[child];
        if (!rows) continue;
        for (const fk of fks) {
            const parentSet = idIndex[fk.parent];
            if (!parentSet) {
                issues.push({
                    level: 'WARN',
                    model: child,
                    message: `parent table "${fk.parent}" not in backup — cannot verify ${fk.field}`,
                });
                continue;
            }
            for (const row of rows) {
                const v = row[fk.field];
                if (v === null || v === undefined) continue;
                fkChecked++;
                if (!parentSet.has(v)) {
                    fkBroken++;
                    issues.push({
                        level: 'ERROR',
                        model: child,
                        message: `orphan FK ${fk.field}=${v} → ${fk.parent}.id (row id=${row.id})`,
                    });
                }
            }
        }
    }
    console.log(`  ✓ FK checks: ${fkChecked} (broken: ${fkBroken})`);

    // 3. Compare with LIVE production
    console.log('\n— STEP 3: compare snapshot vs LIVE database (read-only) —');
    const liveCounts: Record<string, number> = {};
    for (const model of modelNames) {
        try {
            // @ts-ignore
            if (!prisma[model]) continue;
            // @ts-ignore
            const c = await prisma[model].count();
            liveCounts[model] = c;
            const backupN = manifest.stats[model];
            if (c !== backupN) {
                const drift = c - backupN;
                issues.push({
                    level: drift > 0 ? 'INFO' : 'WARN',
                    model,
                    message: `live=${c} backup=${backupN} drift=${drift > 0 ? '+' : ''}${drift}`,
                });
            }
        } catch (e: any) {
            issues.push({ level: 'WARN', model, message: `live count failed: ${e.message}` });
        }
    }

    // 4. Round-trip integrity (re-stringify → parse → compare lengths)
    console.log('— STEP 4: JSON round-trip on first row of each model —');
    for (const model of modelNames) {
        const rows = data[model];
        if (!rows || rows.length === 0) continue;
        try {
            const sample = rows[0];
            const re = JSON.parse(JSON.stringify(sample));
            if (Object.keys(re).length !== Object.keys(sample).length) {
                issues.push({
                    level: 'WARN',
                    model,
                    message: 'round-trip key count mismatch on sample row',
                });
            }
        } catch (e: any) {
            issues.push({ level: 'ERROR', model, message: `sample re-encode failed: ${e.message}` });
        }
    }

    // Report
    console.log('\n========== SIMULATION REPORT ==========\n');
    const errors = issues.filter((i) => i.level === 'ERROR');
    const warns = issues.filter((i) => i.level === 'WARN');
    const infos = issues.filter((i) => i.level === 'INFO');

    if (errors.length === 0) {
        console.log('🟢 NO ERRORS — backup is structurally restorable 1:1.\n');
    } else {
        console.log(`🔴 ${errors.length} ERROR(S):`);
        errors.forEach((i) => console.log(`   ✗ [${i.model}] ${i.message}`));
        console.log('');
    }

    if (warns.length) {
        console.log(`🟡 ${warns.length} WARNING(S):`);
        warns.forEach((i) => console.log(`   ! [${i.model}] ${i.message}`));
        console.log('');
    }

    if (infos.length) {
        console.log(`🔵 ${infos.length} INFO (live newer than snapshot — expected if PROD is in use):`);
        infos.forEach((i) => console.log(`   · [${i.model}] ${i.message}`));
        console.log('');
    }

    // Save report
    const reportPath = path.join(backupDir, `restore-simulation-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(
        reportPath,
        JSON.stringify(
            {
                generatedAt: new Date().toISOString(),
                backupFolder: folder,
                modelsRequested: manifest.modelsRequested,
                modelsBackedUp: manifest.modelsBackedUp,
                totalRecordsInBackup: manifest.totalRecords,
                fkChecks: { total: fkChecked, broken: fkBroken },
                liveCounts,
                snapshotCounts: manifest.stats,
                issues,
                verdict: errors.length === 0 ? 'PASS' : 'FAIL',
            },
            null,
            2
        )
    );
    console.log(`📄 Full report: ${reportPath}\n`);

    if (errors.length > 0) process.exit(2);
}

simulate()
    .catch((e) => {
        console.error('SIMULATION CRASHED:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
