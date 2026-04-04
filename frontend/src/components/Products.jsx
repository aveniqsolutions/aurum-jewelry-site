import { useEffect, useRef, useState } from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import axios from 'axios';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export const Products = () => {
  const sectionRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, wishlist, toggleWishlist, loading: cartLoading } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API}/api/products?bestseller=true`);
        setProducts(response.data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        // Fallback products
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

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
  }, [products]);

  const handleAddToCart = async (product) => {
    const success = await addToCart(product.id);
    if (success) {
      toast.success(`${product.name} added to cart`, {
        className: 'toast-success',
      });
    }
  };

  const handleToggleWishlist = (productId) => {
    toggleWishlist(productId);
    const isInWishlist = wishlist.includes(productId);
    toast.success(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist', {
      className: 'toast-success',
    });
  };

  if (loading) {
    return (
      <section className="py-24 md:py-32 lg:py-40 px-6 md:px-12 lg:px-24 bg-[#faf8f4]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-[#e8d5a3]/30 mb-4" />
                <div className="h-4 bg-[#e8d5a3]/30 w-3/4 mb-2" />
                <div className="h-3 bg-[#e8d5a3]/30 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      id="bestsellers"
      ref={sectionRef}
      data-testid="products-section"
      className="py-24 md:py-32 lg:py-40 px-6 md:px-12 lg:px-24 bg-[#faf8f4]"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 scroll-reveal">
          <span className="overline" data-testid="products-label">Most Loved</span>
          <h2 
            data-testid="products-heading"
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light mt-4 text-[#1a1a1a]"
          >
            Pieces they come back for
          </h2>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {products.map((product, index) => (
            <div 
              key={product.id}
              data-testid={`product-card-${product.id}`}
              className="product-card group scroll-reveal relative"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {/* Image Container */}
              <div className="relative aspect-[3/4] overflow-hidden mb-4 bg-gradient-to-br from-[#e8d5a3]/20 to-[#f0d9d0]/20">
                <img 
                  src={product.image_url}
                  alt={product.name}
                  className="product-image w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Wishlist Button */}
                <button 
                  data-testid={`wishlist-btn-${product.id}`}
                  onClick={() => handleToggleWishlist(product.id)}
                  className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                >
                  <Heart 
                    size={18} 
                    className={`transition-all duration-300 ${
                      wishlist.includes(product.id) 
                        ? 'text-[#c9a84c] fill-[#c9a84c] animate-pulse-gold' 
                        : 'text-[#1a1a1a]/60'
                    }`}
                    strokeWidth={1.5}
                  />
                </button>

                {/* Add to Cart - Slides up on hover */}
                <div className="add-to-cart absolute bottom-0 left-0 right-0 p-4">
                  <button 
                    data-testid={`add-to-cart-btn-${product.id}`}
                    onClick={() => handleAddToCart(product)}
                    disabled={cartLoading}
                    className="w-full bg-[#1a1a1a] text-[#faf8f4] py-3 text-sm tracking-wider uppercase hover:bg-[#c9a84c] transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingBag size={16} strokeWidth={1.5} />
                    Add to Cart
                  </button>
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-1">
                <h3 
                  data-testid={`product-name-${product.id}`}
                  className="font-serif text-lg text-[#1a1a1a]"
                >
                  {product.name}
                </h3>
                <p className="text-xs text-[#4a4a4a]/70 tracking-wide">
                  {product.material}
                </p>
                <p 
                  data-testid={`product-price-${product.id}`}
                  className="text-sm font-medium text-[#1a1a1a] pt-1"
                >
                  ${product.price.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
