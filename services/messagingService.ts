import { db } from '@/firebaseConfig';
import { Message, Conversation } from '@/types';
import { ref, set, get, update, push, onValue } from 'firebase/database';

export class MessagingService {
  static async sendMessage(
    senderId: string,
    recipientId: string,
    content: string,
    transactionId?: string,
    images?: string[]
  ): Promise<Message> {
    try {
      const messagesRef = ref(db, 'messages');
      const newMessageRef = push(messagesRef);

      // Firebase rejects undefined values — build object with only defined fields
      const message: Message = {
        id: newMessageRef.key || '',
        senderId,
        recipientId,
        content,
        read: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...(images && images.length > 0 ? { images } : {}),
        ...(transactionId ? { transactionId } : {}),
      };

      // Strip any remaining undefined values before writing to Firebase
      const cleanMessage = JSON.parse(JSON.stringify(message));

      await set(newMessageRef, cleanMessage);

      const conversationId = [senderId, recipientId].sort().join('_');
      const conversationRef = ref(db, `conversations/${conversationId}`);

      // Store participants as object { userId: true } — correct for Firebase RTDB
      await update(conversationRef, {
        id: conversationId,
        lastMessage: cleanMessage,
        lastMessageAt: Date.now(),
        [`participants/${senderId}`]: true,
        [`participants/${recipientId}`]: true,
      });

      // Increment unread count for recipient
      const unreadCount = await this.getUnreadCount(recipientId, conversationId);
      const userConvRef = ref(db, `users/${recipientId}/conversations/${conversationId}`);
      await set(userConvRef, { unreadCount: unreadCount + 1 });

      return cleanMessage;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send message');
    }
  }

  static async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const messagesRef = ref(db, 'messages');
      const snapshot = await get(messagesRef);

      if (!snapshot.exists()) return [];

      const allMessages = Object.values(snapshot.val()) as Message[];
      const [id1, id2] = conversationId.split('_');

      return allMessages
        .filter(
          (msg) =>
            (msg.senderId === id1 && msg.recipientId === id2) ||
            (msg.senderId === id2 && msg.recipientId === id1)
        )
        .sort((a, b) => a.createdAt - b.createdAt);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch messages');
    }
  }

  static async markMessageAsRead(messageId: string): Promise<void> {
    try {
      await update(ref(db, `messages/${messageId}`), { read: true });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark message as read');
    }
  }

  static async markConversationAsRead(userId: string, conversationId: string): Promise<void> {
    try {
      await update(ref(db, `users/${userId}/conversations/${conversationId}`), { unreadCount: 0 });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark conversation as read');
    }
  }

  static async getUnreadCount(userId: string, conversationId: string): Promise<number> {
    try {
      const snapshot = await get(ref(db, 'messages'));
      if (!snapshot.exists()) return 0;

      const [id1, id2] = conversationId.split('_');
      const allMessages = Object.values(snapshot.val()) as Message[];

      return allMessages.filter(
        (msg) =>
          msg.recipientId === userId &&
          !msg.read &&
          ((msg.senderId === id1 && msg.recipientId === id2) ||
            (msg.senderId === id2 && msg.recipientId === id1))
      ).length;
    } catch {
      return 0;
    }
  }

  static subscribeToMessages(
    conversationId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    const messagesRef = ref(db, 'messages');

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      // Always call callback — even with empty array — so loading state resolves
      if (!snapshot.exists()) {
        callback([]);
        return;
      }

      const [id1, id2] = conversationId.split('_');
      const allMessages = Object.values(snapshot.val()) as Message[];

      const filtered = allMessages
        .filter(
          (msg) =>
            (msg.senderId === id1 && msg.recipientId === id2) ||
            (msg.senderId === id2 && msg.recipientId === id1)
        )
        .sort((a, b) => a.createdAt - b.createdAt);

      callback(filtered);
    });

    return unsubscribe;
  }

  static subscribeToConversations(
    userId: string,
    callback: (conversations: Conversation[]) => void
  ): () => void {
    const conversationsRef = ref(db, 'conversations');

    const unsubscribe = onValue(conversationsRef, (snapshot) => {
      // Always call callback — even with empty array — so loading state resolves
      if (!snapshot.exists()) {
        callback([]);
        return;
      }

      const allConversations = Object.values(snapshot.val()) as Conversation[];

      const userConversations = allConversations
        .filter((conv) => {
          const participants = conv.participants;
          // Handle both array and object { userId: true } shapes
          if (Array.isArray(participants)) return participants.includes(userId);
          return Object.keys(participants || {}).includes(userId);
        })
        .sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0));

      callback(userConversations);
    });

    return unsubscribe;
  }

  static getTotalUnreadCount(conversations: Conversation[]): number {
    return conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
  }
}