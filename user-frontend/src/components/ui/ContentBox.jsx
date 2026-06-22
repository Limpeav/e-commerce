import React from 'react';
import { useDarkMode } from '../../hooks';

const ContentBox = ({ 
  children, 
  className = "",
  padding = "p-8",
  rounded = "rounded-[2.5rem]",
  bg = "bg-stone-50"
}) => {
  const [isDark] = useDarkMode();

  return (
    <div className={`${rounded} ${padding} border transition-colors duration-300 ${isDark ? "bg-slate-800/70 border-slate-700" : `${bg} border-stone-100`} ${className}`}>
      {children}
    </div>
  );
};

export default ContentBox;
