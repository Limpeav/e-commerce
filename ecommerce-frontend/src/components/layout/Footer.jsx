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

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-stone-100 text-text-main font-sans relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none"></div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-20">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-10">
            <Link to="/" className="flex items-center gap-4 group">
              <div className="bg-primary p-3 rounded-2xl transform group-hover:rotate-12 transition-transform duration-500 shadow-xl shadow-primary/20">
                <Package className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-text-main tracking-tight font-display">
                ShopX
              </h1>
            </Link>
            <p className="text-text-muted text-sm font-medium leading-relaxed max-w-sm">
              Your ultimate destination for premium products and exceptional
              shopping experience. Quality guaranteed, satisfaction delivered.
            </p>

            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 group cursor-pointer">
                <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center border border-stone-100 group-hover:bg-primary transition-all">
                  <Phone className="w-4 h-4 text-text-muted group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-medium tracking-wide text-text-muted group-hover:text-primary transition-colors">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-4 group cursor-pointer">
                <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center border border-stone-100 group-hover:bg-primary transition-all">
                  <Mail className="w-4 h-4 text-text-muted group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-medium tracking-wide text-text-muted group-hover:text-primary transition-colors">support@shopx.com</span>
              </div>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-10">Procurement</h4>
            <ul className="space-y-4">
              {[
                { name: 'All Products', to: '/products' },
                { name: 'New Arrivals', to: '/new-arrivals' },
                { name: 'Best Sellers', to: '/bestsellers' },
                { name: 'Strategic Deals', to: '/deals' },
                { name: 'Master Categories', to: '/categories' }
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.to}
                    className="text-sm font-medium text-text-muted hover:text-primary transition-all hover:translate-x-2 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-10">Client Support</h4>
            <ul className="space-y-4">
              {[
                { name: 'Contact', to: '/contact' },
                { name: 'Logistic Info', to: '/shipping' },
                { name: 'Reclamation', to: '/returns' },
                { name: 'Knowledge Base', to: '/knowledge-base' },
                { name: 'Order Telemetry', to: '/track-order' }
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.to}
                    className="text-sm font-medium text-text-muted hover:text-primary transition-all hover:translate-x-2 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-10">Nexus Entity</h4>
            <ul className="space-y-4">
              {[
                { name: 'About us', to: '/about' },
                { name: 'Company location', to: '/location' },
                { name: 'Terminal Careers', to: '/careers' },
                { name: 'Privacy policy', to: '/privacy' },
                { name: 'Service Mandate', to: '/terms' }
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.to}
                    className="text-sm font-medium text-text-muted hover:text-primary transition-all hover:translate-x-2 inline-block"
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
      <div className="border-t border-stone-100 py-12 px-6 bg-stone-50/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          {/* Copyright */}
          <p className="text-[10px] font-semibold text-text-muted/60 uppercase tracking-widest order-2 md:order-1">
            © {currentYear} ShopX Inc. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-6 order-1 md:order-2">
            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-stone-100 hover:bg-primary hover:border-primary transition-all group active:scale-90 shadow-sm"
              >
                <Icon className="w-4 h-4 text-text-muted group-hover:text-white group-hover:scale-110 transition-all" />
              </a>
            ))}
          </div>

          {/* Security Proofs */}
          <div className="flex items-center gap-4 opacity-40 order-3 group">
            <div className="flex items-center gap-2 px-3 py-1.5 border border-stone-200 rounded-lg bg-white">
              <Shield className="w-3 h-3 text-text-muted" strokeWidth={3} />
              <span className="text-[10px] font-bold tracking-widest text-text-muted">SECURED SYNC</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
