import React from 'react';
import { Link } from 'react-router-dom';

const StatCard = ({ 
  to, 
  label, 
  value, 
  icon: Icon,
  bgColor = "bg-blue-soft/80",
  iconColor = "text-primary"
}) => {
  const Component = to ? Link : 'div';
  const props = to ? { to } : {};

  return (
    <Component
      {...props}
      className={`bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_12px_28px_rgba(116,178,226,0.12)] p-6 md:p-7 transition-all border border-white/70 group hover:border-primary/20 ${to ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-primary/70 mb-2 uppercase tracking-[0.2em]">{label}</p>
          <p className="text-4xl md:text-5xl font-bold text-text-main font-display tracking-tight group-hover:text-primary transition-colors">
            {value}
          </p>
        </div>
        <div className={`w-14 h-14 ${bgColor} rounded-2xl flex items-center justify-center border border-primary/15 group-hover:bg-primary/5 transition-colors`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </Component>
  );
};

export default StatCard;
