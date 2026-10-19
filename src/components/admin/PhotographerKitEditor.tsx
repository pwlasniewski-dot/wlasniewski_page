import React from 'react';
import type { PageSection, EquipmentGroup } from './PageBuilder';

export default function PhotographerKitEditor({ section, onUpdate, chooseImage }: {
    section: PageSection; onUpdate: (id: string, data: Partial<PageSection>) => void; chooseImage: () => void;
}) {
    const field = 'mt-1 w-full rounded border border-zinc-700 bg-zinc-800 p-2 text-white';
    const groups = section.equipment || [];
    const updateGroup = (index: number, patch: Partial<EquipmentGroup>) => onUpdate(section.id, { equipment: groups.map((group,i) => i === index ? {...group,...patch} : group) });
    const move = (index: number, direction: number) => { const next = [...groups]; const target = index + direction; if(target < 0 || target >= next.length) return; [next[index],next[target]]=[next[target],next[index]]; onUpdate(section.id,{equipment:next}); };
    return <div className="space-y-4 text-sm text-zinc-300">
        <div className="grid gap-3 sm:grid-cols-2">{([['tag','Napis nad nagłówkiem'],['title','Nagłówek'],['label','Podpis zdjęcia / imię i nazwisko'],['content','Drugi wiersz podpisu'],['subtitle','Podsumowanie zestawu'],['imageAlt','Opis alternatywny zdjęcia']] as const).map(([key,label]) => <label key={key}>{label}<input value={section[key] || ''} onChange={e => onUpdate(section.id,{[key]:e.target.value})} className={field} /></label>)}</div>
        <label className="block">Wprowadzenie<textarea value={section.description || ''} onChange={e => onUpdate(section.id,{description:e.target.value})} className={field} /></label>
        {section.image && <img src={section.image} alt="" className="h-32 w-48 rounded object-cover" />}
        <div className="flex gap-3"><button type="button" onClick={chooseImage} className="rounded bg-zinc-700 px-4 py-2">Wybierz portret</button><button type="button" onClick={() => onUpdate(section.id,{image:''})}>Usuń zdjęcie</button></div>
        <label className="block">Adres zdjęcia<input value={section.image || ''} onChange={e => onUpdate(section.id,{image:e.target.value})} className={field} /></label>
        <div className="grid gap-3 sm:grid-cols-3">
            {(['imagePosition','imagePositionMobile'] as const).map((key,index) => <label key={key}>Kadr: {index ? 'telefon' : 'komputer'}<select value={section[key] || 'center center'} onChange={e => onUpdate(section.id,{[key]:e.target.value})} className={field}>{['left center','30% center','35% center','center center','right center','center top'].map(value => <option key={value}>{value}</option>)}</select></label>)}
            <label>Kolorystyka<select value={section.sectionTone || 'paper'} onChange={e => onUpdate(section.id,{sectionTone:e.target.value === 'dark' ? 'dark' : 'paper'})} className={field}><option value="paper">Jasny papier</option><option value="dark">Butelkowa zieleń</option></select></label>
        </div>
        {groups.map((group,index) => <fieldset key={group.id} className="space-y-3 rounded border border-zinc-700 p-4">
            <legend className="px-2">{group.title || 'Grupa sprzętu'}</legend>
            <div className="grid gap-3 sm:grid-cols-3">
                <label>Rodzaj<select value={group.kind} onChange={e => updateGroup(index,{kind:e.target.value as EquipmentGroup['kind']})} className={field}><option value="camera">Aparaty</option><option value="lens">Obiektywy</option><option value="flash">Lampy błyskowe</option></select></label>
                <label>Liczba<input type="number" min="1" max="99" value={group.quantity} onChange={e => updateGroup(index,{quantity:Number(e.target.value)})} className={field} /></label>
                <label>Nazwa grupy<input value={group.title} onChange={e => updateGroup(index,{title:e.target.value})} className={field} /></label>
            </div>
            <label className="block">Modele — każdy w osobnym wierszu<textarea value={group.items.join('\n')} onChange={e => updateGroup(index,{items:e.target.value.split('\n')})} className={field} /></label>
            <div className="flex flex-wrap gap-4"><label><input type="checkbox" checked={group.enabled !== false} onChange={e => updateGroup(index,{enabled:e.target.checked})} /> Widoczna</label><button type="button" onClick={() => move(index,-1)} disabled={index === 0}>W górę</button><button type="button" onClick={() => move(index,1)} disabled={index === groups.length-1}>W dół</button><button type="button" onClick={() => onUpdate(section.id,{equipment:groups.filter((_,i) => i !== index)})} className="text-red-300">Usuń grupę</button></div>
        </fieldset>)}
        <button type="button" disabled={groups.length >= 12} onClick={() => onUpdate(section.id,{equipment:[...groups,{id:crypto.randomUUID(),kind:'camera',quantity:1,title:'',items:[],enabled:true}]})} className="rounded bg-zinc-700 px-4 py-2">Dodaj grupę sprzętu</button>
    </div>;
}
