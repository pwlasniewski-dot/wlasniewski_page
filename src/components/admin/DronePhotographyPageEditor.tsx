'use client';

import { useState, type ReactNode } from 'react';
import { Copy, Eye, EyeOff, Image as ImageIcon, MoveDown, MoveUp, Plus, Trash2 } from 'lucide-react';
import MediaPicker from '@/components/admin/MediaPicker';
import {
    DEFAULT_DRONE_PHOTOGRAPHY_CONFIG,
    type DronePhotographyConfig,
    type DronePhotographyModule,
    type DronePhotographyPackage,
} from '@/lib/dronePhotographyOffer';

const inputClass = 'w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-gold-500';
const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400';

type MediaTarget = { moduleId: string; field: 'hero' | 'portfolio'; index?: number } | null;

export default function DronePhotographyPageEditor({
    value,
    onChange,
}: {
    value: DronePhotographyConfig;
    onChange: (value: DronePhotographyConfig) => void;
}) {
    const [mediaTarget, setMediaTarget] = useState<MediaTarget>(null);

    function patchConfig(patch: Partial<DronePhotographyConfig>) {
        onChange({ ...value, ...patch });
    }

    function patchModule(id: string, patch: Record<string, unknown>) {
        patchConfig({ modules: value.modules.map(module => module.id === id ? { ...module, ...patch } as DronePhotographyModule : module) });
    }

    function moveModule(index: number, direction: -1 | 1) {
        const target = index + direction;
        if (target < 0 || target >= value.modules.length) return;
        const modules = [...value.modules];
        [modules[index], modules[target]] = [modules[target], modules[index]];
        patchConfig({ modules });
    }

    function duplicateModule(module: DronePhotographyModule) {
        const copy = JSON.parse(JSON.stringify(module)) as DronePhotographyModule;
        copy.id = `${module.type}-${Date.now()}`;
        const index = value.modules.findIndex(item => item.id === module.id);
        const modules = [...value.modules];
        modules.splice(index + 1, 0, copy);
        patchConfig({ modules });
    }

    function addModule(type: DronePhotographyModule['type']) {
        const template = DEFAULT_DRONE_PHOTOGRAPHY_CONFIG.modules.find(module => module.type === type);
        if (!template) return;
        const module = JSON.parse(JSON.stringify(template)) as DronePhotographyModule;
        module.id = `${type}-${Date.now()}`;
        patchConfig({ modules: [...value.modules, module] });
    }

    function patchPackage(index: number, patch: Partial<DronePhotographyPackage>) {
        patchConfig({ packages: value.packages.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
    }

    function movePackage(index: number, direction: -1 | 1) {
        const target = index + direction;
        if (target < 0 || target >= value.packages.length) return;
        const packages = [...value.packages];
        [packages[index], packages[target]] = [packages[target], packages[index]];
        patchConfig({ packages });
    }

    function addPackage() {
        patchConfig({
            packages: [...value.packages, {
                slug: `nowy-pakiet-${Date.now()}`,
                name: 'Nowy pakiet', shortName: 'Nowy pakiet', audience: 'nieruchomosc', price: 0,
                summary: '', delivery: '', features: ['Zakres pakietu'], active: false,
            }],
        });
    }

    function selectMedia(url: string | string[]) {
        if (!mediaTarget) return;
        const selected = Array.isArray(url) ? url[0] : url;
        const module = value.modules.find(item => item.id === mediaTarget.moduleId);
        if (!module || !selected) return;
        if (mediaTarget.field === 'hero' && module.type === 'hero') patchModule(module.id, { image: selected });
        if (mediaTarget.field === 'portfolio' && module.type === 'portfolio') {
            const images = [...module.images];
            if (typeof mediaTarget.index === 'number') images[mediaTarget.index] = { ...images[mediaTarget.index], url: selected };
            else images.push({ id: `image-${Date.now()}`, url: selected, alt: 'Zdjęcie wykonane z drona' });
            patchModule(module.id, { images });
        }
        setMediaTarget(null);
    }

    return (
        <div className="space-y-8">
            <section className="rounded-xl border border-gold-500/30 bg-gold-500/5 p-5">
                <h3 className="text-lg font-semibold text-white">Wygląd i obszar działania</h3>
                <p className="mt-1 text-sm text-zinc-400">Bezpieczne warianty zachowują czytelność i spójność strony.</p>
                <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Select label="Paleta" value={value.theme.palette} onChange={palette => patchConfig({ theme: { ...value.theme, palette: palette as DronePhotographyConfig['theme']['palette'] } })} options={[['sand', 'Piaskowa'], ['pearl', 'Jasna'], ['charcoal', 'Grafitowa']]} />
                    <Select label="Kolor akcentu" value={value.theme.accent} onChange={accent => patchConfig({ theme: { ...value.theme, accent: accent as DronePhotographyConfig['theme']['accent'] } })} options={[['gold', 'Złoty'], ['copper', 'Miedziany'], ['forest', 'Zielony']]} />
                    <Select label="Font nagłówków" value={value.theme.headingFont} onChange={headingFont => patchConfig({ theme: { ...value.theme, headingFont: headingFont as DronePhotographyConfig['theme']['headingFont'] } })} options={[['display', 'Firmowy'], ['serif', 'Szeryfowy'], ['sans', 'Prosty']]} />
                    <Select label="Font tekstu" value={value.theme.bodyFont} onChange={bodyFont => patchConfig({ theme: { ...value.theme, bodyFont: bodyFont as DronePhotographyConfig['theme']['bodyFont'] } })} options={[['sans', 'Prosty'], ['serif', 'Szeryfowy']]} />
                </div>
                <div className="mt-4">
                    <label className={labelClass}>Miasta i obszary — po jednym w wierszu</label>
                    <textarea className={inputClass} rows={3} value={value.areas.join('\n')} onChange={event => patchConfig({ areas: lines(event.target.value) })} />
                </div>
            </section>

            <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <h3 className="text-lg font-semibold text-white">SEO i udostępnianie</h3>
                <p className="mt-1 text-sm text-zinc-400">Meta title i meta description pozostają w głównej sekcji SEO formularza strony. Tutaj ustawiasz canonical oraz wygląd linku w social mediach.</p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <Field label="Canonical" value={value.seo.canonical} onChange={canonical => patchConfig({ seo: { ...value.seo, canonical } })} />
                    <Field label="Obraz Open Graph" value={value.seo.ogImage} onChange={ogImage => patchConfig({ seo: { ...value.seo, ogImage } })} />
                    <Field label="Tytuł Open Graph" value={value.seo.ogTitle} onChange={ogTitle => patchConfig({ seo: { ...value.seo, ogTitle } })} />
                    <Field label="Opis Open Graph" value={value.seo.ogDescription} onChange={ogDescription => patchConfig({ seo: { ...value.seo, ogDescription } })} multiline />
                </div>
            </section>

            <section className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><h3 className="text-lg font-semibold text-white">Pakiety — jedno źródło ceny</h3><p className="mt-1 text-sm text-zinc-400">Te dane zasilają ofertę, rezerwację, zgłoszenie, analitykę i schema.org.</p></div>
                    <button type="button" onClick={addPackage} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black"><Plus size={16} /> Dodaj pakiet</button>
                </div>
                <div className="mt-5 space-y-4">
                    {value.packages.map((item, index) => (
                        <div key={`${item.slug}-${index}`} className="rounded-lg border border-zinc-700 bg-zinc-950/60 p-4">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <strong className="text-white">{index + 1}. {item.name}</strong>
                                <div className="flex gap-1">
                                    <IconButton label="W górę" onClick={() => movePackage(index, -1)} disabled={index === 0}><MoveUp size={16} /></IconButton>
                                    <IconButton label="W dół" onClick={() => movePackage(index, 1)} disabled={index === value.packages.length - 1}><MoveDown size={16} /></IconButton>
                                    <IconButton label="Usuń" danger onClick={() => patchConfig({ packages: value.packages.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={16} /></IconButton>
                                </div>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                                <Field label="Nazwa" value={item.name} onChange={name => patchPackage(index, { name })} />
                                <Field label="Krótka nazwa" value={item.shortName} onChange={shortName => patchPackage(index, { shortName })} />
                                <Field label="Identyfikator" value={item.slug} onChange={slug => patchPackage(index, { slug: slugify(slug) })} />
                                <Select label="Odbiorca" value={item.audience} onChange={audience => patchPackage(index, { audience: audience as DronePhotographyPackage['audience'] })} options={[['nieruchomosc', 'Nieruchomość'], ['firma', 'Firma'], ['slub', 'Ślub']]} />
                                <Field label="Cena w zł" value={String(item.price)} type="number" onChange={price => patchPackage(index, { price: Math.max(0, Number(price) || 0) })} />
                                <Field label="Prefiks ceny" value={item.pricePrefix || ''} onChange={pricePrefix => patchPackage(index, { pricePrefix })} placeholder="np. od lub +" />
                                <label className="flex items-center gap-2 pt-6 text-sm text-zinc-300"><input type="checkbox" checked={item.active !== false} onChange={event => patchPackage(index, { active: event.target.checked })} /> Aktywny</label>
                                <label className="flex items-center gap-2 pt-6 text-sm text-zinc-300"><input type="checkbox" checked={Boolean(item.featured)} onChange={event => patchPackage(index, { featured: event.target.checked })} /> Najczęściej wybierany</label>
                            </div>
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                                <Field label="Opis" value={item.summary} onChange={summary => patchPackage(index, { summary })} multiline />
                                <Field label="Termin oddania" value={item.delivery} onChange={delivery => patchPackage(index, { delivery })} multiline />
                            </div>
                            <div className="mt-3"><label className={labelClass}>Zakres — po jednym punkcie w wierszu</label><textarea className={inputClass} rows={4} value={item.features.join('\n')} onChange={event => patchPackage(index, { features: lines(event.target.value) })} /></div>
                        </div>
                    ))}
                </div>
            </section>

            <BookingEditor value={value} onChange={patchConfig} />

            <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><h3 className="text-lg font-semibold text-white">Moduły strony</h3><p className="mt-1 text-sm text-zinc-400">Możesz ukrywać, kopiować, usuwać i zmieniać kolejność sekcji.</p></div>
                    <div className="flex flex-wrap gap-2">
                        {(['hero', 'use_cases', 'packages', 'wedding', 'portfolio', 'equipment', 'faq', 'cta'] as DronePhotographyModule['type'][]).map(type => <button key={type} type="button" onClick={() => addModule(type)} className="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-gold-500"><Plus size={14} className="mr-1 inline" />{moduleLabel(type)}</button>)}
                    </div>
                </div>
                <div className="mt-6 space-y-5">
                    {value.modules.map((module, index) => (
                        <div key={module.id} className={`rounded-xl border p-4 ${module.enabled ? 'border-zinc-700 bg-zinc-950/60' : 'border-zinc-800 bg-zinc-950/30 opacity-70'}`}>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div><span className="text-xs font-bold uppercase tracking-widest text-gold-500">{moduleLabel(module.type)}</span><p className="mt-1 font-mono text-xs text-zinc-600">{module.id}</p></div>
                                <div className="flex gap-1">
                                    <IconButton label={module.enabled ? 'Ukryj' : 'Pokaż'} onClick={() => patchModule(module.id, { enabled: !module.enabled })}>{module.enabled ? <Eye size={16} /> : <EyeOff size={16} />}</IconButton>
                                    <IconButton label="Kopiuj" onClick={() => duplicateModule(module)}><Copy size={16} /></IconButton>
                                    <IconButton label="W górę" onClick={() => moveModule(index, -1)} disabled={index === 0}><MoveUp size={16} /></IconButton>
                                    <IconButton label="W dół" onClick={() => moveModule(index, 1)} disabled={index === value.modules.length - 1}><MoveDown size={16} /></IconButton>
                                    <IconButton label="Usuń" danger onClick={() => patchConfig({ modules: value.modules.filter(item => item.id !== module.id) })}><Trash2 size={16} /></IconButton>
                                </div>
                            </div>
                            <div className="mt-4"><Select label="Tło modułu" value={module.tone} onChange={tone => patchModule(module.id, { tone })} options={[['light', 'Jasne'], ['sand', 'Piaskowe'], ['dark', 'Ciemne']]} /></div>
                            <div className="mt-4"><ModuleFields module={module} packages={value.packages} patch={patch => patchModule(module.id, patch)} pickMedia={(field, imageIndex) => setMediaTarget({ moduleId: module.id, field, index: imageIndex })} /></div>
                        </div>
                    ))}
                </div>
            </section>

            <MediaPicker isOpen={Boolean(mediaTarget)} onClose={() => setMediaTarget(null)} onSelect={selectMedia} multiple={false} />
        </div>
    );
}

function BookingEditor({ value, onChange }: { value: DronePhotographyConfig; onChange: (patch: Partial<DronePhotographyConfig>) => void }) {
    const booking = value.booking;
    const patch = (data: Partial<typeof booking>) => onChange({ booking: { ...booking, ...data } });
    return <section className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-5">
        <h3 className="text-lg font-semibold text-white">Teksty formularza rezerwacji</h3>
        <p className="mt-1 text-sm text-zinc-400">Zmiany pojawią się na /rezerwacja/dron.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Nadtytuł" value={booking.eyebrow} onChange={eyebrow => patch({ eyebrow })} />
            <Field label="Nagłówek" value={booking.title} onChange={title => patch({ title })} />
            <Field label="Opis" value={booking.description} onChange={description => patch({ description })} multiline />
            <div><label className={labelClass}>Korzyści — po jednej w wierszu</label><textarea className={inputClass} rows={4} value={booking.benefits.join('\n')} onChange={event => patch({ benefits: lines(event.target.value) })} /></div>
            <Field label="Nagłówek pakietów" value={booking.packageLegend} onChange={packageLegend => patch({ packageLegend })} />
            <Field label="Nagłówek miejsca" value={booking.locationLegend} onChange={locationLegend => patch({ locationLegend })} />
            <Field label="Nagłówek kontaktu" value={booking.contactLegend} onChange={contactLegend => patch({ contactLegend })} />
            <Field label="Etykieta zadania" value={booking.goalLabel} onChange={goalLabel => patch({ goalLabel })} />
            <div><label className={labelClass}>Cele klienta — po jednym w wierszu</label><textarea className={inputClass} rows={4} value={booking.goalOptions.join('\n')} onChange={event => patch({ goalOptions: lines(event.target.value) })} /></div>
            <Field label="Etykieta miejscowości" value={booking.cityLabel} onChange={cityLabel => patch({ cityLabel })} />
            <Field label="Podpowiedź miejscowości" value={booking.cityPlaceholder} onChange={cityPlaceholder => patch({ cityPlaceholder })} />
            <Field label="Etykieta daty" value={booking.dateLabel} onChange={dateLabel => patch({ dateLabel })} />
            <Field label="Etykieta adresu" value={booking.addressLabel} onChange={addressLabel => patch({ addressLabel })} />
            <Field label="Podpowiedź adresu" value={booking.addressPlaceholder} onChange={addressPlaceholder => patch({ addressPlaceholder })} />
            <Field label="Etykieta imienia" value={booking.clientNameLabel} onChange={clientNameLabel => patch({ clientNameLabel })} />
            <Field label="Etykieta firmy" value={booking.companyLabel} onChange={companyLabel => patch({ companyLabel })} />
            <Field label="Etykieta e-mail" value={booking.emailLabel} onChange={emailLabel => patch({ emailLabel })} />
            <Field label="Etykieta telefonu" value={booking.phoneLabel} onChange={phoneLabel => patch({ phoneLabel })} />
            <Field label="Etykieta notatki" value={booking.notesLabel} onChange={notesLabel => patch({ notesLabel })} />
            <Field label="Podpowiedź notatki" value={booking.notesPlaceholder} onChange={notesPlaceholder => patch({ notesPlaceholder })} multiline />
            <Field label="Treść zgody" value={booking.consentText} onChange={consentText => patch({ consentText })} multiline />
            <Field label="Informacja o płatności" value={booking.noPaymentText} onChange={noPaymentText => patch({ noPaymentText })} />
            <Field label="Przycisk wysłania" value={booking.submitLabel} onChange={submitLabel => patch({ submitLabel })} />
            <Field label="Nagłówek po wysłaniu" value={booking.successTitle} onChange={successTitle => patch({ successTitle })} />
            <Field label="Komunikat po wysłaniu" value={booking.successText} onChange={successText => patch({ successText })} multiline />
            <Field label="Etykieta numeru zgłoszenia" value={booking.successNumberLabel} onChange={successNumberLabel => patch({ successNumberLabel })} />
            <Field label="Powrót do oferty" value={booking.backToOfferLabel} onChange={backToOfferLabel => patch({ backToOfferLabel })} />
            <Field label="Przycisk konta" value={booking.accountLabel} onChange={accountLabel => patch({ accountLabel })} />
            <Field label="Link polityki prywatności" value={booking.privacyLabel} onChange={privacyLabel => patch({ privacyLabel })} />
            <Field label="Tekst podczas wysyłania" value={booking.sendingLabel} onChange={sendingLabel => patch({ sendingLabel })} />
        </div>
    </section>;
}

function ModuleFields({ module, packages, patch, pickMedia }: { module: DronePhotographyModule; packages: DronePhotographyPackage[]; patch: (data: Record<string, unknown>) => void; pickMedia: (field: 'hero' | 'portfolio', index?: number) => void }) {
    if (module.type === 'hero') return <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nadtytuł" value={module.eyebrow} onChange={eyebrow => patch({ eyebrow })} />
        <Field label="Tytuł" value={module.title} onChange={title => patch({ title })} />
        <Field label="Wyróżniona część tytułu" value={module.titleAccent} onChange={titleAccent => patch({ titleAccent })} />
        <Field label="Opis" value={module.description} onChange={description => patch({ description })} multiline />
        <Field label="Etykieta ceny" value={module.priceLabel} onChange={priceLabel => patch({ priceLabel })} />
        <Field label="Tekst przycisku" value={module.ctaLabel} onChange={ctaLabel => patch({ ctaLabel })} />
        <Field label="Link przycisku" value={module.ctaHref} onChange={ctaHref => patch({ ctaHref })} />
        <div><label className={labelClass}>Zdjęcie hero</label><div className="flex gap-2"><input className={inputClass} value={module.image} onChange={event => patch({ image: event.target.value })} /><button type="button" onClick={() => pickMedia('hero')} className="rounded bg-zinc-800 px-3 text-zinc-200"><ImageIcon size={17} /></button></div></div>
        <Field label="Alt zdjęcia" value={module.imageAlt} onChange={imageAlt => patch({ imageAlt })} />
        <div><label className={labelClass}>Paski zaufania — po jednym w wierszu</label><textarea className={inputClass} rows={4} value={module.badges.join('\n')} onChange={event => patch({ badges: lines(event.target.value) })} /></div>
    </div>;

    if (module.type === 'use_cases') return <Repeater items={module.items} addLabel="Dodaj zastosowanie" onChange={items => patch({ items })} create={() => ({ id: `case-${Date.now()}`, icon: 'camera' as const, eyebrow: '', title: 'Nowe zastosowanie', description: '', href: '#pakiety' })} render={(item, update) => <div className="grid gap-3 md:grid-cols-2"><Field label="Nadtytuł" value={item.eyebrow} onChange={eyebrow => update({ eyebrow })} /><Field label="Tytuł" value={item.title} onChange={title => update({ title })} /><Field label="Opis" value={item.description} onChange={description => update({ description })} multiline /><Field label="Link" value={item.href} onChange={href => update({ href })} /><Select label="Ikona" value={item.icon} onChange={icon => update({ icon: icon as typeof item.icon })} options={[['building', 'Budynek'], ['camera', 'Aparat'], ['heart', 'Serce']]} /></div>} />;

    if (module.type === 'packages') return <div className="grid gap-3 md:grid-cols-2"><Field label="Nadtytuł" value={module.eyebrow} onChange={eyebrow => patch({ eyebrow })} /><Field label="Tytuł" value={module.title} onChange={title => patch({ title })} /><Field label="Opis" value={module.description} onChange={description => patch({ description })} multiline /><Field label="Tekst przycisku" value={module.bookingButtonLabel} onChange={bookingButtonLabel => patch({ bookingButtonLabel })} /><Field label="Etykieta wyróżnionego pakietu" value={module.featuredLabel} onChange={featuredLabel => patch({ featuredLabel })} /><Field label="Etykieta obszaru" value={module.areaLabel} onChange={areaLabel => patch({ areaLabel })} /></div>;

    if (module.type === 'wedding') return <div className="grid gap-3 md:grid-cols-2"><Field label="Nadtytuł" value={module.eyebrow} onChange={eyebrow => patch({ eyebrow })} /><Field label="Tytuł" value={module.title} onChange={title => patch({ title })} /><Field label="Opis" value={module.description} onChange={description => patch({ description })} multiline /><Select label="Pakiet" value={module.packageSlug} onChange={packageSlug => patch({ packageSlug })} options={packages.map(item => [item.slug, item.name] as const)} /><Field label="Przycisk rezerwacji" value={module.bookingButtonLabel} onChange={bookingButtonLabel => patch({ bookingButtonLabel })} /><Field label="Drugi przycisk" value={module.secondaryButtonLabel} onChange={secondaryButtonLabel => patch({ secondaryButtonLabel })} /><Field label="Link drugiego przycisku" value={module.secondaryButtonHref} onChange={secondaryButtonHref => patch({ secondaryButtonHref })} /></div>;

    if (module.type === 'portfolio') return <div className="space-y-4"><div className="grid gap-3 md:grid-cols-2"><Field label="Nadtytuł" value={module.eyebrow} onChange={eyebrow => patch({ eyebrow })} /><Field label="Tytuł" value={module.title} onChange={title => patch({ title })} /><Select label="Źródło" value={module.source} onChange={source => patch({ source })} options={[['portfolio', 'Kategoria portfolio'], ['manual', 'Zdjęcia ręczne']]} /><Field label="Kategoria portfolio" value={module.categorySlug} onChange={categorySlug => patch({ categorySlug: slugify(categorySlug) })} /><Field label="Limit zdjęć" value={String(module.limit)} type="number" onChange={limit => patch({ limit: Math.max(1, Number(limit) || 1) })} /></div>{module.source === 'manual' ? <div><button type="button" onClick={() => pickMedia('portfolio')} className="mb-3 inline-flex items-center gap-2 rounded bg-gold-500 px-3 py-2 text-sm font-semibold text-black"><Plus size={15} /> Dodaj zdjęcie</button><div className="space-y-2">{module.images.map((image, index) => <div key={image.id} className="grid gap-2 rounded border border-zinc-800 p-3 md:grid-cols-[100px_1fr_auto]"><img src={image.url} alt="" className="h-20 w-24 object-cover" /><div className="space-y-2"><input className={inputClass} value={image.url} onChange={event => patch({ images: module.images.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item) })} /><input className={inputClass} value={image.alt} onChange={event => patch({ images: module.images.map((item, itemIndex) => itemIndex === index ? { ...item, alt: event.target.value } : item) })} placeholder="Opis zdjęcia dla Google" /></div><div className="flex gap-1"><IconButton label="Zmień" onClick={() => pickMedia('portfolio', index)}><ImageIcon size={15} /></IconButton><IconButton label="Usuń" danger onClick={() => patch({ images: module.images.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={15} /></IconButton></div></div>)}</div></div> : null}</div>;

    if (module.type === 'equipment') return <Repeater items={module.cards} addLabel="Dodaj kartę" onChange={cards => patch({ cards })} create={() => ({ id: `equipment-${Date.now()}`, eyebrow: '', title: 'Nowa karta', description: '', icon: 'camera' as const })} render={(item, update) => <div className="grid gap-3 md:grid-cols-2"><Field label="Nadtytuł" value={item.eyebrow} onChange={eyebrow => update({ eyebrow })} /><Field label="Tytuł" value={item.title} onChange={title => update({ title })} /><Field label="Opis" value={item.description} onChange={description => update({ description })} multiline /><Select label="Ikona" value={item.icon} onChange={icon => update({ icon: icon as typeof item.icon })} options={[['camera', 'Aparat'], ['thermal', 'Termowizja']]} /><Field label="Tekst linku" value={item.linkLabel || ''} onChange={linkLabel => update({ linkLabel })} /><Field label="Adres linku" value={item.linkHref || ''} onChange={linkHref => update({ linkHref })} /></div>} />;

    if (module.type === 'faq') return <div className="space-y-4"><div className="grid gap-3 md:grid-cols-2"><Field label="Nadtytuł" value={module.eyebrow} onChange={eyebrow => patch({ eyebrow })} /><Field label="Tytuł" value={module.title} onChange={title => patch({ title })} /><Field label="Opis" value={module.description} onChange={description => patch({ description })} multiline /></div><Repeater items={module.items} addLabel="Dodaj pytanie" onChange={items => patch({ items })} create={() => ({ id: `faq-${Date.now()}`, question: 'Nowe pytanie', answer: '' })} render={(item, update) => <div className="grid gap-3 md:grid-cols-2"><Field label="Pytanie" value={item.question} onChange={question => update({ question })} /><Field label="Odpowiedź" value={item.answer} onChange={answer => update({ answer })} multiline /></div>} /></div>;

    if (module.type === 'cta') return <div className="grid gap-3 md:grid-cols-2"><Field label="Nadtytuł" value={module.eyebrow} onChange={eyebrow => patch({ eyebrow })} /><Field label="Tytuł" value={module.title} onChange={title => patch({ title })} /><Field label="Opis" value={module.description} onChange={description => patch({ description })} multiline /><Field label="Tekst przycisku" value={module.buttonLabel} onChange={buttonLabel => patch({ buttonLabel })} /><Field label="Link przycisku" value={module.buttonHref} onChange={buttonHref => patch({ buttonHref })} /></div>;

    return null;
}

function Repeater<T extends { id: string }>({ items, onChange, create, addLabel, render }: { items: T[]; onChange: (items: T[]) => void; create: () => T; addLabel: string; render: (item: T, update: (patch: Partial<T>) => void) => ReactNode }) {
    return <div className="space-y-3"><button type="button" onClick={() => onChange([...items, create()])} className="inline-flex items-center gap-2 rounded bg-zinc-800 px-3 py-2 text-sm text-white"><Plus size={15} /> {addLabel}</button>{items.map((item, index) => <div key={item.id} className="rounded border border-zinc-800 p-3"><div className="mb-3 flex justify-end gap-1"><IconButton label="W górę" disabled={index === 0} onClick={() => onChange(swap(items, index, index - 1))}><MoveUp size={15} /></IconButton><IconButton label="W dół" disabled={index === items.length - 1} onClick={() => onChange(swap(items, index, index + 1))}><MoveDown size={15} /></IconButton><IconButton label="Usuń" danger onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></IconButton></div>{render(item, patch => onChange(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, ...patch } : entry)))}</div>)}</div>;
}

function Field({ label, value, onChange, multiline, type = 'text', placeholder }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; type?: string; placeholder?: string }) {
    return <label className="block"><span className={labelClass}>{label}</span>{multiline ? <textarea rows={3} value={value} onChange={event => onChange(event.target.value)} className={inputClass} placeholder={placeholder} /> : <input type={type} value={value} onChange={event => onChange(event.target.value)} className={inputClass} placeholder={placeholder} />}</label>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<readonly [string, string]> }) {
    return <label className="block"><span className={labelClass}>{label}</span><select value={value} onChange={event => onChange(event.target.value)} className={inputClass}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}

function IconButton({ label, children, onClick, danger, disabled }: { label: string; children: ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }) {
    return <button type="button" title={label} aria-label={label} disabled={disabled} onClick={onClick} className={`rounded p-2 disabled:opacity-25 ${danger ? 'text-red-400 hover:bg-red-950' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>{children}</button>;
}

function lines(value: string) { return value.split('\n').map(item => item.trim()).filter(Boolean); }
function slugify(value: string) { return value.toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function swap<T>(items: T[], a: number, b: number) { const next = [...items]; [next[a], next[b]] = [next[b], next[a]]; return next; }
function moduleLabel(type: DronePhotographyModule['type']) { return ({ hero: 'Hero', use_cases: 'Zastosowania', packages: 'Pakiety', wedding: 'Ślub', portfolio: 'Portfolio', equipment: 'Sprzęt', faq: 'FAQ', cta: 'CTA' } as const)[type]; }
