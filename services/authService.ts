import { auth, db } from '@/firebaseConfig';
import { User } from '@/types';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { ref, set, get, update } from 'firebase/database';

export class AuthService {
  static async signUp(
    email: string,
    password: string,
    userData: Partial<User>
  ): Promise<User> {
    try {
      // Create Firebase auth user
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);

      // Create user profile in Realtime Database
      const userProfile: User = {
        id: firebaseUser.uid,
        email,
        name: userData.name || email.split('@')[0],
        university: userData.university || '',
        role: userData.role || 'admin',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        completedTransactions: 0,
        rating: 0,
      };

      const userRef = ref(db, `users/${firebaseUser.uid}`);
      await set(userRef, userProfile);

      return userProfile;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create account');
    }
  }

  static async signIn(email: string, password: string): Promise<User> {
    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);

      // Fetch user profile from database
      const userRef = ref(db, `users/${firebaseUser.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        throw new Error('User profile not found');
      }

      return snapshot.val() as User;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in');
    }
  }

  static async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const userRef = ref(db, `users/${userId}`);

      const updateData = {
        ...updates,
        updatedAt: Date.now(),
      };

      await update(userRef, updateData);

      // Fetch updated profile
      const snapshot = await get(userRef);
      if (!snapshot.exists()) {
        throw new Error('User profile not found');
      }

      return snapshot.val() as User;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  static async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send password reset email');
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        return null;
      }

      const userRef = ref(db, `users/${firebaseUser.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        return null;
      }

      return snapshot.val() as User;
    } catch (error) {
      console.error('[AuthService] Error getting current user:', error);
      return null;
    }
  }

  static onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  static async getUserById(userId: string): Promise<User | null> {
    try {
      const userRef = ref(db, `users/${userId}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        return null;
      }

      return snapshot.val() as User;
    } catch (error) {
      console.error('[AuthService] Error getting user:', error);
      return null;
    }
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain an uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain a lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain a number');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
