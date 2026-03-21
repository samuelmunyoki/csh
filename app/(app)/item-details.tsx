import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeftIcon, HeartIcon } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { useMarketplaceStore } from '@/store/useMarketplaceStore';
import { useLoadingStore } from '@/store/useLoadingStore';
import { TransactionService } from '@/services/transactionService';
import { DonationService } from '@/services/donationService';
import { MarketplaceService } from '@/services/marketplaceService';
import { MessagingService } from '@/services/messagingService';
import { formatPrice } from '@/utils/currency';

export default function ItemDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const { selectedItem, loading, fetchItemById } = useMarketplaceStore();
  const { setLoading } = useLoadingStore();

  const [donationModalVisible, setDonationModalVisible] = useState(false);
  const [donationMessage, setDonationMessage] = useState('');
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchItemById(params.id as string);
    }
  }, [params.id]);

  const handleSaveItem = () => {
    Alert.alert('Save Item', 'Item has been saved to your collection');
  };

  const handleBuyItem = async () => {
    if (!user || !selectedItem) return;

    if (user.id === selectedItem.vendorId) {
      Alert.alert('Error', "You can't buy your own item");
      return;
    }

    Alert.alert(
      'Purchase Item',
      `Buy "${selectedItem.title}" for ${formatPrice(selectedItem.price)} (Payment: Cash)?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Purchase',
          onPress: async () => {
            try {
              setLoading(true, 'Processing purchase...');

              await TransactionService.initiateTransaction(
                selectedItem.id,
                user.id,
                selectedItem.vendorId,
                selectedItem.price,
                'cash',
                'Cash payment upon meeting'
              );

              await MarketplaceService.markItemAsSold(selectedItem.id);

              // Open a conversation with the seller
              await MessagingService.sendMessage(
                user.id,
                selectedItem.vendorId,
                `Hi! I just purchased "${selectedItem.title}" for ${formatPrice(selectedItem.price)}. When can we arrange pickup?`
              );

              setLoading(false);
              Alert.alert('Success', 'Purchase initiated! Please coordinate with the seller to arrange pickup.');

              // Show rating prompt after a short delay
              setTimeout(() => {
                setRatingScore(5);
                setRatingComment('');
                setRatingModalVisible(true);
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

  const handleRequestDonation = () => {
    if (!user || !selectedItem) return;

    if (user.id === selectedItem.vendorId) {
      Alert.alert('Error', "You can't request your own donation");
      return;
    }

    setDonationMessage('');
    setDonationModalVisible(true);
  };

  const handleSubmitDonationRequest = async () => {
    if (!user || !selectedItem) return;

    if (!donationMessage.trim()) {
      Alert.alert('Error', 'Please provide a reason');
      return;
    }

    setDonationModalVisible(false);

    try {
      setLoading(true, 'Sending donation request...');

      await DonationService.requestDonation(
        selectedItem.id,
        selectedItem.vendorId,
        user.id,
        donationMessage.trim()
      );

      await MessagingService.sendMessage(
        user.id,
        selectedItem.vendorId,
        donationMessage.trim()
      );

      setLoading(false);
      Alert.alert('Success', 'Donation request sent! The donor will review it.');

      setTimeout(() => router.back(), 500);
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error', error.message || 'Failed to send donation request');
    }
  };

  const handleSubmitRating = async () => {
    if (!user || !selectedItem) return;

    try {
      setLoading(true, 'Saving your rating...');

      await TransactionService.rateUser(
        user.id,
        selectedItem.vendorId,
        ratingScore,
        ratingComment.trim()
      );

      setRatingModalVisible(false);
      setRatingComment('');
      setRatingScore(5);
      setLoading(false);

      Alert.alert('Thank You!', 'Your rating has been submitted successfully.');
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error', error.message || 'Failed to save rating');
    }
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
        {/* Image */}
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
          className="absolute top-7  left-4 bg-white rounded-full p-4"
        >
          <ArrowLeftIcon size={24} color="#1f2937" />
        </TouchableOpacity>

        {/* Details Container */}
        <View className="bg-white px-4 py-6 -mt-6 rounded-t-2xl">
          {/* Title and Price */}
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">{selectedItem.title}</Text>
              <Text className="text-blue-600 text-2xl font-bold mt-2">{formatPrice(selectedItem.price)}</Text>
            </View>
            <TouchableOpacity onPress={handleSaveItem} className="p-2 rounded-full bg-gray-100">
              <HeartIcon size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>

          {/* Category and Condition */}
          <View className="flex-row gap-2 mb-6">
            <View className="bg-blue-100 rounded-full px-3 py-1">
              <Text className="text-blue-600 text-sm font-medium capitalize">{selectedItem.category}</Text>
            </View>
            <View className="bg-gray-100 rounded-full px-3 py-1">
              <Text className="text-gray-600 text-sm font-medium capitalize">{selectedItem.condition}</Text>
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
              <Text className="text-green-600 font-semibold capitalize">{selectedItem.status}</Text>
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
                <Text className="text-yellow-700 font-bold">{selectedItem.vendor?.rating || 0}★</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="bg-white border-t border-gray-200 px-4 py-4">
        {user?.id !== selectedItem.vendorId ? (
          <View className="flex-row gap-3">
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
        ) : (
          <View className="bg-gray-100 rounded-lg px-4 py-3 items-center">
            <Text className="text-gray-600 font-medium">This is your item</Text>
          </View>
        )}
      </View>

      {/* Donation Request Modal */}
      <Modal
        visible={donationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDonationModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 justify-center items-center bg-black/50 px-6">
            <View className="bg-white rounded-2xl p-6 w-full">
              <Text className="text-gray-900 text-lg font-bold mb-1">Request Donation</Text>
              <Text className="text-gray-500 text-sm mb-4">
                Tell the donor why you need this item:
              </Text>
              <TextInput
                value={donationMessage}
                onChangeText={setDonationMessage}
                placeholder="e.g. I need this for my family because..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="border border-gray-200 rounded-lg px-3 py-3 text-gray-900 text-sm mb-5"
                style={{ minHeight: 100 }}
                autoFocus
              />
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setDonationModalVisible(false)}
                  className="flex-1 bg-gray-100 rounded-lg py-3 items-center"
                >
                  <Text className="text-gray-700 font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmitDonationRequest}
                  className="flex-1 bg-green-600 rounded-lg py-3 items-center"
                >
                  <Text className="text-white font-semibold">Send Request</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Rating Modal */}
      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 justify-center items-center bg-black/50 px-6">
            <View className="bg-white rounded-2xl p-6 w-full">
              <Text className="text-gray-900 text-lg font-bold mb-1">Rate the Seller</Text>
              <Text className="text-gray-500 text-sm mb-4">
                How was your experience with {selectedItem?.vendor?.name}?
              </Text>

              {/* Star Rating */}
              <View className="flex-row justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRatingScore(star)}>
                    <Text className="text-4xl">{star <= ratingScore ? '⭐' : '☆'}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Comment */}
              <TextInput
                value={ratingComment}
                onChangeText={setRatingComment}
                placeholder="Share your feedback (optional)..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="border border-gray-200 rounded-lg px-3 py-3 text-gray-900 text-sm mb-5"
                style={{ minHeight: 80 }}
              />

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setRatingModalVisible(false)}
                  className="flex-1 bg-gray-100 rounded-lg py-3 items-center"
                >
                  <Text className="text-gray-700 font-semibold">Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmitRating}
                  className="flex-1 bg-blue-600 rounded-lg py-3 items-center"
                >
                  <Text className="text-white font-semibold">Submit Rating</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
