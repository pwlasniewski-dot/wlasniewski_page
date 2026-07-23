'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api-config';
import { Upload, Trash2, Check, X, Eye, ImageIcon, Plus, ArrowLeft, Calendar, Save, ShoppingBag, Mail, Move, CheckSquare, Square, Download } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import GalleryParticipantsManager from './GalleryParticipantsManager';

interface GalleryPhoto {
    id: number;
    file_url: string;
    thumbnail_url: string | null;
    download_source_url?: string | null;
    thumbnail_source_url?: string | null;
    width?: number | null;
    height?: number | null;
    download_source_width?: number | null;
    download_source_height?: number | null;
    is_standard: boolean;
    order_index: number;
    created_at: string;
}

type SortMode =
    | 'manual'
    | 'newest'
    | 'oldest'
    | 'filename_asc'
    | 'filename_desc'
    | 'number_asc'
    | 'number_desc';

interface GalleryProduct {
    id: number;
    title: string;
    description: string | null;
    price: number;
    image_url: string | null;
    video_url: string | null;
    is_active: boolean;
    gallery_id: number | null;
}

interface Gallery {
    id: number;
    client_name: string;
    client_email: string;
    description: string | null;
    access_code: string;
    standard_count: number;
    price_per_premium: number;
    is_active: boolean;
    expires_at: string | null;
    photos: GalleryPhoto[];
    gallery_mode?: string;
    group_access_code?: string | null;
    group_password?: string | null;
    max_photos_for_print?: number | null;
    external_download_url?: string | null;
}

interface GalleryAdminProps {
    galleryId?: number | null;
    clientEmail?: string;
    clientName?: string;
    onClose: () => void;
    onCreated?: (galleryId: number) => void;
}

