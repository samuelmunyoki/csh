# CampuShare App - Technical Implementation Details

## Type System Changes

### User Interface Extended
```typescript
// Added fields to User interface
interface User {
  // ... existing fields ...
  
  // New fields for sales tracking and ratings
  salesCount?: number;           // Tracks completed sales
  
  // Account management fields
  frozen?: boolean;              // Account freeze status
  frozenReason?: string;        // Reason for freezing
  frozenAt?: number;            // Timestamp when frozen
  
  // Admin account fields
  username?: string;            // For admin-only login
  adminAccount?: boolean;       // Flag for admin accounts
}
```

### New Rating Interface
```typescript
interface Rating {
  id: string;                   // Unique rating ID
  fromUserId: string;           // User who gave the rating
  toUserId: string;             // User who received the rating
  score: number;                // Rating 1-5
  comment?: string;             // Optional review comment
  createdAt: number;            // Timestamp
}
```

---

## Authentication Service Changes

### Admin Sign-In Method
```typescript
static async adminSignIn(username: string, password: string): Promise<User> {
  // 1. Lookup admin account in `adminAccounts/{username}`
  // 2. Verify password matches
  // 3. Load user profile
  // 4. Check if account is frozen
  // 5. Return user object
}
```

### Account Freezing
```typescript
static async freezeUserAccount(userId: string, reason?: string): Promise<void> {
  // Sets: frozen=true, frozenReason, frozenAt
  // User cannot login until unfrozen
  // All data is preserved
}

static async unfreezeUserAccount(userId: string): Promise<void> {
  // Clears: frozen, frozenReason, frozenAt
  // User can login again
}
```

### Account Deletion
```typescript
static async deleteUserAccount(userId: string): Promise<void> {
  // 1. Delete user profile from `users/{userId}`
  // 2. Delete all items where vendorId === userId
  // 3. Delete all messages involving userId
  // 4. Permanent and irreversible
}
```

### Login Frozen Check
```typescript
// Added to signIn() method:
if (userProfile.frozen) {
  throw toastError(`Your account has been frozen. Reason: ${userProfile.frozenReason}`);
}
```

---

## Transaction Service Enhancements

### Sales Count Increment
```typescript
static async completeTransaction(transactionId: string): Promise<Transaction> {
  // ... existing logic ...
  
  // NEW: Increment vendor's sales count
  const vendor = await get(ref(db, `users/${transaction.vendorId}`));
  await update(ref(db, `users/${transaction.vendorId}`), {
    salesCount: (vendor.salesCount || 0) + 1,
    completedTransactions: (vendor.completedTransactions || 0) + 1,
  });
}
```

### Rating System Methods
```typescript
// Create new rating
static async rateUser(
  fromUserId: string,
  toUserId: string,
  score: number,        // 1-5
  comment?: string
): Promise<Rating> {
  // Validates score (1-5)
  // Stores at: users/{toUserId}/ratings/{ratingId}
  // Auto-updates average rating
}

// Fetch all ratings for a user
static async getUserRatings(userId: string): Promise<Rating[]> {
  // Returns array of all ratings received
}

// Calculate and update average
static async updateUserAverageRating(userId: string): Promise<number> {
  // Gets all ratings
  // Calculates average
  // Updates user.rating field (1 decimal place)
  // Returns calculated average
}

// Verify transaction history before rating
static async checkIfUserCanRate(fromUserId: string, toUserId: string): Promise<boolean> {
  // Checks if users have completed transaction together
  // Returns true only if they can rate each other
}
```

---

## Currency Utility (New File)

### `utils/currency.ts`
```typescript
const USD_TO_KES_RATE = 150;  // Easily adjustable

// Convert USD to KES
export const convertToKES = (usdPrice: number): number => {
  return Math.round(usdPrice * USD_TO_KES_RATE);
};

// Format for display
export const formatPrice = (priceInUSD: number): string => {
  const kesPrice = convertToKES(priceInUSD);
  return `KES ${kesPrice.toLocaleString('en-KE')}`;
};

// Reverse conversion
export const convertToUSD = (kesPrice: number): number => {
  return Math.round((kesPrice / USD_TO_KES_RATE) * 100) / 100;
};
```

