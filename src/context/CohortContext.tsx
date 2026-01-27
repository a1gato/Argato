import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { useLogs } from './LogContext';

export type ScheduleType = 'MWF' | 'TTS' | 'DAILY';

export interface Cohort {
    id: string;
    name: string;
    description?: string;
    teacherId?: string;
    scheduleType?: ScheduleType;
    timeSlotId?: string;
}

interface CohortContextType {
    cohorts: Cohort[];
    loading: boolean;
    refreshing: boolean;
    loadCohorts: () => Promise<void>;
    addCohort: (name: string, description?: string, teacherId?: string, scheduleType?: ScheduleType, timeSlotId?: string) => Promise<void>;
    removeCohort: (id: string) => Promise<void>;
    updateCohort: (id: string, name: string, description?: string, teacherId?: string, scheduleType?: ScheduleType, timeSlotId?: string) => Promise<void>;
    assignToSlot: (cohortId: string, timeSlotId: string | null) => Promise<void>;
}

const CohortContext = createContext<CohortContextType | undefined>(undefined);

export const CohortProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { addLog } = useLogs();
    const [cohorts, setCohorts] = useState<Cohort[]>(() => {
        const saved = localStorage.getItem('fastit_cohorts');
        return saved ? JSON.parse(saved) : [];
    });
    const [refreshing] = useState(false);

    useEffect(() => {
        localStorage.setItem('fastit_cohorts', JSON.stringify(cohorts));
    }, [cohorts]);

    const loadCohorts = async () => {
        // Already loaded from LocalStorage
    };

    const addCohort = async (name: string, description?: string, teacherId?: string, scheduleType: ScheduleType = 'MWF', timeSlotId?: string) => {
        const newCohort: Cohort = {
            id: crypto.randomUUID(),
            name,
            description: description || '',
            teacherId: teacherId || '',
            scheduleType: scheduleType || 'MWF',
            timeSlotId: timeSlotId || ''
        };
        setCohorts(prev => [...prev, newCohort]);

        addLog({
            type: 'cohort',
            action: 'Group Created',
            description: `A new ${scheduleType} group "${name}" was created.`
        });
    };

    const removeCohort = async (id: string) => {
        const cohortToRemove = cohorts.find(c => c.id === id);
        if (cohortToRemove) {
            setCohorts(prev => prev.filter(c => c.id !== id));
            addLog({
                type: 'cohort',
                action: 'Group Deleted',
                description: `Group "${cohortToRemove.name}" was removed.`
            });
        }
    };

    const updateCohort = async (id: string, name: string, description?: string, teacherId?: string, scheduleType?: ScheduleType, timeSlotId?: string) => {
        const updatedCohort: Cohort = {
            id,
            name,
            description: description || '',
            teacherId: teacherId || '',
            scheduleType: scheduleType || 'MWF',
            timeSlotId: timeSlotId || ''
        };
        setCohorts(prev => prev.map(c => c.id === id ? updatedCohort : c));
    };

    const assignToSlot = async (cohortId: string, timeSlotId: string | null) => {
        setCohorts(prev => prev.map(c =>
            c.id === cohortId ? { ...c, timeSlotId: timeSlotId || undefined } : c
        ));
    };

    return (
        <CohortContext.Provider value={{ cohorts, loading: false, refreshing, loadCohorts, addCohort, removeCohort, updateCohort, assignToSlot }}>
            {children}
        </CohortContext.Provider>
    );
};

export const useCohorts = () => {
    const context = useContext(CohortContext);
    if (!context) {
        throw new Error('useCohorts must be used within a CohortProvider');
    }
    return context;
};
