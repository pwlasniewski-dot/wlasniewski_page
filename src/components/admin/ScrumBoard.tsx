
'use client';

import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreVertical, Plus, Loader2, X, Check } from 'lucide-react';

interface Task {
    id: number;
    title: string;
    content: string | null;
    status: string;
    priority: string;
}

const COLUMNS = [
    { id: 'TODO', title: 'Do zrobienia' },
    { id: 'DOING', title: 'W trakcie' },
    { id: 'DONE', title: 'Zrobione' },
];

function SortableTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const priorityColors: Record<string, string> = {
        HIGH: 'text-red-400 bg-red-400/10',
        MEDIUM: 'text-yellow-400 bg-yellow-400/10',
        LOW: 'text-blue-400 bg-blue-400/10',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className="bg-zinc-800/80 p-4 rounded-xl border border-white/5 shadow-lg cursor-grab active:cursor-grabbing hover:border-zinc-700 transition-colors mb-3 group"
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${priorityColors[task.priority?.toUpperCase()] || 'bg-zinc-700 text-zinc-400'}`}>
                    {task.priority || 'MEDIUM'}
                </span>
                <button className="text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={14} />
                </button>
            </div>
            <h4 className="text-sm font-medium text-zinc-100 mb-1 leading-snug">{task.title}</h4>
            {task.content && (
                <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">{task.content}</p>
            )}
        </div>
    );
}

function DroppableColumn({ id, title, tasks, onAddTask }: { id: string, title: string, tasks: Task[], onAddTask: () => void }) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    {title}
                    <span className="bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-md text-[10px]">
                        {tasks.length}
                    </span>
                </h3>
                {id === 'TODO' && (
                    <button onClick={onAddTask} className="text-zinc-500 hover:text-white transition-colors">
                        <Plus size={16} />
                    </button>
                )}
            </div>

            <div
                ref={setNodeRef}
                className="bg-zinc-900/40 border border-white/5 rounded-2xl p-3 flex-grow backdrop-blur-sm min-h-[150px]"
            >
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <SortableTaskCard
                            key={task.id}
                            task={task}
                            onClick={() => { }}
                        />
                    ))}
                </SortableContext>
                {tasks.length === 0 && (
                    <div className="h-full min-h-[100px] border-2 border-dashed border-zinc-800/50 rounded-xl flex items-center justify-center text-[10px] text-zinc-700 italic">
                        Przeciągnij tutaj zadanie
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ScrumBoard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await fetch('/api/admin/scrum');
            if (res.ok) {
                const data = await res.json();
                console.log('Fetched tasks:', data);
                setTasks(data);
            }
        } catch (e) {
            console.error('Failed to fetch tasks', e);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const activeTask = tasks.find(t => t.id === activeId);
        if (!activeTask) return;

        let newStatus = activeTask.status.toUpperCase();

        if (COLUMNS.find(c => c.id === overId)) {
            newStatus = overId;
        } else {
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) {
                newStatus = overTask.status.toUpperCase();
            }
        }

        if (activeTask.status.toUpperCase() !== newStatus) {
            const updatedTasks = tasks.map(t =>
                t.id === activeId ? { ...t, status: newStatus } : t
            );
            setTasks(updatedTasks);

            try {
                await fetch('/api/admin/scrum', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: activeId, status: newStatus })
                });
            } catch (e) {
                console.error('Update failed', e);
                fetchTasks();
            }
        }
    };

    const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');

    const handleAddTaskSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        try {
            const res = await fetch('/api/admin/scrum', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTaskTitle, status: 'TODO', priority: newTaskPriority })
            });
            if (res.ok) {
                setNewTaskTitle('');
                setNewTaskPriority('MEDIUM');
                setIsAdding(false);
                fetchTasks();
            }
        } catch (e) {
            console.error('Add failed', e);
        }
    };

    if (loading) return (
        <div className="h-48 flex items-center justify-center text-zinc-500 gap-2">
            <Loader2 className="animate-spin" size={16} />
            Ładowanie tablicy...
        </div>
    );

    return (
        <div className="space-y-6">
            {isAdding ? (
                <div className="bg-zinc-900 border border-yellow-500/30 p-4 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleAddTaskSubmit} className="flex gap-4">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Wpisz treść zadania..."
                            className="bg-transparent border-b border-zinc-700 flex-grow text-sm py-2 px-1 focus:outline-none focus:border-yellow-500 transition-colors"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                        />
                        <select
                            className="bg-zinc-800 text-xs text-zinc-300 border border-zinc-700 rounded px-2 py-1 outline-none focus:border-yellow-500"
                            value={newTaskPriority}
                            onChange={(e) => setNewTaskPriority(e.target.value)}
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                        </select>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="p-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors"
                            >
                                <Check size={18} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {COLUMNS.map((col) => (
                        <DroppableColumn
                            key={col.id}
                            id={col.id}
                            title={col.title}
                            tasks={tasks.filter(t => t.status.toUpperCase() === col.id)}
                            onAddTask={() => setIsAdding(true)}
                        />
                    ))}
                </div>
            </DndContext>
        </div>
    );
}
