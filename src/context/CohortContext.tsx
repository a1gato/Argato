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
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadCohorts = async () => {
        try {
            const res = await fetch('/api/groups');
            const data = await res.json();
            if (Array.isArray(data)) {
                setCohorts(data);
            }
        } catch (err) {
            console.error('Error loading groups:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadCohorts();
    }, []);

    const addCohort = async (name: string, description?: string, teacherId?: string, scheduleType: ScheduleType = 'MWF', timeSlotId?: string) => {
        try {
            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, teacherId, scheduleType, timeSlotId })
            });
            const newCohort = await res.json();
            setCohorts(prev => [...prev, newCohort]);

            addLog({
                type: 'cohort',
                action: 'Group Created',
                description: `A new ${scheduleType} group "${name}" was created.`
            });
        } catch (err) {
            console.error('Error adding cohort:', err);
            throw err;
        }
    };

    const removeCohort = async (id: string) => {
        try {
            const cohortToRemove = cohorts.find(c => c.id === id);
            await fetch('/api/groups', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (cohortToRemove) {
                setCohorts(prev => prev.filter(c => c.id !== id));
                addLog({
                    type: 'cohort',
                    action: 'Group Deleted',
                    description: `Group "${cohortToRemove.name}" was removed.`
                });
            }
        } catch (err) {
            console.error('Error removing cohort:', err);
            throw err;
        }
    };

    const updateCohort = async (id: string, name: string, description?: string, teacherId?: string, scheduleType?: ScheduleType, timeSlotId?: string) => {
        try {
            const res = await fetch('/api/groups', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, name, description, teacherId, scheduleType, timeSlotId })
            });
            const updated = await res.json();
            setCohorts(prev => prev.map(c => c.id === id ? updated : c));
        } catch (err) {
            console.error('Error updating cohort:', err);
            throw err;
        }
    };

    const assignToSlot = async (cohortId: string, timeSlotId: string | null) => {
        const cohort = cohorts.find(c => c.id === cohortId);
        if (cohort) {
            await updateCohort(cohortId, cohort.name, cohort.description, cohort.teacherId, cohort.scheduleType, timeSlotId || undefined);
        }
    };

    return (
        <CohortContext.Provider value={{ cohorts, loading, refreshing, loadCohorts, addCohort, removeCohort, updateCohort, assignToSlot }}>
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
