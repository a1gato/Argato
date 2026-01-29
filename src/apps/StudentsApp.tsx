import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useCohorts } from '../context/CohortContext';
import { useStudents, type Student } from '../context/StudentsContext';
import { CustomSelect } from '../components/CustomSelect';

export const StudentsApp: React.FC = () => {
    const { students: studentSettings } = useSettings();
    const { cohorts } = useCohorts();
    const { students, loading, refreshing, loadStudents, addStudent, updateStudent, removeStudent, bulkRemoveStudents } = useStudents();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        phone: '',
        parentPhone: '',
        group: ''
    });

    const [errors, setErrors] = useState({
        name: '',
        surname: '',
        phone: '',
        parentPhone: '',
        group: ''
    });


    const handleOpenModal = (student?: Student) => {
        if (student) {
            setEditingStudent(student);
            setFormData({
                name: student.name,
                surname: student.surname,
                phone: student.phone,
                parentPhone: student.parentPhone,
                group: student.group
            });
        } else {
            setEditingStudent(null);
            const initialGroup = studentSettings.defaultGroup !== 'None' ? studentSettings.defaultGroup : (cohorts.length > 0 ? (cohorts[0]?.name || '') : '');
            setFormData({ name: '', surname: '', phone: '', parentPhone: '', group: initialGroup });
        }
        setErrors({ name: '', surname: '', phone: '', parentPhone: '', group: '' });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingStudent(null);
    };

    const validateForm = () => {
        const newErrors = { name: '', surname: '', phone: '', parentPhone: '', group: '' };
        let isValid = true;

        if (!formData.name.trim()) { newErrors.name = 'Name is required'; isValid = false; }
        if (!formData.surname.trim()) { newErrors.surname = 'Surname is required'; isValid = false; }
        if (!formData.phone.trim()) { newErrors.phone = 'Phone number is required'; isValid = false; }
        if (!formData.parentPhone.trim()) { newErrors.parentPhone = 'Parent phone is required'; isValid = false; }
        if (!formData.group) { newErrors.group = 'Group is required'; isValid = false; }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                if (editingStudent) {
                    await updateStudent({ ...editingStudent, ...formData });
                } else {
                    await addStudent(formData);
                }
                handleCloseModal();
            } catch (err: any) {
                console.error('Submission Error:', err);
                let msg = 'An unexpected error occurred while saving.';
                if (err instanceof Error) msg = err.message;
                alert(`Error: ${msg}\n\nPlease try again.`);
            }
        }
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedStudentIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedStudentIds(newSelected);
    };

    const toggleAll = () => {
        if (selectedStudentIds.size === filteredStudents.length) {
            setSelectedStudentIds(new Set());
        } else {
            setSelectedStudentIds(new Set(filteredStudents.map(s => s.id)));
        }
    };

    const handleBulkDelete = async () => {
        const count = selectedStudentIds.size;
        if (window.confirm(`Are you sure you want to delete ${count} students?`)) {
            const studentsToDelete = students
                .filter(s => selectedStudentIds.has(s.id))
                .map(s => ({ id: s.id }));

            await bulkRemoveStudents(studentsToDelete);
            setSelectedStudentIds(new Set());
        }
    };

    const filteredStudents = students.filter(student =>
        (student.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        (student.surname || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        (student.group || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        (student.phone || '').includes(searchTerm || '')
    );

    if (loading && students.length === 0) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Loading students...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 w-full h-full overflow-y-auto bg-slate-50/50 relative">
            <div className="max-w-7xl mx-auto mb-4">
                <div className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-between shadow-lg shadow-blue-600/20">
                    <span>🚀 Build v1.1.2 - DEPLOYED</span>
                    <span className="opacity-70">Live Sync Enabled</span>
                </div>
            </div>
            <div className="flex flex-col gap-6 mb-8 max-w-7xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-4xl font-light text-slate-900 tracking-tight">Student Directory</h2>
                        <p className="text-slate-500 mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            {students.length} active enrollments across all centers
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => loadStudents()}
                            disabled={refreshing}
                            className={`p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Refresh Data"
                        >
                            <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>

                        {studentSettings.allowBulkActions && selectedStudentIds.size > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 border border-rose-100 shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Selected ({selectedStudentIds.size})
                            </button>
                        )}
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 active:scale-95"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Enroll New Student
                        </button>
                    </div>
                </div>

                <div className="relative max-w-xl group">
                    <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search students by name, group, or phone..."
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-500 transition-all text-[15px] shadow-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Students Table */}
            <div className="max-w-7xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden mb-12">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/30">
                                {studentSettings.allowBulkActions && (
                                    <th className="px-6 py-5 w-14 text-center">
                                        <input
                                            type="checkbox"
                                            checked={filteredStudents.length > 0 && selectedStudentIds.size === filteredStudents.length}
                                            onChange={toggleAll}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </th>
                                )}
                                <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Student Identity</th>
                                <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Group / Cohort</th>
                                <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Contact Details</th>
                                <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                                <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={studentSettings.allowBulkActions ? 6 : 5} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-2">
                                                <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                            </div>
                                            <div className="text-slate-900 font-semibold">No students found</div>
                                            <p className="text-sm text-slate-400">No results found matching your search criteria. Try a different name or group.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map(student => (
                                    <tr key={student.id} className={`group hover:bg-slate-50/80 transition-all duration-200 ${selectedStudentIds.has(student.id) ? 'bg-blue-50/40' : ''} `}>
                                        {studentSettings.allowBulkActions && (
                                            <td className="px-6 py-5 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStudentIds.has(student.id)}
                                                    onChange={() => toggleSelection(student.id)}
                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td>
                                        )}
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-600 font-bold text-sm border border-blue-100/50">
                                                    {student?.name?.[0] || ''}{student?.surname?.[0] || '' || '?'}
                                                </div>
                                                <div>
                                                    <div className="text-[15px] font-semibold text-slate-900 leading-tight">
                                                        {student.name} {student.surname}
                                                    </div>
                                                    <div className="text-[13px] text-slate-400 mt-0.5">ID: {student.id.slice(0, 8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[13px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                {student.group}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[13px] text-slate-600">
                                                    <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    {student.phone}
                                                </div>
                                                <div className="flex items-center gap-2 text-[12px] text-slate-400">
                                                    <span className="font-medium text-[10px] uppercase text-slate-300 tracking-tighter">Parent:</span>
                                                    {student.parentPhone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${student.status === 'Active'
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                }`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenModal(student)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                    title="Edit Record"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 00 2 2h11a2 2 0 00 2-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Are you sure you want to delete this student record?')) {
                                                            removeStudent(student.id);
                                                        }
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                    title="Permanently Delete"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Diagnostics Footer */}
            <div className="max-w-7xl mx-auto mt-8 flex items-center justify-between text-[11px] text-slate-400 font-medium uppercase tracking-widest px-4 border-t border-slate-100 pt-6 pb-12">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        Local Storage Active
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span>Build v1.1.3 • STABLE</span>
                </div>
            </div>

            {/* Add/Edit Student Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg p-8 m-4 animate-in fade-in zoom-in slide-in-from-bottom-8 duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">{editingStudent ? 'Edit Student' : 'Enroll New Student'}</h3>
                                <p className="text-slate-500 text-sm mt-1">Please provide the student's enrollment details below.</p>
                            </div>
                            <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-700 mb-2 uppercase tracking-tight">First Name</label>
                                    <input
                                        type="text"
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:bg-white outline-none transition-all text-slate-900 ${errors.name ? 'border-rose-500' : 'border-slate-100 focus:border-blue-500'} `}
                                        placeholder="Enter first name"
                                        value={formData.name}
                                        onChange={e => {
                                            setFormData({ ...formData, name: e.target.value });
                                            if (errors.name) setErrors({ ...errors, name: '' });
                                        }}
                                        autoFocus
                                    />
                                    {errors.name && <p className="text-[11px] font-medium text-rose-500 mt-1.5 ml-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-700 mb-2 uppercase tracking-tight">Last Name</label>
                                    <input
                                        type="text"
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:bg-white outline-none transition-all text-slate-900 ${errors.surname ? 'border-rose-500' : 'border-slate-100 focus:border-blue-500'} `}
                                        placeholder="Enter last name"
                                        value={formData.surname}
                                        onChange={e => {
                                            setFormData({ ...formData, surname: e.target.value });
                                            if (errors.surname) setErrors({ ...errors, surname: '' });
                                        }}
                                    />
                                    {errors.surname && <p className="text-[11px] font-medium text-rose-500 mt-1.5 ml-1">{errors.surname}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-700 mb-2 uppercase tracking-tight">Student Phone</label>
                                    <input
                                        type="tel"
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:bg-white outline-none transition-all ${errors.phone ? 'border-rose-500' : 'border-slate-100 focus:border-blue-500'} `}
                                        placeholder="+998 -- --- -- --"
                                        value={formData.phone}
                                        onChange={e => {
                                            setFormData({ ...formData, phone: e.target.value });
                                            if (errors.phone) setErrors({ ...errors, phone: '' });
                                        }}
                                    />
                                    {errors.phone && <p className="text-[11px] font-medium text-rose-500 mt-1.5 ml-1">{errors.phone}</p>}
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-700 mb-2 uppercase tracking-tight">Parent Phone</label>
                                    <input
                                        type="tel"
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:bg-white outline-none transition-all ${errors.parentPhone ? 'border-rose-500' : 'border-slate-100 focus:border-blue-500'} `}
                                        placeholder="+998 -- --- -- --"
                                        value={formData.parentPhone}
                                        onChange={e => {
                                            setFormData({ ...formData, parentPhone: e.target.value });
                                            if (errors.parentPhone) setErrors({ ...errors, parentPhone: '' });
                                        }}
                                    />
                                    {errors.parentPhone && <p className="text-[11px] font-medium text-rose-500 mt-1.5 ml-1">{errors.parentPhone}</p>}
                                </div>
                            </div>

                            <div>
                                <CustomSelect
                                    label="Assigned Group / Cohort"
                                    value={formData.group}
                                    onChange={(value) => {
                                        setFormData({ ...formData, group: value });
                                        if (errors.group) setErrors({ ...errors, group: '' });
                                    }}
                                    options={[
                                        { label: 'Select a group', value: '' },
                                        ...cohorts.map(c => ({ label: c.name, value: c.name }))
                                    ]}
                                    className={errors.group ? 'border-rose-500' : ''}
                                />
                                {errors.group && <p className="text-[11px] font-medium text-rose-500 mt-1.5 ml-1">{errors.group}</p>}
                            </div>

                            <div className="flex gap-4 mt-10">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-6 py-4 border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
                                >
                                    {editingStudent ? 'Save Changes' : 'Confirm Enrollment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
