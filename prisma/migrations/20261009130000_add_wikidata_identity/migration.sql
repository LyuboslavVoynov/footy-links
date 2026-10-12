ALTER TABLE "Player" ADD COLUMN "wikidataId" TEXT;
ALTER TABLE "Club" ADD COLUMN "wikidataId" TEXT;
ALTER TABLE "PlayerClub" ADD COLUMN "verificationStatus" TEXT NOT NULL DEFAULT 'unverified';

CREATE UNIQUE INDEX "Player_wikidataId_key" ON "Player"("wikidataId");
CREATE UNIQUE INDEX "Club_wikidataId_key" ON "Club"("wikidataId");
