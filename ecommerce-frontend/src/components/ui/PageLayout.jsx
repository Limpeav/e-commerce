import React from 'react';

const maxWidthClasses = {
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
};

const badgeColorClasses = {
  green: 'bg-green-600',
  primary: 'bg-primary',
};

const PageLayout = ({
  children,
  title,
  subtitle,
  badge,
  icon: Icon,
  maxWidth = "4xl",
  badgeColor = "primary"
}) => {
  const resolvedMaxWidth = maxWidthClasses[maxWidth] || maxWidthClasses['4xl'];
  const resolvedBadgeColor = badgeColorClasses[badgeColor] || badgeColorClasses.primary;

  return (
    <div className="min-h-screen bg-bg-base py-10 pt-28 px-4 sm:px-6 font-sans">
      <div className={`${resolvedMaxWidth} mx-auto`}>
        <div className="bg-white/78 backdrop-blur-xl rounded-[2.2rem] shadow-[0_24px_52px_rgba(116,178,226,0.17)] p-8 md:p-12 border border-white/70 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-[120px] -mr-24 -mt-32"></div>

          <div className="text-center mb-20 relative z-10">
            {Icon && (
              <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm border border-primary/15">
                <Icon className="w-9 h-9 text-primary" />
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-text-main mb-5 font-display tracking-tight leading-none">{title}</h1>
            <p className="text-text-muted text-sm md:text-base max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
            {badge && (
              <div className="inline-flex items-center gap-3 bg-white mt-5 px-4 py-2 rounded-full border border-primary/15">
                <span className={`w-2 h-2 ${resolvedBadgeColor} rounded-full`}></span>
                <span className="text-xs font-semibold text-text-muted uppercase tracking-[0.12em] leading-none">{badge}</span>
              </div>
            )}
          </div>

          <div className="relative z-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageLayout;
