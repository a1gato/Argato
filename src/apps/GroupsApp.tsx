import React, { useState } from 'react';
import { useCohorts, type Cohort, type ScheduleType } from '../context/CohortContext';
import { useUsers } from '../context/UsersContext';
import { useGroups } from '../context/GroupsContext';
import { CustomSelect } from '../components/CustomSelect';

export const GroupsApp: React.FC = () => {
    const { cohorts, addCohort, removeCohort, updateCohort } = useCohorts();
    const { users } = useUsers();
    const { groups, addGroup } = useGroups();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', teacherId: '', scheduleType: 'MWF' as ScheduleType, timeSlotId: '' });
    const [editingId, setEditingId] = useState<string | null>(null);

    const teachers = users.filter(u => u.role === 'teacher');
    const timeSlots = groups.filter(g => !g.parentId);

    const handleOpenModal = (cohort?: Cohort) => {
        if (cohort) {
            setFormData({
                name: cohort.name,
                description: cohort.description || '',
                teacherId: cohort.teacherId || '',
                scheduleType: cohort.scheduleType || 'MWF',
                timeSlotId: cohort.timeSlotId || ''
            });
            setEditingId(cohort.id);
        } else {
            setFormData({ name: '', description: '', teacherId: '', scheduleType: 'MWF', timeSlotId: '' });
            setEditingId(null);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name.trim()) {
            if (editingId) {
                updateCohort(editingId, formData.name, formData.description, formData.teacherId || undefined, formData.scheduleType, formData.timeSlotId || undefined);
            } else {
                addCohort(formData.name, formData.description, formData.teacherId || undefined, formData.scheduleType, formData.timeSlotId || undefined);
            }
            setIsModalOpen(false);
        }
    };

    return (
        <div className="p-8 h-full bg-slate-50 overflow-y-auto w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-light text-slate-900">Groups</h1>
                    <p className="text-slate-500 mt-1">Manage student cohorts and classes</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Group
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {cohorts.map(cohort => (
                    <div key={cohort.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center relative">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <div className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter ${(cohort.scheduleType || 'MWF') === 'MWF' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                    }`}>
                                    {cohort.scheduleType || 'MWF'}
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleOpenModal(cohort)}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 00 2 2h11a2 2 0 00 2-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this group?')) {
                                            removeCohort(cohort.id);
                                        }
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">{cohort.name}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-3">{cohort.description || 'No description'}</p>

                        {cohort.teacherId && (
                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                    {users.find(u => u.id === cohort.teacherId)?.firstName[0]}
                                </div>
                                <span className="text-xs text-slate-600 font-medium">
                                    {users.find(u => u.id === cohort.teacherId)?.firstName} {users.find(u => u.id === cohort.teacherId)?.lastName}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4">
                        <h3 className="text-xl font-semibold mb-6">{editingId ? 'Edit Group' : 'Add New Group'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Group Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:border-blue-500 transition-colors"
                                    placeholder="e.g. Grade 9"
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:border-blue-500 transition-colors min-h-[80px]"
                                    placeholder="Optional description..."
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <CustomSelect
                                    label="Schedule"
                                    value={formData.scheduleType}
                                    onChange={value => setFormData(prev => ({ ...prev, scheduleType: value as ScheduleType }))}
                                    options={[
                                        { label: 'Mon, Wed, Fri (MWF)', value: 'MWF' },
                                        { label: 'Tue, Thu, Sat (TTS)', value: 'TTS' },
                                        { label: 'Daily (Mon-Sat)', value: 'DAILY' }
                                    ]}
                                />
                                <CustomSelect
                                    label="Assign Teacher"
                                    value={formData.teacherId}
                                    onChange={value => setFormData(prev => ({ ...prev, teacherId: value }))}
                                    options={[
                                        { label: 'No Teacher Assigned', value: '' },
                                        ...teachers.map(t => ({ label: `${t.firstName} ${t.lastName}`, value: t.id }))
                                    ]}
                                />
                            </div>
                            <div>
                                <CustomSelect
                                    label="Time Slot"
                                    value={formData.timeSlotId}
                                    onChange={value => setFormData(prev => ({ ...prev, timeSlotId: value }))}
                                    onCreate={(name) => {
                                        const newId = addGroup(name, null);
                                        setFormData(prev => ({ ...prev, timeSlotId: newId }));
                                    }}
                                    options={[
                                        { label: 'Select a time slot...', value: '' },
                                        ...timeSlots.map(s => ({ label: s.name, value: s.id }))
                                    ]}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-slate-700 hover:bg-gray-50 font-medium transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-medium transition-colors">{editingId ? 'Save Changes' : 'Create Group'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
