import React from 'react';

const FeatureList = ({ 
  items, 
  className = "",
  itemClass = "text-[10px] font-black text-text-muted uppercase tracking-widest leading-none"
}) => {
  return (
    <ul className={`space-y-4 ${className}`}>
      {items.map((item, index) => (
        <li key={index} className={`flex items-center gap-3 ${itemClass}`}>
          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
          {item}
        </li>
      ))}
    </ul>
  );
};

export default FeatureList;
