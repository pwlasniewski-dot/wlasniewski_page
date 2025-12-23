
"use client";

import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, DollarSign, Calendar, Send, UserCheck, MessageSquare, PieChart, Users, ShoppingBag } from 'lucide-react';

interface Goal {
    id: number;
    title: string;
    target_amount: number;
    current_amount: number;
    progress: number;
    daysLeft: number;
    category: string;
}

interface Template {
    id: number;
    title: string;
    subject: string;
    content: string;
    category: string;
}

export default function CEODashboard() {
    const [activeTab, setActiveTab] = useState<'overview' | 'marketing' | 'goals'>('overview');
    const [goals, setGoals] = useState<Goal[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [stats, setStats] = useState({ revenue: 0, tasksDone: 0, orders: 0 });
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

    // Marketing Form State
    const [emailTo, setEmailTo] = useState('');
    const [clientName, setClientName] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailContent, setEmailContent] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchGoals();
        fetchTemplates();
        fetchStats();
    }, []);

    const fetchGoals = async () => {
        const res = await fetch('/api/admin/goals');
        if (res.ok) setGoals(await res.json());
    };

    const fetchTemplates = async () => {
        const res = await fetch('/api/admin/marketing/templates');
        if (res.ok) setTemplates(await res.json());
    };

    const fetchStats = async () => {
        // Mock stats for now or fetch from real endpoints
        setStats({ revenue: 15400, tasksDone: 12, orders: 5 });
    };

    const getAdvice = () => {
        if (stats.tasksDone < 5) return "Rusz dupę! Za mało zadań skończonych. Nic samo się nie zrobi.";
        if (stats.revenue < 5000) return "Bieda. Musisz sprzedawać. Odpalaj marketing.";
        return "Idziesz jak burza! Ale nie osiadaj na laurach, konkurencja nie śpi.";
    };

    const handleTemplateSelect = (template: Template) => {
        setSelectedTemplate(template);
        setEmailSubject(template.subject);
        setEmailContent(template.content);
    };

    const handleSendEmail = async () => {
        if (!emailTo || !emailSubject || !emailContent) {
            alert('Wypełnij wszystkie pola (Email, Temat, Treść)');
            return;
        }

        setSending(true);
        try {
            const res = await fetch('/api/admin/marketing/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientEmail: emailTo,
                    subject: emailSubject,
                    content: emailContent,
                    templateId: selectedTemplate?.id, // Optional, for reference
                    variableData: { client_name: clientName, company: clientName } // Simple fallback variable map
                })
            });

            if (res.ok) {
                alert('Oferta wysłana pomyślnie!');
                setEmailTo('');
                setClientName('');
            } else {
                alert('Błąd podczas wysyłania');
            }
        } catch (e) {
            console.error(e);
            alert('Błąd sieci');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-8 text-zinc-100">
            {/* Advice Section */}
            <div className="bg-gradient-to-r from-yellow-700/20 to-zinc-900 border-l-4 border-yellow-500 p-6 rounded-r-xl">
                <h2 className="text-xl font-bold flex items-center gap-2 text-yellow-500 mb-2">
                    <TrendingUp /> Steve Radzi:
                </h2>
                <p className="text-lg italic font-mono text-zinc-300">"{getAdvice()}"</p>
            </div>

            {/* Navigation */}
            <div className="flex gap-4 border-b border-zinc-800 pb-2">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 rounded-t-lg transition-colors ${activeTab === 'overview' ? 'bg-zinc-800 text-yellow-500 font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Przegląd CEO
                </button>
                <button
                    onClick={() => setActiveTab('goals')}
                    className={`px-4 py-2 rounded-t-lg transition-colors ${activeTab === 'goals' ? 'bg-zinc-800 text-yellow-500 font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Cele Biznesowe
                </button>
                <button
                    onClick={() => setActiveTab('marketing')}
                    className={`px-4 py-2 rounded-t-lg transition-colors ${activeTab === 'marketing' ? 'bg-zinc-800 text-yellow-500 font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Moduł Sprzedażowy
                </button>
            </div>

            {/* Content Overview */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-zinc-400 font-medium">Przychód (Miesiąc)</h3>
                            <DollarSign className="text-green-500" />
                        </div>
                        <p className="text-3xl font-bold">{stats.revenue} PLN</p>
                        <p className="text-xs text-zinc-500 mt-2">+12% vs poprzedni miesiąc</p>
                    </div>

                    <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-zinc-400 font-medium">Zadania Wykonane</h3>
                            <Target className="text-blue-500" />
                        </div>
                        <p className="text-3xl font-bold">{stats.tasksDone}</p>
                        <p className="text-xs text-zinc-500 mt-2">Działaj dalej!</p>
                    </div>

                    <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-zinc-400 font-medium">Zamówienia</h3>
                            <ShoppingBag className="text-purple-500" />
                        </div>
                        <p className="text-3xl font-bold">{stats.orders}</p>
                        <p className="text-xs text-zinc-500 mt-2">Drony i Sesje</p>
                    </div>
                </div>
            )}

            {/* Marketing Module */}
            {activeTab === 'marketing' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2"><Send size={20} /> Szablony Cold Mail</h3>
                        <div className="grid gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {templates.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => handleTemplateSelect(t)}
                                    className={`bg-zinc-900/80 p-4 rounded-lg border transition-all cursor-pointer group ${selectedTemplate?.id === t.id ? 'border-yellow-500 bg-yellow-900/10' : 'border-zinc-800 hover:border-zinc-600'}`}
                                >
                                    <div className="flex justify-between">
                                        <h4 className="font-bold text-zinc-200">{t.title}</h4>
                                        <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-zinc-400">{t.category}</span>
                                    </div>
                                    <p className="text-sm text-zinc-500 mt-1 truncate">{t.subject}</p>
                                    <button className="mt-3 text-xs bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded group-hover:bg-yellow-600/20 group-hover:text-yellow-500 transition-colors w-full text-center">
                                        Wybierz
                                    </button>
                                </div>
                            ))}
                            {templates.length === 0 && <p className="text-zinc-500 italic">Brak szablonów. Kliknij 'db push' i 'seed' w terminalu.</p>}
                        </div>
                    </div>

                    <div className="bg-zinc-900/30 p-6 rounded-xl border border-dashed border-zinc-700 h-fit sticky top-6">
                        <h3 className="text-lg font-bold mb-4">Edytor i Wysyłka</h3>
                        <form className="space-y-4">
                            <div>
                                <label className="text-xs text-zinc-500 mb-1 block">Odbiorca (Email)</label>
                                <input
                                    type="email"
                                    value={emailTo}
                                    onChange={e => setEmailTo(e.target.value)}
                                    placeholder="prezes@firma.pl"
                                    className="w-full bg-black/50 border border-zinc-700 rounded p-2 focus:border-yellow-500 outline-none text-sm text-white"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 mb-1 block">Klient / Firma (zmienna)</label>
                                <input
                                    type="text"
                                    value={clientName}
                                    onChange={e => setClientName(e.target.value)}
                                    placeholder="Jan Kowalski / Nazwa Firmy"
                                    className="w-full bg-black/50 border border-zinc-700 rounded p-2 focus:border-yellow-500 outline-none text-sm text-white"
                                />
                            </div>

                            <div className="border-t border-zinc-800 my-4 pt-4">
                                <label className="text-xs text-zinc-500 mb-1 block">Temat Wiadomości</label>
                                <input
                                    type="text"
                                    value={emailSubject}
                                    onChange={e => setEmailSubject(e.target.value)}
                                    placeholder="Wybierz szablon lub wpisz temat..."
                                    className="w-full bg-black/50 border border-zinc-700 rounded p-2 focus:border-yellow-500 outline-none text-sm font-bold text-white mb-3"
                                />

                                <label className="text-xs text-zinc-500 mb-1 block">Treść Wiadomości (HTML)</label>
                                <textarea
                                    value={emailContent}
                                    onChange={e => setEmailContent(e.target.value)}
                                    placeholder="Wybierz szablon aby załadować treść..."
                                    className="w-full bg-black/50 border border-zinc-700 rounded p-2 focus:border-yellow-500 outline-none text-sm text-zinc-300 min-h-[250px] font-mono"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleSendEmail}
                                disabled={sending}
                                className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold py-3 rounded hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {sending ? 'Wysyłanie...' : <><Send size={16} /> Wyślij Ofertę</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Goals Tab */}
            {activeTab === 'goals' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold">Twoje KPI</h3>
                        <button className="bg-zinc-800 hover:bg-zinc-700 text-sm px-3 py-1.5 rounded transition-colors">+ Dodaj Cel</button>
                    </div>
                    <div className="space-y-4">
                        {goals.map(g => (
                            <div key={g.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold">{g.title}</span>
                                    <span className="text-sm text-zinc-400">{g.daysLeft} dni zostało</span>
                                </div>
                                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-yellow-500 h-full transition-all duration-500"
                                        style={{ width: `${Math.min(g.progress, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-zinc-500">
                                    <span>{g.current_amount} PLN</span>
                                    <span>Cel: {g.target_amount} PLN</span>
                                </div>
                            </div>
                        ))}
                        {goals.length === 0 && <p className="text-zinc-500 italic">Brak celów. Ustaw KPI żeby wiedzieć dokąd zmierzasz.</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
