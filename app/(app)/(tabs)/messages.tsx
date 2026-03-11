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
import { AuthService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { Conversation, User } from '@/types';

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const unsubscribe = MessagingService.subscribeToConversations(user.id, async (convs) => {
        setConversations(convs);

        // Fetch user info for each conversation participant
        const userMap: Record<string, User> = {};
        for (const conv of convs) {
          for (const participantId of conv.participants) {
            if (participantId !== user.id && !userMap[participantId]) {
              try {
                const userData = await AuthService.getUserById(participantId);
                if (userData) {
                  userMap[participantId] = userData;
                }
              } catch (error) {
                console.error('[MessagesScreen] Error fetching user:', error);
              }
            }
          }
        }
        setUsers(userMap);
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
    const participantId = item.participants.find((id) => id !== user?.id);
    const participantUser = participantId ? users[participantId] : null;

    return (
      <TouchableOpacity
        onPress={() => handleConversationPress(item.id)}
        className={`bg-white px-4 py-3 border-b border-gray-100 flex-row items-center ${
          item.unreadCount > 0 ? 'bg-blue-50' : ''
        }`}
      >
        {participantUser?.avatar ? (
          <Image
            source={{ uri: participantUser.avatar }}
            className="w-12 h-12 rounded-full mr-3"
          />
        ) : (
          <View className="w-12 h-12 rounded-full bg-blue-300 mr-3 items-center justify-center">
            <Text className="text-white font-bold text-lg">
              {participantUser?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        )}

        <View className="flex-1">
          <Text className={`font-semibold text-gray-900 ${item.unreadCount > 0 ? 'font-bold' : ''}`}>
            {participantUser?.name || 'Unknown'}
          </Text>
          <Text
            className={`text-sm mt-1 ${item.unreadCount > 0 ? 'text-gray-800 font-semibold' : 'text-gray-600'}`}
            numberOfLines={1}
          >
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
