-- Run ONLY on br-autumn-thunder-aey4bqrx (isolated QA), never production.
-- Dimensions/attributes from docs/data/prodigi-sandbox-catalog-audit.json, 2026-10-03.
-- Display-only sandbox fixture: cart/order release guards stay disabled.
WITH existing AS (
 SELECT id FROM gallery_products WHERE seo_slug='qa-prodigi-fap-11x14' AND gallery_id IS NULL
), added AS (
 INSERT INTO gallery_products(title,description,price,is_active,product_type,seo_slug,updated_at)
 SELECT 'Podgląd QA — Fine Art 11×14','Produkt testowy do sprawdzenia własnego zdjęcia. Zakup i produkcja są wyłączone.',7900,true,'prodigi_sandbox','qa-prodigi-fap-11x14',NOW()
 WHERE NOT EXISTS (SELECT 1 FROM existing) RETURNING id
), product AS (SELECT id FROM existing UNION ALL SELECT id FROM added), spec AS (
 INSERT INTO settings(setting_key,setting_value,updated_at)
 SELECT 'prodigi_product_v1_'||id,jsonb_build_object('version',1,'provider','prodigi','environment','sandbox','productId',id,'sku','GLOBAL-FAP-11X14','variant',jsonb_build_object('attributes',jsonb_build_object('paperType','EMA','substrateWeight','200gsm'),'printAreaSizes',jsonb_build_object('default',jsonb_build_object('horizontalResolution',3307,'verticalResolution',4192))),'requiredAssets',jsonb_build_array('default'),'shippingMethod','Budget','ordersEnabled',false,'liveQualified',false,'destination','PL')::text,NOW() FROM product
 ON CONFLICT(setting_key) DO UPDATE SET setting_value=EXCLUDED.setting_value,updated_at=NOW() RETURNING setting_key
)
UPDATE settings SET setting_value=(
 setting_value::jsonb || jsonb_build_object(
 'productRules',COALESCE(setting_value::jsonb->'productRules','{}'::jsonb)||jsonb_build_object(product.id::text,jsonb_build_object('minPhotos',1,'maxPhotos',1,'deliveryMethods',jsonb_build_array('courier'))),
 'delivery',COALESCE(setting_value::jsonb->'delivery','{}'::jsonb)||jsonb_build_object('courier',jsonb_build_object('enabled',true,'amount',1499)),
 'publicOffer',(setting_value::jsonb->'publicOffer')||jsonb_build_object('productIds',(SELECT jsonb_agg(DISTINCT value) FROM jsonb_array_elements(COALESCE(setting_value::jsonb#>'{publicOffer,productIds}','[]'::jsonb)||jsonb_build_array(product.id))))
 ))::text, updated_at=NOW() FROM product WHERE setting_key='gallery_shop_default'
RETURNING product.id AS qa_product_id;
