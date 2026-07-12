import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WishlistItem {
  id: string;
  name: string;
  url?: string;
  currentPrice?: number;
  targetPrice?: number;
  priority: "baixa" | "media" | "alta";
  category: string;
  notes?: string;
  bought: boolean;
  createdAt: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: number;
  category: string;
  bought: boolean;
  createdAt: number;
}

interface ShoppingStore {
  wishlist: WishlistItem[];
  shoppingList: ShoppingItem[];
  addWishlistItem: (item: Omit<WishlistItem, "id" | "bought" | "createdAt">) => void;
  toggleWishlistBought: (id: string) => void;
  removeWishlistItem: (id: string) => void;
  updateWishlistPrice: (id: string, currentPrice: number) => void;
  
  addShoppingItem: (name: string, quantity?: number, category?: string) => void;
  toggleShoppingItemBought: (id: string) => void;
  removeShoppingItem: (id: string) => void;
}

export const useShoppingStore = create<ShoppingStore>()(
  persist(
    (set) => ({
      wishlist: [
        {
          id: "w-1",
          name: "PlayStation 5 Pro",
          url: "https://amazon.com.br",
          currentPrice: 6999,
          targetPrice: 6000,
          priority: "alta",
          category: "Eletrônicos",
          notes: "Esperar Black Friday para comprar.",
          bought: false,
          createdAt: Date.now(),
        },
        {
          id: "w-2",
          name: "Cadeira de Escritório Ergonômica",
          url: "https://mercadolivre.com.br",
          currentPrice: 1500,
          targetPrice: 1200,
          priority: "media",
          category: "Casa",
          bought: false,
          createdAt: Date.now(),
        }
      ],
      shoppingList: [
        {
          id: "s-1",
          name: "Café em grãos",
          quantity: 2,
          category: "Mercado",
          bought: false,
          createdAt: Date.now(),
        },
        {
          id: "s-2",
          name: "Papel toalha",
          quantity: 1,
          category: "Mercado",
          bought: true,
          createdAt: Date.now(),
        }
      ],

      addWishlistItem: (item) => set((s) => ({
        wishlist: [
          ...s.wishlist,
          {
            ...item,
            id: `w-${Date.now()}`,
            bought: false,
            createdAt: Date.now(),
          }
        ]
      })),

      toggleWishlistBought: (id) => set((s) => ({
        wishlist: s.wishlist.map((item) => item.id === id ? { ...item, bought: !item.bought } : item)
      })),

      removeWishlistItem: (id) => set((s) => ({
        wishlist: s.wishlist.filter((item) => item.id !== id)
      })),

      updateWishlistPrice: (id, currentPrice) => set((s) => ({
        wishlist: s.wishlist.map((item) => item.id === id ? { ...item, currentPrice } : item)
      })),

      addShoppingItem: (name, quantity, category = "Mercado") => set((s) => ({
        shoppingList: [
          ...s.shoppingList,
          {
            id: `s-${Date.now()}`,
            name,
            quantity,
            category,
            bought: false,
            createdAt: Date.now(),
          }
        ]
      })),

      toggleShoppingItemBought: (id) => set((s) => ({
        shoppingList: s.shoppingList.map((item) => item.id === id ? { ...item, bought: !item.bought } : item)
      })),

      removeShoppingItem: (id) => set((s) => ({
        shoppingList: s.shoppingList.filter((item) => item.id !== id)
      })),
    }),
    { name: "aia-shopping-store" }
  )
);
