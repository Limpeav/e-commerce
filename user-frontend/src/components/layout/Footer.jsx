import { Link, useLocation } from "react-router-dom";
import {
  Mail,
  Phone,
} from "lucide-react";
import { useLanguage } from "../../context/useLanguage";
import BrandLogo from "../common/BrandLogo";

const HOME_SECTION_NAVIGATION_EVENT = "home-section:navigate";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();
  const location = useLocation();
  const routePrefix = location.pathname.startsWith("/customer") ? "/customer" : "";

  const linkClass = "text-xs sm:text-sm font-medium text-text-muted hover:text-primary transition-all hover:translate-x-1 inline-block";
  const getRoute = (path) => `${routePrefix}${path}`;
  const handleSectionLinkClick = (targetId) => {
    window.dispatchEvent(
      new CustomEvent(HOME_SECTION_NAVIGATION_EVENT, {
        detail: { targetId },
      })
    );
  };

  return (
    <footer
      className="relative mb-14 overflow-hidden border-t bg-bg-base transition-colors duration-300 md:mb-0"
      style={{ borderColor: "var(--color-border)" }}
    >
      {/* Decorative background */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[40rem] w-[40rem] rounded-full bg-primary/5 blur-[120px]"></div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 md:py-20">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-2 lg:grid-cols-5 lg:gap-16">
          {/* Brand */}
          <div className="col-span-2 space-y-6">
            <Link to={getRoute("") || "/"} className="group flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-stone-100 bg-white p-1 shadow-xl shadow-primary/20 transition-transform duration-500 group-hover:rotate-12 sm:h-14 sm:w-14 sm:rounded-2xl">
                <BrandLogo
                  className="h-full w-full rounded-lg object-contain sm:rounded-xl"
                />
              </div>
              <span className="text-2xl font-bold tracking-tight text-text-main sm:text-3xl">Cherish Baby Store</span>
            </Link>
            <p className="max-w-xs text-sm leading-6 text-text-muted">
              {t("footer.brandDescription")}
            </p>
            <div className="space-y-3">
              {[
                { icon: Phone, text: "016 568 335", href: "tel:016568335" },
                { icon: Mail, text: "limpeavhour@gmail.com", href: "mailto:limpeavhour@gmail.com" },
              ].map((item) => (
                <a key={item.text} href={item.href} className="group flex cursor-pointer items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border bg-bg-card transition-all group-hover:bg-primary sm:h-9 sm:w-9 sm:rounded-xl" style={{ borderColor: "var(--color-border)" }}>
                    <item.icon className="h-3.5 w-3.5 text-text-muted transition-colors group-hover:text-white sm:h-4 sm:w-4" />
                  </div>
                  <span className="text-xs font-medium tracking-wide text-text-muted transition-colors group-hover:text-primary sm:text-sm">{item.text}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="mb-5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary sm:mb-8 sm:text-xs">{t("footer.shop")}</h4>
            <ul className="space-y-3 sm:space-y-3.5">
              {[
                { name: t('footer.allProducts'), to: `${getRoute("") || "/"}#all-products`, targetId: "all-products" },
                { name: t('footer.newArrivals'), to: `${getRoute("") || "/"}#new-arrivals`, targetId: "new-arrivals" },
                { name: t('footer.bestSellers'), to: `${getRoute("") || "/"}#best-sellers`, targetId: "best-sellers" },
                { name: t('footer.deals'), to: `${getRoute("") || "/"}#deals`, targetId: "deals" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.to}
                    className={linkClass}
                    onClick={() => handleSectionLinkClick(link.targetId)}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary sm:mb-8 sm:text-xs">{t("footer.support")}</h4>
            <ul className="space-y-3 sm:space-y-3.5">
              {[
                { name: t('footer.contact'), to: getRoute('/contact') },
                { name: t('footer.faq'), to: getRoute('/knowledge-base') },
                { name: t('footer.trackOrder'), to: getRoute('/orders/tracking') },
              ].map((link) => (
                <li key={link.name}>
                  <Link to={link.to} className={linkClass}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="col-span-2 sm:col-span-1">
            <h4 className="mb-5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary sm:mb-8 sm:text-xs">{t("footer.company")}</h4>
            <ul className="space-y-3 sm:space-y-3.5">
              {[
                { name: t('footer.aboutUs'), to: getRoute('/about') },
                { name: t('footer.location'), to: getRoute('/location') },
                { name: t('footer.privacyPolicy'), to: getRoute('/privacy') },
                { name: t('footer.termsOfService'), to: getRoute('/terms') },
              ].map((link) => (
                <li key={link.name}>
                  <Link to={link.to} className={linkClass}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        className="border-t bg-bg-card/50 px-4 py-6 backdrop-blur-sm sm:px-6 sm:py-8"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="mx-auto flex max-w-7xl justify-center">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted/50">
            &copy; {currentYear} Cherish Baby Store Inc. {t("footer.rightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  );
}
