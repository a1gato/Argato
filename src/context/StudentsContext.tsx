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

export const StudentsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { addLog } = useLogs();
    const [students, setUsers] = useState<Student[]>(() => {
        const saved = localStorage.getItem('fastit_students');
        return saved ? JSON.parse(saved) : [];
    });
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        localStorage.setItem('fastit_students', JSON.stringify(students));
    }, [students]);

    const loadStudents = async () => {
        setRefreshing(true);
        // Already loaded from LocalStorage on mount
        setRefreshing(false);
    };

    const addStudent = async (studentData: Omit<Student, 'id' | 'status'>) => {
        const newStudent: Student = {
            ...studentData,
            id: crypto.randomUUID(),
            status: 'Active'
        };
        setUsers(prev => [...prev, newStudent]);

        addLog({
            type: 'student',
            action: 'Student Enrolled',
            description: `New student ${newStudent.name} ${newStudent.surname} was enrolled in ${newStudent.group}.`
        });
    };

    const updateStudent = async (student: Student) => {
        setUsers(prev => prev.map(s => s.id === student.id ? student : s));

        addLog({
            type: 'student',
            action: 'Student Updated',
            description: `Student ${student.name} ${student.surname} records were updated.`
        });
    };

    const removeStudent = async (id: string) => {
        const studentToRemove = students.find(s => s.id === id);
        if (studentToRemove) {
            setUsers(prev => prev.filter(student => student.id !== id));
            addLog({
                type: 'student',
                action: 'Student Removed',
                description: `Student ${studentToRemove.name} ${studentToRemove.surname} was removed from the system.`
            });
        }
    };

    const bulkRemoveStudents = async (studentRefs: { id: string }[]) => {
        const idsToRemove = studentRefs.map(ref => ref.id);
        setUsers(prev => prev.filter(s => !idsToRemove.includes(s.id)));
    };

    const toggleStudentStatus = async (id: string) => {
        setUsers(prev => prev.map(s =>
            s.id === id ? { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' } : s
        ));
    };

    return (
        <StudentsContext.Provider value={{
            students,
            loading: false,
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
