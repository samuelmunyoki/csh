import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { MessagingService } from '@/services/messagingService';
import { useAuthStore } from '@/store/useAuthStore';
import { Conversation } from '@/types';

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const unsubscribe = MessagingService.subscribeToConversations(user.id, (convs) => {
        setConversations(convs);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const handleConversationPress = (conversationId: string) => {
    router.push({
      pathname: '/(app)/messaging',
      params: { conversationId },
    });
  };

  const renderConversationCard = ({ item }: { item: Conversation }) => {
    const participantId = Object.keys(item.participants).find((id) => id !== user?.id);

    return (
      <TouchableOpacity
        onPress={() => handleConversationPress(item.id)}
        className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center"
      >
        <View className="w-12 h-12 rounded-full bg-gray-300 mr-3" />
        <View className="flex-1">
          <Text className="font-semibold text-gray-900">{participantId}</Text>
          <Text className="text-gray-600 text-sm mt-1" numberOfLines={1}>
            {item.lastMessage?.content || 'No messages yet'}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-gray-500 text-xs">
            {item.lastMessageAt ? formatDistanceToNow(item.lastMessageAt, { addSuffix: true }) : ''}
          </Text>
          {item.unreadCount > 0 && (
            <View className="bg-blue-600 rounded-full w-6 h-6 justify-center items-center mt-1">
              <Text className="text-white text-xs font-bold">{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Messages</Text>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : conversations.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-gray-500 text-lg text-center">
            No conversations yet. Start messaging when you interact with items!
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
