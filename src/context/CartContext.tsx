'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { printQuantities, printUnitAmount, type ShopCatalog, type ShopLine, type PrintFormat } from '@/lib/galleries/merchandise';

export type CartItemType = 'booking' | 'gift_card' | 'photo_product' | 'photo_print';
export type CartPhoto = { id: number; file_url: string; thumbnail_url?: string | null; width?: number | null; height?: number | null };
export type PhotoCartMetadata = { endpoint: string; line: ShopLine; photos: CartPhoto[]; format?: PrintFormat };
export interface CartItem {
    id: string;
    type: CartItemType;
    productId?: string;
    title: string;
    subtitle?: string;
    price: number; // Display estimate in grosze; checkout always reloads current server prices.
    quantity: number;
    metadata: any;
}
export type PhotoLineUpdate = ShopLine[] | ((previous: ShopLine[]) => ShopLine[]);
export type PhotoLineDetails = { catalog: ShopCatalog | null; photos: CartPhoto[] };
interface CartContextType {
    items: CartItem[];
    initialized: boolean;
    addItem: (item: Omit<CartItem, 'id'>) => void;
    updateItem: (id: string, updates: Partial<CartItem>) => void;
    removeItem: (id: string) => void;
    removeItems: (ids: string[]) => void;
    setPhotoLines: (endpoint: string, update: PhotoLineUpdate, details: PhotoLineDetails) => void;
    clearCart: () => void;
    totalCount: number;
    totalAmount: number;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}
