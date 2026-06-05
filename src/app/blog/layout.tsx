import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Blog Fotografa | Porady Fotograficzne — Fotograf Toruń',
    description: 'Blog Przemysława Właśniewskiego — fotograf z Torunia. Porady fotograficzne, inspiracje do sesji rodzinnych i ślubnych, stylizacja na sesję i kulisy pracy.',
    alternates: {
        canonical: 'https://wlasniewski.pl/blog',
    },
    openGraph: {
        title: 'Blog Fotografa | Porady i Inspiracje — Toruń',
        description: 'Porady fotograficzne, inspiracje i kulisy pracy fotografa w Toruniu.',
        url: 'https://wlasniewski.pl/blog',
    },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
