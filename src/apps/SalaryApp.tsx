import React, { useState, useEffect } from 'react';
import { fetchSheetData, type Fine, type Salary } from '../services/sheetsService';

export const SalaryApp: React.FC = () => {
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
    const [data, setData] = useState<{ fines: Fine[]; salaries: Salary[]; debug?: { sheets: string[] } }>({ fines: [], salaries: [] });
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

    const uniqueTeachers = Array.from(new Set([
        ...data.salaries.map(s => s.teacherName),
        ...data.fines.map(f => f.teacherName)
    ])).filter(t => {
        if (!t) return false;
        const lower = t.toLowerCase();
        // Filter out common spreadsheet summary words and potential header artifacts
        const invalidWords = ['total', 'grand total', 'subtotal', 'income', 'month', 'teacher', 'december', 'november', 'october', 'september', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august'];
        return !invalidWords.some(w => lower.includes(w));
    }).sort();

    const filteredTeachers = uniqueTeachers.filter(t =>
        t.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const parseCurrency = (value: string): number => {
        if (!value) return 0;
        // Remove commas, currency symbols, and whitespace
        const cleanValue = value.replace(/[$,\s]/g, '');
        const number = parseFloat(cleanValue);
        return isNaN(number) ? 0 : number;
    };

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('uz-UZ', {
            style: 'currency',
            currency: 'UZS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const handleTeacherClick = (teacher: string) => {
        setSelectedTeacher(teacher);
        setView('detail');
        setSearchTerm(''); // Clear search when entering detail view
    };

    const handleBack = () => {
        setView('list');
        setSelectedTeacher(null);
        setSearchTerm('');
    };

    // Helper for month sorting
    const getMonthValue = (month: string) => {
        const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
        const lower = month.toLowerCase();
        const index = months.findIndex(m => lower.includes(m));
        return index === -1 ? 99 : index;
    };

    // Filter Logic for Detail View
    const teacherSalaries = data.salaries.filter(s =>
        s.teacherName === selectedTeacher
    ).sort((a, b) => getMonthValue(a.month) - getMonthValue(b.month));

    const teacherFines = data.fines.filter(f =>
        f.teacherName === selectedTeacher
    );

    const totalSalaryAmount = teacherSalaries.reduce((sum, s) => sum + parseCurrency(s.total), 0);
    const totalFinesAmount = teacherFines.reduce((sum, f) => sum + parseCurrency(f.amount), 0);

    // Sort salaries by month if needed (optional logic, relying on sheet order for now)

    return (
        <div className="flex h-full bg-slate-50">
            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="h-16 border-b border-gray-200 bg-white px-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 mr-4 border-r border-gray-200 pr-4">
                            <span className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center font-bold">
                                $
                            </span>
                            <span className="text-xl font-light text-slate-800 hidden md:block">Finance</span>
                        </div>

                        {view === 'detail' && (
                            <button
                                onClick={handleBack}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                        )}
                        <h2 className="text-lg font-medium text-slate-800">
                            {view === 'list' ? 'Staff Directory' : `${selectedTeacher} - Financial Overview`}
                        </h2>
                    </div>

                    {view === 'list' && (
                        <div className="relative w-64">
                            <input
                                type="text"
                                placeholder="Search teachers..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        </div>
                    ) : (
                        <>
                            {view === 'list' && (
                                <div className="flex flex-col space-y-2">
                                    {filteredTeachers.map((teacher, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleTeacherClick(teacher)}
                                            className="flex items-center p-3 bg-white border border-gray-100 rounded-lg hover:border-green-200 hover:bg-green-50/30 transition-all group text-left"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-medium group-hover:bg-white group-hover:text-green-600 transition-colors">
                                                {teacher.charAt(0)}
                                            </div>
                                            <div className="ml-4 flex-1">
                                                <div className="font-medium text-slate-900 group-hover:text-green-700 transition-colors">
                                                    {teacher}
                                                </div>
                                            </div>
                                            <div className="text-slate-400 group-hover:text-green-600 transition-colors">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </button>
                                    ))}
                                    {filteredTeachers.length === 0 && (
                                        <div className="text-center py-12 text-slate-400">
                                            No teachers found matching "{searchTerm}"
                                        </div>
                                    )}

                                    {/* DEBUG PANEL */}
                                    <div className="mt-8 p-4 bg-gray-100 rounded-lg border border-gray-200 text-xs font-mono text-gray-600">
                                        <h4 className="font-bold text-gray-800 mb-2">Debug Info</h4>
                                        <p><strong>Sheets Loaded:</strong> {data.debug?.sheets?.join(', ') || 'None'}</p>
                                        <p><strong>Total Salary Records:</strong> {data.salaries.length}</p>
                                        <p><strong>Total Fines:</strong> {data.fines.length}</p>
                                        <p><strong>Teachers Found:</strong> {uniqueTeachers.length}</p>
                                    </div>
                                </div>
                            )}

                            {view === 'detail' && (
                                <div className="space-y-6">
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                            <div className="text-sm text-slate-500 mb-1">Total Salary Disbursed</div>
                                            <div className="text-2xl font-semibold text-slate-900">
                                                {formatCurrency(totalSalaryAmount)}
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                            <div className="text-sm text-slate-500 mb-1">Total Fines</div>
                                            <div className="text-2xl font-semibold text-red-600">
                                                {formatCurrency(totalFinesAmount)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Salary Table */}
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-green-50/30">
                                            <h3 className="font-semibold text-slate-800">Salary History</h3>
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
                                                {teacherSalaries.map((s, i) => (
                                                    <tr key={i} className="hover:bg-slate-50/50">
                                                        <td className="px-6 py-3 font-medium text-slate-900">{s.month}</td>
                                                        <td className="px-6 py-3 text-right">{formatCurrency(parseCurrency(s.income))}</td>
                                                        <td className="px-6 py-3 text-right text-green-600">{formatCurrency(parseCurrency(s.bonus))}</td>
                                                        <td className="px-6 py-3 text-right text-red-600">{formatCurrency(parseCurrency(s.fine))}</td>
                                                        <td className="px-6 py-3 text-right font-bold text-slate-900">{formatCurrency(parseCurrency(s.total))}</td>
                                                    </tr>
                                                ))}
                                                {teacherSalaries.length === 0 && (
                                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No active salary records found</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Fines Table */}
                                    {teacherFines.length > 0 && (
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-red-50/30">
                                                <h3 className="font-semibold text-slate-800">Fines Record</h3>
                                            </div>
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 text-slate-500">
                                                    <tr>
                                                        <th className="px-6 py-3 font-medium">Date</th>
                                                        <th className="px-6 py-3 font-medium">Reason</th>
                                                        <th className="px-6 py-3 font-medium text-right">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {teacherFines.map((f, i) => (
                                                        <tr key={i} className="hover:bg-slate-50/50">
                                                            <td className="px-6 py-3 text-slate-500">{f.date}</td>
                                                            <td className="px-6 py-3 text-slate-900">{f.reason}</td>
                                                            <td className="px-6 py-3 text-right font-medium text-red-600">{formatCurrency(-parseCurrency(f.amount))}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {/* DEBUG PANEL - DETAIL VIEW */}
                                    <div className="mt-8 p-4 bg-gray-100 rounded-lg border border-gray-200 text-xs font-mono text-gray-600">
                                        <h4 className="font-bold text-gray-800 mb-2">Debug Info (Detail View)</h4>
                                        <p><strong>Selected Teacher:</strong> '{selectedTeacher}'</p>
                                        <p><strong>Sheets Loaded:</strong> {data.debug?.sheets?.join(', ') || 'None'}</p>
                                        <p><strong>Total Salary Records:</strong> {data.salaries.length}</p>
                                        <p><strong>Matching Records Found:</strong> {teacherSalaries.length}</p>
                                        <div className="mt-2 text-gray-500">
                                            <p className="font-semibold">First 5 Teachers in Data:</p>
                                            {Array.from(new Set(data.salaries.map(s => s.teacherName))).slice(0, 5).map(t => (
                                                <div key={t}>'{t}'</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
