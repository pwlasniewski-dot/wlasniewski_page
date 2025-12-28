"use client";

import React, { useEffect, useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type MenuItem = {
    id: number;
    title: string;
    url?: string;
    page_id?: number;
    parent_id?: number;
    order: number;
    is_active: boolean;
    children?: MenuItem[];
    page?: {
        slug: string;
        title: string;
    };
};

type Page = {
    id: number;
    title: string;
    slug: string;
};

// Sortable Item Component
function SortableItem({ item, onEdit, onDelete, depth = 0 }: { item: MenuItem; onEdit: (i: MenuItem) => void; onDelete: (id: number) => void; depth?: number }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        marginLeft: `${depth * 24}px`,
    };

    return (
        <div ref={setNodeRef} style={style} className="mb-2">
            <div className="bg-white p-3 rounded-lg border border-zinc-200 shadow-sm flex items-center justify-between group">
                <div className="flex items-center gap-3">
                    <button {...attributes} {...listeners} className="cursor-grab text-zinc-400 hover:text-zinc-600">
                        ⋮⋮
                    </button>
                    <div>
                        <div className="font-medium text-zinc-900">{item.title}</div>
                        <div className="text-xs text-zinc-500">
                            {item.page ? `Strona: /${item.page.slug}` : `Link: ${item.url}`}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(item)} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded">✏️</button>
                    <button onClick={() => onDelete(item.id)} className="text-red-600 hover:bg-red-50 p-1 rounded">🗑️</button>
                </div>
            </div>
            {/* Render children recursively if any (for visual representation, though DnD might need flat list for sorting) */}
            {item.children && item.children.length > 0 && (
                <div className="mt-2 border-l-2 border-zinc-100 pl-2">
                    {item.children.map(child => (
                        <SortableItem key={child.id} item={child} onEdit={onEdit} onDelete={onDelete} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AdminMenuPage() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- TABS CONFIGURATION ---
    interface MenuTab {
        id: string;
        label: string;
        isSystem?: boolean;
    }
    const [activeTabId, setActiveTabId] = useState<string>('b2c');
    const [menuTabs, setMenuTabs] = useState<MenuTab[]>([
        { id: 'b2c', label: 'B2C (Indywidualni)', isSystem: true },
        { id: 'b2b', label: 'B2B (Firmy)', isSystem: true }
    ]);
    // Note: We can share the same localStorage key 'admin_page_tabs' or simple strict tabs.
    // User asked for "adding another domain" for Pages. It's likely they want the same domains for Menus.
    // So let's load from THE SAME key 'admin_page_tabs' to sync domains!

    useEffect(() => {
        const savedTabs = localStorage.getItem('admin_page_tabs');
        if (savedTabs) {
            try {
                const parsed = JSON.parse(savedTabs);
                // Map to MenuTab (we just need id and label)
                const custom = parsed.map((t: any) => ({ id: t.id, label: t.label, isSystem: false }));
                setMenuTabs(prev => {
                    const system = prev.filter(t => t.isSystem);
                    return [...system, ...custom];
                });
            } catch (e) { }
        }
    }, [isModalOpen]); // Reload when modal closes? Or just once. Once is fine. 

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        type: "page", // page | custom | system
        page_id: "",
        url: "",
        parent_id: "",
    });

    const systemPages = [
        { title: "Strona Główna", url: "/" },
        { title: "Blog", url: "/blog" },
        { title: "Portfolio", url: "/portfolio" },
        { title: "Sklep", url: "/sklep" },
        { title: "O mnie", url: "/o-mnie" },
        { title: "Jak się ubrać", url: "/jak-sie-ubrac" },
        { title: "Rezerwacja", url: "/rezerwacja" },
        { title: "Oferta B2B", url: "/oferta-b2b" },
        { title: "Dron", url: "/dron" },
        { title: "Kontakt", url: "/kontakt" },
    ];

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        fetchData();
    }, [activeTabId]); // Re-fetch when tab changes

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch items for specific tab
            const [menuRes, pagesRes] = await Promise.all([
                fetch(`/api/menu/items?type=${activeTabId}`, { headers }),
                fetch("/api/pages", { headers })
            ]);

            const menuData = await menuRes.json();

            // Handle Pages fetch
            let pagesData: any = [];
            try {
                if (pagesRes.ok) {
                    const resJson = await pagesRes.json();
                    if (resJson && resJson.pages && Array.isArray(resJson.pages)) {
                        pagesData = resJson.pages;
                    } else if (Array.isArray(resJson)) {
                        pagesData = resJson;
                    }
                }
            } catch (e) { }

            if (Array.isArray(menuData)) setMenuItems(menuData);
            if (Array.isArray(pagesData)) setPages(pagesData);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingItem ? "/api/menu/items" : "/api/menu/items";
        const method = editingItem ? "PUT" : "POST";

        const body = {
            id: editingItem?.id,
            title: formData.title,
            url: formData.type === "custom" ? formData.url : (formData.type === "system" ? formData.url : null),
            page_id: formData.type === "page" ? Number(formData.page_id) : null,
            parent_id: formData.parent_id ? Number(formData.parent_id) : null,
            order: editingItem ? editingItem.order : menuItems.length,
            menu_type: activeTabId,
        };

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("Save failed:", errorData);
                alert(`Błąd zapisu: ${errorData.error || 'Wystąpił nieznany błąd'}`);
                return;
            }

            // Success
            setIsModalOpen(false);
            setEditingItem(null);
            resetForm();
            fetchData();
        } catch (error) {
            console.error("Error saving:", error);
            alert("Błąd połączenia z serwerem. Sprawdź konsolę.");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Czy na pewno usunąć ten element?")) return;
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/menu/items?id=${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) {
                const error = await res.json();
                console.error("Delete failed:", error);
                alert(`Błąd usuwania: ${error.error || 'Nieznany błąd'}`);
                return;
            }
            fetchData();
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Błąd połączenia z serwerem");
        }
    };

    const resetForm = () => {
        setFormData({ title: "", type: "page", page_id: "", url: "", parent_id: "" });
    };

    const openModal = (item?: MenuItem) => {
        if (item) {
            setEditingItem(item);
            // Determine type based on item properties
            let type = "custom";
            if (item.page_id) type = "page";
            else if (systemPages.some(p => p.url === item.url)) type = "system";

            setFormData({
                title: item.title,
                type,
                page_id: item.page_id?.toString() || "",
                url: item.url || "",
                parent_id: item.parent_id?.toString() || "",
            });
        } else {
            setEditingItem(null);
            resetForm();
        }
        setIsModalOpen(true);
    };

    // Helper to flatten items for the dropdown
    const flattenMenuItems = (items: MenuItem[], depth = 0): (MenuItem & { depth: number })[] => {
        let result: (MenuItem & { depth: number })[] = [];
        for (const item of items) {
            result.push({ ...item, depth });
            if (item.children && item.children.length > 0) {
                result = [...result, ...flattenMenuItems(item.children, depth + 1)];
            }
        }
        return result;
    };


    // Drag End Handler (Simplified for now - just reordering top level)
    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setMenuItems((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Update order in backend
                // This is a simplified approach, ideally we batch update
                const token = localStorage.getItem('admin_token');
                newItems.forEach((item, index) => {
                    fetch("/api/menu/items", {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ id: item.id, order: index })
                    });
                });

                return newItems;
            });
        }
    };

    // Check if we are in fallback mode
    const isFallbackMode = menuItems.length > 0 && (menuItems[0] as any).__source === 'pages';

    const handleInitializeMenu = async () => {
        if (!confirm("To utworzy edytowalną strukturę menu na podstawie obecnych stron. Kontynuować?")) return;

        try {
            const token = localStorage.getItem('admin_token');
            // Save all current items to DB
            for (const item of menuItems) {
                await fetch("/api/menu/items", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: item.title,
                        url: item.url,
                        page_id: item.page_id,
                        order: item.order,
                        parent_id: null, // Fallback items are always flat initially or we'd need complex logic
                    })
                });
            }
            alert("Menu zostało zainicjalizowane. Teraz możesz dodawać nowe elementy i podstrony.");
            fetchData(); // Refresh to get real IDs
        } catch (e) {
            console.error(e);
            alert("Błąd inicjalizacji menu");
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900">Zarządzanie Menu</h1>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-xl border border-zinc-200">
                    {menuTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTabId(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTabId === tab.id
                                ? tab.id === 'b2b'
                                    ? 'bg-zinc-900 text-amber-500 shadow-sm'
                                    : 'bg-zinc-900 text-white shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                    {/* Note: We only allow Viewing/Switching here. Creation of Domains happens in Pages view to keep it centralized. */}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => openModal()}
                        className="bg-zinc-900 text-white px-4 py-2 rounded-lg transition-colors hover:bg-zinc-800 shadow-lg shadow-zinc-900/10"
                    >
                        + Dodaj element
                    </button>
                </div>
            </div>

            <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={menuItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                        {menuItems.map((item) => (
                            <SortableItem
                                key={item.id}
                                item={item}
                                onEdit={openModal}
                                onDelete={handleDelete}
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                {menuItems.length === 0 && !loading && (
                    <div className="text-center py-12 text-zinc-500">
                        Brak elementów w menu. Dodaj pierwszy element!
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4 text-zinc-900">{editingItem ? "Edytuj element" : "Nowy element menu"}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Typ elementu</label>
                                <div className="flex gap-4 text-zinc-900">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            checked={formData.type === "page"}
                                            onChange={() => setFormData({ ...formData, type: "page" })}
                                            className="text-zinc-900 focus:ring-zinc-900"
                                        />
                                        Strona CMS
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            checked={formData.type === "system"}
                                            onChange={() => setFormData({ ...formData, type: "system" })}
                                            className="text-zinc-900 focus:ring-zinc-900"
                                        />
                                        Strona Systemowa
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            checked={formData.type === "custom"}
                                            onChange={() => setFormData({ ...formData, type: "custom" })}
                                            className="text-zinc-900 focus:ring-zinc-900"
                                        />
                                        Link własny
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Tytuł w menu</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 bg-white focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            {formData.type === "page" && (
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Wybierz stronę CMS</label>
                                    <select
                                        className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 bg-white focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
                                        value={formData.page_id}
                                        onChange={e => setFormData({ ...formData, page_id: e.target.value })}
                                    >
                                        <option value="">-- Wybierz --</option>
                                        {pages.map(p => (
                                            <option key={p.id} value={p.id}>{p.title} (/{p.slug})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {formData.type === "system" && (
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Wybierz stronę systemową</label>
                                    <select
                                        className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 bg-white focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
                                        value={formData.url}
                                        onChange={e => {
                                            const selected = systemPages.find(p => p.url === e.target.value);
                                            setFormData({
                                                ...formData,
                                                url: e.target.value,
                                                title: formData.title || (selected?.title || "")
                                            });
                                        }}
                                    >
                                        <option value="">-- Wybierz --</option>
                                        {systemPages.map(p => (
                                            <option key={p.url} value={p.url}>{p.title}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {formData.type === "custom" && (
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Adres URL</label>
                                    <input
                                        type="text"
                                        className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 bg-white focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
                                        placeholder="https://..."
                                        value={formData.url}
                                        onChange={e => setFormData({ ...formData, url: e.target.value })}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Rodzic (opcjonalnie)</label>
                                <select
                                    className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 bg-white focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
                                    value={formData.parent_id}
                                    onChange={e => setFormData({ ...formData, parent_id: e.target.value })}
                                >
                                    <option value="">-- Brak (element główny) --</option>
                                    {flattenMenuItems(menuItems)
                                        .filter(i => i.id !== editingItem?.id) // Cannot be own parent
                                        .map(i => (
                                            <option key={i.id} value={i.id}>
                                                {Array(i.depth).fill("\u00A0\u00A0").join("")} {i.depth > 0 ? "└ " : ""}{i.title}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-lg"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
                                >
                                    Zapisz
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
