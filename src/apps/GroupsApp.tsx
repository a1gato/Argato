import React, { useState } from 'react'; // Deployment trigger v1.1.0
import { useCohorts, type Cohort, type ScheduleType } from '../context/CohortContext';
import { useUsers } from '../context/UsersContext';
import { useGroups } from '../context/GroupsContext';
import { CustomSelect } from '../components/CustomSelect';

export const GroupsApp: React.FC = () => {
    const { cohorts, loading, refreshing, loadCohorts, addCohort, removeCohort, updateCohort } = useCohorts();
    const { users } = useUsers();
    const { groups, addGroup } = useGroups();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', teacherId: '', scheduleType: 'MWF' as ScheduleType, timeSlotId: '' });
    const [editingId, setEditingId] = useState<string | null>(null);

    const teachers = (users || []).filter(u => u && u.role === 'teacher');
    const timeSlots = (groups || []).filter(g => g && !g.parentId);

    const handleOpenModal = (cohort?: Cohort) => {
        if (cohort) {
            setFormData({
                name: cohort.name,
                teacherId: cohort.teacherId || '',
                scheduleType: cohort.scheduleType || 'MWF',
                timeSlotId: cohort.timeSlotId || ''
            });
            setEditingId(cohort.id);
        } else {
            setFormData({ name: '', teacherId: '', scheduleType: 'MWF', timeSlotId: '' });
            setEditingId(null);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name.trim()) {
            try {
                if (editingId) {
                    await updateCohort(editingId, formData.name, '', formData.teacherId || undefined, formData.scheduleType, formData.timeSlotId || undefined);
                } else {
                    await addCohort(formData.name, '', formData.teacherId || undefined, formData.scheduleType, formData.timeSlotId || undefined);
                }
                setIsModalOpen(false);
            } catch (err) {
                alert('Failed to save group. Please try again.');
            }
        }
    };

    if (loading && cohorts.length === 0) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Loading groups...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 h-full bg-slate-50/50 overflow-y-auto w-full relative">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-4xl font-light text-slate-900 tracking-tight">Academic Groups</h1>
                        <p className="text-slate-500 mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            {cohorts.length} Active cohorts in rotation
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => loadCohorts()}
                            disabled={refreshing}
                            className={`p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Refresh Data"
                        >
                            <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-black/10 flex items-center gap-2 active:scale-95"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create New Group
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {cohorts.map(cohort => {
                        const teacher = users.find(u => u.id === cohort.teacherId);
                        const timeSlot = timeSlots.find(s => s.id === cohort.timeSlotId);

                        return (
                            <div key={cohort.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-300/50 transition-all duration-300 group relative flex flex-col">
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-inner
                                        ${cohort.scheduleType === 'MWF' ? 'bg-indigo-50 text-indigo-600' :
                                            cohort.scheduleType === 'TTS' ? 'bg-amber-50 text-amber-600' :
                                                'bg-rose-50 text-rose-600'}`}>
                                        {cohort.name?.[0] || '?'}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                        <button
                                            onClick={() => handleOpenModal(cohort)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 00 2 2h11a2 2 0 00 2-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Eliminate this group from the active roster?')) {
                                                    removeCohort(cohort.id);
                                                }
                                            }}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-[22px] font-bold text-slate-900 leading-tight mb-2">{cohort.name}</h3>


                                <div className="space-y-4 pt-6 border-t border-slate-50">
                                    <div className="flex items-center justify-between text-[13px]">
                                        <span className="text-slate-400 font-medium uppercase tracking-wider">Schedule</span>
                                        <span className={`font-bold px-2 py-0.5 rounded-lg border ${cohort.scheduleType === 'MWF' ? 'bg-indigo-50/50 text-indigo-700 border-indigo-100' :
                                            cohort.scheduleType === 'TTS' ? 'bg-amber-50/50 text-amber-700 border-amber-100' :
                                                'bg-rose-50/50 text-rose-700 border-rose-100'
                                            }`}>
                                            {cohort.scheduleType === 'DAILY' ? 'Mon - Sat' : cohort.scheduleType}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-[13px]">
                                        <span className="text-slate-400 font-medium uppercase tracking-wider">Time Slot</span>
                                        <span className="text-slate-900 font-bold">{timeSlot?.name || 'Unassigned'}</span>
                                    </div>

                                    <div className="flex items-center gap-3 mt-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                            {teacher?.firstName?.[0] || '?'}
                                        </div>
                                        <div>
                                            <div className="text-[13px] font-bold text-slate-800 leading-none">
                                                {teacher ? `${teacher.firstName} ${teacher.lastName}` : 'TBA'}
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-1 uppercase tracking-tighter">Academic Lead</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Premium Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl p-10 m-4 animate-in fade-in zoom-in slide-in-from-bottom-12 duration-500">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-3xl font-bold text-slate-900">{editingId ? 'Refine Group' : 'New Academic Group'}</h3>
                                <p className="text-slate-500 text-[15px] mt-2">Configure the schedule and academic lead for this cohort.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-400 mb-2 uppercase tracking-widest pl-1">Name of the Group</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-500 transition-all text-lg font-medium text-slate-900"
                                        placeholder="e.g. Advanced Mathematics"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <CustomSelect
                                        label="Academic Cycle"
                                        value={formData.scheduleType}
                                        onChange={value => setFormData({ ...formData, scheduleType: value as ScheduleType })}
                                        options={[
                                            { label: 'Mon, Wed, Fri', value: 'MWF' },
                                            { label: 'Tue, Thu, Sat', value: 'TTS' },
                                            { label: 'Daily Session', value: 'DAILY' }
                                        ]}
                                    />
                                    <CustomSelect
                                        label="Academic Lead"
                                        value={formData.teacherId}
                                        onChange={value => setFormData({ ...formData, teacherId: value })}
                                        options={[
                                            { label: 'To Be Assigned', value: '' },
                                            ...teachers.map(t => ({ label: `${t.firstName || ''} ${t.lastName || ''}`.trim() || 'Unnamed Teacher', value: t.id }))
                                        ]}
                                    />
                                </div>
                                <div>
                                    <CustomSelect
                                        label="Strategic Time Slot"
                                        value={formData.timeSlotId}
                                        onChange={value => setFormData({ ...formData, timeSlotId: value })}
                                        onCreate={(name) => {
                                            const newId = addGroup(name, null);
                                            setFormData({ ...formData, timeSlotId: newId });
                                        }}
                                        options={[
                                            { label: 'Select chronos slot...', value: '' },
                                            ...timeSlots.map(s => ({ label: s.name || 'Unnamed Slot', value: s.id }))
                                        ]}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 border border-slate-200 rounded-[24px] text-slate-600 hover:bg-slate-50 font-bold transition-all">Dismiss</button>
                                <button type="submit" className="flex-1 py-5 bg-slate-900 text-white rounded-[24px] hover:bg-black font-bold shadow-xl shadow-black/10 transition-all active:scale-[0.98]">
                                    {editingId ? 'Update Cohort' : 'Launch Group'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
