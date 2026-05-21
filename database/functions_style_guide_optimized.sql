-- =====================================================
-- OPTIMIZED DATABASE FUNCTIONS & PROCEDURES
-- Style Guide System - Zero Loss Performance
-- =====================================================

-- =====================================================
-- VIEW: Complete outfit sets with palettes (denormalized)
-- =====================================================
CREATE OR REPLACE VIEW v_outfit_sets_full AS
SELECT 
    os.id,
    os.title,
    os.slug,
    os.description,
    os.category,
    os.group_size,
    os.age_group,
    os.season,
    os.location_type,
    os.outfit_details,
    os.dos_and_donts,
    os.example_images,
    os.is_featured,
    os.is_active,
    os.display_order,
    os.created_at,
    os.updated_at,
    -- Denormalized palette data
    cp.id as palette_id,
    cp.name as palette_name,
    cp.slug as palette_slug,
    cp.colors as palette_colors,
    cp.season as palette_season,
    cp.location_type as palette_location
FROM outfit_sets os
LEFT JOIN color_palettes cp ON os.palette_id = cp.id
WHERE os.is_active = true;

-- =====================================================
-- FUNCTION: Get outfit recommendations based on criteria
-- Ultra-optimized with scoring system
-- =====================================================
CREATE OR REPLACE FUNCTION get_outfit_recommendations(
    p_group_size INTEGER DEFAULT NULL,
    p_season VARCHAR(50) DEFAULT NULL,
    p_location VARCHAR(50) DEFAULT NULL,
    p_category VARCHAR(50) DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id INTEGER,
    title VARCHAR,
    slug VARCHAR,
    description TEXT,
    category VARCHAR,
    group_size INTEGER,
    season VARCHAR,
    location_type VARCHAR,
    palette_name VARCHAR,
    palette_colors JSONB,
    outfit_details JSONB,
    dos_and_donts JSONB,
    example_images JSONB,
    match_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        os.id,
        os.title,
        os.slug,
        os.description,
        os.category,
        os.group_size,
        os.season,
        os.location_type,
        cp.name as palette_name,
        cp.colors as palette_colors,
        os.outfit_details,
        os.dos_and_donts,
        os.example_images,
        -- Smart scoring algorithm
        (
            CASE WHEN p_group_size IS NOT NULL AND os.group_size = p_group_size THEN 50 ELSE 0 END +
            CASE WHEN p_season IS NOT NULL AND (os.season = p_season OR os.season = 'all') THEN 30 ELSE 0 END +
            CASE WHEN p_location IS NOT NULL AND os.location_type = p_location THEN 30 ELSE 0 END +
            CASE WHEN p_category IS NOT NULL AND os.category = p_category THEN 40 ELSE 0 END +
            CASE WHEN os.is_featured = true THEN 20 ELSE 0 END
        )::INTEGER as match_score
    FROM outfit_sets os
    LEFT JOIN color_palettes cp ON os.palette_id = cp.id
    WHERE os.is_active = true
        AND (p_group_size IS NULL OR os.group_size = p_group_size OR os.group_size IS NULL)
        AND (p_season IS NULL OR os.season = p_season OR os.season = 'all' OR os.season IS NULL)
        AND (p_location IS NULL OR os.location_type = p_location OR os.location_type IS NULL)
        AND (p_category IS NULL OR os.category = p_category)
    ORDER BY match_score DESC, os.display_order ASC, os.is_featured DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FUNCTION: Get color palettes by filters
-- =====================================================
CREATE OR REPLACE FUNCTION get_color_palettes_filtered(
    p_season VARCHAR(50) DEFAULT NULL,
    p_location VARCHAR(50) DEFAULT NULL,
    p_mood VARCHAR(50) DEFAULT NULL,
    p_active_only BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    id INTEGER,
    name VARCHAR,
    slug VARCHAR,
    description TEXT,
    season VARCHAR,
    location_type VARCHAR,
    mood VARCHAR,
    colors JSONB,
    example_images JSONB,
    outfit_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.id,
        cp.name,
        cp.slug,
        cp.description,
        cp.season,
        cp.location_type,
        cp.mood,
        cp.colors,
        cp.example_images,
        COUNT(os.id) as outfit_count
    FROM color_palettes cp
    LEFT JOIN outfit_sets os ON cp.id = os.palette_id AND os.is_active = true
    WHERE (p_active_only = false OR cp.is_active = true)
        AND (p_season IS NULL OR cp.season = p_season OR cp.season = 'all')
        AND (p_location IS NULL OR cp.location_type = p_location)
        AND (p_mood IS NULL OR cp.mood = p_mood)
    GROUP BY cp.id
    ORDER BY cp.display_order ASC, cp.name ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FUNCTION: Get complete style guide for client
-- Single optimized query for client portal
-- =====================================================
CREATE OR REPLACE FUNCTION get_client_style_guide(
    p_offer_id INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    offer_data RECORD;
BEGIN
    -- If offer_id provided, get offer details for context
    IF p_offer_id IS NOT NULL THEN
        SELECT 
            o.id,
            o.service_type,
            s.name as service_name,
            o.session_date
        INTO offer_data
        FROM offers o
        LEFT JOIN service_types s ON o.service_type_id = s.id
        WHERE o.id = p_offer_id;
    END IF;
    
    -- Build complete style guide JSON
    SELECT json_build_object(
        'offer_context', CASE WHEN offer_data.id IS NOT NULL THEN
            json_build_object(
                'service', offer_data.service_name,
                'date', offer_data.session_date
            )
        ELSE NULL END,
        
        'featured_tips', (
            SELECT json_agg(row_to_json(t))
            FROM (
                SELECT id, title, content, tip_type, icon
                FROM style_guide_tips
                WHERE is_active = true AND is_featured = true
                ORDER BY display_order ASC
                LIMIT 5
            ) t
        ),
        
        'color_palettes', (
            SELECT json_agg(row_to_json(cp))
            FROM (
                SELECT 
                    id, name, slug, description, 
                    season, location_type, mood, colors
                FROM color_palettes
                WHERE is_active = true
                ORDER BY display_order ASC
                LIMIT 10
            ) cp
        ),
        
        'outfit_sets', (
            SELECT json_agg(row_to_json(os))
            FROM (
                SELECT 
                    id, title, slug, description, category,
                    group_size, age_group, season, location_type,
                    outfit_details, dos_and_donts, example_images
                FROM outfit_sets
                WHERE is_active = true AND is_featured = true
                ORDER BY display_order ASC
                LIMIT 6
            ) os
        ),
        
        'faqs', (
            SELECT json_agg(row_to_json(faq))
            FROM (
                SELECT question, answer, category
                FROM style_guide_faqs
                WHERE is_active = true
                ORDER BY display_order ASC
            ) faq
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FUNCTION: Smart search across style guide
-- Full-text search with ranking
-- =====================================================
CREATE OR REPLACE FUNCTION search_style_guide(
    p_query TEXT,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    result_type VARCHAR,
    id INTEGER,
    title TEXT,
    description TEXT,
    slug VARCHAR,
    relevance REAL
) AS $$
BEGIN
    RETURN QUERY
    -- Search in outfit sets
    SELECT 
        'outfit'::VARCHAR as result_type,
        os.id,
        os.title::TEXT,
        os.description::TEXT,
        os.slug,
        ts_rank(
            to_tsvector('english', 
                coalesce(os.title, '') || ' ' || 
                coalesce(os.description, '') || ' ' ||
                coalesce(os.category, '')
            ),
            plainto_tsquery('english', p_query)
        ) as relevance
    FROM outfit_sets os
    WHERE os.is_active = true
        AND to_tsvector('english', 
            coalesce(os.title, '') || ' ' || 
            coalesce(os.description, '') || ' ' ||
            coalesce(os.category, '')
        ) @@ plainto_tsquery('english', p_query)
    
    UNION ALL
    
    -- Search in palettes
    SELECT 
        'palette'::VARCHAR as result_type,
        cp.id,
        cp.name::TEXT,
        cp.description::TEXT,
        cp.slug,
        ts_rank(
            to_tsvector('english', 
                coalesce(cp.name, '') || ' ' || 
                coalesce(cp.description, '')
            ),
            plainto_tsquery('english', p_query)
        ) as relevance
    FROM color_palettes cp
    WHERE cp.is_active = true
        AND to_tsvector('english', 
            coalesce(cp.name, '') || ' ' || 
            coalesce(cp.description, '')
        ) @@ plainto_tsquery('english', p_query)
    
    UNION ALL
    
    -- Search in tips
    SELECT 
        'tip'::VARCHAR as result_type,
        st.id,
        st.title::TEXT,
        st.content::TEXT,
        st.slug,
        ts_rank(
            to_tsvector('english', 
                coalesce(st.title, '') || ' ' || 
                coalesce(st.content, '')
            ),
            plainto_tsquery('english', p_query)
        ) as relevance
    FROM style_guide_tips st
    WHERE st.is_active = true
        AND to_tsvector('english', 
            coalesce(st.title, '') || ' ' || 
            coalesce(st.content, '')
        ) @@ plainto_tsquery('english', p_query)
    
    ORDER BY relevance DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- PROCEDURE: Update display orders (batch operation)
-- =====================================================
CREATE OR REPLACE PROCEDURE update_display_orders(
    p_table_name VARCHAR,
    p_orders JSONB -- Array of {id, order}
)
LANGUAGE plpgsql AS $$
DECLARE
    item JSONB;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(p_orders)
    LOOP
        CASE p_table_name
            WHEN 'color_palettes' THEN
                UPDATE color_palettes 
                SET display_order = (item->>'order')::INTEGER,
                    updated_at = NOW()
                WHERE id = (item->>'id')::INTEGER;
            
            WHEN 'outfit_sets' THEN
                UPDATE outfit_sets 
                SET display_order = (item->>'order')::INTEGER,
                    updated_at = NOW()
                WHERE id = (item->>'id')::INTEGER;
            
            WHEN 'style_guide_tips' THEN
                UPDATE style_guide_tips 
                SET display_order = (item->>'order')::INTEGER,
                    updated_at = NOW()
                WHERE id = (item->>'id')::INTEGER;
        END CASE;
    END LOOP;
    
    COMMIT;
END;
$$;

-- =====================================================
-- MATERIALIZED VIEW: Stats and analytics
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_style_guide_stats AS
SELECT 
    (SELECT COUNT(*) FROM color_palettes WHERE is_active = true) as active_palettes,
    (SELECT COUNT(*) FROM outfit_sets WHERE is_active = true) as active_outfits,
    (SELECT COUNT(*) FROM style_guide_tips WHERE is_active = true) as active_tips,
    (SELECT COUNT(*) FROM style_guide_faqs WHERE is_active = true) as active_faqs,
    
    -- Most popular palette (by outfit usage)
    (
        SELECT cp.name
        FROM color_palettes cp
        LEFT JOIN outfit_sets os ON cp.id = os.palette_id
        WHERE cp.is_active = true
        GROUP BY cp.id, cp.name
        ORDER BY COUNT(os.id) DESC
        LIMIT 1
    ) as most_popular_palette,
    
    -- Most common category
    (
        SELECT category
        FROM outfit_sets
        WHERE is_active = true AND category IS NOT NULL
        GROUP BY category
        ORDER BY COUNT(*) DESC
        LIMIT 1
    ) as most_common_category,
    
    NOW() as last_updated;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_style_guide_stats_single_row 
ON mv_style_guide_stats ((true));

-- =====================================================
-- FUNCTION: Refresh stats (call periodically)
-- =====================================================
CREATE OR REPLACE FUNCTION refresh_style_guide_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_style_guide_stats;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEXES for full-text search optimization
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_outfit_sets_fts ON outfit_sets 
USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

CREATE INDEX IF NOT EXISTS idx_color_palettes_fts ON color_palettes 
USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));

CREATE INDEX IF NOT EXISTS idx_style_tips_fts ON style_guide_tips 
USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION get_outfit_recommendations IS 'Ultra-optimized function for getting outfit recommendations with smart scoring';
COMMENT ON FUNCTION get_client_style_guide IS 'Single query to fetch complete style guide for client portal';
COMMENT ON FUNCTION search_style_guide IS 'Full-text search across all style guide content';
COMMENT ON VIEW v_outfit_sets_full IS 'Denormalized view of outfit sets with palette data';
COMMENT ON MATERIALIZED VIEW mv_style_guide_stats IS 'Cached statistics for admin dashboard';
