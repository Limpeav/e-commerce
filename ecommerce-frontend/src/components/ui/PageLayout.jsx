import React from 'react';
import { useDarkMode } from '../../hooks';

const PageLayout = ({
  children,
  title,
  subtitle,
  badge,
  icon: Icon,
  maxWidth = "4xl",
  badgeColor = "primary",
  topAction
}) => {
  const [isDark] = useDarkMode();

  return (
    <div className="min-h-screen bg-bg-base px-4 pb-10 pt-24 font-sans transition-colors duration-300 sm:px-6 sm:pb-12 sm:pt-28 md:pt-32">
      <div className={`max-w-${maxWidth} mx-auto`}>
        <div
          className={`relative overflow-hidden rounded-3xl border p-5 transition-colors duration-300 sm:rounded-[2.5rem] sm:p-8 md:p-12 lg:rounded-[4rem] lg:p-20 ${isDark ? "bg-bg-card shadow-[0_28px_80px_-34px_rgba(12,16,12,0.65)]" : "bg-bg-card shadow-[0_28px_80px_-34px_rgba(141,170,145,0.18)]"}`}
          style={{ borderColor: "var(--color-border)" }}
        >
          {/* Abstract Background Element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>

          {topAction && (
            <div className="relative z-10 mb-8 flex justify-start">
              {topAction}
            </div>
          )}

          {/* Header */}
          <div className="relative z-10 mb-10 text-center sm:mb-14 md:mb-16 lg:mb-20">
            {Icon && (
              <div
                className={`mx-auto mb-6 flex h-16 w-16 rotate-6 items-center justify-center rounded-2xl border shadow-xl sm:mb-8 sm:h-20 sm:w-20 sm:rounded-[1.75rem] md:mb-10 md:h-24 md:w-24 md:rounded-[2rem] ${isDark ? "bg-[color:var(--color-surface-soft)]" : "bg-white"}`}
                style={{ borderColor: "var(--color-border)" }}
              >
                <Icon className="h-7 w-7 text-primary sm:h-9 sm:w-9 md:h-10 md:w-10" />
              </div>
            )}
            <h1 className="mb-4 text-3xl font-bold leading-tight text-text-main font-display tracking-tight sm:text-4xl md:mb-6 md:text-5xl">{title}</h1>
            <p className="mx-auto mb-4 max-w-2xl text-sm font-semibold leading-relaxed tracking-wide text-text-muted opacity-80 sm:text-base">{subtitle}</p>
            {badge && (
              <div
                className="inline-flex max-w-full items-center gap-3 rounded-full border bg-[color:var(--color-surface-soft)]/80 px-4 py-2"
                style={{ borderColor: "var(--color-border)" }}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full animate-pulse bg-${badgeColor === 'green' ? 'green-500' : 'primary'}`}></span>
                <span className="min-w-0 text-xs font-bold uppercase leading-none tracking-wide text-text-muted">{badge}</span>
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
