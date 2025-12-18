
'use client';

import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreVertical, Plus, Clock, AlertCircle } from 'lucide-react';

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
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${priorityColors[task.priority] || 'bg-zinc-700 text-zinc-400'}`}>
                    {task.priority}
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

export default function ScrumBoard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

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
            const data = await res.json();
            setTasks(data);
        } catch (e) {
            console.error('Failed to fetch tasks', e);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
            // Here we would implement moving between columns or sorting
            // For simplicity in MVP, we check if over.id is a column or a task
            const activeTask = tasks.find(t => t.id === active.id);
            if (!activeTask) return;

            // Simplified: If dropped over a column ID
            if (COLUMNS.map(c => c.id).includes(over.id)) {
                const newStatus = over.id;
                if (activeTask.status !== newStatus) {
                    setTasks(prev => prev.map(t => t.id === active.id ? { ...t, status: newStatus } : t));
                    await fetch('/api/admin/scrum', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: active.id, status: newStatus })
                    });
                }
            }
        }
    };

    if (loading) return <div className="h-48 flex items-center justify-center text-zinc-500">Ładowanie tablicy...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragEnd={handleDragEnd}
            >
                {COLUMNS.map((col) => (
                    <div key={col.id} className="flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-center mb-4 px-2">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                {col.title}
                                <span className="bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-md text-[10px]">
                                    {tasks.filter(t => t.status === col.id).length}
                                </span>
                            </h3>
                            {col.id === 'TODO' && (
                                <button className="text-zinc-500 hover:text-white transition-colors">
                                    <Plus size={16} />
                                </button>
                            )}
                        </div>

                        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-3 flex-grow backdrop-blur-sm">
                            {tasks.filter(t => t.status === col.id).map(task => (
                                <SortableTaskCard
                                    key={task.id}
                                    task={task}
                                    onClick={() => { }}
                                />
                            ))}
                            {tasks.filter(t => t.status === col.id).length === 0 && (
                                <div className="h-full min-h-[100px] border-2 border-dashed border-zinc-800/50 rounded-xl flex items-center justify-center text-[10px] text-zinc-700 italic">
                                    Brak zadań
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </DndContext>
        </div>
    );
}
