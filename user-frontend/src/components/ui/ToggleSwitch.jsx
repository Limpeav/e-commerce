import React from 'react';
import { useDarkMode } from '../../hooks';

const ToggleSwitch = ({ 
  checked, 
  onChange, 
  label, 
  disabled = false 
}) => {
  const [isDark] = useDarkMode();
  return (
    <label className={`flex items-center gap-4 group ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div className={`w-14 h-8 rounded-full transition-colors duration-300 ${checked ? 'bg-primary' : isDark ? 'bg-slate-700' : 'bg-stone-200'}`}></div>
        <div className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-0'} shadow-sm`}></div>
      </div>
      <span className="text-sm font-bold text-text-main uppercase tracking-widest leading-none">{label}</span>
    </label>
  );
};

export default ToggleSwitch;
