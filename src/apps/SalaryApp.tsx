import React, { useState, useEffect } from 'react';
import { fetchSheetData, type Fine, type Salary } from '../services/sheetsService';

export const SalaryApp: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'salaries' | 'fines'>('overview');
    const [data, setData] = useState<{ fines: Fine[]; salaries: Salary[] }>({ fines: [], salaries: [] });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const result = await fetchSheetData();
            setData(result);
            setLoading(false);
        };
        loadData();
    }, []);

    const filteredFines = data.fines.filter(f =>
        f.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.reason.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // For salaries, we filter by row contents if possible, mostly Month right now based on previous knowledge
    const filteredSalaries = data.salaries.filter(s =>
        s.month.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-full bg-slate-50">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-light text-slate-800 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                            $
                        </span>
                        Finance
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('salaries')}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'salaries' ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        Salaries
                    </button>
                    <button
                        onClick={() => setActiveTab('fines')}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'fines' ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        Fines
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="h-16 border-b border-gray-200 bg-white px-8 flex items-center justify-between shrink-0">
                    <h2 className="text-lg font-medium text-slate-800 capitalize">{activeTab}</h2>
                    <div className="relative w-64">
                        <input
                            type="text"
                            placeholder="Search records..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Overview Cards */}
                            {activeTab === 'overview' && (
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="text-sm text-slate-500 mb-1">Total Salaries</div>
                                        <div className="text-2xl font-semibold text-slate-900">{filteredSalaries.length} Records</div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="text-sm text-slate-500 mb-1">Total Fines</div>
                                        <div className="text-2xl font-semibold text-slate-900">{filteredFines.length} Issued</div>
                                    </div>
                                </div>
                            )}

                            {/* Salaries Table */}
                            {(activeTab === 'overview' || activeTab === 'salaries') && (
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                        <h3 className="font-semibold text-slate-800">Salary Records</h3>
                                    </div>
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-slate-500">
                                            <tr>
                                                <th className="px-6 py-3 font-medium">Month</th>
                                                <th className="px-6 py-3 font-medium text-right">Income</th>
                                                <th className="px-6 py-3 font-medium text-right">Bonus</th>
                                                <th className="px-6 py-3 font-medium text-right">Fine</th>
                                                <th className="px-6 py-3 font-medium text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredSalaries.map((s, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50">
                                                    <td className="px-6 py-3 font-medium text-slate-900">{s.month}</td>
                                                    <td className="px-6 py-3 text-right">{s.income}</td>
                                                    <td className="px-6 py-3 text-right text-green-600">{s.bonus}</td>
                                                    <td className="px-6 py-3 text-right text-red-600">{s.fine}</td>
                                                    <td className="px-6 py-3 text-right font-bold text-slate-900">{s.total}</td>
                                                </tr>
                                            ))}
                                            {filteredSalaries.length === 0 && (
                                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No salary records found</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Fines Table */}
                            {(activeTab === 'overview' || activeTab === 'fines') && (
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                        <h3 className="font-semibold text-slate-800">Recent Fines</h3>
                                    </div>
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-slate-500">
                                            <tr>
                                                <th className="px-6 py-3 font-medium">Teacher / ID</th>
                                                <th className="px-6 py-3 font-medium">Reason</th>
                                                <th className="px-6 py-3 font-medium">Date</th>
                                                <th className="px-6 py-3 font-medium text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredFines.map((f, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50">
                                                    <td className="px-6 py-3 font-medium text-slate-900">{f.teacherName}</td>
                                                    <td className="px-6 py-3 text-slate-600">{f.reason}</td>
                                                    <td className="px-6 py-3 text-slate-500">{f.date}</td>
                                                    <td className="px-6 py-3 text-right font-medium text-red-600">-{f.amount}</td>
                                                </tr>
                                            ))}
                                            {filteredFines.length === 0 && (
                                                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No fines found</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
