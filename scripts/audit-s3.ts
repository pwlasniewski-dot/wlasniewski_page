/**
 * S3 AUDIT — read-only
 * Verifies that S3 bucket is reachable AND that DB media references
 * are coherent with what actually sits on S3.
 *
 * Reports:
 *   - bucket reachable? region? object count? total bytes?
 *   - DB media records: how many, sample URL pattern, count by extension
 *   - mismatch heuristics (DB rows whose URL host doesn't match bucket)
 *
 * Does NOT delete or upload anything.
 */

import { S3Client, ListObjectsV2Command, HeadBucketCommand } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function pickS3Config() {
    const accessKeyId = (process.env.MY_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '').trim();
    const secretAccessKey = (process.env.MY_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '').trim();
    const region = (process.env.MY_AWS_REGION || process.env.AWS_REGION || process.env.S3_REGION || 'eu-central-1').trim();
    const bucket = (process.env.S3_BUCKET || 'wlasniewski-photo-storage').trim();
    return { accessKeyId, secretAccessKey, region, bucket };
}

async function audit() {
    console.log('\n🔍 S3 AUDIT (read-only)\n');

    const cfg = pickS3Config();
    console.log(`  bucket: ${cfg.bucket}`);
    console.log(`  region: ${cfg.region}`);
    console.log(`  access key set: ${cfg.accessKeyId ? 'YES' : 'NO'}`);
    console.log(`  secret set:     ${cfg.secretAccessKey ? 'YES' : 'NO'}\n`);

    if (!cfg.accessKeyId || !cfg.secretAccessKey) {
        console.error('❌ S3 credentials missing in environment. Aborting S3 part.');
        await dbPart(cfg);
        return;
    }

    const s3 = new S3Client({
        region: cfg.region,
        credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    });

    // Reach
    try {
        await s3.send(new HeadBucketCommand({ Bucket: cfg.bucket }));
        console.log('  ✓ bucket reachable\n');
    } catch (e: any) {
        console.error(`  ✗ bucket NOT reachable: ${e.message || e}\n`);
        await dbPart(cfg);
        return;
    }

    // List (paged)
    let totalObjects = 0;
    let totalBytes = 0;
    const extCount: Record<string, number> = {};
    const prefixCount: Record<string, number> = {};
    let token: string | undefined;
    do {
        const res: any = await s3.send(
            new ListObjectsV2Command({ Bucket: cfg.bucket, ContinuationToken: token, MaxKeys: 1000 })
        );
        for (const obj of res.Contents || []) {
            totalObjects++;
            totalBytes += obj.Size || 0;
            const key = obj.Key || '';
            const ext = (key.match(/\.([a-zA-Z0-9]{2,5})$/)?.[1] || 'noext').toLowerCase();
            extCount[ext] = (extCount[ext] || 0) + 1;
            const top = key.split('/')[0] || '(root)';
            prefixCount[top] = (prefixCount[top] || 0) + 1;
        }
        token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token);

    console.log(`📦 S3 contents: ${totalObjects} objects, ${(totalBytes / 1024 / 1024).toFixed(1)} MB`);
    console.log('   by extension:');
    Object.entries(extCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([k, v]) => console.log(`     .${k.padEnd(6)} ${v}`));
    console.log('   by top-level prefix:');
    Object.entries(prefixCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([k, v]) => console.log(`     ${k.padEnd(20)} ${v}`));
    console.log('');

    await dbPart(cfg);
}

async function dbPart(cfg: { bucket: string; region: string }) {
    console.log('🗄  DB media references:');
    const media = await prisma.mediaLibrary.findMany({
        select: { id: true, file_path: true, webp_path: true, avif_path: true, thumbnail_path: true, file_size: true, mime_type: true },
    });
    console.log(`   mediaLibrary rows: ${media.length}`);
    let totalSize = 0n;
    let mismatches = 0;
    let s3HostHits = 0;
    let relPaths = 0;
    let nullPaths = 0;
    const expectedHostFragments = [cfg.bucket, `s3.${cfg.region}.amazonaws.com`, 's3.amazonaws.com'];
    for (const m of media) {
        if (m.file_size) totalSize += m.file_size;
        const u = (m.file_path || '').toLowerCase();
        if (!u) { nullPaths++; continue; }
        if (u.startsWith('http')) {
            if (expectedHostFragments.some((h) => u.includes(h))) s3HostHits++;
            else mismatches++;
        } else {
            relPaths++; // raw S3 key (no full URL stored)
        }
    }
    console.log(`   total declared size: ${(Number(totalSize) / 1024 / 1024).toFixed(1)} MB`);
    console.log(`   absolute URLs hitting expected S3 host: ${s3HostHits}`);
    console.log(`   absolute URLs NOT pointing to expected S3 host: ${mismatches}`);
    console.log(`   relative S3 keys (no host): ${relPaths}`);
    console.log(`   null/empty file_path: ${nullPaths}`);
    if (mismatches > 0 && media.length > 0) {
        const sample = media.find((m) => {
            const u = (m.file_path || '').toLowerCase();
            return u.startsWith('http') && !expectedHostFragments.some((h) => u.includes(h));
        });
        if (sample) console.log(`   sample mismatch: ${sample.file_path}`);
    }

    console.log('\nDONE.\n');
}

audit()
    .catch((e) => {
        console.error('AUDIT CRASHED:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
