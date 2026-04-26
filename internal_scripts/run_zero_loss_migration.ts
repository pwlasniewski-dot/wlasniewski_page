/**
 * ZERO LOSS Migration Runner v2
 * Hardcoded statements - bezpieczniejsze niż parsowanie SQL z komentarzami.
 * KAŻDA zmiana to tylko ADD/CREATE IF NOT EXISTS - zero ryzyka utraty danych.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STATEMENTS: { name: string; sql: string }[] = [
    // ── 1. gallery_products extensions
    { name: 'add nphoto_url', sql: `ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS nphoto_url TEXT` },
    { name: 'add nphoto_embed_code', sql: `ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS nphoto_embed_code TEXT` },
    { name: 'add nphoto_product_id', sql: `ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS nphoto_product_id TEXT` },
    { name: 'add product_type', sql: `ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'album'` },
    { name: 'add preview_video_url', sql: `ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS preview_video_url TEXT` },
    { name: 'add preview_images', sql: `ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS preview_images JSONB DEFAULT '[]'::jsonb` },
    { name: 'add sample_pages', sql: `ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS sample_pages JSONB DEFAULT '[]'::jsonb` },
    { name: 'add recommended_for', sql: `ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS recommended_for TEXT[]` },
    { name: 'add featured', sql: `ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE` },
    { name: 'add sort_order', sql: `ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0` },
    { name: 'add seo_slug', sql: `ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS seo_slug TEXT` },
    { name: 'add seo_title', sql: `ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS seo_title TEXT` },
    { name: 'add seo_description', sql: `ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS seo_description TEXT` },

    // ── 2. nphoto_albums (master katalog)
    {
        name: 'create nphoto_albums', sql: `
            CREATE TABLE IF NOT EXISTS nphoto_albums (
                id              SERIAL PRIMARY KEY,
                title           TEXT NOT NULL,
                slug            TEXT UNIQUE NOT NULL,
                subtitle        TEXT,
                description     TEXT,
                category        TEXT NOT NULL DEFAULT 'album',
                occasion        TEXT[],
                price           INTEGER NOT NULL DEFAULT 0,
                price_from      INTEGER,
                currency        TEXT DEFAULT 'PLN',
                format          TEXT,
                pages_count     INTEGER,
                cover_type      TEXT,
                paper_type      TEXT,
                cover_image_url TEXT,
                preview_images  JSONB DEFAULT '[]'::jsonb,
                sample_pages    JSONB DEFAULT '[]'::jsonb,
                video_url       TEXT,
                video_thumbnail TEXT,
                gallery_3d_url  TEXT,
                nphoto_product_id TEXT,
                nphoto_shop_url   TEXT,
                nphoto_embed_code TEXT,
                nphoto_api_data   JSONB,
                seo_title         TEXT,
                seo_description   TEXT,
                seo_keywords      TEXT,
                schema_markup     JSONB,
                is_active         BOOLEAN DEFAULT TRUE,
                is_featured       BOOLEAN DEFAULT FALSE,
                sort_order        INTEGER DEFAULT 0,
                created_at        TIMESTAMP DEFAULT NOW(),
                updated_at        TIMESTAMP DEFAULT NOW()
            )
        `
    },
    { name: 'idx nphoto_albums category', sql: `CREATE INDEX IF NOT EXISTS idx_nphoto_albums_category ON nphoto_albums(category)` },
    { name: 'idx nphoto_albums active', sql: `CREATE INDEX IF NOT EXISTS idx_nphoto_albums_active ON nphoto_albums(is_active)` },
    { name: 'idx nphoto_albums featured', sql: `CREATE INDEX IF NOT EXISTS idx_nphoto_albums_featured ON nphoto_albums(is_featured)` },
    { name: 'idx nphoto_albums slug', sql: `CREATE INDEX IF NOT EXISTS idx_nphoto_albums_slug ON nphoto_albums(slug)` },

    // ── 3. offer ↔ album recommendations
    {
        name: 'create offer_recommended_albums', sql: `
            CREATE TABLE IF NOT EXISTS offer_recommended_albums (
                id          SERIAL PRIMARY KEY,
                offer_id    INTEGER NOT NULL,
                album_id    INTEGER NOT NULL REFERENCES nphoto_albums(id) ON DELETE CASCADE,
                position    INTEGER DEFAULT 0,
                custom_note TEXT,
                is_highlighted BOOLEAN DEFAULT FALSE,
                created_at  TIMESTAMP DEFAULT NOW(),
                UNIQUE(offer_id, album_id)
            )
        `
    },
    { name: 'idx offer_albums offer', sql: `CREATE INDEX IF NOT EXISTS idx_offer_albums_offer ON offer_recommended_albums(offer_id)` },
    { name: 'idx offer_albums album', sql: `CREATE INDEX IF NOT EXISTS idx_offer_albums_album ON offer_recommended_albums(album_id)` },

    // ── 4. users: welcome email tracking
    { name: 'add welcome_email_sent_at', sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMP` },
    { name: 'add welcome_email_count', sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_email_count INTEGER DEFAULT 0` },
];

async function main() {
    console.log('🛡️  ZERO LOSS Migration Runner v2');
    console.log('==========================================\n');

    let success = 0, failed = 0;
    for (const s of STATEMENTS) {
        try {
            await prisma.$executeRawUnsafe(s.sql);
            console.log(`✅ ${s.name}`);
            success++;
        } catch (e: any) {
            console.log(`❌ ${s.name}: ${e.message.split('\n').slice(-3).join(' | ')}`);
            failed++;
        }
    }

    console.log(`\n==========================================`);
    console.log(`✅ ${success}/${STATEMENTS.length} sukces, ❌ ${failed} błędów\n`);

    // Sanity check - ZERO LOSS verification
    console.log('🛡️  Sanity Check (Zero Loss):');
    const counts = {
        users: await prisma.user.count(),
        pages: await prisma.page.count(),
        media: await prisma.mediaLibrary.count(),
        portfolio: await prisma.portfolioSession.count(),
        blog: await prisma.blogPost.count(),
        settings: await prisma.setting.count(),
        galleries: await prisma.clientGallery.count(),
        products: await prisma.galleryProduct.count(),
    };
    for (const [k, v] of Object.entries(counts)) console.log(`   ${k}: ${v}`);

    // Sprawdź nowe tabele
    console.log('\n📋 Nowe tabele:');
    const tables: any[] = await prisma.$queryRawUnsafe(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name IN ('nphoto_albums', 'offer_recommended_albums')
    `);
    for (const t of tables) console.log(`   ✓ ${t.table_name}`);

    await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
