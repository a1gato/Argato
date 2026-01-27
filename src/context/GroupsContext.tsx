import React, { createContext, useContext, useState, type ReactNode } from 'react';

export interface Group {
    id: string;
    name: string;
    parentId?: string | null; // ID of the parent group (e.g., Time Slot), or null if top-level
}

interface GroupsContextType {
    groups: Group[];
    addGroup: (name: string, parentId?: string | null) => Promise<string>;
    removeGroup: (id: string) => Promise<void>;
    moveGroup: (groupId: string, newParentId: string | null) => void;
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

export const GroupsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [groups, setGroups] = useState<Group[]>([]);

    const loadGroups = async () => {
        try {
            const res = await fetch('/api/timeslots');
            const data = await res.json();
            if (Array.isArray(data)) {
                setGroups(data);
            }
        } catch (err) {
            console.error('Error loading time slots:', err);
        }
    };

    React.useEffect(() => {
        loadGroups();
    }, []);

    const addGroup = async (name: string, parentId: string | null = null) => {
        try {
            const res = await fetch('/api/timeslots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, parentId })
            });
            const newGroup = await res.json();
            setGroups(prev => [...prev, newGroup]);
            return newGroup.id;
        } catch (err) {
            console.error('Error adding time slot:', err);
            return '';
        }
    };

    const removeGroup = async (id: string) => {
        try {
            await fetch('/api/timeslots', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            setGroups(prev => prev.filter(g => g.id !== id && g.parentId !== id));
        } catch (err) {
            console.error('Error removing time slot:', err);
        }
    };

    const moveGroup = (groupId: string, newParentId: string | null) => {
        // Local only for now, can be expanded to API if needed
        setGroups(prev => prev.map(g =>
            g.id === groupId ? { ...g, parentId: newParentId } : g
        ));
    };

    return (
        <GroupsContext.Provider value={{ groups, addGroup, removeGroup, moveGroup }}>
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
