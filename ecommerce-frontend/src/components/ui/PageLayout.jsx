import React from 'react';

const PageLayout = ({
  children,
  title,
  subtitle,
  badge,
  icon: Icon,
  maxWidth = "4xl",
  badgeColor = "primary"
}) => {
  return (
    <div className="min-h-screen bg-bg-base py-12 pt-32 px-6 font-sans">
      <div className={`max-w-${maxWidth} mx-auto`}>
        <div className="bg-white rounded-[4rem] shadow-2xl shadow-primary/5 p-12 md:p-20 border border-stone-100 relative overflow-hidden">
          {/* Abstract Background Element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>

          {/* Header */}
          <div className="text-center mb-20 relative z-10">
            {Icon && (
              <div className="bg-white w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-xl border border-stone-100 transform rotate-6">
                <Icon className="w-10 h-10 text-primary" />
              </div>
            )}
            <h1 className="text-5xl font-bold text-text-main mb-6 font-display tracking-tight leading-none">{title}</h1>
            <p className="text-text-muted font-semibold text-sm tracking-wide mb-4 opacity-40 leading-relaxed">{subtitle}</p>
            {badge && (
              <div className="inline-flex items-center gap-3 bg-stone-50 px-4 py-2 rounded-full border border-stone-100">
                <span className={`w-2 h-2 bg-${badgeColor === 'green' ? 'green-500' : 'primary'} rounded-full animate-pulse`}></span>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wide leading-none">{badge}</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageLayout;
