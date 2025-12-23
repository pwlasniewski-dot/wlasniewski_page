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

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        type: "page", // page | custom | system
        page_id: "",
        url: "",
        parent_id: "",
    });

    // System pages list
    const systemPages = [
        { title: "Strona Główna", url: "/" },
        { title: "Blog", url: "/blog" },
        { title: "Portfolio", url: "/portfolio" },
        { title: "Sklep", url: "/sklep" },
        { title: "O mnie", url: "/o-mnie" },
        { title: "Jak się ubrać", url: "/jak-sie-ubrac" },
        { title: "Rezerwacja", url: "/rezerwacja" },
        { title: "Fotograf Toruń", url: "/fotograf-torun" },
        { title: "Fotograf Bydgoszcz", url: "/fotograf-bydgoszcz" },
        { title: "Fotograf Grudziądz", url: "/fotograf-grudziadz" },
        { title: "Fotograf Wąbrzeźno", url: "/fotograf-wabrzezno" },
    ];

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [menuRes, pagesRes] = await Promise.all([
                fetch("/api/menu/items"),
                fetch("/api/pages")
            ]);

            const menuData = await menuRes.json();
            // Try to fetch pages, but handle if endpoint doesn't exist or fails
            let pagesData = [];
            try {
                if (pagesRes.ok) {
                    pagesData = await pagesRes.json();
                } else {
                    // Fallback to old menu endpoint if needed, or just empty
                    const oldMenuRes = await fetch("/api/menu");
                    if (oldMenuRes.ok) pagesData = await oldMenuRes.json();
                }
            } catch (e) {
                console.warn("Failed to fetch pages", e);
            }

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
            url: formData.type === "custom" ? formData.url : (formData.type === "system" ? formData.url : undefined),
            page_id: formData.type === "page" ? Number(formData.page_id) : undefined,
            parent_id: formData.parent_id ? Number(formData.parent_id) : null,
            order: editingItem ? editingItem.order : menuItems.length,
        };

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setIsModalOpen(false);
                setEditingItem(null);
                resetForm();
                fetchData();
            }
        } catch (error) {
            console.error("Error saving:", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Czy na pewno usunąć ten element?")) return;
        try {
            const res = await fetch(`/api/menu/items?id=${id}`, { method: "DELETE" });
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
                newItems.forEach((item, index) => {
                    fetch("/api/menu/items", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: item.id, order: index })
                    });
                });

                return newItems;
            });
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-zinc-900">Zarządzanie Menu</h1>
                <button
                    onClick={() => openModal()}
                    className="bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                    + Dodaj element
                </button>
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
                                    {menuItems.filter(i => i.id !== editingItem?.id).map(i => (
                                        <option key={i.id} value={i.id}>{i.title}</option>
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
