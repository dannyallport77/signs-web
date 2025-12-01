import { prisma } from '@/lib/prisma';
import { PLATFORM_PRESET_MAP, PLATFORM_PRESETS, PlatformKey } from '@/lib/reviewPlatforms';

export type PlatformPayload = {
  platformKey: PlatformKey;
  name?: string;
  url: string;
  enabled?: boolean;
  order?: number;
  icon?: string;
};

const PLATFORM_KEY_SET = new Set(PLATFORM_PRESETS.map((preset) => preset.key));

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

export function sanitizePlatforms(platforms: PlatformPayload[]) {
  return platforms
    .filter((platform) => platform.enabled !== false && Boolean(platform.url))
    .map((platform, index) => {
      if (!PLATFORM_KEY_SET.has(platform.platformKey)) {
        throw new Error(`Unknown platform key: ${platform.platformKey}`);
      }

      const preset = PLATFORM_PRESET_MAP[platform.platformKey];
      return {
        platformKey: platform.platformKey,
        name: platform.name?.trim() || preset.label,
        url: platform.url.trim(),
        enabled: true,
        order: typeof platform.order === 'number' ? platform.order : index,
        icon: platform.icon || preset.icon,
      };
    });
}
