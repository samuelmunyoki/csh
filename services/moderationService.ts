import { ref, set, get, update, push, query, orderByChild } from 'firebase/database';

import { MarketplaceService } from './marketplaceService';
import { db } from '@/firebaseConfig';
import { ModerationReport } from '@/types';

export class ModerationService {
  static async reportContent(
    reporterId: string,
    reason: 'inappropriate' | 'spam' | 'fraud' | 'offensive' | 'other',
    description: string,
    reportedItemId?: string,
    reportedUserId?: string
  ): Promise<ModerationReport> {
    try {
      if (!reportedItemId && !reportedUserId) {
        throw new Error('Either item or user must be reported');
      }

      const reportsRef = ref(db, 'moderation_reports');
      const newReportRef = push(reportsRef);

      const report: ModerationReport = {
        id: newReportRef.key || '',
        reportedItemId,
        reportedUserId,
        reporterId,
        reason,
        description,
        status: 'pending',
        createdAt: Date.now(),
      };

      await set(newReportRef, report);

      return report;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to submit report');
    }
  }

  static async getReportById(reportId: string): Promise<ModerationReport | null> {
    try {
      const reportRef = ref(db, `moderation_reports/${reportId}`);
      const snapshot = await get(reportRef);

      if (!snapshot.exists()) {
        return null;
      }

      return snapshot.val() as ModerationReport;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch report');
    }
  }

  static async getPendingReports(): Promise<ModerationReport[]> {
    try {
      const reportsRef = ref(db, 'moderation_reports');
      const snapshot = await get(reportsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const allReports = Object.values(snapshot.val()) as ModerationReport[];
      return allReports.filter((r) => r.status === 'pending');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch pending reports');
    }
  }

  static async reviewReport(
    reportId: string,
    reviewedBy: string,
    action: string,
    resolution: 'resolved' | 'dismissed'
  ): Promise<ModerationReport> {
    try {
      const reportRef = ref(db, `moderation_reports/${reportId}`);

      await update(reportRef, {
        status: resolution,
        action,
        reviewedBy,
        reviewedAt: Date.now(),
      });

      const snapshot = await get(reportRef);
      if (!snapshot.exists()) {
        throw new Error('Report not found');
      }

      return snapshot.val() as ModerationReport;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to review report');
    }
  }

  static async removeItem(itemId: string, reportId: string): Promise<void> {
    try {
      // Mark item as removed
      await MarketplaceService.updateItem(itemId, { status: 'removed' });

      // Update report
      await this.reviewReport(reportId, 'system', 'Item removed', 'resolved');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to remove item');
    }
  }

  static async banUser(userId: string, reportId: string): Promise<void> {
    try {
      const userRef = ref(db, `users/${userId}`);

      await update(userRef, {
        banned: true,
        bannedAt: Date.now(),
      });

      // Update report
      await this.reviewReport(reportId, 'system', 'User banned', 'resolved');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to ban user');
    }
  }

  static async freezeUser(userId: string, reportId: string, reason?: string): Promise<void> {
    try {
      const userRef = ref(db, `users/${userId}`);

      await update(userRef, {
        frozen: true,
        frozenReason: reason || 'Account frozen by admin',
        frozenAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Update report
      await this.reviewReport(reportId, 'system', `User account frozen${reason ? ': ' + reason : ''}`, 'resolved');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to freeze user');
    }
  }

  static async deleteUser(userId: string, reportId: string): Promise<void> {
    try {
      // Delete user profile
      const userRef = ref(db, `users/${userId}`);
      await set(userRef, null);

      // Delete user's items
      const itemsRef = ref(db, 'items');
      const itemsSnapshot = await get(itemsRef);
      if (itemsSnapshot.exists()) {
        const items = itemsSnapshot.val();
        for (const itemId in items) {
          if (items[itemId].vendorId === userId) {
            await set(ref(db, `items/${itemId}`), null);
          }
        }
      }

      // Delete user's messages
      const messagesRef = ref(db, 'messages');
      const messagesSnapshot = await get(messagesRef);
      if (messagesSnapshot.exists()) {
        const messages = messagesSnapshot.val();
        for (const convId in messages) {
          const conv = messages[convId];
          if (conv.senderId === userId || conv.recipientId === userId) {
            await set(ref(db, `messages/${convId}`), null);
          }
        }
      }

      // Update report
      await this.reviewReport(reportId, 'system', 'User account deleted', 'resolved');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete user');
    }
  }

  static async deleteProduct(itemId: string, reportId: string): Promise<void> {
    try {
      // Delete the item
      await set(ref(db, `items/${itemId}`), null);

      // Update report
      await this.reviewReport(reportId, 'system', 'Product deleted', 'resolved');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete product');
    }
  }

  static async getReportsForItem(itemId: string): Promise<ModerationReport[]> {
    try {
      const reportsRef = ref(db, 'moderation_reports');
      const snapshot = await get(reportsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const allReports = Object.values(snapshot.val()) as ModerationReport[];
      return allReports.filter((r) => r.reportedItemId === itemId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch reports');
    }
  }

  static async getReportsForUser(userId: string): Promise<ModerationReport[]> {
    try {
      const reportsRef = ref(db, 'moderation_reports');
      const snapshot = await get(reportsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const allReports = Object.values(snapshot.val()) as ModerationReport[];
      return allReports.filter((r) => r.reportedUserId === userId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch reports');
    }
  }

  static async flagItemForReview(itemId: string, reason: string): Promise<void> {
    try {
      const flagRef = ref(db, `flagged_items/${itemId}`);
      await set(flagRef, {
        itemId,
        reason,
        flaggedAt: Date.now(),
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to flag item');
    }
  }

  static async getFlaggedItems(): Promise<any[]> {
    try {
      const flaggedRef = ref(db, 'flagged_items');
      const snapshot = await get(flaggedRef);

      if (!snapshot.exists()) {
        return [];
      }

      return Object.values(snapshot.val());
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch flagged items');
    }
  }

  static validateReportDescription(description: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!description || description.trim().length === 0) {
      errors.push('Description is required');
    } else if (description.length < 10) {
      errors.push('Description must be at least 10 characters');
    } else if (description.length > 1000) {
      errors.push('Description cannot exceed 1000 characters');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
