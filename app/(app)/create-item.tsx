import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { XIcon, ImagePlusIcon } from 'lucide-react-native';
import { CloudinaryService } from '@/services/cloudinary';
import { useAuthStore } from '@/store/useAuthStore';
import { useMarketplaceStore } from '@/store/useMarketplaceStore';
import { validateData, createItemSchema } from '@/utils/validation';

const CATEGORIES = [
  'textbooks',
  'electronics',
  'furniture',
  'clothing',
  'supplies',
  'services',
  'other',
];

const CONDITIONS = ['new', 'like-new', 'good', 'fair'];

export default function CreateItemScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createItem, loading } = useMarketplaceStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    price: '',
    condition: 'good',
    location: '',
  });

  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 5 images');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploading(true);
        try {
          const uploadedImage = await CloudinaryService.uploadImage(
            result.assets[0].uri,
            'campushare-hub/marketplace'
          );
          setImages([...images, uploadedImage.secure_url]);
        } catch (error) {
          Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleCreateItem = async () => {
    try {
      setErrors({});

      if (images.length === 0) {
        setErrors({ images: 'At least one image is required' });
        return;
      }

      const validated = await validateData(createItemSchema, {
        ...formData,
        price: parseFloat(formData.price),
      });

      if (!user) throw new Error('User not found');

      await createItem(user.id, {
        ...validated,
        images,
      });

      Alert.alert('Success', 'Item created successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      if (error.message.includes(':')) {
        const errorParts = error.message.split(', ');
        const newErrors: Record<string, string> = {};
        errorParts.forEach((err: string) => {
          const [field, message] = err.split(': ');
          newErrors[field] = message;
        });
        setErrors(newErrors);
      } else {
        Alert.alert('Error', error.message || 'Failed to create item');
      }
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          {/* Title */}
          <Text className="text-2xl font-bold text-gray-900 mb-6">List an Item</Text>

          {/* Images Section */}
          <View className="mb-6">
            <Text className="text-gray-900 font-semibold mb-3">Photos</Text>
            <FlatList
              data={images}
              renderItem={({ item, index }) => (
                <View className="mr-3 mb-3 relative">
                  <Image
                    source={{ uri: item }}
                    className="w-24 h-24 rounded-lg"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-600 rounded-full p-1"
                  >
                    <XIcon size={14} color="white" />
                  </TouchableOpacity>
                </View>
              )}
              keyExtractor={(_, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
            />

            {images.length < 5 && (
              <TouchableOpacity
                onPress={pickImage}
                disabled={uploading}
                className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 items-center"
              >
                {uploading ? (
                  <ActivityIndicator color="#2563eb" />
                ) : (
                  <>
                    <ImagePlusIcon size={32} color="#2563eb" />
                    <Text className="text-gray-600 font-medium mt-2">
                      Add Image ({images.length}/5)
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {errors.images && (
              <Text className="text-red-600 text-sm mt-2">{errors.images}</Text>
            )}
          </View>

          {/* Title Input */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Title</Text>
            <TextInput
              placeholder="What are you selling?"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              editable={!loading}
              maxLength={100}
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              placeholderTextColor="#9ca3af"
            />
            {errors.title && (
              <Text className="text-red-600 text-sm mt-1">{errors.title}</Text>
            )}
          </View>

          {/* Description Input */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Description</Text>
            <TextInput
              placeholder="Describe your item..."
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              editable={!loading}
              multiline
              numberOfLines={4}
              maxLength={1000}
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              placeholderTextColor="#9ca3af"
              textAlignVertical="top"
            />
            {errors.description && (
              <Text className="text-red-600 text-sm mt-1">{errors.description}</Text>
            )}
          </View>

          {/* Category */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row -mx-4 px-4"
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setFormData({ ...formData, category: cat })}
                  className={`px-4 py-2 rounded-full mr-2 border ${
                    formData.category === cat
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Text
                    className={`capitalize font-medium ${
                      formData.category === cat ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Price */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Price ($)</Text>
            <TextInput
              placeholder="0.00"
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              editable={!loading}
              keyboardType="decimal-pad"
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              placeholderTextColor="#9ca3af"
            />
            {errors.price && (
              <Text className="text-red-600 text-sm mt-1">{errors.price}</Text>
            )}
          </View>

          {/* Condition */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Condition</Text>
            <View className="flex-row flex-wrap gap-2">
              {CONDITIONS.map((cond) => (
                <TouchableOpacity
                  key={cond}
                  onPress={() => setFormData({ ...formData, condition: cond })}
                  className={`px-4 py-2 rounded-full border ${
                    formData.condition === cond
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Text
                    className={`capitalize font-medium ${
                      formData.condition === cond ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {cond}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium mb-2">Location (Optional)</Text>
            <TextInput
              placeholder="Where is the item located?"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              editable={!loading}
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleCreateItem}
            disabled={loading || uploading}
            className="bg-blue-600 rounded-lg px-4 py-3 mb-6"
          >
            {loading || uploading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-lg">List Item</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
