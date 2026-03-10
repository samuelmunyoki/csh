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
import { useAuthStore } from '@/store/useAuthStore';
import { validateEmail } from '@/utils/validation';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, loading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Invalid email address');
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    }

    return isValid;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    try {
      await signIn(email, password);
      router.replace('/(app)/(tabs)');
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'Please check your credentials and try again');
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
        <View className="flex-1 justify-center px-6 py-8">
          {/* Logo/Title */}
          <View className="mb-8 items-center">
            <Text className="text-4xl font-bold text-blue-600 mb-2">CampuShare</Text>
            <Text className="text-gray-600 text-center">Campus Community Sharing Platform</Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-red-100 border border-red-400 rounded-lg px-4 py-3 mb-6">
              <Text className="text-red-800">{error}</Text>
            </View>
          )}

          {/* Email Input */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Email</Text>
            <TextInput
              placeholder="your@university.edu"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              placeholderTextColor="#9ca3af"
            />
            {emailError ? (
              <Text className="text-red-600 text-sm mt-1">{emailError}</Text>
            ) : null}
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium mb-2">Password</Text>
            <TextInput
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              placeholderTextColor="#9ca3af"
            />
            {passwordError ? (
              <Text className="text-red-600 text-sm mt-1">{passwordError}</Text>
            ) : null}
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            disabled={loading}
          >
            <Text className="text-blue-600 font-medium text-right mb-6">
              Forgot password?
            </Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            onPress={handleSignIn}
            disabled={loading}
            className="bg-blue-600 rounded-lg px-4 py-3 mb-4"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-lg">Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View className="flex-row justify-center mt-4">
            <Text className="text-gray-600">Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')} disabled={loading}>
              <Text className="text-blue-600 font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
