import type { Metadata } from 'next';
import ProductPersonalizationPage from '@/components/shop/ProductPersonalizationPage';
export const metadata: Metadata = { title: 'Personalizacja produktu | Właśniewski', robots: { index: false, follow: false } };
export default function PersonalizationPage() { return <ProductPersonalizationPage />; }
