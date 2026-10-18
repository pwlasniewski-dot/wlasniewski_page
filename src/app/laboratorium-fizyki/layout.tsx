import type { Metadata } from 'next';
import './lab-core.css';
import './lab-content.css';
import './lab-runner.css';
import './lab-test-entry.css';
import './lab-responsive.css';

export const metadata: Metadata = {
    title: 'Laboratorium Fizyki',
    description: 'Interaktywne doświadczenia, animacje i testy z fizyki.',
    robots: { index: false, follow: false },
};

export default function PhysicsLabLayout({ children }: { children: React.ReactNode }) {
    return children;
}
