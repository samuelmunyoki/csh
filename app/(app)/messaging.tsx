import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import {
  SendIcon,
  ArrowLeftIcon,
  ShoppingBagIcon,
  GiftIcon,
  CheckCircleIcon,
  ClockIcon,
} from 'lucide-react-native';
import { AuthService } from '@/services/authService';
import { MessagingService } from '@/services/messagingService';
import { TransactionService } from '@/services/transactionService';
import { DonationService } from '@/services/donationService';
import { useAuthStore } from '@/store/useAuthStore';
import { Message, Transaction, Donation } from '@/types';

type AppUser = {
  id: string;
  name?: string;
  displayName?: string;
  email?: string;
};

export default function MessagingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<AppUser | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [donation, setDonation] = useState<Donation | null>(null);

  // Safely extract conversationId — params can be string or string[]
  const conversationId = Array.isArray(params.conversationId)
    ? params.conversationId[0]
    : params.conversationId as string;

  const transactionId = Array.isArray(params.transactionId)
    ? params.transactionId[0]
    : params.transactionId as string | undefined;

  useEffect(() => {
    if (!conversationId || !user) {
      setMessagesLoading(false);
      setUserLoading(false);
      return;
    }

    const parts = conversationId.split('_');
    if (parts.length < 2) {
      console.error('[MessagingScreen] Invalid conversationId format:', conversationId);
      setMessagesLoading(false);
      setUserLoading(false);
      return;
    }

    const [id1, id2] = parts;
    const otherUserId = user.id === id1 ? id2 : id1;

    const fetchOtherUser = async () => {
      try {
        const userData = await AuthService.getUserById(otherUserId);
        setOtherUser(userData);
      } catch (error) {
        console.error('[MessagingScreen] Error fetching user:', error);
      } finally {
        setUserLoading(false);
      }
    };

    const fetchContext = async () => {
      try {
        if (transactionId) {
          const trans = await TransactionService.getTransactionById(transactionId);
          if (trans) setTransaction(trans);
        } else {
          const [userTransactions, donated, received] = await Promise.all([
            TransactionService.getUserTransactions(user.id),
            DonationService.getUserDonationsMade(user.id),
            DonationService.getUserDonationsReceived(user.id),
          ]);

          const relatedTrans = userTransactions.find(
            (t) =>
              (t.buyerId === user.id && t.vendorId === otherUserId) ||
              (t.vendorId === user.id && t.buyerId === otherUserId)
          );
          if (relatedTrans) setTransaction(relatedTrans);

          const relatedDonation = [...donated, ...received].find(
            (d) =>
              (d.donorId === user.id && d.recipientId === otherUserId) ||
              (d.recipientId === user.id && d.donorId === otherUserId)
          );
          if (relatedDonation) setDonation(relatedDonation);
        }
      } catch (error) {
        console.error('[MessagingScreen] Error fetching context:', error);
      }
    };

    fetchOtherUser();
    fetchContext();

    const unsubscribe = MessagingService.subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setMessagesLoading(false);
      msgs.forEach((msg) => {
        if (msg.recipientId === user.id && !msg.read) {
          MessagingService.markMessageAsRead(msg.id);
        }
      });
    });

    return () => unsubscribe();
  }, [conversationId, user?.id]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user || !conversationId) return;

    const [id1, id2] = conversationId.split('_');
    const recipientId = user.id === id1 ? id2 : id1;

    const text = messageText.trim();
    setMessageText(''); // clear immediately for responsiveness

    try {
      await MessagingService.sendMessage(user.id, recipientId, text);
    } catch (error) {
      console.error('[MessagingScreen] Error sending message:', error);
      setMessageText(text); // restore on failure
    }
  };

  const renderMessageBubble = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.id;
    return (
      <View className={`flex-row ${isOwn ? 'justify-end' : 'justify-start'} mb-3 px-4`}>
        <View
          className={`rounded-2xl px-4 py-2 ${isOwn ? 'bg-blue-600' : 'bg-gray-200'}`}
          style={{ maxWidth: '75%' }}
        >
          <Text className={isOwn ? 'text-white' : 'text-gray-900'}>{item.content}</Text>
          <Text className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
            {formatDistanceToNow(item.createdAt, { addSuffix: true })}
          </Text>
        </View>
      </View>
    );
  };

  if (!conversationId) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-500">No conversation selected</Text>
      </View>
    );
  }

  const otherUserName = otherUser?.name || otherUser?.displayName || 'Unknown User';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      {/* Header */}
      <View className="flex-row items-center bg-white border-b border-gray-200 px-4 py-3 pt-12">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ArrowLeftIcon size={24} color="#1f2937" />
        </TouchableOpacity>
        <View className="flex-1">
          {userLoading ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <>
              <Text className="font-semibold text-gray-900 text-base">{otherUserName}</Text>
              {!!otherUser?.email && (
                <Text className="text-gray-500 text-xs">{otherUser.email}</Text>
              )}
            </>
          )}
        </View>
      </View>

      {/* Transaction Context Banner */}
      {transaction && (
        <View className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <View className="flex-row items-center gap-3">
            <ShoppingBagIcon size={18} color="#2563eb" />
            <View className="flex-1">
              <Text className="font-semibold text-gray-900 text-sm">Purchase</Text>
              <Text className="text-gray-600 text-xs">
                ${transaction.amount} ·{' '}
                {transaction.status === 'completed' ? 'Completed' : 'In Progress'}
              </Text>
            </View>
            {transaction.status === 'completed' ? (
              <CheckCircleIcon size={18} color="#10b981" />
            ) : (
              <ClockIcon size={18} color="#f59e0b" />
            )}
          </View>
        </View>
      )}

      {/* Donation Context Banner */}
      {donation && (
        <View className="bg-green-50 border-b border-green-200 px-4 py-3">
          <View className="flex-row items-center gap-3">
            <GiftIcon size={18} color="#10b981" />
            <View className="flex-1">
              <Text className="font-semibold text-gray-900 text-sm">Donation Request</Text>
              <Text className="text-gray-600 text-xs capitalize">{donation.status}</Text>
            </View>
            {donation.status === 'accepted' ? (
              <CheckCircleIcon size={18} color="#10b981" />
            ) : (
              <ClockIcon size={18} color="#f59e0b" />
            )}
          </View>
        </View>
      )}

      {/* Messages */}
      {messagesLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : messages.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-gray-400 text-center">
            No messages yet. Say hello!
          </Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderMessageBubble}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 12 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {}}
          ref={(ref) => {
            if (ref && messages.length > 0) {
              ref.scrollToEnd({ animated: false });
            }
          }}
        />
      )}

      {/* Input */}
      <View className="bg-white border-t border-gray-200 px-4 py-3 flex-row items-end gap-2">
        <TextInput
          placeholder="Type a message..."
          value={messageText}
          onChangeText={setMessageText}
          className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 text-gray-900"
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={500}
          style={{ maxHeight: 100 }}
        />
        <TouchableOpacity
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
          className={`rounded-full p-3 ${messageText.trim() ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <SendIcon size={18} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}