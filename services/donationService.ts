import { db } from '@/firebaseConfig';
import { Donation } from '@/types';
import { ref, set, get, update, push, query, orderByChild, limitToLast } from 'firebase/database';

export class DonationService {
  static async requestDonation(
    itemId: string,
    donorId: string,
    recipientId: string,
    message?: string
  ): Promise<Donation> {
    return this.createDonation(itemId, donorId, recipientId, message);
  }

  static async createDonation(
    itemId: string,
    donorId: string,
    recipientId: string,
    message?: string
  ): Promise<Donation> {
    try {
      const donationsRef = ref(db, 'donations');
      const newDonationRef = push(donationsRef);

      const donation: Donation = {
        id: newDonationRef.key || '',
        itemId,
        donorId,
        recipientId,
        status: 'pending',
        message,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await set(newDonationRef, donation);

      // Add to donor's donations
      const donorDonRef = ref(db, `users/${donorId}/donations_made/${newDonationRef.key}`);
      await set(donorDonRef, true);

      // Add to recipient's donations
      const recipDonRef = ref(db, `users/${recipientId}/donations_received/${newDonationRef.key}`);
      await set(recipDonRef, true);

      return donation;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create donation');
    }
  }

  static async getDonationById(donationId: string): Promise<Donation | null> {
    try {
      const donationRef = ref(db, `donations/${donationId}`);
      const snapshot = await get(donationRef);

      if (!snapshot.exists()) {
        return null;
      }

      return snapshot.val() as Donation;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch donation');
    }
  }

  static async getUserDonationsMade(userId: string): Promise<Donation[]> {
    try {
      const donationsRef = ref(db, 'donations');
      const snapshot = await get(donationsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const donations = Object.values(snapshot.val()) as Donation[];
      return donations.filter((d) => d.donorId === userId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch donations');
    }
  }

  static async getUserDonationsReceived(userId: string): Promise<Donation[]> {
    try {
      const donationsRef = ref(db, 'donations');
      const snapshot = await get(donationsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const donations = Object.values(snapshot.val()) as Donation[];
      return donations.filter((d) => d.recipientId === userId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch donations');
    }
  }

  static async acceptDonation(donationId: string): Promise<Donation> {
    try {
      const donationRef = ref(db, `donations/${donationId}`);

      await update(donationRef, {
        status: 'accepted',
        updatedAt: Date.now(),
      });

      const snapshot = await get(donationRef);
      if (!snapshot.exists()) {
        throw new Error('Donation not found');
      }

      return snapshot.val() as Donation;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to accept donation');
    }
  }

  static async completeDonation(donationId: string): Promise<Donation> {
    try {
      const donationRef = ref(db, `donations/${donationId}`);

      await update(donationRef, {
        status: 'completed',
        completedAt: Date.now(),
        updatedAt: Date.now(),
      });

      const snapshot = await get(donationRef);
      if (!snapshot.exists()) {
        throw new Error('Donation not found');
      }

      return snapshot.val() as Donation;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to complete donation');
    }
  }

  static async cancelDonation(donationId: string): Promise<Donation> {
    try {
      const donationRef = ref(db, `donations/${donationId}`);

      await update(donationRef, {
        status: 'cancelled',
        updatedAt: Date.now(),
      });

      const snapshot = await get(donationRef);
      if (!snapshot.exists()) {
        throw new Error('Donation not found');
      }

      return snapshot.val() as Donation;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to cancel donation');
    }
  }

  static async getDonationsByItem(itemId: string): Promise<Donation[]> {
    try {
      const donationsRef = ref(db, 'donations');
      const snapshot = await get(donationsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const donations = Object.values(snapshot.val()) as Donation[];
      return donations.filter((d) => d.itemId === itemId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch donations');
    }
  }

  static async getActiveDonations(userId: string): Promise<Donation[]> {
    try {
      const donationsRef = ref(db, 'donations');
      const snapshot = await get(donationsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const donations = Object.values(snapshot.val()) as Donation[];
      return donations.filter(
        (d) => (d.donorId === userId || d.recipientId === userId) && d.status !== 'completed'
      );
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch active donations');
    }
  }
}
