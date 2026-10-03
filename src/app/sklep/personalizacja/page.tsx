import type { Metadata } from 'next';
import PersonalizationShop from '@/components/shop/PersonalizationShop';
export const metadata: Metadata = { title: 'Personalizacja produktu | Właśniewski', robots: { index: false, follow: false } };
export default function PersonalizationPage() { return <PersonalizationShop />; }
