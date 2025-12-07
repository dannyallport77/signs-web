import Image from 'next/image';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PLATFORM_PRESET_MAP, PlatformKey } from '@/lib/reviewPlatforms';

async function fetchMenu(slug: string) {
  return prisma.reviewPlatformMenu.findUnique({
    where: { slug },
    include: {
      platforms: {
        where: { enabled: true },
        orderBy: { order: 'asc' },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const menu = await prisma.reviewPlatformMenu.findUnique({ where: { slug } });

  if (!menu) {
    return {
      title: 'Review Menu',
      description: 'Select a platform to share your experience.',
    };
  }

  return {
    title: `${menu.businessName} • Reviews`,
    description: menu.heroSubtitle || `Choose a platform to review ${menu.businessName}.`,
    openGraph: {
      title: `${menu.businessName} • Reviews`,
      description: menu.heroSubtitle || `Choose a platform to review ${menu.businessName}.`,
    },
  };
}

export default async function ReviewMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const menu = await fetchMenu(slug);

  if (!menu) {
    notFound();
  }

  const heroTitle = menu.heroTitle || `Leave a review for ${menu.businessName}`;
  const heroSubtitle = menu.heroSubtitle || menu.businessAddress || 'Choose your favourite platform below';
  let websiteHostname: string | null = null;
  if (menu.websiteUrl) {
    try {
      const parsed = new URL(menu.websiteUrl);
      websiteHostname = parsed.hostname.replace(/^www\./, '');
    } catch (error) {
      websiteHostname = null;
    }
  }

  const appStoreLabel = menu.appStoreType === 'google_play' ? 'Google Play Store' : 'Apple App Store';
  const appStoreIcon = menu.appStoreType === 'google_play' ? '🤖' : '🍎';

  // Separate Google from other platforms
  const googlePlatform = menu.platforms.find(p => p.platformKey === 'google');
  
  // Build satellites list
  const satellites: Array<{
    id: string;
    href: string;
    icon: string;
    label: string;
    accent: string;
    isPromo?: boolean;
    target?: string;
  }> = [];

  // 1. Other platforms
  menu.platforms.forEach(platform => {
    if (platform.platformKey === 'google') return;
    
    const preset = PLATFORM_PRESET_MAP[platform.platformKey as PlatformKey];
    satellites.push({
      id: platform.id,
      href: `/review-menu/${menu.slug}/platform/${platform.id}`,
      icon: platform.icon || preset?.icon || '⭐',
      label: platform.name,
      accent: preset?.accent || 'from-indigo-500 to-indigo-600',
      isPromo: platform.platformKey === 'fruitMachine',
      target: '_blank'
    });
  });

  // 2. WiFi
  if (menu.wifiSsid) {
    satellites.push({
      id: 'wifi',
      href: `/review-menu/${menu.slug}/platform/wifi`,
      icon: '📶',
      label: 'WiFi',
      accent: 'from-cyan-500 to-cyan-600',
    });
  }

  // 3. Promotion
  if (menu.promotionId) {
    satellites.push({
      id: 'promo',
      href: `/review-menu/${menu.slug}/platform/promotion`,
      icon: '🎰',
      label: 'Win Prize',
      accent: 'from-amber-500 to-amber-600',
      isPromo: true,
    });
  }

  // 4. Website
  if (menu.websiteUrl) {
    satellites.push({
      id: 'website',
      href: menu.websiteUrl,
      icon: '🌐',
      label: 'Website',
      accent: 'from-emerald-500 to-teal-500',
      target: '_blank'
    });
  }

  // 5. App Download
  if (menu.appDownloadUrl) {
    satellites.push({
      id: 'app',
      href: menu.appDownloadUrl,
      icon: appStoreIcon,
      label: 'App',
      accent: 'from-fuchsia-500 to-purple-500',
      target: '_blank'
    });
  }

  const renderListLayout = () => (
    <div className="mt-10 grid gap-4">
      {menu.platforms.length === 0 && !menu.wifiSsid && !menu.promotionId && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-300">
          No review platforms are available yet.
        </div>
      )}

      {menu.platforms.map((platform) => {
        const preset = PLATFORM_PRESET_MAP[platform.platformKey as PlatformKey];
        const accent = preset?.accent || 'from-indigo-500 to-indigo-600';
        const icon = platform.icon || preset?.icon || '⭐';
        const description = preset?.description || 'Tap to continue to this platform.';
        const isFruitMachine = platform.platformKey === 'fruitMachine';
        const ctaLabel = isFruitMachine ? 'Launch Promotion' : 'Leave Review';

        return (
          <a
            key={platform.id}
            href={`/review-menu/${menu.slug}/platform/${platform.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-r ${accent} p-[1px] shadow-lg transition-transform hover:-translate-y-1`}
          >
            <div className="flex w-full items-center justify-between rounded-2xl bg-slate-900/90 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl">
                  {icon}
                </div>
                <div>
                  <p className="text-xl font-semibold">{platform.name}</p>
                  <p className="text-sm text-white/80 flex items-center gap-2">
                    {description}
                    {isFruitMachine && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-rose-200">
                        Promo
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm font-semibold uppercase tracking-wide text-white/80">
                {ctaLabel}
                <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>
          </a>
        );
      })}
      
      {/* Render other items (wifi, promo, etc) if not in platforms list - reusing existing logic for list layout fallback */}
      {menu.wifiSsid && (
        <a
          href={`/review-menu/${menu.slug}/platform/wifi`}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-600 p-[1px] shadow-lg transition-transform hover:-translate-y-1"
        >
          <div className="flex w-full items-center justify-between rounded-2xl bg-slate-900/90 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl">
                📶
              </div>
              <div>
                <p className="text-xl font-semibold">WiFi Access</p>
                <p className="text-sm text-white/80">Connect to {menu.wifiSsid}</p>
              </div>
            </div>
            <div className="text-right text-sm font-semibold uppercase tracking-wide text-white/80">
              Connect
              <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </div>
          </div>
        </a>
      )}

      {menu.promotionId && (
        <a
          href={`/review-menu/${menu.slug}/platform/promotion`}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 p-[1px] shadow-lg transition-transform hover:-translate-y-1"
        >
          <div className="flex w-full items-center justify-between rounded-2xl bg-slate-900/90 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl">
                🎰
              </div>
              <div>
                <p className="text-xl font-semibold">Win a Prize!</p>
                <p className="text-sm text-white/80">Try your luck with our promotion</p>
              </div>
            </div>
            <div className="text-right text-sm font-semibold uppercase tracking-wide text-white/80">
              Play
              <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </div>
          </div>
        </a>
      )}

      {menu.websiteUrl && (
        <a
          href={menu.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-[1px] shadow-lg transition-transform hover:-translate-y-1"
        >
          <div className="flex w-full items-center justify-between rounded-2xl bg-slate-900/90 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl">
                🌐
              </div>
              <div>
                <p className="text-xl font-semibold">Visit Our Website</p>
                <p className="text-sm text-white/80">Open {websiteHostname || 'site'}</p>
              </div>
            </div>
            <div className="text-right text-sm font-semibold uppercase tracking-wide text-white/80">
              Visit
              <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </div>
          </div>
        </a>
      )}

      {menu.appDownloadUrl && (
        <a
          href={menu.appDownloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-500 p-[1px] shadow-lg transition-transform hover:-translate-y-1"
        >
          <div className="flex w-full items-center justify-between rounded-2xl bg-slate-900/90 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl">
                {appStoreIcon}
              </div>
              <div>
                <p className="text-xl font-semibold">
                  Install Our App
                </p>
                <p className="text-sm text-white/80">{appStoreLabel}</p>
              </div>
            </div>
            <div className="text-right text-sm font-semibold uppercase tracking-wide text-white/80">
              Install
              <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </div>
          </div>
        </a>
      )}
    </div>
  );

  const renderOrbitLayout = (google: typeof googlePlatform) => {
    if (!google) return null;
    
    const googlePreset = PLATFORM_PRESET_MAP['google'];
    const googleAccent = googlePreset?.accent || 'from-amber-400 to-orange-500';
    
    // Calculate positions
    const count = satellites.length;
    // If no satellites, just center Google
    if (count === 0) {
      return (
        <div className="mt-20 flex justify-center">
          <a
            href={`/review-menu/${menu.slug}/platform/${google.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`group relative flex h-48 w-48 flex-col items-center justify-center rounded-full bg-gradient-to-br ${googleAccent} p-1 shadow-[0_0_50px_rgba(251,191,36,0.3)] transition-transform hover:scale-105 active:scale-95`}
          >
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-slate-900/90 text-center">
              <span className="text-6xl mb-2">⭐</span>
              <span className="font-bold text-xl">Review on<br/>Google</span>
            </div>
          </a>
        </div>
      );
    }

    return (
      <div className="relative mt-10 mx-auto w-full max-w-[340px] aspect-square">
        {/* Center: Google */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <a
            href={`/review-menu/${menu.slug}/platform/${google.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`group relative flex h-40 w-40 flex-col items-center justify-center rounded-full bg-gradient-to-br ${googleAccent} p-1 shadow-[0_0_40px_rgba(251,191,36,0.4)] transition-transform hover:scale-105 active:scale-95 animate-pulse`}
            style={{ animationDuration: '3s' }}
          >
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-slate-900/95 text-center p-2">
              <span className="text-5xl mb-1">⭐</span>
              <span className="font-bold text-lg leading-tight">Review on<br/>Google</span>
            </div>
          </a>
        </div>

        {/* Orbiting Satellites */}
        {satellites.map((item, index) => {
          // Start from top (270deg) or distribute evenly
          // -90 deg to start from top
          const angle = (360 / count) * index - 90;
          const radius = 130; // Distance from center
          
          return (
            <div
              key={item.id}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                transform: `rotate(${angle}deg) translate(${radius}px) rotate(${-angle}deg)`,
              }}
            >
              <a
                href={item.href}
                target={item.target}
                rel={item.target === '_blank' ? "noopener noreferrer" : undefined}
                className={`group flex flex-col items-center justify-center transition-transform hover:scale-110`}
              >
                <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${item.accent} p-[2px] shadow-lg`}>
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900/90 text-2xl">
                    {item.icon}
                  </div>
                </div>
                <span className="mt-2 text-xs font-medium text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap max-w-[100px] overflow-hidden text-ellipsis">
                  {item.label}
                </span>
              </a>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center space-y-4 relative z-20">
          {menu.logoUrl ? (
            <div className="flex justify-center">
              <Image
                src={menu.logoUrl}
                alt={`${menu.businessName} logo`}
                width={64}
                height={64}
                unoptimized
                className="h-16 w-16 rounded-2xl object-cover border border-white/10 shadow-lg"
              />
            </div>
          ) : (
            <div className="mx-auto h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold">
              {menu.businessName.substring(0, 2).toUpperCase()}
            </div>
          )}
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Choose a platform</p>
          <h1 className="text-4xl font-bold tracking-tight">{heroTitle}</h1>
          <p className="text-base text-slate-300">{heroSubtitle}</p>
        </div>

        {googlePlatform ? renderOrbitLayout(googlePlatform) : renderListLayout()}

        <p className="mt-12 text-center text-xs text-slate-500 relative z-20">
          Powered by Signs • Tap to leave your review
        </p>
      </div>
    </div>
  );
}
