import { useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  {
    quote: "The Lumière ring has become my signature piece. The craftsmanship is simply unparalleled — every time I wear it, I receive compliments.",
    author: "Charlotte M.",
    location: "Paris, France",
    rating: 5
  },
  {
    quote: "I've collected jewelry for years, but nothing compares to Aurum's attention to detail. The gold plating is flawless and the silver quality exceptional.",
    author: "Isabella R.",
    location: "Milan, Italy",
    rating: 5
  },
  {
    quote: "My bridal set from Aurum made my wedding day even more special. The pieces are elegant, timeless, and feel like heirlooms already.",
    author: "Sophia L.",
    location: "London, UK",
    rating: 5
  },
  {
    quote: "The customer service matched the quality of the jewelry — impeccable. My Éternel bracelet arrived beautifully packaged and exactly as described.",
    author: "Emma K.",
    location: "New York, USA",
    rating: 5
  }
];

export const Testimonials = () => {
  const sectionRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  // Auto-cycle testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section 
      ref={sectionRef}
      data-testid="testimonials-section"
      className="py-24 md:py-32 lg:py-40 px-6 md:px-12 lg:px-24 bg-[#faf8f4]/50"
    >
      <div className="max-w-4xl mx-auto text-center scroll-reveal">
        {/* Gold Quote Mark */}
        <div className="text-[#c9a84c] text-8xl font-serif leading-none mb-8">"</div>

        {/* Testimonial Content */}
        <div 
          data-testid="testimonial-content"
          className="min-h-[200px] flex flex-col items-center justify-center"
        >
          <p 
            key={currentIndex}
            className="font-serif text-xl sm:text-2xl lg:text-3xl font-light text-[#1a1a1a] leading-relaxed italic animate-fade-in-up"
          >
            {currentTestimonial.quote}
          </p>

          {/* Rating */}
          <div 
            data-testid="testimonial-rating"
            className="flex gap-1 mt-8"
          >
            {[...Array(currentTestimonial.rating)].map((_, i) => (
              <Star 
                key={i} 
                size={16} 
                className="text-[#c9a84c] fill-[#c9a84c]" 
              />
            ))}
          </div>

          {/* Author */}
          <div className="mt-6">
            <p 
              data-testid="testimonial-author"
              className="text-sm font-medium text-[#1a1a1a]"
            >
              {currentTestimonial.author}
            </p>
            <p className="text-xs text-[#4a4a4a] mt-1">
              {currentTestimonial.location}
            </p>
          </div>
        </div>

        {/* Dot Indicators */}
        <div 
          data-testid="testimonial-dots"
          className="flex justify-center gap-2 mt-12"
        >
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-[#c9a84c] w-6' 
                  : 'bg-[#c9a84c]/30 hover:bg-[#c9a84c]/50'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
