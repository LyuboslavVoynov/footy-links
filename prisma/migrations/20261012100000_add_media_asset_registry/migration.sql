CREATE TABLE "MediaAsset" (
  "id" TEXT NOT NULL,
  "playerId" TEXT,
  "clubId" TEXT,
  "kind" TEXT NOT NULL,
  "assetUrl" TEXT NOT NULL,
  "sourceName" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "license" TEXT,
  "attribution" TEXT,
  "rightsStatus" TEXT NOT NULL DEFAULT 'needs_review',
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MediaAsset_one_owner" CHECK (("playerId" IS NOT NULL AND "clubId" IS NULL) OR ("playerId" IS NULL AND "clubId" IS NOT NULL))
);

CREATE UNIQUE INDEX "MediaAsset_playerId_key" ON "MediaAsset"("playerId");
CREATE UNIQUE INDEX "MediaAsset_clubId_key" ON "MediaAsset"("clubId");
CREATE INDEX "MediaAsset_rightsStatus_idx" ON "MediaAsset"("rightsStatus");
CREATE INDEX "MediaAsset_kind_idx" ON "MediaAsset"("kind");

ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
