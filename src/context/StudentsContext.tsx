import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { useLogs } from './LogContext';

export interface Student {
    id: string;
    name: string;
    surname: string;
    phone: string;
    parentPhone: string;
    group: string;
    status: 'Active' | 'Inactive';
    spreadsheetId?: string; // Track which sheet it belongs to
}

interface StudentsContextType {
    students: Student[];
    loading: boolean;
    refreshing: boolean;
    loadStudents: () => Promise<void>;
    addStudent: (student: Omit<Student, 'id' | 'status'>) => Promise<void>;
    updateStudent: (student: Student) => Promise<void>;
    removeStudent: (id: string, spreadsheetId?: string) => Promise<void>;
    bulkRemoveStudents: (students: { id: string, spreadsheetId?: string }[]) => Promise<void>;
    toggleStudentStatus: (id: string, spreadsheetId?: string) => Promise<void>;
}

const StudentsContext = createContext<StudentsContextType | undefined>(undefined);

export const StudentsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { addLog } = useLogs();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadStudents = async () => {
        try {
            const res = await fetch('/api/students');
            const data = await res.json();
            if (Array.isArray(data)) {
                setStudents(data);
            }
        } catch (err) {
            console.error('Error loading students:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    React.useEffect(() => {
        loadStudents();
    }, []);

    const addStudent = async (studentData: Omit<Student, 'id' | 'status'>) => {
        try {
            const res = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentData)
            });

            if (!res.ok) {
                let errorMessage = `HTTP error! status: ${res.status}`;
                try {
                    const errorData = await res.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    // Not a JSON response
                }
                throw new Error(errorMessage);
            }

            const newStudent = await res.json();
            setStudents(prev => [...prev, newStudent]);

            addLog({
                type: 'student',
                action: 'Student Enrolled',
                description: `New student ${newStudent.name} ${newStudent.surname} was enrolled in ${newStudent.group}.`
            });
        } catch (err: any) {
            console.error('Error adding student:', err);
            throw err;
        }
    };

    const updateStudent = async (student: Student) => {
        try {
            const res = await fetch('/api/students', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(student)
            });
            const updated = await res.json();
            setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));

            addLog({
                type: 'student',
                action: 'Student Updated',
                description: `Student ${updated.name} ${updated.surname} records were updated.`
            });
        } catch (err) {
            console.error('Error updating student:', err);
            throw err;
        }
    };

    const removeStudent = async (id: string, spreadsheetId?: string) => {
        try {
            const studentToRemove = students.find(s => s.id === id);
            await fetch('/api/students', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, spreadsheetId: spreadsheetId || studentToRemove?.spreadsheetId })
            });

            if (studentToRemove) {
                setStudents(prev => prev.filter(student => student.id !== id));
                addLog({
                    type: 'student',
                    action: 'Student Removed',
                    description: `Student ${studentToRemove.name} ${studentToRemove.surname} was removed from the system.`
                });
            }
        } catch (err) {
            console.error('Error removing student:', err);
            throw err;
        }
    };

    const bulkRemoveStudents = async (studentRefs: { id: string, spreadsheetId?: string }[]) => {
        setRefreshing(true);
        try {
            for (const ref of studentRefs) {
                await removeStudent(ref.id, ref.spreadsheetId);
            }
        } finally {
            setRefreshing(false);
        }
    };

    const toggleStudentStatus = async (id: string, spreadsheetId?: string) => {
        const student = students.find(s => s.id === id);
        if (!student) return;

        const updatedStudent = {
            ...student,
            status: student.status === 'Active' ? 'Inactive' : 'Active',
            spreadsheetId: spreadsheetId || student.spreadsheetId
        };
        await updateStudent(updatedStudent as Student);
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
