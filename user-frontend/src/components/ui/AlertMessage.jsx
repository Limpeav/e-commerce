import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const AlertMessage = ({ 
  type, 
  message, 
  onClose, 
  title 
}) => {
  const baseClasses = "p-6 rounded-[2.5rem] flex items-start gap-4 shadow-xl animate-slideDown";
  const typeClasses = {
    success: "bg-green-50 text-green-700 border-green-100 shadow-green-900/5",
    error: "bg-red-50 text-red-600 border-red-100 shadow-red-900/5 animate-shake",
    warning: "bg-yellow-50 text-yellow-700 border-yellow-100 shadow-yellow-900/5"
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle
  };

  const Icon = icons[type] || AlertCircle;
  const colors = {
    success: "text-green-600",
    error: "text-red-600", 
    warning: "text-yellow-600"
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type] || typeClasses.error}`}>
      <Icon className={`w-6 h-6 ${colors[type] || colors.error} flex-shrink-0`} />
      <div className="flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1">
          {title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Warning')}
        </p>
        <p className="font-black uppercase tracking-widest text-xs">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`text-${type === 'success' ? 'green-600 hover:green-800' : 'red-600 hover:red-800'} transition-all p-2 hover:bg-white rounded-xl`}
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default AlertMessage;
