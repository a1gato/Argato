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
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadStudents = async () => {
        setRefreshing(true);
        try {
            const res = await fetch('/api/students');
            if (!res.ok) throw new Error('Failed to fetch students');
            const data = await res.json();
            setStudents(data);
        } catch (err: any) {
            console.error('Error loading students:', err);
            alert(`Failed to load students: ${err.message}. Please check your connection.`);
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
            const res = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentData)
            });
            if (!res.ok) {
                const errorBody = await res.json().catch(() => ({}));
                throw new Error(JSON.stringify(errorBody) || 'Failed to add student');
            }
            const newStudent = await res.json();
            setStudents(prev => [...prev, newStudent]);

            addLog({
                type: 'student',
                action: 'Student Enrolled',
                description: `New student ${newStudent.name} ${newStudent.surname} was enrolled in ${newStudent.group}.`
            });
        } catch (err: any) {
            console.error('Students API Error:', err);
            let msg = 'Database Update Failed.';
            try {
                const errorData = JSON.parse(err.message);
                if (errorData.error) msg += `\n\nReason: ${errorData.error}`;
            } catch (e) {
                msg += `\n\n${err.message}`;
            }
            alert(msg);
        }
    };

    const updateStudent = async (student: Student) => {
        try {
            const res = await fetch('/api/students', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(student)
            });
            if (!res.ok) {
                const errorBody = await res.json().catch(() => ({}));
                throw new Error(JSON.stringify(errorBody) || 'Failed to update student');
            }
            const updated = await res.json();
            setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));

            addLog({
                type: 'student',
                action: 'Student Updated',
                description: `Student ${student.name} ${student.surname} records were updated.`
            });
        } catch (err: any) {
            console.error('Students API Error:', err);
            let msg = 'Database Update Failed.';
            try {
                const errorData = JSON.parse(err.message);
                if (errorData.error) msg += `\n\nReason: ${errorData.error}`;
            } catch (e) {
                msg += `\n\n${err.message}`;
            }
            alert(msg);
        }
    };

    const removeStudent = async (id: string) => {
        const studentToRemove = students.find(s => s.id === id);
        if (studentToRemove) {
            try {
                const res = await fetch('/api/students', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, spreadsheetId: (studentToRemove as any).spreadsheetId })
                });
                if (!res.ok) {
                    const errorBody = await res.json().catch(() => ({}));
                    throw new Error(JSON.stringify(errorBody) || 'Failed to remove student');
                }

                setStudents(prev => prev.filter(student => student.id !== id));
                addLog({
                    type: 'student',
                    action: 'Student Removed',
                    description: `Student ${studentToRemove.name} ${studentToRemove.surname} was removed from the system.`
                });
            } catch (err: any) {
                console.error('Students API Error:', err);
                let msg = 'Failed to remove student.';
                try {
                    const errorData = JSON.parse(err.message);
                    if (errorData.error) msg += `\n\nReason: ${errorData.error}`;
                } catch (e) {
                    msg += `\n\n${err.message}`;
                }
                alert(msg);
            }
        }
    };

    const bulkRemoveStudents = async (studentRefs: { id: string }[]) => {
        // Implement bulk delete by calling removeStudent for each
        for (const ref of studentRefs) {
            await removeStudent(ref.id);
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
