import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface Group {
    id: string;
    name: string;
    parentId?: string | null; // ID of the parent group (e.g., Time Slot), or null if top-level
}

interface GroupsContextType {
    groups: Group[];
    loading: boolean;
    addGroup: (name: string, parentId?: string | null) => Promise<string>;
    removeGroup: (id: string) => Promise<void>;
    moveGroup: (groupId: string, newParentId: string | null) => void;
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined);


import { supabase } from '../lib/supabase';

export const GroupsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);

    const loadGroups = async () => {
        try {
            const { data, error } = await supabase
                .from('timeslots')
                .select('*');

            if (error) throw error;

            const mapped: Group[] = (data || []).map((g: any) => ({
                id: g.id,
                name: g.name,
                parentId: g.parent_id
            }));
            setGroups(mapped);
        } catch (err: any) {
            console.error('Error loading groups from Supabase:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGroups();
    }, []);

    const addGroup = async (name: string, parentId: string | null = null): Promise<string> => {
        try {
            const { data, error } = await supabase
                .from('timeslots')
                .insert([{ name, parent_id: parentId }])
                .select()
                .single();

            if (error) throw error;
            if (data) {
                const newGroup: Group = {
                    id: data.id,
                    name: data.name,
                    parentId: data.parent_id
                };
                setGroups(prev => [...prev, newGroup]);
                return newGroup.id;
            }
            return '';
        } catch (err: any) {
            console.error('Error adding group to Supabase:', err);
            return '';
        }
    };

    const removeGroup = async (id: string) => {
        try {
            const { error } = await supabase
                .from('timeslots')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setGroups(prev => prev.filter(g => g.id !== id && g.parentId !== id));
        } catch (err) {
            console.error('Error removing group from Supabase:', err);
        }
    };

    const moveGroup = async (groupId: string, newParentId: string | null) => {
        try {
            const { error } = await supabase
                .from('timeslots')
                .update({ parent_id: newParentId })
                .eq('id', groupId);

            if (error) throw error;

            setGroups(prev => prev.map(g =>
                g.id === groupId ? { ...g, parentId: newParentId } : g
            ));
        } catch (err) {
            console.error('Error moving group in Supabase:', err);
        }
    };

    return (
        <GroupsContext.Provider value={{ groups, loading, addGroup, removeGroup, moveGroup }}>
            {children}
        </GroupsContext.Provider>
    );
};

export const useGroups = () => {
    const context = useContext(GroupsContext);
    if (!context) {
        throw new Error('useGroups must be used within a GroupsProvider');
    }
    return context;
};
