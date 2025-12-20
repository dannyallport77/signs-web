import { prisma } from '@/lib/prisma';
import { socialMediaTypeService } from './socialMediaTypeService';

/**
 * NFC Tag Interaction Service
 * Logs ALL tag interactions (writes and reads) with comprehensive details.
 * This creates a complete audit trail of:
 * - When tags are written (with site ID, timestamp, user)
 * - When tags are read/scanned (with site ID, timestamp, action chosen)
 * - What action the user took (Google review, Instagram, fruit machine win/lose, etc.)
 */

export interface TagWriteLogInput {
  nfcTagId?: string;
  tagUid?: string;  // Physical tag UID - unique identifier for each physical tag
  siteId: string;
  businessName?: string;
  businessAddress?: string;
  latitude?: number;
  longitude?: number;
  actionType?: string; // e.g., "google_review", "fruit_machine"
  targetUrl?: string;
  tagData?: Record<string, any>;
  userId?: string;
  deviceInfo?: string;
}

export interface TagReadLogInput {
  nfcTagId?: string;
  tagUid?: string;  // Physical tag UID - unique identifier for each physical tag
  siteId: string;
  businessName?: string;
  businessAddress?: string;
  latitude?: number;
  longitude?: number;
  actionType: string; // What action the user chose (required for reads)
  promotionId?: string;
  promotionResult?: 'win' | 'lose';
  prizeType?: string;
  prizeName?: string;
  prizeValue?: string;
  targetUrl?: string;
  tagData?: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export interface InteractionQuery {
  siteId?: string;
  nfcTagId?: string;
  tagUid?: string;  // Filter by physical tag UID
  interactionType?: 'write' | 'read';
  actionType?: string;
  promotionResult?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export const nfcTagInteractionService = {
  /**
   * Log a tag WRITE event
   * Called when a tag is programmed/written
   */
  async logWrite(data: TagWriteLogInput) {
    // Look up or create the social media type
    let socialMediaTypeId: string | undefined;
    if (data.actionType) {
      const socialType = await socialMediaTypeService.getOrCreate(data.actionType);
      socialMediaTypeId = socialType.id;
    }

    const interaction = await prisma.nFCTagInteraction.create({
      data: {
        nfcTagId: data.nfcTagId,
        tagUid: data.tagUid,
        interactionType: 'write',
        siteId: data.siteId,
        businessName: data.businessName,
        businessAddress: data.businessAddress,
        latitude: data.latitude,
        longitude: data.longitude,
        actionType: data.actionType,
        socialMediaTypeId,
        targetUrl: data.targetUrl,
        tagData: data.tagData ? JSON.stringify(data.tagData) : null,
        userId: data.userId,
        deviceInfo: data.deviceInfo,
      },
    });

    console.log(`[NFC] Logged WRITE interaction: ${interaction.id} for site ${data.siteId}, tagUid: ${data.tagUid || 'none'}`);
    return interaction;
  },

  /**
   * Log a tag READ event
   * Called when someone scans a tag and takes an action
   */
  async logRead(data: TagReadLogInput) {
    // Look up or create the social media type
    let socialMediaTypeId: string | undefined;
    if (data.actionType) {
      // For promotion results, use specific types
      let actionKey = data.actionType;
      if (data.actionType === 'fruit_machine' && data.promotionResult) {
        actionKey = `fruit_machine_${data.promotionResult}`;
      }
      const socialType = await socialMediaTypeService.getOrCreate(actionKey);
      socialMediaTypeId = socialType.id;
    }

    const interaction = await prisma.nFCTagInteraction.create({
      data: {
        nfcTagId: data.nfcTagId,
        tagUid: data.tagUid,
        interactionType: 'read',
        siteId: data.siteId,
        businessName: data.businessName,
        businessAddress: data.businessAddress,
        latitude: data.latitude,
        longitude: data.longitude,
        actionType: data.actionType,
        socialMediaTypeId,
        promotionId: data.promotionId,
        promotionResult: data.promotionResult,
        prizeType: data.prizeType,
        prizeName: data.prizeName,
        prizeValue: data.prizeValue,
        targetUrl: data.targetUrl,
        tagData: data.tagData ? JSON.stringify(data.tagData) : null,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
      },
    });

    console.log(`[NFC] Logged READ interaction: ${interaction.id} for site ${data.siteId}, action: ${data.actionType}`);
    return interaction;
  },

  /**
   * Query interactions with filters
   */
  async query(filters: InteractionQuery) {
    const where: any = {};

    if (filters.siteId) {
      where.siteId = filters.siteId;
    }

    if (filters.nfcTagId) {
      where.nfcTagId = filters.nfcTagId;
    }

    if (filters.tagUid) {
      where.tagUid = filters.tagUid;
    }

    if (filters.interactionType) {
      where.interactionType = filters.interactionType;
    }

    if (filters.actionType) {
      where.actionType = filters.actionType;
    }

    if (filters.promotionResult) {
      where.promotionResult = filters.promotionResult;
    }

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    const [total, interactions] = await Promise.all([
      prisma.nFCTagInteraction.count({ where }),
      prisma.nFCTagInteraction.findMany({
        where,
        include: {
          socialMediaType: true,
          nfcTag: true,
        },
        orderBy: { timestamp: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0,
      }),
    ]);

    return { total, interactions };
  },

  /**
   * Get interaction statistics for a site (or all sites if siteId not provided)
   */
  async getStats(siteId?: string, startDate?: Date, endDate?: Date) {
    const where: any = {};
    
    if (siteId) {
      where.siteId = siteId;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = startDate;
      }
      if (endDate) {
        where.timestamp.lte = endDate;
      }
    }

    const interactions = await prisma.nFCTagInteraction.findMany({
      where,
      include: { socialMediaType: true },
    });

    const stats = {
      totalWrites: 0,
      totalReads: 0,
      actionBreakdown: {} as Record<string, number>,
      promotionResults: {
        wins: 0,
        losses: 0,
        winRate: 0,
      },
      timelineByDay: {} as Record<string, { writes: number; reads: number }>,
      topActions: [] as { action: string; count: number }[],
    };

    interactions.forEach(i => {
      // Count writes vs reads
      if (i.interactionType === 'write') {
        stats.totalWrites++;
      } else {
        stats.totalReads++;
      }

      // Action breakdown
      if (i.actionType) {
        stats.actionBreakdown[i.actionType] = (stats.actionBreakdown[i.actionType] || 0) + 1;
      }

      // Promotion results
      if (i.promotionResult === 'win') {
        stats.promotionResults.wins++;
      } else if (i.promotionResult === 'lose') {
        stats.promotionResults.losses++;
      }

      // Timeline by day
      const day = i.timestamp.toISOString().split('T')[0];
      if (!stats.timelineByDay[day]) {
        stats.timelineByDay[day] = { writes: 0, reads: 0 };
      }
      if (i.interactionType === 'write') {
        stats.timelineByDay[day].writes++;
      } else {
        stats.timelineByDay[day].reads++;
      }
    });

    // Calculate win rate
    const totalGames = stats.promotionResults.wins + stats.promotionResults.losses;
    if (totalGames > 0) {
      stats.promotionResults.winRate = (stats.promotionResults.wins / totalGames) * 100;
    }

    // Top actions
    stats.topActions = Object.entries(stats.actionBreakdown)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  },

  /**
   * Get recent interactions for a site
   */
  async getRecent(siteId: string, limit: number = 20) {
    return prisma.nFCTagInteraction.findMany({
      where: { siteId },
      include: {
        socialMediaType: true,
        nfcTag: true,
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  },

  /**
   * Get all interactions for a specific tag
   */
  async getByTagId(nfcTagId: string) {
    return prisma.nFCTagInteraction.findMany({
      where: { nfcTagId },
      include: { socialMediaType: true },
      orderBy: { timestamp: 'desc' },
    });
  },
};
