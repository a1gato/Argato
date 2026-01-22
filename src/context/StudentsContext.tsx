import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { useLogs } from './LogContext';

export interface Student {
    id: string; // Internal unique ID
    name: string;
    surname: string;
    phone: string;
    parentPhone: string;
    group: string;
    status: 'Active' | 'Inactive';
}

interface StudentsContextType {
    students: Student[];
    addStudent: (student: Omit<Student, 'id' | 'status'>) => void;
    removeStudent: (id: string) => void;
    bulkRemoveStudents: (ids: Set<string>) => void;
    toggleStudentStatus: (id: string) => void;
}

const StudentsContext = createContext<StudentsContextType | undefined>(undefined);

export const StudentsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { addLog } = useLogs();
    // Dummy initial data for testing/demo
    // Dummy initial data or load from localStorage
    const [students, setStudents] = useState<Student[]>(() => {
        const saved = localStorage.getItem('students');
        return saved ? JSON.parse(saved) : [
            { id: '1', name: 'John', surname: 'Doe', phone: '555-0101', parentPhone: '555-0102', group: 'Class A', status: 'Active' },
            { id: '2', name: 'Jane', surname: 'Smith', phone: '555-0103', parentPhone: '555-0104', group: 'Science Club', status: 'Active' },
        ];
    });

    // Save to localStorage whenever students change
    React.useEffect(() => {
        localStorage.setItem('students', JSON.stringify(students));
    }, [students]);

    const addStudent = (studentData: Omit<Student, 'id' | 'status'>) => {
        const newStudent: Student = {
            ...studentData,
            id: crypto.randomUUID(),
            status: 'Active'
        };
        setStudents(prev => [...prev, newStudent]);
        addLog({
            type: 'student',
            action: 'Student Enrolled',
            description: `New student ${newStudent.name} ${newStudent.surname} was enrolled in ${newStudent.group}.`
        });
    };

    const removeStudent = (id: string) => {
        const studentToRemove = students.find(s => s.id === id);
        if (studentToRemove) {
            setStudents(prev => prev.filter(student => student.id !== id));
            addLog({
                type: 'student',
                action: 'Student Removed',
                description: `Student ${studentToRemove.name} ${studentToRemove.surname} was removed from the system.`
            });
        }
    };

    const bulkRemoveStudents = (ids: Set<string>) => {
        setStudents(prev => prev.filter(student => !ids.has(student.id)));
    };

    const toggleStudentStatus = (id: string) => {
        setStudents(prev => prev.map(student =>
            student.id === id
                ? { ...student, status: student.status === 'Active' ? 'Inactive' : 'Active' }
                : student
        ));
    };

    return (
        <StudentsContext.Provider value={{ students, addStudent, removeStudent, bulkRemoveStudents, toggleStudentStatus }}>
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
