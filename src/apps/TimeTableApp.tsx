import React, { useState, useEffect } from 'react';
import { useGroups } from '../context/GroupsContext';
import { useStudents } from '../context/StudentsContext';
import { useCohorts, type Cohort } from '../context/CohortContext';
import { useUsers } from '../context/UsersContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Helper to parse time strings like "14:00", "2:00 PM", "9am" into comparable minutes from midnight
const parseTime = (timeStr: string | undefined | null): number => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const cleanStr = (timeStr || '').toLowerCase().replace(/\s/g, '');
    let hours = 0;
    let minutes = 0;

    // Try to match "14:00" or "14:30" pattern
    const timeMatch = cleanStr.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
        hours = parseInt(timeMatch[1]);
        minutes = parseInt(timeMatch[2]);
    } else {
        // Try to match simple "9am" or "2pm" pattern
        const simpleMatch = cleanStr.match(/(\d{1,2})([ap]m)?/);
        if (simpleMatch) {
            hours = parseInt(simpleMatch[1]);
        }
    }

    // Adjust for AM/PM
    if (cleanStr.includes('pm') && hours < 12) hours += 12;
    if (cleanStr.includes('am') && hours === 12) hours = 0;

    return hours * 60 + minutes;
};

const GridCell = ({ cohorts, users, studentCountMap, isActiveTime }: {
    cohorts: Cohort[],
    users: any[],
    studentCountMap: Record<string, number>,
    isActiveTime?: boolean
}) => {
    return (
        <div className={`min-h-[120px] p-2 border-r border-b border-slate-100 last:border-r-0 transition-all duration-500
            ${isActiveTime ? 'bg-blue-50/50 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]' : 'hover:bg-white/60'}
        `}>
            <div className="flex flex-col gap-2 h-full">
                {cohorts.length === 0 ? (
                    <div className="h-full flex items-center justify-center py-8 opacity-50">
                        {isActiveTime && (
                            <div className="flex flex-col items-center gap-1 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                <span className="text-[9px] text-blue-400 font-medium">Free Slot</span>
                            </div>
                        )}
                        {!isActiveTime && <span className="text-[10px] text-slate-300 italic">Empty</span>}
                    </div>
                ) : (
                    cohorts.map(cohort => {
                        const teacher = users.find(u => u.id === cohort.teacherId);
                        const studentsCount = studentCountMap[cohort.name] || 0;

                        return (
                            <div key={cohort.id} className={`p-3 rounded-xl border transition-all duration-300 group relative overflow-hidden
                                ${isActiveTime
                                    ? 'bg-white border-blue-200 shadow-md shadow-blue-100 scale-[1.02] ring-1 ring-blue-100'
                                    : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200'
                                }
                            `}>
                                {isActiveTime && (
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4"></div>
                                )}
                                <div className="flex justify-between items-start mb-1.5 relative z-10">
                                    <h4 className="font-bold text-slate-800 text-[11px] leading-tight">{cohort.name}</h4>
                                    <div className={`px-1.5 py-0.5 rounded-[4px] text-[7px] font-black uppercase tracking-wider ${cohort.scheduleType === 'MWF' ? 'bg-emerald-100 text-emerald-700' :
                                        cohort.scheduleType === 'TTS' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                                        }`}>
                                        {cohort.scheduleType || 'MWF'}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5 relative z-10">
                                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                                        <div className="flex items-center gap-0.5">
                                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            {studentsCount}
                                        </div>
                                    </div>
                                    {teacher && (
                                        <div className="flex items-center gap-1.5 text-[9px] text-slate-700 font-medium pt-1 border-t border-slate-50">
                                            <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[8px] font-bold">
                                                {teacher?.firstName?.[0] || '?'}
                                            </div>
                                            <span className="truncate">{teacher.firstName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export const TimeTableApp: React.FC = () => {
    const { groups, addGroup } = useGroups();
    const { students } = useStudents();
    const { cohorts } = useCohorts();
    const { users } = useUsers();

    // UI State
    const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
    const [newSlotName, setNewSlotName] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Get sorted time slots
    const timeSlots = groups
        .filter(g => g && g.name && !g.parentId)
        .sort((a, b) => {
            if (!a || !b) return 0;
            return parseTime(a.name) - parseTime(b.name);
        });

    // Map student counts
    const studentCountMap = students.reduce((acc, s) => {
        acc[s.group] = (acc[s.group] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Helper to check if a cohort should appear on a specific day
    const isCohortOnDay = (cohort: Cohort, day: string) => {
        const type = cohort.scheduleType || 'MWF';
        if (type === 'DAILY') return day !== 'Sunday';
        if (type === 'MWF') return ['Monday', 'Wednesday', 'Friday'].includes(day);
        if (type === 'TTS') return ['Tuesday', 'Thursday', 'Saturday'].includes(day);
        return false;
    };

    const handleAddSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newSlotName.trim()) {
            await addGroup(newSlotName.trim(), null);
            setNewSlotName('');
            setIsSlotModalOpen(false);
        }
    };

    const currentDayName = DAYS[currentTime.getDay() === 0 ? 6 : currentTime.getDay() - 1]; // Adjust JS Sunday=0 to our array
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

    return (
        <div className="p-8 w-full h-full flex flex-col bg-slate-50 overflow-hidden">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div>
                    <h2 className="text-3xl font-light text-slate-900">Weekly Schedule</h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Today is <span className="font-bold text-blue-600">{currentDayName}</span>, {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <button
                    onClick={() => setIsSlotModalOpen(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg flex items-center gap-2"
                >
                    <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    New Time Slot
                </button>
            </div>

            {/* Calendar Grid Container */}
            <div className="flex-1 overflow-auto bg-white rounded-2xl shadow-sm border border-slate-200 relative">
                <div className="min-w-[1000px]">
                    {/* Header Row */}
                    <div className="grid grid-cols-[120px_repeat(7,1fr)] bg-slate-50 border-b border-slate-200 sticky top-0 z-20">
                        <div className="p-4 border-r border-slate-200 flex items-center justify-center bg-slate-50">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time</span>
                        </div>
                        {DAYS.map(day => {
                            const isToday = day === currentDayName;
                            return (
                                <div key={day} className={`p-4 border-r border-slate-200 last:border-r-0 flex flex-col items-center justify-center gap-1 transition-colors
                                    ${isToday ? 'bg-blue-50/60' : 'bg-slate-50'}
                                `}>
                                    <span className={`text-[12px] font-bold ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                                        {day}
                                    </span>
                                    {isToday && (
                                        <span className="text-[8px] font-black uppercase text-blue-400 tracking-wider animate-pulse">
                                            Today
                                        </span>
                                    )}
                                    {!isToday && (day === 'Saturday' || day === 'Sunday' ? (
                                        <span className="text-[8px] font-black uppercase text-rose-300 tracking-tighter">Weekend</span>
                                    ) : (
                                        <span className="text-[8px] font-black uppercase text-slate-300 tracking-tighter">Weekday</span>
                                    ))}
                                </div>
                            );
                        })}
                    </div>

                    {/* Time Slot Rows */}
                    {timeSlots.length === 0 ? (
                        <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-slate-400 font-medium">No time slots yet</h3>
                                <p className="text-slate-300 text-xs mt-1">Start by adding a time slot like "14:00" or "09:00 AM"</p>
                            </div>
                        </div>
                    ) : (
                        timeSlots.map(slot => {
                            const slotTime = parseTime(slot.name);
                            // Simple active check: if current time is within 90 minutes (standard class) of slot start
                            const isSlotActive = Math.abs(currentMinutes - slotTime) < 90 && (currentMinutes >= slotTime);

                            return (
                                <div key={slot.id} className="grid grid-cols-[120px_repeat(7,1fr)] border-b border-slate-50 last:border-b-0 group/row">
                                    {/* Time Column */}
                                    <div className="p-4 bg-slate-50/30 border-r border-slate-200 flex items-center justify-center relative">
                                        <span className="text-sm font-medium text-slate-600 group-hover/row:text-slate-900 transition-colors">
                                            {slot.name}
                                        </span>
                                        {isSlotActive && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r"></div>
                                        )}
                                    </div>

                                    {/* Days Columns */}
                                    {DAYS.map(day => {
                                        const cohortsInCell = cohorts.filter(c =>
                                            c.timeSlotId === slot.id && isCohortOnDay(c, day)
                                        );
                                        const isToday = day === currentDayName;
                                        const isCellActive = isToday && isSlotActive;

                                        return (
                                            <div key={day} className={`
                                                ${isToday ? 'bg-blue-50/10' : ''} 
                                                ${isCellActive ? 'bg-blue-50/30' : ''}
                                            `}>
                                                <GridCell
                                                    cohorts={cohortsInCell}
                                                    users={users}
                                                    studentCountMap={studentCountMap}
                                                    isActiveTime={isCellActive}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Slot Modal */}
            {isSlotModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[110] p-4 text-slate-800">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                <svg className="w-6 h-6 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">Add Time Slot</h3>
                        </div>

                        <form onSubmit={handleAddSlot} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Define Time (e.g. 14:00 - 15:30)</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-5 py-4 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all bg-slate-50 text-slate-900 font-medium placeholder:text-slate-300 shadow-inner"
                                    placeholder="Enter time..."
                                    value={newSlotName}
                                    onChange={e => setNewSlotName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsSlotModalOpen(false)}
                                    className="flex-1 py-4 border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 font-bold transition-all shadow-lg hover:shadow-xl translate-y-0 active:translate-y-1"
                                >
                                    Create Slot
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
