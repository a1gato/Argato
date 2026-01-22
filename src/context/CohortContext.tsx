import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { useLogs } from './LogContext';

export type ScheduleType = 'MWF' | 'TTS' | 'DAILY';

export interface Cohort {
    id: string;
    name: string;
    description?: string;
    teacherId?: string; // ID of the assigned teacher
    scheduleType?: ScheduleType;
    timeSlotId?: string; // ID of the time slot it belongs to
}

interface CohortContextType {
    cohorts: Cohort[];
    addCohort: (name: string, description?: string, teacherId?: string, scheduleType?: ScheduleType, timeSlotId?: string) => void;
    removeCohort: (id: string) => void;
    updateCohort: (id: string, name: string, description?: string, teacherId?: string, scheduleType?: ScheduleType, timeSlotId?: string) => void;
    assignToSlot: (cohortId: string, timeSlotId: string | null) => void;
}

const CohortContext = createContext<CohortContextType | undefined>(undefined);

export const CohortProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { addLog } = useLogs();
    // Initial data or load from localStorage
    const [cohorts, setCohorts] = useState<Cohort[]>(() => {
        const saved = localStorage.getItem('cohorts');
        return saved ? JSON.parse(saved) : [
            { id: 'grade-9', name: 'Grade 9', description: 'Freshmen' },
            { id: 'grade-10', name: 'Grade 10', description: 'Sophomores' },
            { id: 'grade-11', name: 'Grade 11', description: 'Juniors' },
            { id: 'grade-12', name: 'Grade 12', description: 'Seniors' }
        ];
    });

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('cohorts', JSON.stringify(cohorts));
    }, [cohorts]);

    const addCohort = (name: string, description?: string, teacherId?: string, scheduleType: ScheduleType = 'MWF', timeSlotId?: string) => {
        const newCohort: Cohort = {
            id: crypto.randomUUID(),
            name,
            description,
            teacherId,
            scheduleType,
            timeSlotId
        };
        setCohorts(prev => [...prev, newCohort]);
        addLog({
            type: 'cohort',
            action: 'Group Created',
            description: `A new ${scheduleType} group "${name}" was created.`
        });
    };

    const removeCohort = (id: string) => {
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

    const updateCohort = (id: string, name: string, description?: string, teacherId?: string, scheduleType?: ScheduleType, timeSlotId?: string) => {
        setCohorts(prev => prev.map(c => c.id === id ? { ...c, name, description, teacherId, scheduleType, timeSlotId } : c));
    };

    const assignToSlot = (cohortId: string, timeSlotId: string | null) => {
        setCohorts(prev => prev.map(c => c.id === cohortId ? { ...c, timeSlotId: timeSlotId || undefined } : c));
    };

    return (
        <CohortContext.Provider value={{ cohorts, addCohort, removeCohort, updateCohort, assignToSlot }}>
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
