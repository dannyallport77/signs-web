// Type definitions for Sales Tracking & Analytics

export interface SocialMediaLinks {
  facebook?: {
    profileUrl?: string;
    reviewUrl?: string;
    searched?: boolean;
    verified?: boolean;
  };
  instagram?: {
    profileUrl?: string;
    searched?: boolean;
    verified?: boolean;
  };
  tiktok?: {
    profileUrl?: string;
    searched?: boolean;
  };
  twitter?: {
    profileUrl?: string;
    searched?: boolean;
  };
  linkedin?: {
    profileUrl?: string;
    searched?: boolean;
  };
  tripadvisor?: {
    reviewUrl?: string;
    profileUrl?: string;
    searchUrl?: string;
    searched?: boolean;
    verified?: boolean;
    note?: string;
  };
  trustpilot?: {
    reviewUrl?: string;
    profileUrl?: string;
    searchUrl?: string;
    searched?: boolean;
    verified?: boolean;
    note?: string;
  };
  yell?: {
    profileUrl?: string;
    reviewUrl?: string;
    searchUrl?: string;
    searched?: boolean;
    verified?: boolean;
    note?: string;
  };
  ratedpeople?: {
    profileUrl?: string;
    searchUrl?: string;
    searched?: boolean;
    verified?: boolean;
    note?: string;
  };
  trustatrader?: {
    profileUrl?: string;
    searchUrl?: string;
    searched?: boolean;
    verified?: boolean;
    note?: string;
  };
  checkatrade?: {
    profileUrl?: string;
    searchUrl?: string;
    searched?: boolean;
    verified?: boolean;
    note?: string;
  };
}

export interface Business {
  placeId: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  userRatingsTotal?: number;
  reviewUrl: string;
  mapsUrl: string;
  socialMedia?: SocialMediaLinks;
  types?: string[];
}

export interface PlatformSelection {
  key: string;
  label: string;
  description: string;
  emoji: string;
}

export interface ProductVariant {
  id: string;
  label: string;
  description?: string;
  priceDelta?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  rrp?: number;
  sku?: string;
  imageUrl?: string;
  groupType: string;
  variants: ProductVariant[];
}

export interface SignType {
  id: string;
  name: string;
  description: string;
  defaultPrice: number;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  signTypeId: string;
  signTypeName?: string;
  businessName: string;
  businessAddress: string;
  placeId: string;
  reviewUrl: string;
  status: 'success' | 'failed' | 'erased' | 'pending';
  salePrice?: number;
  locationLat: number;
  locationLng: number;
  notes?: string;
  programmedAt: string;
  erasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserInventory {
  id: string;
  userId: string;
  signTypeId: string;
  signTypeName?: string;
  quantityProgrammed: number;
  quantitySold: number;
  quantityFailed: number;
  totalRevenue: number;
  lastUpdated: string;
}

export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  failedSales: number;
  activeUsers: number;
  todaysSales: number;
  todaysRevenue: number;
}

export interface SalesTrendData {
  date: string;
  sales: number;
  revenue: number;
}

export interface SignPopularityData {
  signType: string;
  quantity: number;
  revenue: number;
}

export interface UserPerformanceData {
  userId: string;
  userName: string;
  totalSales: number;
  totalRevenue: number;
  successRate: number;
}

export interface AnalyticsDashboard {
  stats: DashboardStats;
  salesTrend: SalesTrendData[];
  signPopularity: SignPopularityData[];
  topUsers: UserPerformanceData[];
  recentTransactions: Transaction[];
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  signTypeId?: string;
  status?: Transaction['status'];
  limit?: number;
  offset?: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user' | 'manager';
  createdAt: string;
}
