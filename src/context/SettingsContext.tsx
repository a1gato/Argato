import React, { createContext, useContext, useState, type ReactNode } from 'react';

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

interface SettingsContextType {
    dashboard: DashboardSettings;
    students: StudentSettings;
    users: UserSettings;
    teachers: TeacherSettings;
    updateDashboardSettings: (settings: Partial<DashboardSettings>) => void;
    updateStudentSettings: (settings: Partial<StudentSettings>) => void;
    updateUserSettings: (settings: Partial<UserSettings>) => void;
    updateTeacherSettings: (settings: Partial<TeacherSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'os_settings_v1';

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [dashboard, setDashboard] = useState<DashboardSettings>(() => {
        const saved = localStorage.getItem(`${SETTINGS_STORAGE_KEY}_dashboard`);
        return saved ? JSON.parse(saved) : { showRevenue: true, showRecentActivity: true };
    });

    const [students, setStudents] = useState<StudentSettings>(() => {
        const saved = localStorage.getItem(`${SETTINGS_STORAGE_KEY}_students`);
        return saved ? JSON.parse(saved) : { allowBulkActions: false, defaultGroup: 'None' };
    });

    const [users, setUsers] = useState<UserSettings>(() => {
        const saved = localStorage.getItem(`${SETTINGS_STORAGE_KEY}_users`);
        return saved ? JSON.parse(saved) : { allowDeletion: true, defaultRole: 'employee' };
    });

    const [teachers, setTeachers] = useState<TeacherSettings>(() => {
        const saved = localStorage.getItem(`${SETTINGS_STORAGE_KEY}_teachers`);
        return saved ? JSON.parse(saved) : { showSpecialization: false };
    });

    // Persistence effects
    React.useEffect(() => {
        localStorage.setItem(`${SETTINGS_STORAGE_KEY}_dashboard`, JSON.stringify(dashboard));
    }, [dashboard]);

    React.useEffect(() => {
        localStorage.setItem(`${SETTINGS_STORAGE_KEY}_students`, JSON.stringify(students));
    }, [students]);

    React.useEffect(() => {
        localStorage.setItem(`${SETTINGS_STORAGE_KEY}_users`, JSON.stringify(users));
    }, [users]);

    React.useEffect(() => {
        localStorage.setItem(`${SETTINGS_STORAGE_KEY}_teachers`, JSON.stringify(teachers));
    }, [teachers]);

    const updateDashboardSettings = (settings: Partial<DashboardSettings>) => {
        setDashboard(prev => ({ ...prev, ...settings }));
    };

    const updateStudentSettings = (settings: Partial<StudentSettings>) => {
        setStudents(prev => ({ ...prev, ...settings }));
    };

    const updateUserSettings = (settings: Partial<UserSettings>) => {
        setUsers(prev => ({ ...prev, ...settings }));
    };

    const updateTeacherSettings = (settings: Partial<TeacherSettings>) => {
        setTeachers(prev => ({ ...prev, ...settings }));
    };

    return (
        <SettingsContext.Provider value={{
            dashboard,
            students,
            users,
            teachers,
            updateDashboardSettings,
            updateStudentSettings,
            updateUserSettings,
            updateTeacherSettings
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
