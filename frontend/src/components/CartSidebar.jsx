import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import axios from 'axios';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export const CartSidebar = () => {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, loading, clearCart } = useCart();

  const handleCheckout = async () => {
    if (cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      const response = await axios.post(`${API}/api/checkout`, {
        items: cart.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        })),
        origin_url: window.location.origin
      }, { withCredentials: true });

      if (response.data.url) {
        // Clear cart after successful checkout session creation
        clearCart();
        // Redirect to Stripe Checkout
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to create checkout session. Please try again.');
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        data-testid="cart-overlay"
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsCartOpen(false)}
      />

      {/* Sidebar */}
      <div 
        data-testid="cart-sidebar"
        className={`cart-sidebar ${isCartOpen ? 'open' : ''}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#c9a84c]/20">
            <div className="flex items-center gap-3">
              <ShoppingBag size={20} strokeWidth={1.5} />
              <h2 className="font-serif text-xl">Shopping Bag</h2>
              <span className="text-sm text-[#4a4a4a]">({cart.items.length})</span>
            </div>
            <button 
              data-testid="close-cart-btn"
              onClick={() => setIsCartOpen(false)}
              className="p-2 hover:bg-[#e8d5a3]/30 transition-colors"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {cart.items.length === 0 ? (
              <div 
                data-testid="empty-cart-message"
                className="text-center py-12"
              >
                <ShoppingBag size={48} className="mx-auto text-[#c9a84c]/30 mb-4" strokeWidth={1} />
                <p className="text-[#4a4a4a]">Your bag is empty</p>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="mt-4 text-sm underline hover:text-[#c9a84c] transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {cart.items.map((item) => (
                  <div 
                    key={item.product_id}
                    data-testid={`cart-item-${item.product_id}`}
                    className="flex gap-4 pb-6 border-b border-[#c9a84c]/10"
                  >
                    {/* Image */}
                    <div className="w-20 h-24 bg-gradient-to-br from-[#e8d5a3]/20 to-[#f0d9d0]/20 flex-shrink-0">
                      <img 
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-2">
                      <h3 className="font-serif text-sm">{item.name}</h3>
                      <p className="text-sm text-[#4a4a4a]">${item.price.toLocaleString()}</p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <button 
                          data-testid={`decrease-qty-${item.product_id}`}
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          disabled={loading}
                          className="p-1 border border-[#c9a84c]/20 hover:border-[#c9a84c] transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm w-8 text-center">{item.quantity}</span>
                        <button 
                          data-testid={`increase-qty-${item.product_id}`}
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          disabled={loading}
                          className="p-1 border border-[#c9a84c]/20 hover:border-[#c9a84c] transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button 
                      data-testid={`remove-item-${item.product_id}`}
                      onClick={() => removeFromCart(item.product_id)}
                      disabled={loading}
                      className="p-2 text-[#4a4a4a] hover:text-red-500 transition-colors self-start"
                    >
                      <Trash2 size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart.items.length > 0 && (
            <div className="p-6 border-t border-[#c9a84c]/20 space-y-4">
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#4a4a4a]">Subtotal</span>
                <span 
                  data-testid="cart-subtotal"
                  className="font-serif text-lg"
                >
                  ${cart.total.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-[#4a4a4a]">
                Shipping and taxes calculated at checkout
              </p>

              {/* Checkout Button */}
              <button 
                data-testid="checkout-btn"
                onClick={handleCheckout}
                disabled={loading}
                className="w-full btn-gold py-4 flex items-center justify-center gap-2"
              >
                {loading ? 'Processing...' : 'Proceed to Checkout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
