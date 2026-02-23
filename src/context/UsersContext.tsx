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

import { supabase } from '../lib/supabase';

export const UsersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const { addLog } = useLogs();

    const loadUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*');

            if (error) throw error;

            // Map DB snake_case to frontend camelCase
            const mappedUsers: User[] = (data || []).map((u: any) => ({
                id: u.id,
                employeeId: u.employee_id,
                firstName: u.first_name,
                lastName: u.last_name,
                password: u.password,
                role: u.role as any,
                telephone: u.telephone,
                email: u.email
            }));

            setUsers(mappedUsers);
        } catch (err: any) {
            console.error('Supabase Users Error:', err);
            alert(`Failed to sync users: ${err.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const addUser = async (userData: Omit<User, 'id'>) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .insert([{
                    employee_id: userData.employeeId,
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    password: userData.password,
                    role: userData.role,
                    telephone: userData.telephone,
                    email: userData.email
                }])
                .select()
                .single();

            if (error) throw error;
            if (data) {
                const newUser: User = {
                    id: data.id,
                    employeeId: data.employee_id,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    password: data.password,
                    role: data.role as any,
                    telephone: data.telephone,
                    email: data.email
                };
                setUsers(prev => [...prev, newUser]);

                addLog({
                    type: 'user',
                    action: 'User Created',
                    description: `New user ${newUser.firstName} ${newUser.lastName} (${newUser.role}) was added.`
                });
            }
        } catch (err: any) {
            console.error('Error creating user:', err);
            alert(`Failed to create user: ${err.message}`);
        }
    };

    const updateUser = async (id: string, updates: Partial<User>) => {
        try {
            const dbUpdates: any = {};
            if (updates.employeeId) dbUpdates.employee_id = updates.employeeId;
            if (updates.firstName) dbUpdates.first_name = updates.firstName;
            if (updates.lastName) dbUpdates.last_name = updates.lastName;
            if (updates.password) dbUpdates.password = updates.password;
            if (updates.role) dbUpdates.role = updates.role;
            if (updates.telephone) dbUpdates.telephone = updates.telephone;
            if (updates.email) dbUpdates.email = updates.email;

            const { error } = await supabase
                .from('users')
                .update(dbUpdates)
                .eq('id', id);

            if (error) throw error;

            setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));

            const user = users.find(u => u.id === id);
            if (user) {
                addLog({
                    type: 'user',
                    action: 'User Updated',
                    description: `User ${user.firstName} ${user.lastName} records were updated.`
                });
            }
        } catch (err: any) {
            console.error('Error updating user:', err);
            alert(`Failed to update user: ${err.message}`);
        }
    };

    const deleteUser = async (id: string) => {
        const userToDelete = users.find(u => u.id === id);
        if (userToDelete) {
            if (userToDelete.employeeId === 'admin') {
                alert('Primary administrator cannot be deleted.');
                return;
            }
            try {
                const { error } = await supabase
                    .from('users')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                setUsers(prev => prev.filter(u => u.id !== id));
                addLog({
                    type: 'user',
                    action: 'User Deleted',
                    description: `User ${userToDelete.firstName} ${userToDelete.lastName} was removed.`
                });
            } catch (err: any) {
                console.error('Error deleting user:', err);
                alert(`Failed to delete user: ${err.message}`);
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
