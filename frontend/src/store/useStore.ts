import create from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreState {
  token: string | null;
  setToken: (t: string | null) => void;
  cart: Record<string, number>;
  addToCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  orderStatus: Record<string, string>;
  setOrderStatus: (orderId: string, status: string) => void;
}

export const useAuthStore = create<StoreState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (t) => set({ token: t }),
      cart: {},
      addToCart: (id) =>
        set((s) => ({ cart: { ...s.cart, [id]: (s.cart[id] ?? 0) + 1 } })),
      removeFromCart: (id) =>
        set((s) => {
          const { [id]: _, ...rest } = s.cart;
          return { cart: rest };
        }),
      clearCart: () => set({ cart: {} }),
      orderStatus: {},
      setOrderStatus: (id, status) =>
        set((s) => ({ orderStatus: { ...s.orderStatus, [id]: status } })),
    }),
    { name: 'actca-frontend-store' }
  )
);
