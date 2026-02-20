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
  readOnly = false,
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
          // Provide a no-op onChange when readOnly so React doesn't warn about
          // a controlled input without an onChange handler.
          onChange={onChange ?? (readOnly ? () => { } : undefined)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          className={`w-full ${Icon ? 'pl-12' : 'px-6'} pr-6 py-4 bg-stone-50 border-2 border-stone-100 rounded-2xl focus:outline-none focus:border-primary transition-all font-bold text-text-main disabled:opacity-40 disabled:cursor-not-allowed ${readOnly ? 'cursor-default text-stone-500' : ''} ${showPasswordToggle ? 'pr-14' : ''}`}
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
