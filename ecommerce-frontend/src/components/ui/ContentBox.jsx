import React from 'react';

const ContentBox = ({ 
  children, 
  className = "",
  padding = "p-6 md:p-8",
  rounded = "rounded-3xl",
  bg = "bg-white/75 backdrop-blur-md"
}) => {
  return (
    <div className={`${bg} ${rounded} ${padding} border border-white/70 shadow-[0_10px_24px_rgba(116,178,226,0.12)] ${className}`}>
      {children}
    </div>
  );
};

export default ContentBox;
