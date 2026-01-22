import React from 'react';
import { useOS } from '../context/OSContext';
import { Sidebar } from './Sidebar';

// Apps
import { SettingsApp } from '../apps/SettingsApp';
import { DashboardApp } from '../apps/DashboardApp';
import { StudentsApp } from '../apps/StudentsApp';
import { TimeTableApp } from '../apps/TimeTableApp';
import { GroupsApp } from '../apps/GroupsApp';
import { UsersApp } from '../apps/UsersApp';
import { TeachersApp } from '../apps/TeachersApp';

export const Desktop: React.FC = () => {
    const { activeAppId } = useOS();

    const renderActiveApp = () => {
        switch (activeAppId) {
            case 'dashboard': return <DashboardApp />;
            case 'students': return <StudentsApp />;
            case 'groups': return <GroupsApp />;
            case 'timetable': return <TimeTableApp />;
            case 'teachers': return <TeachersApp />;
            case 'users': return <UsersApp />;
            case 'settings': return <SettingsApp />;
            default: return <div className="flex items-center justify-center text-slate-400 text-sm tracking-widest font-light select-none h-full">EMPTY SPACE</div>;
        }
    };

    return (
        <div className="h-screen w-screen relative overflow-hidden bg-gray-50 flex flex-row text-slate-900">
            {/* Sidebar (Left Bar) */}
            <Sidebar />

            {/* Main Content Area (Full Screen App) */}
            <div className="flex-1 relative h-full bg-white overflow-hidden flex flex-col">
                {/* App Content */}
                <div className="flex-1 relative overflow-auto p-0">
                    {renderActiveApp()}
                </div>
            </div>
        </div>
    );
};