export default function GalleryAdmin({ galleryId, clientEmail, clientName, onClose, onCreated }: GalleryAdminProps) {
    const SAFE_UPLOAD_LIMIT_BYTES = 30 * 1024 * 1024;
    const MIN_DOWNLOAD_WIDTH = 3000;
    const MIN_DOWNLOAD_HEIGHT = 2000;

    const [gallery, setGallery] = useState<Gallery | null>(null);
    const [loading, setLoading] = useState(!!galleryId);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStats, setUploadStats] = useState({ current: 0, total: 0 });
    const [sendingAccessEmail, setSendingAccessEmail] = useState(false);
    const [standardSortMode, setStandardSortMode] = useState<SortMode>('manual');
    const [premiumSortMode, setPremiumSortMode] = useState<SortMode>('manual');
    const [draggedPhotoId, setDraggedPhotoId] = useState<number | null>(null);
    const [savingOrder, setSavingOrder] = useState(false);
    const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<number>>(new Set());
    const [deletingBulk, setDeletingBulk] = useState(false);
    const [replacingPhotoAction, setReplacingPhotoAction] = useState<{ photoId: number; mode: 'preview' | 'download' } | null>(null);
    const [showDogrywanieCompare, setShowDogrywanieCompare] = useState(false);

    // Settings logic
    const [isEditingSettings, setIsEditingSettings] = useState(false);
    const [editData, setEditData] = useState({
        standard_count: 0,
        price_per_premium: 0,
        expires_at: '',
        is_active: true,
        description: '',
        gallery_mode: 'INDIVIDUAL' as 'INDIVIDUAL' | 'GROUP',
        group_access_code: '',
        group_password: '',
        max_photos_for_print: '' as string | number,
        external_download_url: '',
    });

    // Create state
    const [newGallery, setNewGallery] = useState({
        client_name: clientName || '',
        client_email: clientEmail || '',
        standard_count: 10,
        price_per_premium: 2000,
        expires_days: 30,
        send_email: false,
        gallery_mode: 'INDIVIDUAL' as 'INDIVIDUAL' | 'GROUP',
        group_access_code: '',
        group_password: '',
        max_photos_for_print: '' as string | number,
        external_download_url: '',
    });
    const [creating, setCreating] = useState(false);

    // Product state
    const [products, setProducts] = useState<GalleryProduct[]>([]);
    const [newProduct, setNewProduct] = useState({
        title: '',
        description: '',
        price: 0,
        image_url: '',
        video_url: ''
    });
    const [isUploadingProductImage, setIsUploadingProductImage] = useState(false);

    useEffect(() => {
        if (galleryId) {
            setLoading(true);
            fetchGallery();
            fetchProducts();
        }
    }, [galleryId]);

    useEffect(() => {
        if (gallery) {
            setEditData({
                standard_count: gallery.standard_count,
                price_per_premium: gallery.price_per_premium,
                expires_at: gallery.expires_at ? gallery.expires_at.split('T')[0] : '',
                is_active: gallery.is_active,
                description: gallery.description || '',
                gallery_mode: (gallery.gallery_mode === 'GROUP' ? 'GROUP' : 'INDIVIDUAL'),
                group_access_code: gallery.group_access_code || '',
                group_password: gallery.group_password || '',
                max_photos_for_print: gallery.max_photos_for_print ?? '',
                external_download_url: gallery.external_download_url || '',
            });
        }
    }, [gallery]);

    useEffect(() => {
        if (draggedPhotoId === null) return;

        const EDGE_THRESHOLD = 140;
        const MAX_SCROLL_SPEED = 26;

        const handleWindowDragOver = (event: DragEvent) => {
            const y = event.clientY;
            if (!Number.isFinite(y)) return;

            const viewportHeight = window.innerHeight;
            let delta = 0;

            if (y < EDGE_THRESHOLD) {
                const ratio = (EDGE_THRESHOLD - y) / EDGE_THRESHOLD;
                delta = -Math.ceil(ratio * MAX_SCROLL_SPEED);
            } else if (y > viewportHeight - EDGE_THRESHOLD) {
                const ratio = (y - (viewportHeight - EDGE_THRESHOLD)) / EDGE_THRESHOLD;
                delta = Math.ceil(ratio * MAX_SCROLL_SPEED);
            }

            if (delta !== 0) {
                window.scrollBy({ top: delta, behavior: 'auto' });
            }
        };

        const clearDragState = () => setDraggedPhotoId(null);

        window.addEventListener('dragover', handleWindowDragOver);
        window.addEventListener('drop', clearDragState);
        window.addEventListener('dragend', clearDragState);

        return () => {
            window.removeEventListener('dragover', handleWindowDragOver);
            window.removeEventListener('drop', clearDragState);
            window.removeEventListener('dragend', clearDragState);
        };
    }, [draggedPhotoId]);

    const fetchGallery = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl(`admin/galleries/${galleryId}`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setGallery(data.gallery);
            }
        } catch (error) {
            toast.error('Nie udało się pobrać galerii');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl(`admin/products?gallery_id=${galleryId}`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setProducts(data.products);
            }
        } catch (error) {
            console.error('Failed to fetch products');
        }
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('admin_token');
            const payload: any = {
                standard_count: editData.standard_count,
                price_per_premium: editData.price_per_premium,
                expires_at: editData.expires_at,
                is_active: editData.is_active,
                description: editData.description,
                gallery_mode: editData.gallery_mode,
                external_download_url: editData.external_download_url || null,
            };
            payload.group_password = editData.group_password || null;
            if (editData.gallery_mode === 'GROUP') {
                payload.group_access_code = editData.group_access_code || null;
                payload.max_photos_for_print = editData.max_photos_for_print === '' ? null : Number(editData.max_photos_for_print);
            }
            const res = await fetch(getApiUrl(`admin/galleries/${galleryId}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (data.success) {
                setGallery(data.gallery);
                setIsEditingSettings(false);
                toast.success('Ustawienia zapisane');
            } else {
                toast.error('Błąd: ' + data.error);
            }
        } catch (error) {
            toast.error('Błąd zapisu');
        }
    };

    const handleCreateGallery = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const token = localStorage.getItem('admin_token');
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + newGallery.expires_days);

            const res = await fetch(getApiUrl('admin/galleries/create'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...newGallery,
                    expires_at: expiresAt.toISOString(),
                    send_email: newGallery.send_email,
                    group_access_code: newGallery.gallery_mode === 'GROUP' ? newGallery.group_access_code : undefined,
                    group_password: newGallery.group_password ? newGallery.group_password : undefined,
                    max_photos_for_print: newGallery.gallery_mode === 'GROUP' && newGallery.max_photos_for_print ? Number(newGallery.max_photos_for_print) : undefined,
                    external_download_url: newGallery.external_download_url || undefined,
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Galeria utworzona!');
                if (onCreated) onCreated(data.gallery.id);
            } else {
                toast.error(data.error || 'Nie udało się utworzyć galerii');
            }
        } catch (error) {
            toast.error('Błąd serwera');
        } finally {
            setCreating(false);
        }
    };

    const handleProductImageUpload = async (file: File) => {
        setIsUploadingProductImage(true);
        try {
            const token = localStorage.getItem('admin_token');
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(getApiUrl('admin/products/upload'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await res.json();
            if (data.success) {
                setNewProduct(prev => ({ ...prev, image_url: data.url }));
                toast.success('Zdjęcie wgrane');
            } else {
                toast.error(data.error || 'Błąd uploadu');
            }
        } catch (error) {
            toast.error('Błąd połączenia');
        } finally {
            setIsUploadingProductImage(false);
        }
    };

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl('admin/products'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...newProduct,
                    price: newProduct.price * 100, // Convert to grosze
                    gallery_id: galleryId
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Produkt dodany');
                setNewProduct({ title: '', description: '', price: 0, image_url: '', video_url: '' });
                fetchProducts();
            } else {
                toast.error(data.error || 'Błąd tworzenia produktu');
            }
        } catch (error) {
            toast.error('Błąd serwera');
        }
    };

    const handleDeleteProduct = async (id: number) => {
        if (!confirm('Czy na pewno chcesz usunąć ten album?')) return;
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl(`admin/products/${id}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Produkt usunięty');
                fetchProducts();
            } else {
                toast.error('Błąd usuwania');
            }
        } catch (error) {
            toast.error('Błąd serwera');
        }
    };

    const handleFileUpload = async (files: FileList, isStandard: boolean) => {
        if (!files || !galleryId) return;

        setUploading(true);
        setUploadProgress(0);

        const fileArray = Array.from(files);
        const totalFiles = fileArray.length;
        let uploadedCount = 0;
        let failedCount = 0;
        const failedDetails: string[] = [];

        setUploadStats({ current: 0, total: totalFiles });

        try {
            const token = localStorage.getItem('admin_token');

            const prepareFileForUpload = async (file: File): Promise<File> => file;

            // Upload each file individually to show real progress
            for (const file of fileArray) {
                try {
                    const fileToUpload = await prepareFileForUpload(file);

                    if (fileToUpload.size > SAFE_UPLOAD_LIMIT_BYTES) {
                        failedCount++;
                        failedDetails.push(`${file.name}: plik jest za duży po kompresji (${(fileToUpload.size / 1024 / 1024).toFixed(1)}MB, limit 5MB)`);
                        console.error(`File too large after compression: ${file.name}`, {
                            originalSize: file.size,
                            uploadSize: fileToUpload.size,
                        });

                        const completed = uploadedCount + failedCount;
                        const progress = Math.round((completed / totalFiles) * 100);
                        setUploadProgress(progress);
                        setUploadStats({ current: completed, total: totalFiles });
                        continue;
                    }

                    const formData = new FormData();
                    formData.append('photos', fileToUpload);
                    formData.append('is_standard', isStandard.toString());
                    formData.append('skip_optimization', 'true');

                    const res = await fetch(getApiUrl(`admin/galleries/${galleryId}/upload`), {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData,
                    });

                    const payload = await res.json().catch(() => null);

                    if (res.ok) {
                        const duplicateCount = Number(payload?.duplicate_count || 0);
                        if (duplicateCount > 0) {
                            failedCount++;
                            const duplicateName = payload?.duplicates?.[0]?.name || file.name;
                            failedDetails.push(`${duplicateName}: duplikat (już istnieje w galerii)`);
                        } else {
                            uploadedCount++;
                        }
                    } else {
                        failedCount++;
                        const parsedError = payload?.error || payload?.details || '';
                        const shortError = parsedError ? `${file.name}: ${parsedError}` : `${file.name}: Upload nieudany`;
                        failedDetails.push(shortError);
                        console.error(`Failed to upload ${file.name}:`, parsedError || 'Upload failed');
                    }
                } catch (fileError) {
                    failedCount++;
                    failedDetails.push(`${file.name}: ${String(fileError)}`);
                    console.error(`Error uploading ${file.name}:`, fileError);
                }

                // Update progress bar and stats
                const completed = uploadedCount + failedCount;
                const progress = Math.round((completed / totalFiles) * 100);
                setUploadProgress(progress);
                setUploadStats({ current: completed, total: totalFiles });
            }

            // Show results
            if (failedCount === 0) {
                toast.success(`✅ Wgrano ${uploadedCount} zdjęć`);
            } else if (uploadedCount > 0) {
                toast(`⚠️ Wgrano ${uploadedCount} zdjęć, ${failedCount} nieudanych`, { icon: '⚠️' });
                if (failedDetails.length > 0) {
                    toast.error(`Szczegóły: ${failedDetails[0]}`);
                }
            } else {
                toast.error(`❌ Wszystkie ${failedCount} zdjęć nie zostały wgrane`);
                if (failedDetails.length > 0) {
                    toast.error(`Szczegóły: ${failedDetails[0]}`);
                }
            }

            // Refresh gallery
            fetchGallery();
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Błąd podczas uploadu');
        } finally {
            setUploading(false);
            setTimeout(() => {
                setUploadProgress(0);
                setUploadStats({ current: 0, total: 0 });
            }, 1000);
        }
    };

    const deletePhoto = async (photoId: number) => {
        if (!confirm('Usunąć to zdjęcie?')) return;
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl(`admin/galleries/${galleryId}/photos/${photoId}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) fetchGallery();
        } catch (error) {
            toast.error('Błąd usuwania');
        }
    };

    const togglePhotoType = async (photoId: number, isStandard: boolean) => {
        try {
            const token = localStorage.getItem('admin_token');
            await fetch(getApiUrl(`admin/galleries/${galleryId}/photos/${photoId}`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_standard: !isStandard }),
            });
            fetchGallery();
        } catch (error) { }
    };

    const handleReplacePhoto = async (photoId: number, file: File, mode: 'preview' | 'download') => {
        if (!galleryId || !file) return;

        if (!file.type?.startsWith('image/')) {
            toast.error('Wybierz poprawny plik obrazu');
            return;
        }

        if (file.size > SAFE_UPLOAD_LIMIT_BYTES) {
            toast.error(`Plik jest za duży (${(file.size / 1024 / 1024).toFixed(1)}MB, limit 30MB)`);
            return;
        }

        setReplacingPhotoAction({ photoId, mode });
        try {
            const token = localStorage.getItem('admin_token');
            const formData = new FormData();
            formData.append('photo', file);
            formData.append('mode', mode);

            const res = await fetch(getApiUrl(`admin/galleries/${galleryId}/photos/${photoId}`), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                toast.error(data.error || 'Nie udało się podmienić zdjęcia');
                return;
            }

            toast.success(
                mode === 'download'
                    ? 'Podmieniono źródło pobierania (oryginał)'
                    : 'Podmieniono źródło podglądu'
            );
            fetchGallery();
        } catch (error) {
            toast.error('Błąd podmiany zdjęcia');
        } finally {
            setReplacingPhotoAction(null);
        }
    };

    const handleSendAccessEmail = async () => {
        if (!galleryId) return;
        setSendingAccessEmail(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl(`admin/galleries/${galleryId}/send-access-email`), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || 'Email z dostępem został wysłany');
            } else {
                toast.error(data.error || 'Nie udało się wysłać maila');
            }
        } catch (error) {
            toast.error('Błąd wysyłki maila');
        } finally {
            setSendingAccessEmail(false);
        }
    };

    const getFileNameFromUrl = (url: string) => {
        try {
            const withoutQuery = url.split('?')[0];
            const parts = withoutQuery.split('/');
            return decodeURIComponent(parts[parts.length - 1] || '').toLowerCase();
        } catch {
            return url.toLowerCase();
        }
    };

    const getNumericToken = (url: string): number | null => {
        const name = getFileNameFromUrl(url);
        const match = name.match(/(\d+)/);
        return match ? Number(match[1]) : null;
    };

    const sortPhotos = (photos: GalleryPhoto[], mode: SortMode) => {
        const list = [...photos];
        switch (mode) {
            case 'manual':
                return list.sort((a, b) => a.order_index - b.order_index);
            case 'newest':
                return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            case 'oldest':
                return list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            case 'filename_asc':
                return list.sort((a, b) => getFileNameFromUrl(a.file_url).localeCompare(getFileNameFromUrl(b.file_url), 'pl'));
            case 'filename_desc':
                return list.sort((a, b) => getFileNameFromUrl(b.file_url).localeCompare(getFileNameFromUrl(a.file_url), 'pl'));
            case 'number_asc':
                return list.sort((a, b) => {
                    const na = getNumericToken(a.file_url);
                    const nb = getNumericToken(b.file_url);
                    if (na === null && nb === null) return 0;
                    if (na === null) return 1;
                    if (nb === null) return -1;
                    return na - nb;
                });
            case 'number_desc':
                return list.sort((a, b) => {
                    const na = getNumericToken(a.file_url);
                    const nb = getNumericToken(b.file_url);
                    if (na === null && nb === null) return 0;
                    if (na === null) return 1;
                    if (nb === null) return -1;
                    return nb - na;
                });
            default:
                return list;
        }
    };

    const persistPhotoOrder = async (orderedIds: number[], isStandardGroup: boolean) => {
        if (!galleryId || orderedIds.length === 0) return;
        setSavingOrder(true);
        try {
            const token = localStorage.getItem('admin_token');
            const base = isStandardGroup ? 0 : 100000;
            await Promise.all(
                orderedIds.map((photoId, idx) =>
                    fetch(getApiUrl(`admin/galleries/${galleryId}/photos/${photoId}`), {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ order_index: base + idx + 1 }),
                    })
                )
            );

            setGallery(prev => {
                if (!prev) return prev;
                const orderMap = new Map<number, number>();
                orderedIds.forEach((id, idx) => orderMap.set(id, base + idx + 1));
                return {
                    ...prev,
                    photos: prev.photos.map(p => orderMap.has(p.id) ? { ...p, order_index: orderMap.get(p.id)! } : p),
                };
            });
            toast.success('Zapisano kolejność zdjęć');
        } catch (error) {
            toast.error('Nie udało się zapisać kolejności');
        } finally {
            setSavingOrder(false);
        }
    };

    const togglePhotoSelection = (photoId: number) => {
        setSelectedPhotoIds(prev => {
            const next = new Set(prev);
            if (next.has(photoId)) next.delete(photoId);
            else next.add(photoId);
            return next;
        });
    };

    const selectAllInGroup = (photos: GalleryPhoto[]) => {
        setSelectedPhotoIds(prev => {
            const next = new Set(prev);
            photos.forEach(p => next.add(p.id));
            return next;
        });
    };

    const deselectAllInGroup = (photos: GalleryPhoto[]) => {
        setSelectedPhotoIds(prev => {
            const next = new Set(prev);
            photos.forEach(p => next.delete(p.id));
            return next;
        });
    };

    const bulkDeletePhotos = async () => {
        if (selectedPhotoIds.size === 0) return;
        if (!confirm(`Usunąć ${selectedPhotoIds.size} zaznaczonych zdjęć? Tej operacji nie można cofnąć.`)) return;
        setDeletingBulk(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl(`admin/galleries/${galleryId}/photos/bulk-delete`), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ photoIds: Array.from(selectedPhotoIds) }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Usunięto ${data.deleted} zdjęć`);
                setSelectedPhotoIds(new Set());
                fetchGallery();
            } else {
                toast.error(data.error || 'Błąd usuwania');
            }
        } catch (error) {
            toast.error('Błąd połączenia');
        } finally {
            setDeletingBulk(false);
        }
    };

    const saveSortOrderForGroup = async (photos: GalleryPhoto[], isStandardGroup: boolean) => {
        await persistPhotoOrder(photos.map(p => p.id), isStandardGroup);
    };

    const movePhotoInGroup = async (targetId: number, isStandardGroup: boolean) => {
        if (!gallery || draggedPhotoId === null || draggedPhotoId === targetId) return;
        const currentGroup = sortPhotos(
            (gallery.photos || []).filter(p => p.is_standard === isStandardGroup),
            'manual'
        );
        const fromIndex = currentGroup.findIndex(p => p.id === draggedPhotoId);
        const toIndex = currentGroup.findIndex(p => p.id === targetId);
        if (fromIndex < 0 || toIndex < 0) return;

        const reordered = [...currentGroup];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);
        const ids = reordered.map(p => p.id);
        await persistPhotoOrder(ids, isStandardGroup);
    };

    if (loading) return <div className="p-12 text-center text-zinc-400 flex items-center justify-center gap-3"><ImageIcon className="animate-pulse" /> Wczytywanie galerii...</div>;

    if (!galleryId) {
        return (
            <div className="bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={onClose} className="p-3 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Nowa Galeria</h2>
                        <p className="text-zinc-500 text-sm">Klient: <span className="text-gold-400 font-semibold">{clientName}</span></p>
                    </div>
                </div>
                <form onSubmit={handleCreateGallery} className="space-y-6 max-w-lg">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-xs uppercase font-bold text-zinc-500 ml-1">Limit STANDARD</label>
                            <input
                                type="number"
                                value={newGallery.standard_count}
                                onChange={e => setNewGallery({ ...newGallery, standard_count: Number(e.target.value) })}
                                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs uppercase font-bold text-zinc-500 ml-1">Cena PREMIUM (zł)</label>
                            <input
                                type="number"
                                value={newGallery.price_per_premium / 100}
                                onChange={e => setNewGallery({ ...newGallery, price_per_premium: Number(e.target.value) * 100 })}
                                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition-colors"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs uppercase font-bold text-zinc-500 ml-1">Ważność linku (dni)</label>
                        <input
                            type="number"
                            value={newGallery.expires_days}
                            onChange={e => setNewGallery({ ...newGallery, expires_days: Number(e.target.value) })}
                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition-colors"
                        />
                    </div>

                    <label className="flex items-center gap-3 bg-black border border-zinc-800 rounded-xl px-4 py-3 cursor-pointer hover:border-zinc-700 transition-colors">
                        <input
                            type="checkbox"
                            checked={newGallery.send_email}
                            onChange={(e) => setNewGallery({ ...newGallery, send_email: e.target.checked })}
                            className="w-4 h-4 accent-gold-500"
                        />
                        <span className="text-sm text-zinc-200">Wyślij mail z dostępem od razu po utworzeniu galerii</span>
                    </label>

                    {/* Tryb galerii */}
                    <div className="space-y-3 pt-4 border-t border-zinc-800">
                        <label className="block text-xs uppercase font-bold text-zinc-500 ml-1">Tryb galerii</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setNewGallery({ ...newGallery, gallery_mode: 'INDIVIDUAL' })}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${newGallery.gallery_mode === 'INDIVIDUAL'
                                    ? 'border-gold-500 bg-gold-500/10'
                                    : 'border-zinc-800 bg-black hover:border-zinc-700'
                                    }`}
                            >
                                <div className="font-bold text-white text-sm mb-1">👤 Indywidualna</div>
                                <div className="text-xs text-zinc-500">1 klient = 1 kod</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setNewGallery({ ...newGallery, gallery_mode: 'GROUP' })}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${newGallery.gallery_mode === 'GROUP'
                                    ? 'border-purple-500 bg-purple-500/10'
                                    : 'border-zinc-800 bg-black hover:border-zinc-700'
                                    }`}
                            >
                                <div className="font-bold text-white text-sm mb-1">🌐 Grupowa</div>
                                <div className="text-xs text-zinc-500">Komunia, klasa, event</div>
                            </button>
                        </div>
                    </div>

                    {newGallery.gallery_mode === 'GROUP' && (
                        <div className="space-y-4 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                            <div className="space-y-2">
                                <label className="block text-xs uppercase font-bold text-zinc-500 ml-1">Kod grupowy *</label>
                                <input
                                    type="text"
                                    required={newGallery.gallery_mode === 'GROUP'}
                                    value={newGallery.group_access_code}
                                    onChange={e => setNewGallery({ ...newGallery, group_access_code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                                    placeholder="KOMUNIA2026"
                                    maxLength={20}
                                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono uppercase tracking-wider focus:border-purple-500 outline-none transition-colors"
                                />
                                <p className="text-[11px] text-zinc-500">Min. 4 znaki A-Z/0-9. Rozdaj wszystkim rodzicom.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs uppercase font-bold text-zinc-500 ml-1">Hasło grupowe (opcjonalne)</label>
                                <input
                                    type="text"
                                    value={newGallery.group_password}
                                    onChange={e => setNewGallery({ ...newGallery, group_password: e.target.value })}
                                    placeholder="np. parafia2026"
                                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs uppercase font-bold text-zinc-500 ml-1">Limit zdjęć do druku / rodzic (opcjonalne)</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={newGallery.max_photos_for_print}
                                    onChange={e => setNewGallery({ ...newGallery, max_photos_for_print: e.target.value })}
                                    placeholder="np. 5"
                                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs uppercase font-bold text-zinc-500 ml-1">Link do pobrania całej galerii (opcjonalne)</label>
                                <input
                                    type="url"
                                    value={newGallery.external_download_url}
                                    onChange={e => setNewGallery({ ...newGallery, external_download_url: e.target.value })}
                                    placeholder="https://adobe.ly/..."
                                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-colors"
                                />
                                <p className="text-[11px] text-zinc-500">Po zapisaniu tekst „lub pobierz całą galerię” otworzy ten link.</p>
                            </div>
                        </div>
                    )}

                    {newGallery.gallery_mode === 'INDIVIDUAL' && (
                        <div className="space-y-2 p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl">
                            <label className="block text-xs uppercase font-bold text-zinc-500 ml-1">Hasło udostępniania rodzinie (opcjonalne)</label>
                            <input
                                type="text"
                                value={newGallery.group_password}
                                onChange={e => setNewGallery({ ...newGallery, group_password: e.target.value })}
                                placeholder="np. rodzina-nowak"
                                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition-colors"
                            />
                            <p className="text-[11px] text-zinc-500">Właściciel galerii wejdzie po zalogowaniu. To hasło służy tylko do udostępnienia linku rodzinie.</p>
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={creating}
                        className="w-full py-4 bg-gold-600 text-black font-black uppercase tracking-widest text-sm rounded-xl hover:bg-gold-500 transition-all shadow-lg shadow-gold-900/10 disabled:opacity-50"
                    >
                        {creating ? 'Inicjalizacja...' : 'Stwórz i Aktywuj Galerię'}
                    </button>
                </form>
            </div>
        );
    }

    if (!gallery) return <div className="p-12 text-center text-red-500 font-bold bg-red-500/10 rounded-2xl border border-red-500/20">Błąd krytyczny: Galeria nie istnieje.</div>;

    const standardPhotos = sortPhotos((gallery.photos || []).filter(p => p.is_standard), standardSortMode);
    const premiumPhotos = sortPhotos((gallery.photos || []).filter(p => !p.is_standard), premiumSortMode);
    const allPhotos = gallery.photos || [];
    const mappedDownloadCount = allPhotos.filter(p => !!p.download_source_url).length;
    const mappingProgressPercent = allPhotos.length > 0 ? Math.round((mappedDownloadCount / allPhotos.length) * 100) : 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-5">
                    <button onClick={onClose} className="p-3 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Edytor Galerii</h2>
                            {!gallery.is_active && <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-[10px] font-bold uppercase rounded">Nieaktywna</span>}
                        </div>
                        <p className="text-zinc-500 text-sm font-medium">Kod dostępu: <span className="text-gold-500 font-mono font-bold tracking-wider">{gallery.access_code}</span></p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSendAccessEmail}
                        disabled={sendingAccessEmail}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all text-sm font-bold disabled:opacity-50"
                    >
                        <Mail className="w-4 h-4" />
                        {sendingAccessEmail ? 'Wysyłanie...' : 'Wyślij mail'}
                    </button>
                    <button
                        onClick={() => setIsEditingSettings(!isEditingSettings)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all text-sm font-bold ${isEditingSettings ? 'bg-gold-500 border-gold-500 text-black shadow-lg shadow-gold-500/20' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700'}`}
                    >
                        <Calendar className="w-4 h-4" />
                        Ustawienia
                    </button>
                    <a href={`/galeria/${gallery.access_code}`} target="_blank" className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl border border-zinc-700 shadow-md transition-all">
                        <Eye className="w-4 h-4" /> Podgląd
                    </a>
                    <a href={`/admin/galleries/${galleryId}/jpg-map`} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl border border-emerald-700 shadow-md transition-all">
                        <ImageIcon className="w-4 h-4" /> Porządkuj JPG
                    </a>
                </div>
            </div>

            {/* Settings Editor */}
            {isEditingSettings && (
                <div className="bg-zinc-900 border border-gold-500/30 rounded-2xl p-8 shadow-2xl animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-gold-500/10 rounded-lg">
                            <Calendar className="w-5 h-5 text-gold-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Kofiguracja parametrów</h3>
                    </div>
                    <form onSubmit={handleUpdateSettings} className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-zinc-500 uppercase ml-1 tracking-widest">Limit Standard</label>
                            <input
                                type="number"
                                value={editData.standard_count}
                                onChange={(e) => setEditData({ ...editData, standard_count: parseInt(e.target.value) })}
                                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2 col-span-1 md:col-span-4">
                            <label className="block text-xs font-bold text-zinc-500 uppercase ml-1 tracking-widest">Opis dla klienta (opcjonalny)</label>
                            <textarea
                                value={editData.description || ''}
                                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition-all min-h-[100px]"
                                placeholder="Dodatkowe informacje, podziękowania za sesję..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-zinc-500 uppercase ml-1 tracking-widest">Cena Premium (zł)</label>
                            <input
                                type="number"
                                value={editData.price_per_premium / 100}
                                onChange={(e) => setEditData({ ...editData, price_per_premium: Math.round(parseFloat(e.target.value) * 100) })}
                                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-zinc-500 uppercase ml-1 tracking-widest">Wygasa dnia</label>
                            <input
                                type="date"
                                value={editData.expires_at}
                                onChange={(e) => setEditData({ ...editData, expires_at: e.target.value })}
                                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-end gap-3">
                            <label className="flex items-center gap-3 bg-black border border-zinc-800 rounded-xl px-5 py-[11px] cursor-pointer h-[50px] transition-colors hover:border-zinc-700">
                                <input
                                    type="checkbox"
                                    checked={editData.is_active}
                                    onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
                                    className="hidden"
                                />
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${editData.is_active ? 'bg-gold-500 border-gold-500' : 'bg-zinc-900 border-zinc-700'}`}>
                                    {editData.is_active && <Check className="w-4 h-4 text-black" />}
                                </div>
                                <span className="text-sm font-bold text-white">Aktywna</span>
                            </label>
                            <button
                                type="submit"
                                className="flex-1 bg-gold-500 hover:bg-gold-400 text-black font-black uppercase tracking-widest text-xs py-[15px] rounded-xl transition-all shadow-lg shadow-gold-900/20 flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Zapisz
                            </button>
                        </div>

                        {/* Tryb galerii - edycja */}
                        <div className="col-span-1 md:col-span-4 space-y-3 pt-6 border-t border-zinc-800">
                            <label className="block text-xs font-bold text-zinc-500 uppercase ml-1 tracking-widest">Tryb galerii</label>
                            <div className="grid grid-cols-2 gap-3 max-w-md">
                                <button
                                    type="button"
                                    onClick={() => setEditData({ ...editData, gallery_mode: 'INDIVIDUAL' })}
                                    className={`p-3 rounded-xl border-2 text-left transition-all ${editData.gallery_mode === 'INDIVIDUAL'
                                        ? 'border-gold-500 bg-gold-500/10'
                                        : 'border-zinc-800 bg-black hover:border-zinc-700'
                                        }`}
                                >
                                    <div className="font-bold text-white text-sm">👤 Indywidualna</div>
                                    <div className="text-[11px] text-zinc-500">1 klient = 1 kod</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditData({ ...editData, gallery_mode: 'GROUP' })}
                                    className={`p-3 rounded-xl border-2 text-left transition-all ${editData.gallery_mode === 'GROUP'
                                        ? 'border-purple-500 bg-purple-500/10'
                                        : 'border-zinc-800 bg-black hover:border-zinc-700'
                                        }`}
                                >
                                    <div className="font-bold text-white text-sm">🌐 Grupowa</div>
                                    <div className="text-[11px] text-zinc-500">Komunia, klasa, event</div>
                                </button>
                            </div>
                        </div>

                        {editData.gallery_mode === 'GROUP' && (
                            <div className="col-span-1 md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-zinc-500 uppercase ml-1 tracking-widest">Kod grupowy</label>
                                    <input
                                        type="text"
                                        value={editData.group_access_code}
                                        onChange={(e) => setEditData({ ...editData, group_access_code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                                        maxLength={20}
                                        placeholder="KOMUNIA2026"
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono uppercase tracking-wider focus:border-purple-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-zinc-500 uppercase ml-1 tracking-widest">Hasło (opcjonalne)</label>
                                    <input
                                        type="text"
                                        value={editData.group_password}
                                        onChange={(e) => setEditData({ ...editData, group_password: e.target.value })}
                                        placeholder="np. parafia2026"
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-zinc-500 uppercase ml-1 tracking-widest">Limit druku / rodzic</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={editData.max_photos_for_print}
                                        onChange={(e) => setEditData({ ...editData, max_photos_for_print: e.target.value })}
                                        placeholder="np. 5"
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-3">
                                    <label className="block text-xs font-bold text-zinc-500 uppercase ml-1 tracking-widest">Link do pobrania całej galerii</label>
                                    <input
                                        type="url"
                                        value={editData.external_download_url}
                                        onChange={(e) => setEditData({ ...editData, external_download_url: e.target.value })}
                                        placeholder="https://adobe.ly/..."
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-all"
                                    />
                                    <p className="text-[11px] text-zinc-500">Opcjonalnie. Link zastępuje standardowe pobieranie ZIP pod tekstem „lub pobierz całą galerię”.</p>
                                </div>
                            </div>
                        )}

                        {editData.gallery_mode === 'INDIVIDUAL' && (
                            <div className="col-span-1 md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-zinc-500 uppercase ml-1 tracking-widest">Hasło udostępniania rodzinie</label>
                                    <input
                                        type="text"
                                        value={editData.group_password}
                                        onChange={(e) => setEditData({ ...editData, group_password: e.target.value })}
                                        placeholder="puste = tylko właściciel"
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="text-xs text-zinc-500 leading-relaxed self-center">
                                    W tym trybie: właściciel galerii ma dostęp po zalogowaniu na swoje konto.
                                    Dodatkowo może przekazać link rodzinie z tym hasłem.
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            )}

            {/* Products Section */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8">
                <h3 className="text-xs font-black text-gold-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                    <div className="p-2 bg-gold-500/10 rounded-lg"><ShoppingBag className="w-4 h-4" /></div>
                    Sklep z Albumami
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Add Product Form */}
                    <form onSubmit={handleCreateProduct} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Nazwa Albumu (np. Fotoalbum 30x30)"
                            value={newProduct.title}
                            onChange={e => setNewProduct({ ...newProduct, title: e.target.value })}
                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition-all text-sm"
                            required
                        />
                        <textarea
                            placeholder="Opis albumu..."
                            value={newProduct.description || ''}
                            onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition-all text-sm h-24"
                        />
                        <div className="space-y-2">
                            <div className="flex gap-4">
                                <input
                                    type="number"
                                    placeholder="Cena (PLN)"
                                    value={newProduct.price || ''}
                                    onChange={e => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                                    className="w-1/3 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition-all text-sm"
                                    required
                                />
                                <div className="flex-1 relative">
                                    <input
                                        type="file"
                                        id="product-image-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && handleProductImageUpload(e.target.files[0])}
                                        disabled={isUploadingProductImage}
                                    />
                                    <label
                                        htmlFor="product-image-upload"
                                        className={`w-full h-full flex items-center justify-center gap-2 border border-dashed rounded-xl cursor-pointer transition-all text-xs font-bold uppercase tracking-widest ${newProduct.image_url ? 'border-green-500/50 text-green-400 bg-green-500/5' : 'border-zinc-800 text-zinc-500 hover:border-gold-500/50 hover:text-gold-400 bg-black'
                                            }`}
                                    >
                                        {isUploadingProductImage ? (
                                            <div className="w-4 h-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
                                        ) : newProduct.image_url ? (
                                            <><Check size={14} /> Zdjęcie Gotowe</>
                                        ) : (
                                            <><Upload size={14} /> Wgraj Zdjęcie</>
                                        )}
                                    </label>
                                </div>
                            </div>
                            {newProduct.image_url && (
                                <div className="flex items-center gap-3 p-2 bg-zinc-900/50 rounded-lg border border-zinc-800 animate-in fade-in slide-in-from-top-1">
                                    <div className="w-10 h-10 relative rounded overflow-hidden flex-shrink-0">
                                        <Image src={newProduct.image_url} alt="Preview" fill className="object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-zinc-500 truncate">{newProduct.image_url}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setNewProduct({ ...newProduct, image_url: '' })}
                                        className="p-1 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded transition-all"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <input
                            type="url"
                            placeholder="URL wideo prezentacji (opcjonalne - YouTube/Vimeo)"
                            value={newProduct.video_url || ''}
                            onChange={e => setNewProduct({ ...newProduct, video_url: e.target.value })}
                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition-all text-sm"
                        />
                        <button
                            type="submit"
                            className="w-full py-3 bg-gold-500 text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-gold-400 transition-all"
                        >
                            Dodaj Ofertę Albumu
                        </button>
                    </form>

                    {/* Product List */}
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {products.map(product => (
                            <div key={product.id} className="flex gap-4 p-4 bg-black/40 border border-zinc-800 rounded-xl hover:border-gold-500/30 transition-all">
                                {product.image_url ? (
                                    <div className="w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0">
                                        <Image src={product.image_url} alt={product.title} fill className="object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 bg-zinc-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <ShoppingBag className="w-8 h-8 text-zinc-700" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white text-sm truncate">{product.title}</h4>
                                    <p className="text-gold-500 font-black text-lg">{(product.price / 100).toFixed(2)} zł</p>
                                    <p className="text-zinc-500 text-xs line-clamp-2">{product.description}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase rounded text-center">Aktywny</div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteProduct(product.id)}
                                        className="p-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-lg transition-all flex items-center justify-center"
                                        title="Usuń ofertę"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {products.length === 0 && (
                            <div className="text-center py-10 text-zinc-500 text-sm">Brak ofert albumów. Dodaj pierwszą po lewej.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Participants Manager */}
            <GalleryParticipantsManager galleryId={gallery.id} />

            {/* Upload Area */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Wgraj zdjęcia do galerii</h3>
                    <span className="text-xs font-bold text-emerald-400">Pełna jakość zawsze włączona</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="border-2 border-dashed border-zinc-800 rounded-2xl p-10 hover:border-green-500/50 hover:bg-green-500/5 transition-all cursor-pointer text-center group relative overflow-hidden">
                        <input type="file" multiple accept="image/*" onChange={e => e.target.files && handleFileUpload(e.target.files, true)} className="hidden" disabled={uploading} />
                        <Upload className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-40 group-hover:opacity-100 group-hover:-translate-y-1 transition-all" />
                        <div className="text-sm font-black text-white tracking-widest mb-1">STANDARD</div>
                        <p className="text-zinc-500 text-xs">Bezpłatne dla klienta</p>
                    </label>
                    <label className="border-2 border-dashed border-zinc-800 rounded-2xl p-10 hover:border-gold-500/50 hover:bg-gold-500/5 transition-all cursor-pointer text-center group relative overflow-hidden">
                        <input type="file" multiple accept="image/*" onChange={e => e.target.files && handleFileUpload(e.target.files, false)} className="hidden" disabled={uploading} />
                        <Upload className="w-12 h-12 text-gold-500 mx-auto mb-4 opacity-40 group-hover:opacity-100 group-hover:-translate-y-1 transition-all" />
                        <div className="text-sm font-black text-white tracking-widest mb-1">PREMIUM</div>
                        <p className="text-zinc-500 text-xs">Płatne {(gallery.price_per_premium / 100).toFixed(2)} zł / szt</p>
                    </label>
                </div>
                {uploading && (
                    <div className="mt-8 space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase text-zinc-500 tracking-tighter">
                            <span>Przesyłanie zdjęć {uploadStats.current}/{uploadStats.total}</span>
                            <span>{uploadProgress}%</span>
                        </div>
                        <div className="bg-black/50 rounded-full h-1.5 overflow-hidden border border-zinc-900">
                            <div className="bg-gold-500 h-full transition-all duration-300 shadow-[0_0_10px_rgba(234,179,8,0.5)]" style={{ width: `${uploadProgress}%` }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Mapping progress */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8">
                <div className="flex items-center justify-between gap-4 mb-6">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Mapa postępu mapowania źródła pobierania</h3>
                    <div className="flex items-center gap-4 flex-wrap justify-end">
                        <a
                            href={`/admin/galleries/${galleryId}/jpg-map`}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all"
                        >
                            <ImageIcon className="w-4 h-4" /> Mapowanie JPG (auto)
                        </a>
                        <label className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
                            <input
                                type="checkbox"
                                checked={showDogrywanieCompare}
                                onChange={(e) => setShowDogrywanieCompare(e.target.checked)}
                                className="accent-emerald-500"
                            />
                            Tryb dogrywania: WEBP ↔ JPG
                        </label>
                        <span className="text-xs font-bold text-zinc-300">
                            {mappedDownloadCount}/{allPhotos.length} zdjęć gotowych do full download ({mappingProgressPercent}%)
                        </span>
                    </div>
                </div>
                <div className="bg-black/50 rounded-full h-2 overflow-hidden border border-zinc-900 mb-4">
                    <div
                        className="bg-emerald-500 h-full transition-all duration-500"
                        style={{ width: `${mappingProgressPercent}%` }}
                    />
                </div>
                <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-16 lg:grid-cols-20 gap-1.5">
                    {allPhotos.map((photo) => {
                        const isMapped = !!photo.download_source_url;
                        return (
                            <div
                                key={photo.id}
                                title={`#${photo.id} ${isMapped ? 'ZMAPOWANE' : 'WYMAGA MAPOWANIA'} ${photo.download_source_width ? `· ${photo.download_source_width}x${photo.download_source_height}` : ''}`}
                                className={`h-3 rounded ${isMapped ? 'bg-emerald-500/90' : 'bg-amber-500/90'}`}
                            />
                        );
                    })}
                </div>
                <p className="text-xs text-zinc-500 mt-4">
                    Zielone: źródło pobierania zmapowane. Pomarańczowe: kliknij zielony button (📥) na karcie zdjęcia aby zmapować źródło pobierania.
                </p>
                {showDogrywanieCompare && (
                    <p className="text-xs text-emerald-300 mt-2">
                        Tryb dogrywania aktywny: na kartach zobaczysz po lewej wcześniejszy podgląd (WEBP), po prawej zmapowany JPG full.
                    </p>
                )}
            </div>

            {/* Bulk delete bar */}
            {selectedPhotoIds.size > 0 && (
                <div className="sticky top-4 z-20 flex items-center justify-between gap-4 bg-red-950/90 border border-red-500/40 rounded-2xl px-6 py-4 shadow-2xl backdrop-blur">
                    <span className="text-white font-bold text-sm">
                        Zaznaczono: <span className="text-red-400 font-black">{selectedPhotoIds.size}</span> zdjęć
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSelectedPhotoIds(new Set())}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all"
                        >
                            Odznacz wszystkie
                        </button>
                        <button
                            onClick={bulkDeletePhotos}
                            disabled={deletingBulk}
                            className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-red-900/40"
                        >
                            <Trash2 className="w-4 h-4" />
                            {deletingBulk ? 'Usuwanie...' : `Usuń zaznaczone (${selectedPhotoIds.size})`}
                        </button>
                    </div>
                </div>
            )}

            {/* Photos Grids */}
            <div className="space-y-12">
                {/* Standard */}
                {standardPhotos.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                Zdjęcia Standard ({standardPhotos.length})
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Select all / deselect all for this group */}
                                {standardPhotos.every(p => selectedPhotoIds.has(p.id)) ? (
                                    <button
                                        onClick={() => deselectAllInGroup(standardPhotos)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-all"
                                    >
                                        <Square className="w-3.5 h-3.5" /> Odznacz grupę
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => selectAllInGroup(standardPhotos)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-all"
                                    >
                                        <CheckSquare className="w-3.5 h-3.5" /> Zaznacz grupę
                                    </button>
                                )}
                                <Move className="w-4 h-4 text-zinc-500" />
                                <select
                                    value={standardSortMode}
                                    onChange={(e) => setStandardSortMode(e.target.value as SortMode)}
                                    className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200"
                                >
                                    <option value="manual">Ręcznie (złap i przesuń)</option>
                                    <option value="newest">Data dodania: najnowsze</option>
                                    <option value="oldest">Data dodania: najstarsze</option>
                                    <option value="filename_asc">Nazwa pliku: A-Z</option>
                                    <option value="filename_desc">Nazwa pliku: Z-A</option>
                                    <option value="number_asc">Numer zdjęcia: rosnąco</option>
                                    <option value="number_desc">Numer zdjęcia: malejąco</option>
                                </select>
                                {standardSortMode !== 'manual' && (
                                    <button
                                        onClick={() => saveSortOrderForGroup(standardPhotos, true)}
                                        disabled={savingOrder}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                        title="Zapisz tę kolejność jako stałą (widoczną dla klienta)"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        {savingOrder ? 'Zapisywanie...' : 'Zapisz kolejność'}
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {standardPhotos.map(photo => (
                                <AdminPhotoCard
                                    key={photo.id}
                                    photo={photo}
                                    isSelected={selectedPhotoIds.has(photo.id)}
                                    onToggleSelect={() => togglePhotoSelection(photo.id)}
                                    onToggle={() => togglePhotoType(photo.id, photo.is_standard)}
                                    onDelete={() => deletePhoto(photo.id)}
                                    onReplacePreview={(file) => handleReplacePhoto(photo.id, file, 'preview')}
                                    onReplaceDownload={(file) => handleReplacePhoto(photo.id, file, 'download')}
                                    isReplacingPreview={replacingPhotoAction?.photoId === photo.id && replacingPhotoAction?.mode === 'preview'}
                                    isReplacingDownload={replacingPhotoAction?.photoId === photo.id && replacingPhotoAction?.mode === 'download'}
                                    showDogrywanieCompare={showDogrywanieCompare}
                                    isDraggable={standardSortMode === 'manual'}
                                    isSavingOrder={savingOrder}
                                    onDragStart={(e) => {
                                        if (standardSortMode !== 'manual') return;
                                        e.dataTransfer.setData('text/plain', String(photo.id));
                                        e.dataTransfer.effectAllowed = 'move';
                                        setDraggedPhotoId(photo.id);
                                    }}
                                    onDragOver={(e) => {
                                        if (standardSortMode !== 'manual') return;
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = 'move';
                                    }}
                                    onDrop={async () => {
                                        if (standardSortMode !== 'manual') return;
                                        await movePhotoInGroup(photo.id, true);
                                        setDraggedPhotoId(null);
                                    }}
                                    onDragEnd={() => setDraggedPhotoId(null)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Premium */}
                {premiumPhotos.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-gold-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                                Dodatkowe Premium ({premiumPhotos.length})
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Select all / deselect all for this group */}
                                {premiumPhotos.every(p => selectedPhotoIds.has(p.id)) ? (
                                    <button
                                        onClick={() => deselectAllInGroup(premiumPhotos)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-all"
                                    >
                                        <Square className="w-3.5 h-3.5" /> Odznacz grupę
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => selectAllInGroup(premiumPhotos)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-all"
                                    >
                                        <CheckSquare className="w-3.5 h-3.5" /> Zaznacz grupę
                                    </button>
                                )}
                                <Move className="w-4 h-4 text-zinc-500" />
                                <select
                                    value={premiumSortMode}
                                    onChange={(e) => setPremiumSortMode(e.target.value as SortMode)}
                                    className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200"
                                >
                                    <option value="manual">Ręcznie (złap i przesuń)</option>
                                    <option value="newest">Data dodania: najnowsze</option>
                                    <option value="oldest">Data dodania: najstarsze</option>
                                    <option value="filename_asc">Nazwa pliku: A-Z</option>
                                    <option value="filename_desc">Nazwa pliku: Z-A</option>
                                    <option value="number_asc">Numer zdjęcia: rosnąco</option>
                                    <option value="number_desc">Numer zdjęcia: malejąco</option>
                                </select>
                                {premiumSortMode !== 'manual' && (
                                    <button
                                        onClick={() => saveSortOrderForGroup(premiumPhotos, false)}
                                        disabled={savingOrder}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-700 hover:bg-gold-600 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                        title="Zapisz tę kolejność jako stałą (widoczną dla klienta)"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        {savingOrder ? 'Zapisywanie...' : 'Zapisz kolejność'}
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {premiumPhotos.map(photo => (
                                <AdminPhotoCard
                                    key={photo.id}
                                    photo={photo}
                                    isSelected={selectedPhotoIds.has(photo.id)}
                                    onToggleSelect={() => togglePhotoSelection(photo.id)}
                                    onToggle={() => togglePhotoType(photo.id, photo.is_standard)}
                                    onDelete={() => deletePhoto(photo.id)}
                                    onReplacePreview={(file) => handleReplacePhoto(photo.id, file, 'preview')}
                                    onReplaceDownload={(file) => handleReplacePhoto(photo.id, file, 'download')}
                                    isReplacingPreview={replacingPhotoAction?.photoId === photo.id && replacingPhotoAction?.mode === 'preview'}
                                    isReplacingDownload={replacingPhotoAction?.photoId === photo.id && replacingPhotoAction?.mode === 'download'}
                                    showDogrywanieCompare={showDogrywanieCompare}
                                    isDraggable={premiumSortMode === 'manual'}
                                    isSavingOrder={savingOrder}
                                    onDragStart={(e) => {
                                        if (premiumSortMode !== 'manual') return;
                                        e.dataTransfer.setData('text/plain', String(photo.id));
                                        e.dataTransfer.effectAllowed = 'move';
                                        setDraggedPhotoId(photo.id);
                                    }}
                                    onDragOver={(e) => {
                                        if (premiumSortMode !== 'manual') return;
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = 'move';
                                    }}
                                    onDrop={async () => {
                                        if (premiumSortMode !== 'manual') return;
                                        await movePhotoInGroup(photo.id, false);
                                        setDraggedPhotoId(null);
                                    }}
                                    onDragEnd={() => setDraggedPhotoId(null)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {(gallery.photos || []).length === 0 && (
                    <div className="bg-zinc-900/20 border border-zinc-800 border-dashed rounded-3xl py-24 text-center">
                        <ImageIcon className="w-16 h-16 mx-auto mb-6 text-zinc-800 opacity-20" />
                        <p className="text-zinc-600 font-medium italic">Galeria jest obecnie pusta. Dodaj zdjęcia powyżej.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function AdminPhotoCard({
    photo,
    isSelected,
    onToggleSelect,
    onToggle,
    onDelete,
    onReplacePreview,
    onReplaceDownload,
    isReplacingPreview,
    isReplacingDownload,
    showDogrywanieCompare,
    isDraggable,
    isSavingOrder,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
}: {
    photo: GalleryPhoto,
    isSelected?: boolean,
    onToggleSelect?: () => void,
    onToggle: () => void,
    onDelete: () => void,
    onReplacePreview?: (file: File) => void,
    onReplaceDownload?: (file: File) => void,
    isReplacingPreview?: boolean,
    isReplacingDownload?: boolean,
    showDogrywanieCompare?: boolean,
    isDraggable?: boolean,
    isSavingOrder?: boolean,
    onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void,
    onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void,
    onDrop?: () => void,
    onDragEnd?: () => void,
}) {
    const hasMappedDownload = !!photo.download_source_url;

    return (
        <div
            draggable={!!isDraggable && !isSavingOrder}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
            className={`group relative aspect-square bg-zinc-900 rounded-2xl overflow-hidden border transition-all shadow-lg hover:shadow-black/50 ${
                isSelected
                    ? 'border-red-500 ring-2 ring-red-500 ring-offset-1 ring-offset-zinc-950'
                    : 'border-zinc-800 hover:border-zinc-700'
            } ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >
            <Image
                src={photo.thumbnail_url || photo.file_url}
                alt="Photo"
                fill
                sizes="(max-width: 768px) 50vw, 20vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {/* Selection overlay */}
            {isSelected && <div className="absolute inset-0 bg-red-500/20 pointer-events-none" />}

            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3 backdrop-blur-[2px]">
                <button
                    onClick={onToggle}
                    className={`p-2.5 rounded-xl transition-all shadow-lg ${photo.is_standard ? 'bg-gold-500 text-black hover:bg-gold-400' : 'bg-green-500 text-white hover:bg-green-400'}`}
                    title={photo.is_standard ? 'Zmień na Premium' : 'Zmień na Standard'}
                >
                    {photo.is_standard ? <Plus className="w-4 h-4 font-black" /> : <Check className="w-4 h-4 font-black" />}
                </button>
                <button
                    onClick={onDelete}
                    className="p-2.5 bg-red-500 hover:bg-red-400 text-white rounded-xl transition-all shadow-lg shadow-red-900/20"
                    title="Usuń zdjęcie"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
                {onReplacePreview && (
                    <label
                        className={`p-2.5 rounded-xl transition-all shadow-lg cursor-pointer ${isReplacingPreview ? 'bg-zinc-700 text-zinc-300' : 'bg-sky-500 hover:bg-sky-400 text-white'}`}
                        title="Podmień źródło podglądu"
                    >
                        <Eye className="w-4 h-4" />
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={!!isReplacingPreview}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onReplacePreview(file);
                                e.currentTarget.value = '';
                            }}
                        />
                    </label>
                )}
                {onReplaceDownload && (
                    <label
                        className={`p-2.5 rounded-xl transition-all shadow-lg cursor-pointer ${isReplacingDownload ? 'bg-zinc-700 text-zinc-300' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                        title="Podmień źródło pobierania (oryginał)"
                    >
                        <Download className="w-4 h-4" />
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={!!isReplacingDownload}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onReplaceDownload(file);
                                e.currentTarget.value = '';
                            }}
                        />
                    </label>
                )}
            </div>

            {/* Checkbox (top-left) */}
            {onToggleSelect && (
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
                    className={`absolute top-2 left-2 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all z-10 ${
                        isSelected
                            ? 'bg-red-500 border-red-500 text-white'
                            : 'bg-black/50 border-zinc-500 text-transparent group-hover:border-zinc-300'
                    }`}
                    title={isSelected ? 'Odznacz' : 'Zaznacz'}
                >
                    <Check className="w-3.5 h-3.5" />
                </button>
            )}

            <div className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg text-[10px] font-black tracking-tighter ${photo.is_standard ? 'bg-green-500 text-white' : 'bg-gold-500 text-black shadow-lg shadow-gold-500/20'}`}>
                {photo.is_standard ? 'STD' : 'PRM'}
            </div>
            {isDraggable && (
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/60 text-zinc-300 text-[10px] font-bold flex items-center gap-1 pointer-events-none">
                    <Move className="w-3 h-3" /> przesuń
                </div>
            )}

            {showDogrywanieCompare && (
                <div className="absolute left-1.5 right-1.5 bottom-1.5 z-20 rounded-lg border border-zinc-700 bg-black/85 p-1.5 backdrop-blur-sm">
                    <div className="grid grid-cols-2 gap-1.5">
                        <div>
                            <div className="text-[9px] font-black uppercase tracking-wide text-sky-300 mb-1">WEBP (wcześniej)</div>
                            <div className="relative h-14 rounded overflow-hidden border border-sky-500/40 bg-zinc-950">
                                <Image
                                    src={photo.thumbnail_source_url || photo.thumbnail_url || photo.file_url}
                                    alt="WEBP preview"
                                    fill
                                    sizes="120px"
                                    className="object-cover"
                                />
                            </div>
                        </div>
                        <div>
                            <div className={`text-[9px] font-black uppercase tracking-wide mb-1 ${hasMappedDownload ? 'text-emerald-300' : 'text-zinc-400'}`}>
                                JPG full {hasMappedDownload ? 'zmapowane' : 'brak'}
                            </div>
                            <div className="relative h-14 rounded overflow-hidden border border-emerald-500/40 bg-zinc-950 flex items-center justify-center">
                                {hasMappedDownload ? (
                                    <Image
                                        src={photo.download_source_url!}
                                        alt="JPG full mapped"
                                        fill
                                        sizes="120px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <span className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">Czeka na JPG</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
