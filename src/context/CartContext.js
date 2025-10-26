import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null); // Will hold the entire cart object { id, userId, items, totalAmount }
  const { currentUser } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

  const fetchCart = useCallback(async () => {
    if (currentUser) {
      try {
        const response = await fetch(`${API_URL}/carts?userId=${currentUser.id}`);
        if (response.ok) {
          const data = await response.json();
          setCart(data);
        } else if (response.status === 404) {
          setCart({ userId: currentUser.id, items: [], totalAmount: 0 }); // Initialize empty cart
        } else {
          throw new Error('Failed to fetch cart');
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
      }
    } else {
      setCart(null); // Clear cart on logout
    }
  }, [currentUser, API_URL]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const syncCartItem = async (productId, quantity) => {
    if (!currentUser) return;

    try {
      const response = await fetch(`${API_URL}/carts/items?userId=${currentUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });

      if (response.ok) {
        const updatedCart = await response.json();
        setCart(updatedCart);
      } else {
        throw new Error('Failed to update cart item.');
      }
    } catch (error) {
      console.error("Error syncing cart item:", error);
    }
  };

  const addToCart = (product) => {
    if (!cart) return;
    const existingItem = cart.items.find(item => item.product?.id === product.id);
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
        const response = await fetch(`${API_URL}/carts/items?userId=${currentUser.id}&productId=${productId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          const updatedCart = await response.json();
          setCart(updatedCart);
        } else {
          throw new Error('Failed to remove item from cart.');
        }
      } catch (error) {
        console.error("Error removing cart item:", error);
      }
    };
    deleteItem();
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId);
    } else {
      syncCartItem(productId, quantity);
    }
  };

  const clearCart = async () => {
    if (!currentUser || !cart) return;
    try {
      const response = await fetch(`${API_URL}/carts?userId=${currentUser.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        // Reset the cart on the client side after successful server-side deletion
        setCart({ userId: currentUser.id, items: [], totalAmount: 0 });
      } else {
        throw new Error('Failed to clear cart on server.');
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