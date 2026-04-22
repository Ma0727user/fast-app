/**
 * FAST - Zustand Store
 * Estado global da aplicação com persistência
 *
 * Using AsyncStorage for Expo Go compatibility
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";

// Tipos
export interface Produto {
  id: string;
  name: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
  personalizar?: string;
  // Campos para API do carrinho
  idProduto?: number;
  idVariacao?: number;
}

export interface ItemCarrinho extends Produto {
  quantity: number;
}

export interface Pedido {
  id: string;
  numero: string;
  data: string;
  total: number;
  status: "Confirmado" | "Em Preparação" | "A Caminho" | "Entregue";
  items: ItemCarrinho[];
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  addresses: Endereco[];
}

export interface Endereco {
  id: string;
  street: string;
  city: string;
  province: string;
  reference?: string;
}

// Criar storage adapter para AsyncStorage
const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await AsyncStorage.getItem(name);
      return value ?? null;
    } catch (error) {
      console.error("[useStore] AsyncStorage getItem error:", error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch (error) {
      console.error("[useStore] AsyncStorage setItem error:", error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (error) {
      console.error("[useStore] AsyncStorage removeItem error:", error);
    }
  },
};

// Estado parcial para persistência (sem actions)
interface PersistedState {
  cart: ItemCarrinho[];
  orders: Pedido[];
  user: User | null;
  isAuthenticated: boolean;
  authToken: string | null;
}

// Definir interface do estado
interface AppState {
  // Autenticação
  user: User | null;
  isAuthenticated: boolean;
  authToken: string | null;
  // Carrinho
  cart: ItemCarrinho[];
  // Pedidos
  orders: Pedido[];
  // Modal de Pesquisa
  isSearchModalVisible: boolean;
  // Ações - Usuário
  setUser: (user: User | null, token?: string) => void;
  logout: () => void;
  // Ações - Carrinho
  addToCart: (product: Produto) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  // Ações - Pedidos
  addOrder: (order: Pedido) => void;
  // Ações - Modal de Pesquisa
  setSearchModalVisible: (visible: boolean) => void;
  // Getters
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

// Criar store com persistência
const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      authToken: null,
      cart: [],
      orders: [],
      isSearchModalVisible: false,

      // Ações - Usuário
      setUser: (user, token) => {
        console.log(
          "[useStore] setUser chamado, user:",
          user?.id,
          "token:",
          token ? "sim" : "não",
        );
        set({ user, isAuthenticated: !!user, authToken: token || null });
        console.log(
          "[useStore] Estado após setUser - isAuthenticated:",
          !!user,
        );
      },
      logout: () => {
        console.log("[useStore] logout chamado");
        set({ user: null, isAuthenticated: false, authToken: null });
      },

      // Ações - Carrinho
      addToCart: (product) =>
        set((state) => {
          const existingItem = state.cart.find(
            (item) => item.id === product.id,
          );
          if (existingItem) {
            return {
              cart: state.cart.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item,
              ),
            };
          }
          return { cart: [...state.cart, { ...product, quantity: 1 }] };
        }),

      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.id === productId ? { ...item, quantity } : item,
          ),
        })),

      clearCart: () => set({ cart: [] }),

      // Ações - Pedidos
      addOrder: (order) =>
        set((state) => ({
          orders: [order, ...state.orders],
        })),

      // Getters
      getCartTotal: () => {
        const { cart } = get();
        return cart.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        );
      },

      getCartItemCount: () => {
        const { cart } = get();
        return cart.reduce((count, item) => count + item.quantity, 0);
      },

      // Ações - Modal de Pesquisa
      setSearchModalVisible: (visible) =>
        set({ isSearchModalVisible: visible }),
    }),
    {
      name: "fast-app-storage",
      storage: createJSONStorage(() => storage),
      partialize: (state: AppState): PersistedState => ({
        cart: state.cart,
        orders: state.orders,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        authToken: state.authToken,
      }),
      onRehydrateStorage: () => (state) => {
        console.log(
          "[useStore] Estado restaurado:",
          state ? "sucesso" : "falha",
        );
        if (state) {
          console.log("[useStore] Estado restaurado - user:", state.user?.id);
          console.log(
            "[useStore] Estado restaurado - isAuthenticated:",
            state.isAuthenticated,
          );
          console.log(
            "[useStore] Estado restaurado - authToken:",
            state.authToken ? "sim" : "não",
          );
        }
      },
    },
  ),
);

export { useStore };

