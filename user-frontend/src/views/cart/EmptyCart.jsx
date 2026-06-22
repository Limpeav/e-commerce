import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useDarkMode } from "../../hooks";
import { useLanguage } from "../../context/useLanguage";

export default function EmptyCart() {
  const [isDark] = useDarkMode();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center overflow-hidden font-sans transition-colors duration-300">
      <div className="relative mx-auto w-full max-w-4xl px-4 sm:px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Main Empty State */}
        <div
          className={`relative z-10 mx-auto max-w-2xl rounded-3xl border p-8 text-center sm:rounded-[4rem] sm:p-16 ${isDark ? "bg-bg-card shadow-[0_64px_128px_-40px_rgba(12,16,12,0.7)]" : "bg-bg-card shadow-[0_64px_128px_-32px_rgba(122,150,126,0.14)]"} md:p-24`}
          style={{ borderColor: "var(--color-border)" }}
        >
          {/* Animated Icon */}
          <div className="relative mb-8 inline-block sm:mb-12">
            <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] blur-2xl opacity-40 animate-pulse"></div>
            <div
              className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] border bg-bg-card shadow-2xl transition-transform duration-300 hover:scale-110 sm:h-32 sm:w-32 sm:rounded-[2.5rem]"
              style={{ borderColor: "var(--color-border)" }}
            >
              <ShoppingBag className="h-10 w-10 text-primary sm:h-14 sm:w-14" strokeWidth={1} />
            </div>
            <div
              className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-xl border-4 bg-secondary shadow-2xl animate-bounce sm:-right-4 sm:-top-4 sm:h-12 sm:w-12 sm:rounded-2xl"
              style={{ borderColor: "var(--color-bg-card)" }}
            >
              <Sparkles className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            </div>
          </div>

          {/* Heading */}
          <div className="mx-auto flex w-full max-w-[24rem] flex-col items-center px-5 text-center sm:max-w-lg sm:px-8">
            <h1 className="mb-5 w-full text-center text-[clamp(1.65rem,7vw,3rem)] font-bold leading-tight tracking-tight text-text-main font-display sm:mb-6">
              {t("cart.emptyTitle")}
            </h1>
            <p className="mx-auto mb-8 text-sm leading-relaxed text-text-muted sm:mb-10 sm:text-lg">
              <span className="block">{t("cart.emptyMessage")}</span>
              <span className="block">{t("cart.emptyHint")}</span>
            </p>
          </div>

          {/* CTA Button */}
          <Link
            to="/"
            className="group inline-flex max-w-full items-center justify-center gap-3 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-white shadow-xl transform transition-all duration-300 hover:-translate-y-1 hover:bg-primary-dark active:scale-95 sm:px-10 sm:py-4"
          >
            <span>{t("cart.startShopping")}</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
