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

import { supabase } from '../lib/supabase';

export const LogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [logs, setLogs] = useState<SystemLog[]>([]);

    const loadLogs = async () => {
        try {
            const { data, error } = await supabase
                .from('logs')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(50);

            if (error) throw error;

            const mapped: SystemLog[] = (data || []).map((l: any) => ({
                id: l.id,
                type: l.type as any,
                action: l.action,
                description: l.description,
                timestamp: new Date(l.timestamp).getTime(),
                user: l.user_id
            }));
            setLogs(mapped);
        } catch (err) {
            console.error('Error loading logs from Supabase:', err);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const addLog = async (logData: Omit<SystemLog, 'id' | 'timestamp'>) => {
        try {
            const { data, error } = await supabase
                .from('logs')
                .insert([{
                    type: logData.type,
                    action: logData.action,
                    description: logData.description,
                    user_id: logData.user || null
                }])
                .select()
                .single();

            if (error) throw error;
            if (data) {
                const newLog: SystemLog = {
                    id: data.id,
                    type: data.type as any,
                    action: data.action,
                    description: data.description,
                    timestamp: new Date(data.timestamp).getTime(),
                    user: data.user_id
                };
                setLogs(prev => [newLog, ...prev.slice(0, 49)]);
            }
        } catch (err) {
            console.error('Error adding log to Supabase:', err);
        }
    };

    const clearLogs = async () => {
        try {
            const { error } = await supabase
                .from('logs')
                .delete()
                .neq('type', 'system');

            if (error) throw error;
            setLogs([]);
        } catch (err) {
            console.error('Error clearing logs in Supabase:', err);
        }
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
