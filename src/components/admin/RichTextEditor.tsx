'use client';

import { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Heading1, Heading2, AlignLeft, AlignCenter, AlignRight, Palette, Type } from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onImageRequest?: () => void;
}

export default function RichTextEditor({ value, onChange, placeholder, onImageRequest }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [activeFormats, setActiveFormats] = useState<string[]>([]);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showFontSizePicker, setShowFontSizePicker] = useState(false);
    const [showFontFamilyPicker, setShowFontFamilyPicker] = useState(false);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            // Only update if content is significantly different to avoid cursor jumping
            // or if the editor is empty (initial load)
            const currentContent = editorRef.current.innerHTML;
            if (!currentContent || value === '') {
                editorRef.current.innerHTML = value || '';
            } else if (value && value !== currentContent) {
                // Cursor management would be ideal here, but for simple use cases:
                if (document.activeElement !== editorRef.current) {
                    editorRef.current.innerHTML = value;
                }
            }
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
            checkActiveFormats();
        }
    };

    const checkActiveFormats = () => {
        const formats: string[] = [];
        if (document.queryCommandState('bold')) formats.push('bold');
        if (document.queryCommandState('italic')) formats.push('italic');
        if (document.queryCommandState('underline')) formats.push('underline');
        if (document.queryCommandState('insertUnorderedList')) formats.push('insertUnorderedList');
        if (document.queryCommandState('insertOrderedList')) formats.push('insertOrderedList');
        if (document.queryCommandState('justifyLeft')) formats.push('justifyLeft');
        if (document.queryCommandState('justifyCenter')) formats.push('justifyCenter');
        if (document.queryCommandState('justifyRight')) formats.push('justifyRight');

        // Block check for H1/H2
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            let parent = selection.getRangeAt(0).commonAncestorContainer as HTMLElement;
            if (parent.nodeType === 3) parent = parent.parentElement as HTMLElement;

            // Check up to 3 levels
            let current: HTMLElement | null = parent;
            for (let i = 0; i < 3; i++) {
                if (!current) break;
                if (current.tagName === 'H1') formats.push('h1');
                if (current.tagName === 'H2') formats.push('h2');
                current = current.parentElement;
            }
        }

        setActiveFormats(formats);
    };

    const execCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleInput();
        checkActiveFormats();
    };

    const insertLink = () => {
        const url = prompt('Wpisz URL:');
        if (url) {
            execCommand('createLink', url);
        }
    };

    const insertImage = () => {
        if (onImageRequest) {
            onImageRequest();
            return;
        }
        const url = prompt('Wpisz URL obrazu:');
        if (url) {
            execCommand('insertImage', url);
        }
    };

    const applyFontFamily = (fontVar: string) => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        if (range.collapsed) return; // Don't wrap empty selection

        const span = document.createElement('span');
        span.style.fontFamily = `var(${fontVar})`;

        try {
            const content = range.extractContents();
            span.appendChild(content);
            range.insertNode(span);

            // Clean up: Reset selection to include the new span
            const newRange = document.createRange();
            newRange.selectNodeContents(span);
            selection.removeAllRanges();
            selection.addRange(newRange);

            handleInput();
        } catch (e) {
            console.error('Failed to apply font family', e);
        }
    };

    const buttons = [
        { icon: Heading1, command: 'formatBlock', value: 'h1', title: 'Nagłówek 1', isActive: activeFormats.includes('h1') },
        { icon: Heading2, command: 'formatBlock', value: 'h2', title: 'Nagłówek 2', isActive: activeFormats.includes('h2') },
        { icon: Bold, command: 'bold', title: 'Pogrubienie', isActive: activeFormats.includes('bold') },
        { icon: Italic, command: 'italic', title: 'Kursywa', isActive: activeFormats.includes('italic') },
        { icon: Underline, command: 'underline', title: 'Podkreślenie', isActive: activeFormats.includes('underline') },
        { icon: List, command: 'insertUnorderedList', title: 'Lista punktowana', isActive: activeFormats.includes('insertUnorderedList') },
        { icon: ListOrdered, command: 'insertOrderedList', title: 'Lista numerowana', isActive: activeFormats.includes('insertOrderedList') },
        { icon: AlignLeft, command: 'justifyLeft', title: 'Wyrównaj do lewej', isActive: activeFormats.includes('justifyLeft') },
        { icon: AlignCenter, command: 'justifyCenter', title: 'Wyśrodkuj', isActive: activeFormats.includes('justifyCenter') },
        { icon: AlignRight, command: 'justifyRight', title: 'Wyrównaj do prawej', isActive: activeFormats.includes('justifyRight') },
    ];

    return (
        <div className="border border-zinc-700 rounded-lg overflow-hidden bg-zinc-800">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 bg-zinc-900 border-b border-zinc-700 items-center">
                {buttons.map((btn, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => btn.value ? execCommand(btn.command, btn.value) : execCommand(btn.command)}
                        className={`p-2 rounded transition-colors ${btn.isActive
                            ? 'bg-gold-500 text-black'
                            : 'text-zinc-400 hover:bg-zinc-700 hover:text-gold-400'
                            }`}
                        title={btn.title}
                    >
                        <btn.icon className="w-4 h-4" />
                    </button>
                ))}

                <div className="w-px h-6 bg-zinc-700 mx-1" />

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className={`p-2 rounded transition-colors text-zinc-400 hover:bg-zinc-700 hover:text-gold-400 ${showColorPicker ? 'bg-zinc-700 text-gold-400' : ''}`}
                        title="Kolor tekstu"
                    >
                        <Palette className="w-4 h-4" />
                    </button>
                    {showColorPicker && (
                        <div className="absolute top-full left-0 mt-2 p-2 bg-zinc-900 border border-zinc-700 rounded shadow-xl grid grid-cols-4 gap-1 z-50">
                            {['#ffffff', '#000000', '#D4AF37', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'].map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => {
                                        execCommand('foreColor', color);
                                        setShowColorPicker(false);
                                    }}
                                    className="w-6 h-6 rounded border border-zinc-700"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-px h-6 bg-zinc-700 mx-1" />

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

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowFontSizePicker(!showFontSizePicker)}
                        className={`p-2 rounded transition-colors text-zinc-400 hover:bg-zinc-700 hover:text-gold-400 ${showFontSizePicker ? 'bg-zinc-700 text-gold-400' : ''}`}
                        title="Rozmiar czcionki"
                    >
                        <span className="font-serif font-bold text-sm">Size</span>
                    </button>
                    {showFontSizePicker && (
                        <div className="absolute top-full left-0 mt-2 p-1 bg-zinc-900 border border-zinc-700 rounded shadow-xl min-w-[120px] z-50 flex flex-col gap-1">
                            {[
                                { label: 'Mały', size: '1' },
                                { label: 'Normalny', size: '3' },
                                { label: 'Duży', size: '5' },
                                { label: 'Ogromny', size: '7' },
                            ].map(opt => (
                                <button
                                    key={opt.size}
                                    type="button"
                                    onClick={() => {
                                        execCommand('fontSize', opt.size);
                                        setShowFontSizePicker(false);
                                    }}
                                    className="px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-gold-400 rounded transition-colors"
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowFontFamilyPicker(!showFontFamilyPicker)}
                        className={`p-2 rounded transition-colors text-zinc-400 hover:bg-zinc-700 hover:text-gold-400 ${showFontFamilyPicker ? 'bg-zinc-700 text-gold-400' : ''}`}
                        title="Krój czcionki (Font)"
                    >
                        <Type className="w-4 h-4" />
                    </button>
                    {showFontFamilyPicker && (
                        <div className="absolute top-full left-0 mt-2 p-1 bg-zinc-900 border border-zinc-700 rounded shadow-xl min-w-[200px] z-50 flex flex-col gap-1 max-h-[300px] overflow-y-auto w-auto min-w-[220px]">
                            {[
                                { label: 'Montserrat (Tekst)', var: '--font-sans', font: 'Montserrat, sans-serif' },
                                { label: 'Cormorant (Nagłówki)', var: '--font-display', font: 'Cormorant Garamond, serif' },
                                { label: 'Playfair Display', var: '--font-playfair', font: 'Playfair Display, serif' },
                                { label: 'Lato', var: '--font-lato', font: 'Lato, sans-serif' },
                                { label: 'Great Vibes (Ozdobny)', var: '--font-great-vibes', font: 'Great Vibes, cursive' },
                                { label: 'Cinzel (Filmowy)', var: '--font-cinzel', font: 'Cinzel, serif' },
                            ].map(opt => (
                                <button
                                    key={opt.var}
                                    type="button"
                                    onClick={() => {
                                        applyFontFamily(opt.var);
                                        setShowFontFamilyPicker(false);
                                    }}
                                    className="px-4 py-3 text-left text-lg text-zinc-200 hover:bg-zinc-800 hover:text-gold-400 rounded transition-colors"
                                    style={{ fontFamily: `var(${opt.var})` }}
                                    title={opt.label}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-px h-6 bg-zinc-700 mx-1 self-center" />

                <button
                    type="button"
                    onClick={() => {
                        const html = `<div class="grid md:grid-cols-2 gap-8 items-center my-8">
    <div class="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
        <img src="/images/placeholder.jpg" alt="Obraz" class="absolute inset-0 w-full h-full object-cover">
    </div>
    <div>
        <h3 class="text-2xl font-display font-bold text-white mb-4">Twój Tytuł</h3>
        <p class="text-zinc-300 leading-relaxed">Wpisz tutaj swój tekst...</p>
    </div>
</div><p></p>`;
                        execCommand('insertHTML', html);
                    }}
                    className="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-gold-400 transition-colors text-xs font-semibold border border-zinc-700/50"
                    title="Szablon: Zdjęcie Lewo"
                >
                    IMG-L
                </button>
                <button
                    type="button"
                    onClick={() => {
                        const html = `<div class="grid md:grid-cols-2 gap-8 items-center my-8">
    <div class="md:order-2 relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
        <img src="/images/placeholder.jpg" alt="Obraz" class="absolute inset-0 w-full h-full object-cover">
    </div>
    <div class="md:order-1">
        <h3 class="text-2xl font-display font-bold text-white mb-4">Twój Tytuł</h3>
        <p class="text-zinc-300 leading-relaxed">Wpisz tutaj swój tekst...</p>
    </div>
</div><p></p>`;
                        execCommand('insertHTML', html);
                    }}
                    className="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-gold-400 transition-colors text-xs font-semibold border border-zinc-700/50"
                    title="Szablon: Zdjęcie Prawo"
                >
                    IMG-R
                </button>
                <button
                    type="button"
                    onClick={() => {
                        const html = `<div class="grid md:grid-cols-2 gap-8 my-8">
    <div>
        <p class="text-zinc-300 leading-relaxed">Kolumna lewa...</p>
    </div>
    <div>
        <p class="text-zinc-300 leading-relaxed">Kolumna prawa...</p>
    </div>
</div><p></p>`;
                        execCommand('insertHTML', html);
                    }}
                    className="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-gold-400 transition-colors text-xs font-semibold border border-zinc-700/50"
                    title="Szablon: Dwie Kolumny"
                >
                    2-COL
                </button>
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onKeyUp={checkActiveFormats}
                onMouseUp={checkActiveFormats}
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
