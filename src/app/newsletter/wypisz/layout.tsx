import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Rezygnacja z newslettera',
    description: 'Zarządzanie dobrowolną zgodą na newsletter.',
    robots: { index: false, follow: false },
};

export default function NewsletterUnsubscribeLayout({ children }: { children: React.ReactNode }) {
    return children;
}
