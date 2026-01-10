'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { X, Check, Search, Upload, FolderPlus, Folder, MoreHorizontal, Edit, Trash2, LayoutGrid, List as ListIcon, Move } from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import MediaItemCard from './MediaItemCard';

interface MediaItem {
    id: number;
    file_name: string;
    file_path: string;
    mime_type: string;
    width: number | null;
    height: number | null;
    alt_text?: string;
    folder?: string;
}

interface MediaPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string | string[], id: number | number[]) => void;
    multiple?: boolean;
    inline?: boolean;
}

export default function MediaPicker({ isOpen, onClose, onSelect, multiple = false, inline = false }: MediaPickerProps) {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [folders, setFolders] = useState<{ name: string, count: number }[]>([]);
    const [currentFolder, setCurrentFolder] = useState<string>(''); // '' = All
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Bulk Edit State
    const [isSelectionMode, setIsSelectionMode] = useState(multiple || inline);
    const [showAltModal, setShowAltModal] = useState(false);
    const [altTextBuffer, setAltTextBuffer] = useState('');

    // Drag to Move State
    const [draggedMediaIds, setDraggedMediaIds] = useState<number[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            fetchFolders();
            fetchMedia();
            setSelectedItems([]);
            // In inline mode, we default to selection mode enabled for better UX
            setIsSelectionMode(multiple || inline);
        }
    }, [isOpen]);

    useEffect(() => {
        // If inline, fetch immediately on mount
        if (inline && !isOpen) {
            fetchFolders();
            fetchMedia();
        }
    }, [inline]);

    useEffect(() => {
        if (isOpen || inline) fetchMedia();
    }, [currentFolder]);

    const fetchFolders = async () => {
        try {
            const token = localStorage.getItem('admin_token') || localStorage.getItem('provider_token');
            const res = await fetch(`${getApiUrl('media')}?mode=folders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setFolders(data.folders);
            }
        } catch (error) {
            console.error('Failed to fetch folders', error);
        }
    };

    const fetchMedia = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token') || localStorage.getItem('provider_token');
            const url = currentFolder
                ? `${getApiUrl('media')}?folder=${encodeURIComponent(currentFolder)}`
                : getApiUrl('media');

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setMedia(data.media);
            }
        } catch (error) {
            console.error('Failed to fetch media', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Upload Logic ---
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        // Only show file upload overlay if dragging files from OS
        if (e.dataTransfer.types.includes('Files')) {
            setIsDraggingFile(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingFile(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingFile(false);

        // Handle file upload
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            await handleUpload(files);
        }
    };

    const handleUpload = async (files: File[]) => {
        setUploading(true);
        let targetFolder = currentFolder || 'uploads';
        const uploadedIds: number[] = [];

        const token = localStorage.getItem('admin_token') || localStorage.getItem('provider_token');
        if (!token) {
            toast.error('Nie jesteś zalogowany.');
            setUploading(false);
            return;
        }

        for (const file of files) {
            try {
                let fileToUpload = file;
                let fileName = file.name;

                // 1. Client-side WebP Compression & Conversion (Images only)
                if (file.type.startsWith('image/')) {
                    const options = {
                        maxSizeMB: 2,
                        maxWidthOrHeight: 2560,
                        useWebWorker: true,
                        fileType: 'image/webp'
                    };
                    try {
                        const compressedFile = await imageCompression(file, options);
                        // Rename to .webp if it wasn't already
                        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                        fileName = `${baseName}.webp`;
                        fileToUpload = new File([compressedFile], fileName, { type: 'image/webp' });
                        console.log(`[WebP] Converted ${file.name} to ${fileName} (${(compressedFile.size / 1024 / 1024).toFixed(2)} MB)`);
                    } catch (compressErr) {
                        console.error('Compression failed, using original', compressErr);
                    }
                }

                // 2. Get Presigned URL
                const presignedRes = await fetch(`${getApiUrl('media')}/upload/presigned`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fileName: fileName,
                        fileType: fileToUpload.type,
                        folder: targetFolder
                    }),
                });

                const { uploadUrl, key, publicUrl, error: preError } = await presignedRes.json();
                if (!presignedRes.ok) throw new Error(preError || 'Failed to get upload URL');

                // 3. Direct Upload to S3
                const s3Res = await fetch(uploadUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': fileToUpload.type },
                    body: fileToUpload,
                });

                if (!s3Res.ok) throw new Error('S3 Upload failed');

                // 4. Register in Database
                const regRes = await fetch(`${getApiUrl('media')}/upload/register`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fileName: key,
                        publicUrl: publicUrl,
                        fileSize: fileToUpload.size,
                        mimeType: fileToUpload.type,
                        folder: targetFolder
                    }),
                });

                const data = await regRes.json();
                if (data.success) {
                    uploadedIds.push(data.media.id);
                } else {
                    throw new Error(data.error || 'Registration failed');
                }
            } catch (error: any) {
                console.error('Upload flow failed', error);
                toast.error(`Błąd: ${file.name} - ${error.message}`);
            }
        }

        setUploading(false);
        if (uploadedIds.length > 0) {
            toast.success(`Wgrano ${uploadedIds.length} plik(ów)`);
            await fetchMedia();
            await fetchFolders();
        }
    };

    // --- Selection & Actions ---
    const toggleSelection = useCallback((item: MediaItem) => {
        setSelectedItems(prev => {
            const isSelected = prev.some(i => i.id === item.id);
            if (isSelected) {
                return prev.filter(i => i.id !== item.id);
            } else {
                return [...prev, item];
            }
        });
    }, []);

    const handleItemClick = useCallback((item: MediaItem) => {
        // Need to access the CURRENT state of isSelectionMode/multiple
        // This is tricky with useCallback without adding them to dependency, which defeats the purpose if they change.
        // However, isSelectionMode changes rarely.
        // BETTER APPROACH for MediaItemCard: Pass the logic down or use a ref for the mode if we want pure stability.
        // Just adding dependencies here is fine, the key is that 'item' is stable in loop? 
        // No, 'item' changes per iteration. The function instance 'handleItemClick' changes when deps change.

        // Actually, to make React.memo work best, we need stable function references.
        // But handleItemClick depends on 'isSelectionMode' and 'multiple'.
        // So passing it directly might update all cards when mode toggles (acceptable).
        // But effectively, 'toggleSelection' is the one mostly used in bulk mode.

        // We will trust the refs pattern or just accept update on mode change.

        if (isSelectionModeRef.current || multipleRef.current) {
            toggleSelection(item);
        } else {
            onSelect(item.file_path, item.id);
            if (!inline) onClose();
        }
    }, [toggleSelection, onSelect, inline, onClose]); // We will use refs for mutable booleans to keep this stable!

    // Refs for stable callbacks
    const isSelectionModeRef = useRef(isSelectionMode);
    const multipleRef = useRef(multiple);

    useEffect(() => { isSelectionModeRef.current = isSelectionMode; }, [isSelectionMode]);
    useEffect(() => { multipleRef.current = multiple; }, [multiple]);


    // --- Delete Logic ---
    const handleDelete = useCallback(async (ids: number[]) => {
        if (!confirm(`Czy na pewno chcesz usunąć ${ids.length} element(ów)?`)) return;

        const token = localStorage.getItem('admin_token') || localStorage.getItem('provider_token');
        let successCount = 0;

        for (const id of ids) {
            try {
                const res = await fetch(getApiUrl(`media/${id}`), {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) successCount++;
            } catch (err) {
                console.error('Delete failed', err);
            }
        }

        if (successCount > 0) {
            toast.success(`Usunięto ${successCount} zdjęć`);
            setSelectedItems([]);
            // We need to fetchMedia? Or just filter out locally to avoid flickering?
            // Local update is faster:
            setMedia(prev => prev.filter(m => !ids.includes(m.id)));
            // Also fetch to be sure
            // fetchMedia(); // Debounced or deferred?
        }
    }, []);

    // --- Drag to Move Logic ---
    const startDragMedia = useCallback((e: React.DragEvent, item: MediaItem) => {
        // Limitation: If we use selectedItems state here, we break memoization if we include it in dependency.
        // But drags start infrequently.
        // Actually for DataTransfer we need the data NOW. 
        // We can just rely on the component re-rendering when selectedItems changes (which it does anyway for visual check).

        // For 'MediaItemCard', we pass this function. If it changes, card re-renders.
        // Ideally we want it stable.

        // Let's rely on the fact that if you drag, you are interacting with ONE item.
        // We can check the DOM or Store? 
        // Let's keep it simple: It will re-render cards when 'selectedItems' changes. 
        // BUT we want to avoid re-rendering ALL cards when we just click one.

        // If we remove 'selectedItems' from dependency, we get stale closure.
        // We can use a Ref for selectedItems!

        const currentSelection = selectedItemsRef.current;
        let idsToDrag = [item.id];
        if (currentSelection.some(i => i.id === item.id)) {
            idsToDrag = currentSelection.map(i => i.id);
        }

        setDraggedMediaIds(idsToDrag);
        e.dataTransfer.setData('application/json', JSON.stringify({ ids: idsToDrag, type: 'media_move' }));
        e.dataTransfer.effectAllowed = 'move';
    }, []); // Empty dependency? using ref below.

    const selectedItemsRef = useRef(selectedItems);
    useEffect(() => { selectedItemsRef.current = selectedItems; }, [selectedItems]);

    const handleSelectAll = () => {
        if (selectedItems.length === filteredMedia.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems([...filteredMedia]);
        }
    };

    const onDropToFolder = async (e: React.DragEvent, targetFolderName: string) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            if (data.type === 'media_move' && data.ids) {
                await performBulkUpdate(data.ids, { folder: targetFolderName });
                toast.success(`Przeniesiono do ${targetFolderName}`);
            }
        } catch (err) {
            console.error('Drop failed', err);
        }
    };

    // --- API Operations ---
    const performBulkUpdate = async (ids: number[], updates: { folder?: string, alt_text?: string }) => {
        if (ids.length === 0) return;

        const token = localStorage.getItem('admin_token') || localStorage.getItem('provider_token');
        try {
            const res = await fetch(`${getApiUrl('media')}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ids, updates })
            });
            const data = await res.json();
            if (data.success) {
                // Success feedback?
                // Refresh
                await fetchMedia();
                await fetchFolders();
                setSelectedItems([]);
                setDraggedMediaIds([]);
            }
        } catch (error) {
            console.error('Bulk update failed', error);
            toast.error('Błąd aktualizacji');
        }
    };

    const handleBulkAltSave = async () => {
        const ids = selectedItems.map(i => i.id);
        await performBulkUpdate(ids, { alt_text: altTextBuffer });
        setShowAltModal(false);
        setAltTextBuffer('');
        toast.success('Zapisano opisy ALT');
    };

    const handleCreateFolder = () => {
        const name = prompt("Podaj nazwę nowego folderu:");
        if (name && name.trim()) {
            const cleanName = name.trim();
            setCurrentFolder(cleanName);

            // If folder doesn't exist in list, add it visually so we can drop to it
            if (!folders.some(f => f.name === cleanName)) {
                setFolders(prev => [...prev, { name: cleanName, count: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
                toast.success(`Utworzono folder "${cleanName}"`);
            }
        }
    };

    // --- Helpers ---
    const filteredMedia = useMemo(() => {
        return media.filter(item =>
            item.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.alt_text && item.alt_text.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [media, searchTerm]);

    if (!isOpen && !inline) return null;

    // --- RENDER HELPERS ---
    const Container = inline ? 'div' : 'div';
    const containerClasses = inline
        ? 'w-full h-full flex flex-col bg-zinc-950'
        : 'fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4';

    const contentClasses = inline
        ? 'flex-1 flex overflow-hidden border border-zinc-800 rounded-xl bg-zinc-900 shadow-sm'
        : `bg-zinc-900 rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] flex overflow-hidden border transition-colors ${isDraggingFile ? 'border-gold-500 ring-2 ring-gold-500/50' : 'border-zinc-800'}`;

    return (
        <Container
            className={containerClasses}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className={contentClasses}>

                {/* --- Left Sidebar: Folders --- */}
                <div className="w-16 md:w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col transition-all duration-300">
                    <div className="p-4 border-b border-zinc-800 flex justify-center md:justify-between items-center">
                        <span className="font-medium text-zinc-400 hidden md:block">Foldery</span>
                        <button onClick={handleCreateFolder} className="p-1 hover:bg-zinc-800 rounded" title="Nowy folder">
                            <FolderPlus className="w-5 h-5 text-gold-500" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        <button
                            onClick={() => setCurrentFolder('')}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => onDropToFolder(e, 'uploads')}
                            className={`w-full flex items-center justify-center md:justify-between px-2 md:px-3 py-2 rounded-lg text-sm transition-colors ${currentFolder === '' ? 'bg-gold-500/10 text-gold-500' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                            title="Wszystkie"
                        >
                            <span className="flex items-center gap-2">
                                <LayoutGrid className="w-5 h-5" />
                                <span className="hidden md:inline">Wszystkie</span>
                            </span>
                        </button>

                        {folders.map(folder => (
                            <button
                                key={folder.name}
                                onClick={() => setCurrentFolder(folder.name)}
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-zinc-800'); }}
                                onDragLeave={(e) => e.currentTarget.classList.remove('bg-zinc-800')}
                                onDrop={(e) => {
                                    e.currentTarget.classList.remove('bg-zinc-800');
                                    onDropToFolder(e, folder.name);
                                }}
                                className={`w-full flex items-center justify-center md:justify-between px-2 md:px-3 py-2 rounded-lg text-sm transition-colors ${currentFolder === folder.name ? 'bg-gold-500/10 text-gold-500' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                                title={folder.name}
                            >
                                <span className="flex items-center gap-2 overflow-hidden">
                                    <Folder className="w-5 h-5 shrink-0" />
                                    <span className="truncate hidden md:inline">{folder.name}</span>
                                </span>
                                <span className="text-xs text-zinc-600 hidden md:inline">{folder.count}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- Main Content --- */}
                <div className="flex-1 flex flex-col min-w-0 bg-zinc-900 relative">

                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2 truncate">
                            {currentFolder || 'Biblioteka'}
                            {uploading && <span className="text-xs font-normal text-gold-500 animate-pulse ml-2">• Wgrywanie...</span>}
                        </h2>

                        <div className="flex items-center gap-2">
                            <div className="relative hidden sm:block">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder="Szukaj..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-48 bg-zinc-950 border border-zinc-700 rounded-lg pl-10 pr-4 py-1.5 text-sm text-white focus:border-gold-500 focus:outline-none"
                                />
                            </div>
                            {!inline && (
                                <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800">
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="p-3 bg-zinc-900/50 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/50">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSelectAll}
                                className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
                            >
                                {selectedItems.length > 0 && selectedItems.length === filteredMedia.length ? 'Odznacz' : 'Zaznacz wszystkie'}
                            </button>
                            <button
                                onClick={() => setIsSelectionMode(!isSelectionMode)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${isSelectionMode ? 'bg-gold-500 text-black' : 'text-zinc-400 hover:text-white bg-zinc-800'}`}
                            >
                                {isSelectionMode ? 'Tryb: Wybór' : 'Tryb: Klik'}
                            </button>
                        </div>

                        <label className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-black text-xs font-bold rounded-md cursor-pointer hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/10">
                            <Upload className="w-4 h-4" />
                            <span>Wgraj Pliki</span>
                            <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,video/*,application/pdf" onChange={(e) => e.target.files && handleUpload(Array.from(e.target.files))} />
                        </label>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-zinc-900/30">
                        {loading ? (
                            <div className="text-center text-zinc-500 py-12">Ładowanie...</div>
                        ) : filteredMedia.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-500 border-2 border-dashed border-zinc-800 rounded-lg mx-4">
                                <Upload className="w-12 h-12 mb-4 opacity-50" />
                                <p>Przeciągnij pliki tutaj</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4 pb-20">
                                {filteredMedia.map((item) => (
                                    <MediaItemCard
                                        key={item.id}
                                        item={item}
                                        isSelected={selectedItems.some(i => i.id === item.id)}
                                        onToggle={toggleSelection}
                                        onClick={handleItemClick} // Changed: pass the main handler
                                        onDelete={handleDelete}
                                        onDragStart={startDragMedia}
                                        selectionMode={isSelectionMode}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bottom Bar (Actions) */}
                    <AnimatePresence>
                        {selectedItems.length > 0 && (
                            <motion.div
                                initial={{ y: 100 }}
                                animate={{ y: 0 }}
                                exit={{ y: 100 }}
                                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 z-50 min-w-[340px]"
                            >
                                <span className="text-zinc-300 text-sm font-medium mr-2">{selectedItems.length} wybrano</span>

                                <div className="h-4 w-px bg-zinc-600 mx-2" />

                                <button onClick={() => setShowAltModal(true)} className="flex items-center gap-2 text-sm text-white hover:text-gold-500 transition-colors">
                                    <Edit className="w-4 h-4" /> <span className="hidden sm:inline">Edytuj ALT</span>
                                </button>

                                <button onClick={() => handleDelete(selectedItems.map(i => i.id))} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors ml-2">
                                    <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Usuń</span>
                                </button>

                                {(!inline) ? (
                                    <button
                                        onClick={() => { onSelect(selectedItems.map(i => i.file_path), selectedItems.map(i => i.id)); onClose(); }}
                                        className="ml-auto bg-white text-black px-4 py-1.5 rounded-full text-sm font-bold hover:bg-gold-400 transition-colors"
                                    >
                                        Wstaw
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => { setSelectedItems([]) }}
                                        className="ml-auto text-zinc-400 hover:text-white p-1"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer for Modal Mode */}
                {!inline && (
                    <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-between items-center">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-zinc-400 hover:text-white text-sm font-medium"
                        >
                            Anuluj
                        </button>

                        <div className="flex items-center gap-3">
                            <span className="text-zinc-500 text-xs text-right">
                                {selectedItems.length > 0 ? `Wybrano: ${selectedItems.length}` : 'Kliknij zdjęcie, aby wybrać'}
                            </span>
                            {/* Show "Wstaw" if any items selected (even single mode manually) */}
                            {selectedItems.length > 0 && (
                                <button
                                    onClick={() => { onSelect(selectedItems.map(i => i.file_path), selectedItems.map(i => i.id)); onClose(); }}
                                    className="px-6 py-2 bg-gold-500 text-black font-bold rounded-md hover:bg-gold-400 transition-colors"
                                >
                                    Wstaw wybrane ({selectedItems.length})
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Alt Text Modal */}
            {showAltModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-lg w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-4">Edytuj tekst alternatywny (ALT)</h3>
                        <p className="text-sm text-zinc-400 mb-4">
                            Zmienisz tekst ALT dla <strong>{selectedItems.length}</strong> zaznaczonych elementów.
                        </p>
                        <input
                            type="text"
                            value={altTextBuffer}
                            onChange={(e) => setAltTextBuffer(e.target.value)}
                            placeholder="Wpisz opis zdjęcia..."
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:border-gold-500 mb-6"
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowAltModal(false)} className="px-4 py-2 text-zinc-400 hover:text-white">Anuluj</button>
                            <button onClick={handleBulkAltSave} className="px-6 py-2 bg-gold-500 text-black rounded-lg font-medium hover:bg-gold-400">Zapisz</button>
                        </div>
                    </div>
                </div>
            )}
        </Container>
    );
}
