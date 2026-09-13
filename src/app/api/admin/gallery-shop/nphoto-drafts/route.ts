import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { readShopConfig, validateShopConfig, ShopValidationError } from '@/lib/galleries/merchandise';
import { shopError, shopSettingKey } from '@/lib/galleries/merchandise-server';
import { readNphotoRequestBody, validateNphotoDraftInput } from '@/lib/nphoto/offer-import-server';
import { nphotoOfferDescription } from '@/lib/nphoto/offer-import';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const input = validateNphotoDraftInput(await readNphotoRequestBody(request));
      const {draft} = input;
      const marker = `nphoto_offer_${createHash('sha256').update(draft.sourceUrl).digest('hex')}`;
      const result = await prisma.$transaction(async tx => {
        // Idempotence also covers offers created by the earlier starter importer.
        const previous = await tx.galleryProduct.findFirst({where:{gallery_id:null,nphoto_url:draft.sourceUrl},select:{id:true}});
        if (previous) return {id:previous.id,existing:true};
        const setting = await tx.setting.findUnique({where:{setting_key:shopSettingKey(null)}});
        let config = readShopConfig(null);
        if (setting) {
          try { config = validateShopConfig(JSON.parse(setting.setting_value ?? '')); }
          catch { throw new ShopValidationError('Istniejąca wspólna oferta wymaga sprawdzenia. Import jej nie nadpisze.',409); }
        }
        const type = /harmonijka/.test(draft.sourceUrl) ? 'accordion' : /kalendarz/.test(draft.sourceUrl) ? 'calendar' : /odbitki/.test(draft.sourceUrl) ? 'prints' : /fotoalbum|fotoksiaz/.test(draft.sourceUrl) ? 'album' : 'product';
        const product = await tx.galleryProduct.create({data:{gallery_id:null,title:draft.title,description:nphotoOfferDescription(input),price:input.price,is_active:false,image_url:draft.images[0]?.url || null,preview_images:draft.images.map(image => image.url),nphoto_url:draft.sourceUrl,product_type:type}});
        config.productRules[String(product.id)] = {minPhotos:input.minPhotos,maxPhotos:input.maxPhotos};
        await tx.setting.upsert({where:{setting_key:shopSettingKey(null)},create:{setting_key:shopSettingKey(null),setting_value:JSON.stringify(config)},update:{setting_value:JSON.stringify(config)}});
        await tx.setting.upsert({where:{setting_key:marker},create:{setting_key:marker,setting_value:JSON.stringify({id:product.id,sourceUrl:draft.sourceUrl,fetchedAt:draft.fetchedAt,specifications:draft.specifications,mediaConfirmedAt:new Date().toISOString()})},update:{setting_value:JSON.stringify({id:product.id,sourceUrl:draft.sourceUrl,fetchedAt:draft.fetchedAt,specifications:draft.specifications,mediaConfirmedAt:new Date().toISOString()})}});
        return {id:product.id,existing:false};
      }, {isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
      return NextResponse.json({success:true,...result},{headers:{'Cache-Control':'private, no-store'}});
    } catch (error) {
      if ((error as {code?:string})?.code === 'P2034') return shopError(new ShopValidationError('Oferta została równocześnie zmieniona. Odśwież panel i spróbuj ponownie.',409));
      return shopError(error);
    }
  });
}
