import { db } from '@/firebaseConfig';
import { Message, Conversation } from '@/types';
import { ref, set, get, update, push, query, orderByChild, limitToLast, onValue, off } from 'firebase/database';

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

      const message: Message = {
        id: newMessageRef.key || '',
        senderId,
        recipientId,
        content,
        images,
        transactionId,
        read: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await set(newMessageRef, message);

      // Update conversation
      const conversationId = [senderId, recipientId].sort().join('_');
      const conversationRef = ref(db, `conversations/${conversationId}`);

      await update(conversationRef, {
        lastMessage: message,
        lastMessageAt: Date.now(),
        [`participants/${senderId}`]: true,
        [`participants/${recipientId}`]: true,
      });

      // Add message to user's conversation
      const userConvRef = ref(db, `users/${recipientId}/conversations/${conversationId}`);
      await set(userConvRef, {
        unreadCount: (await this.getUnreadCount(recipientId, conversationId)) + 1,
      });

      return message;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send message');
    }
  }

  static async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const conversationsRef = ref(db, 'conversations');
      const snapshot = await get(conversationsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const allConversations = Object.values(snapshot.val()) as Conversation[];
      const userConversations = allConversations.filter((conv) =>
        Object.keys(conv.participants || {}).includes(userId)
      );

      // Sort by last message date
      userConversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);

      return userConversations;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch conversations');
    }
  }

  static async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const messagesRef = ref(db, 'messages');
      const snapshot = await get(messagesRef);

      if (!snapshot.exists()) {
        return [];
      }

      const allMessages = Object.values(snapshot.val()) as Message[];
      const conversationMessages = allMessages.filter(
        (msg) =>
          (msg.senderId === conversationId.split('_')[0] &&
            msg.recipientId === conversationId.split('_')[1]) ||
          (msg.senderId === conversationId.split('_')[1] &&
            msg.recipientId === conversationId.split('_')[0])
      );

      // Sort by date (oldest first)
      conversationMessages.sort((a, b) => a.createdAt - b.createdAt);

      return conversationMessages;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch messages');
    }
  }

  static async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const messageRef = ref(db, `messages/${messageId}`);
      await update(messageRef, { read: true });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark message as read');
    }
  }

  static async markConversationAsRead(userId: string, conversationId: string): Promise<void> {
    try {
      const userConvRef = ref(db, `users/${userId}/conversations/${conversationId}`);
      await update(userConvRef, { unreadCount: 0 });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark conversation as read');
    }
  }

  static async getUnreadCount(userId: string, conversationId: string): Promise<number> {
    try {
      const messagesRef = ref(db, 'messages');
      const snapshot = await get(messagesRef);

      if (!snapshot.exists()) {
        return 0;
      }

      const allMessages = Object.values(snapshot.val()) as Message[];
      const [id1, id2] = conversationId.split('_');

      const unreadCount = allMessages.filter(
        (msg) =>
          msg.recipientId === userId &&
          !msg.read &&
          ((msg.senderId === id1 && msg.recipientId === id2) ||
            (msg.senderId === id2 && msg.recipientId === id1))
      ).length;

      return unreadCount;
    } catch (error: any) {
      console.error('[MessagingService] Error getting unread count:', error);
      return 0;
    }
  }

  static subscribeToMessages(
    conversationId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    try {
      const messagesRef = ref(db, 'messages');

      const unsubscribe = onValue(messagesRef, (snapshot) => {
        if (snapshot.exists()) {
          const allMessages = Object.values(snapshot.val()) as Message[];
          const [id1, id2] = conversationId.split('_');

          const conversationMessages = allMessages.filter(
            (msg) =>
              (msg.senderId === id1 && msg.recipientId === id2) ||
              (msg.senderId === id2 && msg.recipientId === id1)
          );

          conversationMessages.sort((a, b) => a.createdAt - b.createdAt);
          callback(conversationMessages);
        }
      });

      return unsubscribe;
    } catch (error: any) {
      console.error('[MessagingService] Error subscribing to messages:', error);
      return () => {};
    }
  }

  static subscribeToConversations(
    userId: string,
    callback: (conversations: Conversation[]) => void
  ): () => void {
    try {
      const conversationsRef = ref(db, 'conversations');

      const unsubscribe = onValue(conversationsRef, (snapshot) => {
        if (snapshot.exists()) {
          const allConversations = Object.values(snapshot.val()) as Conversation[];
          const userConversations = allConversations.filter((conv) =>
            Object.keys(conv.participants || {}).includes(userId)
          );

          userConversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
          callback(userConversations);
        }
      });

      return unsubscribe;
    } catch (error: any) {
      console.error('[MessagingService] Error subscribing to conversations:', error);
      return () => {};
    }
  }

  static getTotalUnreadCount(conversations: Conversation[]): number {
    return conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
  }
}
