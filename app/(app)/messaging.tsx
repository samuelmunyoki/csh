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
import { useAuthStore } from '@/store/useAuthStore';
import { Message } from '@/types';
import { User } from 'firebase/auth';

export default function MessagingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<User | null>(null);

  const conversationId = params.conversationId as string;

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

    fetchOtherUser();

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
  }, [conversationId, user]);

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
