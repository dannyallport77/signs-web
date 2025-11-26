import AsyncStorage from '@react-native-async-storage/async-storage';
import { SocialMediaLinks } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.110:3000/api';

export const socialMediaService = {
  async getSocialMediaLinks(
    businessName: string, 
    address: string, 
    placeId?: string,
    verify: boolean = false
  ): Promise<SocialMediaLinks> {
    try {
      let token = '';
      try {
        token = await AsyncStorage.getItem('authToken') || '';
      } catch (storageError) {
        console.error('Error retrieving auth token:', storageError);
      }

      const params = new URLSearchParams({
        businessName,
        address,
        verify: verify.toString()
      });
      
      if (placeId) {
        params.append('placeId', placeId);
      }
      
      const response = await fetch(`${API_URL}/places/social-media?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch (parseError) {
        // If JSON parsing fails, treat as empty
        console.error('Failed to parse social media response JSON:', parseError);
      }

      // Accept responses where the API returned a success payload even if HTTP status isn't 2xx
      if (!response.ok && !(data && data.success)) {
        throw new Error((data && data.error) || 'Failed to fetch social media links');
      }

      console.log('Social media API response:', data);
      return (data && data.data) || {};
    } catch (error) {
      console.error('Social media fetch error:', error);
      return {};
    }
  }
};
