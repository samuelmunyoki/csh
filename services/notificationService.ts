import * as Notifications from 'expo-notifications';
import { ref, set, get, update, push, query } from 'firebase/database';
import { db } from '@/firebaseConfig';
import { PushNotification } from '@/types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  static async requestNotificationPermission(): Promise<boolean> {
    try {
      const settings = await Notifications.getPermissionsAsync();

      if (settings.granted) {
        return true;
      }

      if (settings.canAskAgain) {
        const newSettings = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        return newSettings.granted;
      }

      return false;
    } catch (error) {
      console.error('[NotificationService] Error requesting permission:', error);
      return false;
    }
  }

  static async registerForPushNotifications(): Promise<string | null> {
    try {
      const hasPermission = await this.requestNotificationPermission();
      if (!hasPermission) {
        console.warn('[NotificationService] Notification permission not granted');
        return null;
      }

      // Get the push token
      const expoPushToken = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      return expoPushToken.data;
    } catch (error) {
      console.error('[NotificationService] Error registering for push notifications:', error);
      return null;
    }
  }

  static async sendLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
          badge: 1,
        },
        trigger: null, // Send immediately
      });

      return notificationId;
    } catch (error) {
      console.error('[NotificationService] Error sending local notification:', error);
      throw error;
    }
  }

  static async scheduleNotification(
    title: string,
    body: string,
    delayMs: number,
    data?: Record<string, any>
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
          badge: 1,
        },
        trigger: {
          type: 'time',
          timestamp: Date.now() + delayMs,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('[NotificationService] Error scheduling notification:', error);
      throw error;
    }
  }

  static async savePushNotification(
    userId: string,
    title: string,
    body: string,
    type: 'message' | 'transaction' | 'donation' | 'system',
    data?: Record<string, any>
  ): Promise<PushNotification> {
    try {
      const notificationsRef = ref(db, 'push_notifications');
      const newNotifRef = push(notificationsRef);

      const notification: PushNotification = {
        id: newNotifRef.key || '',
        userId,
        title,
        body,
        data,
        type,
        read: false,
        createdAt: Date.now(),
      };

      await set(newNotifRef, notification);

      // Add to user's notifications
      const userNotifRef = ref(db, `users/${userId}/notifications/${newNotifRef.key}`);
      await set(userNotifRef, true);

      return notification;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to save notification');
    }
  }

  static async getUserNotifications(userId: string): Promise<PushNotification[]> {
    try {
      const notificationsRef = ref(db, 'push_notifications');
      const snapshot = await get(notificationsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const allNotifications = Object.values(snapshot.val()) as PushNotification[];
      const userNotifications = allNotifications.filter((n) => n.userId === userId);

      // Sort by date (newest first)
      userNotifications.sort((a, b) => b.createdAt - a.createdAt);

      return userNotifications;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch notifications');
    }
  }

  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notifRef = ref(db, `push_notifications/${notificationId}`);
      await update(notifRef, { read: true });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark notification as read');
    }
  }

  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notifRef = ref(db, `push_notifications/${notificationId}`);
      await update(notifRef, { deleted: true });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete notification');
    }
  }

  static subscribeToNotifications(
    userId: string,
    callback: (notifications: PushNotification[]) => void
  ): () => void {
    try {
      const unsubscribeToNotif = Notifications.addNotificationReceivedListener((notification: { request: { content: { data: any; }; }; }) => {
        const notificationData = notification.request.content.data;
        // Handle notification when app is in foreground
        console.log('[NotificationService] Notification received:', notificationData);
      });

      const unsubscribeToResponse = Notifications.addNotificationResponseReceivedListener(
        (response: { notification: { request: { content: { data: any; }; }; }; }) => {
          const notificationData = response.notification.request.content.data;
          // Handle notification tap
          console.log('[NotificationService] Notification tapped:', notificationData);
        }
      );

      return () => {
        unsubscribeToNotif.remove();
        unsubscribeToResponse.remove();
      };
    } catch (error) {
      console.error('[NotificationService] Error subscribing to notifications:', error);
      return () => {};
    }
  }

  static async notifyMessageReceived(
    recipientId: string,
    senderName: string,
    messagePreview: string
  ): Promise<void> {
    try {
      await this.sendLocalNotification('New Message', `${senderName}: ${messagePreview}`, {
        type: 'message',
        recipientId,
      });

      await this.savePushNotification(
        recipientId,
        'New Message',
        `${senderName}: ${messagePreview}`,
        'message',
        { senderName }
      );
    } catch (error) {
      console.error('[NotificationService] Error notifying message:', error);
    }
  }

  static async notifyTransactionUpdate(
    userId: string,
    itemTitle: string,
    status: string
  ): Promise<void> {
    try {
      await this.sendLocalNotification(
        'Transaction Update',
        `${itemTitle} - ${status}`,
        { type: 'transaction', itemTitle, status }
      );

      await this.savePushNotification(
        userId,
        'Transaction Update',
        `${itemTitle} - ${status}`,
        'transaction',
        { itemTitle, status }
      );
    } catch (error) {
      console.error('[NotificationService] Error notifying transaction:', error);
    }
  }

  static async notifyDonationUpdate(
    userId: string,
    itemTitle: string,
    status: string
  ): Promise<void> {
    try {
      await this.sendLocalNotification('Donation Update', `${itemTitle} - ${status}`, {
        type: 'donation',
        itemTitle,
        status,
      });

      await this.savePushNotification(
        userId,
        'Donation Update',
        `${itemTitle} - ${status}`,
        'donation',
        { itemTitle, status }
      );
    } catch (error) {
      console.error('[NotificationService] Error notifying donation:', error);
    }
  }
}
