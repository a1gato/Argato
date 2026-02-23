import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface DashboardSettings {
    showRevenue: boolean;
    showRecentActivity: boolean;
}

interface StudentSettings {
    allowBulkActions: boolean;
    defaultGroup: string;
}

interface UserSettings {
    allowDeletion: boolean;
    defaultRole: string;
}

interface TeacherSettings {
    showSpecialization: boolean;
}

interface SalarySettings {
    showFinesInReport: boolean;
}

interface SettingsContextType {
    dashboard: DashboardSettings;
    students: StudentSettings;
    users: UserSettings;
    teachers: TeacherSettings;
    salary: SalarySettings;
    updateDashboardSettings: (settings: Partial<DashboardSettings>) => void;
    updateStudentSettings: (settings: Partial<StudentSettings>) => void;
    updateUserSettings: (settings: Partial<UserSettings>) => void;
    updateTeacherSettings: (settings: Partial<TeacherSettings>) => void;
    updateSalarySettings: (settings: Partial<SalarySettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

import { supabase } from '../lib/supabase';

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [dashboard, setDashboard] = useState<DashboardSettings>({ showRevenue: true, showRecentActivity: true });
    const [students, setStudents] = useState<StudentSettings>({ allowBulkActions: false, defaultGroup: 'None' });
    const [users, setUsers] = useState<UserSettings>({ allowDeletion: true, defaultRole: 'employee' });
    const [teachers, setTeachers] = useState<TeacherSettings>({ showSpecialization: false });
    const [salary, setSalary] = useState<SalarySettings>({ showFinesInReport: true });
    const loadSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('*');

            if (error) throw error;

            if (data) {
                data.forEach((row: any) => {
                    switch (row.section) {
                        case 'dashboard': setDashboard(row.data); break;
                        case 'students': setStudents(row.data); break;
                        case 'users': setUsers(row.data); break;
                        case 'teachers': setTeachers(row.data); break;
                        case 'salary': setSalary(row.data); break;
                    }
                });
            }
        } catch (err) {
            console.error('Error loading settings from Supabase:', err);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const saveSetting = async (section: string, data: any) => {
        try {
            await supabase
                .from('settings')
                .upsert({ section, data });
        } catch (err) {
            console.error(`Error saving ${section} settings:`, err);
        }
    };

    const updateDashboardSettings = (settings: Partial<DashboardSettings>) => {
        const newSettings = { ...dashboard, ...settings };
        setDashboard(newSettings);
        saveSetting('dashboard', newSettings);
    };

    const updateStudentSettings = (settings: Partial<StudentSettings>) => {
        const newSettings = { ...students, ...settings };
        setStudents(newSettings);
        saveSetting('students', newSettings);
    };

    const updateUserSettings = (settings: Partial<UserSettings>) => {
        const newSettings = { ...users, ...settings };
        setUsers(newSettings);
        saveSetting('users', newSettings);
    };

    const updateTeacherSettings = (settings: Partial<TeacherSettings>) => {
        const newSettings = { ...teachers, ...settings };
        setTeachers(newSettings);
        saveSetting('teachers', newSettings);
    };

    const updateSalarySettings = (settings: Partial<SalarySettings>) => {
        const newSettings = { ...salary, ...settings };
        setSalary(newSettings);
        saveSetting('salary', newSettings);
    };

    return (
        <SettingsContext.Provider value={{
            dashboard,
            students,
            users,
            teachers,
            salary,
            updateDashboardSettings,
            updateStudentSettings,
            updateUserSettings,
            updateTeacherSettings,
            updateSalarySettings
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
