import { ref, set, get, update, push, remove } from 'firebase/database';
import { Transaction } from '@/types';
import { db } from '@/firebaseConfig';

export class TransactionService {
  static async initiateTransaction(
    itemId: string,
    buyerId: string,
    vendorId: string,
    amount: number,
    paymentMethod: string,
    notes?: string
  ): Promise<Transaction> {
    try {
      const transactionsRef = ref(db, 'transactions');
      const newTransactionRef = push(transactionsRef);

      const transaction: Transaction = {
        id: newTransactionRef.key || '',
        itemId,
        buyerId,
        vendorId,
        amount,
        status: 'initiated',
        paymentMethod,
        notes,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await set(newTransactionRef, transaction);

      // Add to buyer's transactions
      const buyerTransRef = ref(db, `users/${buyerId}/transactions/${newTransactionRef.key}`);
      await set(buyerTransRef, true);

      // Add to vendor's transactions
      const vendorTransRef = ref(db, `users/${vendorId}/transactions/${newTransactionRef.key}`);
      await set(vendorTransRef, true);

      return transaction;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create transaction');
    }
  }

  static async getTransactionById(transactionId: string): Promise<Transaction | null> {
    try {
      const transactionRef = ref(db, `transactions/${transactionId}`);
      const snapshot = await get(transactionRef);

      if (!snapshot.exists()) {
        return null;
      }

      return snapshot.val() as Transaction;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch transaction');
    }
  }

  static async getUserTransactions(userId: string): Promise<Transaction[]> {
    try {
      const transactionsRef = ref(db, 'transactions');
      const snapshot = await get(transactionsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const allTransactions = Object.values(snapshot.val()) as Transaction[];
      return allTransactions.filter((t) => t.buyerId === userId || t.vendorId === userId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch transactions');
    }
  }

  static async completeTransaction(transactionId: string): Promise<Transaction> {
    try {
      const transactionRef = ref(db, `transactions/${transactionId}`);

      await update(transactionRef, {
        status: 'completed',
        completedAt: Date.now(),
        updatedAt: Date.now(),
      });

      const snapshot = await get(transactionRef);
      if (!snapshot.exists()) {
        throw new Error('Transaction not found');
      }

      return snapshot.val() as Transaction;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to complete transaction');
    }
  }

  static async cancelTransaction(transactionId: string): Promise<Transaction> {
    try {
      const transactionRef = ref(db, `transactions/${transactionId}`);

      await update(transactionRef, {
        status: 'cancelled',
        updatedAt: Date.now(),
      });

      const snapshot = await get(transactionRef);
      if (!snapshot.exists()) {
        throw new Error('Transaction not found');
      }

      return snapshot.val() as Transaction;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to cancel transaction');
    }
  }

  static async updateTransactionStatus(
    transactionId: string,
    status: 'initiated' | 'completed' | 'cancelled' | 'disputed'
  ): Promise<Transaction> {
    try {
      const transactionRef = ref(db, `transactions/${transactionId}`);

      await update(transactionRef, {
        status,
        updatedAt: Date.now(),
      });

      const snapshot = await get(transactionRef);
      if (!snapshot.exists()) {
        throw new Error('Transaction not found');
      }

      return snapshot.val() as Transaction;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update transaction');
    }
  }

  static async getBuyerPurchases(buyerId: string): Promise<Transaction[]> {
    try {
      const transactionsRef = ref(db, 'transactions');
      const snapshot = await get(transactionsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const allTransactions = Object.values(snapshot.val()) as Transaction[];
      return allTransactions.filter((t) => t.buyerId === buyerId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch purchases');
    }
  }

  static async getVendorSales(vendorId: string): Promise<Transaction[]> {
    try {
      const transactionsRef = ref(db, 'transactions');
      const snapshot = await get(transactionsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const allTransactions = Object.values(snapshot.val()) as Transaction[];
      return allTransactions.filter((t) => t.vendorId === vendorId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch sales');
    }
  }

  static calculateUserMetrics(transactions: Transaction[]): {
    totalSales: number;
    totalRevenue: number;
    completedTransactions: number;
    rating: number;
  } {
    const completed = transactions.filter((t) => t.status === 'completed');
    const totalRevenue = completed.reduce((sum, t) => sum + t.amount, 0);
    const avgRating = 4.5; // TODO: Implement proper rating system

    return {
      totalSales: completed.length,
      totalRevenue,
      completedTransactions: completed.length,
      rating: avgRating,
    };
  }
}
