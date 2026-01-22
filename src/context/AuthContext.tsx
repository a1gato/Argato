import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUsers, type User } from './UsersContext';

interface AuthContextType {
    currentUser: User | null;
    login: (employeeId: string, password: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'os_auth_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { users, getUserByEmployeeId } = useUsers();
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Load session on mount (and re-validate against users list)
    useEffect(() => {
        const storedId = localStorage.getItem(AUTH_STORAGE_KEY);
        if (storedId) {
            const user = users.find(u => u.id === storedId);
            if (user) {
                setCurrentUser(user);
            } else {
                // Invalid session
                localStorage.removeItem(AUTH_STORAGE_KEY);
            }
        }
    }, [users]);

    const login = async (employeeId: string, password: string): Promise<boolean> => {
        const user = getUserByEmployeeId(employeeId);
        if (user && user.password === password) {
            setCurrentUser(user);
            localStorage.setItem(AUTH_STORAGE_KEY, user.id);
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, logout, isAuthenticated: !!currentUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within a AuthProvider');
    }
    return context;
};
