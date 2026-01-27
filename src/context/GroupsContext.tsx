import React, { createContext, useContext, useState, type ReactNode } from 'react';

export interface Group {
    id: string;
    name: string;
    parentId?: string | null; // ID of the parent group (e.g., Time Slot), or null if top-level
}

interface GroupsContextType {
    groups: Group[];
    addGroup: (name: string, parentId?: string | null) => string;
    removeGroup: (id: string) => void;
    moveGroup: (groupId: string, newParentId: string | null) => void;
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

export const GroupsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initial dummy data
    // Initial dummy data or load from localStorage
    const [groups, setGroups] = useState<Group[]>(() => {
        const saved = localStorage.getItem('groups');
        try {
            const parsed = saved ? JSON.parse(saved) : [];
            return Array.isArray(parsed) ? parsed.filter((g: any) => g && typeof g.name === 'string') : [];
        } catch (e) {
            console.error("Groups parse error", e);
            return [];
        }
    });

    // Save to localStorage whenever groups change
    React.useEffect(() => {
        localStorage.setItem('groups', JSON.stringify(groups));
    }, [groups]);

    const addGroup = (name: string, parentId: string | null = null) => {
        // Prevent duplicate names WITHIN the same parent scope (optional strictness)
        // For now, simple check global name uniqueness to avoid confusion or allow same name in diff slots?
        // Let's allow same name if diff parent, but strictly unique might be safer for search. 
        // User asked for "14:00" etc.
        const id = crypto.randomUUID();
        const newGroup: Group = {
            id,
            name: name,
            parentId: parentId
        };
        setGroups(prev => [...prev, newGroup]);
        return id;
    };

    const removeGroup = (id: string) => {
        setGroups(prev => prev.filter(g => g.id !== id && g.parentId !== id));
    };

    const moveGroup = (groupId: string, newParentId: string | null) => {
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
