'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export type CartItemType = 'booking' | 'gift_card';

export interface CartItem {
    id: string; // Internal unique ID
    type: CartItemType;
    productId?: string; // e.g. packageId or templateId
    title: string;
    subtitle?: string;
    price: number; // in cents
    quantity: number;
    metadata: any;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'id'>) => void;
    updateItem: (id: string, updates: Partial<CartItem>) => void;
    removeItem: (id: string) => void;
    clearCart: () => void;
    totalCount: number;
    totalAmount: number;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initial load from localStorage with Deduplication/Sanitization
    useEffect(() => {
        const savedCart = localStorage.getItem('shopping_cart');
        if (savedCart) {
            try {
                const parsedItems = JSON.parse(savedCart);
                // Sanitize: Ensure uniqueness of IDs
                const uniqueItems = parsedItems.map((item: CartItem, index: number) => {
                    // Check if ID is unique in the list so far, if not or if invalid, regenerate
                    // Actually, simpler: Just ensure we don't have duplicates. 
                    // But if we have duplicate keys, we must fix them.
                    // Let's just blindly rely on the check or regenerate if it looks like the old format 'type-timestamp'?
                    // Safer: Re-generate ID if it conflicts with another item in this very array?
                    // Simplest robust way: Map and ensure unique IDs.
                    return { ...item, id: item.id || `restored-${index}-${Date.now()}` };
                });

                // Super robust de-dupe by ID:
                const seen = new Set();
                const sanitized = uniqueItems.map((item: CartItem) => {
                    if (seen.has(item.id)) {
                        // Conflict found, generate new ID
                        return { ...item, id: `${item.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
                    }
                    seen.add(item.id);
                    return item;
                });

                setItems(sanitized);
            } catch (e) {
                console.error('Failed to parse cart from localStorage', e);
                // Fallback: clear invalid data
                localStorage.removeItem('shopping_cart');
            }
        }
        setIsInitialized(true);
    }, []);

    // Save to localStorage whenever items change
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('shopping_cart', JSON.stringify(items));
        }
    }, [items, isInitialized]);

    const addItem = useCallback((newItem: Omit<CartItem, 'id'>) => {
        // Fix: Use random string to ensure uniqueness even if called rapidly
        const id = `${newItem.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setItems(prev => [...prev, { ...newItem, id }]);
        setIsOpen(true);
        toast.success(`Dodano do koszyka: ${newItem.title}`);
    }, []);

    const updateItem = useCallback((id: string, updates: Partial<CartItem>) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, ...updates } : item
        ));
    }, []);

    const removeItem = useCallback((id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
        toast.info('Usunięto z koszyka');
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
        localStorage.removeItem('shopping_cart');
    }, []);

    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{
            items,
            addItem,
            updateItem,
            removeItem,
            clearCart,
            totalCount,
            totalAmount,
            isOpen,
            setIsOpen
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
