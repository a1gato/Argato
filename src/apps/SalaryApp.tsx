import React, { useState, useEffect } from 'react';
import { fetchSheetData, type Fine, type Salary } from '../services/sheetsService';

export const SalaryApp: React.FC = () => {
    const [data, setData] = useState<{ fines: Fine[]; salaries: Salary[]; debug?: { sheets: string[]; rawRows?: any[][] } }>({ fines: [], salaries: [] });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const result = await fetchSheetData();
            setData(result);
            setLoading(false);
        };
        loadData();
    }, []);

    const parseCurrency = (value: string): number => {
        if (!value) return 0;
        const cleanValue = value.replace(/[$,\s]/g, '');
        const number = parseFloat(cleanValue);
        return isNaN(number) ? 0 : number;
    };

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value) + ' UZS';
    };

    // Calculate Unique Teachers/Categories for the Sidebar
    const uniqueTeachers = Array.from(new Set([
        ...data.salaries.map(s => s.teacherName),
        ...data.fines.map(f => f.teacherName)
    ])).filter(t => {
        if (!t) return false;
        const lower = t.toLowerCase();
        // Hide ALL Unassigned folders - they were noise/junk
        if (lower.includes('unassigned')) return false;
        const invalidWords = ['total', 'grand total', 'subtotal', 'income', 'month', 'teacher', 'fio', 'answer', 'no fines', 'empty', '---', 'score', 'salary', 'finance', 'system root'];
        return !invalidWords.some(w => lower.includes(w));
    }).sort((a, b) => a.localeCompare(b));

    // Global Statistics
    const totalSalaryAmount = (data?.salaries || []).reduce((sum, s) => sum + parseCurrency(s?.total), 0);
    const totalFinesAmount = (data?.fines || []).reduce((sum, f) => sum + parseCurrency(f?.amount), 0);

    const filteredTeachers = uniqueTeachers.filter(t =>
        t.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Current selection data
    const teacherSalaries = selectedTeacher
        ? data.salaries.filter(s => s.teacherName === selectedTeacher)
        : [];
    const teacherFines = selectedTeacher
        ? data.fines.filter(f => f.teacherName === selectedTeacher)
        : [];

    return (
        <div className="flex h-full bg-slate-50 overflow-hidden">
            {/* Left Sidebar - Staff Folders */}
            <div className="w-80 border-r border-gray-200 bg-white flex flex-col shrink-0">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 uppercase tracking-tighter">Staff Folders</h2>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search teachers..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {/* Overview Card */}
                    <button
                        onClick={() => setSelectedTeacher(null)}
                        className={`w-full text-left p-4 rounded-2xl transition-all ${selectedTeacher === null ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'hover:bg-slate-50 text-slate-600'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${selectedTeacher === null ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div>
                                <div className={`text-sm font-bold ${selectedTeacher === null ? 'text-white' : 'text-slate-800'}`}>System Root</div>
                                <div className={`text-[10px] ${selectedTeacher === null ? 'text-indigo-100' : 'text-slate-400'}`}>Global Statistics</div>
                            </div>
                        </div>
                    </button>

                    <div className="h-4 border-b border-gray-100 mb-2"></div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        filteredTeachers.map(teacher => (
                            <button
                                key={teacher}
                                onClick={() => setSelectedTeacher(teacher)}
                                className={`w-full text-left p-4 rounded-2xl transition-all group ${selectedTeacher === teacher ? 'bg-white shadow-md border border-gray-100 ring-2 ring-indigo-500/5' : 'hover:bg-slate-50 border border-transparent'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${selectedTeacher === teacher ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-white'}`}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className={`text-sm font-bold truncate ${selectedTeacher === teacher ? 'text-indigo-600' : 'text-slate-700'}`}>{teacher}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Finance Folder</div>
                                            {data.salaries.some(s => s.teacherName === teacher) && (
                                                <span className="w-1 h-1 rounded-full bg-green-500" title="Has Salary Record"></span>
                                            )}
                                            {data.fines.some(f => f.teacherName === teacher) && (
                                                <span className="w-1 h-1 rounded-full bg-red-400" title="Has Fine Record"></span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Right Content - Details */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header Banner */}
                <div className="bg-red-600 text-white px-6 py-2 text-[10px] font-bold flex justify-between items-center shrink-0">
                    <span>FINANCE SYSTEM v4.0 - {selectedTeacher || 'Master Overview'}</span>
                    <div className="flex gap-4">
                        <span>Salaries: {data.salaries.length}</span>
                        <span>Fines: {data.fines.length}</span>
                        <button onClick={() => window.location.reload()} className="underline hover:no-underline">Force Refresh</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                    <div className="max-w-5xl mx-auto space-y-10">
                        {selectedTeacher === null ? (
                            /* OVERVIEW VIEW */
                            <div className="space-y-10">
                                <div>
                                    <h1 className="text-4xl font-light text-slate-900">Financial Overview</h1>
                                    <p className="text-slate-500 mt-2">Comprehensive system aggregation across all spreadsheet data</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Salary Volume</div>
                                        <div className="text-3xl font-bold text-slate-900">{formatCurrency(totalSalaryAmount)}</div>
                                        <div className="h-1 w-full bg-green-100 rounded-full mt-4 overflow-hidden">
                                            <div className="h-full bg-green-500 w-[70%]"></div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Fines</div>
                                        <div className="text-3xl font-bold text-red-600">{formatCurrency(totalFinesAmount)}</div>
                                        <div className="h-1 w-full bg-red-100 rounded-full mt-4 overflow-hidden">
                                            <div className="h-full bg-red-500 w-[15%]"></div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Net Distribution</div>
                                        <div className="text-3xl font-bold text-indigo-600">{formatCurrency(totalSalaryAmount - totalFinesAmount)}</div>
                                        <div className="h-1 w-full bg-indigo-100 rounded-full mt-4 overflow-hidden">
                                            <div className="h-full bg-indigo-500 w-full"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                                    <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Usage Instructions
                                    </h3>
                                    <p className="text-indigo-700 text-sm leading-relaxed">
                                        Use the sidebar to explore individual financial records for each staff member. Categories labeled as "Unassigned" contain spreadsheet rows where a teacher's name was not explicitly provided in Column A.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* TEACHER DETAIL VIEW */
                            <div className="space-y-10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Storage Path</span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-slate-500 text-sm">/staff_folders/{selectedTeacher.toLowerCase().replace(/\s+/g, '_')}</span>
                                        </div>
                                        <h1 className="text-4xl font-light text-slate-900">{selectedTeacher}</h1>
                                        <p className="text-slate-500 mt-2">Aggregated monthly records from all spreadsheet sources</p>
                                    </div>
                                </div>

                                {/* Salary Section */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 px-2">Salary History</h3>
                                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 border-b border-gray-100">
                                                <tr>
                                                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Month</th>
                                                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right">Income</th>
                                                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right">Bonus</th>
                                                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right">Fine</th>
                                                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right">Net Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {(teacherSalaries || []).map((s, i) => (
                                                    <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-slate-800">{s.month || '-'}</td>
                                                        <td className="px-6 py-4 text-right tabular-nums text-slate-500">{formatCurrency(parseCurrency(s.income))}</td>
                                                        <td className="px-6 py-4 text-right tabular-nums text-green-600 font-medium">+{formatCurrency(parseCurrency(s.bonus))}</td>
                                                        <td className="px-6 py-4 text-right tabular-nums text-red-600 font-medium">-{formatCurrency(parseCurrency(s.fine))}</td>
                                                        <td className="px-6 py-4 text-right tabular-nums font-bold text-slate-900 bg-slate-50/50">{formatCurrency(parseCurrency(s.total))}</td>
                                                    </tr>
                                                ))}
                                                {teacherSalaries.length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No salary rows recorded for this entry</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Fines Section */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 px-2">Fines Record</h3>
                                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-sm">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 border-b border-gray-100">
                                                <tr>
                                                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Date/Month</th>
                                                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Reason</th>
                                                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {(teacherFines || []).map((f, i) => (
                                                    <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-slate-800">{f.month}</div>
                                                            <div className="text-[10px] text-slate-400">{f.date}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600 italic">"{f.reason}"</td>
                                                        <td className="px-6 py-4 text-right tabular-nums font-bold text-red-600">{formatCurrency(parseCurrency(f.amount))}</td>
                                                    </tr>
                                                ))}
                                                {teacherFines.length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">Clean record - No fines found</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}


                    </div>
                </div>
            </div>
        </div>
    );
};
