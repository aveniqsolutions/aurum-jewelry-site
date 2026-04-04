import { useEffect, useState, useRef } from 'react';
import { Navigation } from '../components/Navigation';
import { Hero } from '../components/Hero';
import { Collections } from '../components/Collections';
import { Products } from '../components/Products';
import { Craftsmanship } from '../components/Craftsmanship';
import { Testimonials } from '../components/Testimonials';
import { Instagram } from '../components/Instagram';
import { Newsletter } from '../components/Newsletter';
import { Footer } from '../components/Footer';
import { CartSidebar } from '../components/CartSidebar';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export const LandingPage = () => {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorRingPos, setCursorRingPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const cursorRef = useRef(null);

  // Custom cursor effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
      
      // Delayed ring follow
      setTimeout(() => {
        setCursorRingPos({ x: e.clientX, y: e.clientY });
      }, 50);
    };

    const handleMouseOver = (e) => {
      if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  // Check for success/cancelled URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const sessionId = urlParams.get('session_id');
    const cancelled = urlParams.get('cancelled');

    if (success === 'true' && sessionId) {
      // Poll for payment status
      const pollPaymentStatus = async (attempts = 0) => {
        if (attempts >= 5) {
          toast.success('Order confirmed — your piece is being crafted.', {
            className: 'success-toast toast-success',
            duration: 5000,
          });
          return;
        }

        try {
          const response = await axios.get(`${API}/api/checkout/status/${sessionId}`);
          if (response.data.payment_status === 'paid') {
            toast.success('Order confirmed — your piece is being crafted.', {
              className: 'success-toast toast-success',
              duration: 5000,
            });
          } else if (response.data.status === 'expired') {
            toast.error('Payment session expired. Please try again.');
          } else {
            // Continue polling
            setTimeout(() => pollPaymentStatus(attempts + 1), 2000);
          }
        } catch {
          // Show success anyway since we redirected from Stripe
          toast.success('Order confirmed — your piece is being crafted.', {
            className: 'success-toast toast-success',
            duration: 5000,
          });
        }
      };

      pollPaymentStatus();

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (cancelled === 'true') {
      toast.info('Checkout cancelled. Your items are still in your bag.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div className="grain-overlay min-h-screen bg-[#faf8f4]">
      {/* Custom Cursor - Hidden on mobile/touch */}
      <div 
        className="custom-cursor hidden lg:block"
        style={{ left: cursorPos.x, top: cursorPos.y }}
      />
      <div 
        className={`custom-cursor-ring hidden lg:block ${isHovering ? 'hover' : ''}`}
        style={{ left: cursorRingPos.x, top: cursorRingPos.y }}
      />

      <Navigation />
      <CartSidebar />
      
      <main data-testid="landing-page-main">
        <Hero />
        <Collections />
        <Products />
        <Craftsmanship />
        <Testimonials />
        <Instagram />
        <Newsletter />
      </main>
      
      <Footer />
    </div>
  );
};
