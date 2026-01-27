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
    updateUser: (id: string, updates: Partial<User>) => Promise<void>;
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
    const [users, setUsers] = useState<User[]>([DEFAULT_ADMIN]);
    const { addLog } = useLogs();

    const loadUsers = async () => {
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            if (Array.isArray(data)) {
                // Ensure admin is always present
                const hasAdmin = data.some(u => u.employeeId === 'admin');
                setUsers(hasAdmin ? data : [DEFAULT_ADMIN, ...data]);
            }
        } catch (err) {
            console.error('Failed to load users:', err);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const addUser = async (userData: Omit<User, 'id'>) => {
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            if (!res.ok) throw new Error('Failed to create user');
            const newUser = await res.json();
            setUsers(prev => [...prev, newUser]);
            addLog({
                type: 'user',
                action: 'User Created',
                description: `New user ${newUser.firstName} ${newUser.lastName} (${newUser.role}) was added.`
            });
        } catch (err) {
            console.error('Error adding user:', err);
            alert('Failed to add user. Check console for details.');
        }
    };

    const updateUser = async (id: string, updates: Partial<User>) => {
        try {
            const user = users.find(u => u.id === id);
            if (!user) return;

            const updatedUser = { ...user, ...updates };
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedUser)
            });
            if (!res.ok) throw new Error('Failed to update user');

            setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
        } catch (err) {
            console.error('Error updating user:', err);
            alert('Failed to update user.');
        }
    };

    const deleteUser = async (id: string) => {
        try {
            const userToDelete = users.find(u => u.id === id);
            if (userToDelete) {
                const res = await fetch('/api/users', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });
                if (!res.ok) throw new Error('Failed to delete user');

                setUsers(prev => prev.filter(u => u.id !== id));
                addLog({
                    type: 'user',
                    action: 'User Deleted',
                    description: `User ${userToDelete.firstName} ${userToDelete.lastName} was removed.`
                });
            }
        } catch (err) {
            console.error('Error deleting user:', err);
            alert('Failed to delete user.');
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
