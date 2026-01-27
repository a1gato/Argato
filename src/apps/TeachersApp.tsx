import React, { useState } from 'react';
import { useUsers, type User } from '../context/UsersContext';

export const TeachersApp: React.FC = () => {
    const { users, addUser, deleteUser, updateUser } = useUsers();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<User | null>(null);

    const [activeTab, setActiveTab] = useState<'details' | 'fines' | 'salary'>('details');
    const [sheetData, setSheetData] = useState<{ fines: import('../services/sheetsService').Fine[], salaries: import('../services/sheetsService').Salary[] }>({ fines: [], salaries: [] });

    React.useEffect(() => {
        // Load sheet data on mount
        import('../services/sheetsService').then(({ fetchSheetData }) => {
            fetchSheetData().then(data => setSheetData(data));
        });
    }, []);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        employeeId: '',
        password: '',
        telephone: '',
        email: ''
    });

    const [errors, setErrors] = useState({
        firstName: '',
        lastName: '',
        employeeId: '',
        password: '',
        telephone: ''
    });

    const teachers = users.filter(user => user.role === 'teacher');

    const validateForm = () => {
        const newErrors = {
            firstName: '',
            lastName: '',
            employeeId: '',
            password: '',
            telephone: ''
        };
        let isValid = true;

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
            isValid = false;
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
            isValid = false;
        }
        if (!formData.telephone.trim()) {
            newErrors.telephone = 'Phone is required';
            isValid = false;
        }
        if (!formData.employeeId.trim()) {
            newErrors.employeeId = 'Employee ID is required';
            isValid = false;
        }
        if (!editingTeacher && !formData.password.trim()) {
            newErrors.password = 'Password is required';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleOpenModal = (teacher?: User) => {
        setActiveTab('details');
        if (teacher) {
            setEditingTeacher(teacher);
            setFormData({
                firstName: teacher.firstName,
                lastName: teacher.lastName,
                employeeId: teacher.employeeId,
                password: '', // Don't show password
                telephone: teacher.telephone,
                email: teacher.email || ''
            });
        } else {
            setEditingTeacher(null);
            setFormData({
                firstName: '',
                lastName: '',
                employeeId: '',
                password: '',
                telephone: '',
                email: ''
            });
        }
        setErrors({ firstName: '', lastName: '', employeeId: '', password: '', telephone: '' });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            if (editingTeacher) {
                const updates: Partial<User> = {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    employeeId: formData.employeeId,
                    telephone: formData.telephone,
                    email: formData.email
                };
                if (formData.password.trim()) {
                    updates.password = formData.password;
                }
                await updateUser(editingTeacher.id, updates);
            } else {
                await addUser({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    employeeId: formData.employeeId,
                    password: formData.password,
                    role: 'teacher',
                    telephone: formData.telephone,
                    email: formData.email
                });
            }
            setIsModalOpen(false);
        }
    };

    const filteredTeachers = teachers.filter(t =>
        `${t.firstName} ${t.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter fines for the current teacher
    const teacherFines = editingTeacher
        ? sheetData.fines.filter(f => {
            const fullName = `${editingTeacher.firstName} ${editingTeacher.lastName}`.toLowerCase();
            return f.teacherName.toLowerCase().includes(fullName) || fullName.includes(f.teacherName.toLowerCase());
        })
        : [];

    return (
        <div className="p-8 w-full h-full overflow-y-auto">
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-light text-slate-900">Teachers</h1>
                        <p className="text-slate-500 mt-1">Manage educational staff and instructors</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Teacher
                    </button>
                </div>

                <div className="relative max-w-md">
                    <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search teachers by name or ID..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Teacher</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredTeachers.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14l9-5-9-5-9 5 9 5z" />
                                        </svg>
                                        <div className="text-sm">No teachers found</div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredTeachers.map((teacher) => (
                                <tr key={teacher.id} className="hover:bg-gray-50/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-medium">
                                                {teacher?.firstName?.[0] || ''}{teacher?.lastName?.[0] || '' || '?'}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-slate-900">{teacher.firstName} {teacher.lastName}</div>
                                                <div className="text-xs text-slate-500">Instructor</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-600">{teacher.telephone}</div>
                                        <div className="text-xs text-slate-400">{teacher.email || 'No email'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {teacher.employeeId}
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => handleOpenModal(teacher)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 00 2 2h11a2 2 0 00 2-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('Are you sure you want to remove this teacher?')) {
                                                    await deleteUser(teacher.id);
                                                }
                                            }}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-light text-slate-900">{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h2>
                            {editingTeacher && (
                                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setActiveTab('details')}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'details' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Details
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('fines')}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'fines' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Fines
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('salary')}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'salary' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Salary
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {activeTab === 'details' ? (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">First Name</label>
                                            <input
                                                type="text"
                                                value={formData.firstName}
                                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                                className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-slate-900 ${errors.firstName ? 'border-red-500' : 'border-gray-200'}`}
                                                placeholder="Jane"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Last Name</label>
                                            <input
                                                type="text"
                                                value={formData.lastName}
                                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                                className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-slate-900 ${errors.lastName ? 'border-red-500' : 'border-gray-200'}`}
                                                placeholder="Smith"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Phone</label>
                                            <input
                                                type="tel"
                                                value={formData.telephone}
                                                onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                                                className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none ${errors.telephone ? 'border-red-500' : 'border-gray-200'}`}
                                                placeholder="555-0199"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                                placeholder="jane.smith@school.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Teacher ID</label>
                                            <input
                                                type="text"
                                                value={formData.employeeId}
                                                onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                                                className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none ${errors.employeeId ? 'border-red-500' : 'border-gray-200'}`}
                                                placeholder="TCH-001"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Password {editingTeacher && <span className="text-gray-400 lowercase font-normal">(leave blank to keep)</span>}</label>
                                            <input
                                                type="text"
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none ${errors.password ? 'border-red-500' : 'border-gray-200'}`}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4 border-t border-gray-100 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50 font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium transition-colors"
                                        >
                                            {editingTeacher ? 'Update Teacher' : 'Create Teacher'}
                                        </button>
                                    </div>
                                </form>
                            ) : activeTab === 'fines' ? (
                                <div className="space-y-4">
                                    {teacherFines.length === 0 ? (
                                        <div className="text-center py-12 text-slate-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            <p>No fines found for this teacher.</p>
                                        </div>
                                    ) : (
                                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50 border-b border-gray-100">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
                                                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Reason</th>
                                                        <th className="px-4 py-3 text-right font-semibold text-slate-600">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {teacherFines.map((fine, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50/50">
                                                            <td className="px-4 py-3 text-slate-600">{fine.date}</td>
                                                            <td className="px-4 py-3 text-slate-900">{fine.reason}</td>
                                                            <td className="px-4 py-3 text-right text-red-600 font-medium">-{fine.amount}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-xl text-sm mb-4">
                                        Showing Salary Data (Master View)
                                    </div>
                                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 border-b border-gray-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Month</th>
                                                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Income</th>
                                                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Bonus</th>
                                                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Fine</th>
                                                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {sheetData.salaries.map((s, idx) => {
                                                    const parseCurr = (v: string) => {
                                                        if (!v) return 0;
                                                        const clean = v.replace(/[$,\s]/g, '');
                                                        const num = parseFloat(clean);
                                                        return isNaN(num) ? 0 : num;
                                                    };
                                                    const formatCurr = (v: number) => {
                                                        return new Intl.NumberFormat('en-US', {
                                                            style: 'decimal',
                                                            minimumFractionDigits: 0,
                                                            maximumFractionDigits: 0
                                                        }).format(v) + ' UZS';
                                                    };

                                                    return (
                                                        <tr key={idx} className="hover:bg-gray-50/50">
                                                            <td className="px-4 py-3 text-slate-900 font-bold">{s.month || '-'}</td>
                                                            <td className="px-4 py-3 text-left text-slate-500 text-[10px] font-medium uppercase">{s.teacherName}</td>
                                                            <td className="px-4 py-3 text-right text-slate-600">{formatCurr(parseCurr(s.income))}</td>
                                                            <td className="px-4 py-3 text-right text-green-600">+{formatCurr(parseCurr(s.bonus))}</td>
                                                            <td className="px-4 py-3 text-right text-red-600">-{formatCurr(parseCurr(s.fine))}</td>
                                                            <td className="px-4 py-3 text-right text-indigo-600 font-bold bg-slate-50/30">{formatCurr(parseCurr(s.total))}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                        {activeTab !== 'details' && (
                            <div className="p-4 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

