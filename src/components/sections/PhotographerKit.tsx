import React from 'react';
import type { PageSection, EquipmentGroup } from '@/components/admin/PageBuilder';
import { documentUrl } from '@/lib/documentDownload';

function EquipmentIcon({ kind }: { kind: EquipmentGroup['kind'] }) {
    return <svg viewBox="0 0 72 56" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {kind === 'camera' ? <><path d="M9 17h12l5-7h19l5 7h13v32H9z" /><path d="M14 17v-5h7v5M51 23h6" /><circle cx="36" cy="33" r="15" /><circle cx="36" cy="33" r="10" /><path d="M29 29a8 8 0 0 1 10-3" /></>
            : kind === 'lens' ? <><ellipse cx="36" cy="10" rx="17" ry="6" /><path d="M19 10v34c0 8 34 8 34 0V10M19 20c0 8 34 8 34 0M19 37c0 8 34 8 34 0M25 25v8m7-7v8m8-8v8m7-9v8" /></>
            : <><path d="M25 9h25v17H25zM29 13h17v9H29zM30 26l-3 6v16h16V32l-4-6M31 48v5h10M10 15l8 2M15 5l6 5M57 8l5-5M57 20l8 2" /><path d="M35 34l-4 6h7l-4 5" /></>}
    </svg>;
}

export default function PhotographerKit({ data }: { data: PageSection }) {
    const portrait = documentUrl(data.image);
    const groups = (Array.isArray(data.equipment) ? data.equipment : []).filter(group => group.enabled !== false).slice(0,12);
    return <section id={data.id} className={`photographer-kit ${data.sectionTone === 'dark' ? 'photographer-kit-dark' : ''}`}>
        <div className="photographer-kit-layout">
            <figure className="photographer-kit-portrait">
                {portrait && <img src={portrait} alt={data.imageAlt || ''} loading="lazy" width="1945" height="1296" style={{ '--kit-crop': data.imagePosition || 'center center', '--kit-crop-mobile': data.imagePositionMobile || data.imagePosition || 'center center' } as React.CSSProperties} />}
                {(data.label || data.content) && <figcaption>{data.label && <strong>{data.label}</strong>}{data.content && <span>{data.content}</span>}</figcaption>}
            </figure>
            <div className="photographer-kit-copy">
                {data.tag && <p className="photographer-kit-eyebrow">{data.tag}</p>}
                {data.title && <h2>{data.title}</h2>}
                {data.description && <p className="photographer-kit-intro">{data.description}</p>}
                <div className="photographer-kit-equipment">
                    {groups.map(group => <article key={group.id} className="photographer-kit-group">
                        <div className="photographer-kit-count">{String(group.quantity).padStart(2,'0')}</div>
                        <div className="photographer-kit-models">
                            <h3>{group.title}</h3>
                            <ul>{group.items.map((model,index) => <li key={index}>{model}</li>)}</ul>
                        </div>
                        <div className="photographer-kit-symbols">{Array.from({length:Math.max(1,Math.min(4,group.quantity || 1))},(_,index) => <EquipmentIcon key={index} kind={group.kind} />)}</div>
                    </article>)}
                </div>
                {data.subtitle && <p className="photographer-kit-note">{data.subtitle}</p>}
            </div>
        </div>
    </section>;
}
