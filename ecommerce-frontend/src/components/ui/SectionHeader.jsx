import React from 'react';

const SectionHeader = ({ 
  number, 
  title, 
  icon: Icon,
  iconBg = "primary/5",
  titleClass = "text-xl font-bold text-text-main font-display tracking-wide"
}) => {
  return (
    <div className="flex items-center gap-4 mb-6">
      <span className="text-4xl font-bold text-primary/20 font-display">{String(number).padStart(2, '0')}</span>
      <h2 className={titleClass}>{title}</h2>
      {Icon && (
        <div className={`w-10 h-10 bg-${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-primary" />
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
