import { prisma } from '@/lib/prisma';

const TRIAL_DAYS = 7;
const PAYMENT_PRICE = 30; // £30

export interface CreateTagInput {
  tagUid?: string;
  businessName: string;
  businessAddress?: string;
  placeId: string;
  reviewUrl?: string;
  latitude?: number;
  longitude?: number;
  writtenBy?: string;
  salePrice?: number | null; // null = trial
  isTrial?: boolean;
  trialDays?: number; // Customizable trial period (defaults to 7)
  trialEndPrice?: number; // Price after trial ends (defaults to 30)
}

export interface TagPaymentInput {
  tagId?: string;
  tagUid?: string;
  paymentId: string;
  paymentAmount: number;
}

export const nfcTagService = {
  /**
   * Create or update a tag record
   */
  async createTag(data: CreateTagInput) {
    const isTrial = data.salePrice === null || data.salePrice === undefined || data.isTrial === true;
    const customTrialDays = data.trialDays ?? TRIAL_DAYS;
    const customEndPrice = data.trialEndPrice ?? PAYMENT_PRICE;
    
    const tag = await prisma.nFCTag.create({
      data: {
        tagUid: data.tagUid,
        businessName: data.businessName,
        businessAddress: data.businessAddress,
        placeId: data.placeId,
        reviewUrl: data.reviewUrl,
        latitude: data.latitude,
        longitude: data.longitude,
        writtenBy: data.writtenBy,
        salePrice: isTrial ? null : data.salePrice,
        isTrial,
        trialStartDate: new Date(),
        trialDays: customTrialDays,
        trialEndPrice: customEndPrice,
        isPaid: !isTrial && (data.salePrice ?? 0) > 0,
        paidAt: !isTrial ? new Date() : null,
      },
    });

    console.log(`[NFCTag] Created tag: ${tag.id}, trial: ${tag.isTrial}, trialDays: ${customTrialDays}, endPrice: £${customEndPrice}`);
    return tag;
  },

  /**
   * Get tag by ID or tagUid
   */
  async getTag(idOrTagUid: string) {
    // Try by ID first
    let tag = await prisma.nFCTag.findUnique({
      where: { id: idOrTagUid },
    });

    // If not found, try by tagUid
    if (!tag) {
      tag = await prisma.nFCTag.findFirst({
        where: { tagUid: idOrTagUid },
      });
    }

    return tag;
  },

  /**
   * Check if a tag's trial has expired
   */
  isTrialExpired(tag: { isTrial: boolean; isPaid: boolean; trialStartDate: Date; trialDays: number }) {
    if (!tag.isTrial || tag.isPaid) {
      return false;
    }

    const trialEnd = new Date(tag.trialStartDate);
    trialEnd.setDate(trialEnd.getDate() + tag.trialDays);
    
    return new Date() > trialEnd;
  },

  /**
   * Get trial status for a tag
   */
  async getTrialStatus(idOrTagUid: string) {
    const tag = await this.getTag(idOrTagUid);
    
    if (!tag) {
      return { found: false };
    }

    const trialEnd = new Date(tag.trialStartDate);
    trialEnd.setDate(trialEnd.getDate() + tag.trialDays);
    const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    const isExpired = this.isTrialExpired(tag);
    const paymentAmount = tag.trialEndPrice ?? PAYMENT_PRICE;

    return {
      found: true,
      tag,
      isTrial: tag.isTrial,
      isPaid: tag.isPaid,
      salePrice: tag.salePrice,
      trialStartDate: tag.trialStartDate,
      trialEndDate: trialEnd,
      daysRemaining,
      isExpired,
      paymentRequired: tag.isTrial && !tag.isPaid,
      paymentAmount,
    };
  },

  /**
   * Mark a tag as paid
   */
  async markAsPaid(data: TagPaymentInput) {
    const tag = data.tagId 
      ? await prisma.nFCTag.findUnique({ where: { id: data.tagId } })
      : await prisma.nFCTag.findFirst({ where: { tagUid: data.tagUid } });

    if (!tag) {
      throw new Error('Tag not found');
    }

    const updated = await prisma.nFCTag.update({
      where: { id: tag.id },
      data: {
        isPaid: true,
        isTrial: false,
        paidAt: new Date(),
        paymentId: data.paymentId,
        paymentAmount: data.paymentAmount,
        salePrice: data.paymentAmount,
      },
    });

    console.log(`[NFCTag] Marked tag ${tag.id} as paid: £${data.paymentAmount}`);
    return updated;
  },

  /**
   * Update tag sale price (convert from trial)
   */
  async updateSalePrice(idOrTagUid: string, salePrice: number) {
    const tag = await this.getTag(idOrTagUid);
    
    if (!tag) {
      throw new Error('Tag not found');
    }

    const updated = await prisma.nFCTag.update({
      where: { id: tag.id },
      data: {
        salePrice,
        isTrial: false,
        isPaid: true,
        paidAt: new Date(),
      },
    });

    console.log(`[NFCTag] Updated tag ${tag.id} sale price to £${salePrice}`);
    return updated;
  },

  /**
   * Get all trial tags (for analytics)
   */
  async getTrialTags() {
    return prisma.nFCTag.findMany({
      where: { isTrial: true },
      orderBy: { trialStartDate: 'desc' },
    });
  },

  /**
   * Get all expired trial tags
   */
  async getExpiredTrialTags() {
    const tags = await this.getTrialTags();
    return tags.filter(tag => this.isTrialExpired(tag));
  },

  /**
   * Payment price constant
   */
  getPaymentPrice() {
    return PAYMENT_PRICE;
  },
};