---

## Moderation Service Enhancements

### Freeze User
```typescript
static async freezeUser(
  userId: string,
  reportId: string,
  reason?: string
): Promise<void> {
  // Updates user: frozen=true, frozenReason, frozenAt
  // Updates report: status='resolved'
  // User cannot login
  // Data preserved
}
```

### Delete User
```typescript
static async deleteUser(userId: string, reportId: string): Promise<void> {
  // 1. Delete user profile
  // 2. Delete all user items
  // 3. Delete all user messages
  // 4. Update report: status='resolved'
  // 5. Permanent deletion
}
```

### Delete Product
```typescript
static async deleteProduct(itemId: string, reportId: string): Promise<void> {
  // 1. Delete item from items/{itemId}
  // 2. Update report: status='resolved'
  // 3. Permanent deletion (not just 'removed' status)
}
```

---

## Validation Schema Changes

### Admin Sign-In Schema
```typescript
export const adminSignInSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(1, 'Password is required'),
});
```

---

## UI Component Changes

### Login Screen Toggle
```typescript
// New state
const [loginType, setLoginType] = useState<'student' | 'admin'>('student');

// Render toggle buttons
<View className="flex-row bg-gray-200 rounded-lg mb-6 p-1">
  <TouchableOpacity
    onPress={() => setLoginType('student')}
    className={`flex-1 py-3 rounded-md ${loginType === 'student' ? 'bg-blue-600' : ''}`}
  >
    <Text className={`text-center font-semibold ${loginType === 'student' ? 'text-white' : 'text-gray-600'}`}>
      Student
    </Text>
  </TouchableOpacity>
  <TouchableOpacity
    onPress={() => setLoginType('admin')}
    className={`flex-1 py-3 rounded-md ${loginType === 'admin' ? 'bg-blue-600' : ''}`}
  >
    <Text className={`text-center font-semibold ${loginType === 'admin' ? 'text-white' : 'text-gray-600'}`}>
      Admin
    </Text>
  </TouchableOpacity>
</View>
```

### Profile Stats Display
```typescript
// Updated to show sales count and rating
<View className="flex-row justify-around mt-6 pt-6 border-t border-gray-200">
  <View className="items-center">
    <Text className="text-2xl font-bold text-blue-600">
      {user?.salesCount || user?.completedTransactions || 0}
    </Text>
    <Text className="text-gray-600 text-sm mt-1">Sales</Text>
  </View>
  <View className="items-center">
    <Text className="text-2xl font-bold text-blue-600">
      {user?.rating?.toFixed(1) || '0.0'}
    </Text>
    <Text className="text-gray-600 text-sm mt-1">Rating</Text>
  </View>
</View>
```

### Admin Moderation Actions
```typescript
// Color-coded action buttons

// Freeze Account (Orange)
<TouchableOpacity className="bg-orange-600 rounded px-4 py-3">
  <Text className="text-white font-medium ml-2">Freeze Account</Text>
</TouchableOpacity>

// Remove Item (Yellow)
<TouchableOpacity className="bg-yellow-600 rounded px-4 py-3">
  <Text className="text-white font-medium ml-2">Remove Item</Text>
</TouchableOpacity>

// Delete Product (Red)
<TouchableOpacity className="bg-red-600 rounded px-4 py-3">
  <Text className="text-white font-medium ml-2">Delete Product</Text>
</TouchableOpacity>

// Delete Account (Red)
<TouchableOpacity className="bg-red-600 rounded px-4 py-3">
  <Text className="text-white font-medium ml-2">Delete Account</Text>
</TouchableOpacity>
```

---

## Zustand Store Changes

### New Actions in useAuthStore
```typescript
// Admin sign-in
adminSignIn: async (username: string, password: string) => {
  const user = await AuthService.adminSignIn(username, password);
  set({ user, isAuthenticated: true, loading: false });
}

// Freeze user account
freezeUser: async (userId: string, reason?: string) => {
  await AuthService.freezeUserAccount(userId, reason);
  set({ loading: false });
}

// Delete user account
deleteUser: async (userId: string) => {
  await AuthService.deleteUserAccount(userId);
  set({ loading: false });
}
```

