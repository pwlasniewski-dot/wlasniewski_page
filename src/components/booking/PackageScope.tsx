import React from 'react';
import { packageScopeLines } from '@/lib/packageScope';

export default function PackageScope({
    description,
    features,
    className = '',
}: {
    description?: string | null;
    features?: string | string[] | null;
    className?: string;
}) {
    const lines = packageScopeLines({ description, features });
    if (lines.length === 0) return null;
    return (
        <ul className={`list-disc space-y-2 pl-5 text-sm leading-relaxed ${className}`}>
            {lines.map((line, index) => <li key={index}>{line}</li>)}
        </ul>
    );
}
