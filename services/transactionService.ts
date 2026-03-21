import { ref, set, get, update, push, remove } from 'firebase/database';
import { Transaction, Rating } from '@/types';
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
      const snapshot = await get(transactionRef);

      if (!snapshot.exists()) {
        throw new Error('Transaction not found');
      }

      const transaction = snapshot.val() as Transaction;

      // Update transaction status
      await update(transactionRef, {
        status: 'completed',
        completedAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Increment vendor's sales count
      const vendorRef = ref(db, `users/${transaction.vendorId}`);
      const vendorSnapshot = await get(vendorRef);

      if (vendorSnapshot.exists()) {
        const vendor = vendorSnapshot.val();
        const currentSalesCount = vendor.salesCount || 0;

        await update(vendorRef, {
          salesCount: currentSalesCount + 1,
          completedTransactions: (vendor.completedTransactions || 0) + 1,
          updatedAt: Date.now(),
        });
      }

      const updatedSnapshot = await get(transactionRef);
      return updatedSnapshot.val() as Transaction;
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

  // Rating System Methods
  static async rateUser(
    fromUserId: string,
    toUserId: string,
    score: number,
    comment?: string
  ): Promise<Rating> {
    try {
      if (score < 1 || score > 5) {
        throw new Error('Rating score must be between 1 and 5');
      }

      const ratingsRef = ref(db, `users/${toUserId}/ratings`);
      const newRatingRef = push(ratingsRef);

      const rating: Rating = {
        id: newRatingRef.key || '',
        fromUserId,
        toUserId,
        score,
        comment: comment || '',
        createdAt: Date.now(),
      };

      await set(newRatingRef, rating);

      // Update user's average rating
      await this.updateUserAverageRating(toUserId);

      return rating;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to save rating');
    }
  }

  static async getUserRatings(userId: string): Promise<Rating[]> {
    try {
      const ratingsRef = ref(db, `users/${userId}/ratings`);
      const snapshot = await get(ratingsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const ratingsData = snapshot.val();
      return Object.values(ratingsData) as Rating[];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch ratings');
    }
  }

  static async updateUserAverageRating(userId: string): Promise<number> {
    try {
      const ratings = await this.getUserRatings(userId);

      if (ratings.length === 0) {
        return 0;
      }

      const averageScore = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;

      const userRef = ref(db, `users/${userId}`);
      await update(userRef, {
        rating: Math.round(averageScore * 10) / 10, // Round to 1 decimal place
        updatedAt: Date.now(),
      });

      return averageScore;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update rating');
    }
  }

  static async checkIfUserCanRate(
    fromUserId: string,
    toUserId: string
  ): Promise<boolean> {
    try {
      // Check if users have completed a transaction together
      const transactionsRef = ref(db, 'transactions');
      const snapshot = await get(transactionsRef);

      if (!snapshot.exists()) {
        return false;
      }

      const allTransactions = Object.values(snapshot.val()) as Transaction[];
      const hasCompletedTransaction = allTransactions.some(
        (t) =>
          t.status === 'completed' &&
          ((t.buyerId === fromUserId && t.vendorId === toUserId) ||
            (t.buyerId === toUserId && t.vendorId === fromUserId))
      );

      return hasCompletedTransaction;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to check rating eligibility');
    }
  }
}
