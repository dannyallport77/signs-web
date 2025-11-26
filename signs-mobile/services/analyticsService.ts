import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalyticsDashboard, TransactionFilters } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.110:3000/api';

export const analyticsService = {
  async getDashboard(filters?: TransactionFilters): Promise<AnalyticsDashboard> {
    let token = '';
    try {
      token = await AsyncStorage.getItem('authToken') || '';
    } catch (error) {
      console.error('Error retrieving auth token:', error);
    }
    const queryParams = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const url = `${API_URL}/analytics/dashboard?${queryParams.toString()}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch dashboard data');
    }

    return data.data;
  },

  async getSalesTrend(days: number = 30): Promise<any> {
    let token = '';
    try {
      token = await AsyncStorage.getItem('authToken') || '';
    } catch (error) {
      console.error('Error retrieving auth token:', error);
    }
    const response = await fetch(`${API_URL}/analytics/sales-trend?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch sales trend');
    }

    return data.data;
  },

  async getSignPopularity(): Promise<any> {
    let token = '';
    try {
      token = await AsyncStorage.getItem('authToken') || '';
    } catch (error) {
      console.error('Error retrieving auth token:', error);
    }
    const response = await fetch(`${API_URL}/analytics/sign-popularity`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch sign popularity');
    }

    return data.data;
  },

  async getUserPerformance(): Promise<any> {
    let token = '';
    try {
      token = await AsyncStorage.getItem('authToken') || '';
    } catch (error) {
      console.error('Error retrieving auth token:', error);
    }
    const response = await fetch(`${API_URL}/analytics/user-performance`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch user performance');
    }

    return data.data;
  }
};
