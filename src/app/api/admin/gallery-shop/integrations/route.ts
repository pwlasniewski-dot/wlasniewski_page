import {NextRequest, NextResponse} from 'next/server';
import {withAuth} from '@/lib/auth/middleware';
import {inpostConfiguration, shipX} from '@/lib/shipping/inpost';
import {fetchInpostPoints} from '@/lib/shipping/inpost-points';
import {checkPayUConnection} from '@/lib/payu';
import {inpostWidgetToken} from '@/lib/shipping/inpost-widget';
import {isShopQa} from '@/lib/shop-qa';
import {getClientIp, rateLimit} from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
 return withAuth(request, async () => {
  if (!rateLimit(`shop-integrations:${getClientIp(request)}`,6,60_000).ok) return NextResponse.json({error:'Odczekaj minutę przed kolejnym sprawdzeniem.'},{status:429});
  const config = inpostConfiguration();
  const [organization, points, payment] = await Promise.allSettled([
   shipX<{id:number; services?:string[]}>(`/organizations/${config.organizationId}`),
   fetchInpostPoints(new URLSearchParams({per_page:'1',type:'parcel_locker',functions:'parcel_collect'})),
   checkPayUConnection(),
  ]);
  const connected = organization.status === 'fulfilled' && String(organization.value.id) === config.organizationId;
  const services = organization.status === 'fulfilled' && Array.isArray(organization.value.services) ? organization.value.services : [];
  return NextResponse.json({success:true, isolatedReview:isShopQa(), checkedAt:new Date().toISOString(),
   inpost:{connected, environment:config.environment, missing:config.missing,
    locker:connected && services.includes('inpost_locker_standard'),
    courier:connected && services.includes(config.courierService), courierService:config.courierService,
    pickupConfigured:Boolean(config.sender), pointsConnected:points.status === 'fulfilled',
    mapConfigured:Boolean(inpostWidgetToken()),
    message:connected ? 'InPost potwierdził dostęp do organizacji. Dostępność usług pochodzi z API przewoźnika.' : 'InPost nie potwierdził dostępu. Sprawdź token, numer organizacji i środowisko w ustawieniach hostingu.',
   },
   payment:payment.status === 'fulfilled' ? payment.value : {connected:false,environment:null,message:'Nie udało się sprawdzić PayU.'},
  },{headers:{'Cache-Control':'private, no-store'}});
 });
}
