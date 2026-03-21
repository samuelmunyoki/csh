import { MarketplaceService } from '@/services/marketplaceService';
import { AuthService } from '@/services/authService';
import { MarketplaceItem } from '@/types';
import { create } from 'zustand';

interface MarketplaceState {
  items: MarketplaceItem[];
  userItems: MarketplaceItem[];
  selectedItem: MarketplaceItem | null;
  savedItems: MarketplaceItem[];
  loading: boolean;
  error: string | null;

  setItems: (items: MarketplaceItem[]) => void;
  setSelectedItem: (item: MarketplaceItem | null) => void;
  setSavedItems: (items: MarketplaceItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  fetchItems: (category?: string) => Promise<void>;
  fetchUserItems: (userId: string) => Promise<void>;
  fetchItemById: (itemId: string) => Promise<void>;
  fetchSavedItems: (userId: string) => Promise<void>;
  createItem: (userId: string, item: Partial<MarketplaceItem>) => Promise<void>;
  updateItem: (itemId: string, updates: Partial<MarketplaceItem>) => Promise<void>;
  deleteItem: (itemId: string, userId: string) => Promise<void>;
  searchItems: (query: string) => Promise<void>;
  saveItem: (userId: string, itemId: string) => Promise<void>;
  unsaveItem: (userId: string, itemId: string) => Promise<void>;
  clearError: () => void;
}

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  items: [],
  userItems: [],
  selectedItem: null,
  savedItems: [],
  loading: false,
  error: null,

  setItems: (items) => set({ items }),
  setSelectedItem: (item) => set({ selectedItem: item }),
  setSavedItems: (items) => set({ savedItems: items }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchItems: async (category?: string) => {
    set({ loading: true, error: null });
    try {
      const items = await MarketplaceService.getItems(category);
      set({ items, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchUserItems: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const items = await MarketplaceService.getUserItems(userId);
      set({ userItems: items, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchItemById: async (itemId: string) => {
    set({ loading: true, error: null });
    try {
      const item = await MarketplaceService.getItemById(itemId);
      if (!item) {
        set({ loading: false });
        return;
      }

      // Fetch vendor details if not already populated
      if (item.vendorId && !item.vendor) {
        try {
          const vendor = await AuthService.getUserById(item.vendorId);
          if (vendor) {
            item.vendor = vendor;
          }
        } catch (e) {
          console.warn('[useMarketplaceStore] Could not fetch vendor:', e);
        }
      }

      set({ selectedItem: item, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchSavedItems: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const items = await MarketplaceService.getSavedItems(userId);
      set({ savedItems: items, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createItem: async (userId: string, item: Partial<MarketplaceItem>) => {
    set({ loading: true, error: null });
    try {
      const newItem = await MarketplaceService.createItem(userId, item);
      const currentItems = get().items;
      set({ items: [newItem, ...currentItems], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateItem: async (itemId: string, updates: Partial<MarketplaceItem>) => {
    set({ loading: true, error: null });
    try {
      const updatedItem = await MarketplaceService.updateItem(itemId, updates);
      const items = get().items.map((item) => (item.id === itemId ? updatedItem : item));
      set({ items, loading: false });
      if (get().selectedItem?.id === itemId) {
        set({ selectedItem: updatedItem });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteItem: async (itemId: string, userId: string) => {
    set({ loading: true, error: null });
    try {
      await MarketplaceService.deleteItem(itemId, userId);
      const items = get().items.filter((item) => item.id !== itemId);
      set({ items, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  searchItems: async (query: string) => {
    set({ loading: true, error: null });
    try {
      const items = await MarketplaceService.searchItems(query);
      set({ items, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  saveItem: async (userId: string, itemId: string) => {
    try {
      await MarketplaceService.saveItem(userId, itemId);
      const items = get().items.map((item) =>
        item.id === itemId ? { ...item, saved: (item.saved || 0) + 1 } : item
      );
      set({ items });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  unsaveItem: async (userId: string, itemId: string) => {
    try {
      await MarketplaceService.unsaveItem(userId, itemId);
      const items = get().items.map((item) =>
        item.id === itemId ? { ...item, saved: Math.max(0, (item.saved || 1) - 1) } : item
      );
      set({ items });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));