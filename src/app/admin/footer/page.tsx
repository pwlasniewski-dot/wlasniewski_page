'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api-config';
import { Save, Plus, Trash2, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';

interface FooterLink {
    id: string;
    label: string;
    url: string;
}

interface FooterSection {
    title: string;
    enabled: boolean;
    links: FooterLink[];
}

interface FooterSettings {
    brand_name: string;
    tagline: string;
    phone: string;
    email: string;
    facebook_url: string;
    instagram_url: string;
    sections: {
        oferta: FooterSection;
        lokalnie: FooterSection;
        inne: FooterSection;
    };
}

const defaultSettings: FooterSettings = {
    brand_name: 'Przemysław Właśniewski — Fotograf',
    tagline: 'Naturalne zdjęcia rodzinne, ślubne, portretowe i komunijne. Toruń, Lisewo, Wąbrzeźno, Płużnica i okolice.',
    phone: '+48 530 788 694',
    email: 'przemyslaw@wlasniewski.pl',
    facebook_url: 'https://www.facebook.com/przemyslaw.wlasniewski.fotografia',
    instagram_url: 'https://www.instagram.com/wlasniewski.pl/',
    sections: {
        oferta: {
            title: 'Oferta',
            enabled: true,
            links: [
                { id: '1', label: 'Fotografia rodzinna', url: '/portfolio/family' },
                { id: '2', label: 'Fotografia ślubna', url: '/portfolio/wedding' },
                { id: '3', label: 'Portret i wizerunkowa', url: '/portfolio/portrait' },
                { id: '4', label: 'Fotografia komunijna', url: '/portfolio/communion' },
            ]
        },
        lokalnie: {
            title: 'Lokalnie',
            enabled: true,
            links: [
                { id: '1', label: 'Fotograf Toruń', url: '/fotograf-torun' },
                { id: '2', label: 'Fotograf Lisewo', url: '/fotograf-lisewo' },
                { id: '3', label: 'Fotograf Wąbrzeźno', url: '/fotograf-wabrzezno' },
            ]
        },
        inne: {
            title: 'Inne',
            enabled: true,
            links: [
                { id: '1', label: 'O mnie', url: '/o-mnie' },
                { id: '2', label: 'Jak się ubrać', url: '/jak-sie-ubrac' },
                { id: '3', label: 'Blog', url: '/blog' },
            ]
        }
    }
};

export default function FooterSettingsPage() {
    const [settings, setSettings] = useState<FooterSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch(getApiUrl('settings'));
            const data = await res.json();
            if (data.success && data.settings?.footer_config) {
                try {
                    const footerConfig = JSON.parse(data.settings.footer_config);
                    setSettings({ ...defaultSettings, ...footerConfig });
                } catch (e) {
                    console.error('Failed to parse footer config');
                }
            }
        } catch (error) {
            console.error('Failed to fetch settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl('settings'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    footer_config: JSON.stringify(settings)
                }),
            });

            if (res.ok) {
                toast.success('Zapisano ustawienia stopki');
            } else {
                throw new Error('Save failed');
            }
        } catch (error) {
            toast.error('Błąd zapisu');
        } finally {
            setSaving(false);
        }
    };

    const addLink = (section: 'oferta' | 'lokalnie' | 'inne') => {
        const newLink: FooterLink = {
            id: Date.now().toString(),
            label: 'Nowy link',
            url: '/'
        };
        setSettings(prev => ({
            ...prev,
            sections: {
                ...prev.sections,
                [section]: {
                    ...prev.sections[section],
                    links: [...prev.sections[section].links, newLink]
                }
            }
        }));
    };

    const updateLink = (section: 'oferta' | 'lokalnie' | 'inne', linkId: string, field: 'label' | 'url', value: string) => {
        setSettings(prev => ({
            ...prev,
            sections: {
                ...prev.sections,
                [section]: {
                    ...prev.sections[section],
                    links: prev.sections[section].links.map(link =>
                        link.id === linkId ? { ...link, [field]: value } : link
                    )
                }
            }
        }));
    };

    const removeLink = (section: 'oferta' | 'lokalnie' | 'inne', linkId: string) => {
        setSettings(prev => ({
            ...prev,
            sections: {
                ...prev.sections,
                [section]: {
                    ...prev.sections[section],
                    links: prev.sections[section].links.filter(link => link.id !== linkId)
                }
            }
        }));
    };

    if (loading) return <div className="text-white p-8">Ładowanie...</div>;

    return (
        <div className="max-w-4xl pb-20">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-display font-semibold text-white">Zarządzanie stopką</h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-gold-500 hover:bg-gold-400 focus:outline-none disabled:opacity-50"
                >
                    <Save className="-ml-1 mr-2 h-5 w-5" />
                    {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
                </button>
            </div>

            <div className="space-y-8">
                {/* Brand Info */}
                <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
                    <h2 className="text-lg font-medium text-white mb-4">Informacje podstawowe</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Nazwa firmy</label>
                            <input
                                type="text"
                                value={settings.brand_name}
                                onChange={e => setSettings(s => ({ ...s, brand_name: e.target.value }))}
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Opis (tagline)</label>
                            <textarea
                                value={settings.tagline}
                                onChange={e => setSettings(s => ({ ...s, tagline: e.target.value }))}
                                rows={2}
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white px-3 py-2"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Telefon</label>
                                <input
                                    type="text"
                                    value={settings.phone}
                                    onChange={e => setSettings(s => ({ ...s, phone: e.target.value }))}
                                    className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={settings.email}
                                    onChange={e => setSettings(s => ({ ...s, email: e.target.value }))}
                                    className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white px-3 py-2"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Facebook URL</label>
                                <input
                                    type="url"
                                    value={settings.facebook_url}
                                    onChange={e => setSettings(s => ({ ...s, facebook_url: e.target.value }))}
                                    className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Instagram URL</label>
                                <input
                                    type="url"
                                    value={settings.instagram_url}
                                    onChange={e => setSettings(s => ({ ...s, instagram_url: e.target.value }))}
                                    className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white px-3 py-2"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Link Sections */}
                {(['oferta', 'lokalnie', 'inne'] as const).map(sectionKey => (
                    <div key={sectionKey} className={`bg-zinc-900 rounded-lg border p-6 ${settings.sections[sectionKey].enabled ? 'border-zinc-800' : 'border-zinc-800/50 opacity-60'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                {/* Toggle Switch */}
                                <button
                                    onClick={() => setSettings(s => ({
                                        ...s,
                                        sections: {
                                            ...s.sections,
                                            [sectionKey]: { ...s.sections[sectionKey], enabled: !s.sections[sectionKey].enabled }
                                        }
                                    }))}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${settings.sections[sectionKey].enabled ? 'bg-gold-500' : 'bg-zinc-700'
                                        }`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.sections[sectionKey].enabled ? 'left-7' : 'left-1'
                                        }`} />
                                </button>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Tytuł sekcji</label>
                                    <input
                                        type="text"
                                        value={settings.sections[sectionKey].title}
                                        onChange={e => setSettings(s => ({
                                            ...s,
                                            sections: {
                                                ...s.sections,
                                                [sectionKey]: { ...s.sections[sectionKey], title: e.target.value }
                                            }
                                        }))}
                                        className="rounded-md border-zinc-700 bg-zinc-800 text-white px-3 py-1 text-lg font-medium"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => addLink(sectionKey)}
                                className="flex items-center gap-1 text-sm text-gold-400 hover:text-gold-300"
                            >
                                <Plus className="w-4 h-4" /> Dodaj link
                            </button>
                        </div>

                        <div className="space-y-2">
                            {settings.sections[sectionKey].links.map(link => (
                                <div key={link.id} className="flex items-center gap-2 bg-zinc-950 p-2 rounded">
                                    <GripVertical className="w-4 h-4 text-zinc-600 cursor-move" />
                                    <input
                                        type="text"
                                        value={link.label}
                                        onChange={e => updateLink(sectionKey, link.id, 'label', e.target.value)}
                                        placeholder="Nazwa"
                                        className="flex-1 rounded border-zinc-700 bg-zinc-800 text-white px-2 py-1 text-sm"
                                    />
                                    <input
                                        type="text"
                                        value={link.url}
                                        onChange={e => updateLink(sectionKey, link.id, 'url', e.target.value)}
                                        placeholder="/url"
                                        className="flex-1 rounded border-zinc-700 bg-zinc-800 text-zinc-400 px-2 py-1 text-sm font-mono"
                                    />
                                    <button
                                        onClick={() => removeLink(sectionKey, link.id)}
                                        className="p-1 text-red-400 hover:text-red-300"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
