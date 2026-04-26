-- ============================================================================
-- ZERO LOSS MIGRATION: nPhoto Integration & Album Showcase
-- Data: 2026-04-26
-- ZASADA: Tylko ADD COLUMN IF NOT EXISTS. ZERO usuwania, zero modyfikacji.
-- ============================================================================

-- 1. GalleryProduct: rozszerzenie o nPhoto (dla widoczności albumów u klienta)
ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS nphoto_url TEXT;
ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS nphoto_embed_code TEXT;
ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS nphoto_product_id TEXT;
ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'album';
ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS preview_video_url TEXT;
ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS preview_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS sample_pages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS recommended_for TEXT[]; -- ['wedding','communion','birthday','family']
ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS seo_slug TEXT;
ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE gallery_products ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- 2. Nowa tabela: nphoto_albums (master katalog albumów do prezentacji w PageBuilder)
-- Może istnieć niezależnie od galerii klienta - jako reusable katalog
CREATE TABLE IF NOT EXISTS nphoto_albums (
    id              SERIAL PRIMARY KEY,
    title           TEXT NOT NULL,
    slug            TEXT UNIQUE NOT NULL,
    subtitle        TEXT,
    description     TEXT,
    
    -- Kategoryzacja (do dopasowania do typu sesji)
    category        TEXT NOT NULL DEFAULT 'album', -- album, frame, print, photobook, magnet
    occasion        TEXT[], -- 'wedding','communion','birthday','family','newborn','engagement'
    
    -- Cennik
    price           INTEGER NOT NULL DEFAULT 0, -- w groszach
    price_from      INTEGER, -- jeśli "od X zł"
    currency        TEXT DEFAULT 'PLN',
    
    -- Specyfikacja produktu
    format          TEXT, -- np. "30x30 cm"
    pages_count     INTEGER,
    cover_type      TEXT, -- "Twarda", "Skórzana"
    paper_type      TEXT,
    
    -- Media
    cover_image_url TEXT,
    preview_images  JSONB DEFAULT '[]'::jsonb, -- array of {url, alt, caption}
    sample_pages    JSONB DEFAULT '[]'::jsonb, -- array of preview spread URLs
    video_url       TEXT, -- promotional video (YouTube, Vimeo, S3)
    video_thumbnail TEXT,
    gallery_3d_url  TEXT, -- 360 view or 3D preview
    
    -- nPhoto Integration
    nphoto_product_id TEXT,
    nphoto_shop_url   TEXT,
    nphoto_embed_code TEXT,
    nphoto_api_data   JSONB, -- raw API response cache
    
    -- SEO
    seo_title         TEXT,
    seo_description   TEXT,
    seo_keywords      TEXT,
    schema_markup     JSONB, -- JSON-LD Product schema
    
    -- Status
    is_active         BOOLEAN DEFAULT TRUE,
    is_featured       BOOLEAN DEFAULT FALSE,
    sort_order        INTEGER DEFAULT 0,
    
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nphoto_albums_category ON nphoto_albums(category);
CREATE INDEX IF NOT EXISTS idx_nphoto_albums_active ON nphoto_albums(is_active);
CREATE INDEX IF NOT EXISTS idx_nphoto_albums_featured ON nphoto_albums(is_featured);
CREATE INDEX IF NOT EXISTS idx_nphoto_albums_slug ON nphoto_albums(slug);

-- 3. Powiązanie album -> oferta (klient widzi rekomendowane albumy przy ofercie)
CREATE TABLE IF NOT EXISTS offer_recommended_albums (
    id          SERIAL PRIMARY KEY,
    offer_id    INTEGER NOT NULL,
    album_id    INTEGER NOT NULL REFERENCES nphoto_albums(id) ON DELETE CASCADE,
    position    INTEGER DEFAULT 0,
    custom_note TEXT, -- "Idealny do tej sesji ślubnej"
    is_highlighted BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE(offer_id, album_id)
);

CREATE INDEX IF NOT EXISTS idx_offer_albums_offer ON offer_recommended_albums(offer_id);

-- 4. Dodanie reset_token_sent_at do users (śledzenie czy email powitalny był wysłany)
ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_email_count INTEGER DEFAULT 0;

-- ============================================================================
-- WERYFIKACJA: Sprawdź że wszystko zostało dodane
-- ============================================================================
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('gallery_products', 'nphoto_albums', 'offer_recommended_albums', 'users')
  AND column_name IN (
    'nphoto_url', 'nphoto_embed_code', 'product_type', 'preview_video_url',
    'recommended_for', 'featured', 'welcome_email_sent_at', 'welcome_email_count'
  )
ORDER BY table_name, column_name;
