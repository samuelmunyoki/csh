import { db } from '@/firebaseConfig';
import { MarketplaceItem } from '@/types';
import { ref, set, get, update, query, orderByChild, limitToLast, push, remove } from 'firebase/database';

export class MarketplaceService {
  static async createItem(userId: string, item: Partial<MarketplaceItem>): Promise<MarketplaceItem> {
    try {
      const itemsRef = ref(db, 'marketplace_items');
      const newItemRef = push(itemsRef);

      const marketItem: MarketplaceItem = {
        id: newItemRef.key || '',
        title: item.title || '',
        description: item.description || '',
        category: item.category || 'other',
        price: item.price || 0,
        images: item.images || [],
        vendorId: userId,
        condition: item.condition || 'good',
        location: item.location || '',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        views: 0,
        saved: 0,
      };

      await set(newItemRef, marketItem);

      // Add to user's items
      const userItemsRef = ref(db, `users/${userId}/items/${newItemRef.key}`);
      await set(userItemsRef, true);

      return marketItem;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create marketplace item');
    }
  }

  static async getItemById(itemId: string): Promise<MarketplaceItem | null> {
    try {
      const itemRef = ref(db, `marketplace_items/${itemId}`);
      const snapshot = await get(itemRef);

      if (!snapshot.exists()) {
        return null;
      }

      const item = snapshot.val() as MarketplaceItem;

      // Increment view count
      await update(itemRef, { views: (item.views || 0) + 1 });

      return item;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch item');
    }
  }

  static async getItems(
    category?: string,
    limit: number = 50
  ): Promise<MarketplaceItem[]> {
    try {
      const itemsRef = ref(db, 'marketplace_items');
      const snapshot = await get(itemsRef);

      if (!snapshot.exists()) {
        return [];
      }

      let items = Object.values(snapshot.val()) as MarketplaceItem[];

      // Filter by category
      if (category) {
        items = items.filter((item) => item.category === category);
      }

      // Filter only active items
      items = items.filter((item) => item.status === 'active');

      // Sort by creation date (newest first)
      items.sort((a, b) => b.createdAt - a.createdAt);

      return items.slice(0, limit);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch items');
    }
  }

  static async getUserItems(userId: string): Promise<MarketplaceItem[]> {
    try {
      const itemsRef = ref(db, 'marketplace_items');
      const snapshot = await get(itemsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const items = Object.values(snapshot.val()) as MarketplaceItem[];
      return items.filter((item) => item.vendorId === userId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch user items');
    }
  }

  static async updateItem(itemId: string, updates: Partial<MarketplaceItem>): Promise<MarketplaceItem> {
    try {
      const itemRef = ref(db, `marketplace_items/${itemId}`);

      const updateData = {
        ...updates,
        updatedAt: Date.now(),
      };

      await update(itemRef, updateData);

      const snapshot = await get(itemRef);
      if (!snapshot.exists()) {
        throw new Error('Item not found');
      }

      return snapshot.val() as MarketplaceItem;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update item');
    }
  }

  static async deleteItem(itemId: string, userId: string): Promise<void> {
    try {
      const itemRef = ref(db, `marketplace_items/${itemId}`);
      const userItemRef = ref(db, `users/${userId}/items/${itemId}`);

      await remove(itemRef);
      await remove(userItemRef);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete item');
    }
  }

  static async markItemAsSold(itemId: string): Promise<void> {
    try {
      const itemRef = ref(db, `marketplace_items/${itemId}`);
      await update(itemRef, {
        status: 'sold',
        updatedAt: Date.now(),
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark item as sold');
    }
  }

  static async searchItems(query: string): Promise<MarketplaceItem[]> {
    try {
      const itemsRef = ref(db, 'marketplace_items');
      const snapshot = await get(itemsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const items = Object.values(snapshot.val()) as MarketplaceItem[];
      const searchQuery = query.toLowerCase();

      return items.filter(
        (item) =>
          item.status === 'active' &&
          (item.title.toLowerCase().includes(searchQuery) ||
            item.description.toLowerCase().includes(searchQuery) ||
            item.category.toLowerCase().includes(searchQuery))
      );
    } catch (error: any) {
      throw new Error(error.message || 'Failed to search items');
    }
  }

  static async saveItem(userId: string, itemId: string): Promise<void> {
    try {
      const savedRef = ref(db, `users/${userId}/saved_items/${itemId}`);
      await set(savedRef, {
        itemId,
        savedAt: Date.now(),
      });

      // Update item save count
      const itemRef = ref(db, `marketplace_items/${itemId}`);
      const snapshot = await get(itemRef);
      if (snapshot.exists()) {
        const item = snapshot.val() as MarketplaceItem;
        await update(itemRef, { saved: (item.saved || 0) + 1 });
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to save item');
    }
  }

  static async unsaveItem(userId: string, itemId: string): Promise<void> {
    try {
      const savedRef = ref(db, `users/${userId}/saved_items/${itemId}`);
      await remove(savedRef);

      // Update item save count
      const itemRef = ref(db, `marketplace_items/${itemId}`);
      const snapshot = await get(itemRef);
      if (snapshot.exists()) {
        const item = snapshot.val() as MarketplaceItem;
        const newCount = Math.max(0, (item.saved || 1) - 1);
        await update(itemRef, { saved: newCount });
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to unsave item');
    }
  }

  static async getSavedItems(userId: string): Promise<MarketplaceItem[]> {
    try {
      const savedRef = ref(db, `users/${userId}/saved_items`);
      const snapshot = await get(savedRef);

      if (!snapshot.exists()) {
        return [];
      }

      const savedIds = Object.keys(snapshot.val());
      const items: MarketplaceItem[] = [];

      for (const itemId of savedIds) {
        const item = await this.getItemById(itemId);
        if (item) {
          items.push(item);
        }
      }

      return items;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch saved items');
    }
  }
}
