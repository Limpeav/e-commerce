import React from "react";
import { motion } from "framer-motion";

const floatTransition = (duration, delay = 0, x = 0, y = 10, scale = 1.04) => ({
  animate: { x: [0, x, 0], y: [0, -y, 0], scale: [1, scale, 1] },
  transition: { duration, repeat: Infinity, ease: "easeInOut", delay },
});

export default function PastelCloudBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-b from-[#f7fbff] via-[#e6f3ff] to-[#d7ebff]" />

      <motion.div
        {...floatTransition(14, 0, 12, 12)}
        className="absolute -left-10 -top-14 h-72 w-80 rounded-[46%] bg-blue-soft/90 shadow-[0_18px_34px_rgba(124,179,228,0.28)]"
      />
      <motion.div
        {...floatTransition(16, 0.9, -10, 10)}
        className="absolute right-2 top-6 h-64 w-72 rounded-[45%] bg-secondary-light/90 shadow-[0_18px_34px_rgba(124,179,228,0.26)]"
      />
      <motion.div
        {...floatTransition(18, 1.3, 10, 12)}
        className="absolute left-[32%] top-[26%] h-60 w-64 rounded-[44%] bg-blue-soft/85 shadow-[0_16px_30px_rgba(124,179,228,0.22)]"
      />
      <motion.div
        {...floatTransition(19, 1.7, -12, 9)}
        className="absolute -bottom-14 right-[16%] h-64 w-72 rounded-[46%] bg-secondary-light/82 shadow-[0_16px_30px_rgba(124,179,228,0.20)]"
      />
      <motion.div
        {...floatTransition(17, 0.5, 8, 8)}
        className="absolute left-[60%] top-2 h-40 w-44 rounded-[45%] bg-blue-soft/78 shadow-[0_12px_22px_rgba(124,179,228,0.18)]"
      />

      <div className="absolute left-[8%] top-[18%] h-10 w-24 rounded-full border border-white/70 bg-white/95 shadow-[0_10px_20px_rgba(201,222,255,0.55)]" />
      <div className="absolute left-[10%] top-[15%] h-8 w-8 rounded-full border border-white/70 bg-white/95 shadow-[0_10px_20px_rgba(201,222,255,0.50)]" />
      <div className="absolute left-[15.8%] top-[15.4%] h-7 w-7 rounded-full border border-white/70 bg-white/90" />

      <div className="absolute right-[13%] top-[24%] h-10 w-24 rounded-full border border-white/65 bg-white/92 shadow-[0_10px_20px_rgba(201,222,255,0.48)]" />
      <div className="absolute right-[16%] top-[21.2%] h-8 w-8 rounded-full border border-white/65 bg-white/90" />
      <div className="absolute right-[11%] top-[21.6%] h-7 w-7 rounded-full border border-white/65 bg-white/88" />

      <div className="absolute left-[30%] bottom-[17%] h-9 w-20 rounded-full border border-white/62 bg-white/90 shadow-[0_10px_18px_rgba(201,222,255,0.42)]" />
      <div className="absolute left-[33%] bottom-[15.2%] h-7 w-7 rounded-full border border-white/62 bg-white/88" />
      <div className="absolute left-[36.8%] bottom-[15.4%] h-6 w-6 rounded-full border border-white/62 bg-white/86" />

      <div className="absolute right-[30%] bottom-[12%] h-9 w-20 rounded-full border border-blue-soft/65 bg-blue-soft/90 shadow-[0_10px_18px_rgba(124,179,228,0.34)]" />
      <div className="absolute right-[33%] bottom-[10.3%] h-7 w-7 rounded-full border border-blue-soft/65 bg-blue-soft/86" />
      <div className="absolute right-[28.7%] bottom-[10.6%] h-6 w-6 rounded-full border border-blue-soft/65 bg-blue-soft/82" />
    </div>
  );
}