export const isPhotoCartItem = (item: CartItem) => item.type === 'photo_product' || item.type === 'photo_print';
export const validPhotoEndpoint = (endpoint: unknown): endpoint is string => typeof endpoint === 'string' && /^\/api\/galleries\/(?:[a-zA-Z0-9_-]+|group\/participant\/[1-9]\d*)\/shop$/.exec(endpoint)?.[0] === endpoint;
const positive = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n > 0;
const photoUrl = (value: unknown) => {
    if (typeof value !== 'string') return '';
    // Signed URLs and their credentials must never be persisted in the basket.
    try { const url = new URL(value, 'https://cart.invalid'); if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return ''; return value.startsWith('/') && !value.startsWith('//') ? value : url.protocol === 'https:' ? value : ''; } catch { return ''; }
};
function cleanFormat(value: any): PrintFormat | undefined {
    if (!value || typeof value.id !== 'string' || typeof value.label !== 'string' || !positive(value.unitAmount)) return undefined;
    return { id: value.id, label: value.label, widthMm: positive(value.widthMm) ? value.widthMm : 1, heightMm: positive(value.heightMm) ? value.heightMm : 1, unitAmount: value.unitAmount, active: value.active === true, paper: typeof value.paper === 'string' ? value.paper : '', priceTiers: Array.isArray(value.priceTiers) ? value.priceTiers.filter((t: any) => positive(t?.minQuantity) && positive(t?.unitAmount)).map((t: any) => ({minQuantity:t.minQuantity,unitAmount:t.unitAmount})) : [] };
}
function repricePrints(items: CartItem[]): CartItem[] {
    return items.map(item => {
        const format = item.type === 'photo_print' ? cleanFormat(item.metadata?.format) : undefined;
        if (!format) return item;
        const totalQuantity = items.filter(other => other.type === 'photo_print' && other.metadata?.endpoint === item.metadata.endpoint && other.metadata?.line?.formatId === format.id).reduce((sum, other) => sum + other.quantity, 0);
        return { ...item, price: printUnitAmount(format, totalQuantity) };
    });
}
function cleanLine(value: any): ShopLine | null {
    if (!value || typeof value.id !== 'string' || value.id.length > 160 || !positive(value.quantity) || value.quantity > 99) return null;
    if (value.kind === 'product' && positive(value.productId) && Array.isArray(value.photoIds) && value.photoIds.length > 0 && value.photoIds.length <= 500 && value.photoIds.every(positive) && positive(value.coverPhotoId) && value.photoIds.includes(value.coverPhotoId)) return { id: value.id, kind: 'product', productId: value.productId, photoIds: [...value.photoIds], coverPhotoId: value.coverPhotoId, quantity: value.quantity };
    const c = value.crop;
    if (value.kind === 'print' && positive(value.photoId) && typeof value.formatId === 'string' && c && ['fit', 'fill'].includes(c.mode) && [c.x, c.y, c.zoom].every(Number.isFinite)) return { id: value.id, kind: 'print', photoId: value.photoId, formatId: value.formatId, quantity: value.quantity, crop: { mode: c.mode, x: c.x, y: c.y, zoom: c.zoom }, confirmed: value.confirmed === true };
    return null;
}
function cleanPhotos(photos: CartPhoto[], line: ShopLine): CartPhoto[] {
    const ids = line.kind === 'product' ? line.photoIds : [line.photoId];
    return photos.filter(p => positive(p?.id) && ids.includes(p.id)).map(p => ({ id: p.id, file_url: photoUrl(p.file_url), thumbnail_url: photoUrl(p.thumbnail_url), width: positive(p.width) ? p.width : null, height: positive(p.height) ? p.height : null }));
}
export function photoCartLines(items: CartItem[], endpoint: string): ShopLine[] {
    return items.filter(i => isPhotoCartItem(i) && i.metadata?.endpoint === endpoint).flatMap(i => { const line = cleanLine({ ...i.metadata.line, quantity: i.quantity }); return line ? [line] : []; });
}
export function replacePhotoCartLines(previous: CartItem[], endpoint: string, update: PhotoLineUpdate, details: PhotoLineDetails): CartItem[] {
    if (!validPhotoEndpoint(endpoint)) return previous;
    const lines = (typeof update === 'function' ? update(photoCartLines(previous, endpoint)) : update).flatMap(l => { const clean = cleanLine(l); return clean ? [clean] : []; });
    const quantities = printQuantities(lines);
    const seen = new Set<string>();
    const replacements: CartItem[] = lines.filter(line => !seen.has(line.id) && !!seen.add(line.id)).map(line => {
        const old = previous.find(i => i.id === `${endpoint}:${line.id}`);
        const product = line.kind === 'product' ? details.catalog?.products.find(p => p.id === line.productId) : null;
        const format = line.kind === 'print' ? details.catalog?.formats.find(f => f.id === line.formatId) : null;
        return { id: `${endpoint}:${line.id}`, type: line.kind === 'product' ? 'photo_product' : 'photo_print', productId: line.kind === 'product' ? String(line.productId) : line.formatId, title: product?.title || format?.label || old?.title || 'Produkt ze zdjęciem', price: product?.price ?? (format ? printUnitAmount(format, quantities[format.id]) : old?.price ?? 0), quantity: line.quantity, metadata: { endpoint, line, ...(cleanFormat(format || old?.metadata?.format) ? {format:cleanFormat(format || old?.metadata?.format)} : {}), photos: cleanPhotos([...details.photos, ...(old?.metadata?.photos || []).filter((p: CartPhoto) => !details.photos.some(n => n.id === p.id))], line) } };
    });
    return repricePrints([...previous.filter(i => !isPhotoCartItem(i) || i.metadata?.endpoint !== endpoint), ...replacements]);
}
export function restoreCart(raw: unknown): CartItem[] {
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    return repricePrints(raw.flatMap((item, index) => {
        if (!item || !['booking', 'gift_card', 'photo_product', 'photo_print'].includes(item.type) || !positive(item.quantity) || !Number.isSafeInteger(item.price) || item.price < 0 || typeof item.title !== 'string') return [];
        let restored = { ...item, id: typeof item.id === 'string' ? item.id : `restored-${index}` } as CartItem;
        if (isPhotoCartItem(restored)) {
            const endpoint = item.metadata?.endpoint;
            const line = cleanLine({ ...item.metadata?.line, quantity: item.quantity });
            if (!validPhotoEndpoint(endpoint) || !line) return [];
            restored = { id: `${endpoint}:${line.id}`, type: line.kind === 'product' ? 'photo_product' : 'photo_print', productId: line.kind === 'product' ? String(line.productId) : line.formatId, title: item.title, price: item.price, quantity: line.quantity, metadata: { endpoint, line, ...(cleanFormat(item.metadata.format) ? {format:cleanFormat(item.metadata.format)} : {}), photos: cleanPhotos(Array.isArray(item.metadata.photos) ? item.metadata.photos : [], line) } };
        }
        if (seen.has(restored.id)) restored.id = `${restored.id}-restored-${index}`;
        seen.add(restored.id);
        return [restored];
    }));
}
const CartContext = createContext<CartContextType | undefined>(undefined);
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [initialized, setInitialized] = useState(false);
    useEffect(() => {
        try { setItems(restoreCart(JSON.parse(localStorage.getItem('shopping_cart') || '[]'))); } catch { /* Unavailable storage does not disable this basket. */ }
        setInitialized(true);
    }, []);
    useEffect(() => { if (initialized) { try { localStorage.setItem('shopping_cart', JSON.stringify(items)); } catch { /* Keep the in-memory basket when storage is full/unavailable. */ } } }, [items, initialized]);
    const addItem = useCallback((newItem: Omit<CartItem, 'id'>) => {
        const id = `${newItem.type}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`}`;
        setItems(previous => [...previous, ...restoreCart([{ ...newItem, id }])]);
        setIsOpen(true);
        toast.success(`Dodano do koszyka: ${newItem.title}`);
    }, []);
    const updateItem = useCallback((id: string, updates: Partial<CartItem>) => { setItems(previous => restoreCart(previous.map(item => item.id === id ? { ...item, ...updates, id: item.id, type: item.type } : item))); }, []);
    const removeItems = useCallback((ids: string[]) => { setItems(previous => repricePrints(previous.filter(item => !ids.includes(item.id)))); }, []);
    const removeItem = useCallback((id: string) => { removeItems([id]); toast.info('Usunięto z koszyka'); }, [removeItems]);
    const setPhotoLines = useCallback((endpoint: string, update: PhotoLineUpdate, details: PhotoLineDetails) => { setItems(previous => replacePhotoCartLines(previous, endpoint, update, details)); }, []);
    const clearCart = useCallback(() => { setItems([]); }, []);
    return <CartContext.Provider value={{ items, initialized, addItem, updateItem, removeItem, removeItems, setPhotoLines, clearCart, totalCount: items.reduce((sum, item) => sum + item.quantity, 0), totalAmount: items.reduce((sum, item) => sum + item.price * item.quantity, 0), isOpen, setIsOpen }}>{children}</CartContext.Provider>;
};
export const useCart = () => { const context = useContext(CartContext); if (!context) throw new Error('useCart must be used within a CartProvider'); return context; };
