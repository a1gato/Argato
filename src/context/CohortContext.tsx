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


import { supabase } from '../lib/supabase';

export const CohortProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { addLog } = useLogs();
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadCohorts = async () => {
        setRefreshing(true);
        try {
            const { data, error } = await supabase
                .from('groups')
                .select('*');

            if (error) throw error;

            const mapped: Cohort[] = (data || []).map((c: any) => ({
                id: c.id,
                name: c.name,
                description: c.description,
                teacherId: c.teacher_id,
                scheduleType: c.schedule_type as any,
                timeSlotId: c.timeslot_id
            }));
            setCohorts(mapped);
        } catch (err) {
            console.error('Error loading cohorts from Supabase:', err);
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCohorts();
    }, []);

    const addCohort = async (name: string, description?: string, teacherId: string = '', scheduleType: ScheduleType = 'MWF', timeSlotId: string = '') => {
        try {
            const { data, error } = await supabase
                .from('groups')
                .insert([{
                    name,
                    description: description || '',
                    teacher_id: teacherId || null,
                    schedule_type: scheduleType,
                    timeslot_id: timeSlotId || null
                }])
                .select()
                .single();

            if (error) throw error;
            if (data) {
                const newCohort: Cohort = {
                    id: data.id,
                    name: data.name,
                    description: data.description,
                    teacherId: data.teacher_id,
                    scheduleType: data.schedule_type as any,
                    timeSlotId: data.timeslot_id
                };
                setCohorts(prev => [...prev, newCohort]);

                addLog({
                    type: 'cohort',
                    action: 'Group Created',
                    description: `A new ${scheduleType} group "${name}" was created.`
                });
            }
        } catch (err) {
            console.error('Error adding cohort to Supabase:', err);
        }
    };

    const removeCohort = async (id: string) => {
        const cohortToRemove = cohorts.find(c => c.id === id);
        if (cohortToRemove) {
            try {
                const { error } = await supabase
                    .from('groups')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                setCohorts(prev => prev.filter(c => c.id !== id));
                addLog({
                    type: 'cohort',
                    action: 'Group Deleted',
                    description: `Group "${cohortToRemove.name}" was removed.`
                });
            } catch (err) {
                console.error('Error removing cohort from Supabase:', err);
            }
        }
    };

    const updateCohort = async (id: string, name: string, description?: string, teacherId: string = '', scheduleType: ScheduleType = 'MWF', timeSlotId: string = '') => {
        try {
            const { error } = await supabase
                .from('groups')
                .update({
                    name,
                    description: description || '',
                    teacher_id: teacherId || null,
                    schedule_type: scheduleType,
                    timeslot_id: timeSlotId || null
                })
                .eq('id', id);

            if (error) throw error;

            const updated: Cohort = { id, name, description: description || '', teacherId, scheduleType, timeSlotId };
            setCohorts(prev => prev.map(c => c.id === id ? updated : c));
        } catch (err) {
            console.error('Error updating cohort in Supabase:', err);
        }
    };

    const assignToSlot = async (cohortId: string, timeSlotId: string | null) => {
        const cohort = cohorts.find(c => c.id === cohortId);
        if (cohort) {
            await updateCohort(cohortId, cohort.name, cohort.description, cohort.teacherId, cohort.scheduleType, timeSlotId || '');
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
