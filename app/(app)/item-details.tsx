import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeftIcon, HeartIcon, MessageCircleIcon, ShareIcon } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { useMarketplaceStore } from '@/store/useMarketplaceStore';
import { useLoadingStore } from '@/store/useLoadingStore';
import { TransactionService } from '@/services/transactionService';
import { DonationService } from '@/services/donationService';
import { MarketplaceService } from '@/services/marketplaceService';

export default function ItemDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const { selectedItem, loading, fetchItemById } = useMarketplaceStore();
  const { setLoading } = useLoadingStore();

  useEffect(() => {
    if (params.id) {
      fetchItemById(params.id as string);
    }
  }, [params.id]);

  const handleMessage = () => {
    if (!selectedItem) return;
    router.push({
      pathname: '/(app)/messaging',
      params: {
        conversationId: [user?.id, selectedItem.vendorId].sort().join('_'),
      },
    });
  };

  const handleSaveItem = () => {
    Alert.alert('Save Item', 'Item has been saved to your collection');
  };

  const handleBuyItem = async () => {
    if (!user || !selectedItem) return;
    
    // Can't buy own item
    if (user.id === selectedItem.vendorId) {
      Alert.alert('Error', "You can't buy your own item");
      return;
    }

    Alert.alert(
      'Purchase Item',
      `Buy "${selectedItem.title}" for $${selectedItem.price} (Payment: Cash)?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Purchase',
          onPress: async () => {
            try {
              setLoading(true, 'Processing purchase...');
              
              // Create transaction with cash payment
              const transaction = await TransactionService.initiateTransaction(
                selectedItem.id,
                user.id,
                selectedItem.vendorId,
                selectedItem.price,
                'cash',
                'Cash payment upon meeting'
              );

              // Mark item as sold
              await MarketplaceService.markItemAsSold(selectedItem.id);

              setLoading(false);
              Alert.alert('Success', 'Purchase initiated! You can now message the seller to arrange pickup.');
              
              // Navigate to messaging
              setTimeout(() => {
                router.push({
                  pathname: '/(app)/messaging',
                  params: {
                    conversationId: [user.id, selectedItem.vendorId].sort().join('_'),
                    transactionId: transaction.id,
                  },
                });
              }, 500);
            } catch (error: any) {
              setLoading(false);
              Alert.alert('Error', error.message || 'Failed to process purchase');
            }
          },
        },
      ]
    );
  };

  const handleRequestDonation = async () => {
    if (!user || !selectedItem) return;

    // Can't request own donation
    if (user.id === selectedItem.vendorId) {
      Alert.alert('Error', "You can't request your own donation");
      return;
    }

    Alert.prompt(
      'Request Donation',
      'Tell the donor why you need this item:',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Send Request',
          onPress: async (message) => {
            if (!message || !message.trim()) {
              Alert.alert('Error', 'Please provide a reason');
              return;
            }

            try {
              setLoading(true, 'Sending donation request...');

              // Create donation request
              const donation = await DonationService.requestDonation(
                selectedItem.id,
                selectedItem.vendorId,
                user.id,
                message.trim()
              );

              setLoading(false);
              Alert.alert('Success', 'Donation request sent! The donor will review it.');

              // Navigate to messaging to wait for response
              setTimeout(() => {
                router.push({
                  pathname: '/(app)/messaging',
                  params: {
                    conversationId: [user.id, selectedItem.vendorId].sort().join('_'),
                  },
                });
              }, 500);
            } catch (error: any) {
              setLoading(false);
              Alert.alert('Error', error.message || 'Failed to send donation request');
            }
          },
        },
      ]
    );
  };

  if (loading || !selectedItem) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        {selectedItem.images[0] && (
          <Image
            source={{ uri: selectedItem.images[0] }}
            className="w-full h-80"
            resizeMode="cover"
          />
        )}

        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-4 left-4 bg-white rounded-full p-2"
        >
          <ArrowLeftIcon size={24} color="#1f2937" />
        </TouchableOpacity>

        {/* Details Container */}
        <View className="bg-white px-4 py-6 -mt-6 rounded-t-2xl">
          {/* Title and Price */}
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">{selectedItem.title}</Text>
              <Text className="text-blue-600 text-2xl font-bold mt-2">${selectedItem.price}</Text>
            </View>
            <TouchableOpacity
              onPress={handleSaveItem}
              className="p-2 rounded-full bg-gray-100"
            >
              <HeartIcon size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>

          {/* Category and Condition */}
          <View className="flex-row gap-2 mb-6">
            <View className="bg-blue-100 rounded-full px-3 py-1">
              <Text className="text-blue-600 text-sm font-medium capitalize">
                {selectedItem.category}
              </Text>
            </View>
            <View className="bg-gray-100 rounded-full px-3 py-1">
              <Text className="text-gray-600 text-sm font-medium capitalize">
                {selectedItem.condition}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-gray-900 font-semibold mb-2">Description</Text>
            <Text className="text-gray-600 leading-relaxed">{selectedItem.description}</Text>
          </View>

          {/* Location */}
          {selectedItem.location && (
            <View className="mb-6">
              <Text className="text-gray-900 font-semibold mb-2">Location</Text>
              <Text className="text-gray-600">{selectedItem.location}</Text>
            </View>
          )}

          {/* Stats */}
          <View className="flex-row justify-between bg-gray-50 rounded-lg px-4 py-3 mb-6">
            <View>
              <Text className="text-gray-500 text-sm">Views</Text>
              <Text className="text-gray-900 font-semibold">{selectedItem.views || 0}</Text>
            </View>
            <View>
              <Text className="text-gray-500 text-sm">Saved</Text>
              <Text className="text-gray-900 font-semibold">{selectedItem.saved || 0}</Text>
            </View>
            <View>
              <Text className="text-gray-500 text-sm">Status</Text>
              <Text className="text-green-600 font-semibold capitalize">
                {selectedItem.status}
              </Text>
            </View>
          </View>

          {/* Seller Info */}
          <View className="border-t border-gray-200 pt-6 mb-6">
            <Text className="text-gray-900 font-semibold mb-3">Seller Info</Text>
            <View className="flex-row items-center">
              <Image
                source={{ uri: selectedItem.vendor?.avatar || 'https://via.placeholder.com/50' }}
                className="w-12 h-12 rounded-full bg-gray-300"
              />
              <View className="ml-3 flex-1">
                <Text className="text-gray-900 font-semibold">{selectedItem.vendor?.name}</Text>
                <Text className="text-gray-600 text-sm">
                  {selectedItem.vendor?.completedTransactions || 0} sales
                </Text>
              </View>
              <View className="bg-yellow-100 rounded-full px-3 py-1">
                <Text className="text-yellow-700 font-bold">
                  {selectedItem.vendor?.rating || 0}★
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="bg-white border-t border-gray-200 px-4 py-4">
        {user?.id !== selectedItem.vendorId ? (
          <>
            <View className="flex-row gap-3 mb-3">
              <TouchableOpacity
                onPress={handleBuyItem}
                className="flex-1 bg-blue-600 rounded-lg px-4 py-3 items-center"
              >
                <Text className="text-white font-semibold">Buy Now</Text>
                <Text className="text-blue-100 text-xs mt-1">Cash payment</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRequestDonation}
                className="flex-1 bg-green-600 rounded-lg px-4 py-3 items-center"
              >
                <Text className="text-white font-semibold">Request</Text>
                <Text className="text-green-100 text-xs mt-1">Donation</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleMessage}
                className="flex-1 bg-gray-600 rounded-lg px-4 py-3 flex-row items-center justify-center"
              >
                <MessageCircleIcon size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Message</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View className="bg-gray-100 rounded-lg px-4 py-3 items-center">
            <Text className="text-gray-600 font-medium">This is your item</Text>
          </View>
        )}
      </View>
    </View>
  );
}
