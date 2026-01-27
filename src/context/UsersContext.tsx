import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLogs } from './LogContext';

export interface User {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    password: string; // In a real app, this should never be plain text!
    role: 'admin' | 'employee' | 'teacher';
    telephone: string;
    email?: string;
}

interface UsersContextType {
    users: User[];
    addUser: (user: Omit<User, 'id'>) => Promise<void>;
    updateUser: (id: string, updates: Partial<User>) => void;
    deleteUser: (id: string) => Promise<void>;
    getUserByEmployeeId: (employeeId: string) => User | undefined;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

const DEFAULT_ADMIN: User = {
    id: 'admin-001',
    employeeId: 'admin',
    firstName: 'Administrator',
    lastName: 'User',
    password: 'admin',
    role: 'admin',
    telephone: '000-000-0000',
    email: 'admin@fastit.com'
};

export const UsersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [users, setUsers] = useState<User[]>(() => {
        const saved = localStorage.getItem('fastit_users');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const hasAdmin = parsed.some((u: any) => u.employeeId === 'admin');
                return hasAdmin ? parsed : [DEFAULT_ADMIN, ...parsed];
            } catch (e) {
                return [DEFAULT_ADMIN];
            }
        }
        return [DEFAULT_ADMIN];
    });
    const { addLog } = useLogs();

    useEffect(() => {
        localStorage.setItem('fastit_users', JSON.stringify(users));
    }, [users]);

    const addUser = async (userData: Omit<User, 'id'>) => {
        const newUser = {
            ...userData,
            id: crypto.randomUUID()
        };
        setUsers(prev => [...prev, newUser]);
        addLog({
            type: 'user',
            action: 'User Created',
            description: `New user ${newUser.firstName} ${newUser.lastName} (${newUser.role}) was added.`
        });
    };

    const updateUser = (id: string, updates: Partial<User>) => {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    };

    const deleteUser = async (id: string) => {
        const userToDelete = users.find(u => u.id === id);
        if (userToDelete) {
            setUsers(prev => prev.filter(u => u.id !== id));
            addLog({
                type: 'user',
                action: 'User Deleted',
                description: `User ${userToDelete.firstName} ${userToDelete.lastName} was removed.`
            });
        }
    };

    const getUserByEmployeeId = (employeeId: string) => {
        return users.find(u => u.employeeId === employeeId);
    };

    return (
        <UsersContext.Provider value={{ users, addUser, updateUser, deleteUser, getUserByEmployeeId }}>
            {children}
        </UsersContext.Provider>
    );
};

export const useUsers = () => {
    const context = useContext(UsersContext);
    if (!context) {
        throw new Error('useUsers must be used within a UsersProvider');
    }
    return context;
};
