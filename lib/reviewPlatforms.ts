export type KnownPlatformKey =
  | 'google'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'twitter'
  | 'linkedin'
  | 'tripadvisor'
  | 'trustpilot'
  | 'yell'
  | 'checkatrade'
  | 'ratedpeople'
  | 'trustatrader'
  | 'fruitMachine';

export type PlatformKey = KnownPlatformKey | string;

export interface PlatformPreset {
  key: PlatformKey;
  label: string;
  description: string;
  icon: string;
  accent: string;
}

export const PLATFORM_PRESETS: PlatformPreset[] = [
  {
    key: 'google',
    label: 'Google Reviews',
    description: 'Send customers directly to your Google review form.',
    icon: '⭐',
    accent: 'from-amber-400 to-orange-500',
  },
  {
    key: 'trustpilot',
    label: 'Trustpilot',
    description: 'Drive trust with public Trustpilot testimonials.',
    icon: '🟢',
    accent: 'from-emerald-500 to-emerald-600',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    description: 'Collect recommendations on your Facebook page.',
    icon: '📘',
    accent: 'from-blue-500 to-blue-600',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    description: 'Grow your followers and brand reach on Instagram.',
    icon: '📸',
    accent: 'from-pink-500 via-red-500 to-yellow-500',
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    description: 'Send users to your TikTok profile or hashtag challenge.',
    icon: '🎵',
    accent: 'from-gray-900 to-slate-900',
  },
  {
    key: 'twitter',
    label: 'X / Twitter',
    description: 'Boost social proof through reposts and mentions.',
    icon: '🐦',
    accent: 'from-slate-800 to-slate-900',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    description: 'Collect B2B testimonials and recommendations.',
    icon: '💼',
    accent: 'from-sky-500 to-sky-600',
  },
  {
    key: 'tripadvisor',
    label: 'Tripadvisor',
    description: 'Capture hospitality reviews on Tripadvisor.',
    icon: '🦉',
    accent: 'from-lime-500 to-green-600',
  },
  {
    key: 'yell',
    label: 'Yell',
    description: 'Push satisfied customers to review on Yell.',
    icon: '🟡',
    accent: 'from-yellow-400 to-yellow-500',
  },
  {
    key: 'checkatrade',
    label: 'Checkatrade',
    description: 'Ideal for tradespeople that rely on Checkatrade.',
    icon: '🛠️',
    accent: 'from-cyan-500 to-blue-500',
  },
  {
    key: 'ratedpeople',
    label: 'Rated People',
    description: 'Collect trusted homeowner feedback.',
    icon: '🏡',
    accent: 'from-rose-500 to-rose-600',
  },
  {
    key: 'trustatrader',
    label: 'TrustATrader',
    description: 'Direct household clients to TrustATrader profiles.',
    icon: '🧰',
    accent: 'from-indigo-500 to-indigo-600',
  },
  {
    key: 'fruitMachine',
    label: 'Fruit Machine Promotion',
    description: 'Highlight the live fruit machine promotion for in-store play.',
    icon: '🎰',
    accent: 'from-fuchsia-500 to-purple-600',
  },
];

export const PLATFORM_PRESET_MAP = PLATFORM_PRESETS.reduce<Record<string, PlatformPreset>>((acc, preset) => {
  acc[preset.key] = preset;
  return acc;
}, {} as Record<string, PlatformPreset>);
