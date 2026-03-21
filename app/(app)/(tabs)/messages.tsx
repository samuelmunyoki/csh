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
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = MessagingService.subscribeToConversations(user.id, (convs) => {
      setConversations(convs);
      setLoading(false);

      // participants is stored as { userId: true } in Firebase, not an array
      const unknownIds = convs
        .flatMap((c) => {
          const participants = c.participants;
          if (Array.isArray(participants)) return participants;
          return Object.keys(participants || {});
        })
        .filter((id) => id !== user.id)
        .filter((id, index, arr) => arr.indexOf(id) === index);

      if (unknownIds.length === 0) return;

      Promise.allSettled(
        unknownIds.map((id) => AuthService.getUserById(id))
      ).then((results) => {
        const userMap: Record<string, User> = {};
        results.forEach((result, i) => {
          if (result.status === 'fulfilled' && result.value) {
            userMap[unknownIds[i]] = result.value;
          }
        });
        setUsers((prev) => ({ ...prev, ...userMap }));
      });
    });

    return () => unsubscribe();
  }, [user]);

  const handleConversationPress = (conversationId: string) => {
    router.push({
      pathname: '/(app)/messaging',
      params: { conversationId },
    });
  };

  const renderConversationCard = ({ item }: { item: Conversation }) => {
    const participantIds = Array.isArray(item.participants)
      ? item.participants
      : Object.keys(item.participants || {});

    const participantId = participantIds.find((id) => id !== user?.id);
    const participantUser = participantId ? users[participantId] : null;
    const hasUnread = (item.unreadCount ?? 0) > 0;

    return (
      <TouchableOpacity
        onPress={() => handleConversationPress(item.id)}
        className={`px-4 py-3 border-b border-gray-100 flex-row items-center ${
          hasUnread ? 'bg-blue-50' : 'bg-white'
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
          <Text className={`text-gray-900 ${hasUnread ? 'font-bold' : 'font-semibold'}`}>
            {participantUser?.name || 'Unknown'}
          </Text>
          <Text
            className={`text-sm mt-1 ${hasUnread ? 'text-gray-800 font-semibold' : 'text-gray-600'}`}
            numberOfLines={1}
          >
            {item.lastMessage?.content || 'No messages yet'}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-gray-500 text-xs">
            {item.lastMessageAt
              ? formatDistanceToNow(item.lastMessageAt, { addSuffix: true })
              : ''}
          </Text>
          {hasUnread && (
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
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Messages</Text>
      </View>

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