---

## Firebase Data Structure

### Admin Accounts (NEW)
```
adminAccounts/
  {username}/
    username: string
    password: string        (NOTE: hash in production)
    userId: string
    createdAt: number
```

### User Ratings
```
users/
  {userId}/
    ratings/
      {ratingId}/
        id: string
        fromUserId: string
        toUserId: string
        score: number
        comment: string
        createdAt: number
```

---

## Migration Notes for Existing Users

### Backward Compatibility:
- All new fields are optional (`?`)
- Existing users work without new fields
- Ratings default to undefined (0)
- Sales count defaults to 0
- Frozen status defaults to false

### Data Updates:
- No data migration needed
- Fields populate as users interact
- First transaction increments salesCount
- First rating creates rating entry

---

## Security Considerations

### Password Handling
**NOTE**: Current admin password storage is plain text for simplicity.
**PRODUCTION**: Should use bcrypt hashing:
```typescript
import bcrypt from 'bcrypt';

// On creation
const hashedPassword = await bcrypt.hash(password, 10);

// On login
const isValid = await bcrypt.compare(password, storedHash);
```

### Input Validation
- All inputs validated with Zod schemas
- Email, username, password checked before use
- Rating scores validated (1-5 only)

### Authorization
- Admin actions checked server-side
- Frozen accounts blocked at authentication
- Role-based access control in UI

---

## Testing Code Examples

### Test Admin Login
```typescript
// Create admin account first via Firebase
await createAdminAccount('admin1', 'SecurePass123', userId);

// Then test login
const user = await AuthService.adminSignIn('admin1', 'SecurePass123');
// Should return user with role='admin'
```

### Test Rating System
```typescript
// Complete transaction first
const transaction = await TransactionService.initiateTransaction(...);
await TransactionService.completeTransaction(transaction.id);

// Then rate
const rating = await TransactionService.rateUser(
  buyerId,
  vendorId,
  5,
  'Great seller!'
);

// Check average
const avgRating = await TransactionService.updateUserAverageRating(vendorId);
// Should return 5.0
```

### Test Currency
```typescript
import { formatPrice, convertToKES } from '@/utils/currency';

formatPrice(100);  // Returns "KES 15,000"
convertToKES(100); // Returns 15000
```

---

## Performance Considerations

### Database Queries
- Ratings fetched per user (could paginate for large datasets)
- Sales count maintained in user profile (no aggregation needed)
- Moderation reports indexed by status

### Caching
- Consider caching user ratings in store
- Cache sales metrics on profile load
- Update cache on transaction completion

### Optimization Opportunities
- Batch delete operations for user deletion
- Indexed queries for moderation reports
- Server-side calculation of average ratings

---

## Error Handling

### Authentication Errors
```typescript
if (userProfile.frozen) {
  throw toastError(`Account frozen. Reason: ${frozenReason}`);
}
```

### Moderation Errors
```typescript
Alert.alert('Error', 'Failed to freeze user account');
```

### Rating Validation
```typescript
if (score < 1 || score > 5) {
  throw new Error('Rating must be between 1 and 5');
}
```

---

## Summary of Code Changes

| Component | Type | Changes | Files |
|-----------|------|---------|-------|
| Types | Schema | Added User fields, Rating interface | 1 |
| Auth | Service | Admin login, freeze, delete | 1 |
| Transactions | Service | Sales tracking, ratings | 1 |
| Moderation | Service | Freeze, delete user/product | 1 |
| Validation | Utility | Admin signin schema | 1 |
| Currency | Utility | NEW conversion functions | 1 (NEW) |
| Login | UI | Student/Admin toggle | 1 |
| Signup | UI | Email placeholder | 1 |
| Profile | UI | Sales/rating display | 1 |
| Moderation Panel | UI | Freeze/delete buttons | 1 |
| Marketplace/Items | UI | Currency formatting | 5 |
| Store | State | Admin & freeze actions | 1 |

**Total**: 18 files modified, 1 new file created

---

This technical documentation provides all implementation details for developers who need to maintain, extend, or troubleshoot the system.
