import { Instagram, MapPin, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      id="footer"
      data-testid="footer-section"
      className="py-16 md:py-24 px-6 md:px-12 lg:px-24 bg-[#1a1a1a] text-[#faf8f4]"
    >
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <h3 
              data-testid="footer-logo"
              className="font-serif text-2xl tracking-[0.3em]"
            >
              AURUM
            </h3>
            <p className="text-sm text-[#faf8f4]/60 leading-relaxed">
              Handcrafted luxury jewelry in pure silver with 18K gold plating. 
              Every piece tells a story only you can finish.
            </p>
            {/* Social Icons */}
            <div 
              data-testid="footer-social"
              className="flex gap-4"
            >
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 border border-[#faf8f4]/20 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors"
              >
                <Instagram size={18} strokeWidth={1.5} />
              </a>
              <a 
                href="https://pinterest.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 border border-[#faf8f4]/20 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 12a4 4 0 1 0 8 0c0-2-1.5-4-4-4s-4 2-4 4z"/>
                  <path d="M9 16c.5 1.5 1.5 4 2 5"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </a>
              <a 
                href="https://tiktok.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 border border-[#faf8f4]/20 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Collections Column */}
          <div>
            <h4 
              data-testid="footer-collections-title"
              className="text-xs tracking-[0.2em] uppercase text-[#c9a84c] mb-6"
            >
              Collections
            </h4>
            <ul className="space-y-3">
              <li><a href="#collections" className="text-sm text-[#faf8f4]/70 hover:text-[#c9a84c] transition-colors">Rings</a></li>
              <li><a href="#collections" className="text-sm text-[#faf8f4]/70 hover:text-[#c9a84c] transition-colors">Bracelets</a></li>
              <li><a href="#collections" className="text-sm text-[#faf8f4]/70 hover:text-[#c9a84c] transition-colors">Necklaces</a></li>
              <li><a href="#collections" className="text-sm text-[#faf8f4]/70 hover:text-[#c9a84c] transition-colors">Luxury Sets</a></li>
              <li><a href="#bestsellers" className="text-sm text-[#faf8f4]/70 hover:text-[#c9a84c] transition-colors">Best Sellers</a></li>
            </ul>
          </div>

          {/* Customer Care Column */}
          <div>
            <h4 
              data-testid="footer-care-title"
              className="text-xs tracking-[0.2em] uppercase text-[#c9a84c] mb-6"
            >
              Customer Care
            </h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-[#faf8f4]/70 hover:text-[#c9a84c] transition-colors">Shipping & Delivery</a></li>
              <li><a href="#" className="text-sm text-[#faf8f4]/70 hover:text-[#c9a84c] transition-colors">Returns & Exchanges</a></li>
              <li><a href="#" className="text-sm text-[#faf8f4]/70 hover:text-[#c9a84c] transition-colors">Ring Sizing Guide</a></li>
              <li><a href="#" className="text-sm text-[#faf8f4]/70 hover:text-[#c9a84c] transition-colors">Care Instructions</a></li>
              <li><a href="#" className="text-sm text-[#faf8f4]/70 hover:text-[#c9a84c] transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 
              data-testid="footer-contact-title"
              className="text-xs tracking-[0.2em] uppercase text-[#c9a84c] mb-6"
            >
              Contact
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-[#c9a84c] mt-0.5" strokeWidth={1.5} />
                <span className="text-sm text-[#faf8f4]/70">
                  Via della Vigna Nuova, 18<br />
                  50123 Florence, Italy
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-[#c9a84c]" strokeWidth={1.5} />
                <a href="mailto:hello@aurum.com" className="text-sm text-[#faf8f4]/70 hover:text-[#c9a84c] transition-colors">
                  hello@aurum.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-[#c9a84c]" strokeWidth={1.5} />
                <a href="tel:+39055123456" className="text-sm text-[#faf8f4]/70 hover:text-[#c9a84c] transition-colors">
                  +39 055 123 456
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#c9a84c]/20 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p 
              data-testid="footer-copyright"
              className="text-xs text-[#faf8f4]/40"
            >
              © {currentYear} Aurum. All rights reserved.
            </p>

            {/* Admin Link */}
            <Link 
              to="/admin/login"
              data-testid="footer-admin-link"
              className="text-xs text-[#faf8f4]/40 hover:text-[#c9a84c] transition-colors"
            >
              Admin
            </Link>

            {/* Payment Icons */}
            <div 
              data-testid="footer-payment-icons"
              className="flex items-center gap-4"
            >
              <span className="text-xs text-[#faf8f4]/40">We accept:</span>
              <div className="flex gap-2">
                <div className="px-2 py-1 bg-[#faf8f4]/10 text-xs">Visa</div>
                <div className="px-2 py-1 bg-[#faf8f4]/10 text-xs">Mastercard</div>
                <div className="px-2 py-1 bg-[#faf8f4]/10 text-xs">Stripe</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
