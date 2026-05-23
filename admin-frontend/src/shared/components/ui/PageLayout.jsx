import React from 'react';
import { useDarkMode } from '../../hooks';

const PageLayout = ({
  children,
  title,
  subtitle,
  badge,
  icon: Icon,
  maxWidth = "4xl",
  badgeColor = "primary"
}) => {
  const [isDark] = useDarkMode();

  return (
    <div className="min-h-screen bg-bg-base px-6 pt-32 py-12 font-sans transition-colors duration-300">
      <div className={`max-w-${maxWidth} mx-auto`}>
        <div
          className={`relative overflow-hidden rounded-[4rem] border p-12 transition-colors duration-300 md:p-20 ${isDark ? "bg-bg-card shadow-[0_28px_80px_-34px_rgba(12,16,12,0.65)]" : "bg-bg-card shadow-[0_28px_80px_-34px_rgba(141,170,145,0.18)]"}`}
          style={{ borderColor: "var(--color-border)" }}
        >
          {/* Abstract Background Element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>

          {/* Header */}
          <div className="text-center mb-20 relative z-10">
            {Icon && (
              <div
                className={`mx-auto mb-10 flex h-24 w-24 rotate-6 items-center justify-center rounded-[2rem] border shadow-xl ${isDark ? "bg-[color:var(--color-surface-soft)]" : "bg-white"}`}
                style={{ borderColor: "var(--color-border)" }}
              >
                <Icon className="w-10 h-10 text-primary" />
              </div>
            )}
            <h1 className="text-5xl font-bold text-text-main mb-6 font-display tracking-tight leading-none">{title}</h1>
            <p className="mb-4 text-sm font-semibold leading-relaxed tracking-wide text-text-muted opacity-80">{subtitle}</p>
            {badge && (
              <div
                className="inline-flex items-center gap-3 rounded-full border bg-[color:var(--color-surface-soft)]/80 px-4 py-2"
                style={{ borderColor: "var(--color-border)" }}
              >
                <span className={`w-2 h-2 bg-${badgeColor === 'green' ? 'green-500' : 'primary'} rounded-full animate-pulse`}></span>
                <span className="text-xs font-bold uppercase leading-none tracking-wide text-text-muted">{badge}</span>
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
