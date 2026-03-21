import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { PlusIcon, SearchIcon } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { useMarketplaceStore } from '@/store/useMarketplaceStore';
import { formatPrice } from '@/utils/currency';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, loading, fetchItems } = useMarketplaceStore();

  useEffect(() => {
    fetchItems();
  }, []);

  const categories = [
    'textbooks',
    'electronics',
    'furniture',
    'clothing',
    'supplies',
    'services',
  ];

  const handleCategorySelect = (category: string) => {
    router.push({
      pathname: '/(app)/marketplace',
      params: { category },
    });
  };

  const handleItemPress = (itemId: string) => {
    router.push({
      pathname: '/(app)/item-details',
      params: { id: itemId },
    });
  };

  const renderItemCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handleItemPress(item.id)}
      className="bg-white rounded-lg overflow-hidden shadow-sm mb-4 mr-4 w-[160px]"
    >
      {item.images[0] && (
        <Image
          source={{ uri: item.images[0] }}
          className="w-full h-[120px]"
          resizeMode="cover"
        />
      )}
      <View className="p-3">
        <Text className="font-semibold text-gray-900 text-sm" numberOfLines={2}>
          {item.title}
        </Text>
        <Text className="text-blue-600 font-bold text-lg mt-2">{formatPrice(item.price)}</Text>
        <Text className="text-gray-500 text-xs mt-1">{item.condition}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-blue-600 px-4 pt-8 pb-6">
          <Text className="text-white text-2xl font-bold">Welcome back, {user?.name}!</Text>
          <Text className="text-blue-100 text-sm mt-1">Find great campus deals today</Text>
        </View>

        {/* Search Bar */}
        <View className="px-4 -mt-3 mb-6">
          <TouchableOpacity
            onPress={() => router.push('/(app)/marketplace')}
            className="bg-white rounded-lg px-4 py-3 flex-row items-center shadow-sm border border-gray-200"
          >
            <SearchIcon size={20} color="#9ca3af" />
            <Text className="ml-3 text-gray-500 flex-1">Search items...</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View className="mb-6">
          <Text className="font-bold text-gray-900 px-4 mb-3">Browse Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => handleCategorySelect(category)}
                className="bg-white px-4 py-2 rounded-full border border-blue-200"
              >
                <Text className="text-blue-600 font-medium capitalize">{category}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Items */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between px-4 mb-3">
            <Text className="font-bold text-gray-900">Featured Items</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/marketplace')}>
              <Text className="text-blue-600 font-medium">See all</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="h-40 justify-center items-center">
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : (
            <FlatList
              data={items.slice(0, 6)}
              renderItem={renderItemCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              scrollEnabled={false}
              // columnWrapperStyle={{ marginBottom: 8 }}
              // numColumns={2}
            />
          )}
        </View>

        {/* Quick Actions */}
        <View className="px-4 mb-6">
          <Text className="font-bold text-gray-900 mb-3">Quick Actions</Text>
          <TouchableOpacity
            onPress={() => router.push('/(app)/create-item')}
            className="bg-blue-600 rounded-lg px-4 py-3 flex-row items-center"
          >
            <PlusIcon size={20} color="white" />
            <Text className="text-white font-medium ml-2 flex-1">Sell an Item</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
