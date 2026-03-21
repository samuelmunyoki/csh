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

      return snapshot.val() as User;
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
}