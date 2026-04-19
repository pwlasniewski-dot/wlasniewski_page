'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Globalne style dla input i textarea
const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black";
const textareaClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black";

interface OfferItem {
    title: string;
    description: string;
    price: number;
    quantity: number;
    is_optional: boolean;
}

interface OfferSection {
    title: string;
    description: string;
    items: OfferItem[];
}

interface OfferFormProps {
    onSubmit?: (data: any) => void;
    initialData?: any;
    isLoading?: boolean;
}

export default function OfferForm({ onSubmit, initialData, isLoading = false }: OfferFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        slug: initialData?.slug || '',
        type: initialData?.type || 'b2c',
        category: initialData?.category || '',
        client_email: initialData?.client_email || '',
        valid_until: initialData?.valid_until ? new Date(initialData.valid_until).toISOString().split('T')[0] : '',
        is_template: initialData?.is_template || false,
        sections: initialData?.sections || [
            {
                title: 'Sekcja 1',
                description: '',
                items: [
                    { title: 'Usługa 1', description: '', price: 0, quantity: 1, is_optional: false }
                ]
            }
        ],
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    const fetchTemplates = async () => {
        setLoadingTemplates(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/templates', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTemplates(data.templates);
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoadingTemplates(false);
        }
    };

    const loadTemplate = (template: any) => {
        // template_data contains the full offer structure from OfferBuilder
        // sections may be in template.sections (relational) or in template.template_data
        const sections = template.sections || (template.template_data as any)?.sections || [];

        if (!sections || sections.length === 0) {
            // Fallback: template was saved from OfferBuilder (A4 format) - no structured sections
            setFormData(prev => ({
                ...prev,
                title: prev.title || template.title,
                type: template.type || prev.type,
                category: template.category || prev.category,
            }));
            setShowTemplateModal(false);
            return;
        }

        setFormData(prev => ({
            ...prev,
            title: prev.title || template.title, // Keep title if already set, or use template's
            type: template.type,
            category: template.category,
            sections: sections.map((s: any) => ({
                title: s.title,
                description: s.description,
                items: (s.items || []).map((i: any) => ({
                    title: i.title,
                    description: i.description,
                    price: i.price,
                    quantity: i.quantity,
                    is_optional: i.is_optional
                }))
            }))
        }));
        setShowTemplateModal(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSectionChange = (sectionIndex: number, field: string, value: any) => {
        setFormData(prev => {
            const newSections = [...prev.sections];
            (newSections[sectionIndex] as any)[field] = value;
            return { ...prev, sections: newSections };
        });
    };

    const handleItemChange = (sectionIndex: number, itemIndex: number, field: string, value: any) => {
        setFormData(prev => {
            const newSections = [...prev.sections];
            const newItems = [...newSections[sectionIndex].items];
            (newItems[itemIndex] as any)[field] = value;
            newSections[sectionIndex].items = newItems;
            return { ...prev, sections: newSections };
        });
    };

    const addSection = () => {
        setFormData(prev => ({
            ...prev,
            sections: [
                ...prev.sections,
                {
                    title: 'Nowa sekcja',
                    description: '',
                    items: [
                        { title: 'Usługa', description: '', price: 0, quantity: 1, is_optional: false }
                    ]
                }
            ]
        }));
    };

    const removeSection = (index: number) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections.filter((_, i) => i !== index)
        }));
    };

    const addItem = (sectionIndex: number) => {
        setFormData(prev => {
            const newSections = [...prev.sections];
            newSections[sectionIndex].items.push({
                title: 'Nowa usługa',
                description: '',
                price: 0,
                quantity: 1,
                is_optional: false
            });
            return { ...prev, sections: newSections };
        });
    };

    const removeItem = (sectionIndex: number, itemIndex: number) => {
        setFormData(prev => {
            const newSections = [...prev.sections];
            newSections[sectionIndex].items = newSections[sectionIndex].items.filter((_, i) => i !== itemIndex);
            return { ...prev, sections: newSections };
        });
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Tytuł jest wymagany';
        }
        if (!formData.slug.trim()) {
            newErrors.slug = 'Slug jest wymagany';
        }
        if (formData.sections.length === 0) {
            newErrors.sections = 'Dodaj co najmniej jedną sekcję';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('✅ handleSubmit wywoływany');
        console.log('Form data:', formData);

        if (!validateForm()) {
            console.log('❌ Walidacja nie powiodła się');
            return;
        }

        if (onSubmit) {
            console.log('📤 Wysyłanie via onSubmit prop');
            onSubmit(formData);
        } else {
            // Default submission
            try {
                const url = initialData?.id
                    ? `/api/admin/offers/${initialData.id}`
                    : '/api/admin/offers';

                console.log('📤 Wysyłanie do:', url);

                // Get token from localStorage
                const token = localStorage.getItem('admin_token');
                if (!token) {
                    console.log('❌ Brak tokenu - zaloguj się ponownie');
                    setErrors({ submit: 'Sesja wygasła - zaloguj się ponownie' });
                    return;
                }
                console.log('✅ Token znaleziony:', token.substring(0, 20) + '...');

                const response = await fetch(url, {
                    method: initialData?.id ? 'PATCH' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    console.log('✅ Sukces! Przekierowanie...');
                    router.push('/admin/offers');
                } else {
                    console.log('❌ Błąd odpowiedzi:', response.status);
                    const error = await response.json();
                    setErrors({ submit: error.error || 'Failed to save offer' });
                }
            } catch (error) {
                console.error('❌ Błąd:', error);
                setErrors({ submit: 'An error occurred while saving' });
            }
        }
    };

    const isB2B = formData.type === 'b2b';
    const themeClass = isB2B
        ? "bg-slate-900 text-white"
        : "bg-white text-black";

    const containerClass = `max-w-5xl mx-auto p-8 rounded-xl shadow-lg transition-colors duration-300 ${isB2B ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-100'}`;
    const labelClass = `block text-sm font-semibold mb-2 ${isB2B ? 'text-slate-300' : 'text-gray-700'}`;
    const inputBaseClass = "w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200";
    const inputStyleClass = isB2B
        ? "bg-slate-800 border-slate-700 text-white focus:ring-blue-500 placeholder-slate-500"
        : "bg-white border-gray-300 text-gray-900 focus:ring-amber-500 placeholder-gray-400";

    // Categories based on type
    const categories = isB2B
        ? ['Inne', 'Inspekcja Dachu', 'Inspekcja Rurociągów', 'Inspekcja Turbin Wiatrowych', 'Termowizja', 'Zlecenie Specjalne']
        : ['Inne', 'Ślub', 'Przyjęcie', 'Urodziny', 'Sesja Rodzinna', 'Sesja Narzeczeńska'];

    const totalPrice = formData.sections.reduce((sum, section) => {
        return sum + section.items.reduce((sectionSum, item) => {
            return sectionSum + (item.is_optional ? 0 : item.price * item.quantity);
        }, 0);
    }, 0);

    return (
        <div className={containerClass}>
            {/* Header & Toggle */}
            <div className="flex justify-between items-center mb-8">
                <h1 className={`text-3xl font-bold ${isB2B ? 'text-white' : 'text-gray-900'}`}>
                    {initialData?.id ? 'Edytuj Ofertę' : 'Nowa Oferta'}
                </h1>

                {/* Type Toggle */}
                <div className="flex bg-gray-200 p-1 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: 'b2c', category: 'Ślub' }))}
                        className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${!isB2B
                            ? 'bg-white text-amber-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        B2C (Klient)
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: 'b2b', category: 'Termowizja' }))}
                        className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${isB2B
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        B2B (Biznes)
                    </button>
                </div>
            </div>

            {/* Template Controls */}
            <div className="flex justify-between items-center mb-6">
                <button
                    type="button"
                    onClick={() => {
                        setShowTemplateModal(true);
                        fetchTemplates();
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                >
                    📂 Wybierz z szablonu
                </button>

                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        name="is_template"
                        checked={formData.is_template}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_template: e.target.checked }))}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`ml-2 text-sm font-medium ${isB2B ? 'text-white' : 'text-gray-900'}`}>
                        Zapisz jako szablon
                    </span>
                </label>
            </div>

            {/* Template Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">Wybierz szablon</h3>
                            <button
                                onClick={() => setShowTemplateModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {loadingTemplates ? (
                                <div className="text-center py-8">Ładowanie szablonów...</div>
                            ) : templates.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">Brak zapisanych szablonów.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {templates.map(template => (
                                        <button
                                            key={template.id}
                                            onClick={() => loadTemplate(template)}
                                            className="text-left p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                                        >
                                            <h4 className="font-bold text-gray-900 group-hover:text-blue-700">{template.title}</h4>
                                            <p className="text-sm text-gray-500 mt-1">{template.category} • {template.type.toUpperCase()}</p>
                                            <p className="text-xs text-gray-400 mt-2">{(template.sections || (template.template_data as any)?.sections || []).length} sekcji</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Tytuł Oferty*</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className={`${inputBaseClass} ${inputStyleClass}`}
                            placeholder="np. Sesja ślubna deluxe"
                        />
                        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                    </div>

                    <div>
                        <label className={labelClass}>Kategoria*</label>
                        <div className="relative">
                            <select
                                name="category"
                                value={(formData as any).category || categories[0]}
                                onChange={handleInputChange}
                                className={`${inputBaseClass} ${inputStyleClass} appearance-none`}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <div className={`absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none ${isB2B ? 'text-white' : 'text-gray-500'}`}>
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Przyjazny Link (Slug)*</label>
                        <input
                            type="text"
                            name="slug"
                            value={formData.slug}
                            onChange={handleInputChange}
                            className={`${inputBaseClass} ${inputStyleClass}`}
                            placeholder="np. sesja-slubna-deluxe"
                        />
                        {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
                    </div>

                    <div>
                        <label className={labelClass}>Email Klienta (do wysyłki)</label>
                        <input
                            type="email"
                            name="client_email"
                            value={formData.client_email}
                            onChange={handleInputChange}
                            className={`${inputBaseClass} ${inputStyleClass}`}
                            placeholder="klient@example.com"
                        />
                    </div>
                </div>

                {/* Valid Until */}
                <div>
                    <label className={labelClass}>Oferta ważna do</label>
                    <input
                        type="date"
                        name="valid_until"
                        value={formData.valid_until}
                        onChange={handleInputChange}
                        className={`${inputBaseClass} ${inputStyleClass}`}
                    />
                </div>

                {/* Sections */}
                <div className={`border-t pt-8 ${isB2B ? 'border-slate-700' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className={`text-2xl font-semibold ${isB2B ? 'text-white' : 'text-gray-800'}`}>Sekcje Oferty</h2>
                        <button
                            type="button"
                            onClick={addSection}
                            className={`px-5 py-2.5 rounded-lg text-white font-medium transition-colors ${isB2B ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-500 hover:bg-green-600'
                                }`}
                        >
                            + Dodaj nową sekcję
                        </button>
                    </div>

                    {errors.sections && <p className="text-red-500 text-sm mb-4">{errors.sections}</p>}

                    {formData.sections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className={`mb-8 p-6 rounded-xl border ${isB2B ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'
                            }`}>
                            <div className="flex justify-between items-start mb-6 gap-4">
                                <div className="flex-1 space-y-3">
                                    <input
                                        type="text"
                                        value={section.title}
                                        onChange={(e) => handleSectionChange(sectionIndex, 'title', e.target.value)}
                                        className={`w-full text-xl font-bold bg-transparent border-b focus:outline-none focus:border-b-2 transition-all ${isB2B
                                            ? 'text-white border-slate-600 focus:border-blue-500 placeholder-slate-500'
                                            : 'text-gray-900 border-gray-300 focus:border-amber-500 placeholder-gray-400'
                                            }`}
                                        placeholder="Nazwa Sekcji (np. Pakiet Podstawowy)"
                                    />
                                    <textarea
                                        value={section.description}
                                        onChange={(e) => handleSectionChange(sectionIndex, 'description', e.target.value)}
                                        className={`w-full bg-transparent resize-none text-sm focus:outline-none ${isB2B ? 'text-slate-300 placeholder-slate-600' : 'text-gray-600 placeholder-gray-400'
                                            }`}
                                        placeholder="Krótki opis sekcji..."
                                        rows={1}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeSection(sectionIndex)}
                                    className="px-3 py-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-sm font-medium"
                                >
                                    Usuń sekcję
                                </button>
                            </div>

                            {/* Items in Section */}
                            <div className="space-y-4">
                                {section.items.map((item, itemIndex) => (
                                    <div key={itemIndex} className={`p-4 rounded-lg border flex flex-col md:flex-row gap-4 items-start md:items-center ${isB2B ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-gray-200 shadow-sm'
                                        }`}>
                                        <div className="flex-1 w-full space-y-2">
                                            <input
                                                type="text"
                                                value={item.title}
                                                onChange={(e) => handleItemChange(sectionIndex, itemIndex, 'title', e.target.value)}
                                                className={`w-full font-medium bg-transparent focus:outline-none ${isB2B ? 'text-white placeholder-slate-600' : 'text-gray-900 placeholder-gray-400'
                                                    }`}
                                                placeholder="Nazwa usługi"
                                            />
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => handleItemChange(sectionIndex, itemIndex, 'description', e.target.value)}
                                                className={`w-full text-sm bg-transparent focus:outline-none ${isB2B ? 'text-slate-400 placeholder-slate-700' : 'text-gray-500 placeholder-gray-300'
                                                    }`}
                                                placeholder="Dodatkowy opis..."
                                            />
                                        </div>

                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={item.price || ''}
                                                    onChange={(e) => handleItemChange(sectionIndex, itemIndex, 'price', parseInt(e.target.value) || 0)}
                                                    className={`w-24 px-3 py-1.5 rounded text-right font-mono text-sm focus:outline-none focus:ring-1 ${isB2B
                                                        ? 'bg-slate-800 text-blue-400 focus:ring-blue-500'
                                                        : 'bg-gray-50 text-gray-900 focus:ring-amber-500'
                                                        }`}
                                                    placeholder="0"
                                                />
                                                <span className={`absolute right-8 top-1.5 text-xs ${isB2B ? 'text-slate-500' : 'text-gray-400'}`}>PLN</span>
                                            </div>

                                            <div className="relative w-16">
                                                <input
                                                    type="number"
                                                    value={item.quantity || 1}
                                                    onChange={(e) => handleItemChange(sectionIndex, itemIndex, 'quantity', parseInt(e.target.value) || 1)}
                                                    className={`w-full px-2 py-1.5 rounded text-center text-sm focus:outline-none focus:ring-1 ${isB2B
                                                        ? 'bg-slate-800 text-white focus:ring-blue-500'
                                                        : 'bg-gray-50 text-gray-900 focus:ring-amber-500'
                                                        }`}
                                                />
                                            </div>

                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={item.is_optional}
                                                    onChange={(e) => handleItemChange(sectionIndex, itemIndex, 'is_optional', e.target.checked)}
                                                    className={`w-5 h-5 rounded ${isB2B ? 'text-blue-600 bg-slate-800 border-slate-600' : 'text-amber-600 border-gray-300'
                                                        }`}
                                                />
                                                <span className={`ml-2 text-xs ${isB2B ? 'text-slate-400' : 'text-gray-500'}`}>Opcja</span>
                                            </label>

                                            <button
                                                type="button"
                                                onClick={() => removeItem(sectionIndex, itemIndex)}
                                                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                                title="Usuń pozycję"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => addItem(sectionIndex)}
                                    className={`w-full py-2.5 text-sm font-medium border-2 border-dashed rounded-lg transition-all ${isB2B
                                        ? 'border-slate-700 text-slate-400 hover:border-blue-500 hover:text-blue-400'
                                        : 'border-gray-200 text-gray-500 hover:border-amber-400 hover:text-amber-600'
                                        }`}
                                >
                                    + Dodaj kolejną pozycję
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-black">Suma całkowita (bez opcji):</span>
                        <span className="text-2xl font-bold text-blue-600">{totalPrice.toLocaleString('pl-PL')} PLN</span>
                    </div>
                </div>

                {/* Form Errors */}
                {errors.submit && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {errors.submit}
                    </div>
                )}

                {/* Buttons */}
                <div className="flex gap-4 pt-6 border-t">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {isLoading ? 'Zapisywanie...' : initialData?.id ? 'Zaktualizuj ofertę' : 'Utwórz ofertę'}
                    </button>
                    <div className="flex-1 flex gap-2">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 px-6 py-3 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
                        >
                            Anuluj
                        </button>
                        {initialData?.id && (
                            <>
                                <a
                                    href={`/api/offers/${initialData.id}/pdf`}
                                    target="_blank"
                                    className="flex items-center justify-center px-4 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                    title="Pobierz PDF"
                                >
                                    📄 PDF
                                </a>
                                <button
                                    type="button"
                                    onClick={() => router.push(`/admin/offers/${initialData.id}/contract`)}
                                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    📝 Przygotuj Umowę
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}
