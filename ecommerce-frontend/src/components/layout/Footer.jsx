import { Link } from "react-router-dom";
import {
  Baby,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Shield,
  Truck,
  Twitter,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: "Home", to: "/" },
    { label: "Wishlist", to: "/wishlist" },
    { label: "Cart", to: "/cart" },
    { label: "Orders", to: "/orders" },
  ];

  const companyLinks = [
    { label: "About Us", to: "/about" },
    { label: "Contact", to: "/contact" },
    { label: "Our Location", to: "/location" },
  ];

  const legalLinks = [
    { label: "Knowledge Base", to: "/knowledge-base" },
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms of Service", to: "/terms" },
  ];

  const socials = [
    { href: "https://facebook.com", icon: Facebook, label: "Facebook" },
    { href: "https://twitter.com", icon: Twitter, label: "Twitter" },
    { href: "https://instagram.com", icon: Instagram, label: "Instagram" },
    { href: "https://linkedin.com", icon: Linkedin, label: "LinkedIn" },
  ];

  return (
    <footer className="relative mt-16 overflow-hidden border-t border-primary/12 bg-gradient-to-b from-white via-blue-soft/20 to-secondary-light/26 text-text-main">
      <div className="absolute -left-20 -top-16 h-72 w-72 rounded-full bg-secondary-light/48 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 relative z-10">
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-white/85 px-3.5 py-2 text-sm font-semibold text-text-muted">
            <Shield className="w-4 h-4 text-primary" />
            Secure checkout for every order
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-white/85 px-3.5 py-2 text-sm font-semibold text-text-muted">
            <Truck className="w-4 h-4 text-primary" />
            Fast delivery for baby essentials
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-white/85 px-3.5 py-2 text-sm font-semibold text-text-muted sm:col-span-2 lg:col-span-1">
            <Baby className="w-4 h-4 text-primary" />
            Curated products parents trust
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-5">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-primary text-white shadow-sm">
                <Baby className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-2xl text-text-main md:text-3xl">LittleNest</h2>
                <p className="text-[10px] uppercase tracking-[0.16em] text-primary">Baby & Parent Care</p>
              </div>
            </Link>

            <p className="max-w-md text-sm leading-relaxed text-text-muted">
              Safe and practical essentials for babies, with warm design and simple shopping parents can trust.
            </p>

            <div className="space-y-2.5 text-sm text-text-muted">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-primary" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-primary" />
                <span>support@shopx.com</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-primary" />
                <span>120 Riverside Avenue, San Francisco, CA</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-primary mb-4">Shop</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-text-muted transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-primary mb-4">Company</h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-text-muted transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-primary mb-4">Support</h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-text-muted transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-5 border-t border-primary/12 pt-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-xs uppercase tracking-[0.12em] text-text-muted">
            © {currentYear} LittleNest. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-md border border-primary/15 bg-white px-3 py-1.5 text-[11px] font-semibold text-text-muted">
              <Shield className="w-3.5 h-3.5 text-primary" />
              Secure Checkout
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-md border border-primary/15 bg-white px-3 py-1.5 text-[11px] font-semibold text-text-muted">
              <Truck className="w-3.5 h-3.5 text-primary" />
              Fast Delivery
            </div>
          </div>

          <div className="flex items-center gap-2" aria-label="Social links">
            {socials.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/15 bg-white text-text-muted transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon className="w-4 h-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
