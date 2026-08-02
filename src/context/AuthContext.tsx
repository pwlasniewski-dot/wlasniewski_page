'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const clearSession = () => {
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_info');
        setToken(null);
        setUser(null);
    };

    const refreshUser = async (manualToken?: string) => {
        const storedToken = manualToken || token || localStorage.getItem('user_token');
        if (!storedToken) {
            setUser(null);
            setToken(null);
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/user/me', {
                headers: { 'Authorization': `Bearer ${storedToken}` }
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                setToken(storedToken);
                localStorage.setItem('user_info', JSON.stringify(data.user));
            } else {
                // An expired session must not throw visitors off public pages.
                // Only an explicit logout action redirects to the login screen.
                clearSession();
            }
        } catch (error) {
            console.error('Auth refresh error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('user_token', newToken);
        localStorage.setItem('user_info', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        clearSession();
        window.location.href = '/logowanie';
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
