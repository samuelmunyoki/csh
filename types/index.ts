// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  university: string;
  studentId?: string;
  role: 'student' | 'vendor' | 'admin';
  createdAt: number;
  updatedAt: number;
  rating?: number;
  completedTransactions?: number;
}

// Marketplace Item Types
export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  category: 'textbooks' | 'electronics' | 'furniture' | 'clothing' | 'supplies' | 'services' | 'other';
  price: number;
  images: string[];
  vendorId: string;
  vendor?: User;
  condition: 'new' | 'like-new' | 'good' | 'fair';
  location?: string;
  status: 'active' | 'sold' | 'removed';
  createdAt: number;
  updatedAt: number;
  views?: number;
  saved?: number;
}

// Donation Types
export interface Donation {
  id: string;
  itemId: string;
  item?: MarketplaceItem;
  donorId: string;
  donor?: User;
  recipientId: string;
  recipient?: User;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  message?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

// Messaging Types
export interface Message {
  id: string;
  senderId: string;
  sender?: User;
  recipientId: string;
  recipient?: User;
  content: string;
  images?: string[];
  transactionId?: string;
  read: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantDetails?: User[];
  lastMessage?: Message;
  lastMessageAt: number;
  unreadCount: number;
  createdAt: number;
}

// Transaction Types
export interface Transaction {
  id: string;
  itemId: string;
  item?: MarketplaceItem;
  buyerId: string;
  buyer?: User;
  vendorId: string;
  vendor?: User;
  amount: number;
  status: 'initiated' | 'completed' | 'cancelled' | 'disputed';
  paymentMethod: string;
  notes?: string;
  createdAt: number;
  completedAt?: number;
  updatedAt: number;
}

// Admin Moderation Types
export interface ModerationReport {
  id: string;
  reportedItemId?: string;
  reportedUserId?: string;
  reporterId: string;
  reason: 'inappropriate' | 'spam' | 'fraud' | 'offensive' | 'other';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  action?: string;
  createdAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
}

// Push Notification Types
export interface PushNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  type: 'message' | 'transaction' | 'donation' | 'system';
  read: boolean;
  createdAt: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Cloudinary Upload Response
export interface CloudinaryUploadResponse {
  public_id: string;
  url: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  created_at: string;
}

// Auth Context Types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
