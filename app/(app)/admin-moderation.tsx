import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BellDot, CheckIcon, XIcon } from 'lucide-react-native';
import { ModerationService } from '@/services/moderationService';
import { useAuthStore } from '@/store/useAuthStore';
import { ModerationReport } from '@/types';

export default function AdminModerationScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(null);
  const [action, setAction] = useState('');

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'Only admins can access moderation panel');
      router.back();
      return;
    }

    fetchPendingReports();
  }, [isAdmin]);

  const fetchPendingReports = async () => {
    setLoading(true);
    try {
      const pendingReports = await ModerationService.getPendingReports();
      setReports(pendingReports);
    } catch (error) {
      console.error('[AdminModeration] Error fetching reports:', error);
      Alert.alert('Error', 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId: string, resolution: 'resolved' | 'dismissed') => {
    if (!user || !action.trim()) {
      Alert.alert('Error', 'Please enter an action');
      return;
    }

    try {
      await ModerationService.reviewReport(reportId, user.id, action, resolution);
      Alert.alert('Success', 'Report processed');
      setAction('');
      setSelectedReport(null);
      fetchPendingReports();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process report');
    }
  };

  const handleRemoveItem = async (reportId: string, itemId?: string) => {
    if (!itemId) {
      Alert.alert('Error', 'Item ID not found');
      return;
    }

    try {
      await ModerationService.removeItem(itemId, reportId);
      Alert.alert('Success', 'Item removed');
      setSelectedReport(null);
      fetchPendingReports();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to remove item');
    }
  };

  const handleDeleteProduct = async (reportId: string, itemId?: string) => {
    if (!itemId) {
      Alert.alert('Error', 'Item ID not found');
      return;
    }

    Alert.alert(
      'Delete Product',
      'Are you sure you want to permanently delete this product?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await ModerationService.deleteProduct(itemId, reportId);
              Alert.alert('Success', 'Product deleted');
              setSelectedReport(null);
              fetchPendingReports();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete product');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleFreezeAccount = async (reportId: string, userId?: string) => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    Alert.prompt(
      'Freeze Account',
      'Provide a reason for freezing (optional):',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Freeze',
          onPress: async (reason) => {
            try {
              await ModerationService.freezeUser(userId, reportId, reason);
              Alert.alert('Success', 'User account frozen');
              setSelectedReport(null);
              fetchPendingReports();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to freeze account');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async (reportId: string, userId?: string) => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    Alert.alert(
      'Delete Account',
      'Are you sure? This will permanently delete the user account and all their data.',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await ModerationService.deleteUser(userId, reportId);
              Alert.alert('Success', 'User account deleted');
              setSelectedReport(null);
              fetchPendingReports();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete account');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleBanUser = async (reportId: string, userId?: string) => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    Alert.alert('Ban User', 'Are you sure you want to ban this user?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Ban',
        onPress: async () => {
          try {
            await ModerationService.banUser(userId, reportId);
            Alert.alert('Success', 'User banned');
            setSelectedReport(null);
            fetchPendingReports();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to ban user');
          }
        },
      },
    ]);
  };

  const renderReportCard = ({ item }: { item: ModerationReport }) => (
    <TouchableOpacity
      onPress={() => setSelectedReport(item)}
      className="bg-white rounded-lg overflow-hidden shadow-sm mb-4"
    >
      <View className="p-4 border-l-4 border-yellow-500">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="font-semibold text-gray-900 capitalize">
              {item.reason}
            </Text>
            <Text className="text-gray-600 text-sm mt-1">
              {item.reportedItemId ? `Item: ${item.reportedItemId}` : `User: ${item.reportedUserId}`}
            </Text>
          </View>
          <View className="bg-yellow-100 rounded-full p-2">
            <BellDot size={16} color="#f59e0b" />
          </View>
        </View>
        <Text className="text-gray-600 text-sm line-clamp-2">
          {item.description}
        </Text>
        <Text className="text-gray-400 text-xs mt-2">
          ID: {item.id.substring(0, 8)}...
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!isAdmin) {
    return null;
  }

  if (selectedReport) {
    return (
      <View className="flex-1 bg-gray-50">
        <ScrollView>
          <View className="bg-white p-4">
            {/* Header */}
            <TouchableOpacity onPress={() => setSelectedReport(null)} className="mb-4">
              <Text className="text-blue-600 font-medium">Back to Reports</Text>
            </TouchableOpacity>

            {/* Report Details */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-4">Report Details</Text>

              <View className="bg-gray-50 rounded p-3 mb-4">
                <View className="mb-3">
                  <Text className="text-gray-600 text-sm">Reason</Text>
                  <Text className="text-gray-900 font-medium capitalize">
                    {selectedReport.reason}
                  </Text>
                </View>

                <View className="mb-3">
                  <Text className="text-gray-600 text-sm">Description</Text>
                  <Text className="text-gray-900">{selectedReport.description}</Text>
                </View>

                <View className="mb-3">
                  <Text className="text-gray-600 text-sm">Reported</Text>
                  <Text className="text-gray-900">
                    {selectedReport.reportedItemId ? `Item ID: ${selectedReport.reportedItemId}` : `User ID: ${selectedReport.reportedUserId}`}
                  </Text>
                </View>

                <View>
                  <Text className="text-gray-600 text-sm">Reporter ID</Text>
                  <Text className="text-gray-900">{selectedReport.reporterId}</Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View className="mb-6">
              <Text className="text-gray-900 font-semibold mb-3">Moderation Actions</Text>

              <View className="mb-4">
                <Text className="text-gray-700 text-sm mb-2">Action Notes</Text>
                <TextInput
                  placeholder="Describe the action taken..."
                  value={action}
                  onChangeText={setAction}
                  multiline
                  numberOfLines={3}
                  className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-900"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View className="gap-2">
                {selectedReport.reportedItemId && (
                  <>
                    <TouchableOpacity
                      onPress={() =>
                        handleRemoveItem(selectedReport.id, selectedReport.reportedItemId)
                      }
                      className="bg-orange-600 rounded px-4 py-3 flex-row items-center justify-center"
                    >
                      <XIcon size={18} color="white" />
                      <Text className="text-white font-medium ml-2">Remove Item</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        handleDeleteProduct(selectedReport.id, selectedReport.reportedItemId)
                      }
                      className="bg-red-600 rounded px-4 py-3 flex-row items-center justify-center"
                    >
                      <XIcon size={18} color="white" />
                      <Text className="text-white font-medium ml-2">Delete Product</Text>
                    </TouchableOpacity>
                  </>
                )}

                {selectedReport.reportedUserId && (
                  <>
                    <TouchableOpacity
                      onPress={() =>
                        handleFreezeAccount(selectedReport.id, selectedReport.reportedUserId)
                      }
                      className="bg-yellow-600 rounded px-4 py-3 flex-row items-center justify-center"
                    >
                      <XIcon size={18} color="white" />
                      <Text className="text-white font-medium ml-2">Freeze Account</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        handleDeleteAccount(selectedReport.id, selectedReport.reportedUserId)
                      }
                      className="bg-red-600 rounded px-4 py-3 flex-row items-center justify-center"
                    >
                      <XIcon size={18} color="white" />
                      <Text className="text-white font-medium ml-2">Delete Account</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        handleBanUser(selectedReport.id, selectedReport.reportedUserId)
                      }
                      className="bg-red-700 rounded px-4 py-3 flex-row items-center justify-center"
                    >
                      <XIcon size={18} color="white" />
                      <Text className="text-white font-medium ml-2">Ban User</Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  onPress={() => handleResolveReport(selectedReport.id, 'resolved')}
                  className="bg-green-600 rounded px-4 py-3 flex-row items-center justify-center"
                >
                  <CheckIcon size={18} color="white" />
                  <Text className="text-white font-medium ml-2">Mark Resolved</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleResolveReport(selectedReport.id, 'dismissed')}
                  className="bg-gray-400 rounded px-4 py-3 flex-row items-center justify-center"
                >
                  <XIcon size={18} color="white" />
                  <Text className="text-white font-medium ml-2">Dismiss Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Moderation Panel</Text>
        <Text className="text-gray-600 text-sm mt-1">
          {reports.length} pending reports
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : reports.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-gray-500 text-lg text-center">
            No pending reports
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReportCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
