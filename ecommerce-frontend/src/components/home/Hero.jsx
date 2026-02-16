import React from "react";
import {
  ArrowRight,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { motion } from "framer-motion";
import heroBaby from "../../assets/hero-baby.png";

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: "Safety-first products" },
  { icon: Truck, label: "Fast family delivery" },
  { icon: HeartHandshake, label: "Easy 30-day returns" },
];

export default function Hero() {
  return (
    <section className="w-full px-4 pt-2 md:px-6 md:pt-3">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[30px] border border-primary/12 bg-white/95 shadow-[0_16px_32px_rgba(116,178,226,0.10)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-soft/56 via-cream/82 to-secondary-light/44" />
          <div className="absolute -top-20 right-0 h-48 w-48 rounded-full bg-secondary-light/82 blur-md" />
          <div className="absolute -bottom-20 left-0 h-52 w-52 rounded-full bg-blue-soft/84 blur-md" />
          <div className="absolute -right-16 bottom-2 h-36 w-36 rounded-full bg-blue-soft/68 blur-md" />
          <div className="absolute left-[42%] top-0 h-28 w-28 rounded-full bg-secondary-light/70 blur-md" />

          <div className="absolute left-8 top-8 h-10 w-24 rounded-full border border-white/65 bg-white/92 shadow-[0_10px_18px_rgba(255,255,255,0.40)]" />
          <div className="absolute left-14 top-4 h-9 w-9 rounded-full border border-white/65 bg-white/92" />
          <div className="absolute left-24 top-5 h-8 w-8 rounded-full border border-white/65 bg-white/90" />

          <div className="absolute right-20 top-24 h-9 w-[5.5rem] rounded-full border border-white/60 bg-white/90 shadow-[0_10px_18px_rgba(255,255,255,0.36)]" />
          <div className="absolute right-24 top-[4.6rem] h-8 w-8 rounded-full border border-white/60 bg-white/90" />
          <div className="absolute right-14 top-[4.7rem] h-7 w-7 rounded-full border border-white/60 bg-white/88" />
          <div className="absolute right-[36%] bottom-[14%] h-8 w-[4.8rem] rounded-full border border-blue-soft/55 bg-blue-soft/74 shadow-[0_8px_14px_rgba(183,219,248,0.36)]" />
          <div className="absolute right-[38.4%] bottom-[12.2%] h-6 w-6 rounded-full border border-blue-soft/55 bg-blue-soft/72" />
          <div className="absolute right-[34.7%] bottom-[12.5%] h-5 w-5 rounded-full border border-blue-soft/55 bg-blue-soft/70" />

          <div className="relative grid grid-cols-1 items-center gap-6 px-6 py-8 md:px-8 md:py-9 lg:grid-cols-[1.08fr_0.92fr] lg:gap-8">
            <div className="space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/90 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                <Sparkles className="h-4 w-4" />
                Warm, Safe, and Parent-Friendly
              </p>

              <div className="space-y-3">
                <h1 className="max-w-2xl text-3xl font-bold leading-tight text-text-main md:text-5xl">
                  Everything Your Baby Needs
                </h1>
                <p className="max-w-xl text-base leading-relaxed text-text-muted md:text-lg">
                  Trusted essentials for newborns and toddlers with simple browsing and fast checkout for busy parents.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <a
                  href="#products"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-text-main transition-colors hover:bg-primary-hover"
                >
                  Shop Now
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-3">
                {TRUST_ITEMS.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 rounded-xl border border-primary/12 bg-white/90 px-3 py-2 text-xs font-semibold text-text-muted"
                  >
                    <item.icon className="h-4 w-4 text-primary" />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl border border-primary/12 bg-gradient-to-b from-white via-blue-soft/24 to-secondary-light/34 p-4 md:p-5">
                <div className="relative overflow-hidden rounded-2xl bg-white/75 p-2">
                  <img src={heroBaby} alt="Happy baby with essentials" className="h-auto w-full rounded-xl object-cover" />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-primary/12 bg-mint-soft/70 p-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">Parent Rating</p>
                    <p className="text-lg font-bold text-text-main">4.9 / 5</p>
                  </div>
                  <div className="rounded-xl border border-primary/12 bg-yellow-soft/70 p-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">Trusted Orders</p>
                    <p className="text-lg font-bold text-text-main">30k+</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
