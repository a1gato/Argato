import React, { createContext, useContext, useState, type ReactNode } from 'react';

// No extended WindowState needed anymore, just the ID of the active view
interface OSContextType {
    activeAppId: string;
    setActiveApp: (id: string) => void;
}

const OSContext = createContext<OSContextType | undefined>(undefined);

export const OSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeAppId, setActiveAppId] = useState<string>('dashboard'); // Default to empty

    return (
        <OSContext.Provider value={{ activeAppId, setActiveApp: setActiveAppId }}>
            {children}
        </OSContext.Provider>
    );
};

export const useOS = () => {
    const context = useContext(OSContext);
    if (!context) {
        throw new Error('useOS must be used within an OSProvider');
    }
    return context;
};
