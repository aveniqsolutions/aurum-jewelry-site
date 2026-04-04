import { useEffect, useRef } from 'react';

export const Hero = () => {
  const heroRef = useRef(null);

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

    const elements = heroRef.current?.querySelectorAll('.scroll-reveal');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const scrollToProducts = () => {
    document.querySelector('#bestsellers')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToCraftsmanship = () => {
    document.querySelector('#craftsmanship')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section 
      ref={heroRef}
      data-testid="hero-section"
      className="min-h-screen pt-20 flex flex-col"
    >
      {/* Main Hero Content */}
      <div className="flex-1 flex flex-col lg:flex-row items-center px-6 md:px-12 lg:px-24 py-12 lg:py-0">
        {/* Left - Text Content */}
        <div className="lg:w-1/2 space-y-8 lg:pr-12">
          <h1 
            data-testid="hero-headline"
            className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-light tracking-tight leading-[1.1] text-[#1a1a1a] opacity-0 animate-fade-in-up"
          >
            Worn by those who need no introduction
          </h1>
          <p 
            data-testid="hero-subtext"
            className="text-base lg:text-lg text-[#4a4a4a] leading-relaxed max-w-lg opacity-0 animate-fade-in-up delay-100"
          >
            Handcrafted luxury jewelry in pure silver with 18K gold plating. Each piece tells a story only you can finish.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4 opacity-0 animate-fade-in-up delay-200">
            <button 
              data-testid="hero-shop-btn"
              onClick={scrollToProducts}
              className="btn-gold"
            >
              Shop Collection
            </button>
            <button 
              data-testid="hero-story-btn"
              onClick={scrollToCraftsmanship}
              className="btn-ghost"
            >
              Our Story
            </button>
          </div>
        </div>

        {/* Right - Product Image */}
        <div className="lg:w-1/2 mt-12 lg:mt-0 flex justify-center items-center">
          <div 
            data-testid="hero-product-image"
            className="relative w-full max-w-lg aspect-[3/4] opacity-0 animate-fade-in-up delay-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#e8d5a3]/30 to-[#f0d9d0]/30 rounded-none" />
            <img 
              src="https://images.unsplash.com/photo-1622398925373-3f91b1e275f5?w=800&q=80"
              alt="Luxury Gold Ring"
              className="w-full h-full object-cover animate-float"
              loading="eager"
            />
          </div>
        </div>
      </div>

      {/* Marquee Strip */}
      <div 
        data-testid="hero-marquee"
        className="border-t border-b border-[#c9a84c]/20 py-4 overflow-hidden bg-[#faf8f4]"
      >
        <div className="animate-marquee whitespace-nowrap flex">
          {[...Array(2)].map((_, idx) => (
            <div key={idx} className="flex items-center space-x-8 mx-4">
              <span className="text-sm tracking-wider text-[#4a4a4a]">Free shipping over €150</span>
              <span className="text-[#c9a84c]">·</span>
              <span className="text-sm tracking-wider text-[#4a4a4a]">Handcrafted in Italy</span>
              <span className="text-[#c9a84c]">·</span>
              <span className="text-sm tracking-wider text-[#4a4a4a]">18K Gold</span>
              <span className="text-[#c9a84c]">·</span>
              <span className="text-sm tracking-wider text-[#4a4a4a]">Conflict-Free Diamonds</span>
              <span className="text-[#c9a84c]">·</span>
              <span className="text-sm tracking-wider text-[#4a4a4a]">Lifetime Warranty</span>
              <span className="text-[#c9a84c]">·</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
