'use client';

import { useEffect, useState } from 'react';

interface User {
    id: number;
    email: string;
    name?: string;
}

interface AuthContext {
    token: string | null;
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

export function useAuthContext(): AuthContext {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Get token from localStorage
        const storedToken = localStorage.getItem('admin_token');
        const storedUser = localStorage.getItem('admin_user');

        if (storedToken) {
            setToken(storedToken);
        }

        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                // Invalid JSON, clear it
                localStorage.removeItem('admin_user');
            }
        }

        setIsLoading(false);
    }, []);

    return {
        token,
        user,
        isLoading,
        isAuthenticated: !!token
    };
}
