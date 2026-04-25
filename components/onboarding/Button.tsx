
import React from 'react';
import { motion } from 'motion/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
    children, 
    variant = 'primary', 
    isLoading, 
    icon, 
    className, 
    ...props 
}) => {
    const variants = {
        primary: 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0',
        secondary: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900',
        outline: 'bg-transparent border-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
    };

    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            className={`
                flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-black 
                transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale
                ${variants[variant]}
                ${className || ''}
            `}
            disabled={isLoading || props.disabled}
            {...props as any}
        >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <>
                    {children}
                    {icon && <span className="opacity-70">{icon}</span>}
                </>
            )}
        </motion.button>
    );
};

export default Button;
