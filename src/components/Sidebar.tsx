import React from 'react';
import { useOS } from '../context/OSContext';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
    const { setActiveApp, activeAppId } = useOS();
    const { logout } = useAuth();

    const isActive = (id: string) => activeAppId === id;

    return (
        <div className="h-full w-64 bg-gray-100 border-r border-gray-300 flex flex-col items-center py-4 gap-4 z-50">
            {/* Start / OS Logo - REMOVED */}

            {/* App Icons */}
            <div className="flex-1 w-full flex flex-col items-center gap-2 pt-2">

                {/* Logo */}
                <div className="flex items-center gap-3 mb-8 px-6 w-full">
                    <div className="w-10 h-10 shrink-0">
                        <img src="/logo.png" alt="Fast IT Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xl font-bold text-[#1a2e4c] tracking-tight whitespace-nowrap">Fast IT</span>
                </div>

                {/* Dashboard Button */}
                <button
                    onClick={() => setActiveApp('dashboard')}
                    className={`w-full px-3 py-3 mx-2 rounded-xl flex flex-row items-center justify-start gap-3 transition-all duration-200 group relative
                        ${isActive('dashboard')
                            ? 'bg-white/10 text-slate-900 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 duration-300">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                    <span className="text-xs font-medium tracking-wide">Overview</span>
                </button>

                {/* Students Button */}
                <button
                    onClick={() => setActiveApp('students')}
                    className={`w-full px-3 py-3 mx-2 rounded-xl flex flex-row items-center justify-start gap-3 transition-all duration-200 group relative
                        ${isActive('students')
                            ? 'bg-white/10 text-slate-900 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 duration-300">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <span className="text-xs font-medium tracking-wide">Students</span>
                </button>

                {/* Teachers Button (New) */}
                <button
                    onClick={() => setActiveApp('teachers')}
                    className={`w-full px-3 py-3 mx-2 rounded-xl flex flex-row items-center justify-start gap-3 transition-all duration-200 group relative
                        ${isActive('teachers')
                            ? 'bg-white/10 text-slate-900 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 duration-300">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                    </svg>
                    <span className="text-xs font-medium tracking-wide">Teachers</span>
                </button>

                {/* Salary Button (New) */}
                <button
                    onClick={() => setActiveApp('salary')}
                    className={`w-full px-3 py-3 mx-2 rounded-xl flex flex-row items-center justify-start gap-3 transition-all duration-200 group relative
                        ${isActive('salary')
                            ? 'bg-white/10 text-slate-900 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 duration-300">
                        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    <span className="text-xs font-medium tracking-wide">Salary</span>
                </button>

                {/* Groups Button (New) */}
                <button
                    onClick={() => setActiveApp('groups')}
                    className={`w-full px-3 py-3 mx-2 rounded-xl flex flex-row items-center justify-start gap-3 transition-all duration-200 group relative
                        ${isActive('groups')
                            ? 'bg-white/10 text-slate-900 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 duration-300">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    </svg>
                    <span className="text-xs font-medium tracking-wide">Groups</span>
                </button>

                {/* Time Table Button (Renamed) */}
                <button
                    onClick={() => setActiveApp('timetable')}
                    className={`w-full px-3 py-3 mx-2 rounded-xl flex flex-row items-center justify-start gap-3 transition-all duration-200 group relative
                        ${isActive('timetable')
                            ? 'bg-white/10 text-slate-900 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 duration-300">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span className="text-xs font-medium tracking-wide">Time Table</span>
                </button>

                {/* Users Button */}
                <button
                    onClick={() => setActiveApp('users')}
                    className={`w-full px-3 py-3 mx-2 rounded-xl flex flex-row items-center justify-start gap-3 transition-all duration-200 group relative
                        ${isActive('users')
                            ? 'bg-white/10 text-slate-900 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 duration-300">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <line x1="19" y1="8" x2="19" y2="14"></line>
                        <line x1="22" y1="11" x2="16" y2="11"></line>
                    </svg>
                    <span className="text-xs font-medium tracking-wide">Users</span>
                </button>

            </div>

            <div className="flex-1" />

            <button
                onClick={() => setActiveApp('settings')}
                className={`w-full px-3 py-3 mx-2 rounded-xl flex flex-row items-center justify-start gap-3 transition-all duration-200 group relative
                    ${isActive('settings')
                        ? 'bg-white/10 text-slate-900 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                    }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 duration-300">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                <span className="text-xs font-medium tracking-wide">Settings</span>
            </button>

            <button
                onClick={logout}
                className="w-full px-3 py-3 mx-2 rounded-xl flex flex-row items-center justify-start gap-3 text-red-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 group relative"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0 transition-transform group-hover:translate-x-1 duration-200">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span className="text-xs font-medium tracking-wide">Logout</span>
            </button>
        </div>
    );
};
