import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

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
    const [groups, setGroups] = useState<Group[]>(() => {
        const saved = localStorage.getItem('fastit_timeslots');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('fastit_timeslots', JSON.stringify(groups));
    }, [groups]);

    const addGroup = async (name: string, parentId: string | null = null) => {
        const newGroup: Group = {
            id: crypto.randomUUID(),
            name,
            parentId
        };
        setGroups(prev => [...prev, newGroup]);
        return newGroup.id;
    };

    const removeGroup = async (id: string) => {
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
