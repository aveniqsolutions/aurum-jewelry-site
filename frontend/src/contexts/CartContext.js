import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [wishlist, setWishlist] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/api/cart`, { withCredentials: true });
      setCart({
        items: response.data?.items || [],
        total: response.data?.total || 0,
        session_id: response.data?.session_id
      });
    } catch {
      setCart({ items: [], total: 0 });
    }
  }, []);

  const fetchWishlist = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/api/wishlist`, { withCredentials: true });
      setWishlist(response.data.items || []);
    } catch {
      setWishlist([]);
    }
  }, []);

  useEffect(() => {
    fetchCart();
    fetchWishlist();
  }, [fetchCart, fetchWishlist]);

  const addToCart = async (productId, quantity = 1) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/api/cart`, 
        { product_id: productId, quantity },
        { withCredentials: true }
      );
      setCart(response.data);
      // Store session_id in cookie if needed
      if (response.data.session_id) {
        document.cookie = `cart_session=${response.data.session_id}; path=/; max-age=604800`;
      }
      return true;
    } catch (error) {
      console.error('Failed to add to cart:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId) => {
    setLoading(true);
    try {
      const response = await axios.delete(`${API}/api/cart/${productId}`, { withCredentials: true });
      setCart(response.data);
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    setLoading(true);
    try {
      const response = await axios.put(`${API}/api/cart/${productId}?quantity=${quantity}`, {}, { withCredentials: true });
      setCart(response.data);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (productId) => {
    try {
      if (wishlist.includes(productId)) {
        const response = await axios.delete(`${API}/api/wishlist/${productId}`, { withCredentials: true });
        setWishlist(response.data.items || []);
        if (response.data.session_id) {
          document.cookie = `wishlist_session=${response.data.session_id}; path=/; max-age=604800`;
        }
      } else {
        const response = await axios.post(`${API}/api/wishlist/${productId}`, {}, { withCredentials: true });
        setWishlist(response.data.items || []);
        if (response.data.session_id) {
          document.cookie = `wishlist_session=${response.data.session_id}; path=/; max-age=604800`;
        }
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    }
  };

  const clearCart = () => {
    setCart({ items: [], total: 0 });
  };

  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      wishlist,
      isCartOpen,
      setIsCartOpen,
      loading,
      addToCart,
      removeFromCart,
      updateQuantity,
      toggleWishlist,
      clearCart,
      cartCount,
      fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
};
