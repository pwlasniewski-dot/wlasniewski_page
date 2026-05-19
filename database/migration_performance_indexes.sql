-- =====================================================
-- PERFORMANCE OPTIMIZATION: Database Indexes
-- Created: 2026-05-19
-- Purpose: Add indexes to frequently queried columns
-- =====================================================

-- Pages table indexes (for faster page lookups)
-- Check if indexes exist before creating (idempotent)

-- Index for is_published (used in WHERE clauses)
CREATE INDEX IF NOT EXISTS idx_pages_is_published ON pages(is_published);

-- Index for page_type (used in B2B page lookups)
CREATE INDEX IF NOT EXISTS idx_pages_page_type ON pages(page_type);

-- Composite index for B2B queries (page_type + is_published + slug)
CREATE INDEX IF NOT EXISTS idx_pages_b2b_lookup ON pages(page_type, is_published, slug);

-- Index for parent_page_id (for menu hierarchies)
CREATE INDEX IF NOT EXISTS idx_pages_parent_page_id ON pages(parent_page_id);

-- =====================================================
-- PortfolioSession indexes
-- =====================================================

-- Index for category filtering (used in portfolio lists)
CREATE INDEX IF NOT EXISTS idx_portfolio_sessions_category ON portfolio_sessions(category);

-- Index for is_published (used in WHERE clauses)
CREATE INDEX IF NOT EXISTS idx_portfolio_sessions_is_published ON portfolio_sessions(is_published);

-- Index for is_category_hero (used on portfolio main page)
CREATE INDEX IF NOT EXISTS idx_portfolio_sessions_is_category_hero ON portfolio_sessions(is_category_hero);

-- Composite index for published sessions in category
CREATE INDEX IF NOT EXISTS idx_portfolio_category_published ON portfolio_sessions(category, is_published, display_order);

-- =====================================================
-- Testimonials indexes
-- =====================================================

-- Index for is_featured (used on homepage)
CREATE INDEX IF NOT EXISTS idx_testimonials_is_featured ON testimonials(is_featured);

-- Index for created_at (for ordering)
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON testimonials(created_at DESC);

-- =====================================================
-- BlogPost indexes
-- =====================================================

-- Index for status (draft/published filtering)
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);

-- Index for published_at (for ordering published posts)
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);

-- Composite index for published posts
CREATE INDEX IF NOT EXISTS idx_blog_published_lookup ON blog_posts(status, published_at DESC);

-- =====================================================
-- Booking indexes
-- =====================================================

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);

-- Index for email lookups (client portal)
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);

-- Index for status
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- =====================================================
-- MediaLibrary indexes
-- =====================================================

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_media_library_category ON media_library(category);

-- Index for is_featured
CREATE INDEX IF NOT EXISTS idx_media_library_is_featured ON media_library(is_featured);

-- =====================================================
-- Settings indexes
-- =====================================================

-- Index for setting_key (frequently queried)
-- Already has UNIQUE constraint, but explicit index helps
CREATE INDEX IF NOT EXISTS idx_settings_setting_key ON settings(setting_key);

-- =====================================================
-- Verify indexes (informational query)
-- =====================================================

-- Uncomment below to see all indexes after migration
-- SELECT 
--     tablename, 
--     indexname, 
--     indexdef 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, indexname;
