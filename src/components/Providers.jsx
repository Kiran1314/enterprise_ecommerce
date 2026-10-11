'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

import { usePathname } from 'next/navigation';

import CartDrawer from './CartDrawer';
import ContactButtons from './ContactButtons';
import Footer from './Footer';

const CartContext = createContext(undefined);

export function Providers({ children }) {
  const pathname = usePathname();

  const [cart, setCart] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load the existing cart from localStorage.
  useEffect(() => {
    const saved = localStorage.getItem('cart');

    Promise.resolve().then(() => {
      if (saved) {
        try {
          setCart(JSON.parse(saved));
        } catch {
          // Ignore invalid cart data.
        }
      }

      setCartLoaded(true);
    });
  }, []);

  // Persist cart changes.
  useEffect(() => {
    if (cartLoaded) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, cartLoaded]);

  // Add a product to the cart.
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item._id === product._id &&
          item.title === product.title
      );

      if (existing) {
        return prev.map((item) =>
          item._id === product._id &&
          item.title === product.title
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [...prev, { ...product, quantity: 1 }];
    });

    setIsCartOpen(true);
  };

  // Remove a product from the cart.
  const removeFromCart = (id, title) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(item._id === id && item.title === title)
      )
    );
  };

  // Update product quantity.
  const updateQuantity = (id, title, qty) => {
    if (qty <= 0) {
      removeFromCart(id, title);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item._id === id && item.title === title
          ? { ...item, quantity: qty }
          : item
      )
    );
  };

  // Clear the cart.
  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}

      <CartDrawer />

      {!pathname.startsWith('/admin') && (
        <ContactButtons />
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      'useCart must be used within a Providers wrapper'
    );
  }

  return context;
}