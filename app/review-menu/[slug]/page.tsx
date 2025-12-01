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

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const menu = await prisma.reviewPlatformMenu.findUnique({ where: { slug: params.slug } });

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

export default async function ReviewMenuPage({ params }: { params: { slug: string } }) {
  const menu = await fetchMenu(params.slug);

  if (!menu) {
    notFound();
  }

  const heroTitle = menu.heroTitle || `Leave a review for ${menu.businessName}`;
  const heroSubtitle = menu.heroSubtitle || menu.businessAddress || 'Choose your favourite platform below';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center space-y-4">
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

        <div className="mt-10 grid gap-4">
          {menu.platforms.length === 0 && (
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
        </div>

        <p className="mt-12 text-center text-xs text-slate-500">
          Powered by Signs • Tap to leave your review
        </p>
      </div>
    </div>
  );
}
