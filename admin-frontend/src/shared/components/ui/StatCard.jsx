import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, ShoppingCart, Package } from 'lucide-react';

const StatCard = ({ 
  to, 
  label, 
  value, 
  icon: Icon,
  bgColor = "bg-stone-50",
  iconColor = "text-primary"
}) => {
  const Component = to ? Link : 'div';
  const props = to ? { to } : {};

  return (
    <Component
      {...props}
      className={`bg-white rounded-[3rem] shadow-2xl shadow-primary/5 p-8 transition-all border border-stone-100 group hover:-translate-y-1 ${to ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-primary/40 mb-3 uppercase tracking-[0.3em]">{label}</p>
          <p className="text-5xl font-black text-text-main font-display tracking-tighter group-hover:text-primary transition-colors">
            {value}
          </p>
        </div>
        <div className={`w-16 h-16 ${bgColor} rounded-[2rem] flex items-center justify-center border border-stone-100 group-hover:bg-primary/5 transition-colors`}>
          <Icon className={`w-7 h-7 ${iconColor}`} />
        </div>
      </div>
    </Component>
  );
};

export default StatCard;
