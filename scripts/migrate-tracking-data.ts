/**
 * Migration Script: Migrate existing tracking data to NFCTagInteraction
 * 
 * This script:
 * 1. Creates a JSON backup of all existing tracking tables
 * 2. Migrates data from:
 *    - NFCTag → NFCTagInteraction (write events)
 *    - ReviewPlatformClick → NFCTagInteraction (read events)
 *    - SmartLinkScan → NFCTagInteraction (read events)
 *    - PreprogrammedTagScan → NFCTagInteraction (read events)
 *    - FruitMachineAnalytics → NFCTagInteraction (read events)
 *    - FruitMachineResult → NFCTagInteraction (read events)
 * 
 * Run with: npx ts-node scripts/migrate-tracking-data.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface BackupData {
  timestamp: string;
  tables: {
    nfcTags: any[];
    reviewPlatformClicks: any[];
    smartLinkScans: any[];
    preprogrammedTagScans: any[];
    fruitMachineAnalytics: any[];
    fruitMachineResults: any[];
    reviewPlatforms: any[];
    reviewPlatformMenus: any[];
    smartLinks: any[];
    preprogrammedTags: any[];
  };
}

async function createBackup(): Promise<string> {
  console.log('\n📦 Creating backup of existing tracking data...\n');

  const backup: BackupData = {
    timestamp: new Date().toISOString(),
    tables: {
      nfcTags: await prisma.nFCTag.findMany(),
      reviewPlatformClicks: await prisma.reviewPlatformClick.findMany(),
      smartLinkScans: await prisma.smartLinkScan.findMany(),
      preprogrammedTagScans: await prisma.preprogrammedTagScan.findMany(),
      fruitMachineAnalytics: await prisma.fruitMachineAnalytics.findMany(),
      fruitMachineResults: await prisma.fruitMachineResult.findMany(),
      // Include related tables for context
      reviewPlatforms: await prisma.reviewPlatform.findMany(),
      reviewPlatformMenus: await prisma.reviewPlatformMenu.findMany(),
      smartLinks: await prisma.smartLink.findMany(),
      preprogrammedTags: await prisma.preprogrammedTag.findMany(),
    },
  };

  // Create backups directory if it doesn't exist
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const filename = `tracking-data-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const filepath = path.join(backupDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

  console.log(`✅ Backup created: ${filepath}`);
  console.log(`   - NFCTags: ${backup.tables.nfcTags.length}`);
  console.log(`   - ReviewPlatformClicks: ${backup.tables.reviewPlatformClicks.length}`);
  console.log(`   - SmartLinkScans: ${backup.tables.smartLinkScans.length}`);
  console.log(`   - PreprogrammedTagScans: ${backup.tables.preprogrammedTagScans.length}`);
  console.log(`   - FruitMachineAnalytics: ${backup.tables.fruitMachineAnalytics.length}`);
  console.log(`   - FruitMachineResults: ${backup.tables.fruitMachineResults.length}`);

  return filepath;
}

async function getOrCreateSocialMediaType(key: string, name?: string, category?: string) {
  const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
  
  let type = await prisma.socialMediaType.findUnique({
    where: { key: normalizedKey },
  });

  if (!type) {
    type = await prisma.socialMediaType.create({
      data: {
        key: normalizedKey,
        name: name || key,
        category: category || 'other',
        sortOrder: 100,
      },
    });
    console.log(`   Created new SocialMediaType: ${normalizedKey}`);
  }

  return type;
}

async function migrateNFCTags() {
  console.log('\n📝 Migrating NFCTag records (write events)...');
  
  const nfcTags = await prisma.nFCTag.findMany();
  let migrated = 0;
  let skipped = 0;

  for (const tag of nfcTags) {
    // Check if already migrated (by checking for existing interaction with same timestamp and site)
    const existing = await prisma.nFCTagInteraction.findFirst({
      where: {
        siteId: tag.placeId,
        interactionType: 'write',
        timestamp: tag.writtenAt,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Determine action type from reviewUrl
    let actionType = 'google'; // default
    if (tag.reviewUrl) {
      if (tag.reviewUrl.includes('facebook')) actionType = 'facebook';
      else if (tag.reviewUrl.includes('instagram')) actionType = 'instagram';
      else if (tag.reviewUrl.includes('tripadvisor')) actionType = 'tripadvisor';
      else if (tag.reviewUrl.includes('trustpilot')) actionType = 'trustpilot';
      else if (tag.reviewUrl.includes('yelp')) actionType = 'yelp';
    }

    const socialType = await getOrCreateSocialMediaType(actionType);

    await prisma.nFCTagInteraction.create({
      data: {
        nfcTagId: tag.id,
        interactionType: 'write',
        siteId: tag.placeId,
        businessName: tag.businessName,
        businessAddress: tag.businessAddress,
        latitude: tag.latitude,
        longitude: tag.longitude,
        actionType,
        socialMediaTypeId: socialType.id,
        targetUrl: tag.reviewUrl,
        userId: tag.writtenBy,
        timestamp: tag.writtenAt,
        tagData: JSON.stringify({ migratedFrom: 'NFCTag', originalId: tag.id }),
      },
    });
    migrated++;
  }

  console.log(`   ✅ Migrated: ${migrated}, Skipped (already exists): ${skipped}`);
}

async function migrateReviewPlatformClicks() {
  console.log('\n📝 Migrating ReviewPlatformClick records (read events)...');

  const clicks = await prisma.reviewPlatformClick.findMany({
    include: {
      platform: {
        include: {
          menu: true,
        },
      },
    },
  });

  let migrated = 0;
  let skipped = 0;

  for (const click of clicks) {
    // Check if already migrated
    const existing = await prisma.nFCTagInteraction.findFirst({
      where: {
        timestamp: click.timestamp,
        tagData: { contains: click.id },
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const actionType = click.platform?.platformKey || 'unknown';
    const socialType = await getOrCreateSocialMediaType(
      actionType,
      click.platform?.name,
      'review_platform'
    );

    await prisma.nFCTagInteraction.create({
      data: {
        interactionType: 'read',
        siteId: click.platform?.menu?.placeId || click.menuId,
        businessName: click.platform?.menu?.businessName,
        businessAddress: click.platform?.menu?.businessAddress,
        actionType,
        socialMediaTypeId: socialType.id,
        targetUrl: click.platform?.url,
        userAgent: click.userAgent,
        ipAddress: click.ipAddress,
        timestamp: click.timestamp,
        tagData: JSON.stringify({
          migratedFrom: 'ReviewPlatformClick',
          originalId: click.id,
          platformId: click.platformId,
          menuId: click.menuId,
          reviewSubmitted: click.reviewSubmitted,
          referrer: click.referrer,
        }),
      },
    });
    migrated++;
  }

  console.log(`   ✅ Migrated: ${migrated}, Skipped (already exists): ${skipped}`);
}

async function migrateSmartLinkScans() {
  console.log('\n📝 Migrating SmartLinkScan records (read events)...');

  const scans = await prisma.smartLinkScan.findMany({
    include: {
      smartLink: true,
    },
  });

  let migrated = 0;
  let skipped = 0;

  for (const scan of scans) {
    // Check if already migrated
    const existing = await prisma.nFCTagInteraction.findFirst({
      where: {
        timestamp: scan.timestamp,
        tagData: { contains: scan.id },
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Determine action type from targetUrl
    let actionType = 'smart_link';
    if (scan.smartLink?.targetUrl) {
      const url = scan.smartLink.targetUrl.toLowerCase();
      if (url.includes('google') || url.includes('g.page')) actionType = 'google';
      else if (url.includes('facebook')) actionType = 'facebook';
      else if (url.includes('instagram')) actionType = 'instagram';
      else if (url.includes('tripadvisor')) actionType = 'tripadvisor';
    }

    const socialType = await getOrCreateSocialMediaType(actionType);

    await prisma.nFCTagInteraction.create({
      data: {
        interactionType: 'read',
        siteId: scan.smartLink?.placeId || 'unknown',
        businessName: scan.smartLink?.businessName,
        actionType,
        socialMediaTypeId: socialType.id,
        targetUrl: scan.smartLink?.targetUrl,
        userAgent: scan.userAgent,
        ipAddress: scan.ipAddress,
        timestamp: scan.timestamp,
        tagData: JSON.stringify({
          migratedFrom: 'SmartLinkScan',
          originalId: scan.id,
          smartLinkId: scan.smartLinkId,
          slug: scan.smartLink?.slug,
          referrer: scan.referrer,
        }),
      },
    });
    migrated++;
  }

  console.log(`   ✅ Migrated: ${migrated}, Skipped (already exists): ${skipped}`);
}

async function migratePreprogrammedTagScans() {
  console.log('\n📝 Migrating PreprogrammedTagScan records (read events)...');

  const scans = await prisma.preprogrammedTagScan.findMany({
    include: {
      tag: true,
    },
  });

  let migrated = 0;
  let skipped = 0;

  for (const scan of scans) {
    // Check if already migrated
    const existing = await prisma.nFCTagInteraction.findFirst({
      where: {
        timestamp: scan.timestamp,
        tagData: { contains: scan.id },
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Determine action type
    let actionType = 'preprogrammed_tag';
    if (scan.tag?.targetUrl) {
      const url = scan.tag.targetUrl.toLowerCase();
      if (url.includes('google') || url.includes('g.page')) actionType = 'google';
      else if (url.includes('facebook')) actionType = 'facebook';
      else if (url.includes('instagram')) actionType = 'instagram';
    }

    const socialType = await getOrCreateSocialMediaType(actionType);

    await prisma.nFCTagInteraction.create({
      data: {
        interactionType: 'read',
        siteId: scan.tag?.placeId || 'unknown',
        businessName: scan.tag?.businessName,
        businessAddress: scan.tag?.businessAddress,
        actionType,
        socialMediaTypeId: socialType.id,
        targetUrl: scan.tag?.targetUrl,
        userAgent: scan.userAgent,
        ipAddress: scan.ipAddress,
        timestamp: scan.timestamp,
        tagData: JSON.stringify({
          migratedFrom: 'PreprogrammedTagScan',
          originalId: scan.id,
          preprogrammedTagId: scan.preprogrammedTagId,
          tagUid: scan.tag?.tagUid,
          slug: scan.tag?.slug,
          wasLinked: scan.wasLinked,
        }),
      },
    });
    migrated++;
  }

  console.log(`   ✅ Migrated: ${migrated}, Skipped (already exists): ${skipped}`);
}

async function migrateFruitMachineAnalytics() {
  console.log('\n📝 Migrating FruitMachineAnalytics records (read events)...');

  const analytics = await prisma.fruitMachineAnalytics.findMany();

  let migrated = 0;
  let skipped = 0;

  for (const event of analytics) {
    // Check if already migrated
    const existing = await prisma.nFCTagInteraction.findFirst({
      where: {
        timestamp: event.timestamp,
        tagData: { contains: event.id },
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Map eventType to actionType and promotionResult
    let actionType = 'fruit_machine';
    let promotionResult: string | null = null;

    if (event.eventType === 'win') {
      actionType = 'fruit_machine';
      promotionResult = 'win';
    } else if (event.eventType === 'loss') {
      actionType = 'fruit_machine';
      promotionResult = 'lose';
    } else if (event.eventType === 'scan') {
      actionType = event.gameType || 'fruit_machine';
    }

    const socialType = await getOrCreateSocialMediaType(
      promotionResult ? `fruit_machine_${promotionResult}` : actionType,
      undefined,
      'promotion'
    );

    await prisma.nFCTagInteraction.create({
      data: {
        interactionType: 'read',
        siteId: event.placeId,
        businessName: event.businessName,
        actionType,
        socialMediaTypeId: socialType.id,
        promotionId: event.promotionId,
        promotionResult,
        prizeType: event.prizeType,
        prizeName: event.prizeName,
        prizeValue: event.prizeAmount?.toString(),
        timestamp: event.timestamp,
        tagData: JSON.stringify({
          migratedFrom: 'FruitMachineAnalytics',
          originalId: event.id,
          businessId: event.businessId,
          promotionName: event.promotionName,
          gameType: event.gameType,
          machineType: event.machineType,
          won: event.won,
        }),
      },
    });
    migrated++;
  }

  console.log(`   ✅ Migrated: ${migrated}, Skipped (already exists): ${skipped}`);
}

async function migrateFruitMachineResults() {
  console.log('\n📝 Migrating FruitMachineResult records (read events)...');

  const results = await prisma.fruitMachineResult.findMany({
    include: {
      promotion: true,
    },
  });

  let migrated = 0;
  let skipped = 0;

  for (const result of results) {
    // Check if already migrated
    const existing = await prisma.nFCTagInteraction.findFirst({
      where: {
        timestamp: result.timestamp,
        tagData: { contains: result.id },
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const promotionResult = result.isWin ? 'win' : 'lose';
    const socialType = await getOrCreateSocialMediaType(
      `fruit_machine_${promotionResult}`,
      undefined,
      'promotion'
    );

    await prisma.nFCTagInteraction.create({
      data: {
        interactionType: 'read',
        siteId: result.placeId || result.promotion?.placeId || result.businessId,
        businessName: result.promotion?.name,
        actionType: 'fruit_machine',
        socialMediaTypeId: socialType.id,
        promotionId: result.promotionId,
        promotionResult,
        prizeType: result.prizeType,
        prizeName: result.prizeName,
        prizeValue: result.prizeValue,
        timestamp: result.timestamp,
        tagData: JSON.stringify({
          migratedFrom: 'FruitMachineResult',
          originalId: result.id,
          businessId: result.businessId,
          winnerCode: result.winnerCode,
        }),
      },
    });
    migrated++;
  }

  console.log(`   ✅ Migrated: ${migrated}, Skipped (already exists): ${skipped}`);
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  TRACKING DATA MIGRATION TO NFCTagInteraction');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    // Step 1: Create backup
    const backupPath = await createBackup();
    console.log(`\n💾 Backup saved to: ${backupPath}`);

    // Step 2: Run migrations
    console.log('\n🚀 Starting migration...');

    await migrateNFCTags();
    await migrateReviewPlatformClicks();
    await migrateSmartLinkScans();
    await migratePreprogrammedTagScans();
    await migrateFruitMachineAnalytics();
    await migrateFruitMachineResults();

    // Step 3: Summary
    const totalInteractions = await prisma.nFCTagInteraction.count();
    const writeCount = await prisma.nFCTagInteraction.count({ where: { interactionType: 'write' } });
    const readCount = await prisma.nFCTagInteraction.count({ where: { interactionType: 'read' } });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  MIGRATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n📊 Total NFCTagInteraction records: ${totalInteractions}`);
    console.log(`   - Write events: ${writeCount}`);
    console.log(`   - Read events: ${readCount}`);
    console.log(`\n💾 Backup file: ${backupPath}`);
    console.log('\n✅ Migration completed successfully!');
    console.log('\nNote: Original tables have NOT been deleted.');
    console.log('You can safely delete them later after verifying the migration.');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
