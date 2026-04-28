/* Filename: DesignSystem.js */
import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

// ==========================================
// 1. Button Component
// ==========================================
export const Button = ({
  children,
  variant = 'primary', // primary, secondary, outline, danger, ghost
  size = 'md', // sm, md, lg
  isLoading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'right', // left, right
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm shadow-indigo-200",
    secondary: "bg-slate-800 text-white hover:bg-slate-900 focus:ring-slate-700 shadow-sm",
    outline: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-200",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-sm shadow-red-200",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-200"
  };

  const sizes = {
    sm: "text-[11px] h-8 px-3 gap-1.5",
    md: "text-[12px] h-10 px-4 gap-2",
    lg: "text-[14px] h-12 px-6 gap-2.5"
  };

  const iconSizes = { sm: 14, md: 16, lg: 18 };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading && <Loader2 size={iconSizes[size]} className="animate-spin shrink-0" />}
      
      {!isLoading && Icon && iconPosition === 'right' && (
        <Icon size={iconSizes[size]} className="shrink-0" />
      )}
      
      <span className="truncate">{children}</span>
      
      {!isLoading && Icon && iconPosition === 'left' && (
        <Icon size={iconSizes[size]} className="shrink-0" />
      )}
    </button>
  );
};

// ==========================================
// 2. TextField Component
// ==========================================
export const TextField = ({
  label,
  error,
  hint,
  icon: Icon,
  disabled = false,
  required = false,
  className = '',
  wrapperClassName = '',
  id,
  type = 'text',
  isRtl = true,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={`flex flex-col gap-1.5 w-full ${wrapperClassName}`}>
      {label && (
        <label htmlFor={inputId} className="text-[12px] font-bold text-slate-700 flex items-center gap-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative flex items-center">
        {Icon && (
          <div className={`absolute ${isRtl ? 'right-3' : 'left-3'} text-slate-400 pointer-events-none`}>
            <Icon size={16} />
          </div>
        )}
        
        <input
          id={inputId}
          type={type}
          disabled={disabled}
          className={`
            w-full h-10 bg-white border rounded-lg text-[13px] text-slate-800 transition-all outline-none
            placeholder:text-slate-400 focus:bg-white focus:ring-2
            ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}
            ${error 
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100' 
              : 'border-slate-300 focus:border-indigo-400 focus:ring-indigo-100 hover:border-slate-400'
            }
            ${Icon ? (isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3') : 'px-3'}
            ${className}
          `}
          dir={isRtl ? 'rtl' : 'ltr'}
          {...props}
        />
      </div>

      {error ? (
        <div className="flex items-center gap-1 text-red-500 text-[11px] font-bold mt-0.5">
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      ) : hint ? (
        <div className="text-slate-500 text-[11px] mt-0.5">{hint}</div>
      ) : null}
    </div>
  );
};

// ==========================================
// 3. Card Component
// ==========================================
export const Card = ({ title, action, children, className = '', noPadding = false }) => {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col ${className}`}>
      {(title || action) && (
        <div className="h-14 border-b border-slate-100 flex items-center justify-between px-5 bg-slate-50/50 shrink-0">
          <h3 className="font-black text-[14px] text-slate-800">{title}</h3>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`flex-1 ${noPadding ? '' : 'p-5'}`}>
        {children}
      </div>
    </div>
  );
};

// ==========================================
// 4. Badge Component
// ==========================================
export const Badge = ({ children, variant = 'gray', className = '' }) => {
  const variants = {
    gray: "bg-slate-100 text-slate-600 border border-slate-200",
    success: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    warning: "bg-amber-50 text-amber-600 border border-amber-200",
    danger: "bg-red-50 text-red-600 border border-red-200",
    indigo: "bg-indigo-50 text-indigo-600 border border-indigo-200"
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black tracking-wide ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// ==========================================
// 5. SelectField (Native Dropdown) Component
// ==========================================
export const SelectField = ({
  label,
  error,
  options = [],
  disabled = false,
  required = false,
  className = '',
  wrapperClassName = '',
  id,
  isRtl = true,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${wrapperClassName}`}>
      {label && (
        <label htmlFor={selectId} className="text-[12px] font-bold text-slate-700 flex items-center gap-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          id={selectId}
          disabled={disabled}
          className={`
            w-full h-10 bg-white border rounded-lg text-[13px] text-slate-800 transition-all outline-none appearance-none cursor-pointer
            focus:bg-white focus:ring-2
            ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}
            ${error 
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100' 
              : 'border-slate-300 focus:border-indigo-400 focus:ring-indigo-100 hover:border-slate-400'
            }
            ${isRtl ? 'pl-10 pr-3' : 'pr-10 pl-3'}
            ${className}
          `}
          dir={isRtl ? 'rtl' : 'ltr'}
          {...props}
        >
          <option value="" disabled hidden>انتخاب کنید...</option>
          {options.map((opt, idx) => (
            <option key={idx} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        
        {/* Custom Chevron for Select */}
        <div className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-3' : 'right-3'} pointer-events-none text-slate-400`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1 text-red-500 text-[11px] font-bold mt-0.5">
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};