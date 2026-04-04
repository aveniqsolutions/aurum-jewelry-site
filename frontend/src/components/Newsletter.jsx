import { useEffect, useRef, useState } from 'react';
import { Lock, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export const Newsletter = () => {
  const sectionRef = useRef(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = sectionRef.current?.querySelectorAll('.scroll-reveal');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/api/newsletter`, { email });
      setSubscribed(true);
      setEmail('');
      toast.success('Welcome to the circle of quiet luxury');
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section 
      ref={sectionRef}
      data-testid="newsletter-section"
      className="py-24 md:py-32 px-6 md:px-12 lg:px-24 bg-[#e8d5a3]"
    >
      <div className="max-w-2xl mx-auto text-center scroll-reveal">
        <h2 
          data-testid="newsletter-heading"
          className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-[#1a1a1a]"
        >
          Join the circle of quiet luxury
        </h2>
        <p className="text-[#1a1a1a]/70 mt-4 mb-8">
          Be the first to discover new collections, exclusive pieces, and members-only offers.
        </p>

        {subscribed ? (
          <div 
            data-testid="newsletter-success"
            className="flex items-center justify-center gap-3 text-[#1a1a1a]"
          >
            <CheckCircle size={24} className="text-[#c9a84c]" />
            <span className="font-serif text-xl">Welcome to Aurum</span>
          </div>
        ) : (
          <form 
            onSubmit={handleSubmit}
            data-testid="newsletter-form"
            className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              data-testid="newsletter-email-input"
              className="flex-1 px-0 py-3 bg-transparent border-b border-[#1a1a1a]/30 focus:border-[#1a1a1a] text-[#1a1a1a] placeholder:text-[#1a1a1a]/50 text-center sm:text-left transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              data-testid="newsletter-submit-btn"
              className="px-8 py-3 bg-[#1a1a1a] text-[#faf8f4] text-sm tracking-wider uppercase hover:bg-[#c9a84c] transition-colors disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join'}
            </button>
          </form>
        )}

        {/* Trust Signals */}
        <div 
          data-testid="newsletter-trust-signals"
          className="flex flex-wrap items-center justify-center gap-4 mt-8 text-xs text-[#1a1a1a]/60"
        >
          <span className="flex items-center gap-1">
            <Lock size={12} />
            No spam
          </span>
          <span>·</span>
          <span>Unsubscribe anytime</span>
          <span>·</span>
          <span>Members-only access</span>
        </div>
      </div>
    </section>
  );
};
