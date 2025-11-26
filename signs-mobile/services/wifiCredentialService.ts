import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WiFiCredential {
  ssid: string;
  password: string;
  security: 'Open' | 'WPA' | 'WPA2' | 'WPA3';
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.110:3000/api';

export const wifiCredentialService = {
  async getForBusiness(placeId: string): Promise<WiFiCredential | null> {
    try {
      const response = await fetch(`${API_URL}/wifi-credentials?placeId=${placeId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        return {
          ssid: data.data.ssid,
          password: data.data.password,
          security: data.data.security
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching WiFi credential:', error);
      return null;
    }
  },

  async saveForBusiness(
    businessName: string,
    placeId: string,
    ssid: string,
    password: string,
    security: 'Open' | 'WPA' | 'WPA2' | 'WPA3' = 'WPA'
  ): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/wifi-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName,
          placeId,
          ssid,
          password,
          security
        })
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error saving WiFi credential:', error);
      return false;
    }
  },

  async deleteForBusiness(placeId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/wifi-credentials?placeId=${placeId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error deleting WiFi credential:', error);
      return false;
    }
  }
};
