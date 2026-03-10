import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeftIcon } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { validateEmail } from '@/utils/validation';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword, loading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleResetPassword = async () => {
    setEmailError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Invalid email address');
      return;
    }

    try {
      await resetPassword(email);
      setSubmitted(true);
      Alert.alert(
        'Password Reset Email Sent',
        'Check your email for instructions to reset your password',
        [{ text: 'OK', onPress: () => router.push('/(auth)') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send password reset email');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center px-6 pt-4">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeftIcon size={24} color="#1f2937" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 justify-center px-6 py-8">
          {/* Title */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Reset Password
            </Text>
            <Text className="text-gray-600">
              Enter your email and we'll send you instructions to reset your password
            </Text>
          </View>

          {/* Email Input */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium mb-2">Email Address</Text>
            <TextInput
              placeholder="your@university.edu"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading && !submitted}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              placeholderTextColor="#9ca3af"
            />
            {emailError ? (
              <Text className="text-red-600 text-sm mt-1">{emailError}</Text>
            ) : null}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleResetPassword}
            disabled={loading || submitted}
            className="bg-blue-600 rounded-lg px-4 py-3 mb-4"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-lg">
                Send Reset Link
              </Text>
            )}
          </TouchableOpacity>

          {/* Back to Login */}
          <View className="flex-row justify-center mt-4">
            <Text className="text-gray-600">Remember your password? </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)')}
              disabled={loading}
            >
              <Text className="text-blue-600 font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
