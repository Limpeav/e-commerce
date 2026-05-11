import { Link } from "react-router-dom";
import {
  Package,
  Mail,
  Phone,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Shield,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const linkClass = "text-xs sm:text-sm font-medium text-text-muted hover:text-primary transition-all hover:translate-x-1 inline-block";

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
            <Link to="/" className="group flex items-center gap-3">
              <div className="rounded-xl bg-primary p-2.5 shadow-xl shadow-primary/20 transition-transform duration-500 group-hover:rotate-12 sm:rounded-2xl sm:p-3">
                <Package className="h-6 w-6 text-white sm:h-7 sm:w-7" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-text-main sm:text-3xl">Applac</span>
            </Link>
            <p className="max-w-xs text-sm leading-6 text-text-muted">
              Your ultimate destination for premium products and an exceptional shopping experience. Quality guaranteed, satisfaction delivered.
            </p>
            <div className="space-y-3">
              {[
                { icon: Phone, text: "016 568 335" },
                { icon: Mail, text: "limpeavhour@gmail.com" },
              ].map((item) => (
                <div key={item.text} className="group flex cursor-pointer items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border bg-bg-card transition-all group-hover:bg-primary sm:h-9 sm:w-9 sm:rounded-xl" style={{ borderColor: "var(--color-border)" }}>
                    <item.icon className="h-3.5 w-3.5 text-text-muted transition-colors group-hover:text-white sm:h-4 sm:w-4" />
                  </div>
                  <span className="text-xs font-medium tracking-wide text-text-muted transition-colors group-hover:text-primary sm:text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="mb-5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary sm:mb-8 sm:text-xs">Shop</h4>
            <ul className="space-y-3 sm:space-y-3.5">
              {[
                { name: 'All Products', to: '/products' },
                { name: 'New Arrivals', to: '/products?view=new-arrivals' },
                { name: 'Best Sellers', to: '/products?view=best-sellers' },
                { name: 'Deals', to: '/products?view=deals' },
              ].map((link) => (
                <li key={link.name}>
                  <Link to={link.to} className={linkClass}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary sm:mb-8 sm:text-xs">Support</h4>
            <ul className="space-y-3 sm:space-y-3.5">
              {[
                { name: 'Contact', to: '/contact' },
                { name: 'FAQ', to: '/knowledge-base' },
                { name: 'Track Order', to: '/orders/tracking' },
              ].map((link) => (
                <li key={link.name}>
                  <Link to={link.to} className={linkClass}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="col-span-2 sm:col-span-1">
            <h4 className="mb-5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary sm:mb-8 sm:text-xs">Company</h4>
            <ul className="space-y-3 sm:space-y-3.5">
              {[
                { name: 'About Us', to: '/about' },
                { name: 'Location', to: '/location' },
                { name: 'Privacy Policy', to: '/privacy' },
                { name: 'Terms of Service', to: '/terms' },
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
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted/50">
            &copy; {currentYear} Applac Inc. All rights reserved.
          </p>

          <div className="flex items-center gap-3">
            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg border bg-bg-card transition-all hover:border-primary hover:bg-primary active:scale-90 sm:h-10 sm:w-10 sm:rounded-xl"
                style={{ borderColor: "var(--color-border)" }}
              >
                <Icon className="h-3.5 w-3.5 text-text-muted transition-all group-hover:scale-110 group-hover:text-white sm:h-4 sm:w-4" />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-lg border bg-bg-card px-3 py-1.5 opacity-60" style={{ borderColor: "var(--color-border)" }}>
            <Shield className="h-3 w-3 text-text-muted" strokeWidth={3} />
            <span className="text-[10px] font-bold tracking-widest text-text-muted">SECURED</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
