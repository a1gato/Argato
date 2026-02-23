import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useLogs } from './LogContext';

export interface Student {
    id: string;
    name: string;
    surname: string;
    phone: string;
    parentPhone: string;
    group: string;
    status: 'Active' | 'Inactive';
}

interface StudentsContextType {
    students: Student[];
    loading: boolean;
    refreshing: boolean;
    loadStudents: () => Promise<void>;
    addStudent: (student: Omit<Student, 'id' | 'status'>) => Promise<void>;
    updateStudent: (student: Student) => Promise<void>;
    removeStudent: (id: string) => Promise<void>;
    bulkRemoveStudents: (students: { id: string }[]) => Promise<void>;
    toggleStudentStatus: (id: string) => Promise<void>;
}

const StudentsContext = createContext<StudentsContextType | undefined>(undefined);


import { supabase } from '../lib/supabase';

export const StudentsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { addLog } = useLogs();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadStudents = async () => {
        setRefreshing(true);
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*');

            if (error) throw error;

            const mapped: Student[] = (data || []).map((s: any) => ({
                id: s.id,
                name: s.name,
                surname: s.surname,
                phone: s.phone,
                parentPhone: s.parent_phone,
                group: s.group_id, // Mapping group_id from DB to group in frontend
                status: s.status as any
            }));
            setStudents(mapped);
        } catch (err: any) {
            console.error('Error loading students from Supabase:', err);
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStudents();
    }, []);

    const addStudent = async (studentData: Omit<Student, 'id' | 'status'>) => {
        try {
            const { data, error } = await supabase
                .from('students')
                .insert([{
                    name: studentData.name,
                    surname: studentData.surname,
                    phone: studentData.phone,
                    parent_phone: studentData.parentPhone,
                    group_id: studentData.group,
                    status: 'Active'
                }])
                .select()
                .single();

            if (error) throw error;
            if (data) {
                const newStudent: Student = {
                    id: data.id,
                    name: data.name,
                    surname: data.surname,
                    phone: data.phone,
                    parentPhone: data.parent_phone,
                    group: data.group_id,
                    status: data.status as any
                };
                setStudents(prev => [...prev, newStudent]);

                addLog({
                    type: 'student',
                    action: 'Student Enrolled',
                    description: `New student ${newStudent.name} ${newStudent.surname} was enrolled in ${newStudent.group}.`
                });
            }
        } catch (err: any) {
            console.error('Supabase Error:', err);
            alert(`Failed to add student: ${err.message}`);
        }
    };

    const updateStudent = async (student: Student) => {
        try {
            const { error } = await supabase
                .from('students')
                .update({
                    name: student.name,
                    surname: student.surname,
                    phone: student.phone,
                    parent_phone: student.parentPhone,
                    group_id: student.group,
                    status: student.status
                })
                .eq('id', student.id);

            if (error) throw error;

            setStudents(prev => prev.map(s => s.id === student.id ? student : s));

            addLog({
                type: 'student',
                action: 'Student Updated',
                description: `Student ${student.name} ${student.surname} records were updated.`
            });
        } catch (err: any) {
            console.error('Supabase Error:', err);
            alert(`Failed to update student: ${err.message}`);
        }
    };

    const removeStudent = async (id: string) => {
        const studentToRemove = students.find(s => s.id === id);
        if (studentToRemove) {
            try {
                const { error } = await supabase
                    .from('students')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                setStudents(prev => prev.filter(student => student.id !== id));
                addLog({
                    type: 'student',
                    action: 'Student Removed',
                    description: `Student ${studentToRemove.name} ${studentToRemove.surname} was removed from the system.`
                });
            } catch (err: any) {
                console.error('Supabase Error:', err);
                alert(`Failed to remove student: ${err.message}`);
            }
        }
    };

    const bulkRemoveStudents = async (studentRefs: { id: string }[]) => {
        try {
            const idsToRemove = studentRefs.map(ref => ref.id);
            const { error } = await supabase
                .from('students')
                .delete()
                .in('id', idsToRemove);

            if (error) throw error;

            setStudents(prev => prev.filter(s => !idsToRemove.includes(s.id)));

            addLog({
                type: 'student',
                action: 'Bulk Removal',
                description: `${studentRefs.length} students were removed from the system.`
            });
        } catch (err: any) {
            console.error('Supabase Error:', err);
            alert(`Failed to bulk remove students: ${err.message}`);
        }
    };

    const toggleStudentStatus = async (id: string) => {
        const student = students.find(s => s.id === id);
        if (student) {
            const updatedStudent = { ...student, status: (student.status === 'Active' ? 'Inactive' : 'Active') as 'Active' | 'Inactive' };
            await updateStudent(updatedStudent);
        }
    };

    return (
        <StudentsContext.Provider value={{
            students,
            loading,
            refreshing,
            loadStudents,
            addStudent,
            updateStudent,
            removeStudent,
            bulkRemoveStudents,
            toggleStudentStatus
        }}>
            {children}
        </StudentsContext.Provider>
    );
};

export const useStudents = () => {
    const context = useContext(StudentsContext);
    if (!context) {
        throw new Error('useStudents must be used within a StudentsProvider');
    }
    return context;
};
