import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SearchIcon, FilterIcon } from 'lucide-react-native';
import { useMarketplaceStore } from '@/store/useMarketplaceStore';

export default function MarketplaceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const { items, loading, fetchItems, searchItems } = useMarketplaceStore();

  useEffect(() => {
    if (params.category) {
      fetchItems(params.category as string);
    } else {
      fetchItems();
    }
  }, [params.category]);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await searchItems(searchQuery);
    } else {
      fetchItems(params.category as string);
    }
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
      className="bg-white rounded-lg overflow-hidden shadow-sm mb-4 flex-1 margin-1"
    >
      {item.images[0] && (
        <Image
          source={{ uri: item.images[0] }}
          className="w-full h-[150px]"
          resizeMode="cover"
        />
      )}
      <View className="p-3">
        <Text className="font-semibold text-gray-900" numberOfLines={2}>
          {item.title}
        </Text>
        <Text className="text-blue-600 font-bold text-lg mt-2">${item.price}</Text>
        <View className="flex-row justify-between mt-2">
          <Text className="text-gray-500 text-xs">{item.condition}</Text>
          <Text className="text-gray-400 text-xs">{item.views} views</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900 mb-4">Marketplace</Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <SearchIcon size={20} color="#9ca3af" />
          <TextInput
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onEndEditing={handleSearch}
            className="flex-1 ml-2 text-gray-900"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-gray-500 text-lg text-center">
            No items found. Try adjusting your search or category.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItemCard}
          keyExtractor={(item) => item.id}
          // numColumns={2}
          // columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 8 }}
          contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
