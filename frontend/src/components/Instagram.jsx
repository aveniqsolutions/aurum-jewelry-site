import { useEffect, useRef } from 'react';

const instagramImages = [
  'https://images.unsplash.com/photo-1761420570875-b8ca70228e64?w=400&q=80',
  'https://images.unsplash.com/photo-1771695828792-112e299755bc?w=400&q=80',
  'https://images.unsplash.com/photo-1761475375956-484196fedaae?w=400&q=80',
  'https://images.unsplash.com/photo-1770777352898-f0f02bcfb44f?w=400&q=80',
  'https://images.unsplash.com/photo-1771091052749-1ab149f9158c?w=400&q=80',
  'https://images.unsplash.com/photo-1644613536367-69728d99cad5?w=400&q=80',
];

export const Instagram = () => {
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
      ref={sectionRef}
      data-testid="instagram-section"
      className="py-24 md:py-32 px-6 md:px-12 lg:px-24 bg-[#faf8f4]"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 scroll-reveal">
          <span className="overline" data-testid="instagram-label">As Seen On @AURUM</span>
        </div>

        {/* Instagram Grid */}
        <div 
          data-testid="instagram-grid"
          className="grid grid-cols-3 md:grid-cols-6 gap-1 scroll-reveal"
        >
          {instagramImages.map((image, index) => (
            <a 
              key={index}
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`instagram-tile-${index}`}
              className="relative aspect-square overflow-hidden group"
            >
              <img 
                src={image}
                alt={`Instagram post ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-[#c9a84c]/0 group-hover:bg-[#c9a84c]/20 transition-colors duration-300" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
