import React from "react";
import { ArrowRight, BadgePercent, Clock3 } from "lucide-react";

export default function DiscountBanner() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-primary/14 bg-gradient-to-br from-yellow-soft/65 via-white to-blue-soft/45 p-4 shadow-[0_12px_26px_rgba(255,176,92,0.16)] md:p-5">
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-soft/65 blur-2xl" />

        <div className="relative z-10 grid grid-cols-1 items-center gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              <BadgePercent className="h-4 w-4" />
              This Week's Baby Savings
            </p>

            <h2 className="mt-3 text-2xl font-bold leading-tight text-text-main md:text-3xl">
              Gentle Care Deals Up to <span className="text-primary">35% Off</span>
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted md:text-base">
              Save on diapers, feeding essentials, and daily baby care. Clear prices and easy returns, so shopping
              stays relaxing.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col lg:items-end">
            <a
              href="#products"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-text-main hover:bg-primary-hover"
            >
              Shop Deals
              <ArrowRight className="h-4 w-4" />
            </a>
            <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white px-4 py-2.5 text-sm font-semibold text-text-muted">
              <Clock3 className="h-4 w-4 text-primary" />
              Ends in 2 days
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
