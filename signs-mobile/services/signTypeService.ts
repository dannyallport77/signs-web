import AsyncStorage from '@react-native-async-storage/async-storage';
import { SignType } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.110:3000/api';

export const signTypeService = {
  async getAll(): Promise<SignType[]> {
    try {
      let token = '';
      try {
        token = await AsyncStorage.getItem('authToken') || '';
      } catch (storageError) {
        console.error('Error retrieving auth token:', storageError);
      }
      console.log('Fetching sign types from:', `${API_URL}/mobile/products`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${API_URL}/mobile/products`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sign types');
      }

      // Map API product fields to SignType interface
      const signTypes: SignType[] = data.data.map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        defaultPrice: product.price || 0,
        isActive: product.isActive ?? true,
        imageUrl: product.imageUrl || '',
        createdAt: product.createdAt || new Date().toISOString(),
        updatedAt: product.updatedAt || new Date().toISOString()
      }));

      return signTypes;
    } catch (error) {
      console.error('Sign type fetch error:', error);
      throw error;
    }
  },

  async create(signType: Partial<SignType>): Promise<SignType> {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/sign-types`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(signType)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create sign type');
    }

    return data.data;
  },

  async update(id: string, updates: Partial<SignType>): Promise<SignType> {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/sign-types/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update sign type');
    }

    return data.data;
  },

  async getByPlatform(platform: string): Promise<SignType[]> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      console.log(`Fetching sign types for platform: ${platform}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(`${API_URL}/sign-types-platforms?platform=${platform}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.warn(`Failed to fetch sign types for ${platform} (status ${response.status}), falling back to all types`);
        return this.getAll();
      }

      // Map API response to SignType interface
      // The API returns objects with platformTypes, but we need to flatten to SignType
      const signTypes: SignType[] = data.data.map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        defaultPrice: product.defaultPrice || product.price || 0,
        isActive: product.isActive ?? true,
        imageUrl: product.imageUrl || '',
        createdAt: product.createdAt || new Date().toISOString(),
        updatedAt: product.updatedAt || new Date().toISOString()
      }));

      console.log(`Fetched ${signTypes.length} sign types for platform ${platform}`);
      return signTypes;
    } catch (error) {
      console.error(`Sign type fetch error for platform ${platform}:`, error instanceof Error ? error.message : error);
      // Fallback to all types if platform-specific fetch fails
      console.log('Falling back to getAll() due to error');
      return this.getAll();
    }
  },

  async delete(id: string): Promise<void> {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/sign-types/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete sign type');
    }
  }
};
