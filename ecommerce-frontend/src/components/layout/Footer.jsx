import { Link } from "react-router-dom";
import {
  Package,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Send,
  CreditCard,
  Shield,
  Truck,
  Heart,
} from "lucide-react";
import { useDarkMode } from "../../hooks";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [isDark] = useDarkMode();

  return (
    <footer className={`border-t font-sans relative overflow-hidden mb-14 md:mb-0 transition-colors duration-300 ${isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-stone-100 text-text-main"}`}>
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[20rem] sm:w-[40rem] h-[20rem] sm:h-[40rem] bg-primary/5 rounded-full blur-[80px] sm:blur-[120px] -mr-20 sm:-mr-40 -mt-20 sm:-mt-40 pointer-events-none"></div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 md:py-24 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12 md:gap-20">
          {/* Brand Section */}
          <div className="col-span-2 space-y-6 sm:space-y-10">
            <Link to="/" className="flex items-center gap-3 sm:gap-4 group">
              <div className="bg-primary p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transform group-hover:rotate-12 transition-transform duration-500 shadow-xl shadow-primary/20">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-main tracking-tight font-display">
                Applac
              </h1>
            </Link>
            <p className="text-text-muted text-xs sm:text-sm font-medium leading-relaxed max-w-sm">
              Your ultimate destination for premium products and exceptional
              shopping experience. Quality guaranteed, satisfaction delivered.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3 sm:gap-4 group cursor-pointer">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center border group-hover:bg-primary transition-all ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}>
                  <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-text-muted group-hover:text-white transition-colors" />
                </div>
                <span className="text-xs sm:text-sm font-medium tracking-wide text-text-muted group-hover:text-primary transition-colors">016568335</span>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 group cursor-pointer">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center border group-hover:bg-primary transition-all ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}>
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-text-muted group-hover:text-white transition-colors" />
                </div>
                <span className="text-xs sm:text-sm font-medium tracking-wide text-text-muted group-hover:text-primary transition-colors">limpeavhour@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-4 sm:mb-10">Shop</h4>
            <ul className="space-y-2.5 sm:space-y-4">
              {[
                { name: 'All Products', to: '/products' },
                { name: 'New Arrivals', to: '/new-arrivals' },
                { name: 'Best Sellers', to: '/bestsellers' },
                { name: 'Deals', to: '/deals' },
                { name: 'Categories', to: '/categories' }
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.to}
                    className="text-xs sm:text-sm font-medium text-text-muted hover:text-primary transition-all hover:translate-x-2 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-4 sm:mb-10">Support</h4>
            <ul className="space-y-2.5 sm:space-y-4">
              {[
                { name: 'Contact', to: '/contact' },
                { name: 'Shipping Info', to: '/shipping' },
                { name: 'Returns', to: '/returns' },
                { name: 'FAQ', to: '/faq' },
                { name: 'Track Order', to: '/track-order' }
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.to}
                    className="text-xs sm:text-sm font-medium text-text-muted hover:text-primary transition-all hover:translate-x-2 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="col-span-2 sm:col-span-1">
            <h4 className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-4 sm:mb-10">Company</h4>
            <ul className="space-y-2.5 sm:space-y-4">
              {[
                { name: 'About Us', to: '/about' },
                { name: 'Location', to: '/location' },
                { name: 'Careers', to: '/careers' },
                { name: 'Privacy Policy', to: '/privacy' },
                { name: 'Terms of Service', to: '/terms' }
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.to}
                    className="text-xs sm:text-sm font-medium text-text-muted hover:text-primary transition-all hover:translate-x-2 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={`border-t py-6 sm:py-12 px-4 sm:px-6 transition-colors duration-300 ${isDark ? "border-slate-800 bg-slate-900/60" : "border-stone-100 bg-stone-50/50"}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6 sm:gap-12">
          {/* Copyright */}
          <p className="text-[9px] sm:text-[10px] font-semibold text-text-muted/60 uppercase tracking-widest order-2 sm:order-1 text-center">
            © {currentYear} Applac Inc. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-3 sm:gap-6 order-1 sm:order-2">
            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center border hover:bg-primary hover:border-primary transition-all group active:scale-90 shadow-sm ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-stone-100"}`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-text-muted group-hover:text-white group-hover:scale-110 transition-all" />
              </a>
            ))}
          </div>

          {/* Security Proofs */}
          <div className="hidden sm:flex items-center gap-4 opacity-40 order-3 group">
            <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg ${isDark ? "border-slate-700 bg-slate-900" : "border-stone-200 bg-white"}`}>
              <Shield className="w-3 h-3 text-text-muted" strokeWidth={3} />
              <span className="text-[10px] font-bold tracking-widest text-text-muted">SECURED</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
