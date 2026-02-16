import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

const FormInput = ({ 
  label, 
  name, 
  type = "text", 
  value, 
  onChange, 
  placeholder,
  disabled = false,
  required = false,
  showPasswordToggle = false,
  showPassword,
  onTogglePassword,
  icon: Icon
}) => {
  const inputType = type === 'password' && showPasswordToggle ? (showPassword ? 'text' : 'password') : type;
  const ToggleIcon = showPassword ? EyeOff : Eye;

  return (
    <div className="group">
      <label className="block text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2 ml-1">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted/60" />
        )}
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full ${Icon ? 'pl-12' : 'px-4'} pr-4 py-3 bg-white border border-primary/15 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-semibold text-text-main disabled:opacity-40 disabled:cursor-not-allowed ${showPasswordToggle ? 'pr-14' : ''}`}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-muted/70 hover:text-primary transition-colors"
          >
            <ToggleIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default FormInput;
