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
        ...data.salaries.map(s => s.teacherName.trim()),
        ...data.fines.map(f => f.teacherName.trim())
    ])).filter(t => {
        if (!t) return false;
        const lower = t.toLowerCase();

        // Only hide if the name IS EXACTLY one of these technical words
        const technicalWords = ['total', 'grand total', 'subtotal', 'income', 'month', 'teacher', 'fio', 'answer', 'no fines', 'empty', '---', 'score', 'salary', 'finance', 'system root', 'unassigned'];
        if (technicalWords.includes(lower)) return false;

        // Also hide technical placeholders
        if (lower.includes('unassigned')) return false;

        return t.length > 2;
    }).sort((a, b) => a.localeCompare(b));

    // Global Statistics
    const totalSalaryAmount = (data?.salaries || []).reduce((sum, s) => sum + parseCurrency(s?.total), 0);
    const totalFinesAmount = (data?.fines || []).reduce((sum, f) => sum + parseCurrency(f?.amount), 0);

    const filteredTeachers = uniqueTeachers.filter(t =>
        t.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Current selection data - Raw individual monthly records
    const teacherSalariesRaw = selectedTeacher
        ? data.salaries.filter(s => s.teacherName.toLowerCase().trim() === selectedTeacher.toLowerCase().trim())
        : [];
    const teacherFines = selectedTeacher
        ? data.fines.filter(f => f.teacherName.toLowerCase().trim() === selectedTeacher.toLowerCase().trim())
        : [];

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Finance Data...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-slate-50 overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header Banner - Navigation Integrated */}
                <div className="bg-red-600 text-white px-6 py-3 text-[10px] font-bold flex justify-between items-center shrink-0 shadow-lg relative z-50">
                    <div className="flex items-center gap-6">
                        <span className="opacity-80">FINANCE SYSTEM v4.0</span>

                        {/* Custom Dropdown Selector */}
                        <div className="relative group">
                            <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all border border-white/20">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                <span className="text-sm uppercase tracking-wider">{selectedTeacher || 'Select Staff Folder'}</span>
                                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 hidden group-hover:block overflow-hidden transition-all duration-200">
                                <div className="p-2 border-b border-gray-50">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="w-full px-3 py-1.5 bg-slate-50 rounded-lg text-slate-800 text-xs focus:outline-none border border-transparent focus:border-indigo-100"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                <div className="max-h-80 overflow-y-auto py-1">
                                    <button
                                        onClick={() => setSelectedTeacher(null)}
                                        className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between ${selectedTeacher === null ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        System Root (Overview)
                                        {selectedTeacher === null && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
                                    </button>
                                    <div className="h-px bg-slate-50 my-1 mx-2"></div>
                                    {filteredTeachers.map(teacher => (
                                        <button
                                            key={teacher}
                                            onClick={() => setSelectedTeacher(teacher)}
                                            className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between ${selectedTeacher === teacher ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            {teacher}
                                            {selectedTeacher === teacher && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 items-center">
                        <div className="flex gap-4 opacity-70">
                            <span>S: {data.salaries.length}</span>
                            <span>F: {data.fines.length}</span>
                        </div>
                        <button onClick={() => window.location.reload()} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all border border-white/20" title="Refresh Data">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        <button onClick={() => window.location.href = '/'} className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-all border border-white/20 flex items-center gap-2" title="Exit to Desktop">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span className="text-[9px] uppercase tracking-widest">Home</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 lg:p-12">
                    <div className="max-w-6xl mx-auto space-y-10">
                        {selectedTeacher === null ? (
                            /* OVERVIEW VIEW */
                            <div className="space-y-10">
                                <div className="text-center py-6">
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
                                        Use the dropdown selector in the top header to explore individual financial records for each staff member. All data is aggregated directly from your Google Sheets.
                                    </p>
                                </div>

                                {/* Debug Section */}
                                <div className="bg-slate-100 p-6 rounded-3xl border border-slate-200">
                                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-xs uppercase tracking-widest">
                                        System Connectivity Status
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(data?.debug?.sheets || []).map((s: any, i: number) => (
                                            <div key={i} className="bg-white p-4 rounded-2xl flex items-center justify-between text-[10px]">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${s.error ? 'bg-red-500' : (s.salariesCount > 0 ? 'bg-green-500' : 'bg-yellow-500')}`}></div>
                                                    <div>
                                                        <div className="font-bold text-slate-700 uppercase">{s.title || 'Unknown File'}</div>
                                                        <div className="text-slate-400 font-medium">ID: ...{s.id?.slice(-8)}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {s.error ? (
                                                        <div className="text-red-500 font-bold italic">{s.error}</div>
                                                    ) : (
                                                        <div className="text-slate-500">
                                                            <div>Tabs: {s.tabCount || 0}</div>
                                                            <div>Records: {s.salariesCount || 0}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
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
                                                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right">Recount</th>
                                                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right">Net Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {(teacherSalariesRaw || []).map((s, i) => {
                                                    const matchingFines = (teacherFines || []).filter(f =>
                                                        f.month.toLowerCase().includes(s.month.toLowerCase()) ||
                                                        s.month.toLowerCase().includes(f.month.toLowerCase())
                                                    );

                                                    return (
                                                        <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                                                            <td className="px-6 py-4 font-bold text-slate-800">{s.month || '-'}</td>
                                                            <td className="px-6 py-4 text-right tabular-nums text-slate-500">{formatCurrency(parseCurrency(s.income))}</td>
                                                            <td className="px-6 py-4 text-right tabular-nums text-green-600 font-medium">+{formatCurrency(parseCurrency(s.bonus))}</td>
                                                            <td className="px-6 py-4 text-right tabular-nums text-red-600 font-medium whitespace-nowrap">
                                                                <div>-{formatCurrency(parseCurrency(s.fine))}</div>
                                                                {matchingFines.length > 0 && (
                                                                    <div className="text-[9px] text-red-400 mt-1 italic font-normal text-right opacity-80">
                                                                        {matchingFines.map(mf => mf.reason).join(', ')}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-right tabular-nums text-blue-600 font-medium">{formatCurrency(parseCurrency(s.recount))}</td>
                                                            <td className="px-6 py-4 text-right tabular-nums font-bold text-slate-900 bg-slate-50/50">{formatCurrency(parseCurrency(s.total))}</td>
                                                        </tr>
                                                    );
                                                })}
                                                {teacherSalariesRaw.length === 0 && (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No salary rows recorded for this entry</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                            {teacherSalariesRaw.length > 0 && (
                                                <tfoot className="bg-indigo-50/50 border-t-2 border-indigo-100">
                                                    <tr className="font-black text-slate-900">
                                                        <td className="px-6 py-4 uppercase tracking-widest text-[10px]">Total</td>
                                                        <td className="px-6 py-4 text-right tabular-nums">{formatCurrency(teacherSalariesRaw.reduce((sum, s) => sum + parseCurrency(s.income), 0))}</td>
                                                        <td className="px-6 py-4 text-right tabular-nums text-green-700">{formatCurrency(teacherSalariesRaw.reduce((sum, s) => sum + parseCurrency(s.bonus), 0))}</td>
                                                        <td className="px-6 py-4 text-right tabular-nums text-red-700">{formatCurrency(teacherSalariesRaw.reduce((sum, s) => sum + parseCurrency(s.fine), 0))}</td>
                                                        <td className="px-6 py-4 text-right tabular-nums text-blue-700">{formatCurrency(teacherSalariesRaw.reduce((sum, s) => sum + parseCurrency(s.recount), 0))}</td>
                                                        <td className="px-6 py-4 text-right tabular-nums bg-indigo-600 text-white shadow-inner">{formatCurrency(teacherSalariesRaw.reduce((sum, s) => sum + parseCurrency(s.total), 0))}</td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    </div>
                                </div>

                                {/* Summary Card for Visibility */}
                                <div className="flex justify-end pt-6">
                                    <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-2xl shadow-indigo-200 min-w-[300px]">
                                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-1">Final Disbursed Balance</div>
                                        <div className="text-4xl font-black tabular-nums tracking-tight">
                                            {formatCurrency(teacherSalariesRaw.reduce((sum, s) => sum + parseCurrency(s.total), 0))}
                                        </div>
                                        <div className="h-1.5 w-12 bg-white/20 rounded-full mt-4"></div>
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
