import React from 'react';
import { Eye, EyeOff, User, Mail, Phone, Lock } from 'lucide-react';

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
      <label className="block text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 ml-1">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
        )}
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full ${Icon ? 'pl-12' : 'px-6'} pr-6 py-4 bg-stone-50 border-2 border-stone-100 rounded-2xl focus:outline-none focus:border-primary transition-all font-bold text-text-main disabled:opacity-40 disabled:cursor-not-allowed ${showPasswordToggle ? 'pr-14' : ''}`}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-6 top-1/2 transform -translate-y-1/2 text-stone-300 hover:text-primary transition-colors"
          >
            <ToggleIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default FormInput;
