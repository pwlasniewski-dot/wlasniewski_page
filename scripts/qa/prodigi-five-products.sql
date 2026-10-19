-- Isolated QA only: br-autumn-thunder-aey4bqrx. Never production.
-- Source: checked sandbox catalogue 2026-10-03. Prices are test amounts.
DO $fixture$
DECLARE item jsonb; pid integer; cfg jsonb;
BEGIN
 SELECT setting_value::jsonb INTO STRICT cfg FROM settings WHERE setting_key='gallery_shop_default' FOR UPDATE;
 FOR item IN SELECT value FROM jsonb_array_elements('[{"slug": "qa-prodigi-fap-11x14", "title": "TEST — Fine Art 11×14 cali", "price": 7900, "sku": "GLOBAL-FAP-11X14", "variant": {"attributes": {"paperType": "EMA", "substrateWeight": "200gsm"}, "printAreaSizes": {"default": {"horizontalResolution": 3307, "verticalResolution": 4192}}}}, {"slug": "qa-prodigi-fap-12x16", "title": "TEST — Fine Art 12×16 cali", "price": 9900, "sku": "GLOBAL-FAP-12X16", "variant": {"attributes": {"paperType": "EMA", "substrateWeight": "200gsm"}, "printAreaSizes": {"default": {"horizontalResolution": 3600, "verticalResolution": 4800}}}}, {"slug": "qa-prodigi-fap-16x24", "title": "TEST — Fine Art 16×24 cale", "price": 14900, "sku": "GLOBAL-FAP-16X24", "variant": {"attributes": {"paperType": "EMA", "substrateWeight": "200gsm"}, "printAreaSizes": {"default": {"horizontalResolution": 4800, "verticalResolution": 7200}}}}, {"slug": "qa-prodigi-can-12x16", "title": "TEST — Canvas 12×16 cali", "price": 15900, "sku": "GLOBAL-CAN-12X16", "variant": {"attributes": {"edge": "38mm", "frame": "38mm standard stretcher bar", "paperType": "Standard canvas (SC)", "substrateWeight": "400gsm", "wrap": "Black"}, "printAreaSizes": {"default": {"horizontalResolution": 3654, "verticalResolution": 4854}}}}, {"slug": "qa-prodigi-can-16x20", "title": "TEST — Canvas 16×20 cali", "price": 19900, "sku": "GLOBAL-CAN-16X20", "variant": {"attributes": {"edge": "38mm", "frame": "38mm standard stretcher bar", "paperType": "Standard canvas (SC)", "substrateWeight": "400gsm", "wrap": "Black"}, "printAreaSizes": {"default": {"horizontalResolution": 4854, "verticalResolution": 6054}}}}]'::jsonb) LOOP
  SELECT id INTO pid FROM gallery_products WHERE seo_slug=item->>'slug' AND gallery_id IS NULL;
  IF pid IS NULL THEN
   INSERT INTO gallery_products(title,description,price,is_active,product_type,seo_slug,updated_at)
   VALUES(item->>'title','Produkt testowy Prodigi. Dodaj własne zdjęcie i sprawdź podgląd. Cena służy wyłącznie testom.',(item->>'price')::integer,true,'prodigi_sandbox',item->>'slug',NOW()) RETURNING id INTO pid;
  ELSE
   UPDATE gallery_products SET title=item->>'title',is_active=true,updated_at=NOW() WHERE id=pid;
  END IF;
  INSERT INTO settings(setting_key,setting_value,updated_at) VALUES('prodigi_product_v1_'||pid,
   jsonb_build_object('version',1,'provider','prodigi','environment','sandbox','productId',pid,'sku',item->>'sku','variant',item->'variant','requiredAssets',jsonb_build_array('default'),'shippingMethod','Budget','ordersEnabled',false,'liveQualified',false,'sandboxOrdersEnabled',true,'destination','PL')::text,NOW())
  ON CONFLICT(setting_key) DO UPDATE SET setting_value=EXCLUDED.setting_value,updated_at=NOW();
  cfg=jsonb_set(cfg,'{productRules}',COALESCE(cfg->'productRules','{}'::jsonb)||jsonb_build_object(pid::text,jsonb_build_object('minPhotos',1,'maxPhotos',1,'deliveryMethods',jsonb_build_array('courier'))));
  cfg=jsonb_set(cfg,'{publicOffer,productIds}',(SELECT jsonb_agg(DISTINCT value) FROM jsonb_array_elements(COALESCE(cfg#>'{publicOffer,productIds}','[]'::jsonb)||jsonb_build_array(pid))));
 END LOOP;
 UPDATE settings SET setting_value=cfg::text,updated_at=NOW() WHERE setting_key='gallery_shop_default';
END $fixture$;

-- Official product photography supplied by Prodigi for these product families.
UPDATE gallery_products SET
 image_url=CASE WHEN seo_slug LIKE 'qa-prodigi-fap-%' THEN 'https://www.prodigi.com/download/product-range/enhanced-matte-art/EMA.jpg' ELSE 'https://www.prodigi.com/download/product-range/stretched-canvas/Black%20wrap%20on%20a%2038mm%20stretched%20canvas.jpg' END,
 preview_images=CASE WHEN seo_slug LIKE 'qa-prodigi-fap-%' THEN '["https://www.prodigi.com/download/product-range/enhanced-matte-art/EMA.jpg"]'::jsonb ELSE '["https://www.prodigi.com/download/product-range/stretched-canvas/Black%20wrap%20on%20a%2038mm%20stretched%20canvas.jpg","https://www.prodigi.com/download/product-range/stretched-canvas/Stretched%2038mm%20canvas.jpg"]'::jsonb END,
 description=CASE WHEN seo_slug LIKE 'qa-prodigi-fap-%' THEN 'Testowy wydruk Fine Art na matowym papierze 200 g/m². Zdjęcie katalogowe Prodigi pokazuje przykład produktu. Dodaj własną fotografię, aby sprawdzić podgląd. Cena testowa.' ELSE 'Testowy obraz na płótnie 400 g/m², krosno 38 mm, czarne boki. Zdjęcia katalogowe Prodigi pokazują przykłady produktu. Dodaj własną fotografię, aby sprawdzić podgląd. Cena testowa.' END,
 updated_at=NOW()
WHERE gallery_id IS NULL AND seo_slug IN ('qa-prodigi-fap-11x14','qa-prodigi-fap-12x16','qa-prodigi-fap-16x24','qa-prodigi-can-12x16','qa-prodigi-can-16x20');
