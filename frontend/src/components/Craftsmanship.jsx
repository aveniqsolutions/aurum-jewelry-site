import { useEffect, useRef } from 'react';

export const Craftsmanship = () => {
  const sectionRef = useRef(null);

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

  return (
    <section 
      id="craftsmanship"
      ref={sectionRef}
      data-testid="craftsmanship-section"
      className="py-24 md:py-32 lg:py-40 px-6 md:px-12 lg:px-24 bg-[#faf8f4]"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Image */}
          <div className="scroll-reveal">
            <div className="relative aspect-[4/5] overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1608112169461-48616144c894?w=800&q=80"
                alt="Master artisan crafting jewelry"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/10 to-transparent" />
            </div>
          </div>

          {/* Content */}
          <div className="scroll-reveal space-y-8" id="about">
            <div>
              <span className="overline" data-testid="craftsmanship-label">Craftsmanship</span>
              <h2 
                data-testid="craftsmanship-heading"
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light mt-4 text-[#1a1a1a] leading-tight"
              >
                Every piece tells a story only you can finish
              </h2>
            </div>

            <div className="space-y-6 text-[#4a4a4a] leading-relaxed">
              <p>
                In our atelier nestled in the heart of Florence, master artisans transform pure silver into wearable art. Each piece begins as a vision — a whisper of elegance waiting to be realized through hands that have perfected their craft over generations.
              </p>
              <p>
                We source only the finest materials: pure silver that gleams with timeless beauty, 18-karat gold for our signature plating, and ethically sourced diamonds that capture light like frozen starlight. From initial sketch to final polish, every Aurum creation undergoes 47 meticulous steps.
              </p>
            </div>

            {/* Stats */}
            <div 
              data-testid="craftsmanship-stats"
              className="flex flex-wrap gap-4 pt-4"
            >
              <div className="px-6 py-3 border border-[#c9a84c]/20 bg-white/50">
                <span className="text-sm text-[#4a4a4a]">Est. 2009</span>
              </div>
              <div className="px-6 py-3 border border-[#c9a84c]/20 bg-white/50">
                <span className="text-sm text-[#4a4a4a]">14,000+ Pieces Sold</span>
              </div>
              <div className="px-6 py-3 border border-[#c9a84c]/20 bg-white/50">
                <span className="text-sm text-[#4a4a4a]">40+ Master Artisans</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
