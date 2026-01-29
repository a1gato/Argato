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
    loading: boolean;
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
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const { addLog } = useLogs();

    const loadUsers = async () => {
        try {
            const res = await fetch('/api/users');
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();

            // Ensure at least the default admin exists
            const hasAdmin = data.some((u: User) => u.employeeId === 'admin');
            setUsers(hasAdmin ? data : [DEFAULT_ADMIN, ...data]);
        } catch (err: any) {
            console.error('Users API Error:', err);
            let msg = 'User Management Sync Failed.';
            try {
                const errorData = JSON.parse(err.message);
                if (errorData.error) msg += `\n\nReason: ${errorData.error}`;
                if (errorData.spreadsheetId) msg += `\n\nSheet ID: ${errorData.spreadsheetId}`;
                if (errorData.serviceAccount) msg += `\n\nService Email: ${errorData.serviceAccount}`;
            } catch (e) {
                msg += `\n\n${err.message}`;
            }
            alert(msg);
            setUsers([DEFAULT_ADMIN]); // Keep default admin if loading fails
        } finally {
            setLoading(false);
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
            if (!res.ok) {
                const errorBody = await res.json().catch(() => ({}));
                throw new Error(JSON.stringify(errorBody) || 'Failed to add user');
            }
            const newUser = await res.json();
            setUsers(prev => [...prev, newUser]);

            addLog({
                type: 'user',
                action: 'User Created',
                description: `New user ${newUser.firstName} ${newUser.lastName} (${newUser.role}) was added.`
            });
        } catch (err: any) {
            console.error('Error creating user:', err);
            let msg = 'Failed to create user.';
            try {
                const errorData = JSON.parse(err.message);
                if (errorData.error) msg += `\n\nReason: ${errorData.error}`;
                if (errorData.spreadsheetId) msg += `\n\nSheet ID: ${errorData.spreadsheetId}`;
                if (errorData.serviceAccount) msg += `\n\nService Email: ${errorData.serviceAccount}`;
            } catch (e) {
                msg += `\n\n${err.message}`;
            }
            alert(msg);
        }
    };

    const updateUser = async (id: string, updates: Partial<User>) => {
        const user = users.find(u => u.id === id);
        if (user) {
            const updatedUser = { ...user, ...updates };
            try {
                const res = await fetch('/api/users', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedUser)
                });
                if (!res.ok) {
                    const errorBody = await res.json().catch(() => ({}));
                    throw new Error(JSON.stringify(errorBody) || 'Failed to update user');
                }
                const result = await res.json();
                setUsers(prev => prev.map(u => u.id === id ? result : u));
            } catch (err: any) {
                console.error('Error updating user:', err);
                let msg = 'Failed to update user.';
                try {
                    const errorData = JSON.parse(err.message);
                    if (errorData.error) msg += `\n\nReason: ${errorData.error}`;
                    if (errorData.spreadsheetId) msg += `\n\nSheet ID: ${errorData.spreadsheetId}`;
                    if (errorData.serviceAccount) msg += `\n\nService Email: ${errorData.serviceAccount}`;
                } catch (e) {
                    msg += `\n\n${err.message}`;
                }
                alert(msg);
            }
        }
    };

    const deleteUser = async (id: string) => {
        const userToDelete = users.find(u => u.id === id);
        if (userToDelete) {
            try {
                const res = await fetch('/api/users', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });
                if (!res.ok) {
                    const errorBody = await res.json().catch(() => ({}));
                    throw new Error(JSON.stringify(errorBody) || 'Failed to delete user');
                }

                setUsers(prev => prev.filter(u => u.id !== id));
                addLog({
                    type: 'user',
                    action: 'User Deleted',
                    description: `User ${userToDelete.firstName} ${userToDelete.lastName} was removed.`
                });
            } catch (err: any) {
                console.error('Error deleting user:', err);
            }
        }
    };

    const getUserByEmployeeId = (employeeId: string) => {
        return users.find(u => u.employeeId === employeeId);
    };

    return (
        <UsersContext.Provider value={{ users, loading, addUser, updateUser, deleteUser, getUserByEmployeeId }}>
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
