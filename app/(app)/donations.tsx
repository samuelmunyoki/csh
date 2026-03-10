import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from 'lucide-react-native';
import { DonationService } from '@/services/donationService';
import { useAuthStore } from '@/store/useAuthStore';
import { Donation } from '@/types';

export default function DonationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'received' | 'made'>('received');

  useEffect(() => {
    fetchDonations();
  }, [user, activeTab]);

  const fetchDonations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let result;
      if (activeTab === 'received') {
        result = await DonationService.getUserDonationsReceived(user.id);
      } else {
        result = await DonationService.getUserDonationsMade(user.id);
      }
      setDonations(result);
    } catch (error) {
      console.error('[DonationsScreen] Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDonation = async (donationId: string) => {
    try {
      await DonationService.acceptDonation(donationId);
      Alert.alert('Success', 'Donation accepted');
      fetchDonations();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept donation');
    }
  };

  const handleCompleteDonation = async (donationId: string) => {
    try {
      await DonationService.completeDonation(donationId);
      Alert.alert('Success', 'Donation marked as completed');
      fetchDonations();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete donation');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon size={20} color="#10b981" />;
      case 'pending':
        return <ClockIcon size={20} color="#f59e0b" />;
      case 'accepted':
        return <CheckCircleIcon size={20} color="#3b82f6" />;
      default:
        return <XCircleIcon size={20} color="#ef4444" />;
    }
  };

  const renderDonationCard = ({ item }: { item: Donation }) => (
    <View className="bg-white rounded-lg overflow-hidden shadow-sm mb-4">
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text className="font-semibold text-gray-900">
              {item.item?.title || 'Item'}
            </Text>
            <Text className="text-gray-600 text-sm mt-1">
              {activeTab === 'received' ? 'From: ' : 'To: '}
              {activeTab === 'received' ? item.donor?.name : item.recipient?.name}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            {getStatusIcon(item.status)}
            <Text className="text-sm font-medium capitalize text-gray-600">
              {item.status}
            </Text>
          </View>
        </View>

        {item.message && (
          <View className="bg-gray-50 rounded p-3 mb-3">
            <Text className="text-gray-600 text-sm">{item.message}</Text>
          </View>
        )}

        <View className="flex-row gap-2">
          {activeTab === 'received' && item.status === 'pending' && (
            <>
              <TouchableOpacity
                onPress={() => handleAcceptDonation(item.id)}
                className="flex-1 bg-blue-600 rounded px-3 py-2"
              >
                <Text className="text-white text-sm font-medium text-center">
                  Accept
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert('Decline', 'Donation declined');
                  fetchDonations();
                }}
                className="flex-1 bg-gray-200 rounded px-3 py-2"
              >
                <Text className="text-gray-900 text-sm font-medium text-center">
                  Decline
                </Text>
              </TouchableOpacity>
            </>
          )}

          {(activeTab === 'received' && item.status === 'accepted') ||
          (activeTab === 'made' && item.status === 'accepted') ? (
            <TouchableOpacity
              onPress={() => handleCompleteDonation(item.id)}
              className="flex-1 bg-green-600 rounded px-3 py-2"
            >
              <Text className="text-white text-sm font-medium text-center">
                Mark Complete
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Donations</Text>
      </View>

      {/* Tabs */}
      <View className="bg-white flex-row border-b border-gray-200">
        <TouchableOpacity
          onPress={() => setActiveTab('received')}
          className={`flex-1 py-3 border-b-2 ${
            activeTab === 'received' ? 'border-blue-600' : 'border-transparent'
          }`}
        >
          <Text
            className={`text-center font-medium ${
              activeTab === 'received' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            Received
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('made')}
          className={`flex-1 py-3 border-b-2 ${
            activeTab === 'made' ? 'border-blue-600' : 'border-transparent'
          }`}
        >
          <Text
            className={`text-center font-medium ${
              activeTab === 'made' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            Made
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : donations.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-gray-500 text-lg text-center">
            No {activeTab} donations yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={donations}
          renderItem={renderDonationCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
