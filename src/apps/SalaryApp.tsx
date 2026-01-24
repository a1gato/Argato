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

    // Calculate Unique Teachers
    const uniqueTeachers = Array.from(new Set([
        ...data.salaries.map(s => s.teacherName.trim()),
        ...data.fines.map(f => f.teacherName.trim())
    ])).filter(t => {
        if (!t) return false;
        const lower = t.toLowerCase();
        const technicalWords = ['total', 'grand total', 'subtotal', 'income', 'month', 'teacher', 'fio', 'answer', 'no fines', 'empty', '---', 'score', 'salary', 'finance', 'system root', 'unassigned'];
        if (technicalWords.includes(lower)) return false;
        if (lower.includes('unassigned')) return false;
        return t.length > 2;
    }).sort((a, b) => a.localeCompare(b));

    // Global Statistics
    const totalSalaryAmount = (data?.salaries || []).reduce((sum, s) => sum + parseCurrency(s?.total), 0);
    const totalFinesAmount = (data?.fines || []).reduce((sum, f) => sum + parseCurrency(f?.amount), 0);

    const filteredTeachers = uniqueTeachers.filter(t =>
        t.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Current selection data
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gathering records...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-slate-50 overflow-hidden">
            {/* Internal Staff Sidebar */}
            <div className="w-80 border-r border-gray-200 bg-white flex flex-col shrink-0">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 tracking-tight">Staff Folders</h2>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search folders..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <button
                        onClick={() => setSelectedTeacher(null)}
                        className={`w-full text-left p-4 rounded-2xl transition-all ${selectedTeacher === null ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'hover:bg-slate-50 text-slate-600'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${selectedTeacher === null ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                                Σ
                            </div>
                            <div>
                                <div className={`text-sm font-bold ${selectedTeacher === null ? 'text-white' : 'text-slate-800'}`}>System Root</div>
                                <div className={`text-[10px] uppercase tracking-widest font-bold ${selectedTeacher === null ? 'text-indigo-200' : 'text-slate-400'}`}>Overview</div>
                            </div>
                        </div>
                    </button>

                    <div className="h-4 border-b border-gray-50 mb-4 opacity-50"></div>

                    {filteredTeachers.map(teacher => (
                        <button
                            key={teacher}
                            onClick={() => setSelectedTeacher(teacher)}
                            className={`w-full text-left p-4 rounded-2xl transition-all group ${selectedTeacher === teacher ? 'bg-white border border-gray-100 shadow-md ring-4 ring-indigo-500/5' : 'hover:bg-slate-50 border border-transparent'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${selectedTeacher === teacher ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-600'}`}>
                                    {teacher.charAt(0)}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className={`text-sm font-bold truncate ${selectedTeacher === teacher ? 'text-indigo-600' : 'text-slate-700'}`}>{teacher}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Teacher folder</div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="bg-red-600 text-white px-6 py-3 text-[11px] font-bold flex justify-between items-center shrink-0 shadow-lg relative z-10">
                    <div className="flex items-center gap-4">
                        <span className="bg-white/20 px-2 py-0.5 rounded uppercase">Finance Tool</span>
                        <span className="tracking-widest opacity-80">{selectedTeacher || 'System Overview'}</span>
                    </div>
                    <div className="flex gap-4 items-center">
                        <span className="opacity-70 font-mono">Records: {data.salaries.length + data.fines.length}</span>
                        <button onClick={() => window.location.reload()} className="hover:bg-white/20 p-2 rounded-lg transition-all" title="Reload Sheet Data">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 lg:p-12">
                    <div className="max-w-6xl mx-auto space-y-10">
                        {selectedTeacher === null ? (
                            <div className="space-y-10">
                                <div className="py-6 border-b border-gray-100">
                                    <h1 className="text-5xl font-black text-slate-900 tracking-tight">Financial Hub</h1>
                                    <p className="text-slate-400 mt-2 font-medium text-lg uppercase tracking-widest">Consolidated Organization Totals</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" /></svg>
                                        </div>
                                        <div className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Gross Salary Volume</div>
                                        <div className="text-4xl font-black text-slate-900">{formatCurrency(totalSalaryAmount)}</div>
                                        <div className="mt-4 flex items-center gap-2 text-green-500 font-bold text-xs">
                                            <span>Active Monitoring</span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                                        <div className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Organization Fines</div>
                                        <div className="text-4xl font-black text-red-600">{formatCurrency(totalFinesAmount)}</div>
                                        <div className="mt-4 text-slate-400 font-bold text-xs uppercase italic drop-shadow-sm">System Reductions</div>
                                    </div>

                                    <div className="bg-indigo-600 p-8 rounded-[40px] shadow-2xl shadow-indigo-200 text-white relative overflow-hidden group">
                                        <div className="text-xs font-black text-indigo-200 uppercase tracking-[0.2em] mb-3">Net Distribution</div>
                                        <div className="text-4xl font-black">{formatCurrency(totalSalaryAmount - totalFinesAmount)}</div>
                                        <div className="mt-4 text-indigo-300 font-bold text-xs uppercase">Liquidity Position</div>
                                    </div>
                                </div>

                                {/* Debug Status Panel */}
                                <div className="bg-slate-900 p-10 rounded-[50px] text-white/90 shadow-2xl">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="font-black text-xs uppercase tracking-[0.3em] opacity-50 flex items-center gap-3">
                                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                            Core System Status
                                        </h3>
                                        <div className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-bold uppercase">LIVE SYNC</div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {(data?.debug?.sheets || []).map((s: any, i: number) => (
                                            <div key={i} className="bg-white/5 p-6 rounded-[30px] border border-white/5 flex items-center justify-between transition-all hover:bg-white/10">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-3 h-3 rounded-full blur-[2px] ${s.error ? 'bg-red-500 anima-pulse' : (s.salariesCount > 0 ? 'bg-green-400' : 'bg-yellow-400')}`}></div>
                                                    <div>
                                                        <div className="font-black text-[12px] uppercase tracking-wider">{s.title || 'Unknown Store'}</div>
                                                        <div className="text-[9px] opacity-30 font-mono tracking-tighter">REF_{s.id?.slice(-8).toUpperCase()}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {s.error ? (
                                                        <div className="text-red-400 text-[9px] font-black italic">{s.error}</div>
                                                    ) : (
                                                        <div className="text-white/40 font-mono text-[9px] space-y-0.5">
                                                            <div>TABS_{s.tabCount || 0}</div>
                                                            <div>RECS_{s.salariesCount || 0}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-10">
                                <div className="flex justify-between items-end border-b border-gray-100 pb-8">
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Secured folder</span>
                                            <span className="text-slate-500 text-[10px] font-bold font-mono">STAFF_{selectedTeacher.substring(0, 4).toUpperCase()}</span>
                                        </div>
                                        <h1 className="text-6xl font-black text-slate-900 tracking-tighter">{selectedTeacher}</h1>
                                        <p className="text-slate-400 mt-2 text-sm font-medium uppercase tracking-[0.2em]">Detailed Ledger Analytics</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-4">Financial Records</h3>
                                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
                                        <table className="w-full text-sm text-left border-collapse">
                                            <thead className="bg-slate-50/50 border-b border-gray-100">
                                                <tr>
                                                    <th className="px-8 py-6 font-black text-slate-400 uppercase tracking-widest text-[9px]">Period</th>
                                                    <th className="px-8 py-6 font-black text-slate-400 uppercase tracking-widest text-[9px] text-right">Base Income</th>
                                                    <th className="px-8 py-6 font-black text-slate-400 uppercase tracking-widest text-[9px] text-right">Incentives</th>
                                                    <th className="px-8 py-6 font-black text-slate-400 uppercase tracking-widest text-[9px] text-right">Deductions</th>
                                                    <th className="px-8 py-6 font-black text-slate-400 uppercase tracking-widest text-[9px] text-right">Recounts</th>
                                                    <th className="px-8 py-6 font-black text-slate-400 uppercase tracking-widest text-[9px] text-right">Execution Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {(teacherSalariesRaw || []).map((s, i) => {
                                                    const matchingFines = (teacherFines || []).filter(f =>
                                                        f.month.toLowerCase().includes(s.month.toLowerCase()) ||
                                                        s.month.toLowerCase().includes(f.month.toLowerCase())
                                                    );
                                                    return (
                                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                                            <td className="px-8 py-6 font-black text-slate-800 tracking-tight">{s.month || '-'}</td>
                                                            <td className="px-8 py-6 text-right tabular-nums text-slate-500 font-medium">{formatCurrency(parseCurrency(s.income))}</td>
                                                            <td className="px-8 py-6 text-right tabular-nums text-green-600 font-bold">+{formatCurrency(parseCurrency(s.bonus))}</td>
                                                            <td className="px-8 py-6 text-right tabular-nums text-red-600 font-bold whitespace-nowrap">
                                                                <div>-{formatCurrency(parseCurrency(s.fine))}</div>
                                                                {matchingFines.length > 0 && (
                                                                    <div className="text-[9px] text-red-400 mt-2 italic font-medium text-right opacity-60">
                                                                        {matchingFines.map(mf => mf.reason).join(', ')}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-8 py-6 text-right tabular-nums text-indigo-400 font-bold">{formatCurrency(parseCurrency(s.recount))}</td>
                                                            <td className="px-8 py-6 text-right tabular-nums font-black text-slate-900 bg-slate-50/30">{formatCurrency(parseCurrency(s.total))}</td>
                                                        </tr>
                                                    );
                                                })}
                                                {teacherSalariesRaw.length === 0 && (
                                                    <tr>
                                                        <td colSpan={6} className="px-8 py-20 text-center text-slate-300 font-bold italic uppercase tracking-widest text-[10px]">Vault Empty - No data detected</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                            {teacherSalariesRaw.length > 0 && (
                                                <tfoot className="bg-slate-900 text-white rounded-b-3xl">
                                                    <tr className="font-black uppercase italic">
                                                        <td className="px-8 py-6 text-[10px] tracking-[0.3em]">Aggregate</td>
                                                        <td className="px-8 py-6 text-right tabular-nums text-white/40 font-mono text-[10px]">{formatCurrency(teacherSalariesRaw.reduce((sum, s) => sum + parseCurrency(s.income), 0))}</td>
                                                        <td className="px-8 py-6 text-right tabular-nums text-green-400 text-[10px]">{formatCurrency(teacherSalariesRaw.reduce((sum, s) => sum + parseCurrency(s.bonus), 0))}</td>
                                                        <td className="px-8 py-6 text-right tabular-nums text-red-400 text-[10px]">{formatCurrency(teacherSalariesRaw.reduce((sum, s) => sum + parseCurrency(s.fine), 0))}</td>
                                                        <td className="px-8 py-6 text-right tabular-nums text-indigo-400 text-[10px]">{formatCurrency(teacherSalariesRaw.reduce((sum, s) => sum + parseCurrency(s.recount), 0))}</td>
                                                        <td className="px-8 py-6 text-right tabular-nums text-2xl font-black bg-white/10">{formatCurrency(teacherSalariesRaw.reduce((sum, s) => sum + parseCurrency(s.total), 0))}</td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-12">
                                    <div className="bg-indigo-600 p-10 rounded-[50px] text-white shadow-2xl shadow-indigo-100 min-w-[350px] relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                                        <div className="relative z-10">
                                            <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-2">Grand Distributed Total</div>
                                            <div className="text-5xl font-black tabular-nums tracking-tighter">
                                                {formatCurrency(teacherSalariesRaw.reduce((sum, s) => sum + parseCurrency(s.total), 0))}
                                            </div>
                                            <div className="h-2 w-16 bg-white/20 rounded-full mt-6 scale-x-100 group-hover:scale-x-150 transition-transform origin-left"></div>
                                        </div>
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
