
import React from 'react';
import { Check } from 'lucide-react';

interface StepperProps {
    currentStep: number;
    steps: string[];
}

const Stepper: React.FC<StepperProps> = ({ currentStep, steps }) => {
    return (
        <div className="flex items-center justify-between gap-2 px-2 py-8">
            {steps.map((label, idx) => {
                const stepNum = idx + 1;
                const isActive = currentStep === stepNum;
                const isCompleted = currentStep > stepNum;

                return (
                    <React.Fragment key={label}>
                        <div className="flex flex-col items-center gap-2 flex-1">
                            <div 
                                className={`
                                    w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all duration-500
                                    ${isActive ? 'bg-purple-600 text-white shadow-xl shadow-purple-500/20 scale-110' : ''}
                                    ${isCompleted ? 'bg-green-500 text-white scale-100' : ''}
                                    ${!isActive && !isCompleted ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : ''}
                                `}
                            >
                                {isCompleted ? (
                                    <Check className="w-5 h-5 stroke-[3]" />
                                ) : (
                                    <span className="text-sm">{stepNum}</span>
                                )}
                            </div>
                            <span 
                                className={`
                                    text-[10px] font-black uppercase tracking-widest text-center
                                    ${isActive ? 'text-purple-600' : isCompleted ? 'text-green-600' : 'text-slate-400'}
                                `}
                            >
                                {label}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className="w-8 h-px mb-6 bg-slate-100 dark:bg-slate-800" />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default Stepper;
