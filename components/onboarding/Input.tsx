
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, error, icon, ...props }) => {
    return (
        <div className="w-full space-y-1.5">
            <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">
                {label}
            </label>
            <div className="relative group">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    {...props}
                    className={`
                        w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent
                        px-4 py-3 rounded-2xl text-sm font-medium transition-all outline-none
                        focus:bg-white dark:focus:bg-slate-800 focus:border-purple-500/20 focus:ring-4 focus:ring-purple-500/10
                        placeholder:text-slate-400 dark:placeholder:text-slate-600
                        ${icon ? 'pl-11' : ''}
                        ${error ? 'border-red-500/50 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10' : ''}
                        ${props.className || ''}
                    `}
                />
            </div>
            {error && <p className="text-[10px] font-bold text-red-500 ml-2 animate-fade-in">{error}</p>}
        </div>
    );
};

export default Input;
