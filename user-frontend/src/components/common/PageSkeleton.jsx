import React from 'react';
import { useDarkMode } from '../../hooks';

/**
 * PageSkeleton — shimmer placeholder shown in <Suspense fallback>.
 * Matches the general layout of product / catalog pages.
 */
const ShimmerBlock = ({ className = '' }) => (
  <div className={`relative overflow-hidden rounded-xl ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
  </div>
);

const PageSkeleton = () => {
  const [isDark] = useDarkMode();

  const baseBg = isDark ? 'bg-slate-800/60' : 'bg-stone-200/70';
  const cardBg = isDark ? 'bg-slate-900' : 'bg-white';
  const pageBg = isDark ? 'bg-slate-950' : 'bg-stone-50';

  return (
    <div className={`min-h-screen ${pageBg} pt-14 sm:pt-16 lg:pt-20 pb-16 lg:pb-0`}>
      {/* Sticky search bar skeleton */}
      <div
        className={`sticky top-14 sm:top-16 lg:top-20 z-40 px-4 py-3 border-b ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-stone-50 border-stone-200/50'
        }`}
      >
        <div className={`h-10 max-w-lg rounded-xl ${baseBg} overflow-hidden relative`}>
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pt-8 sm:pt-12">
        {/* Section heading skeleton */}
        <div className="mb-8 space-y-3">
          <div className={`h-3 w-24 rounded-full ${baseBg} overflow-hidden relative`}>
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_0.1s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
          <div className={`h-8 w-64 rounded-xl ${baseBg} overflow-hidden relative`}>
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_0.15s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
          <div className={`h-4 w-80 rounded-lg ${baseBg} overflow-hidden relative`}>
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_0.2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        </div>

        {/* Card grid skeleton */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-2xl border overflow-hidden ${cardBg} ${
                isDark ? 'border-slate-800' : 'border-stone-100'
              }`}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              {/* Image */}
              <div
                className={`aspect-square w-full ${baseBg} overflow-hidden relative`}
              >
                <div
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent"
                  style={{
                    animation: `shimmer 1.4s ${i * 0.08}s infinite`,
                  }}
                />
              </div>
              {/* Text lines */}
              <div className="p-3 space-y-2">
                <div className={`h-3.5 w-3/4 rounded-lg ${baseBg} overflow-hidden relative`}>
                  <div
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent"
                    style={{ animation: `shimmer 1.4s ${i * 0.08 + 0.1}s infinite` }}
                  />
                </div>
                <div className={`h-3 w-1/2 rounded-lg ${baseBg} overflow-hidden relative`}>
                  <div
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent"
                    style={{ animation: `shimmer 1.4s ${i * 0.08 + 0.15}s infinite` }}
                  />
                </div>
                <div className={`h-5 w-1/3 rounded-lg ${baseBg} mt-1 overflow-hidden relative`}>
                  <div
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent"
                    style={{ animation: `shimmer 1.4s ${i * 0.08 + 0.2}s infinite` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default PageSkeleton;
