import { z } from 'zod';

// Auth Validation Schemas
export const signUpSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  university: z.string().min(2, 'University is required'),
  studentId: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Marketplace Validation Schemas
export const createItemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title is too long'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description is too long'),
  category: z.enum(['textbooks', 'electronics', 'furniture', 'clothing', 'supplies', 'services', 'other']),
  price: z.number().min(0, 'Price must be positive').max(100000, 'Price is too high'),
  condition: z.enum(['new', 'like-new', 'good', 'fair']),
  location: z.string().optional(),
});

export const updateItemSchema = createItemSchema.partial();

// Donation Validation Schemas
export const createDonationSchema = z.object({
  itemId: z.string().min(1, 'Item is required'),
  recipientId: z.string().min(1, 'Recipient is required'),
  message: z.string().max(500, 'Message is too long').optional(),
});

// Message Validation Schemas
export const sendMessageSchema = z.object({
  recipientId: z.string().min(1, 'Recipient is required'),
  content: z.string().min(1, 'Message cannot be empty').max(5000, 'Message is too long'),
  transactionId: z.string().optional(),
});

// Profile Update Schema
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  avatar: z.string().url('Invalid URL').optional(),
  university: z.string().optional(),
  studentId: z.string().optional(),
});

// Moderation Report Schema
export const reportSchema = z.object({
  reason: z.enum(['inappropriate', 'spam', 'fraud', 'offensive', 'other']),
  description: z.string().min(10, 'Description is required').max(1000, 'Description is too long'),
  reportedItemId: z.string().optional(),
  reportedUserId: z.string().optional(),
}).refine(
  (data) => data.reportedItemId || data.reportedUserId,
  { message: 'Please specify what you are reporting' }
);

export const validateData = async <T>(schema: z.ZodSchema<T>, data: unknown): Promise<T> => {
  return await schema.parseAsync(data); // let Zod throw naturally
};

// Specific validation helper functions
export const validateEmail = (email: string): boolean => {
  return z.string().email().safeParse(email).success;
};

export const validatePassword = (
  password: string
): { valid: boolean; errors: string[] } => {
  const schema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number');

  const result = schema.safeParse(password);

  if (result.success) {
    return { valid: true, errors: [] };
  }

  return {
    valid: false,
    errors: result.error.errors.map((e) => e.message),
  };
};

export const validateItemPrice = (price: number): boolean => {
  return z.number().min(0).max(100000).safeParse(price).success;
};

export const validateImageUrl = (url: string): boolean => {
  try {
    new URL(url);
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  } catch {
    return false;
  }
};
