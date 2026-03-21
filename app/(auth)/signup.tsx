import React, { useState, useEffect } from 'react';
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
import { validateData, signUpSchema, adminSignUpSchema } from '@/utils/validation';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { AuthService } from '@/services/authService';
import z from 'zod';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, loading } = useAuthStore();
  const { setLoading } = useLoadingStore();
  const [isFirstUser, setIsFirstUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    university: '',
    studentId: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    checkIfFirstUser();
  }, []);

  const checkIfFirstUser = async () => {
    try {
      const firstUser = await AuthService.isFirstUser();
      setIsFirstUser(firstUser);
    } catch (error) {
      console.error('Error checking first user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    try {
      setErrors({});
      setGeneralError('');

      if (isFirstUser) {
        // Admin signup
        const validated = await validateData(adminSignUpSchema, {
          name: formData.name,
          username: formData.username,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        });

        setLoading(true, 'Creating admin account...');

        const { adminSignUp: adminSignUpFn } = useAuthStore();
        await adminSignUpFn(validated.username, validated.password, {
          name: validated.name,
        });
      } else {
        // Student signup
        const validated = await validateData(signUpSchema, formData);

        setLoading(true, 'Creating your account...');

        await signUp(validated.email, validated.password, {
          name: validated.name,
          university: validated.university,
          studentId: validated.studentId,
        });
      }

      setLoading(false);
      router.replace('/(app)/(tabs)');
    } catch (error: any) {
      setLoading(false);

      if (error instanceof z.ZodError) {
        // Extract field-specific validation errors
        const fieldErrors = error.flatten().fieldErrors;
        const newErrors: Record<string, string> = {};

        Object.entries(fieldErrors).forEach(([key, messages]) => {
          if (messages && messages.length > 0) {
            newErrors[key] = messages[0];
          }
        });

        setErrors(newErrors);
      } else {
        // Handle Firebase auth errors
        const errorMessage = getFirebaseErrorMessage(error);
        setGeneralError(errorMessage);
        console.error('[SignupScreen] Sign up error:', error);
      }
    }
  };


  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

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
          {/* Header */}
          <View className="mb-6 items-center">
            <Text className="text-3xl font-bold text-blue-600 mb-2">
              {isFirstUser ? 'Create Admin Account' : 'Join CampuShare'}
            </Text>
            <Text className="text-gray-600 text-center text-sm">
              {isFirstUser 
                ? 'Set up your administrator account to manage the platform'
                : 'Create your account to start sharing'
              }
            </Text>
          </View>

          {/* Error Message */}
          {generalError && (
            <View className="bg-red-100 border border-red-400 rounded-lg px-4 py-3 mb-4">
              <Text className="text-red-800 text-sm">{generalError}</Text>
            </View>
          )}

          {/* Name Input */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Full Name</Text>
            <TextInput
              placeholder="John Doe"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              editable={!loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              placeholderTextColor="#9ca3af"
            />
            {errors.name && <Text className="text-red-600 text-sm mt-1">{errors.name}</Text>}
          </View>

          {isFirstUser ? (
            <>
              {/* Admin Username Input */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">Username</Text>
                <TextInput
                  placeholder="Create a username"
                  value={formData.username}
                  onChangeText={(text) => setFormData({ ...formData, username: text })}
                  autoCapitalize="none"
                  editable={!loading}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  placeholderTextColor="#9ca3af"
                />
                {errors.username && <Text className="text-red-600 text-sm mt-1">{errors.username}</Text>}
              </View>
            </>
          ) : (
            <>
              {/* Email Input */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">Email</Text>
                <TextInput
                  placeholder="your@email.com"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  placeholderTextColor="#9ca3af"
                />
                {errors.email && <Text className="text-red-600 text-sm mt-1">{errors.email}</Text>}
              </View>

              {/* University Input */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">University</Text>
                <TextInput
                  placeholder="Your University"
                  value={formData.university}
                  onChangeText={(text) => setFormData({ ...formData, university: text })}
                  editable={!loading}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  placeholderTextColor="#9ca3af"
                />
                {errors.university && (
                  <Text className="text-red-600 text-sm mt-1">{errors.university}</Text>
                )}
              </View>

              {/* Student ID Input */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">Student ID (Optional)</Text>
                <TextInput
                  placeholder="Student ID"
                  value={formData.studentId}
                  onChangeText={(text) => setFormData({ ...formData, studentId: text })}
                  editable={!loading}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </>
          )}

          {/* Password Input */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Password</Text>
            <TextInput
              placeholder="Minimum 8 characters"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry
              editable={!loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              placeholderTextColor="#9ca3af"
            />
            {errors.password && <Text className="text-red-600 text-sm mt-1">{errors.password}</Text>}
          </View>

          {/* Confirm Password Input */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium mb-2">Confirm Password</Text>
            <TextInput
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              secureTextEntry
              editable={!loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              placeholderTextColor="#9ca3af"
            />
            {errors.confirmPassword && (
              <Text className="text-red-600 text-sm mt-1">{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading}
            className="bg-blue-600 rounded-lg px-4 py-3 mb-4"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-lg">
                {isFirstUser ? 'Create Admin Account' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          {!isFirstUser && (
            <View className="flex-row justify-center mt-4">
              <Text className="text-gray-600">Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)')} disabled={loading}>
                <Text className="text-blue-600 font-semibold">Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
