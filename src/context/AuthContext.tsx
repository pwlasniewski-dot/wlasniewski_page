'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface User {
    id: number;
    email: string;
    name?: string;
    phone?: string;
    role: 'CLIENT' | 'PHOTOGRAPHER' | 'ADMIN';
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (token: string, user: User) => void;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const sessionRevision = useRef(0);

    const clearSession = () => {
        sessionRevision.current += 1;
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_info');
        setToken(null);
        setUser(null);
        setIsLoading(false);
    };

    const refreshUser = async (manualToken?: string) => {
        const revision = ++sessionRevision.current;
        const storedToken = manualToken || token || localStorage.getItem('user_token');
        if (!storedToken) {
            setUser(null);
            setToken(null);
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/user/session', {
                headers: { 'Authorization': `Bearer ${storedToken}` },
                cache: 'no-store',
                signal: AbortSignal.timeout(15_000),
            });
            if (revision !== sessionRevision.current) return;

            if (res.ok) {
                const data = await res.json();
                if (revision !== sessionRevision.current) return;
                setUser(data.user);
                setToken(storedToken);
                localStorage.setItem('user_info', JSON.stringify(data.user));
            } else if (res.status === 401 || res.status === 403) {
                // An expired session must not throw visitors off public pages.
                // Only an explicit logout action redirects to the login screen.
                clearSession();
            } else {
                // A temporary backend failure is not proof of an expired session.
                // Protected endpoints still authenticate every request. Never restore cached private data.
                setToken(storedToken);
            }
        } catch (error) {
            if (revision !== sessionRevision.current) return;
            setToken(storedToken);
            console.warn('Auth refresh temporarily unavailable');
        } finally {
            if (revision === sessionRevision.current) setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const login = (newToken: string, newUser: User) => {
        sessionRevision.current += 1;
        localStorage.setItem('user_token', newToken);
        localStorage.setItem('user_info', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        setIsLoading(false);
    };

    const logout = async () => {
        sessionRevision.current += 1;
        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
        } catch (error) {
            console.error('Server logout failed:', error);
        } finally {
            clearSession();
            window.location.href = '/logowanie';
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading, isAuthenticated: !!token, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
