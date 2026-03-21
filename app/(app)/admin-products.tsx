import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CheckIcon, XIcon, AlertCircleIcon } from 'lucide-react-native';
import { MarketplaceService } from '@/services/marketplaceService';
import { AuthService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { MarketplaceItem, User } from '@/types';
import { formatPrice } from '@/utils/currency';

export default function AdminProductsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [vendors, setVendors] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'Only admins can access this panel');
      router.back();
      return;
    }

    fetchPendingItems();
  }, [isAdmin]);

  const fetchPendingItems = async () => {
    setLoading(true);
    try {
      const pendingItems = await MarketplaceService.getPendingItems();
      setItems(pendingItems);

      // Fetch vendor details for all items
      const vendorMap: Record<string, User> = {};
      for (const item of pendingItems) {
        if (!vendorMap[item.vendorId]) {
          try {
            const vendorData = await AuthService.getUserById(item.vendorId);
            if (vendorData) {
              vendorMap[item.vendorId] = vendorData;
            }
          } catch (error) {
            console.error('[AdminProducts] Error fetching vendor:', error);
          }
        }
      }
      setVendors(vendorMap);
    } catch (error) {
      console.error('[AdminProducts] Error fetching pending items:', error);
      Alert.alert('Error', 'Failed to fetch pending items');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveItem = async (itemId: string) => {
    try {
      await MarketplaceService.approveItem(itemId);
      Alert.alert('Success', 'Product approved and is now visible to users');
      setSelectedItem(null);
      fetchPendingItems();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to approve item');
    }
  };

  const handleRejectItem = async (itemId: string) => {
    Alert.prompt(
      'Reject Product',
      'Provide a reason for rejection:',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Reject',
          onPress: async (reason) => {
            try {
              // Store rejection reason if needed in future
              await MarketplaceService.rejectItem(itemId);
              Alert.alert('Success', 'Product rejected');
              setSelectedItem(null);
              fetchPendingItems();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reject item');
            }
          },
        },
      ]
    );
  };

  const renderItemDetail = () => {
    if (!selectedItem) return null;

    const vendor = vendors[selectedItem.vendorId];

    return (
      <View className="bg-white border-t border-gray-200 p-4">
        <View className="flex-row justify-between items-start mb-4">
          <Text className="text-lg font-bold text-gray-900 flex-1">
            {selectedItem.title}
          </Text>
          <TouchableOpacity onPress={() => setSelectedItem(null)}>
            <Text className="text-blue-600 font-semibold">Close</Text>
          </TouchableOpacity>
        </View>

        {selectedItem.images[0] && (
          <Image
            source={{ uri: selectedItem.images[0] }}
            className="w-full h-48 rounded-lg mb-4"
            resizeMode="cover"
          />
        )}

        <Text className="text-gray-600 mb-4">{selectedItem.description}</Text>

        <View className="bg-gray-50 rounded-lg p-3 mb-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Price:</Text>
            <Text className="font-bold text-blue-600">{formatPrice(selectedItem.price)}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Category:</Text>
            <Text className="font-semibold text-gray-900 capitalize">
              {selectedItem.category}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Condition:</Text>
            <Text className="font-semibold text-gray-900 capitalize">
              {selectedItem.condition}
            </Text>
          </View>
        </View>

        {vendor && (
          <View className="bg-blue-50 rounded-lg p-3 mb-4">
            <Text className="text-sm text-gray-600 mb-2">Vendor Information</Text>
            <Text className="font-semibold text-gray-900">{vendor.name}</Text>
            <Text className="text-sm text-gray-600">{vendor.email}</Text>
            {vendor.university && (
              <Text className="text-sm text-gray-600">{vendor.university}</Text>
            )}
          </View>
        )}

        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => handleApproveItem(selectedItem.id)}
            className="flex-1 bg-green-600 rounded-lg py-3 items-center flex-row justify-center gap-2"
          >
            <CheckIcon size={20} color="white" />
            <Text className="text-white font-semibold">Approve</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleRejectItem(selectedItem.id)}
            className="flex-1 bg-red-600 rounded-lg py-3 items-center flex-row justify-center gap-2"
          >
            <XIcon size={20} color="white" />
            <Text className="text-white font-semibold">Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderItemCard = ({ item }: { item: MarketplaceItem }) => {
    const vendor = vendors[item.vendorId];

    return (
      <TouchableOpacity
        onPress={() => setSelectedItem(item)}
        className={`bg-white rounded-lg overflow-hidden mb-3 shadow-sm border-l-4 ${
          selectedItem?.id === item.id ? 'border-blue-600' : 'border-yellow-400'
        }`}
      >
        <View className="flex-row">
          {item.images[0] && (
            <Image
              source={{ uri: item.images[0] }}
              className="w-20 h-20"
              resizeMode="cover"
            />
          )}
          <View className="flex-1 p-3 justify-between">
            <View>
              <Text className="font-semibold text-gray-900 text-sm" numberOfLines={1}>
                {item.title}
              </Text>
              <Text className="text-blue-600 font-bold">${item.price}</Text>
            </View>
            <Text className="text-xs text-gray-500">
              Seller: {vendor?.name || 'Unknown'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-200">
        <View className="flex-row items-center gap-2 mb-2">
          <AlertCircleIcon size={24} color="#f59e0b" />
          <Text className="text-2xl font-bold text-gray-900">Product Approvals</Text>
        </View>
        <Text className="text-gray-600">
          {items.length} pending {items.length === 1 ? 'item' : 'items'}
        </Text>
      </View>

      {/* Main Content */}
      <View className="flex-1 flex-row">
        {/* Items List */}
        <View className="flex-1">
          {items.length === 0 ? (
            <View className="flex-1 justify-center items-center px-4">
              <Text className="text-gray-500 text-center">
                No pending products to review
              </Text>
            </View>
          ) : (
            <FlatList
              data={items}
              renderItem={renderItemCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={true}
              contentContainerStyle={{ padding: 12 }}
            />
          )}
        </View>

        {/* Detail Panel - Conditionally Render */}
        {selectedItem && (
          <ScrollView className="w-96 bg-gray-100 border-l border-gray-200">
            {renderItemDetail()}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
