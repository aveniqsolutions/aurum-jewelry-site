import { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

const collections = [
  {
    name: 'Lumière',
    description: 'Radiant pieces that capture light and turn heads.',
    pieces: 24,
    category: 'rings',
    image: 'https://images.pexels.com/photos/5737277/pexels-photo-5737277.jpeg?auto=compress&w=800',
    bgColor: 'from-[#f0d9d0]/40 to-[#e8d5a3]/20'
  },
  {
    name: 'Éternel',
    description: 'Timeless classics that transcend seasons and trends.',
    pieces: 18,
    category: 'bracelets',
    image: 'https://images.unsplash.com/photo-1767249622437-dd837fc5ff3b?w=800&q=80',
    bgColor: 'from-[#e8d5a3]/40 to-[#faf8f4]/60'
  },
  {
    name: 'Solstice',
    description: 'Bold statements for those who dare to shine.',
    pieces: 16,
    category: 'necklaces',
    image: 'https://images.unsplash.com/photo-1773929345739-94db8a4ccd0c?w=800&q=80',
    bgColor: 'from-[#faf8f4]/60 to-[#f0d9d0]/30'
  }
];

export const Collections = () => {
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

  const scrollToProducts = (category) => {
    const productsSection = document.querySelector('#bestsellers');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="collections"
      ref={sectionRef}
      data-testid="collections-section"
      className="py-24 md:py-32 lg:py-40 px-6 md:px-12 lg:px-24 bg-[#faf8f4]"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 scroll-reveal">
          <span className="overline" data-testid="collections-label">The Collections</span>
          <h2 
            data-testid="collections-heading"
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light mt-4 text-[#1a1a1a]"
          >
            Curated for the discerning
          </h2>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {collections.map((collection, index) => (
            <div 
              key={collection.name}
              data-testid={`collection-card-${collection.name.toLowerCase()}`}
              className="group scroll-reveal cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => scrollToProducts(collection.category)}
            >
              {/* Image Container */}
              <div className="relative aspect-[3/4] overflow-hidden mb-6">
                <div className={`absolute inset-0 bg-gradient-to-br ${collection.bgColor}`} />
                <img 
                  src={collection.image}
                  alt={collection.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <h3 
                  data-testid={`collection-name-${collection.name.toLowerCase()}`}
                  className="font-serif text-2xl font-light text-[#1a1a1a]"
                >
                  {collection.name}
                </h3>
                <p className="text-sm text-[#4a4a4a] leading-relaxed">
                  {collection.description}
                </p>
                <p className="text-xs text-[#4a4a4a]/60 mt-2">
                  {collection.pieces} pieces
                </p>
                <button 
                  data-testid={`collection-explore-${collection.name.toLowerCase()}`}
                  className="inline-flex items-center gap-2 text-sm text-[#1a1a1a] mt-4 group/link"
                >
                  <span className="border-b border-transparent group-hover/link:border-[#c9a84c] group-hover/link:text-[#c9a84c] transition-all duration-300">
                    Explore
                  </span>
                  <ArrowRight size={14} className="group-hover/link:translate-x-1 group-hover/link:text-[#c9a84c] transition-all duration-300" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
