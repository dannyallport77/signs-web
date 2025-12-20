import { prisma } from '@/lib/prisma';

/**
 * Social Media Type Service
 * Manages the master list of available social media and action types.
 * IMPORTANT: Never delete records - use soft delete (isActive=false) to preserve historical data.
 */

export interface SocialMediaTypeInput {
  key: string;
  name: string;
  category: 'review_platform' | 'social_media' | 'promotion' | 'other';
  iconUrl?: string;
  colorHex?: string;
  sortOrder?: number;
}

// Default social media types - seeded on first use
const DEFAULT_SOCIAL_MEDIA_TYPES: SocialMediaTypeInput[] = [
  // Review Platforms
  { key: 'google', name: 'Google Reviews', category: 'review_platform', colorHex: '#4285F4', sortOrder: 1 },
  { key: 'tripadvisor', name: 'TripAdvisor', category: 'review_platform', colorHex: '#34E0A1', sortOrder: 2 },
  { key: 'trustpilot', name: 'Trustpilot', category: 'review_platform', colorHex: '#00B67A', sortOrder: 3 },
  { key: 'yelp', name: 'Yelp', category: 'review_platform', colorHex: '#D32323', sortOrder: 4 },
  { key: 'yell', name: 'Yell', category: 'review_platform', colorHex: '#FFE400', sortOrder: 5 },
  { key: 'checkatrade', name: 'Checkatrade', category: 'review_platform', colorHex: '#00A3E0', sortOrder: 6 },
  { key: 'ratedpeople', name: 'Rated People', category: 'review_platform', colorHex: '#F7941D', sortOrder: 7 },
  { key: 'trustatrader', name: 'TrustATrader', category: 'review_platform', colorHex: '#0072BC', sortOrder: 8 },
  
  // Social Media Platforms
  { key: 'facebook', name: 'Facebook', category: 'social_media', colorHex: '#1877F2', sortOrder: 10 },
  { key: 'instagram', name: 'Instagram', category: 'social_media', colorHex: '#E4405F', sortOrder: 11 },
  { key: 'twitter', name: 'X (Twitter)', category: 'social_media', colorHex: '#000000', sortOrder: 12 },
  { key: 'tiktok', name: 'TikTok', category: 'social_media', colorHex: '#000000', sortOrder: 13 },
  { key: 'youtube', name: 'YouTube', category: 'social_media', colorHex: '#FF0000', sortOrder: 14 },
  { key: 'linkedin', name: 'LinkedIn', category: 'social_media', colorHex: '#0A66C2', sortOrder: 15 },
  
  // Promotions
  { key: 'fruit_machine', name: 'Fruit Machine', category: 'promotion', colorHex: '#FFD700', sortOrder: 20 },
  { key: 'fruit_machine_win', name: 'Fruit Machine - Win', category: 'promotion', colorHex: '#00FF00', sortOrder: 21 },
  { key: 'fruit_machine_lose', name: 'Fruit Machine - Lose', category: 'promotion', colorHex: '#FF6B6B', sortOrder: 22 },
  { key: 'scratch_card', name: 'Scratch Card', category: 'promotion', colorHex: '#FFD700', sortOrder: 23 },
  { key: 'spin_wheel', name: 'Spin Wheel', category: 'promotion', colorHex: '#FFD700', sortOrder: 24 },
  
  // Other Actions
  { key: 'wifi_connect', name: 'WiFi Connect', category: 'other', colorHex: '#4CAF50', sortOrder: 30 },
  { key: 'website', name: 'Website', category: 'other', colorHex: '#607D8B', sortOrder: 31 },
  { key: 'app_download', name: 'App Download', category: 'other', colorHex: '#9C27B0', sortOrder: 32 },
  { key: 'menu', name: 'Menu', category: 'other', colorHex: '#795548', sortOrder: 33 },
  { key: 'booking', name: 'Booking', category: 'other', colorHex: '#2196F3', sortOrder: 34 },
  { key: 'contact', name: 'Contact', category: 'other', colorHex: '#009688', sortOrder: 35 },
];

export const socialMediaTypeService = {
  /**
   * Get all social media types (optionally filtered by category or active status)
   */
  async getAll(options?: { category?: string; activeOnly?: boolean }) {
    const where: any = {};
    
    if (options?.category) {
      where.category = options.category;
    }
    
    if (options?.activeOnly !== false) {
      where.isActive = true; // Default to active only
    }
    
    return prisma.socialMediaType.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
  },

  /**
   * Get a single social media type by key
   */
  async getByKey(key: string) {
    return prisma.socialMediaType.findUnique({
      where: { key },
    });
  },

  /**
   * Get a single social media type by ID
   */
  async getById(id: string) {
    return prisma.socialMediaType.findUnique({
      where: { id },
    });
  },

  /**
   * Create a new social media type
   */
  async create(data: SocialMediaTypeInput) {
    return prisma.socialMediaType.create({
      data: {
        key: data.key.toLowerCase().replace(/\s+/g, '_'),
        name: data.name,
        category: data.category,
        iconUrl: data.iconUrl,
        colorHex: data.colorHex,
        sortOrder: data.sortOrder ?? 100,
      },
    });
  },

  /**
   * Update a social media type
   * Note: The key should NOT be changed to preserve historical references
   */
  async update(id: string, data: Partial<Omit<SocialMediaTypeInput, 'key'>>) {
    return prisma.socialMediaType.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        iconUrl: data.iconUrl,
        colorHex: data.colorHex,
        sortOrder: data.sortOrder,
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Soft delete - deactivate a social media type
   * NEVER actually delete to preserve historical records
   */
  async deactivate(id: string) {
    return prisma.socialMediaType.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Reactivate a previously deactivated social media type
   */
  async reactivate(id: string) {
    return prisma.socialMediaType.update({
      where: { id },
      data: {
        isActive: true,
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Seed the default social media types if they don't exist
   */
  async seedDefaults() {
    const existing = await prisma.socialMediaType.findMany();
    const existingKeys = new Set(existing.map(t => t.key));
    
    const toCreate = DEFAULT_SOCIAL_MEDIA_TYPES.filter(t => !existingKeys.has(t.key));
    
    if (toCreate.length > 0) {
      await prisma.socialMediaType.createMany({
        data: toCreate.map(t => ({
          key: t.key,
          name: t.name,
          category: t.category,
          iconUrl: t.iconUrl,
          colorHex: t.colorHex,
          sortOrder: t.sortOrder ?? 100,
        })),
        skipDuplicates: true,
      });
      console.log(`Seeded ${toCreate.length} new social media types`);
    }
    
    return this.getAll({ activeOnly: false });
  },

  /**
   * Get types grouped by category
   */
  async getGroupedByCategory() {
    const types = await this.getAll({ activeOnly: true });
    
    const grouped: Record<string, typeof types> = {
      review_platform: [],
      social_media: [],
      promotion: [],
      other: [],
    };
    
    types.forEach(type => {
      if (grouped[type.category]) {
        grouped[type.category].push(type);
      } else {
        grouped.other.push(type);
      }
    });
    
    return grouped;
  },

  /**
   * Look up or create a type by key (used during logging)
   */
  async getOrCreate(key: string, name?: string, category?: string) {
    const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
    
    let type = await this.getByKey(normalizedKey);
    
    if (!type) {
      type = await this.create({
        key: normalizedKey,
        name: name || key,
        category: (category as any) || 'other',
      });
    }
    
    return type;
  },
};
