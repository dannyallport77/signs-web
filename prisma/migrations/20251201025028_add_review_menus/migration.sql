-- CreateTable
CREATE TABLE "ReviewPlatformMenu" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessAddress" TEXT,
    "placeId" TEXT,
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewPlatformMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewPlatform" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "platformKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReviewPlatformMenu_slug_key" ON "ReviewPlatformMenu"("slug");

-- CreateIndex
CREATE INDEX "ReviewPlatform_menuId_idx" ON "ReviewPlatform"("menuId");

-- AddForeignKey
ALTER TABLE "ReviewPlatform" ADD CONSTRAINT "ReviewPlatform_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "ReviewPlatformMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
