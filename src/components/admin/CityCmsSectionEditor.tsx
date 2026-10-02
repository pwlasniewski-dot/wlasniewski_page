'use client';

import React from 'react';
import type { PageSection } from './PageBuilder';
import { CITY_PACKAGE_SERVICES } from '@/lib/cityLanding';

export default function CityCmsSectionEditor({ section, onUpdate, chooseImage }: {
    section: PageSection; onUpdate: (id: string, value: Partial<PageSection>) => void; chooseImage: () => void;
}) {
    const update = (patch: Partial<PageSection>) => onUpdate(section.id, patch);
    const text = (label: string, key: keyof PageSection, multiline = false) => <label className="block text-sm text-zinc-300">
        {label}
        {multiline ? <textarea aria-label={label} value={String(section[key] || '')} onChange={event => update({ [key]: event.target.value })}
            className="mt-2 min-h-20 w-full rounded border border-zinc-700 bg-zinc-800 p-3 text-white" />
            : <input aria-label={label} value={String(section[key] || '')} onChange={event => update({ [key]: event.target.value })}
                className="mt-2 w-full rounded border border-zinc-700 bg-zinc-800 p-3 text-white" />}
    </label>;
    if (section.type === 'faq') return <div className="space-y-4">
        {text('Nagłówek FAQ', 'title')}{text('Wprowadzenie FAQ', 'subtitle', true)}
        {(section.faqItems || []).map((item, index) => <div key={index} className="space-y-3 rounded border border-zinc-700 p-4">
            <label className="block text-sm text-zinc-300">Pytanie {index + 1}<input aria-label={`Pytanie FAQ ${index + 1}`} value={item.question}
                onChange={event => update({ faqItems: section.faqItems?.map((old, i) => i === index ? { ...old, question: event.target.value } : old) })}
                className="mt-2 w-full rounded border border-zinc-700 bg-zinc-800 p-3 text-white" /></label>
            <label className="block text-sm text-zinc-300">Odpowiedź {index + 1}<textarea aria-label={`Odpowiedź FAQ ${index + 1}`} value={item.answer}
                onChange={event => update({ faqItems: section.faqItems?.map((old, i) => i === index ? { ...old, answer: event.target.value } : old) })}
                className="mt-2 w-full rounded border border-zinc-700 bg-zinc-800 p-3 text-white" /></label>
            <label className="text-sm text-zinc-300"><input type="checkbox" checked={item.enabled !== false}
                onChange={event => update({ faqItems: section.faqItems?.map((old, i) => i === index ? { ...old, enabled: event.target.checked } : old) })} /> Widoczne pytanie</label>
            <button type="button" onClick={() => update({ faqItems: section.faqItems?.filter((_, i) => i !== index) })} className="ml-4 text-sm text-red-400">Usuń pytanie</button>
        </div>)}
        <button type="button" onClick={() => update({ faqItems: [...(section.faqItems || []), { question: '', answer: '', enabled: true }] })} className="rounded bg-zinc-700 px-4 py-2 text-white">Dodaj pytanie FAQ</button>
    </div>;
    if (section.type === 'public_packages') return <div className="space-y-4">
        <p className="text-sm text-zinc-400">Nazwy, ceny, czas i zakres pochodzą z aktywnych pakietów w Rezerwacjach. Ten moduł nie tworzy osobnego cennika.</p>
        {text('Nagłówek pakietów', 'title')}{text('Opis modułu pakietów', 'subtitle', true)}
        <fieldset className="space-y-2"><legend className="mb-2 text-sm text-zinc-300">Usługi w module</legend>
            {CITY_PACKAGE_SERVICES.map(name => <label key={name} className="mr-5 inline-flex gap-2 text-sm text-zinc-300"><input aria-label={`Pakiety: ${name}`} type="checkbox" checked={section.serviceNames?.includes(name) || false}
                onChange={event => update({ serviceNames: event.target.checked ? [...(section.serviceNames || []), name] : section.serviceNames?.filter(old => old !== name) })} />{name}</label>)}
        </fieldset>
        {text('Tekst CTA pakietu', 'buttonText')}{text('Adres CTA pakietu', 'buttonLink')}{text('Komunikat niedostępnych pakietów', 'emptyMessage', true)}
    </div>;
    if (section.type === 'city_seo') return <div className="space-y-4">
        <p className="text-sm text-zinc-400">Meta title, description i keywords pozostają w istniejącej zakładce SEO. Puste pola społecznościowe użyją tych danych i zdjęcia hero. Canonical prowadzi do tego samego serwisu.</p>
        {text('Ścieżka canonical', 'canonicalPath')}{text('Tytuł Open Graph', 'socialTitle')}{text('Opis Open Graph', 'socialDescription', true)}
        {text('Zdjęcie Open Graph', 'socialImage')}{text('ALT zdjęcia Open Graph', 'socialImageAlt')}
        <button type="button" onClick={chooseImage} className="rounded bg-zinc-700 px-4 py-2 text-white">Wybierz zdjęcie Open Graph</button>
    </div>;
    if (section.type === 'city_inquiry') return <p className="text-sm leading-relaxed text-zinc-400">Formularz zapytania używa istniejącego lejka fotograficznego i zachowuje miasto. Jego treść i ustawienia pozostają w obecnej konfiguracji lejka. Tutaj możesz zmienić pozycję lub ukryć moduł.</p>;
    return null;
}
