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
import { validateData, signUpSchema } from '@/utils/validation';
import z from 'zod';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, loading, error } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    university: '',
    studentId: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSignUp = async () => {
  try {
    setErrors({});

    const validated = await validateData(signUpSchema, formData);

    await signUp(validated.email, validated.password, {
      name: validated.name,
      university: validated.university,
      studentId: validated.studentId,
      role: 'student',
    });

    router.replace('/(app)/(tabs)');
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      // Extract field-specific errors
      const fieldErrors = error.flatten().fieldErrors;
      const newErrors: Record<string, string> = {};

      Object.entries(fieldErrors).forEach(([key, messages]) => {
        if (messages && messages.length > 0) {
          newErrors[key] = messages[0]; // show first error per field
        }
      });

      setErrors(newErrors);
    } else if (error.message) {
      Alert.alert('Sign Up Failed', error.message);
    } else {
      Alert.alert('Sign Up Failed', 'Unknown error occurred');
    }
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
          {/* Header */}
          <View className="mb-6 items-center">
            <Text className="text-3xl font-bold text-blue-600 mb-2">Join CampuShare</Text>
            <Text className="text-gray-600 text-center text-sm">
              Create your account to start sharing
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-red-100 border border-red-400 rounded-lg px-4 py-3 mb-4">
              <Text className="text-red-800 text-sm">{error}</Text>
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

          {/* Email Input */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Email</Text>
            <TextInput
              placeholder="your@university.edu"
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
              <Text className="text-white text-center font-semibold text-lg">Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <View className="flex-row justify-center mt-4">
            <Text className="text-gray-600">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)')} disabled={loading}>
              <Text className="text-blue-600 font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
