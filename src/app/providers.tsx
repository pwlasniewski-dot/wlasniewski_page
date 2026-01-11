'use client';

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { Toaster } from 'sonner';

export function Providers({
    children,
    themeMode = 'dark'
}: {
    children: React.ReactNode;
    themeMode?: string;
}) {
    return (
        <AuthProvider>
            <CartProvider>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem={false}
                    forcedTheme="dark" // ALWAYS Dark as per user request
                >
                    {children}
                    <Toaster position="bottom-right" theme="dark" />
                </ThemeProvider>
            </CartProvider>
        </AuthProvider>
    );
}
