import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { SendIcon, ArrowLeftIcon } from 'lucide-react-native';
import { AuthService } from '@/services/authService';
import { MessagingService } from '@/services/messagingService';
import { TransactionService } from '@/services/transactionService';
import { DonationService } from '@/services/donationService';
import { useAuthStore } from '@/store/useAuthStore';
import { Message, Transaction, Donation } from '@/types';
import { User } from 'firebase/auth';
import { ShoppingBagIcon, GiftIcon, CheckCircleIcon, ClockIcon } from 'lucide-react-native';

export default function MessagingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [donation, setDonation] = useState<Donation | null>(null);

  const conversationId = params.conversationId as string;
  const transactionId = params.transactionId as string;

  useEffect(() => {
    if (!conversationId || !user) return;

    // Get the other user's ID
    const [id1, id2] = conversationId.split('_');
    const otherUserId = user.id === id1 ? id2 : id1;

    // Fetch other user's info
    const fetchOtherUser = async () => {
      try {
        const userData = await AuthService.getUserById(otherUserId);
        setOtherUser(userData);
      } catch (error) {
        console.error('[MessagingScreen] Error fetching user:', error);
      }
    };

    // Fetch transaction/donation context if available
    const fetchContext = async () => {
      try {
        if (transactionId) {
          const trans = await TransactionService.getTransactionById(transactionId);
          if (trans) setTransaction(trans);
        } else {
          // Try to find transaction between users
          const userTransactions = await TransactionService.getUserTransactions(user.id);
          const relatedTrans = userTransactions.find(
            (t) =>
              (t.buyerId === user.id && t.vendorId === otherUserId) ||
              (t.vendorId === user.id && t.buyerId === otherUserId)
          );
          if (relatedTrans) setTransaction(relatedTrans);

          // Also check for donations
          const userDonations = await Promise.all([
            DonationService.getUserDonationsMade(user.id),
            DonationService.getUserDonationsReceived(user.id),
          ]);
          const allDonations = [...userDonations[0], ...userDonations[1]];
          const relatedDonation = allDonations.find(
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

    // Subscribe to messages
    const unsubscribe = MessagingService.subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);

      // Mark messages as read
      msgs.forEach((msg) => {
        if (msg.recipientId === user.id && !msg.read) {
          MessagingService.markMessageAsRead(msg.id);
        }
      });
    });

    return () => unsubscribe();
  }, [conversationId, user, transactionId]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user) return;

    try {
      const [id1, id2] = conversationId.split('_');
      const recipientId = user.id === id1 ? id2 : id1;

      await MessagingService.sendMessage(user.id, recipientId, messageText.trim());
      setMessageText('');
    } catch (error) {
      console.error('[MessagingScreen] Error sending message:', error);
    }
  };

  const renderMessageBubble = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.id;

    return (
      <View className={`flex-row ${isOwn ? 'justify-end' : 'justify-start'} mb-3 px-4`}>
        <View
          className={`max-w-xs rounded-lg px-4 py-2 ${
            isOwn ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <Text className={`${isOwn ? 'text-white' : 'text-gray-900'}`}>
            {item.content}
          </Text>
          <Text
            className={`text-xs mt-1 ${
              isOwn ? 'text-blue-100' : 'text-gray-600'
            }`}
          >
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      {/* Header */}
      <View className="flex-row items-center bg-white border-b border-gray-200 px-4 py-3">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeftIcon size={24} color="#1f2937" />
        </TouchableOpacity>
        {loading ? (
          <View className="ml-3 flex-1">
            <ActivityIndicator size="small" color="#2563eb" />
          </View>
        ) : (
          <View className="ml-3 flex-1">
            <Text className="font-semibold text-gray-900">{otherUser?.name}</Text>
            <Text className="text-gray-600 text-sm">{otherUser?.email}</Text>
          </View>
        )}
      </View>

      {/* Transaction/Donation Context */}
      {transaction && (
        <View className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <View className="flex-row items-center gap-3">
            <ShoppingBagIcon size={20} color="#2563eb" />
            <View className="flex-1">
              <Text className="font-semibold text-gray-900 text-sm">Purchase</Text>
              <Text className="text-gray-600 text-xs">
                ${transaction.amount} - {transaction.status === 'completed' ? 'Completed' : 'In Progress'}
              </Text>
            </View>
            {transaction.status === 'completed' && (
              <CheckCircleIcon size={18} color="#10b981" />
            )}
            {transaction.status === 'initiated' && (
              <ClockIcon size={18} color="#f59e0b" />
            )}
          </View>
        </View>
      )}

      {donation && (
        <View className="bg-green-50 border-b border-green-200 px-4 py-3">
          <View className="flex-row items-center gap-3">
            <GiftIcon size={20} color="#10b981" />
            <View className="flex-1">
              <Text className="font-semibold text-gray-900 text-sm">Donation Request</Text>
              <Text className="text-gray-600 text-xs capitalize">{donation.status}</Text>
            </View>
            {donation.status === 'accepted' && (
              <CheckCircleIcon size={18} color="#10b981" />
            )}
            {donation.status === 'pending' && (
              <ClockIcon size={18} color="#f59e0b" />
            )}
          </View>
        </View>
      )}

      {/* Messages */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : messages.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-gray-500 text-center">
            No messages yet. Start the conversation!
          </Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderMessageBubble}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 8 }}
          showsVerticalScrollIndicator={false}
          inverted={false}
        />
      )}

      {/* Input */}
      <View className="bg-white border-t border-gray-200 px-4 py-3 flex-row items-center gap-2">
        <TextInput
          placeholder="Type a message..."
          value={messageText}
          onChangeText={setMessageText}
          className="flex-1 bg-gray-100 rounded-lg px-4 py-2 text-gray-900"
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
          className="bg-blue-600 rounded-lg p-3"
        >
          <SendIcon size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
