'use client';

import { useRef, useEffect, useState, type ClipboardEvent } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Heading1, Heading2, Heading3, Pilcrow, AlignLeft, AlignCenter, AlignRight, Palette, Type, Eye, EyeOff, Undo2, Redo2, RemoveFormatting } from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onImageRequest?: () => void;
}

export default function RichTextEditor({ value, onChange, placeholder, onImageRequest }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const selectionRef = useRef<Range | null>(null);
    const [activeFormats, setActiveFormats] = useState<string[]>([]);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showFontSizePicker, setShowFontSizePicker] = useState(false);
    const [showFontFamilyPicker, setShowFontFamilyPicker] = useState(false);
    const [currentColor, setCurrentColor] = useState('#ffffff');
    const [readableMode, setReadableMode] = useState(true);

    useEffect(() => {
        // Enable modern CSS-based styling
        document.execCommand('styleWithCSS', false, 'true');
    }, []);

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

    const saveSelection = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || !editorRef.current) return;

        const range = selection.getRangeAt(0);
        const commonNode = range.commonAncestorContainer;
        if (editorRef.current.contains(commonNode)) {
            selectionRef.current = range.cloneRange();
        }
    };

    const restoreSelection = () => {
        const selection = window.getSelection();
        const range = selectionRef.current;
        if (!selection || !range || !editorRef.current) return;

        editorRef.current.focus({ preventScroll: true });
        selection.removeAllRanges();
        selection.addRange(range);
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

        // Check for color
        const color = document.queryCommandValue('foreColor');
        if (color) {
            // Convert to hex if it's rgb/rgba
            const hex = color.startsWith('rgb') ? rgbToHex(color) : color;
            setCurrentColor(hex);
        }

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
                if (current.tagName === 'H3') formats.push('h3');
                if (current.tagName === 'P' || current.tagName === 'DIV') formats.push('p');
                current = current.parentElement;
            }
        }

        setActiveFormats(formats);
    };

    const execCommand = (command: string, value?: string) => {
        restoreSelection();
        document.execCommand(command, false, value);
        saveSelection();
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
            restoreSelection();
            document.execCommand('insertHTML', false, '<span data-rte-image-marker="true"></span>');
            saveSelection();
            handleInput();
            onImageRequest();
            return;
        }
        const url = prompt('Wpisz URL obrazu:');
        if (url) {
            execCommand('insertImage', url);
        }
    };

    const applyFontFamily = (fontVar: string) => {
        restoreSelection();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        if (range.collapsed) return; // Don't wrap empty selection

        const span = document.createElement('span');
        span.style.setProperty('font-family', `var(${fontVar})`, 'important');

        try {
            const content = range.extractContents();
            span.appendChild(content);
            range.insertNode(span);

            // Clean up: Reset selection to include the new span
            const newRange = document.createRange();
            newRange.selectNodeContents(span);
            selection.removeAllRanges();
            selection.addRange(newRange);
            saveSelection();

            handleInput();
        } catch (e) {
            console.error('Failed to apply font family', e);
        }
    };

    const buttons = [
        { icon: Pilcrow, command: 'formatBlock', value: 'p', title: 'Zwykły akapit', isActive: activeFormats.includes('p') && !activeFormats.some(format => ['h1', 'h2', 'h3'].includes(format)) },
        { icon: Heading1, command: 'formatBlock', value: 'h1', title: 'Nagłówek 1', isActive: activeFormats.includes('h1') },
        { icon: Heading2, command: 'formatBlock', value: 'h2', title: 'Nagłówek 2', isActive: activeFormats.includes('h2') },
        { icon: Heading3, command: 'formatBlock', value: 'h3', title: 'Nagłówek 3', isActive: activeFormats.includes('h3') },
        { icon: Bold, command: 'bold', title: 'Pogrubienie', isActive: activeFormats.includes('bold') },
        { icon: Italic, command: 'italic', title: 'Kursywa', isActive: activeFormats.includes('italic') },
        { icon: Underline, command: 'underline', title: 'Podkreślenie', isActive: activeFormats.includes('underline') },
        { icon: List, command: 'insertUnorderedList', title: 'Lista punktowana', isActive: activeFormats.includes('insertUnorderedList') },
        { icon: ListOrdered, command: 'insertOrderedList', title: 'Lista numerowana', isActive: activeFormats.includes('insertOrderedList') },
        { icon: AlignLeft, command: 'justifyLeft', title: 'Wyrównaj do lewej', isActive: activeFormats.includes('justifyLeft') },
        { icon: AlignCenter, command: 'justifyCenter', title: 'Wyśrodkuj', isActive: activeFormats.includes('justifyCenter') },
        { icon: AlignRight, command: 'justifyRight', title: 'Wyrównaj do prawej', isActive: activeFormats.includes('justifyRight') },
    ];

    const rgbToHex = (rgb: string) => {
        if (!rgb.startsWith('rgb')) return rgb;
        const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(\.\d+)?))?\)$/);
        if (!match) return rgb;
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };

    const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
        event.preventDefault();
        const plainText = event.clipboardData.getData('text/plain');
        restoreSelection();
        document.execCommand('insertText', false, plainText);
        saveSelection();
        handleInput();
    };

    return (
        <div className="border border-zinc-700 rounded-lg bg-zinc-800">
            {/* Toolbar */}
            <div
                className="flex flex-wrap gap-1 p-2 bg-zinc-900 border-b border-zinc-700 items-center sticky top-0 z-40 rounded-t-lg"
                onMouseDownCapture={(event) => {
                    const target = event.target as HTMLElement;
                    if (target.closest('button')) event.preventDefault();
                }}
            >
                {buttons.map((btn, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => {
                            if (btn.command === 'formatBlock') {
                                // Toggle logic for Headings: if active, switch to paragraph (p)
                                if (btn.isActive) {
                                    execCommand('formatBlock', 'p');
                                } else {
                                    execCommand('formatBlock', btn.value || 'p');
                                }
                            } else {
                                btn.value ? execCommand(btn.command, btn.value) : execCommand(btn.command);
                            }
                        }}
                        className={`p-2 rounded transition-colors ${btn.isActive
                            ? 'bg-gold-500 text-black'
                            : 'text-zinc-400 hover:bg-zinc-700 hover:text-gold-400'
                            }`}
                        title={btn.title}
                        aria-label={btn.title}
                        aria-pressed={btn.isActive}
                    >
                        <btn.icon className="w-4 h-4" />
                    </button>
                ))}

                <div className="w-px h-6 bg-zinc-700 mx-1" />

                <button
                    type="button"
                    onClick={() => execCommand('undo')}
                    className="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-gold-400 transition-colors"
                    title="Cofnij"
                    aria-label="Cofnij"
                >
                    <Undo2 className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('redo')}
                    className="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-gold-400 transition-colors"
                    title="Ponów"
                    aria-label="Ponów"
                >
                    <Redo2 className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('removeFormat')}
                    className="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-gold-400 transition-colors"
                    title="Wyczyść formatowanie zaznaczenia"
                    aria-label="Wyczyść formatowanie zaznaczenia"
                >
                    <RemoveFormatting className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-zinc-700 mx-1" />

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className={`p-2 rounded transition-colors text-zinc-400 hover:bg-zinc-700 hover:text-gold-400 ${showColorPicker ? 'bg-zinc-700 text-gold-400' : ''}`}
                        title="Kolor tekstu"
                    >
                        <div className="flex flex-col items-center">
                            <Palette className="w-4 h-4" />
                            <div
                                className="w-4 h-0.5 mt-0.5 rounded-full"
                                style={{ backgroundColor: currentColor }}
                            />
                        </div>
                    </button>
                    {showColorPicker && (
                        <div className="absolute top-full left-0 mt-2 p-2 bg-zinc-900 border border-zinc-700 rounded shadow-xl z-50">
                            <div className="grid grid-cols-4 gap-1 mb-2">
                                {['#ffffff', '#000000', '#D4AF37', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'].map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => {
                                            execCommand('foreColor', color);
                                            setShowColorPicker(false);
                                        }}
                                        className="w-6 h-6 rounded border border-zinc-700 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-zinc-700">
                                <label className="text-[10px] text-zinc-500 uppercase font-bold shrink-0">Custom:</label>
                                <input
                                    type="color"
                                    value={currentColor}
                                    onChange={(e) => {
                                        execCommand('foreColor', e.target.value);
                                    }}
                                    className="w-full h-6 bg-transparent border-none cursor-pointer"
                                />
                            </div>
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
                        aria-expanded={showFontSizePicker}
                    >
                        <span className="text-xs font-semibold">Rozmiar</span>
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
                        aria-expanded={showFontFamilyPicker}
                    >
                        <span className="flex items-center gap-1 text-xs font-semibold"><Type className="w-4 h-4" /> Font</span>
                    </button>
                    {showFontFamilyPicker && (
                        <div className="absolute top-full left-0 mt-2 p-1 bg-zinc-900 border border-zinc-700 rounded shadow-xl z-50 flex flex-col gap-1 max-h-[400px] overflow-y-auto w-72">
                            {[
                                { label: 'Montserrat (Tekst)', var: '--font-sans', font: 'Montserrat, sans-serif' },
                                { label: 'Cormorant (Nagłówki)', var: '--font-display', font: 'Cormorant Garamond, serif', weight: '700' },
                                { label: 'Playfair Display', var: '--font-playfair', font: 'Playfair Display, serif' },
                                { label: 'Lato', var: '--font-lato', font: 'Lato, sans-serif' },
                                { label: 'Great Vibes (Ozdobny)', var: '--font-great-vibes', font: 'Great Vibes, cursive', size: '1.2em' },
                                { label: 'Cinzel (Filmowy)', var: '--font-cinzel', font: 'Cinzel, serif' },
                                { label: 'Outfit (Nowoczesny)', var: '--font-outfit', font: 'Outfit, sans-serif' },
                                { label: 'Inter (Czytelny)', var: '--font-inter', font: 'Inter, sans-serif' },
                            ].map(opt => (
                                <button
                                    key={opt.var}
                                    type="button"
                                    onClick={() => {
                                        applyFontFamily(opt.var);
                                        setShowFontFamilyPicker(false);
                                    }}
                                    className="px-4 py-3 text-left text-lg text-zinc-200 hover:bg-zinc-800 hover:text-gold-400 rounded transition-colors block w-full"
                                    style={{
                                        fontFamily: `var(${opt.var})`,
                                        fontWeight: opt.weight || 'normal',
                                        fontSize: opt.size || '1.125rem'
                                    }}
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

                <div className="w-px h-6 bg-zinc-700 mx-1 self-center" />

                <button
                    type="button"
                    onClick={() => setReadableMode(current => !current)}
                    className={`px-2 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${readableMode ? 'bg-sky-500/15 text-sky-300' : 'text-zinc-400 hover:bg-zinc-700'}`}
                    title="Wymusza czytelne kolory tylko w edytorze. Nie zmienia wyglądu strony."
                    aria-pressed={readableMode}
                >
                    {readableMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    Czytelna edycja
                </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-700 bg-zinc-950/70 px-3 py-2 text-xs text-zinc-400">
                <span>
                    Format: <strong className="text-zinc-200">{activeFormats.includes('h1') ? 'Nagłówek H1' : activeFormats.includes('h2') ? 'Nagłówek H2' : activeFormats.includes('h3') ? 'Nagłówek H3' : 'Akapit'}</strong>
                </span>
                <span>Zaznacz tekst, potem wybierz format. H1 używaj tylko raz na stronie.</span>
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onPaste={handlePaste}
                onKeyUp={() => { saveSelection(); checkActiveFormats(); }}
                onMouseUp={() => { saveSelection(); checkActiveFormats(); }}
                onFocus={saveSelection}
                className={`rich-text-editing-surface min-h-[300px] p-4 text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gold-500/50 prose prose-invert max-w-none ${readableMode ? 'is-readable' : ''}`}
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
                .prose ul {
                    list-style-type: disc !important;
                    padding-left: 1.5rem !important;
                    margin-top: 0.5rem !important;
                    margin-bottom: 0.5rem !important;
                }
                .prose ol {
                    list-style-type: decimal !important;
                    padding-left: 1.5rem !important;
                    margin-top: 0.5rem !important;
                    margin-bottom: 0.5rem !important;
                }
                .prose li {
                    margin-top: 0.25rem !important;
                    margin-bottom: 0.25rem !important;
                }
                /* FIX: Remove top margin from the first element to prevent cursor gap */
                .prose > :first-child {
                    margin-top: 0 !important;
                }
                .prose p {
                    margin-top: 0.5rem !important;
                    margin-bottom: 0.5rem !important;
                }
                .rich-text-editing-surface.is-readable,
                .rich-text-editing-surface.is-readable * {
                    color: #f4f4f5 !important;
                }
                .rich-text-editing-surface.is-readable a {
                    color: #7dd3fc !important;
                    text-decoration: underline;
                }
                .rich-text-editing-surface::selection,
                .rich-text-editing-surface *::selection {
                    background: rgba(212, 175, 55, 0.55);
                    color: #ffffff;
                }
            `}</style>
        </div>
    );
}
