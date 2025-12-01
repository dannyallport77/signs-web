import { prisma } from '@/lib/prisma';
import { PLATFORM_PRESET_MAP, PlatformKey } from '@/lib/reviewPlatforms';

export type PlatformPayload = {
  platformKey: PlatformKey;
  name?: string;
  url: string;
  enabled?: boolean;
  order?: number;
  icon?: string;
};

const DEFAULT_CUSTOM_LABEL = 'Custom Platform';

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 64);

export async function ensureUniqueSlug(base: string): Promise<string> {
  const safeBase = base || `menu-${Date.now()}`;
  let attempt = safeBase;
  let counter = 1;

  while (await prisma.reviewPlatformMenu.findUnique({ where: { slug: attempt } })) {
    attempt = `${safeBase}-${counter++}`;
  }

  return attempt;
}

const normalizePlatformKey = (platformKey?: string, fallback?: string, index?: number) => {
  const source = platformKey?.trim() || fallback?.trim() || `custom-${index ?? Date.now()}`;
  const normalized = slugify(source);
  return normalized || `custom-${index ?? Date.now()}`;
};

export function sanitizePlatforms(platforms: PlatformPayload[]) {
  return platforms
    .filter((platform) => platform.enabled !== false && Boolean(platform.url))
    .map((platform, index) => {
      const normalizedKey = normalizePlatformKey(platform.platformKey, platform.name, index);
      const preset = PLATFORM_PRESET_MAP[normalizedKey] ?? PLATFORM_PRESET_MAP[platform.platformKey];
      const resolvedName = platform.name?.trim() || preset?.label || DEFAULT_CUSTOM_LABEL;
      return {
        platformKey: normalizedKey,
        name: resolvedName,
        url: platform.url.trim(),
        enabled: true,
        order: typeof platform.order === 'number' ? platform.order : index,
        icon: platform.icon?.trim() || preset?.icon || '⭐',
      };
    });
}
