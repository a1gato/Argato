import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface SystemLog {
    id: string;
    type: 'user' | 'student' | 'cohort' | 'settings' | 'auth';
    action: string;
    description: string;
    timestamp: number;
    user?: string; // Who performed the action
}

interface LogContextType {
    logs: SystemLog[];
    addLog: (log: Omit<SystemLog, 'id' | 'timestamp'>) => void;
    clearLogs: () => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

const LOGS_STORAGE_KEY = 'os_system_logs';

export const LogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [logs, setLogs] = useState<SystemLog[]>(() => {
        const stored = localStorage.getItem(LOGS_STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error("Failed to parse logs", e);
                return [];
            }
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 50))); // Keep last 50 logs
    }, [logs]);

    const addLog = (logData: Omit<SystemLog, 'id' | 'timestamp'>) => {
        const newLog: SystemLog = {
            ...logData,
            id: crypto.randomUUID(),
            timestamp: Date.now()
        };
        setLogs(prev => [newLog, ...prev]);
    };

    const clearLogs = () => {
        setLogs([]);
    };

    return (
        <LogContext.Provider value={{ logs, addLog, clearLogs }}>
            {children}
        </LogContext.Provider>
    );
};

export const useLogs = () => {
    const context = useContext(LogContext);
    if (!context) {
        throw new Error('useLogs must be used within a LogProvider');
    }
    return context;
};
