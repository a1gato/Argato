import React, { useMemo, useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useUsers } from '../context/UsersContext';
import { useStudents } from '../context/StudentsContext';
import { useCohorts } from '../context/CohortContext';
import { useLogs } from '../context/LogContext';
import { StatPieChart, TrendChart } from '../components/AnalyticsCharts';

export const DashboardApp: React.FC = () => {
    const { dashboard } = useSettings();
    const { users } = useUsers();
    const { students } = useStudents();
    const { cohorts } = useCohorts();
    const { logs, clearLogs } = useLogs();
    const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

    // Compute student distribution data for Pie Chart
    const studentDistribution = useMemo(() => {
        return cohorts.map(cohort => ({
            name: cohort.name,
            value: students.filter(s => s.group === cohort.name).length
        })).filter(item => item.value > 0);
    }, [cohorts, students]);

    // Mock revenue trend data
    const revenueTrend = [
        { name: 'Mon', value: 400 },
        { name: 'Tue', value: 300 },
        { name: 'Wed', value: 600 },
        { name: 'Thu', value: 800 },
        { name: 'Fri', value: 500 },
        { name: 'Sat', value: 900 },
        { name: 'Sun', value: 1100 },
    ];

    const formatTime = (ts: number) => {
        const diff = Date.now() - ts;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return new Date(ts).toLocaleDateString();
    };

    const getLogColor = (type: string) => {
        switch (type) {
            case 'user': return 'bg-indigo-100';
            case 'student': return 'bg-blue-100';
            case 'cohort': return 'bg-purple-100';
            case 'settings': return 'bg-amber-100';
            default: return 'bg-slate-100';
        }
    };

    return (
        <div className="p-8 w-full h-full overflow-y-auto bg-slate-50/50">
            <div className="mb-8">
                <h1 className="text-3xl font-light text-slate-900">Statistics Dashboard</h1>
                <p className="text-slate-500 mt-1">Real-time overview of your educational platform</p>
            </div>

            {/* Stats Grid ... existing code ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:translate-y-[-2px] transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <span className="text-slate-400 text-sm font-medium">Total Users</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <div className="text-4xl font-light text-slate-900">{users.filter(u => u.role !== 'admin').length}</div>
                        <div className="text-xs font-medium text-emerald-500 flex items-center">
                            <span>Staff Members</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:translate-y-[-2px] transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            </svg>
                        </div>
                        <span className="text-slate-400 text-sm font-medium">Students</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <div className="text-4xl font-light text-slate-900">{students.length}</div>
                        <div className="text-xs font-medium text-blue-500">Enrolled</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:translate-y-[-2px] transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <span className="text-slate-400 text-sm font-medium">Active Groups</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <div className="text-4xl font-light text-slate-900">{cohorts.length}</div>
                        <div className="text-xs font-medium text-purple-500">Cohorts</div>
                    </div>
                </div>

                {dashboard.showRevenue && (
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:translate-y-[-2px] transition-all duration-300">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
                                </svg>
                            </div>
                            <span className="text-slate-400 text-sm font-medium">Revenue</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <div className="text-4xl font-light text-slate-900">$0.00</div>
                            <div className="text-xs font-medium text-emerald-500">Total</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                {studentDistribution.length > 0 ? (
                    <StatPieChart
                        data={studentDistribution}
                        title="Student Distribution by Group"
                    />
                ) : (
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-[400px] flex flex-col items-center justify-center text-slate-400">
                        <svg className="w-16 h-16 mb-4 text-slate-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                        <p>Assign students to groups to see distribution</p>
                    </div>
                )}

                {dashboard.showRevenue && (
                    <TrendChart
                        data={revenueTrend}
                        title="Weekly Revenue Trend"
                        color="#10b981"
                    />
                )}
            </div>

            {/* Recent Activity */}
            {dashboard.showRecentActivity && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-slate-800">System Logs</h3>
                        <button
                            onClick={() => setIsLogsModalOpen(true)}
                            className="text-indigo-600 text-sm font-medium hover:text-indigo-700 transition-colors"
                        >
                            View All
                        </button>
                    </div>
                    <div className="space-y-6">
                        {logs.length === 0 ? (
                            <div className="flex items-center justify-center h-24 text-slate-400 text-sm italic">
                                No system events recorded yet.
                            </div>
                        ) : (
                            logs.slice(0, 5).map((log) => (
                                <div key={log.id} className="flex gap-4">
                                    <div className={`w-1 ${getLogColor(log.type)} rounded-full`}></div>
                                    <div className="flex-1 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                        <p className="text-sm font-medium text-slate-900">{log.action}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {log.description} · {formatTime(log.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Logs Modal */}
            {isLogsModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">Full System History</h2>
                                <p className="text-sm text-slate-500 mt-0.5">Showing last {logs.length} events</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to clear all logs?')) {
                                            clearLogs();
                                        }
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                >
                                    Clear All
                                </button>
                                <button
                                    onClick={() => setIsLogsModalOpen(false)}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {logs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                    <svg className="w-16 h-16 mb-4 text-slate-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="italic">History is empty</p>
                                </div>
                            ) : (
                                logs.map((log) => (
                                    <div key={log.id} className="flex gap-6 group">
                                        <div className={`w-1.5 rounded-full ${getLogColor(log.type)} group-last:bg-transparent`}></div>
                                        <div className="flex-1 pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-base font-semibold text-slate-900">{log.action}</p>
                                                <span className="text-xs font-medium text-slate-400 tabular-nums">
                                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed">
                                                {log.description}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${log.type === 'user' ? 'bg-indigo-50 text-indigo-600' :
                                                    log.type === 'student' ? 'bg-blue-50 text-blue-600' :
                                                        log.type === 'cohort' ? 'bg-purple-50 text-purple-600' :
                                                            'bg-slate-50 text-slate-600'
                                                    }`}>
                                                    {log.type}
                                                </span>
                                                <span className="text-[10px] text-slate-400">• {new Date(log.timestamp).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
