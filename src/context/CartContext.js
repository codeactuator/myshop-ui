import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null); // Will hold the entire cart object { id, userId, items, totalAmount }
  const { currentUser } = useAuth();

  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchCart = useCallback(async () => {
    if (currentUser) {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const response = await fetch(`${API_URL}/carts?userId=${currentUser.id}`, {
          method: 'GET',
          headers: getHeaders()
        });
        if (response.ok) {
          const data = await response.json();
          setCart(data);
        } else if (response.status === 404) {
          setCart({ userId: currentUser.id, items: [], totalAmount: 0 }); // Initialize empty cart
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
      }
    } else {
      setCart(null); // Clear cart on logout
    }
  }, [currentUser]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const syncCartItem = async (productId, quantity) => {
    if (!currentUser) return;

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const response = await fetch(`${API_URL}/carts/items?userId=${currentUser.id}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ productId, quantity })
      });
      if (response.ok) {
        const data = await response.json();
        setCart(data);
      }
    } catch (error) {
      console.error("Error syncing cart item:", error);
    }
  };

  const addToCart = (product) => {
    if (!currentUser) {
      console.warn("Add to Cart failed: No authenticated user found.");
      return;
    }
    // If the cart failed to load initially, initialize it dynamically
    const currentCart = cart || { userId: currentUser.id, items: [], totalAmount: 0 };
    if (!cart) {
      setCart(currentCart);
    }
    const existingItem = currentCart.items.find(item => item.productId === product.id);
    const quantity = existingItem ? existingItem.quantity + 1 : 1;
    syncCartItem(product.id, quantity);
  };

  const removeFromCart = (productId) => {
    // To remove, we can set the quantity to 0, assuming the backend handles this.
    // Or, if you have a DELETE endpoint, use that.
    // For now, let's assume a DELETE endpoint is better.
    const deleteItem = async () => {
      if (!currentUser) return;
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const response = await fetch(`${API_URL}/carts/items?userId=${currentUser.id}&productId=${productId}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        if (response.ok) {
          const data = await response.json();
          setCart(data);
        }
      } catch (error) {
        console.error("Error removing cart item:", error);
      }
    };
    deleteItem();
  };

  const updateQuantity = (productId, newQuantity) => {
    const item = cart.items.find(i => i.productId === productId);
    if (!item) return;

    const quantityChange = newQuantity - item.quantity;

    if (newQuantity < 1) {
      removeFromCart(productId); // If new quantity is 0 or less, remove the item
    } else {
      syncCartItem(productId, quantityChange); // Send the change in quantity, not the new total
    }
  };

  const clearCart = async () => {
    if (!currentUser || !cart) return;
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const response = await fetch(`${API_URL}/carts?userId=${currentUser.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (response.ok) {
        // Reset the cart on the client side upon successful deletion
        setCart({ userId: currentUser.id, items: [], totalAmount: 0 });
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const value = {
    cartItems: cart?.items || [],
    cartTotal: cart?.totalAmount || 0,
    cartCount: cart?.items?.reduce((count, item) => count + item.quantity, 0) || 0,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};