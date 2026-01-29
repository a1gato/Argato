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

export const GroupsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);

    const loadGroups = async () => {
        try {
            const res = await fetch('/api/timeslots');
            if (!res.ok) throw new Error('Failed to fetch time slots');
            const data = await res.json();
            setGroups(data);
        } catch (err: any) {
            console.error('Error loading groups:', err);
            alert(`Failed to load time slots: ${err.message}. Please check your connection.`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGroups();
    }, []);

    const addGroup = async (name: string, parentId: string | null = null): Promise<string> => {
        try {
            const res = await fetch('/api/timeslots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, parentId })
            });
            if (!res.ok) throw new Error('Failed to add group');
            const newGroup = await res.json();
            setGroups(prev => [...prev, newGroup]);
            return newGroup.id;
        } catch (err: any) {
            console.error('Error adding group:', err);
            alert('Failed to save time slot to Google Sheets. Please check your connection or spreadsheet permissions.');
            return '';
        }
    };

    const removeGroup = async (id: string) => {
        try {
            const res = await fetch('/api/timeslots', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (!res.ok) throw new Error('Failed to delete group');
            setGroups(prev => prev.filter(g => g.id !== id && g.parentId !== id));
        } catch (err) {
            console.error('Error removing group:', err);
        }
    };

    const moveGroup = (groupId: string, newParentId: string | null) => {
        // Since we don't have a specific MOVE API yet, we'd need to update parentId
        // The API currently doesn't have a PUT for timeslots. 
        // For now, update local state.
        setGroups(prev => prev.map(g =>
            g.id === groupId ? { ...g, parentId: newParentId } : g
        ));
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
