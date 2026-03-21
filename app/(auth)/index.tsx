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
import { useLoadingStore } from '@/store/useLoadingStore';
import { validateEmail } from '@/utils/validation';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, adminSignIn, loading } = useAuthStore();
  const { setLoading } = useLoadingStore();
  const [loginType, setLoginType] = useState<'student' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setUsernameError('');
    setPasswordError('');

    if (loginType === 'student') {
      if (!email.trim()) {
        setEmailError('Email is required');
        isValid = false;
      } else if (!validateEmail(email)) {
        setEmailError('Invalid email address');
        isValid = false;
      }
    } else {
      if (!username.trim()) {
        setUsernameError('Username is required');
        isValid = false;
      } else if (username.length < 3) {
        setUsernameError('Username must be at least 3 characters');
        isValid = false;
      }
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
      setGeneralError('');
      setLoading(true, 'Signing in...');
      
      if (loginType === 'student') {
        await signIn(email, password);
      } else {
        await adminSignIn(username, password);
      }
      
      setLoading(false);
      router.replace('/(app)/(tabs)');
    } catch (error: any) {
      setLoading(false);
      const errorMessage = getFirebaseErrorMessage(error);
      setGeneralError(errorMessage);
      
      console.error('[LoginScreen] Sign in error:', error);
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

          {/* Login Type Toggle */}
          <View className="flex-row bg-gray-200 rounded-lg mb-6 p-1">
            <TouchableOpacity
              onPress={() => setLoginType('student')}
              className={`flex-1 py-3 rounded-md ${loginType === 'student' ? 'bg-blue-600' : ''}`}
            >
              <Text className={`text-center font-semibold ${loginType === 'student' ? 'text-white' : 'text-gray-600'}`}>
                Student
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLoginType('admin')}
              className={`flex-1 py-3 rounded-md ${loginType === 'admin' ? 'bg-blue-600' : ''}`}
            >
              <Text className={`text-center font-semibold ${loginType === 'admin' ? 'text-white' : 'text-gray-600'}`}>
                Admin
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {generalError && (
            <View className="bg-red-100 border border-red-400 rounded-lg px-4 py-3 mb-6">
              <Text className="text-red-800 text-sm">{generalError}</Text>
            </View>
          )}

          {/* Email or Username Input */}
          {loginType === 'student' ? (
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Email</Text>
              <TextInput
                placeholder="your@email.com"
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
          ) : (
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Username</Text>
              <TextInput
                placeholder="Enter your admin username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!loading}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                placeholderTextColor="#9ca3af"
              />
              {usernameError ? (
                <Text className="text-red-600 text-sm mt-1">{usernameError}</Text>
              ) : null}
            </View>
          )}

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
