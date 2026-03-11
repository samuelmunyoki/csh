import React from 'react';
import { Modal, View, ActivityIndicator, Text } from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay = ({ visible, message = 'Loading...' }: LoadingOverlayProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-lg px-8 py-6 items-center gap-4">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-900 font-medium text-center">{message}</Text>
        </View>
      </View>
    </Modal>
  );
};
