import { auth, db } from '@/firebaseConfig';
import { User } from '@/types';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import { ref, set, get, update } from 'firebase/database';
import Toast from 'react-native-toast-message';

// A typed error that carries a flag so we never toast twice
class AppError extends Error {
  alreadyToasted = true;
  constructor(message: string) {
    super(message);
  }
}

function getFriendlyError(error: any): string {
  const code = error?.code || '';
  const map: Record<string, string> = {
    'auth/invalid-email':             'That email address is invalid.',
    'auth/user-disabled':             'This account has been disabled. Please contact support.',
    'auth/user-not-found':            'No account found with that email.',
    'auth/wrong-password':            'Incorrect password. Please try again.',
    'auth/email-already-in-use':      'An account with that email already exists.',
    'auth/weak-password':             'Password is too weak. Use at least 8 characters.',
    'auth/too-many-requests':         'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed':    'Network error. Check your connection and try again.',
    'auth/popup-closed-by-user':      'Sign-in was cancelled.',
    'auth/invalid-credential':        'Incorrect email or password.',
    'auth/operation-not-allowed':     'This sign-in method is not enabled.',
    'auth/requires-recent-login':     'Please sign out and sign back in to do that.',
    'auth/account-exists-with-different-credential':
      'An account already exists with this email using a different sign-in method.',
  };
  return map[code] || error?.message || 'Something went wrong. Please try again.';
}

function toastError(message: string): AppError {
  Toast.show({ type: 'error', text1: 'Error', text2: message, position: 'top', visibilityTime: 4000 });
  return new AppError(message);
}

function toastSuccess(message: string) {
  Toast.show({ type: 'success', text1: 'Success', text2: message, position: 'top', visibilityTime: 3000 });
}

// Re-throws only if not already toasted; otherwise toasts + throws
function handleError(error: any): never {
  if (error instanceof AppError) throw error; // already toasted
  throw toastError(getFriendlyError(error));
}

export class AuthService {
  static async isFirstUser(): Promise<boolean> {
    try {
      const snapshot = await get(ref(db, 'users'));
      return !snapshot.exists() || Object.keys(snapshot.val() || {}).length === 0;
    } catch {
      return false;
    }
  }

  static async signUp(email: string, password: string, userData: Partial<User>): Promise<User> {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      const isFirstUser = await this.isFirstUser();

      const userProfile: User = {
        id: firebaseUser.uid,
        email,
        name: userData.name || email.split('@')[0],
        university: userData.university || '',
        role: isFirstUser ? 'admin' : 'student',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        completedTransactions: 0,
        rating: 0,
      };

      await set(ref(db, `users/${firebaseUser.uid}`), userProfile);
      toastSuccess('Account created successfully!');
      return userProfile;
    } catch (error: any) {
      handleError(error);
    }
  }

  static async signIn(email: string, password: string): Promise<User> {
    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      const snapshot = await get(ref(db, `users/${firebaseUser.uid}`));

      if (!snapshot.exists()) {
        throw toastError('User profile not found. Please contact support.');
      }

      const userProfile = snapshot.val() as User;

      // Check if account is frozen
      if (userProfile.frozen) {
        throw toastError(`Your account has been frozen. Reason: ${userProfile.frozenReason || 'No reason provided'}. Please contact support.`);
      }

      return userProfile;
    } catch (error: any) {
      handleError(error);
    }
  }

  static async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      handleError(error);
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const userRef = ref(db, `users/${userId}`);
      await update(userRef, { ...updates, updatedAt: Date.now() });
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        throw toastError('User profile not found. Please contact support.');
      }

      toastSuccess('Profile updated successfully!');
      return snapshot.val() as User;
    } catch (error: any) {
      handleError(error);
    }
  }

  static async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
      toastSuccess('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      handleError(error);
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return null;
      const snapshot = await get(ref(db, `users/${firebaseUser.uid}`));
      if (!snapshot.exists()) return null;
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
      const snapshot = await get(ref(db, `users/${userId}`));
      if (!snapshot.exists()) return null;
      return snapshot.val() as User;
    } catch (error) {
      console.error('[AuthService] Error getting user:', error);
      return null;
    }
  }

  static validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (password.length < 8)     errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('One number');
    return { valid: errors.length === 0, errors };
  }

  static async adminSignIn(username: string, password: string): Promise<User> {
    try {
      const adminRef = ref(db, `adminAccounts/${username}`);
      const snapshot = await get(adminRef);

      if (!snapshot.exists()) {
        throw toastError('Admin account not found. Please check your username.');
      }

      const adminAccount = snapshot.val();

      // Simple password comparison (in production, use bcrypt)
      if (adminAccount.password !== password) {
        throw toastError('Incorrect password. Please try again.');
      }

      // Get the admin user profile
      const userSnapshot = await get(ref(db, `users/${adminAccount.userId}`));
      if (!userSnapshot.exists()) {
        throw toastError('Admin user profile not found. Please contact support.');
      }

      const userProfile = userSnapshot.val() as User;

      // Check if account is frozen
      if (userProfile.frozen) {
        throw toastError('Your admin account has been frozen. Please contact support.');
      }

      toastSuccess('Admin login successful!');
      return userProfile;
    } catch (error: any) {
      handleError(error);
    }
  }

  static async createAdminAccount(username: string, password: string, userId: string): Promise<void> {
    try {
      const adminAccountRef = ref(db, `adminAccounts/${username}`);
      await set(adminAccountRef, {
        username,
        password, // In production, should be hashed with bcrypt
        userId,
        createdAt: Date.now(),
      });

      // Update user to mark as admin account
      await update(ref(db, `users/${userId}`), {
        adminAccount: true,
        username,
      });

      toastSuccess('Admin account created successfully!');
    } catch (error: any) {
      handleError(error);
    }
  }

  static async freezeUserAccount(userId: string, reason?: string): Promise<void> {
    try {
      await update(ref(db, `users/${userId}`), {
        frozen: true,
        frozenReason: reason || 'Account frozen by admin',
        frozenAt: Date.now(),
        updatedAt: Date.now(),
      });
      toastSuccess('User account frozen successfully!');
    } catch (error: any) {
      handleError(error);
    }
  }

  static async unfreezeUserAccount(userId: string): Promise<void> {
    try {
      await update(ref(db, `users/${userId}`), {
        frozen: false,
        frozenReason: undefined,
        frozenAt: undefined,
        updatedAt: Date.now(),
      });
      toastSuccess('User account unfrozen successfully!');
    } catch (error: any) {
      handleError(error);
    }
  }

  static async deleteUserAccount(userId: string): Promise<void> {
    try {
      // Delete user profile
      await set(ref(db, `users/${userId}`), null);

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

      toastSuccess('User account deleted successfully!');
    } catch (error: any) {
      handleError(error);
    }
  }
}
