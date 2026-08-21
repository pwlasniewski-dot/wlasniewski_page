import { AERO_SITE, type AeroPageDefinition } from '@/lib/aeroanaliza/content';

export function AeroStructuredData({ page }: { page: AeroPageDefinition }) {
    const pageUrl = `${AERO_SITE.url}${page.slug ? `/${page.slug}` : ''}`;
    const graph: Record<string, unknown>[] = [
        { '@type': 'WebPage', '@id': `${pageUrl}#webpage`, url: pageUrl, name: page.title, description: page.description, isPartOf: { '@id': `${AERO_SITE.url}/#website` }, about: { '@id': `${AERO_SITE.url}/#business` }, inLanguage: 'pl-PL' },
        { '@type': 'BreadcrumbList', '@id': `${pageUrl}#breadcrumb`, itemListElement: page.slug ? [
            { '@type': 'ListItem', position: 1, name: 'Aero Analiza', item: AERO_SITE.url },
            { '@type': 'ListItem', position: 2, name: page.serviceName || page.title, item: pageUrl },
        ] : [{ '@type': 'ListItem', position: 1, name: 'Aero Analiza', item: AERO_SITE.url }] },
    ];
    if (page.serviceName) graph.push({ '@type': 'Service', '@id': `${pageUrl}#service`, name: page.serviceName, description: page.serviceDescription || page.description, url: pageUrl, provider: { '@id': `${AERO_SITE.url}/#business` }, areaServed: { '@type': 'AdministrativeArea', name: 'województwo kujawsko-pomorskie' }, serviceType: page.serviceName });
    if (page.faqs?.length) graph.push({ '@type': 'FAQPage', '@id': `${pageUrl}#faq`, mainEntity: page.faqs.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) });

    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c') }} />;
}
