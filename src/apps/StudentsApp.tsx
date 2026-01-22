import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useCohorts } from '../context/CohortContext';
import { useStudents } from '../context/StudentsContext';
import { CustomSelect } from '../components/CustomSelect';



export const StudentsApp: React.FC = () => {
    const { students: studentSettings } = useSettings();
    const { cohorts } = useCohorts();
    const { students, addStudent, removeStudent, bulkRemoveStudents } = useStudents();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

    // Fills form with default group if set
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

    const handleOpenModal = () => {
        setIsModalOpen(true);
        // Pre-fill group from settings if not 'None'
        const initialGroup = studentSettings.defaultGroup !== 'None' ? studentSettings.defaultGroup : (cohorts.length > 0 ? cohorts[0].name : '');
        setFormData({ name: '', surname: '', phone: '', parentPhone: '', group: initialGroup });
        setErrors({ name: '', surname: '', phone: '', parentPhone: '', group: '' });
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const validateForm = () => {
        const newErrors = {
            name: '',
            surname: '',
            phone: '',
            parentPhone: '',
            group: ''
        };
        let isValid = true;

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
            isValid = false;
        }
        if (!formData.surname.trim()) {
            newErrors.surname = 'Surname is required';
            isValid = false;
        }
        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
            isValid = false;
        }
        if (!formData.parentPhone.trim()) {
            newErrors.parentPhone = 'Parent phone is required';
            isValid = false;
        }
        if (!formData.group) {
            newErrors.group = 'Group is required';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            addStudent(formData);
            handleCloseModal();
        }
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedStudentIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedStudentIds(newSelected);
    };

    const toggleAll = () => {
        if (selectedStudentIds.size === students.length) {
            setSelectedStudentIds(new Set());
        } else {
            setSelectedStudentIds(new Set(students.map(s => s.id)));
        }
    };

    const handleBulkDelete = () => {
        const count = selectedStudentIds.size;
        if (window.confirm('Are you sure you want to delete ' + count + ' students?')) {
            bulkRemoveStudents(selectedStudentIds);
            setSelectedStudentIds(new Set());
        }
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.group.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.phone.includes(searchTerm)
    );

    return (
        <div className="p-8 w-full h-full overflow-y-auto text-slate-800 relative">
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-light text-slate-900">Students</h2>
                        <p className="text-slate-500 mt-1">Manage enrollments and student records</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {studentSettings.allowBulkActions && selectedStudentIds.size > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border border-red-100"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete ({selectedStudentIds.size})
                            </button>
                        )}
                        <button
                            onClick={handleOpenModal}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Student
                        </button>
                    </div>
                </div>

                <div className="relative max-w-md">
                    <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search students by name, group or phone..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                            {studentSettings.allowBulkActions && (
                                <th className="px-6 py-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        checked={filteredStudents.length > 0 && selectedStudentIds.size === filteredStudents.length}
                                        onChange={toggleAll}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                            )}
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Full Name</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Group</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Phone Number</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Parent's Phone</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredStudents.length === 0 ? (
                            <tr>
                                <td colSpan={studentSettings.allowBulkActions ? 7 : 6} className="px-6 py-12 text-center text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        <div className="text-sm">No students found</div>
                                        {searchTerm && <div className="text-xs text-slate-300">Try adjusting your search term</div>}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredStudents.map(student => (
                                <tr key={student.id} className={`hover:bg-gray-50/5 transition-colors ${selectedStudentIds.has(student.id) ? 'bg-blue-50/30' : ''} `}>
                                    {studentSettings.allowBulkActions && (
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedStudentIds.has(student.id)}
                                                onChange={() => toggleSelection(student.id)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                        {student.name} {student.surname}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{student.group}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{student.phone}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{student.parentPhone}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {student.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit Student"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 00 2 2h11a2 2 0 00 2-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to delete this student?')) {
                                                    removeStudent(student.id);
                                                }
                                            }}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Student"
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

            {/* Add Student Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4 animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-semibold text-slate-900">Add New Student</h3>
                                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                        <input
                                            type="text"
                                            className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} `}
                                            placeholder="John"
                                            value={formData.name}
                                            onChange={e => {
                                                setFormData({ ...formData, name: e.target.value });
                                                if (errors.name) setErrors({ ...errors, name: '' });
                                            }}
                                            autoFocus
                                        />
                                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Surname</label>
                                        <input
                                            type="text"
                                            className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all ${errors.surname ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} `}
                                            placeholder="Doe"
                                            value={formData.surname}
                                            onChange={e => {
                                                setFormData({ ...formData, surname: e.target.value });
                                                if (errors.surname) setErrors({ ...errors, surname: '' });
                                            }}
                                        />
                                        {errors.surname && <p className="text-xs text-red-500 mt-1">{errors.surname}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} `}
                                        placeholder="+1 234 567 890"
                                        value={formData.phone}
                                        onChange={e => {
                                            setFormData({ ...formData, phone: e.target.value });
                                            if (errors.phone) setErrors({ ...errors, phone: '' });
                                        }}
                                    />
                                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Parent's Phone Number</label>
                                    <input
                                        type="tel"
                                        className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all ${errors.parentPhone ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} `}
                                        placeholder="+1 234 567 890"
                                        value={formData.parentPhone}
                                        onChange={e => {
                                            setFormData({ ...formData, parentPhone: e.target.value });
                                            if (errors.parentPhone) setErrors({ ...errors, parentPhone: '' });
                                        }}
                                    />
                                    {errors.parentPhone && <p className="text-xs text-red-500 mt-1">{errors.parentPhone}</p>}
                                </div>

                                <div>
                                    <CustomSelect
                                        label="Group"
                                        value={formData.group}
                                        onChange={(value) => {
                                            setFormData({ ...formData, group: value });
                                            if (errors.group) setErrors({ ...errors, group: '' });
                                        }}
                                        options={[
                                            { label: 'Select a group', value: '' },
                                            ...cohorts.map(c => ({ label: c.name, value: c.name }))
                                        ]}
                                        className={errors.group ? 'border-red-500 focus:border-red-500' : ''}
                                    />
                                    {errors.group && <p className="text-xs text-red-500 mt-1">{errors.group}</p>}
                                </div>

                                <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 px-4 py-2.5 border border-gray-300 text-slate-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-sm transition-colors"
                                    >
                                        Add Student
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

