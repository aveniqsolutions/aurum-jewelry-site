import { useState, useEffect } from 'react';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { Link, useLocation } from 'react-router-dom';

export const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { setIsCartOpen, cartCount } = useCart();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Collections', href: '#collections' },
    { name: 'Craftsmanship', href: '#craftsmanship' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#footer' },
  ];

  const scrollToSection = (e, href) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      window.location.href = '/' + href;
      return;
    }
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav 
        data-testid="main-navigation"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'glass border-b border-[#c9a84c]/10' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="flex items-center justify-between h-20">
            {/* Mobile Menu Button */}
            <button 
              data-testid="mobile-menu-btn"
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo */}
            <Link 
              to="/" 
              data-testid="nav-logo"
              className="font-serif text-2xl tracking-[0.3em] text-[#1a1a1a]"
            >
              AURUM
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-12">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  data-testid={`nav-link-${link.name.toLowerCase()}`}
                  onClick={(e) => scrollToSection(e, link.href)}
                  className="text-sm tracking-wider text-[#1a1a1a]/80 hover:text-[#c9a84c] transition-colors duration-300"
                >
                  {link.name}
                </a>
              ))}
            </div>

            {/* Cart Icon */}
            <button 
              data-testid="cart-btn"
              className="relative p-2 group"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag 
                size={22} 
                className="text-[#1a1a1a] group-hover:text-[#c9a84c] transition-colors duration-300" 
                strokeWidth={1.5}
              />
              {cartCount > 0 && (
                <span 
                  data-testid="cart-count"
                  className="absolute -top-1 -right-1 w-5 h-5 bg-[#c9a84c] text-[#faf8f4] text-xs flex items-center justify-center rounded-full animate-fade-in-up"
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div 
        data-testid="mobile-menu"
        className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}
      >
        <div className="flex flex-col items-center justify-center h-full space-y-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => scrollToSection(e, link.href)}
              className="font-serif text-3xl text-[#1a1a1a] hover:text-[#c9a84c] transition-colors"
            >
              {link.name}
            </a>
          ))}
          <Link 
            to="/admin/login" 
            className="text-sm tracking-wider text-[#1a1a1a]/60 hover:text-[#c9a84c] mt-8"
            onClick={() => setMobileMenuOpen(false)}
          >
            Admin
          </Link>
        </div>
      </div>
    </>
  );
};
