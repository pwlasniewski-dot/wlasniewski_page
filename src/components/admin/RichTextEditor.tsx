'use client';

import { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Heading1, Heading2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const execCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleInput();
    };

    const insertLink = () => {
        const url = prompt('Wpisz URL:');
        if (url) {
            execCommand('createLink', url);
        }
    };

    const insertImage = () => {
        const url = prompt('Wpisz URL obrazu:');
        if (url) {
            execCommand('insertImage', url);
        }
    };

    const buttons = [
        { icon: Heading1, command: 'formatBlock', value: 'h1', title: 'Nagłówek 1' },
        { icon: Heading2, command: 'formatBlock', value: 'h2', title: 'Nagłówek 2' },
        { icon: Bold, command: 'bold', title: 'Pogrubienie' },
        { icon: Italic, command: 'italic', title: 'Kursywa' },
        { icon: Underline, command: 'underline', title: 'Podkreślenie' },
        { icon: List, command: 'insertUnorderedList', title: 'Lista punktowana' },
        { icon: ListOrdered, command: 'insertOrderedList', title: 'Lista numerowana' },
        { icon: AlignLeft, command: 'justifyLeft', title: 'Wyrównaj do lewej' },
        { icon: AlignCenter, command: 'justifyCenter', title: 'Wyśrodkuj' },
        { icon: AlignRight, command: 'justifyRight', title: 'Wyrównaj do prawej' },
    ];

    return (
        <div className="border border-zinc-700 rounded-lg overflow-hidden bg-zinc-800">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 bg-zinc-900 border-b border-zinc-700">
                {buttons.map((btn, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => btn.value ? execCommand(btn.command, btn.value) : execCommand(btn.command)}
                        className="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-gold-400 transition-colors"
                        title={btn.title}
                    >
                        <btn.icon className="w-4 h-4" />
                    </button>
                ))}
                <button
                    type="button"
                    onClick={insertLink}
                    className="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-gold-400 transition-colors"
                    title="Wstaw link"
                >
                    <LinkIcon className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={insertImage}
                    className="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-gold-400 transition-colors"
                    title="Wstaw obraz"
                >
                    <ImageIcon className="w-4 h-4" />
                </button>
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="min-h-[300px] p-4 text-white focus:outline-none prose prose-invert max-w-none"
                data-placeholder={placeholder}
                style={{
                    whiteSpace: 'pre-wrap',
                }}
            />

            <style jsx>{`
                div[contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #71717a;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
}
