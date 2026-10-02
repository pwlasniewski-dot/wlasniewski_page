import React from 'react';
import Link from 'next/link';
import type { PageSection } from '@/components/admin/PageBuilder';
import PackageScope from '@/components/booking/PackageScope';
import PromotionPriceBlock from '@/components/promotions/PromotionPriceBlock';
import type { PublicPackagePromotion } from '@/lib/packagePromotions';
import { formatPackageDuration } from '@/lib/packageScope';
import { cityContextLink, cityFaqItems, cityText } from '@/lib/cityLanding';

export interface CmsPublicPackage {
    id: number; name: string; subtitle?: string | null; serviceName: string;
    hours: number; price: number; regularPrice?: number;
    scopeLines: string[]; promotion?: PublicPackagePromotion | null;
}

export function EditorialOfferHero({ data, city }: { data: PageSection; city?: string }) {
    const Heading = data.isPrimaryHeading ? 'h1' : 'h2';
    return <section className="border-b border-[#d9d2c8] bg-[#ebe6de] text-[#25221f]">
        <div className={`mx-auto grid max-w-[1500px] ${data.image ? 'lg:grid-cols-2' : ''}`}>
            <div className="order-2 flex items-center px-6 py-16 sm:px-10 lg:order-1 lg:px-16 lg:py-24">
                <div className="max-w-2xl">
                    {data.tag && <p className="mb-5 text-xs uppercase tracking-[.24em] text-[#746d65]">{cityText(data.tag)}</p>}
                    <Heading className="font-serif text-4xl leading-tight sm:text-5xl xl:text-6xl">{cityText(data.title)}</Heading>
                    {data.subtitle && <p className="mt-6 text-xl text-[#514b44]">{cityText(data.subtitle)}</p>}
                    {data.description && <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-[#514b44]">{cityText(data.description)}</p>}
                    {data.buttonText && data.buttonLink && <Link
                        href={cityContextLink(data.buttonLink, city || '', 'city-hero-inquiry')}
                        data-analytics="photo-cta-inquiry-city-hero"
                        className="mt-8 inline-flex rounded-full bg-[#292622] px-7 py-4 text-center font-semibold text-white hover:bg-black">
                        {data.buttonText}
                    </Link>}
                    {data.secondaryButtonText && data.secondaryButtonLink && <Link
                        href={cityContextLink(data.secondaryButtonLink, city || '', 'city-hero-service')}
                        className="ml-3 mt-4 inline-flex rounded-full border border-[#a9a095] px-7 py-4 text-center font-semibold">
                        {data.secondaryButtonText}
                    </Link>}
                </div>
            </div>
            {data.image && <div className="relative order-1 min-h-[45svh] lg:order-2">
                <img src={data.image} alt={data.imageAlt || ''}
                    style={{ ['--cms-image-position' as string]: data.imagePosition || 'center center',
                        ['--cms-image-position-mobile' as string]: data.imagePositionMobile || data.imagePosition || 'center center' }}
                    className={`cms-section-image absolute inset-0 h-full w-full ${data.imageObjectFit === 'contain' ? 'object-contain' : 'object-cover'}`} />
            </div>}
        </div>
    </section>;
}

export function CmsFaqSection({ data }: { data: PageSection }) {
    const items = cityFaqItems([data]);
    if (!items.length) return null;
    return <section className="bg-[#f4f1eb] px-6 py-16 text-[#25221f] sm:px-10" data-cms-faq>
        <div className="mx-auto max-w-4xl">
            {data.title && <h2 className="mb-8 text-center font-serif text-3xl md:text-4xl">{cityText(data.title)}</h2>}
            {data.subtitle && <p className="mb-8 text-center leading-relaxed text-[#6c655d]">{cityText(data.subtitle)}</p>}
            <div className="divide-y divide-[#d7d0c6] border-y border-[#d7d0c6]">
                {items.map((item, index) => <details key={index}>
                    <summary className="cursor-pointer py-6 text-lg font-semibold">{item.question}</summary>
                    <p className="pb-6 leading-relaxed text-[#6c655d]">{item.answer}</p>
                </details>)}
            </div>
        </div>
    </section>;
}

export function CmsPublicPackages({ data, packages, city }: {
    data: PageSection; packages: CmsPublicPackage[]; city?: string;
}) {
    const selected = packages.filter(pkg => data.serviceNames?.includes(pkg.serviceName));
    return <section className="bg-[#faf8f4] px-6 py-16 text-[#25221f] sm:px-10" data-cms-public-packages>
        <div className="mx-auto max-w-6xl">
            {data.title && <h2 className="font-serif text-3xl md:text-4xl">{cityText(data.title)}</h2>}
            {data.subtitle && <p className="mt-5 leading-relaxed text-[#6c655d]">{cityText(data.subtitle)}</p>}
            {selected.length ? <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {selected.map(pkg => <article key={pkg.id} className="flex flex-col rounded-2xl border border-[#d7d0c6] bg-white p-7" data-package-id={pkg.id}>
                    <p className="text-sm text-[#746d65]">{pkg.serviceName}</p>
                    <h3 className="mt-3 font-serif text-2xl">{pkg.name}</h3>
                    {pkg.subtitle && <p className="mt-3 text-sm leading-relaxed text-[#6c655d]">{cityText(pkg.subtitle)}</p>}
                    <div className="my-6">{pkg.promotion ? <PromotionPriceBlock promotion={pkg.promotion} variant="compact" />
                        : <p className="text-2xl font-semibold">{new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(pkg.price / 100)} zł</p>}
                        {pkg.hours > 0 && <p className="mt-2 text-sm">{formatPackageDuration(pkg.hours)}</p>}
                    </div>
                    <PackageScope scopeLines={pkg.scopeLines} className="mb-7 text-[#6c655d]" />
                    {data.buttonText && data.buttonLink && <Link
                        href={cityContextLink(data.buttonLink, city || '', 'city-package', pkg.serviceName, pkg.id)}
                        data-analytics="photo-cta-booking-city-package"
                        className="mt-auto rounded-full bg-[#292622] px-5 py-3 text-center text-sm font-semibold text-white hover:bg-black">
                        {data.buttonText}
                    </Link>}
                </article>)}
            </div> : data.emptyMessage && <p className="mt-8 leading-relaxed">{data.emptyMessage}</p>}
        </div>
    </section>;
}
