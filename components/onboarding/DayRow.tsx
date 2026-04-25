
import React from 'react';

interface Interval {
    start: string;
    end: string;
}

interface DayRowProps {
    day: string;
    intervals: Interval[];
    onChange: (intervals: Interval[]) => void;
}

const DayRow: React.FC<DayRowProps> = ({ day, intervals, onChange }) => {
    const isOpen = intervals && intervals.length > 0;

    const toggleOpen = () => {
        if (isOpen) {
            onChange([]);
        } else {
            onChange([{ start: '08:00', end: '18:00' }]);
        }
    };

    const handleTimeChange = (index: number, field: 'start' | 'end', value: string) => {
        const newIntervals = [...intervals];
        newIntervals[index] = { ...newIntervals[index], [field]: value };
        onChange(newIntervals);
    };

    return (
        <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 group">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={toggleOpen}
                    className={`
                        w-12 h-6 rounded-full relative transition-all duration-300
                        ${isOpen ? 'bg-purple-600' : 'bg-slate-200 dark:bg-slate-700'}
                    `}
                >
                    <div className={`
                        absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300
                        ${isOpen ? 'left-7 shadow-sm' : 'left-1'}
                    `} />
                </button>
                <span className={`text-sm font-bold uppercase tracking-wider ${isOpen ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    {day}
                </span>
            </div>

            <div className="flex items-center gap-2">
                {isOpen ? (
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <input
                            type="time"
                            value={intervals[0]?.start}
                            onChange={(e) => handleTimeChange(0, 'start', e.target.value)}
                            className="bg-transparent text-xs font-bold text-purple-600 outline-none w-14"
                        />
                        <span className="text-slate-300 text-[10px]">até</span>
                        <input
                            type="time"
                            value={intervals[0]?.end}
                            onChange={(e) => handleTimeChange(0, 'end', e.target.value)}
                            className="bg-transparent text-xs font-bold text-purple-600 outline-none w-14"
                        />
                    </div>
                ) : (
                    <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        Fechado
                    </span>
                )}
            </div>
        </div>
    );
};

export default DayRow;
