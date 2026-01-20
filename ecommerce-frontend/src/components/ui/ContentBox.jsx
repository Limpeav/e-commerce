import React from 'react';

const ContentBox = ({ 
  children, 
  className = "",
  padding = "p-8",
  rounded = "rounded-[2.5rem]",
  bg = "bg-stone-50"
}) => {
  return (
    <div className={`${bg} ${rounded} ${padding} border border-stone-100 ${className}`}>
      {children}
    </div>
  );
};

export default ContentBox;
