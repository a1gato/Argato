import React, { useState } from 'react';
import { useUsers, type User } from '../context/UsersContext';
import { useSettings } from '../context/SettingsContext';
import { CustomSelect } from '../components/CustomSelect';

export const UsersApp: React.FC = () => {
    const { users, addUser, deleteUser } = useUsers();
    const { users: userSettings } = useSettings();
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<{
        firstName: string;
        lastName: string;
        employeeId: string;
        password: string;
        role: User['role'];
        telephone: string;
        email: string;
    }>({
        firstName: '',
        lastName: '',
        employeeId: '',
        password: '',
        role: 'employee',
        telephone: '',
        email: ''
    });

    const [errors, setErrors] = useState({
        firstName: '',
        lastName: '',
        employeeId: '',
        password: '',
        telephone: '',
        role: ''
    });

    const validateForm = () => {
        const newErrors = {
            firstName: '',
            lastName: '',
            employeeId: '',
            password: '',
            telephone: '',
            role: ''
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
        if (!formData.password.trim()) {
            newErrors.password = 'Password is required';
            isValid = false;
        }
        if (!formData.role) {
            newErrors.role = 'Role is required';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            await addUser({
                firstName: formData.firstName,
                lastName: formData.lastName,
                employeeId: formData.employeeId,
                password: formData.password,
                role: formData.role,
                telephone: formData.telephone,
                email: formData.email
            });
            setIsModalOpen(false);
            setFormData({ firstName: '', lastName: '', employeeId: '', password: '', role: userSettings.defaultRole as User['role'], telephone: '', email: '' });
            setErrors({ firstName: '', lastName: '', employeeId: '', password: '', telephone: '', role: '' });
        }
    };

    const handleOpenModal = () => {
        setFormData({
            firstName: '',
            lastName: '',
            employeeId: '',
            password: '',
            role: userSettings.defaultRole as User['role'],
            telephone: '',
            email: ''
        });
        setErrors({ firstName: '', lastName: '', employeeId: '', password: '', telephone: '', role: '' });
        setIsModalOpen(true);
    };

    // Filter out admins first, then apply search
    const filteredUsers = users
        .filter(user => user && user.role !== 'admin' && user.employeeId !== 'admin')
        .filter(user =>
            (user.firstName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
            (user.lastName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
            (user.employeeId || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
            (user.role || '').toLowerCase().includes((searchTerm || '').toLowerCase())
        );

    return (
        <div className="p-8 w-full h-full overflow-y-auto">
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-light text-slate-900">User Management</h1>
                        <p className="text-slate-500 mt-1">Manage system access and employee roles</p>
                    </div>
                    <button
                        onClick={handleOpenModal}
                        className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Employee
                    </button>
                </div>

                <div className="relative max-w-md">
                    <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search employees by name, ID or role..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Info</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <div className="text-sm">{searchTerm ? 'No matches found' : 'No users found'}</div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/5 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                        <div>{user.firstName} {user.lastName}</div>
                                        <div className="text-xs text-slate-400">ID: {user.employeeId}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        <div>{user.telephone}</div>
                                        {user.email && <div className="text-xs text-slate-400">{user.email}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                            user.role === 'teacher' ? 'bg-green-100 text-green-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit User"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 00 2 2h11a2 2 0 00 2-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        {user.role !== 'admin' && userSettings.allowDeletion && (
                                            <button
                                                onClick={() => deleteUser(user.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete User"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl">
                        <h2 className="text-xl font-light text-slate-900 mb-6">Add New Employee</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">First Name</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={e => {
                                            setFormData({ ...formData, firstName: e.target.value });
                                            if (errors.firstName) setErrors({ ...errors, firstName: '' });
                                        }}
                                        className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all outline-none ${errors.firstName ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-slate-900'}`}
                                        placeholder="John"
                                    />
                                    {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={e => {
                                            setFormData({ ...formData, lastName: e.target.value });
                                            if (errors.lastName) setErrors({ ...errors, lastName: '' });
                                        }}
                                        className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all outline-none ${errors.lastName ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-slate-900'}`}
                                        placeholder="Doe"
                                    />
                                    {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.telephone}
                                        onChange={e => {
                                            setFormData({ ...formData, telephone: e.target.value });
                                            if (errors.telephone) setErrors({ ...errors, telephone: '' });
                                        }}
                                        className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all outline-none ${errors.telephone ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-slate-900'}`}
                                        placeholder="555-0123"
                                    />
                                    {errors.telephone && <p className="text-xs text-red-500 mt-1">{errors.telephone}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email <span className="text-gray-400 lowercase font-normal">(optional)</span></label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 text-slate-900 placeholder:text-slate-300"
                                        placeholder="john@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Employee ID</label>
                                    <input
                                        type="text"
                                        value={formData.employeeId}
                                        onChange={e => {
                                            setFormData({ ...formData, employeeId: e.target.value });
                                            if (errors.employeeId) setErrors({ ...errors, employeeId: '' });
                                        }}
                                        className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all outline-none ${errors.employeeId ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-slate-900'}`}
                                        placeholder="1001"
                                    />
                                    {errors.employeeId && <p className="text-xs text-red-500 mt-1">{errors.employeeId}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                                    <input
                                        type="text"
                                        value={formData.password}
                                        onChange={e => {
                                            setFormData({ ...formData, password: e.target.value });
                                            if (errors.password) setErrors({ ...errors, password: '' });
                                        }}
                                        className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all outline-none ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-slate-900'}`}
                                        placeholder="secret123"
                                    />
                                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                                </div>
                            </div>

                            <div>
                                <CustomSelect
                                    label="Role"
                                    value={formData.role}
                                    onChange={(value) => {
                                        setFormData({ ...formData, role: value as any });
                                        if (errors.role) setErrors({ ...errors, role: '' });
                                    }}
                                    options={[
                                        { label: 'Employee', value: 'employee' },
                                        { label: 'Teacher', value: 'teacher' },
                                        { label: 'Admin', value: 'admin' }
                                    ]}
                                    className={errors.role ? 'border-red-500 focus:border-red-500' : ''}
                                />
                                {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
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
                                    className="flex-1 px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-medium transition-colors"
                                >
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
