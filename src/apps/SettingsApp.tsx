import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';

type SettingsView = 'root' | 'dashboard' | 'students' | 'users' | 'groups' | 'teachers' | 'salary';

export const SettingsApp: React.FC = () => {
    const {
        dashboard,
        students,
        users,
        teachers,
        updateDashboardSettings,
        updateStudentSettings,
        updateUserSettings,
        updateTeacherSettings,
        salary,
        updateSalarySettings
    } = useSettings();
    const [activeView, setActiveView] = useState<SettingsView>('root');

    const DetailHeader = ({ title }: { title: string }) => (
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <button
                onClick={() => setActiveView('root')}
                className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-full transition-colors"
                title="Back to Settings"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <h2 className="text-xl font-medium text-slate-900">{title}</h2>
        </div>
    );

    const SettingsRow = ({
        icon,
        title,
        description,
        onClick
    }: {
        icon: React.ReactNode;
        title: string;
        description: string;
        onClick: () => void;
    }) => (
        <button
            onClick={onClick}
            className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-all group"
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <div className="text-left">
                    <div className="font-medium text-slate-900">{title}</div>
                    <div className="text-xs text-slate-400">{description}</div>
                </div>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </button>
    );

    const renderContent = () => {
        switch (activeView) {
            case 'root':
                return (
                    <div className="w-full">
                        <h2 className="text-3xl font-light mb-8 text-slate-900">Settings</h2>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                            <SettingsRow
                                icon={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <rect x="3" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="14" width="7" height="7"></rect>
                                        <rect x="3" y="14" width="7" height="7"></rect>
                                    </svg>
                                }
                                title="Dashboard Overview"
                                description="Manage revenue display and activity feed"
                                onClick={() => setActiveView('dashboard')}
                            />

                            <SettingsRow
                                icon={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                }
                                title="Student Management"
                                description="Configure enrollment and default groups"
                                onClick={() => setActiveView('students')}
                            />

                            <SettingsRow
                                icon={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                }
                                title="Time Table"
                                description="Manage time slots and schedule"
                                onClick={() => setActiveView('groups')}
                            />

                            <SettingsRow
                                icon={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" strokeWidth={2} />
                                        <line x1="19" y1="8" x2="19" y2="14" strokeWidth={2} />
                                        <line x1="22" y1="11" x2="16" y2="11" strokeWidth={2} />
                                    </svg>
                                }
                                title="User Management"
                                description="Control employee access and roles"
                                onClick={() => setActiveView('users')}
                            />

                            <SettingsRow
                                icon={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                                        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                                    </svg>
                                }
                                title="Teacher Management"
                                description="Configure instructor profiles and preferences"
                                onClick={() => setActiveView('teachers')}
                            />

                            <SettingsRow
                                icon={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                }
                                title="Salary Management"
                                description="Configure salary reports and fines"
                                onClick={() => setActiveView('salary')}
                            />
                        </div>
                    </div>
                );

            case 'salary':
                return (
                    <div className="w-full">
                        <DetailHeader title="Salary Management" />
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 flex items-center justify-between border-b border-gray-50">
                                <div>
                                    <div className="font-medium text-slate-900">Show Fines</div>
                                    <div className="text-sm text-slate-400">Include fine details in teacher salary reports</div>
                                </div>
                                <button
                                    onClick={() => updateSalarySettings({ showFinesInReport: !salary.showFinesInReport })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${salary.showFinesInReport ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${salary.showFinesInReport ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'dashboard':
                return (
                    <div className="w-full">
                        <DetailHeader title="Dashboard Overview" />
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 flex items-center justify-between border-b border-gray-50">
                                <div>
                                    <div className="font-medium text-slate-900">Show Revenue Card</div>
                                    <div className="text-sm text-slate-400">Display financial metrics on the overview</div>
                                </div>
                                <button
                                    onClick={() => updateDashboardSettings({ showRevenue: !dashboard.showRevenue })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${dashboard.showRevenue ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dashboard.showRevenue ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <div className="p-6 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-slate-900">Recent Activity Feed</div>
                                    <div className="text-sm text-slate-400">Show latest system events</div>
                                </div>
                                <button
                                    onClick={() => updateDashboardSettings({ showRecentActivity: !dashboard.showRecentActivity })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${dashboard.showRecentActivity ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dashboard.showRecentActivity ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'students':
                return (
                    <div className="w-full">
                        <DetailHeader title="Student Management" />
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 flex items-center justify-between border-b border-gray-50">
                                <div>
                                    <div className="font-medium text-slate-900">Allow Bulk Actions</div>
                                    <div className="text-sm text-slate-400">Enable deleting multiple students at once</div>
                                </div>
                                <button
                                    onClick={() => updateStudentSettings({ allowBulkActions: !students.allowBulkActions })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${students.allowBulkActions ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${students.allowBulkActions ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <div className="p-6 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-slate-900">Default Group</div>
                                    <div className="text-sm text-slate-400">Auto-assign new students to a specific group</div>
                                </div>
                                <select
                                    value={students.defaultGroup}
                                    onChange={(e) => updateStudentSettings({ defaultGroup: e.target.value })}
                                    className="bg-gray-50 border border-gray-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                                >
                                    <option>None</option>
                                    <option>Grade 9</option>
                                    <option>Grade 10</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );
            case 'users':
                return (
                    <div className="max-w-2xl mx-auto">
                        <DetailHeader title="User Management" />
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 flex items-center justify-between border-b border-gray-50">
                                <div>
                                    <div className="font-medium text-slate-900">Allow User Deletion</div>
                                    <div className="text-sm text-slate-400">Enable deleting employee accounts</div>
                                </div>
                                <button
                                    onClick={() => updateUserSettings({ allowDeletion: !users.allowDeletion })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${users.allowDeletion ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${users.allowDeletion ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <div className="p-6 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-slate-900">Default Role</div>
                                    <div className="text-sm text-slate-400">Auto-assign new employees to a specific role</div>
                                </div>
                                <select
                                    value={users.defaultRole}
                                    onChange={(e) => updateUserSettings({ defaultRole: e.target.value })}
                                    className="bg-gray-50 border border-gray-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                                >
                                    <option value="employee">Employee</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );

            case 'groups':
                return (
                    <div className="w-full">
                        <DetailHeader title="Time Table Settings" />
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 mb-2">Configure Time Table</h3>
                            <p className="text-slate-500">
                                Time Table settings are coming soon. You can manage your schedule specifically in the <span className="font-medium text-slate-900">Time Table</span> tab from the sidebar.
                            </p>
                        </div>
                    </div>
                );

            case 'teachers':
                return (
                    <div className="w-full">
                        <DetailHeader title="Teacher Management" />
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 flex items-center justify-between border-b border-gray-50">
                                <div>
                                    <div className="font-medium text-slate-900">Show Teacher Specialization</div>
                                    <div className="text-sm text-slate-400">Display subjects or expertise in the teacher list</div>
                                </div>
                                <button
                                    onClick={() => updateTeacherSettings({ showSpecialization: !teachers.showSpecialization })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${teachers.showSpecialization ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${teachers.showSpecialization ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <div className="p-6 text-center bg-gray-50/50">
                                <p className="text-xs text-slate-400">Additional teacher-specific configurations will appear here.</p>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="p-8 w-full h-full overflow-y-auto">
            {renderContent()}
        </div>
    );
};
